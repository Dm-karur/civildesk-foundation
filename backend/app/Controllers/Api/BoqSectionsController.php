<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\BoqSectionModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class BoqSectionsController extends BaseController
{
    private BoqSectionModel $sections;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->sections = new BoqSectionModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->accessibleBoq($boqId, $user);
        if ($boq === null) {
            return $this->notFound();
        }

        try {
            $query = $this->baseQuery()
                ->where('boq_sections.company_id', (int) $user->company_id)
                ->where('boq_sections.boq_id', $boqId);

            $parent = $this->request->getGet('parent_section_id');
            if ($parent !== null) {
                if ((string) $parent === '' || (string) $parent === '0') {
                    $query->where('boq_sections.parent_section_id', null);
                } elseif (ctype_digit((string) $parent) && (int) $parent > 0) {
                    $query->where('boq_sections.parent_section_id', (int) $parent);
                }
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $query->groupStart()
                    ->like('boq_sections.section_code', $search)
                    ->orLike('boq_sections.section_name', $search)
                    ->orLike('boq_sections.description', $search)
                    ->groupEnd();
            }

            $rows = $query
                ->orderBy('boq_sections.display_order', 'ASC')
                ->orderBy('boq_sections.id', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ sections retrieved successfully.',
                'data' => ['boq_sections' => $rows],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ section list retrieval failed.', $exception);
        }
    }

    public function show(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        if ($this->accessibleBoq($boqId, $user) === null) {
            return $this->notFound();
        }

        $section = $this->baseQuery()
            ->where('boq_sections.company_id', (int) $user->company_id)
            ->where('boq_sections.boq_id', $boqId)
            ->find($id);

        if ($section === null) {
            return $this->sectionNotFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'BOQ section retrieved successfully.',
            'data' => ['boq_section' => $section],
        ]);
    }

    public function create(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) {
            return $this->notFound();
        }
        if ((string) $boq['status_code'] !== 'DRAFT') {
            return $this->conflict('Sections can be added only to a draft Project BOQ.');
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $data = $this->writableData($input);
        $data['company_id'] = (int) $boq['company_id'];
        $data['project_id'] = (int) $boq['project_id'];
        $data['boq_id'] = $boqId;
        $data['section_amount'] = 0;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'parent_section_id' => null,
            'description' => null,
            'display_order' => 0,
        ];

        $errors = $this->validateSection($data, null);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (! $this->sections->insert($data)) {
                return $this->invalid($this->sections->errors());
            }

            $id = (int) $this->sections->getInsertID();

            return $this->response->setStatusCode(ResponseInterface::HTTP_CREATED)->setJSON([
                'success' => true,
                'message' => 'BOQ section created successfully.',
                'data' => ['boq_section' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ section creation failed.', $exception);
        }
    }

    public function update(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) {
            return $this->notFound();
        }
        if ((string) $boq['status_code'] !== 'DRAFT') {
            return $this->conflict('Sections can be updated only in a draft Project BOQ.');
        }

        $existing = $this->sections
            ->where('company_id', (int) $user->company_id)
            ->where('boq_id', $boqId)
            ->find($id);
        if ($existing === null) {
            return $this->sectionNotFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        if ($data === []) {
            return $this->invalid(['body' => 'No writable BOQ section fields were supplied.']);
        }
        $data['updated_by'] = (int) $user->id;

        $merged = array_merge($existing, $data);
        $errors = $this->validateSection($merged, $id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (! $this->sections->update($id, $data)) {
                return $this->invalid($this->sections->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ section updated successfully.',
                'data' => ['boq_section' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ section update failed.', $exception);
        }
    }

    public function delete(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) {
            return $this->notFound();
        }
        if ((string) $boq['status_code'] !== 'DRAFT') {
            return $this->conflict('Sections can be deleted only from a draft Project BOQ.');
        }

        $section = $this->sections
            ->where('company_id', (int) $user->company_id)
            ->where('boq_id', $boqId)
            ->find($id);
        if ($section === null) {
            return $this->sectionNotFound();
        }

        $db = db_connect();
        $childCount = $db->table('boq_sections')
            ->where('parent_section_id', $id)
            ->where('deleted_at', null)
            ->countAllResults();
        if ($childCount > 0) {
            return $this->conflict('This BOQ section cannot be deleted while it has child sections.');
        }

        $itemCount = $db->table('boq_items')
            ->where('section_id', $id)
            ->where('deleted_at', null)
            ->countAllResults();
        if ($itemCount > 0) {
            return $this->conflict('This BOQ section cannot be deleted while it has BOQ items.');
        }

        try {
            $db->transBegin();
            if (! $this->sections->update($id, ['updated_by' => (int) $user->id])) {
                $db->transRollback();
                return $this->invalid($this->sections->errors());
            }
            if (! $this->sections->delete($id) || $db->transStatus() === false) {
                throw new DatabaseException('Unable to delete the BOQ section.');
            }
            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ section deleted successfully.',
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('BOQ section deletion failed.', $exception);
        }
    }

    private function validateSection(array $data, ?int $excludeId): array
    {
        $errors = [];
        $boqId = (int) ($data['boq_id'] ?? 0);
        $parentId = (int) ($data['parent_section_id'] ?? 0);

        if ($parentId > 0) {
            if ($excludeId !== null && $parentId === $excludeId) {
                $errors['parent_section_id'] = 'A BOQ section cannot be its own parent.';
            } else {
                $parent = $this->sections
                    ->where('company_id', (int) $data['company_id'])
                    ->where('boq_id', $boqId)
                    ->find($parentId);

                if ($parent === null) {
                    $errors['parent_section_id'] = 'Select a valid parent section from the same BOQ.';
                } elseif ($excludeId !== null && $this->isDescendant($parentId, $excludeId, $boqId)) {
                    $errors['parent_section_id'] = 'A child section cannot be selected as its parent.';
                }
            }
        }

        $code = strtoupper(trim((string) ($data['section_code'] ?? '')));
        if ($boqId > 0 && $code !== '') {
            $duplicate = $this->sections
                ->where('boq_id', $boqId)
                ->where('section_code', $code);
            if ($excludeId !== null) {
                $duplicate->where('id !=', $excludeId);
            }
            if ($duplicate->countAllResults() > 0) {
                $errors['section_code'] = 'The section code already exists in this BOQ.';
            }
        }

        return $errors;
    }

    private function isDescendant(int $candidateId, int $sectionId, int $boqId): bool
    {
        $visited = [];
        $currentId = $candidateId;

        while ($currentId > 0 && ! isset($visited[$currentId])) {
            if ($currentId === $sectionId) {
                return true;
            }
            $visited[$currentId] = true;
            $row = $this->sections
                ->select('id, parent_section_id')
                ->where('boq_id', $boqId)
                ->find($currentId);
            $currentId = (int) ($row['parent_section_id'] ?? 0);
        }

        return false;
    }

    private function accessibleBoq(int $boqId, object $user, bool $operate = false): ?array
    {
        if ($boqId <= 0) {
            return null;
        }

        $boq = db_connect()->table('project_boqs pb')
            ->select('pb.id, pb.company_id, pb.project_id, pb.status_id, p.branch_id, status_master.status_code')
            ->join('projects p', 'p.id = pb.project_id AND p.company_id = pb.company_id')
            ->join('project_boqs_status_masters status_master', 'status_master.id = pb.status_id')
            ->where('pb.id', $boqId)
            ->where('pb.company_id', (int) $user->company_id)
            ->where('pb.deleted_at', null)
            ->where('p.deleted_at', null)
            ->get()
            ->getRowArray();

        if ($boq === null) {
            return null;
        }

        $branchId = (int) ($boq['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch(
            $branchId,
            $operate ? 'OPERATE' : 'VIEW',
            $user
        )) {
            return null;
        }

        return $boq;
    }

    private function baseQuery(): BoqSectionModel
    {
        return $this->sections
            ->select([
                'boq_sections.*',
                'parent.section_code AS parent_section_code',
                'parent.section_name AS parent_section_name',
                '(SELECT COUNT(bi.id) FROM boq_items bi WHERE bi.section_id = boq_sections.id AND bi.deleted_at IS NULL) AS item_count',
                '(SELECT COALESCE(SUM(bi.executed_quantity * bi.rate), 0) FROM boq_items bi WHERE bi.section_id = boq_sections.id AND bi.deleted_at IS NULL) AS executed_amount',
            ])
            ->join('boq_sections parent', 'parent.id = boq_sections.parent_section_id AND parent.deleted_at IS NULL', 'left');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'parent_section_id',
            'section_code',
            'section_name',
            'description',
            'display_order',
        ]));
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON(['success' => false, 'message' => 'Authentication required.']);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Project BOQ not found.']);
    }

    private function sectionNotFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'BOQ section not found.']);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function conflict(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON(['success' => false, 'message' => $message]);
    }

    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'BOQ section database conflict: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->conflict('The BOQ section conflicts with existing data.');
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the BOQ section request.']);
    }
}
