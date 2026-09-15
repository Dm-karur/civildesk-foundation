<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectBoqModel;
use App\Services\BoqNotificationService;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectBoqsController extends BaseController
{
    private ProjectBoqModel $boqs;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->boqs = new ProjectBoqModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('project_boqs.company_id', (int) $user->company_id);

            $siteId = (int) ($this->request->getGet('site_id') ?? 0);
            if ($siteId > 0) {
                $builder->where('project_boqs.site_id', $siteId);
            }

            $projectId = (int) ($this->request->getGet('project_id') ?? 0);
            if ($projectId > 0) {
                if ($this->getAccessibleProject($projectId, $user) === null) {
                    return $this->forbidden('You cannot access the selected project.');
                }
                $builder->where('project_boqs.project_id', $projectId);
            } elseif ($siteId <= 0 && ! $this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) {
                    return $this->successList([]);
                }
                $builder->groupStart()
                    ->whereIn('projects.branch_id', $branchIds)
                    ->orWhere('projects.branch_id', null)
                    ->groupEnd();
            }

            $statusId = (int) ($this->request->getGet('status_id') ?? 0);
            if ($statusId > 0) {
                $builder->where('project_boqs.status_id', $statusId);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('project_boqs.boq_code', $search)
                    ->orLike('project_boqs.boq_name', $search)
                    ->orLike('project_sites.site_code', $search)
                    ->orLike('project_sites.site_name', $search)
                    ->orLike('clients.client_code', $search)
                    ->orLike('clients.client_name', $search)
                    ->orLike('projects.project_code', $search)
                    ->orLike('projects.project_name', $search)
                    ->groupEnd();
            }

            return $this->successList(
                $builder->orderBy('project_boqs.boq_date', 'DESC')
                    ->orderBy('project_boqs.id', 'DESC')
                    ->findAll()
            );
        } catch (Throwable $exception) {
            return $this->serverError('Project BOQ list retrieval failed.', $exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $boq = $this->baseQuery()
                ->where('project_boqs.company_id', (int) $user->company_id)
                ->find($id);

            if ($boq === null || ! $this->canAccessBoq($boq, $user)) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project BOQ retrieved successfully.',
                'data' => ['project_boq' => $boq],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project BOQ retrieval failed.', $exception);
        }
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $draftStatus = $this->getStatusByCode('DRAFT');
        if ($draftStatus === null) {
            return $this->configurationError('The active DRAFT BOQ status is not configured.');
        }

        $data = $this->writableData($input);
        $data['company_id'] = (int) $user->company_id;
        $data['status_id'] = (int) $draftStatus['id'];
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'version_no' => 1,
            'revision_no' => 0,
            'valid_from' => null,
            'currency_code' => 'INR',
            'total_amount' => 0,
            'notes' => null,
        ];

        $siteId = (int) ($input['site_id'] ?? $data['site_id'] ?? 0);
        $site = null;
        if ($siteId > 0) {
            $site = db_connect()->table('project_sites')
                ->select('id, project_id, site_code, site_name')
                ->where('id', $siteId)
                ->where('company_id', (int) $user->company_id)
                ->where('deleted_at', null)
                ->get()->getRowArray();
            if ($site === null) {
                return $this->invalid(['site_id' => 'Select a valid site.']);
            }
            $data['site_id'] = $siteId;
            $data['project_id'] = (int) $site['project_id'];
        }

        if (empty($data['boq_code'])) {
            $sitePrefix = $site ? preg_replace('/[^A-Za-z0-9]/', '', $site['site_code']) : 'SITE';
            $count = $this->boqs->where('company_id', (int) $user->company_id)->countAllResults() + 1;
            $data['boq_code'] = 'BOQ-' . $sitePrefix . '-' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);
        }

        if (empty($data['boq_date'])) {
            $data['boq_date'] = date('Y-m-d');
        }

        if ($this->getAccessibleProject((int) ($data['project_id'] ?? 0), $user, true) === null) {
            return $this->invalid([
                'project_id' => 'Select a site or project you are permitted to operate.',
            ]);
        }

        if ($this->duplicateExists($data)) {
            return $this->duplicateValidation();
        }

        $db = db_connect();
        try {
            $db->transBegin();

            if (! $this->boqs->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->boqs->errors());
            }

            if ($db->transStatus() === false) {
                throw new DatabaseException('Unable to create the project BOQ.');
            }

            $id = (int) $this->boqs->getInsertID();
            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Project BOQ created successfully.',
                    'data' => ['project_boq' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Project BOQ creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->boqs
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null || ! $this->canAccessBoq($existing, $user, true)) {
            return $this->notFound();
        }

        if (! $this->hasStatusCode($existing, 'DRAFT')) {
            return $this->conflict('Only a draft Project BOQ can be updated.');
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['project_id']);
        if ($data === []) {
            return $this->invalid(['body' => 'No writable Project BOQ fields were supplied.']);
        }
        $data['updated_by'] = (int) $user->id;

        $merged = array_merge($existing, $data);
        if ($this->duplicateExists($merged, $id)) {
            return $this->duplicateValidation();
        }

        $db = db_connect();
        try {
            $db->transBegin();

            if (! $this->boqs->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->boqs->errors());
            }

            if ($db->transStatus() === false) {
                throw new DatabaseException('Unable to update the project BOQ.');
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project BOQ updated successfully.',
                'data' => ['project_boq' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Project BOQ update failed.', $exception);
        }
    }

    public function submit(int $id): ResponseInterface
    {
        return $this->transition($id, 'DRAFT', 'UNDER_REVIEW', 'submitted');
    }

    public function approve(int $id): ResponseInterface
    {
        return $this->transition($id, 'UNDER_REVIEW', 'APPROVED', 'approved');
    }

    public function reject(int $id): ResponseInterface
    {
        return $this->transition($id, 'UNDER_REVIEW', 'REJECTED', 'rejected');
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->boqs
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null || ! $this->canAccessBoq($existing, $user, true)) {
            return $this->notFound();
        }

        if (! $this->hasStatusCode($existing, 'DRAFT')) {
            return $this->conflict('Only a draft Project BOQ can be deleted.');
        }

        $db = db_connect();
        try {
            $db->transBegin();
            if (! $this->boqs->update($id, ['updated_by' => (int) $user->id])) {
                $db->transRollback();
                return $this->invalid($this->boqs->errors());
            }
            if (! $this->boqs->delete($id) || $db->transStatus() === false) {
                throw new DatabaseException('Unable to delete the project BOQ.');
            }
            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project BOQ deleted successfully.',
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Project BOQ deletion failed.', $exception);
        }
    }

    private function transition(
        int $id,
        string $requiredStatusCode,
        string $targetStatusCode,
        string $action
    ): ResponseInterface {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $targetStatus = $this->getStatusByCode($targetStatusCode);
        if ($targetStatus === null) {
            return $this->configurationError(
                'The active ' . $targetStatusCode . ' BOQ status is not configured.'
            );
        }

        $db = db_connect();
        try {
            $db->transBegin();

            $boq = $db->query(
                'SELECT pb.id, pb.company_id, pb.project_id, pb.status_id, pb.boq_code,
                        pb.boq_name, pb.submitted_by, p.branch_id, p.project_name,
                        status_master.status_code
                 FROM project_boqs pb
                 INNER JOIN projects p
                    ON p.id = pb.project_id AND p.company_id = pb.company_id
                 INNER JOIN project_boqs_status_masters status_master
                    ON status_master.id = pb.status_id
                 WHERE pb.id = ? AND pb.company_id = ?
                   AND pb.deleted_at IS NULL AND p.deleted_at IS NULL
                 FOR UPDATE',
                [$id, (int) $user->company_id]
            )->getRowArray();

            if ($boq === null || ! $this->canAccessBoq($boq, $user, true)) {
                $db->transRollback();
                return $this->notFound();
            }

            if ((string) $boq['status_code'] !== $requiredStatusCode) {
                $db->transRollback();
                return $this->conflict(
                    sprintf(
                        'Only a %s Project BOQ can be %s.',
                        strtolower(str_replace('_', ' ', $requiredStatusCode)),
                        $action
                    )
                );
            }

            $now = date('Y-m-d H:i:s');
            $update = [
                'status_id' => (int) $targetStatus['id'],
                'updated_by' => (int) $user->id,
            ];

            if ($action === 'submitted') {
                $update['submitted_by'] = (int) $user->id;
                $update['submitted_at'] = $now;
                $update['approved_by'] = null;
                $update['approved_at'] = null;
            } elseif ($action === 'approved') {
                $update['approved_by'] = (int) $user->id;
                $update['approved_at'] = $now;
            } else {
                $update['approved_by'] = null;
                $update['approved_at'] = null;
            }

            $updated = $db->table('project_boqs')
                ->where('id', $id)
                ->where('company_id', (int) $user->company_id)
                ->where('status_id', (int) $boq['status_id'])
                ->update($update);

            if (! $updated || $db->affectedRows() !== 1 || $db->transStatus() === false) {
                throw new DatabaseException('Unable to change the Project BOQ status.');
            }

            $db->transCommit();

            try {
                (new BoqNotificationService())->notify(
                    array_merge($boq, $update),
                    match ($action) {
                        'submitted' => 'BOQ_SUBMITTED',
                        'approved' => 'BOQ_APPROVED',
                        default => 'BOQ_REJECTED',
                    },
                    (int) $user->id
                );
            } catch (Throwable $notificationException) {
                log_message(
                    'error',
                    'BOQ {action} completed, but notification processing failed: {error}',
                    ['action' => $action, 'error' => $notificationException->getMessage()]
                );
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project BOQ ' . $action . ' successfully.',
                'data' => ['project_boq' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Project BOQ status change failed.', $exception);
        }
    }

    private function baseQuery(): ProjectBoqModel
    {
        return $this->boqs
            ->select([
                'project_boqs.*',
                'projects.branch_id',
                'projects.project_code',
                'projects.project_name',
                'project_sites.site_code',
                'project_sites.site_name',
                'clients.id AS client_id',
                'clients.client_code',
                'clients.client_name',
                'status_master.status_code',
                'status_master.status_name',
                'submitter.employee_code AS submitted_by_employee_code',
                'submitter.first_name AS submitted_by_first_name',
                'submitter.last_name AS submitted_by_last_name',
                'approver.employee_code AS approved_by_employee_code',
                'approver.first_name AS approved_by_first_name',
                'approver.last_name AS approved_by_last_name',
                '(SELECT COUNT(bi.id) FROM boq_items bi WHERE bi.boq_id = project_boqs.id AND bi.deleted_at IS NULL) AS item_count',
                '(SELECT COUNT(bs.id) FROM boq_sections bs WHERE bs.boq_id = project_boqs.id AND bs.deleted_at IS NULL) AS section_count',
                '(SELECT COALESCE(SUM(bi.executed_quantity * bi.rate), 0) FROM boq_items bi WHERE bi.boq_id = project_boqs.id AND bi.deleted_at IS NULL) AS executed_amount',
            ])
            ->join(
                'projects',
                'projects.id = project_boqs.project_id AND projects.company_id = project_boqs.company_id'
            )
            ->join(
                'project_sites',
                'project_sites.id = project_boqs.site_id AND project_sites.deleted_at IS NULL',
                'left'
            )
            ->join(
                'clients',
                'clients.id = projects.client_id AND clients.deleted_at IS NULL',
                'left'
            )
            ->join(
                'project_boqs_status_masters status_master',
                'status_master.id = project_boqs.status_id'
            )
            ->join('users submitter', 'submitter.id = project_boqs.submitted_by', 'left')
            ->join('users approver', 'approver.id = project_boqs.approved_by', 'left')
            ->where('projects.deleted_at', null);
    }

    private function writableData(array $input): array
    {
        $fields = [
            'site_id', 'project_id', 'boq_code', 'boq_name', 'version_no', 'revision_no',
            'boq_date', 'valid_from', 'currency_code', 'total_amount', 'notes',
        ];

        return array_intersect_key($input, array_flip($fields));
    }

    private function getAccessibleProject(
        int $projectId,
        object $user,
        bool $operate = false
    ): ?array {
        if ($projectId <= 0) {
            return null;
        }

        $project = db_connect()->table('projects')
            ->select('id, company_id, branch_id')
            ->where('id', $projectId)
            ->where('company_id', (int) $user->company_id)
            ->where('deleted_at', null)
            ->get()
            ->getRowArray();

        if ($project === null) {
            return null;
        }

        $branchId = (int) ($project['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch(
            $branchId,
            $operate ? 'OPERATE' : 'VIEW',
            $user
        )) {
            return null;
        }

        return $project;
    }

    private function canAccessBoq(array $boq, object $user, bool $operate = false): bool
    {
        return (int) $boq['company_id'] === (int) $user->company_id
            && $this->getAccessibleProject((int) $boq['project_id'], $user, $operate) !== null;
    }

    private function getStatusByCode(string $code): ?array
    {
        return db_connect()->table('project_boqs_status_masters')
            ->select('id, status_code, status_name')
            ->where('status_code', $code)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();
    }

    private function hasStatusCode(array $boq, string $code): bool
    {
        return db_connect()->table('project_boqs_status_masters')
            ->where('id', (int) $boq['status_id'])
            ->where('status_code', $code)
            ->where('is_active', 1)
            ->countAllResults() === 1;
    }

    private function duplicateExists(array $data, ?int $excludeId = null): bool
    {
        if (
            (int) ($data['company_id'] ?? 0) <= 0
            || trim((string) ($data['boq_code'] ?? '')) === ''
        ) {
            return false;
        }

        $builder = $this->boqs
            ->where('company_id', (int) $data['company_id'])
            ->where('boq_code', strtoupper(trim((string) $data['boq_code'])))
            ->where('version_no', (int) ($data['version_no'] ?? 1))
            ->where('revision_no', (int) ($data['revision_no'] ?? 0));

        if (!empty($data['site_id'])) {
            $builder->where('site_id', (int) $data['site_id']);
        } elseif (!empty($data['project_id'])) {
            $builder->where('project_id', (int) $data['project_id']);
        }

        if ($excludeId !== null) {
            $builder->where('id !=', $excludeId);
        }

        return $builder->countAllResults() > 0;
    }

    private function successList(array $boqs): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'message' => 'Project BOQs retrieved successfully.',
            'data' => ['project_boqs' => $boqs],
        ]);
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON(['success' => false, 'message' => 'Authentication required.']);
    }

    private function forbidden(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_FORBIDDEN)
            ->setJSON(['success' => false, 'message' => $message]);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Project BOQ not found.']);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    public function dashboard(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $siteId = (int) ($this->request->getGet('site_id') ?? 0);
            $db = db_connect();

            $builder = $db->table('project_boqs pb')
                ->where('pb.company_id', (int) $user->company_id)
                ->where('pb.deleted_at', null);

            if ($siteId > 0) {
                $builder->where('pb.site_id', $siteId);
            }

            $boqs = $builder->select('pb.id, pb.total_amount, pb.status_id')->get()->getResultArray();
            $totalBoqValue = 0.0;
            $boqIds = array_column($boqs, 'id');

            foreach ($boqs as $b) {
                $totalBoqValue += (float) ($b['total_amount'] ?? 0);
            }

            $executedValue = 0.0;
            $totalItems = 0;
            if (! empty($boqIds)) {
                $itemStats = $db->table('boq_items')
                    ->select('COUNT(id) as total_count, COALESCE(SUM(executed_quantity * rate), 0) as executed_sum')
                    ->whereIn('boq_id', $boqIds)
                    ->where('deleted_at', null)
                    ->get()->getRowArray();
                $totalItems = (int) ($itemStats['total_count'] ?? 0);
                $executedValue = (float) ($itemStats['executed_sum'] ?? 0);
            }

            $balanceValue = max(0.0, $totalBoqValue - $executedValue);
            $overallProgress = $totalBoqValue > 0 ? round(($executedValue / $totalBoqValue) * 100, 1) : 0.0;

            // Section progress breakdown
            $sectionProgress = [];
            if (! empty($boqIds)) {
                $sections = $db->table('boq_sections bs')
                    ->select('bs.section_name, COUNT(bi.id) as item_count, COALESCE(SUM(bi.amount), 0) as total_amount, COALESCE(SUM(bi.executed_quantity * bi.rate), 0) as executed_amount')
                    ->join('boq_items bi', 'bi.section_id = bs.id AND bi.deleted_at IS NULL', 'left')
                    ->whereIn('bs.boq_id', $boqIds)
                    ->where('bs.deleted_at', null)
                    ->groupBy('bs.section_name')
                    ->orderBy('total_amount', 'DESC')
                    ->limit(10)
                    ->get()->getResultArray();

                foreach ($sections as $s) {
                    $sTotal = (float) ($s['total_amount'] ?? 0);
                    $sExec = (float) ($s['executed_amount'] ?? 0);
                    $sPct = $sTotal > 0 ? min(100.0, round(($sExec / $sTotal) * 100, 1)) : 0.0;
                    $sectionProgress[] = [
                        'section_name' => $s['section_name'],
                        'item_count' => (int) ($s['item_count'] ?? 0),
                        'total_amount' => $sTotal,
                        'executed_amount' => $sExec,
                        'progress_percentage' => $sPct,
                    ];
                }
            }

            return $this->response->setJSON([
                'success' => true,
                'data' => [
                    'total_boq_value' => $totalBoqValue,
                    'executed_value' => $executedValue,
                    'balance_value' => $balanceValue,
                    'overall_progress' => $overallProgress,
                    'total_items' => $totalItems,
                    'section_progress' => $sectionProgress,
                ],
            ]);
        } catch (Throwable $e) {
            return $this->serverError('Dashboard retrieval failed.', $e);
        }
    }

    public function importItems(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->baseQuery()->find($boqId);
        if ($boq === null || ! $this->canAccessBoq($boq, $user, true)) {
            return $this->notFound();
        }
        if ((string) ($boq['status_code'] ?? '') !== 'DRAFT') {
            return $this->conflict('Items can only be imported into a draft BOQ.');
        }

        $input = $this->request->getJSON(true);
        $items = $input['items'] ?? [];
        if (! is_array($items) || empty($items)) {
            return $this->invalid(['items' => 'An array of items is required.']);
        }

        $db = db_connect();
        $companyId = (int) $user->company_id;
        $projectId = (int) $boq['project_id'];
        $siteId = (int) ($boq['site_id'] ?? 0);

        // Get or create sections mapping
        $existingSections = $db->table('boq_sections')
            ->where('boq_id', $boqId)->where('deleted_at', null)->get()->getResultArray();
        $sectionMap = [];
        foreach ($existingSections as $sec) {
            $sectionMap[strtoupper(trim($sec['section_name']))] = (int) $sec['id'];
            $sectionMap[strtoupper(trim($sec['section_code']))] = (int) $sec['id'];
        }

        // Default UOM and Work Category
        $defaultUom = $db->table('units_of_measurement')
            ->where('company_id', $companyId)->where('deleted_at', null)->get()->getRowArray();
        $defaultUomId = (int) ($defaultUom['id'] ?? 1);

        $defaultCat = $db->table('work_categories')
            ->where('company_id', $companyId)->where('deleted_at', null)->get()->getRowArray();
        $defaultCatId = (int) ($defaultCat['id'] ?? 1);

        // Map all UOMs by code/name
        $uomRows = $db->table('units_of_measurement')
            ->where('company_id', $companyId)->where('deleted_at', null)->get()->getResultArray();
        $uomMap = [];
        foreach ($uomRows as $u) {
            $uomMap[strtoupper(trim($u['unit_code']))] = (int) $u['id'];
            $uomMap[strtoupper(trim($u['unit_symbol'] ?? ''))] = (int) $u['id'];
            $uomMap[strtoupper(trim($u['unit_name']))] = (int) $u['id'];
        }

        $insertedCount = 0;
        $db->transBegin();
        try {
            $sectionOrder = count($existingSections);
            $itemOrder = (int) ($db->table('boq_items')->where('boq_id', $boqId)->countAllResults());

            foreach ($items as $idx => $row) {
                $sectionName = trim((string) ($row['section_name'] ?? $row['section'] ?? 'General Works'));
                if ($sectionName === '') {
                    $sectionName = 'General Works';
                }
                $secKey = strtoupper($sectionName);

                if (! isset($sectionMap[$secKey])) {
                    $sectionOrder++;
                    $secCode = 'SEC-' . str_pad((string) $sectionOrder, 2, '0', STR_PAD_LEFT);
                    $db->table('boq_sections')->insert([
                        'company_id' => $companyId,
                        'project_id' => $projectId,
                        'boq_id' => $boqId,
                        'section_code' => $secCode,
                        'section_name' => $sectionName,
                        'display_order' => $sectionOrder,
                        'created_by' => (int) $user->id,
                        'updated_by' => (int) $user->id,
                    ]);
                    $newSecId = (int) $db->insertID();
                    $sectionMap[$secKey] = $newSecId;
                }
                $sectionId = $sectionMap[$secKey];

                $itemCode = trim((string) ($row['item_no'] ?? $row['item_code'] ?? ''));
                if ($itemCode === '') {
                    $itemCode = ($itemOrder + 1) . '.01';
                }
                $itemName = trim((string) ($row['description'] ?? $row['item_name'] ?? ''));
                if ($itemName === '') {
                    continue; // Skip empty row
                }

                $unitStr = strtoupper(trim((string) ($row['unit'] ?? $row['uom'] ?? '')));
                $uomId = $uomMap[$unitStr] ?? $defaultUomId;

                $quantity = (float) ($row['quantity'] ?? $row['boq_qty'] ?? 0);
                $rate = (float) ($row['rate'] ?? 0);
                $amount = round($quantity * $rate, 2);
                $itemOrder++;

                $db->table('boq_items')->insert([
                    'company_id' => $companyId,
                    'project_id' => $projectId,
                    'site_id' => $siteId > 0 ? $siteId : null,
                    'boq_id' => $boqId,
                    'section_id' => $sectionId,
                    'work_category_id' => $defaultCatId,
                    'uom_id' => $uomId,
                    'item_code' => $itemCode,
                    'item_name' => $itemName,
                    'specification' => trim((string) ($row['specification'] ?? $row['notes'] ?? '')),
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'amount' => $amount,
                    'executed_quantity' => 0,
                    'balance_quantity' => $quantity,
                    'execution_progress' => 0,
                    'display_order' => $itemOrder,
                    'created_by' => (int) $user->id,
                    'updated_by' => (int) $user->id,
                ]);
                $insertedCount++;
            }

            // Recalculate section & boq totals
            $this->recalculateBoqTotals($boqId);

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => "Successfully imported {$insertedCount} BOQ items.",
                'data' => [
                    'imported_count' => $insertedCount,
                    'project_boq' => $this->baseQuery()->find($boqId),
                ],
            ]);
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->serverError('Bulk import failed.', $e);
        }
    }

    public function batchUpdateItems(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->baseQuery()->find($boqId);
        if ($boq === null || ! $this->canAccessBoq($boq, $user, true)) {
            return $this->notFound();
        }
        if ((string) ($boq['status_code'] ?? '') !== 'DRAFT') {
            return $this->conflict('Items can only be edited in a draft BOQ.');
        }

        $input = $this->request->getJSON(true);
        $items = $input['items'] ?? [];
        if (! is_array($items) || empty($items)) {
            return $this->invalid(['items' => 'An array of items is required.']);
        }

        $db = db_connect();
        $db->transBegin();
        try {
            foreach ($items as $itm) {
                $id = (int) ($itm['id'] ?? 0);
                if ($id <= 0) continue;

                $update = [];
                if (isset($itm['item_name'])) $update['item_name'] = trim((string) $itm['item_name']);
                if (isset($itm['quantity'])) $update['quantity'] = max(0.0, (float) $itm['quantity']);
                if (isset($itm['rate'])) $update['rate'] = max(0.0, (float) $itm['rate']);
                if (isset($itm['specification'])) $update['specification'] = trim((string) $itm['specification']);
                if (isset($itm['item_code'])) $update['item_code'] = strtoupper(trim((string) $itm['item_code']));

                if (isset($update['quantity']) || isset($update['rate'])) {
                    $cur = $db->table('boq_items')->where('id', $id)->get()->getRowArray();
                    $q = isset($update['quantity']) ? (float) $update['quantity'] : (float) ($cur['quantity'] ?? 0);
                    $r = isset($update['rate']) ? (float) $update['rate'] : (float) ($cur['rate'] ?? 0);
                    $update['amount'] = round($q * $r, 2);
                    $exec = (float) ($cur['executed_quantity'] ?? 0);
                    $update['balance_quantity'] = max(0.0, $q - $exec);
                    $update['execution_progress'] = $q > 0 ? round(($exec / $q) * 100, 2) : 0.0;
                }

                $update['updated_by'] = (int) $user->id;
                $db->table('boq_items')->where('id', $id)->where('boq_id', $boqId)->update($update);
            }

            $this->recalculateBoqTotals($boqId);
            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ items updated successfully.',
                'data' => ['project_boq' => $this->baseQuery()->find($boqId)],
            ]);
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->serverError('Failed to batch update BOQ items.', $e);
        }
    }

    public function revisions(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $revisions = db_connect()->table('boq_revisions')
            ->where('boq_id', $boqId)
            ->where('deleted_at', null)
            ->orderBy('revision_number', 'DESC')
            ->get()->getResultArray();

        return $this->response->setJSON([
            'success' => true,
            'data' => ['revisions' => $revisions],
        ]);
    }

    public function createRevision(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->baseQuery()->find($boqId);
        if ($boq === null || ! $this->canAccessBoq($boq, $user, true)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($input['reason'] ?? ''));
        if ($reason === '') {
            return $this->invalid(['reason' => 'Revision reason is required.']);
        }

        $db = db_connect();
        $currentRev = (int) ($boq['revision_no'] ?? 0);
        $nextRev = $currentRev + 1;
        $revCode = "{$boq['boq_code']}-REV-{$nextRev}";

        $oldAmount = (float) ($boq['total_amount'] ?? 0);
        $draftStatus = $this->getStatusByCode('DRAFT');

        $db->transBegin();
        try {
            $db->table('boq_revisions')->insert([
                'company_id' => (int) $user->company_id,
                'site_id' => (int) ($boq['site_id'] ?? 0),
                'boq_id' => $boqId,
                'revision_number' => $nextRev,
                'revision_code' => $revCode,
                'reason' => $reason,
                'old_amount' => $oldAmount,
                'new_amount' => $oldAmount,
                'variation_amount' => 0.0,
                'changes_summary' => trim((string) ($input['changes_summary'] ?? "Created Revision {$nextRev}")),
                'status' => 'DRAFT',
                'created_by' => (int) $user->id,
                'updated_by' => (int) $user->id,
            ]);

            // Put BOQ back into DRAFT with incremented revision_no
            $db->table('project_boqs')->where('id', $boqId)->update([
                'revision_no' => $nextRev,
                'status_id' => (int) ($draftStatus['id'] ?? 1),
                'updated_by' => (int) $user->id,
            ]);

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => "Revision {$nextRev} created successfully. BOQ is now open for updates.",
                'data' => ['project_boq' => $this->baseQuery()->find($boqId)],
            ]);
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->serverError('Failed to create revision.', $e);
        }
    }

    public function variations(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $variations = db_connect()->table('boq_variations')
            ->where('boq_id', $boqId)
            ->where('deleted_at', null)
            ->orderBy('id', 'DESC')
            ->get()->getResultArray();

        return $this->response->setJSON([
            'success' => true,
            'data' => ['variations' => $variations],
        ]);
    }

    public function createVariation(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->baseQuery()->find($boqId);
        if ($boq === null || ! $this->canAccessBoq($boq, $user, true)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($input['variation_title'] ?? ''));
        if ($title === '') {
            return $this->invalid(['variation_title' => 'Variation title is required.']);
        }

        $db = db_connect();
        $count = $db->table('boq_variations')->where('boq_id', $boqId)->countAllResults() + 1;
        $varCode = 'VAR-' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);

        $origQty = (float) ($input['original_quantity'] ?? 0);
        $varQty = (float) ($input['variation_quantity'] ?? 0);
        $revQty = $origQty + $varQty;
        $rate = (float) ($input['unit_rate'] ?? 0);
        $origAmt = round($origQty * $rate, 2);
        $varAmt = round($varQty * $rate, 2);
        $revAmt = round($revQty * $rate, 2);

        $data = [
            'company_id' => (int) $user->company_id,
            'site_id' => (int) ($boq['site_id'] ?? 0),
            'boq_id' => $boqId,
            'boq_item_id' => ! empty($input['boq_item_id']) ? (int) $input['boq_item_id'] : null,
            'variation_code' => $varCode,
            'variation_title' => $title,
            'variation_type' => trim((string) ($input['variation_type'] ?? 'ADDITION')),
            'original_quantity' => $origQty,
            'variation_quantity' => $varQty,
            'revised_quantity' => $revQty,
            'unit_rate' => $rate,
            'original_amount' => $origAmt,
            'variation_amount' => $varAmt,
            'revised_amount' => $revAmt,
            'reason' => trim((string) ($input['reason'] ?? '')),
            'requested_by' => trim((string) ($input['requested_by'] ?? ($user->first_name . ' ' . $user->last_name))),
            'variation_date' => ! empty($input['variation_date']) ? $input['variation_date'] : date('Y-m-d'),
            'status' => 'APPROVED',
            'remarks' => trim((string) ($input['remarks'] ?? '')),
            'approved_by' => (int) $user->id,
            'approved_at' => date('Y-m-d H:i:s'),
            'created_by' => (int) $user->id,
            'updated_by' => (int) $user->id,
        ];

        $db->table('boq_variations')->insert($data);

        // If linked to a boq_item, update item quantity and recalculate
        if (! empty($data['boq_item_id'])) {
            $itemId = (int) $data['boq_item_id'];
            $itm = $db->table('boq_items')->where('id', $itemId)->where('boq_id', $boqId)->get()->getRowArray();
            if ($itm) {
                $newQ = $revQty;
                $newA = round($newQ * (float) ($itm['rate'] ?? 0), 2);
                $exec = (float) ($itm['executed_quantity'] ?? 0);
                $bal = max(0.0, $newQ - $exec);
                $pct = $newQ > 0 ? round(($exec / $newQ) * 100, 2) : 0.0;
                $db->table('boq_items')->where('id', $itemId)->update([
                    'quantity' => $newQ,
                    'amount' => $newA,
                    'balance_quantity' => $bal,
                    'execution_progress' => $pct,
                    'updated_by' => (int) $user->id,
                ]);
                $this->recalculateBoqTotals($boqId);
            }
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Variation order recorded successfully.',
            'data' => [
                'variation' => $data,
                'project_boq' => $this->baseQuery()->find($boqId),
            ],
        ]);
    }

    private function recalculateBoqTotals(int $boqId): void
    {
        $db = db_connect();
        $sections = $db->table('boq_sections')->select('id, parent_section_id')
            ->where('boq_id', $boqId)->where('deleted_at', null)->get()->getResultArray();
        $direct = [];
        foreach ($sections as $section) {
            $row = $db->table('boq_items')->selectSum('amount')->where('boq_id', $boqId)
                ->where('section_id', (int) $section['id'])->where('deleted_at', null)->get()->getRowArray();
            $direct[(int) $section['id']] = (float) ($row['amount'] ?? 0);
        }
        $children = [];
        $parents = [];
        foreach ($sections as $section) {
            $id = (int) $section['id'];
            $parent = (int) ($section['parent_section_id'] ?? 0);
            $parents[$id] = $parent;
            if ($parent > 0) {
                $children[$parent][] = $id;
            }
        }
        $memo = [];
        $sum = function (int $id) use (&$sum, &$memo, $direct, $children): float {
            if (isset($memo[$id])) {
                return $memo[$id];
            }
            $total = $direct[$id] ?? 0.0;
            foreach ($children[$id] ?? [] as $childId) {
                $total += $sum($childId);
            }
            return $memo[$id] = round($total, 2);
        };
        foreach (array_keys($parents) as $id) {
            $db->table('boq_sections')->where('id', $id)->update(['section_amount' => $sum($id)]);
        }
        $boqTotal = 0.0;
        foreach ($parents as $id => $parent) {
            if ($parent === 0) {
                $boqTotal += $sum($id);
            }
        }
        $db->table('project_boqs')->where('id', $boqId)->update(['total_amount' => round($boqTotal, 2)]);
    }
}

