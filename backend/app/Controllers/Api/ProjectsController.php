<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectsController extends BaseController
{
    private ProjectModel $projects;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->projects = new ProjectModel();
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
                ->where('projects.company_id', (int) $user->company_id);

            $branchId = (int) ($this->request->getGet('branch_id') ?? 0);
            if ($branchId > 0) {
                if (! $this->authorization->canAccessBranch($branchId, 'VIEW', $user)) {
                    return $this->forbidden('You cannot access the selected branch.');
                }
                $builder->where('projects.branch_id', $branchId);
            } elseif (! $this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) {
                    return $this->successList([]);
                }
                $builder->groupStart()
                    ->whereIn('projects.branch_id', $branchIds)
                    ->orWhere('projects.branch_id', null)
                    ->groupEnd();
            }

            foreach (['client_id', 'project_type_id', 'financial_year_id', 'project_status_id', 'priority_id'] as $filter) {
                $value = (int) ($this->request->getGet($filter) ?? 0);
                if ($value > 0) {
                    $builder->where('projects.' . $filter, $value);
                }
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('projects.project_code', $search)
                    ->orLike('projects.project_name', $search)
                    ->orLike('projects.client_reference_no', $search)
                    ->orLike('projects.work_order_no', $search)
                    ->orLike('clients.client_name', $search)
                    ->groupEnd();
            }

            return $this->successList(
                $builder->orderBy('projects.project_name', 'ASC')->findAll()
            );
        } catch (Throwable $exception) {
            return $this->serverError('Project list retrieval failed.', $exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $project = $this->baseQuery()
                ->where('projects.company_id', (int) $user->company_id)
                ->find($id);

            if ($project === null || ! $this->canAccessProject($project, $user)) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project retrieved successfully.',
                'data' => ['project' => $project],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project retrieval failed.', $exception);
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

        $data = $this->writableData($input, true);
        $data['company_id'] = (int) $user->company_id;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'branch_id' => null,
            'financial_year_id' => null,
            'contract_value' => 0,
            'approved_budget' => 0,
            'retention_percentage' => 0,
            'tax_percentage' => 0,
            'currency_code' => 'INR',
            'project_manager_id' => null,
            'site_engineer_id' => null,
            'progress_percentage' => 0,
        ];

        $validation = $this->validateReferences($data, $user);
        if ($validation !== null) {
            return $validation;
        }

        $dateErrors = $this->validateDates($data);
        if ($dateErrors !== []) {
            return $this->invalid($dateErrors);
        }

        try {
            $db = db_connect();
            $db->transBegin();

            if (! $this->projects->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->projects->errors());
            }

            $id = (int) $this->projects->getInsertID();
            $db->table('project_status_logs')->insert([
                'company_id' => (int) $user->company_id,
                'project_id' => $id,
                'from_status_id' => null,
                'to_status_id' => (int) $data['project_status_id'],
                'change_reason' => 'Project created.',
                'changed_by' => (int) $user->id,
            ]);

            if ($db->transStatus() === false) {
                $db->transRollback();
                throw new DatabaseException('Unable to create the initial project status history.');
            }

            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Project created successfully.',
                    'data' => ['project' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Project creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->projects
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null || ! $this->canAccessProject($existing, $user)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input, false);
        unset($data['company_id'], $data['created_by'], $data['project_status_id']);
        $data['updated_by'] = (int) $user->id;
        $merged = array_merge($existing, $data);

        $validation = $this->validateReferences($merged, $user);
        if ($validation !== null) {
            return $validation;
        }

        $dateErrors = $this->validateDates($merged);
        if ($dateErrors !== []) {
            return $this->invalid($dateErrors);
        }

        try {
            if (! $this->projects->update($id, $data)) {
                return $this->invalid($this->projects->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project updated successfully.',
                'data' => ['project' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Project update failed.', $exception);
        }
    }

    public function statusHistory(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $project = $this->projects
                ->where('company_id', (int) $user->company_id)
                ->find($id);
            if ($project === null || ! $this->canAccessProject($project, $user)) {
                return $this->notFound();
            }

            $history = db_connect()->table('project_status_logs logs')
                ->select([
                    'logs.id',
                    'logs.company_id',
                    'logs.project_id',
                    'logs.from_status_id',
                    'from_status.status_code AS from_status_code',
                    'from_status.status_name AS from_status_name',
                    'logs.to_status_id',
                    'to_status.status_code AS to_status_code',
                    'to_status.status_name AS to_status_name',
                    'logs.change_reason',
                    'logs.changed_by',
                    'users.employee_code AS changed_by_employee_code',
                    'users.first_name AS changed_by_first_name',
                    'users.last_name AS changed_by_last_name',
                    'logs.changed_at',
                ])
                ->join(
                    'project_statuses from_status',
                    'from_status.id = logs.from_status_id',
                    'left'
                )
                ->join(
                    'project_statuses to_status',
                    'to_status.id = logs.to_status_id'
                )
                ->join('users', 'users.id = logs.changed_by', 'left')
                ->where('logs.company_id', (int) $user->company_id)
                ->where('logs.project_id', $id)
                ->orderBy('logs.changed_at', 'DESC')
                ->orderBy('logs.id', 'DESC')
                ->get()
                ->getResultArray();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project status history retrieved successfully.',
                'data' => ['status_history' => $history],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project status history retrieval failed.', $exception);
        }
    }

    public function changeStatus(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $toStatusId = (int) ($input['project_status_id'] ?? 0);
        $changeReason = trim((string) ($input['change_reason'] ?? ''));
        $errors = [];

        if ($toStatusId <= 0) {
            $errors['project_status_id'] = 'Select a valid active project status.';
        }
        if ($changeReason === '') {
            $errors['change_reason'] = 'Change reason is required.';
        } elseif (mb_strlen($changeReason) > 500) {
            $errors['change_reason'] = 'Change reason cannot exceed 500 characters.';
        }
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        $db = db_connect();

        try {
            $db->transBegin();

            $project = $db->query(
                'SELECT id, company_id, branch_id, project_status_id
                 FROM projects
                 WHERE id = ? AND company_id = ? AND deleted_at IS NULL
                 FOR UPDATE',
                [$id, (int) $user->company_id]
            )->getRowArray();

            if ($project === null || ! $this->canAccessProject($project, $user)) {
                $db->transRollback();
                return $this->notFound();
            }

            $currentStatus = $db->table('project_statuses')
                ->select('id, status_code, status_name, is_final, is_active')
                ->where('id', (int) $project['project_status_id'])
                ->get()
                ->getRowArray();
            $targetStatus = $db->table('project_statuses')
                ->select('id, status_code, status_name, is_final, is_active')
                ->where('id', $toStatusId)
                ->where('is_active', 1)
                ->get()
                ->getRowArray();

            if ($targetStatus === null) {
                $db->transRollback();
                return $this->invalid([
                    'project_status_id' => 'Select a valid active project status.',
                ]);
            }
            if ($currentStatus === null) {
                $db->transRollback();
                throw new DatabaseException('The project current status master is missing.');
            }
            if ((int) $currentStatus['id'] === $toStatusId) {
                $db->transRollback();
                return $this->invalid([
                    'project_status_id' => 'The project is already in the selected status.',
                ]);
            }
            if ((int) $currentStatus['is_final'] === 1) {
                $db->transRollback();
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                    ->setJSON([
                        'success' => false,
                        'message' => 'A project in a final status cannot be moved to another status.',
                    ]);
            }

            $updated = $db->table('projects')
                ->where('id', $id)
                ->where('company_id', (int) $user->company_id)
                ->where('project_status_id', (int) $currentStatus['id'])
                ->update([
                    'project_status_id' => $toStatusId,
                    'updated_by' => (int) $user->id,
                ]);

            if (! $updated) {
                $db->transRollback();
                throw new DatabaseException('Unable to update the project status.');
            }

            $db->table('project_status_logs')->insert([
                'company_id' => (int) $user->company_id,
                'project_id' => $id,
                'from_status_id' => (int) $currentStatus['id'],
                'to_status_id' => $toStatusId,
                'change_reason' => $changeReason,
                'changed_by' => (int) $user->id,
            ]);

            if ($db->transStatus() === false) {
                $db->transRollback();
                throw new DatabaseException('Unable to save the project status history.');
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project status changed successfully.',
                'data' => [
                    'project' => $this->baseQuery()->find($id),
                    'status_change' => [
                        'from_status' => $currentStatus,
                        'to_status' => $targetStatus,
                        'change_reason' => $changeReason,
                    ],
                ],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            log_message('warning', 'Project status change conflict: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                ->setJSON([
                    'success' => false,
                    'message' => 'Unable to change the project status because the record changed or conflicts with existing data.',
                ]);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Project status change failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $project = $this->projects
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($project === null || ! $this->canAccessProject($project, $user)) {
            return $this->notFound();
        }

        try {
            $this->projects->update($id, ['updated_by' => (int) $user->id]);
            $this->projects->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project deletion failed.', $exception);
        }
    }

    private function baseQuery(): ProjectModel
    {
        return $this->projects
            ->select([
                'projects.*',
                'branches.branch_code',
                'branches.branch_name',
                'clients.client_code',
                'clients.client_name',
                'project_types.project_type_code',
                'project_types.project_type_name',
                'financial_years.year_code AS financial_year_code',
                'financial_years.year_name AS financial_year_name',
                'billing_methods.method_code AS billing_method_code',
                'billing_methods.method_name AS billing_method_name',
                'manager.employee_code AS project_manager_code',
                'manager.first_name AS project_manager_first_name',
                'manager.last_name AS project_manager_last_name',
                'engineer.employee_code AS site_engineer_code',
                'engineer.first_name AS site_engineer_first_name',
                'engineer.last_name AS site_engineer_last_name',
                'priorities.priority_code',
                'priorities.priority_name',
                'project_statuses.status_code AS project_status_code',
                'project_statuses.status_name AS project_status_name',
            ])
            ->join('branches', 'branches.id = projects.branch_id', 'left')
            ->join('clients', 'clients.id = projects.client_id AND clients.company_id = projects.company_id')
            ->join('project_types', 'project_types.id = projects.project_type_id')
            ->join('financial_years', 'financial_years.id = projects.financial_year_id', 'left')
            ->join('billing_methods', 'billing_methods.id = projects.billing_method_id')
            ->join('users manager', 'manager.id = projects.project_manager_id', 'left')
            ->join('users engineer', 'engineer.id = projects.site_engineer_id', 'left')
            ->join('priorities', 'priorities.id = projects.priority_id')
            ->join('project_statuses', 'project_statuses.id = projects.project_status_id');
    }

    private function writableData(array $input, bool $allowStatus): array
    {
        $fields = [
            'branch_id', 'client_id', 'project_type_id', 'financial_year_id',
            'project_code', 'project_name', 'description', 'client_reference_no',
            'work_order_no', 'work_order_date', 'contract_date', 'planned_start_date',
            'actual_start_date', 'expected_completion_date', 'actual_completion_date',
            'defect_liability_end_date', 'contract_value', 'approved_budget',
            'billing_method_id', 'retention_percentage', 'tax_percentage',
            'currency_code', 'project_manager_id', 'site_engineer_id', 'priority_id',
            'progress_percentage', 'notes',
        ];

        if ($allowStatus) {
            $fields[] = 'project_status_id';
        }

        return array_intersect_key($input, array_flip($fields));
    }

    private function validateReferences(array $data, object $user): ?ResponseInterface
    {
        $companyId = (int) $user->company_id;
        $errors = [];
        $db = db_connect();

        $branchId = (int) ($data['branch_id'] ?? 0);
        if ($branchId > 0 && (
            $db->table('branches')->where('id', $branchId)->where('company_id', $companyId)
                ->where('is_active', 1)->where('deleted_at', null)->countAllResults() !== 1
            || ! $this->authorization->canAccessBranch($branchId, 'OPERATE', $user)
        )) {
            $errors['branch_id'] = 'Select an active branch you are permitted to operate.';
        }

        if (! $this->companyRecordExists('clients', (int) ($data['client_id'] ?? 0), $companyId, false)) {
            $errors['client_id'] = 'Select a valid active client for this company.';
        }
        if (! $this->companyRecordExists('project_types', (int) ($data['project_type_id'] ?? 0), $companyId)) {
            $errors['project_type_id'] = 'Select a valid active project type for this company.';
        }

        $financialYearId = (int) ($data['financial_year_id'] ?? 0);
        if ($financialYearId > 0 && ! $this->companyRecordExists('financial_years', $financialYearId, $companyId)) {
            $errors['financial_year_id'] = 'Select a valid active financial year for this company.';
        }

        foreach (['project_manager_id', 'site_engineer_id'] as $field) {
            $userId = (int) ($data[$field] ?? 0);
            if ($userId > 0 && ! $this->companyRecordExists('users', $userId, $companyId)) {
                $errors[$field] = 'Select a valid active user for this company.';
            }
        }

        foreach ([
            'billing_method_id' => 'billing_methods',
            'priority_id' => 'priorities',
            'project_status_id' => 'project_statuses',
        ] as $field => $table) {
            $value = (int) ($data[$field] ?? 0);
            if ($value <= 0 || $db->table($table)->where('id', $value)->where('is_active', 1)->countAllResults() !== 1) {
                $errors[$field] = 'Select a valid active ' . str_replace('_id', '', str_replace('_', ' ', $field)) . '.';
            }
        }

        return $errors === [] ? null : $this->invalid($errors);
    }

    private function companyRecordExists(
        string $table,
        int $id,
        int $companyId,
        bool $hasActiveFlag = true
    ): bool
    {
        if ($id <= 0) {
            return false;
        }

        $builder = db_connect()->table($table)
            ->where('id', $id)
            ->where('company_id', $companyId)
            ->where('deleted_at', null);

        if ($hasActiveFlag) {
            $builder->where('is_active', 1);
        }

        return $builder->countAllResults() === 1;
    }

    private function validateDates(array $data): array
    {
        $errors = [];
        if (
            ! empty($data['planned_start_date'])
            && ! empty($data['expected_completion_date'])
            && $data['expected_completion_date'] < $data['planned_start_date']
        ) {
            $errors['expected_completion_date'] = 'Expected completion date cannot be before planned start date.';
        }
        if (
            ! empty($data['actual_start_date'])
            && ! empty($data['actual_completion_date'])
            && $data['actual_completion_date'] < $data['actual_start_date']
        ) {
            $errors['actual_completion_date'] = 'Actual completion date cannot be before actual start date.';
        }

        return $errors;
    }

    private function canAccessProject(array $project, object $user): bool
    {
        if ((int) $project['company_id'] !== (int) $user->company_id) {
            return false;
        }

        $branchId = (int) ($project['branch_id'] ?? 0);
        return $branchId === 0
            || $this->authorization->canAccessBranch($branchId, 'VIEW', $user);
    }

    private function successList(array $projects): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'message' => 'Projects retrieved successfully.',
            'data' => ['projects' => $projects],
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
            ->setJSON(['success' => false, 'message' => 'Project not found.']);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'Project database conflict: {message}', ['message' => $exception->getMessage()]);

        return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON([
                'success' => false,
                'message' => 'Project code already exists for this company or the record conflicts with existing data.',
            ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the project request.']);
    }
}
