<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ClientAddressModel;
use App\Models\ClientModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ClientAddressesController extends BaseController
{
    private ClientAddressModel $addresses;
    private ClientModel $clients;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->addresses = new ClientAddressModel();
        $this->clients = new ClientModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $clientId): ResponseInterface
    {
        $context = $this->clientContext($clientId);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        try {
            $addresses = $this->baseQuery()
                ->where('client_addresses.company_id', $context['company_id'])
                ->where('client_addresses.client_id', $clientId)
                ->orderBy('client_addresses.is_primary', 'DESC')
                ->orderBy('address_types.sort_order', 'ASC')
                ->orderBy('client_addresses.id', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client addresses retrieved successfully.',
                'data' => ['addresses' => $addresses],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    public function show(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $address = $this->findAddress($context['company_id'], $clientId, $id);
        if ($address === null) {
            return $this->notFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Client address retrieved successfully.',
            'data' => ['address' => $address],
        ]);
    }

    public function create(int $clientId): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $data = $this->writableData($input);
        $data['company_id'] = $context['company_id'];
        $data['client_id'] = $clientId;
        $data['created_by'] = $context['user_id'];
        $data['updated_by'] = $context['user_id'];
        $data += ['country_code' => 'IN', 'is_primary' => 0, 'is_active' => 1];

        $masterError = $this->validateAddressType((int) ($data['address_type_id'] ?? 0));
        if ($masterError !== null) {
            return $masterError;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ((int) $data['is_primary'] === 1) {
                $db->table('client_addresses')
                    ->where('company_id', $context['company_id'])
                    ->where('client_id', $clientId)
                    ->where('deleted_at', null)
                    ->update(['is_primary' => 0, 'updated_by' => $context['user_id']]);
            }

            if (! $this->addresses->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->addresses->errors());
            }

            $id = (int) $this->addresses->getInsertID();
            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Client address created successfully.',
                    'data' => ['address' => $this->findAddress($context['company_id'], $clientId, $id)],
                ]);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError($exception);
        }
    }

    public function update(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $existing = $this->addresses
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($existing === null) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['company_id'], $data['client_id'], $data['created_by']);
        $data['updated_by'] = $context['user_id'];
        $merged = array_merge($existing, $data);

        $masterError = $this->validateAddressType((int) ($merged['address_type_id'] ?? 0));
        if ($masterError !== null) {
            return $masterError;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ((int) ($merged['is_primary'] ?? 0) === 1) {
                $db->table('client_addresses')
                    ->where('company_id', $context['company_id'])
                    ->where('client_id', $clientId)
                    ->where('id !=', $id)
                    ->where('deleted_at', null)
                    ->update(['is_primary' => 0, 'updated_by' => $context['user_id']]);
            }

            if (! $this->addresses->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->addresses->errors());
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client address updated successfully.',
                'data' => ['address' => $this->findAddress($context['company_id'], $clientId, $id)],
            ]);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError($exception);
        }
    }

    public function delete(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $address = $this->addresses
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($address === null) {
            return $this->notFound();
        }

        try {
            $this->addresses->update($id, ['updated_by' => $context['user_id']]);
            $this->addresses->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client address deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    private function clientContext(int $clientId, bool $operate = false): array|ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON(['success' => false, 'message' => 'Authentication required.']);
        }

        $client = $this->clients
            ->where('company_id', (int) $user->company_id)
            ->find($clientId);
        if ($client === null) {
            return $this->clientNotFound();
        }

        if (! $this->authorization->isSuperAdmin($user) && $client['branch_id'] !== null) {
            $level = $operate ? 'OPERATE' : 'VIEW';
            if (! $this->authorization->canAccessBranch((int) $client['branch_id'], $level, $user)) {
                return $this->clientNotFound();
            }
        }

        return [
            'company_id' => (int) $user->company_id,
            'user_id' => (int) $user->id,
        ];
    }

    private function baseQuery(): ClientAddressModel
    {
        return $this->addresses
            ->select([
                'client_addresses.*',
                'address_types.type_code AS address_type_code',
                'address_types.type_name AS address_type_name',
            ])
            ->join('address_types', 'address_types.id = client_addresses.address_type_id');
    }

    private function findAddress(int $companyId, int $clientId, int $id): ?array
    {
        return $this->baseQuery()
            ->where('client_addresses.company_id', $companyId)
            ->where('client_addresses.client_id', $clientId)
            ->find($id);
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'address_type_id', 'address_name', 'attention_to', 'address_line1',
            'address_line2', 'landmark', 'city', 'district', 'state_name',
            'state_code', 'country_code', 'postal_code', 'gstin', 'latitude',
            'longitude', 'is_primary', 'is_active',
        ]));
    }

    private function validateAddressType(int $addressTypeId): ?ResponseInterface
    {
        if ($addressTypeId <= 0 || db_connect()->table('address_types')
            ->where('id', $addressTypeId)
            ->where('is_active', 1)
            ->countAllResults() === 0) {
            return $this->invalid(['address_type_id' => 'The selected address type is invalid.']);
        }

        return null;
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function clientNotFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Client not found.']);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Client address not found.']);
    }

    private function serverError(Throwable $exception): ResponseInterface
    {
        log_message('error', 'Client address operation failed: {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the client address request.']);
    }
}
