<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\BoqItemModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class BoqItemsController extends BaseController
{
    private BoqItemModel $items;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->items = new BoqItemModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        if ($this->accessibleBoq($boqId, $user) === null) return $this->notFound();

        try {
            $query = $this->baseQuery()
                ->where('boq_items.company_id', (int) $user->company_id)
                ->where('boq_items.boq_id', $boqId);

            foreach (['section_id', 'site_id', 'work_zone_id', 'work_category_id', 'uom_id'] as $field) {
                $value = $this->request->getGet($field);
                if ($value !== null && ctype_digit((string) $value) && (int) $value > 0) {
                    $query->where('boq_items.' . $field, (int) $value);
                }
            }
            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $query->groupStart()->like('boq_items.item_code', $search)
                    ->orLike('boq_items.item_name', $search)
                    ->orLike('boq_items.specification', $search)->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ items retrieved successfully.',
                'data' => ['boq_items' => $query
                    ->orderBy('boq_sections.display_order', 'ASC')
                    ->orderBy('boq_items.display_order', 'ASC')
                    ->orderBy('boq_items.id', 'ASC')->findAll()],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ item list retrieval failed.', $exception);
        }
    }

    public function show(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        if ($this->accessibleBoq($boqId, $user) === null) return $this->notFound();

        $item = $this->baseQuery()->where('boq_items.company_id', (int) $user->company_id)
            ->where('boq_items.boq_id', $boqId)->find($id);
        if ($item === null) return $this->itemNotFound();

        return $this->response->setJSON([
            'success' => true, 'message' => 'BOQ item retrieved successfully.',
            'data' => ['boq_item' => $item],
        ]);
    }

    public function create(int $boqId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) return $this->notFound();
        if ((string) $boq['status_code'] !== 'DRAFT') {
            return $this->conflict('Items can be added only to a draft Project BOQ.');
        }
        $input = $this->request->getJSON(true);
        if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $data = $this->writableData($input);
        $data += ['site_id' => !empty($boq['site_id']) ? (int) $boq['site_id'] : null, 'work_zone_id' => null, 'specification' => null,
            'quantity' => 0, 'rate' => 0, 'wastage_percentage' => 0,
            'progress_weightage' => 0, 'is_provisional' => 0,
            'display_order' => 0, 'notes' => null];
        $data['company_id'] = (int) $boq['company_id'];
        $data['project_id'] = (int) $boq['project_id'];
        $data['boq_id'] = $boqId;
        $data['amount'] = $this->calculateAmount($data);
        $data['executed_quantity'] = 0;
        $data['balance_quantity'] = (float) ($data['quantity'] ?? 0);
        $data['execution_progress'] = 0;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;

        $errors = $this->validateReferences($data, null);
        if ($errors !== []) return $this->invalid($errors);

        $db = db_connect();
        try {
            $db->transBegin();
            if (! $this->items->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->items->errors());
            }
            $id = (int) $this->items->getInsertID();
            $this->recalculateTotals($boqId);
            if ($db->transStatus() === false) throw new DatabaseException('Unable to create the BOQ item.');
            $db->transCommit();

            return $this->response->setStatusCode(ResponseInterface::HTTP_CREATED)->setJSON([
                'success' => true, 'message' => 'BOQ item created successfully.',
                'data' => ['boq_item' => $this->baseQuery()->find($id), 'totals' => $this->totals($boqId)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback(); return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback(); return $this->serverError('BOQ item creation failed.', $exception);
        }
    }

    public function update(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) return $this->notFound();
        if ((string) $boq['status_code'] !== 'DRAFT') {
            return $this->conflict('Items can be updated only in a draft Project BOQ.');
        }
        $existing = $this->items->where('company_id', (int) $user->company_id)
            ->where('boq_id', $boqId)->find($id);
        if ($existing === null) return $this->itemNotFound();
        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        $data = $this->writableData($input);
        if ($data === []) return $this->invalid(['body' => 'No writable BOQ item fields were supplied.']);

        $merged = array_merge($existing, $data);
        $data['amount'] = $this->calculateAmount($merged);
        $q = (float) ($merged['quantity'] ?? 0);
        $exec = (float) ($merged['executed_quantity'] ?? 0);
        $data['balance_quantity'] = max(0.0, $q - $exec);
        $data['execution_progress'] = $q > 0 ? min(100.0, round(($exec / $q) * 100, 2)) : 0.0;
        $data['updated_by'] = (int) $user->id;
        $merged = array_merge($existing, $data);
        $errors = $this->validateReferences($merged, $id);
        if ($errors !== []) return $this->invalid($errors);

        $db = db_connect();
        try {
            $db->transBegin();
            if (! $this->items->update($id, $data)) {
                $db->transRollback(); return $this->invalid($this->items->errors());
            }
            $this->recalculateTotals($boqId);
            if ($db->transStatus() === false) throw new DatabaseException('Unable to update the BOQ item.');
            $db->transCommit();

            return $this->response->setJSON([
                'success' => true, 'message' => 'BOQ item updated successfully.',
                'data' => ['boq_item' => $this->baseQuery()->find($id), 'totals' => $this->totals($boqId)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback(); return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback(); return $this->serverError('BOQ item update failed.', $exception);
        }
    }

    public function executionHistory(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        if ($this->accessibleBoq($boqId, $user) === null) return $this->notFound();

        $history = db_connect()->table('daily_work_progress dwp')
            ->select([
                'dwp.id',
                'dwp.daily_report_id',
                'dwp.completed_qty_for_day AS quantity',
                'dwp.cumulative_qty_after',
                'dwp.completion_percentage',
                'dwp.remarks',
                'dwp.measurement_reference',
                'dwp.created_at',
                'dsr.report_date',
                'dsr.report_code',
            ])
            ->join('daily_site_reports dsr', 'dsr.id = dwp.daily_report_id AND dsr.deleted_at IS NULL', 'left')
            ->where('dwp.boq_item_id', $id)
            ->where('dwp.company_id', (int) $user->company_id)
            ->where('dwp.deleted_at', null)
            ->orderBy('dsr.report_date', 'DESC')
            ->orderBy('dwp.id', 'DESC')
            ->get()->getResultArray();

        return $this->response->setJSON([
            'success' => true,
            'data' => ['history' => $history],
        ]);
    }

    public function delete(int $boqId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $boq = $this->accessibleBoq($boqId, $user, true);
        if ($boq === null) return $this->notFound();
        if ((string) $boq['status_code'] !== 'DRAFT') return $this->conflict('Items can be deleted only from a draft Project BOQ.');
        $item = $this->items->where('company_id', (int) $user->company_id)
            ->where('boq_id', $boqId)->find($id);
        if ($item === null) return $this->itemNotFound();

        $db = db_connect();
        $componentCount = $db->table('boq_item_rate_components')->where('boq_item_id', $id)
            ->where('deleted_at', null)->countAllResults();
        if ($componentCount > 0) return $this->conflict('This BOQ item cannot be deleted while it has rate components.');

        try {
            $db->transBegin();
            if (! $this->items->update($id, ['updated_by' => (int) $user->id])) {
                $db->transRollback(); return $this->invalid($this->items->errors());
            }
            if (! $this->items->delete($id)) throw new DatabaseException('Unable to delete the BOQ item.');
            $this->recalculateTotals($boqId);
            if ($db->transStatus() === false) throw new DatabaseException('Unable to delete the BOQ item.');
            $db->transCommit();
            return $this->response->setJSON([
                'success' => true, 'message' => 'BOQ item deleted successfully.',
                'data' => ['totals' => $this->totals($boqId)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback(); return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback(); return $this->serverError('BOQ item deletion failed.', $exception);
        }
    }

    private function validateReferences(array $data, ?int $excludeId): array
    {
        $db = db_connect(); $errors = [];
        $companyId = (int) ($data['company_id'] ?? 0);
        $projectId = (int) ($data['project_id'] ?? 0);
        $boqId = (int) ($data['boq_id'] ?? 0);

        if ($db->table('boq_sections')->where('id', (int) ($data['section_id'] ?? 0))
            ->where('company_id', $companyId)->where('project_id', $projectId)
            ->where('boq_id', $boqId)->where('deleted_at', null)->countAllResults() === 0) {
            $errors['section_id'] = 'Select a valid section from this BOQ.';
        }
        $siteId = (int) ($data['site_id'] ?? 0);
        if ($siteId > 0 && $db->table('project_sites')->where('id', $siteId)
            ->where('company_id', $companyId)->where('project_id', $projectId)
            ->where('deleted_at', null)->countAllResults() === 0) {
            $errors['site_id'] = 'Select a valid site from this project.';
        }
        $zoneId = (int) ($data['work_zone_id'] ?? 0);
        if ($zoneId > 0) {
            if ($siteId <= 0) {
                $errors['work_zone_id'] = 'A site is required when a work zone is selected.';
            } elseif ($db->table('site_work_zones')->where('id', $zoneId)->where('site_id', $siteId)
                ->where('company_id', $companyId)->where('project_id', $projectId)
                ->where('is_active', 1)->where('deleted_at', null)->countAllResults() === 0) {
                $errors['work_zone_id'] = 'Select an active work zone from the selected site.';
            }
        }
        if ($db->table('work_categories')->where('id', (int) ($data['work_category_id'] ?? 0))
            ->where('company_id', $companyId)->where('is_active', 1)
            ->where('deleted_at', null)->countAllResults() === 0) {
            $errors['work_category_id'] = 'Select an active work category from this company.';
        }
        if ($db->table('units_of_measurement')->where('id', (int) ($data['uom_id'] ?? 0))
            ->where('company_id', $companyId)->where('is_active', 1)
            ->where('deleted_at', null)->countAllResults() === 0) {
            $errors['uom_id'] = 'Select an active unit of measurement from this company.';
        }
        $code = strtoupper(trim((string) ($data['item_code'] ?? '')));
        if ($code !== '') {
            $duplicate = $this->items->where('boq_id', $boqId)->where('item_code', $code);
            if ($excludeId !== null) $duplicate->where('id !=', $excludeId);
            if ($duplicate->countAllResults() > 0) $errors['item_code'] = 'The item code already exists in this BOQ.';
        }
        foreach (['quantity', 'rate', 'wastage_percentage', 'progress_weightage'] as $field) {
            if (! is_numeric($data[$field] ?? null)) $errors[$field] = 'The ' . str_replace('_', ' ', $field) . ' must be numeric.';
        }
        foreach (['wastage_percentage', 'progress_weightage'] as $field) {
            if (is_numeric($data[$field] ?? null) && ((float) $data[$field] < 0 || (float) $data[$field] > 100)) {
                $errors[$field] = 'The ' . str_replace('_', ' ', $field) . ' must be between 0 and 100.';
            }
        }
        return $errors;
    }

    private function recalculateTotals(int $boqId): void
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
        $children = []; $parents = [];
        foreach ($sections as $section) {
            $id = (int) $section['id']; $parent = (int) ($section['parent_section_id'] ?? 0);
            $parents[$id] = $parent;
            if ($parent > 0) $children[$parent][] = $id;
        }
        $memo = [];
        $sum = function (int $id) use (&$sum, &$memo, $direct, $children): float {
            if (isset($memo[$id])) return $memo[$id];
            $total = $direct[$id] ?? 0.0;
            foreach ($children[$id] ?? [] as $childId) $total += $sum($childId);
            return $memo[$id] = round($total, 2);
        };
        foreach (array_keys($parents) as $id) {
            $db->table('boq_sections')->where('id', $id)->update(['section_amount' => $sum($id)]);
        }
        $boqTotal = 0.0;
        foreach ($parents as $id => $parent) if ($parent === 0) $boqTotal += $sum($id);
        $db->table('project_boqs')->where('id', $boqId)->update(['total_amount' => round($boqTotal, 2)]);
    }

    private function totals(int $boqId): array
    {
        $db = db_connect();
        $boq = $db->table('project_boqs')->select('total_amount')->where('id', $boqId)->get()->getRowArray();
        return [
            'boq_total' => (float) ($boq['total_amount'] ?? 0),
            'sections' => $db->table('boq_sections')->select('id, section_code, section_amount')
                ->where('boq_id', $boqId)->where('deleted_at', null)
                ->orderBy('display_order', 'ASC')->get()->getResultArray(),
        ];
    }

    private function calculateAmount(array $data): float
    {
        return round((float) ($data['quantity'] ?? 0) * (float) ($data['rate'] ?? 0), 2);
    }

    private function accessibleBoq(int $boqId, object $user, bool $operate = false): ?array
    {
        if ($boqId <= 0) return null;
        $boq = db_connect()->table('project_boqs pb')
            ->select('pb.id, pb.company_id, pb.project_id, pb.status_id, p.branch_id, sm.status_code')
            ->join('projects p', 'p.id = pb.project_id AND p.company_id = pb.company_id')
            ->join('project_boqs_status_masters sm', 'sm.id = pb.status_id')
            ->where('pb.id', $boqId)->where('pb.company_id', (int) $user->company_id)
            ->where('pb.deleted_at', null)->where('p.deleted_at', null)->get()->getRowArray();
        if ($boq === null) return null;
        $branchId = (int) ($boq['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch($branchId, $operate ? 'OPERATE' : 'VIEW', $user)) return null;
        return $boq;
    }

    private function baseQuery(): BoqItemModel
    {
        return $this->items->select([
            'boq_items.*', 'boq_sections.section_code', 'boq_sections.section_name',
            'project_sites.site_code', 'project_sites.site_name',
            'site_work_zones.zone_code', 'site_work_zones.zone_name',
            'work_categories.category_code', 'work_categories.category_name',
            'units_of_measurement.unit_code', 'units_of_measurement.unit_name',
            'units_of_measurement.unit_symbol',
        ])->join('boq_sections', 'boq_sections.id = boq_items.section_id AND boq_sections.deleted_at IS NULL', 'left')
            ->join('project_sites', 'project_sites.id = boq_items.site_id AND project_sites.deleted_at IS NULL', 'left')
            ->join('site_work_zones', 'site_work_zones.id = boq_items.work_zone_id AND site_work_zones.deleted_at IS NULL', 'left')
            ->join('work_categories', 'work_categories.id = boq_items.work_category_id AND work_categories.deleted_at IS NULL', 'left')
            ->join('units_of_measurement', 'units_of_measurement.id = boq_items.uom_id AND units_of_measurement.deleted_at IS NULL', 'left');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'section_id', 'site_id', 'work_zone_id', 'work_category_id', 'uom_id',
            'item_code', 'item_name', 'specification', 'quantity', 'rate',
            'wastage_percentage', 'progress_weightage', 'is_provisional',
            'display_order', 'notes',
        ]));
    }

    private function unauthorized(): ResponseInterface { return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']); }
    private function notFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Project BOQ not found.']); }
    private function itemNotFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'BOQ item not found.']); }
    private function invalid(array $errors): ResponseInterface { return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]); }
    private function conflict(string $message): ResponseInterface { return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => $message]); }
    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'BOQ item database conflict: {message}', ['message' => $exception->getMessage()]);
        return $this->conflict('The BOQ item conflicts with existing data.');
    }
    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => 'Unable to process the BOQ item request.']);
    }
}
