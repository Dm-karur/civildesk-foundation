<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ClientContactModel;
use App\Models\ClientModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ClientContactsController extends BaseController
{
    private ClientContactModel $contacts;
    private ClientModel $clients;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->contacts = new ClientContactModel();
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
            $contacts = $this->baseQuery()
                ->where('client_contacts.company_id', $context['company_id'])
                ->where('client_contacts.client_id', $clientId)
                ->orderBy('client_contacts.is_primary', 'DESC')
                ->orderBy('client_contacts.contact_name', 'ASC')
                ->orderBy('client_contacts.id', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client contacts retrieved successfully.',
                'data' => ['contacts' => $contacts],
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

        $contact = $this->findContact($context['company_id'], $clientId, $id);
        if ($contact === null) {
            return $this->notFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Client contact retrieved successfully.',
            'data' => ['contact' => $contact],
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
        $data += [
            'is_primary' => 0,
            'receives_billing' => 0,
            'receives_site_updates' => 0,
            'is_active' => 1,
        ];

        $masterError = $this->validateCommunicationMode((int) ($data['communication_mode_id'] ?? 0));
        if ($masterError !== null) {
            return $masterError;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ((int) $data['is_primary'] === 1) {
                $this->clearPrimary($context['company_id'], $clientId, $context['user_id']);
            }

            if (! $this->contacts->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->contacts->errors());
            }

            $id = (int) $this->contacts->getInsertID();
            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Client contact created successfully.',
                    'data' => ['contact' => $this->findContact($context['company_id'], $clientId, $id)],
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

        $existing = $this->contacts
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
        $data['updated_by'] = $context['user_id'];
        $merged = array_merge($existing, $data);

        $masterError = $this->validateCommunicationMode((int) ($merged['communication_mode_id'] ?? 0));
        if ($masterError !== null) {
            return $masterError;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ((int) ($merged['is_primary'] ?? 0) === 1) {
                $this->clearPrimary($context['company_id'], $clientId, $context['user_id'], $id);
            }

            if (! $this->contacts->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->contacts->errors());
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client contact updated successfully.',
                'data' => ['contact' => $this->findContact($context['company_id'], $clientId, $id)],
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

        $contact = $this->contacts
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($contact === null) {
            return $this->notFound();
        }

        try {
            $this->contacts->update($id, ['updated_by' => $context['user_id']]);
            $this->contacts->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client contact deleted successfully.',
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

    private function baseQuery(): ClientContactModel
    {
        return $this->contacts
            ->select([
                'client_contacts.*',
                'communication_modes.mode_code AS communication_mode_code',
                'communication_modes.mode_name AS communication_mode_name',
            ])
            ->join('communication_modes', 'communication_modes.id = client_contacts.communication_mode_id');
    }

    private function findContact(int $companyId, int $clientId, int $id): ?array
    {
        return $this->baseQuery()
            ->where('client_contacts.company_id', $companyId)
            ->where('client_contacts.client_id', $clientId)
            ->find($id);
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'contact_name', 'designation', 'department', 'email', 'phone',
            'alternate_phone', 'communication_mode_id', 'is_primary',
            'receives_billing', 'receives_site_updates', 'notes', 'is_active',
        ]));
    }

    private function validateCommunicationMode(int $communicationModeId): ?ResponseInterface
    {
        if ($communicationModeId <= 0 || db_connect()->table('communication_modes')
            ->where('id', $communicationModeId)
            ->where('is_active', 1)
            ->countAllResults() === 0) {
            return $this->invalid([
                'communication_mode_id' => 'The selected communication mode is invalid.',
            ]);
        }

        return null;
    }

    private function clearPrimary(int $companyId, int $clientId, int $userId, ?int $exceptId = null): void
    {
        $builder = db_connect()->table('client_contacts')
            ->where('company_id', $companyId)
            ->where('client_id', $clientId)
            ->where('deleted_at', null);

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        $builder->update(['is_primary' => 0, 'updated_by' => $userId]);
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
            ->setJSON(['success' => false, 'message' => 'Client contact not found.']);
    }

    private function serverError(Throwable $exception): ResponseInterface
    {
        log_message('error', 'Client contact operation failed: {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the client contact request.']);
    }
}
