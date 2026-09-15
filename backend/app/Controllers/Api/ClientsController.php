<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ClientModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ClientsController extends BaseController
{
    private ClientModel $clients;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->clients = new ClientModel();
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
                ->where('clients.company_id', (int) $user->company_id);

            $branchId = (int) ($this->request->getGet('branch_id') ?? 0);
            if ($branchId > 0) {
                if (! $this->authorization->canAccessBranch($branchId, 'VIEW', $user)) {
                    return $this->forbidden('You cannot access the selected branch.');
                }
                $builder->where('clients.branch_id', $branchId);
            } elseif (! $this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) {
                    return $this->successList([]);
                }
                $builder->groupStart()
                    ->whereIn('clients.branch_id', $branchIds)
                    ->orWhere('clients.branch_id', null)
                    ->groupEnd();
            }

            $statusId = (int) ($this->request->getGet('client_status_id') ?? 0);
            if ($statusId > 0) {
                $builder->where('clients.client_status_id', $statusId);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('clients.client_code', $search)
                    ->orLike('clients.client_name', $search)
                    ->orLike('clients.legal_name', $search)
                    ->orLike('clients.gstin', $search)
                    ->orLike('clients.phone', $search)
                    ->groupEnd();
            }

            return $this->successList(
                $builder->orderBy('clients.client_name', 'ASC')->findAll()
            );
        } catch (Throwable $exception) {
            return $this->serverError('Client list retrieval failed.', $exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $client = $this->baseQuery()
                ->where('clients.company_id', (int) $user->company_id)
                ->find($id);

            if ($client === null || ! $this->canAccessClient($client, $user)) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client retrieved successfully.',
                'data' => ['client' => $client],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Client retrieval failed.', $exception);
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

        $data = $this->writableData($input);
        $data['company_id'] = (int) $user->company_id;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'branch_id' => null,
            'billing_currency' => 'INR',
            'payment_terms_days' => 0,
            'credit_limit' => 0,
            'tax_deduction_applicable' => 0,
        ];

        $validation = $this->validateReferences($data, $user);
        if ($validation !== null) {
            return $validation;
        }

        try {
            if (! $this->clients->insert($data)) {
                return $this->invalid($this->clients->errors());
            }

            $id = (int) $this->clients->getInsertID();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Client created successfully.',
                    'data' => ['client' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Client creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->clients
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null || ! $this->canAccessClient($existing, $user)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['company_id'], $data['created_by']);
        $data['updated_by'] = (int) $user->id;
        $merged = array_merge($existing, $data);

        $validation = $this->validateReferences($merged, $user);
        if ($validation !== null) {
            return $validation;
        }

        try {
            if (! $this->clients->update($id, $data)) {
                return $this->invalid($this->clients->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client updated successfully.',
                'data' => ['client' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Client update failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $client = $this->clients
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($client === null || ! $this->canAccessClient($client, $user)) {
            return $this->notFound();
        }

        try {
            $this->clients->update($id, ['updated_by' => (int) $user->id]);
            $this->clients->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Client deletion failed.', $exception);
        }
    }

    private function baseQuery(): ClientModel
    {
        return $this->clients
            ->select([
                'clients.*',
                'branches.branch_code',
                'branches.branch_name',
                'company_types.type_code AS client_type_code',
                'company_types.type_name AS client_type_name',
                'gst_registration_types.type_code AS gst_registration_type_code',
                'gst_registration_types.type_name AS gst_registration_type_name',
                'client_sources.source_code AS client_source_code',
                'client_sources.source_name AS client_source_name',
                'client_statuses.status_code AS client_status_code',
                'client_statuses.status_name AS client_status_name',
            ])
            ->join('branches', 'branches.id = clients.branch_id', 'left')
            ->join('company_types', 'company_types.id = clients.client_type_id')
            ->join('gst_registration_types', 'gst_registration_types.id = clients.gst_registration_type_id')
            ->join('client_sources', 'client_sources.id = clients.client_source_id')
            ->join('client_statuses', 'client_statuses.id = clients.client_status_id');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'branch_id', 'client_code', 'client_name', 'legal_name',
            'client_type_id', 'industry_type', 'gst_registration_type_id',
            'gstin', 'pan', 'tan', 'email', 'phone', 'website',
            'billing_currency', 'payment_terms_days', 'credit_limit',
            'tax_deduction_applicable', 'client_source_id',
            'client_status_id', 'notes',
        ]));
    }

    private function validateReferences(array $data, object $user): ?ResponseInterface
    {
        $db = db_connect();
        $errors = [];
        $companyId = (int) $user->company_id;
        $branchId = (int) ($data['branch_id'] ?? 0);

        if ($branchId > 0) {
            $branchExists = $db->table('branches')
                ->where('id', $branchId)
                ->where('company_id', $companyId)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->countAllResults() > 0;
            if (! $branchExists || ! $this->authorization->canAccessBranch($branchId, 'OPERATE', $user)) {
                $errors['branch_id'] = 'The selected branch is invalid or inaccessible.';
            }
        }

        $masters = [
            'client_type_id' => ['company_types', 'Client type'],
            'gst_registration_type_id' => ['gst_registration_types', 'GST registration type'],
            'client_source_id' => ['client_sources', 'Client source'],
            'client_status_id' => ['client_statuses', 'Client status'],
        ];
        foreach ($masters as $field => [$table, $label]) {
            $value = (int) ($data[$field] ?? 0);
            if ($value <= 0 || $db->table($table)->where('id', $value)
                ->where('is_active', 1)->countAllResults() === 0) {
                $errors[$field] = "The selected {$label} is invalid.";
            }
        }

        return $errors === [] ? null : $this->invalid($errors);
    }

    private function canAccessClient(array $client, object $user): bool
    {
        if ($this->authorization->isSuperAdmin($user) || $client['branch_id'] === null) {
            return true;
        }

        return $this->authorization->canAccessBranch((int) $client['branch_id'], 'VIEW', $user);
    }

    private function successList(array $clients): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'message' => 'Clients retrieved successfully.',
            'data' => ['clients' => $clients],
        ]);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('error', 'Client database operation failed: {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON(['success' => false, 'message' => 'Client code or GSTIN already exists.']);
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
            ->setJSON(['success' => false, 'message' => 'Client not found.']);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the client request.']);
    }
}
