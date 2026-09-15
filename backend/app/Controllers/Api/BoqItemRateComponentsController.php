<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\BoqItemRateComponentModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class BoqItemRateComponentsController extends BaseController
{
    private BoqItemRateComponentModel $components;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->components = new BoqItemRateComponentModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $boqId, int $itemId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $context = $this->accessibleItem($boqId, $itemId, $user);
        if ($context === null) return $this->notFound();

        try {
            $query = $this->baseQuery()->where('boq_item_rate_components.boq_item_id', $itemId);
            $typeId = $this->request->getGet('component_type_id');
            if ($typeId !== null && ctype_digit((string) $typeId) && (int) $typeId > 0) {
                $query->where('boq_item_rate_components.component_type_id', (int) $typeId);
            }
            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $query->groupStart()
                    ->like('boq_item_rate_components.component_name', $search)
                    ->orLike('boq_item_rate_components.remarks', $search)
                    ->orLike('ct.component_type_code', $search)
                    ->orLike('ct.component_type_name', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ item rate components retrieved successfully.',
                'data' => [
                    'boq_item' => $this->itemDetails($context),
                    'rate_components' => $query
                        ->orderBy('ct.sort_order', 'ASC')
                        ->orderBy('boq_item_rate_components.display_order', 'ASC')
                        ->orderBy('boq_item_rate_components.id', 'ASC')->findAll(),
                    'rate_analysis' => $this->rateAnalysis($context),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ item rate component list retrieval failed.', $exception);
        }
    }

    public function show(int $boqId, int $itemId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $context = $this->accessibleItem($boqId, $itemId, $user);
        if ($context === null) return $this->notFound();
        $component = $this->baseQuery()
            ->where('boq_item_rate_components.boq_item_id', $itemId)->find($id);
        if ($component === null) return $this->componentNotFound();

        return $this->response->setJSON([
            'success' => true,
            'message' => 'BOQ item rate component retrieved successfully.',
            'data' => ['rate_component' => $component, 'rate_analysis' => $this->rateAnalysis($context)],
        ]);
    }

    public function create(int $boqId, int $itemId): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $context = $this->accessibleItem($boqId, $itemId, $user, true);
        if ($context === null) return $this->notFound();
        if ((string) $context['status_code'] !== 'DRAFT') {
            return $this->conflict('Rate components can be added only to an item in a draft Project BOQ.');
        }
        $input = $this->request->getJSON(true);
        if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $data = $this->writableData($input);
        $data += ['quantity_factor' => 1, 'component_rate' => 0, 'remarks' => null, 'display_order' => 0];
        $data['boq_item_id'] = $itemId;
        $data['component_amount'] = $this->calculateAmount($data);
        $data['created_by'] = (int) $user->id;
        $errors = $this->validateDataReferences($data, null);
        if ($errors !== []) return $this->invalid($errors);

        try {
            if (! $this->components->insert($data)) return $this->invalid($this->components->errors());
            $id = (int) $this->components->getInsertID();
            return $this->response->setStatusCode(ResponseInterface::HTTP_CREATED)->setJSON([
                'success' => true,
                'message' => 'BOQ item rate component created successfully.',
                'data' => [
                    'rate_component' => $this->baseQuery()->find($id),
                    'rate_analysis' => $this->rateAnalysis($context),
                ],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ item rate component creation failed.', $exception);
        }
    }

    public function update(int $boqId, int $itemId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $context = $this->accessibleItem($boqId, $itemId, $user, true);
        if ($context === null) return $this->notFound();
        if ((string) $context['status_code'] !== 'DRAFT') {
            return $this->conflict('Rate components can be updated only for an item in a draft Project BOQ.');
        }
        $existing = $this->components->where('boq_item_id', $itemId)->find($id);
        if ($existing === null) return $this->componentNotFound();
        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        $data = $this->writableData($input);
        if ($data === []) return $this->invalid(['body' => 'No writable rate component fields were supplied.']);
        $merged = array_merge($existing, $data);
        $data['component_amount'] = $this->calculateAmount($merged);
        $merged = array_merge($existing, $data);
        $errors = $this->validateDataReferences($merged, $id);
        if ($errors !== []) return $this->invalid($errors);

        try {
            if (! $this->components->update($id, $data)) return $this->invalid($this->components->errors());
            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ item rate component updated successfully.',
                'data' => [
                    'rate_component' => $this->baseQuery()->find($id),
                    'rate_analysis' => $this->rateAnalysis($context),
                ],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ item rate component update failed.', $exception);
        }
    }

    public function delete(int $boqId, int $itemId, int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $context = $this->accessibleItem($boqId, $itemId, $user, true);
        if ($context === null) return $this->notFound();
        if ((string) $context['status_code'] !== 'DRAFT') {
            return $this->conflict('Rate components can be deleted only from an item in a draft Project BOQ.');
        }
        $component = $this->components->where('boq_item_id', $itemId)->find($id);
        if ($component === null) return $this->componentNotFound();

        try {
            if (! $this->components->delete($id)) throw new DatabaseException('Unable to delete the rate component.');
            return $this->response->setJSON([
                'success' => true,
                'message' => 'BOQ item rate component deleted successfully.',
                'data' => ['rate_analysis' => $this->rateAnalysis($context)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('BOQ item rate component deletion failed.', $exception);
        }
    }

    private function validateDataReferences(array $data, ?int $excludeId): array
    {
        $errors = [];
        $typeId = (int) ($data['component_type_id'] ?? 0);
        if (db_connect()->table('boq_item_rate_components_component_type_masters')
            ->where('id', $typeId)->where('is_active', 1)->countAllResults() === 0) {
            $errors['component_type_id'] = 'Select an active rate component type.';
        }
        $name = trim((string) ($data['component_name'] ?? ''));
        if ($name !== '') {
            $duplicate = $this->components
                ->where('boq_item_id', (int) ($data['boq_item_id'] ?? 0))
                ->where('component_type_id', $typeId)
                ->where('component_name', $name);
            if ($excludeId !== null) $duplicate->where('id !=', $excludeId);
            if ($duplicate->countAllResults() > 0) {
                $errors['component_name'] = 'This component name already exists for the selected type and BOQ item.';
            }
        }
        foreach (['quantity_factor', 'component_rate'] as $field) {
            if (! is_numeric($data[$field] ?? null)) {
                $errors[$field] = 'The ' . str_replace('_', ' ', $field) . ' must be numeric.';
            } elseif ((float) $data[$field] < 0) {
                $errors[$field] = 'The ' . str_replace('_', ' ', $field) . ' cannot be negative.';
            }
        }
        return $errors;
    }

    private function accessibleItem(int $boqId, int $itemId, object $user, bool $operate = false): ?array
    {
        if ($boqId <= 0 || $itemId <= 0) return null;
        $row = db_connect()->table('boq_items bi')
            ->select('bi.id, bi.company_id, bi.project_id, bi.boq_id, bi.item_code, bi.item_name, bi.quantity, bi.rate, bi.amount, pb.status_id, sm.status_code, p.branch_id')
            ->join('project_boqs pb', 'pb.id = bi.boq_id AND pb.company_id = bi.company_id AND pb.project_id = bi.project_id')
            ->join('project_boqs_status_masters sm', 'sm.id = pb.status_id')
            ->join('projects p', 'p.id = bi.project_id AND p.company_id = bi.company_id')
            ->where('bi.id', $itemId)->where('bi.boq_id', $boqId)
            ->where('bi.company_id', (int) $user->company_id)
            ->where('bi.deleted_at', null)->where('pb.deleted_at', null)->where('p.deleted_at', null)
            ->get()->getRowArray();
        if ($row === null) return null;
        $branchId = (int) ($row['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch($branchId, $operate ? 'OPERATE' : 'VIEW', $user)) return null;
        return $row;
    }

    private function baseQuery(): BoqItemRateComponentModel
    {
        return $this->components->select([
            'boq_item_rate_components.*',
            'ct.component_type_code', 'ct.component_type_name', 'ct.sort_order AS component_type_sort_order',
        ])->join(
            'boq_item_rate_components_component_type_masters ct',
            'ct.id = boq_item_rate_components.component_type_id'
        );
    }

    private function rateAnalysis(array $context): array
    {
        $db = db_connect();
        $totalRow = $db->table('boq_item_rate_components')->selectSum('component_amount')
            ->where('boq_item_id', (int) $context['id'])->where('deleted_at', null)->get()->getRowArray();
        $componentTotal = round((float) ($totalRow['component_amount'] ?? 0), 4);
        $itemRate = round((float) $context['rate'], 4);
        $quantity = round((float) $context['quantity'], 4);

        return [
            'component_count' => $db->table('boq_item_rate_components')
                ->where('boq_item_id', (int) $context['id'])->where('deleted_at', null)->countAllResults(),
            'component_total_rate' => $componentTotal,
            'boq_item_rate' => $itemRate,
            'rate_variance' => round($itemRate - $componentTotal, 4),
            'boq_item_quantity' => $quantity,
            'analysed_total_amount' => round($quantity * $componentTotal, 2),
            'boq_item_amount' => round((float) $context['amount'], 2),
        ];
    }

    private function itemDetails(array $context): array
    {
        return array_intersect_key($context, array_flip(['id', 'boq_id', 'item_code', 'item_name', 'quantity', 'rate', 'amount', 'status_code']));
    }

    private function calculateAmount(array $data): float
    {
        return round((float) ($data['quantity_factor'] ?? 0) * (float) ($data['component_rate'] ?? 0), 4);
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'component_type_id', 'component_name', 'quantity_factor',
            'component_rate', 'remarks', 'display_order',
        ]));
    }

    private function unauthorized(): ResponseInterface { return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']); }
    private function notFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Project BOQ item not found.']); }
    private function componentNotFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'BOQ item rate component not found.']); }
    private function invalid(array $errors): ResponseInterface { return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]); }
    private function conflict(string $message): ResponseInterface { return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => $message]); }

    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'BOQ item rate component database conflict: {message}', ['message' => $exception->getMessage()]);
        return $this->conflict('The BOQ item rate component conflicts with existing data.');
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => 'Unable to process the BOQ item rate component request.']);
    }
}
