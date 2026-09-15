<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\WorkLocationModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class WorkLocationsController extends BaseController
{
    private WorkLocationModel $locations;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->locations = new WorkLocationModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $query = $this->baseQuery()
                ->where('work_locations.company_id', (int) $user->company_id);

            $siteId = (int) ($this->request->getGet('site_id') ?? 0);
            if ($siteId > 0) {
                $site = $this->accessibleSite($siteId, $user);
                if ($site === null) {
                    return $this->forbidden('You cannot access the selected site.');
                }
                $query->where('work_locations.site_id', $siteId);
            } elseif (!$this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) {
                    return $this->successList([]);
                }
                $query->whereIn('projects.branch_id', $branchIds);
            }

            foreach (['project_id', 'zone_id', 'parent_location_id', 'location_type_id', 'status_id'] as $field) {
                $value = (int) ($this->request->getGet($field) ?? 0);
                if ($value > 0) {
                    $query->where('work_locations.' . $field, $value);
                }
            }

            $isActive = $this->request->getGet('is_active');
            if ($isActive !== null && in_array((string) $isActive, ['0', '1'], true)) {
                $query->where('work_locations.is_active', (int) $isActive);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $query->groupStart()
                    ->like('work_locations.location_code', $search)
                    ->orLike('work_locations.location_name', $search)
                    ->orLike('project_sites.site_name', $search)
                    ->orLike('site_work_zones.zone_name', $search)
                    ->groupEnd();
            }

            $rows = $query
                ->orderBy('project_sites.site_name', 'ASC')
                ->orderBy('work_locations.display_order', 'ASC')
                ->orderBy('work_locations.location_name', 'ASC')
                ->findAll();

            return $this->successList($rows);
        } catch (Throwable $e) {
            return $this->serverError('Work location list retrieval failed.', $e);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $location = $this->baseQuery()
            ->where('work_locations.company_id', (int) $user->company_id)
            ->find($id);

        if ($location === null || $this->accessibleSite((int) $location['site_id'], $user) === null) {
            return $this->notFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Work location retrieved successfully.',
            'data' => ['work_location' => $location],
        ]);
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $input = $this->request->getJSON(true);
        if (!is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $siteId = (int) ($input['site_id'] ?? 0);
        $site = $this->accessibleSite($siteId, $user, true);
        if ($site === null) {
            return $this->invalid(['site_id' => 'Select a valid site you are permitted to operate.']);
        }

        $data = $this->writableData($input);
        $data['company_id'] = (int) $user->company_id;
        $data['project_id'] = (int) $site['project_id'];
        $data['site_id'] = $siteId;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'zone_id' => null,
            'parent_location_id' => null,
            'location_type_id' => 1,
            'planned_start_date' => null,
            'planned_end_date' => null,
            'status_id' => 1,
            'progress_percentage' => 0,
            'display_order' => 0,
            'is_active' => 1,
        ];

        $errors = $this->validateWorkLocationData($data, null);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (!$this->locations->insert($data)) {
                return $this->invalid($this->locations->errors());
            }

            $id = (int) $this->locations->getInsertID();

            return $this->response->setStatusCode(201)->setJSON([
                'success' => true,
                'message' => 'Work location created successfully.',
                'data' => ['work_location' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $e) {
            return $this->conflict('Location code already exists for this site or the record conflicts with existing data.');
        } catch (Throwable $e) {
            return $this->serverError('Work location creation failed.', $e);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->locations
            ->where('company_id', (int) $user->company_id)
            ->find($id);

        if ($existing === null || $this->accessibleSite((int) $existing['site_id'], $user, true) === null) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (!is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['site_id']);
        $data['updated_by'] = (int) $user->id;

        $merged = array_merge($existing, $data);
        $errors = $this->validateWorkLocationData($merged, $id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (!$this->locations->update($id, $data)) {
                return $this->invalid($this->locations->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work location updated successfully.',
                'data' => ['work_location' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $e) {
            return $this->conflict('Location code already exists for this site or the record conflicts with existing data.');
        } catch (Throwable $e) {
            return $this->serverError('Work location update failed.', $e);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $location = $this->locations
            ->where('company_id', (int) $user->company_id)
            ->find($id);

        if ($location === null || $this->accessibleSite((int) $location['site_id'], $user, true) === null) {
            return $this->notFound();
        }

        $children = db_connect()->table('work_locations')
            ->where('parent_location_id', $id)
            ->where('deleted_at', null)
            ->countAllResults();

        if ($children > 0) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false,
                'message' => 'This work location cannot be deleted while it has active child locations.',
            ]);
        }

        try {
            $this->locations->update($id, ['updated_by' => (int) $user->id]);
            $this->locations->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work location deleted successfully.',
            ]);
        } catch (DatabaseException $e) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false,
                'message' => 'This work location cannot be deleted because it is used by existing records.',
            ]);
        } catch (Throwable $e) {
            return $this->serverError('Work location deletion failed.', $e);
        }
    }

    private function validateWorkLocationData(array $data, ?int $exceptId): array
    {
        $errors = [];
        $siteId = (int) ($data['site_id'] ?? 0);

        if (!$this->activeMaster('work_location_types', (int) ($data['location_type_id'] ?? 0))) {
            $errors['location_type_id'] = 'Select a valid active work location type.';
        }

        if (!$this->activeMaster('work_location_statuses', (int) ($data['status_id'] ?? 0))) {
            $errors['status_id'] = 'Select a valid active work location status.';
        }

        if (!empty($data['planned_start_date']) && !empty($data['planned_end_date'])
            && $data['planned_end_date'] < $data['planned_start_date']) {
            $errors['planned_end_date'] = 'Planned end date cannot be before planned start date.';
        }

        $zoneId = (int) ($data['zone_id'] ?? 0);
        if ($zoneId > 0) {
            $zone = db_connect()->table('site_work_zones')
                ->where('id', $zoneId)
                ->where('site_id', $siteId)
                ->where('company_id', (int) ($data['company_id'] ?? 0))
                ->where('deleted_at', null)
                ->get()->getRowArray();

            if ($zone === null) {
                $errors['zone_id'] = 'Select a valid zone from the same site.';
            }
        }

        $parentId = (int) ($data['parent_location_id'] ?? 0);
        if ($exceptId !== null && $parentId === $exceptId) {
            $errors['parent_location_id'] = 'A work location cannot be its own parent.';
        } elseif ($parentId > 0) {
            $parent = $this->locations->find($parentId);
            if ($parent === null || (int) $parent['site_id'] !== $siteId) {
                $errors['parent_location_id'] = 'Select a valid parent work location from the same site.';
            } elseif ($exceptId !== null && $this->wouldCreateCycle($exceptId, $parentId)) {
                $errors['parent_location_id'] = 'The selected parent would create a circular work location hierarchy.';
            }
        }

        $code = strtoupper(trim((string) ($data['location_code'] ?? '')));
        $duplicate = db_connect()->table('work_locations')
            ->where('site_id', $siteId)
            ->where('location_code', $code)
            ->where('deleted_at', null);

        if ($exceptId !== null) {
            $duplicate->where('id !=', $exceptId);
        }

        if ($duplicate->countAllResults() > 0) {
            $errors['location_code'] = 'The location code already exists for the selected site.';
        }

        foreach (['is_active'] as $field) {
            if (array_key_exists($field, $data) && !$this->isBinaryValue($data[$field])) {
                $errors[$field] = 'The ' . $field . ' field must be 0 or 1.';
            }
        }

        return $errors;
    }

    private function wouldCreateCycle(int $id, int $parentId): bool
    {
        $seen = [];
        while ($parentId > 0) {
            if ($parentId === $id || isset($seen[$parentId])) {
                return true;
            }
            $seen[$parentId] = true;
            $row = $this->locations->find($parentId);
            $parentId = (int) ($row['parent_location_id'] ?? 0);
        }

        return false;
    }

    private function accessibleSite(int $siteId, object $user, bool $operate = false): ?array
    {
        $site = db_connect()->table('project_sites s')
            ->select('s.*, p.branch_id')
            ->join('projects p', 'p.id = s.project_id AND p.company_id = s.company_id')
            ->where('s.id', $siteId)
            ->where('s.company_id', (int) $user->company_id)
            ->where('s.deleted_at', null)
            ->where('p.deleted_at', null)
            ->get()->getRowArray();

        if ($site === null) {
            return null;
        }

        $branchId = (int) ($site['branch_id'] ?? 0);
        if ($branchId > 0 && !$this->authorization->canAccessBranch(
            $branchId,
            $operate ? 'OPERATE' : 'VIEW',
            $user
        )) {
            return null;
        }

        return $site;
    }

    private function baseQuery(): WorkLocationModel
    {
        return $this->locations
            ->select([
                'work_locations.id AS id',
                'work_locations.company_id AS company_id',
                'work_locations.project_id AS project_id',
                'work_locations.site_id AS site_id',
                'work_locations.zone_id AS zone_id',
                'work_locations.parent_location_id AS parent_location_id',
                'work_locations.location_code AS location_code',
                'work_locations.location_name AS location_name',
                'work_locations.location_type_id AS location_type_id',
                'work_locations.description AS description',
                'work_locations.planned_start_date AS planned_start_date',
                'work_locations.planned_end_date AS planned_end_date',
                'work_locations.status_id AS status_id',
                'work_locations.progress_percentage AS progress_percentage',
                'work_locations.display_order AS display_order',
                'work_locations.is_active AS is_active',
                'work_locations.created_by AS created_by',
                'work_locations.updated_by AS updated_by',
                'work_locations.created_at AS created_at',
                'work_locations.updated_at AS updated_at',
                'work_locations.deleted_at AS deleted_at',
                'projects.project_code',
                'projects.project_name',
                'projects.branch_id AS project_branch_id',
                'project_sites.site_code',
                'project_sites.site_name',
                'site_work_zones.zone_code',
                'site_work_zones.zone_name',
                'parent.location_code AS parent_location_code',
                'parent.location_name AS parent_location_name',
                'work_location_types.type_code AS location_type_code',
                'work_location_types.type_name AS location_type_name',
                'work_location_statuses.status_code',
                'work_location_statuses.status_name',
            ])
            ->join('projects', 'projects.id = work_locations.project_id AND projects.company_id = work_locations.company_id')
            ->join('project_sites', 'project_sites.id = work_locations.site_id AND project_sites.project_id = work_locations.project_id')
            ->join('site_work_zones', 'site_work_zones.id = work_locations.zone_id', 'left')
            ->join('work_locations parent', 'parent.id = work_locations.parent_location_id', 'left')
            ->join('work_location_types', 'work_location_types.id = work_locations.location_type_id')
            ->join('work_location_statuses', 'work_location_statuses.id = work_locations.status_id');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'site_id', 'zone_id', 'parent_location_id', 'location_code', 'location_name',
            'location_type_id', 'description', 'planned_start_date', 'planned_end_date',
            'status_id', 'progress_percentage', 'display_order', 'is_active',
        ]));
    }

    private function activeMaster(string $table, int $id): bool
    {
        return $id > 0 && db_connect()->table($table)
            ->where('id', $id)
            ->where('is_active', 1)
            ->countAllResults() === 1;
    }

    private function isBinaryValue(mixed $value): bool
    {
        return $value === true || $value === false
            || $value === 0 || $value === 1
            || $value === '0' || $value === '1';
    }

    private function successList(array $locations): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'message' => 'Work locations retrieved successfully.',
            'data' => ['work_locations' => $locations],
        ]);
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response->setStatusCode(401)->setJSON([
            'success' => false,
            'message' => 'Authentication required.',
        ]);
    }

    private function forbidden(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(403)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(404)->setJSON([
            'success' => false,
            'message' => 'Work location not found.',
        ]);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(422)->setJSON([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $errors,
        ]);
    }

    private function conflict(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(409)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }

    private function serverError(string $message, Throwable $e): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $e->getMessage()]);

        return $this->response->setStatusCode(500)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }
}
