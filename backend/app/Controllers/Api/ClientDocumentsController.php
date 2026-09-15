<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ClientDocumentModel;
use App\Models\ClientModel;
use CodeIgniter\Files\File;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ClientDocumentsController extends BaseController
{
    private ClientDocumentModel $documents;
    private ClientModel $clients;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->documents = new ClientDocumentModel();
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
            $builder = $this->baseQuery()
                ->where('client_documents.company_id', $context['company_id'])
                ->where('client_documents.client_id', $clientId);

            $typeId = (int) $this->request->getGet('document_type_id');
            $statusId = (int) $this->request->getGet('client_document_status_id');
            $search = trim((string) $this->request->getGet('search'));

            if ($typeId > 0) {
                $builder->where('client_documents.document_type_id', $typeId);
            }
            if ($statusId > 0) {
                $builder->where('client_documents.client_document_status_id', $statusId);
            }
            if ($search !== '') {
                $builder->groupStart()
                    ->like('client_documents.document_title', $search)
                    ->orLike('client_documents.document_number', $search)
                    ->orLike('client_documents.original_file_name', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client documents retrieved successfully.',
                'data' => [
                    'documents' => $builder
                        ->orderBy('client_documents.created_at', 'DESC')
                        ->orderBy('client_documents.id', 'DESC')
                        ->findAll(),
                ],
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

        $document = $this->findDocument($context['company_id'], $clientId, $id);
        if ($document === null) {
            return $this->notFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Client document retrieved successfully.',
            'data' => ['document' => $document],
        ]);
    }

    public function create(int $clientId): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $data = $this->writableData($this->request->getPost());
        $data['company_id'] = $context['company_id'];
        $data['client_id'] = $clientId;
        $data['uploaded_by'] = $context['user_id'];
        $data += [
            'version_number' => 1,
            'client_document_status_id' => 1,
            'is_confidential' => 0,
        ];

        $master = $this->documentType(
            $context['company_id'],
            (int) ($data['document_type_id'] ?? 0)
        );
        if ($master === null) {
            return $this->invalid(['document_type_id' => 'The selected client document type is invalid.']);
        }

        $statusError = $this->validateStatus((int) ($data['client_document_status_id'] ?? 0));
        if ($statusError !== null) {
            return $statusError;
        }

        $dateError = $this->validateDates($data);
        if ($dateError !== null) {
            return $dateError;
        }

        $file = $this->request->getFile('document_file');
        $fileError = $this->validateFile($file, $master);
        if ($fileError !== null) {
            return $fileError;
        }

        $stored = $this->storeFile($file, $context['company_id'], $clientId);
        if ($stored instanceof ResponseInterface) {
            return $stored;
        }
        $data = array_merge($data, $stored);

        try {
            if (! $this->documents->insert($data)) {
                $this->removeStoredFile($stored['file_path']);
                return $this->invalid($this->documents->errors());
            }

            $id = (int) $this->documents->getInsertID();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Client document uploaded successfully.',
                    'data' => ['document' => $this->findDocument($context['company_id'], $clientId, $id)],
                ]);
        } catch (Throwable $exception) {
            $this->removeStoredFile($stored['file_path']);
            return $this->serverError($exception);
        }
    }

    public function update(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $existing = $this->documents
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($existing === null) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            $input = $this->request->getRawInput();
        }
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON or form request body is required.']);
        }

        $data = $this->writableData($input);
        $merged = array_merge($existing, $data);

        if ($this->documentType($context['company_id'], (int) $merged['document_type_id']) === null) {
            return $this->invalid(['document_type_id' => 'The selected client document type is invalid.']);
        }

        $statusError = $this->validateStatus((int) $merged['client_document_status_id']);
        if ($statusError !== null) {
            return $statusError;
        }

        $dateError = $this->validateDates($merged);
        if ($dateError !== null) {
            return $dateError;
        }

        try {
            if (! $this->documents->update($id, $data)) {
                return $this->invalid($this->documents->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client document updated successfully.',
                'data' => ['document' => $this->findDocument($context['company_id'], $clientId, $id)],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    public function download(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $document = $this->documents
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($document === null) {
            return $this->notFound();
        }

        $absolutePath = WRITEPATH . ltrim((string) $document['file_path'], '/\\');
        if (! is_file($absolutePath)) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
                ->setJSON(['success' => false, 'message' => 'The stored document file was not found.']);
        }

        return $this->response
            ->download($absolutePath, null)
            ->setFileName((string) $document['original_file_name']);
    }

    public function delete(int $clientId, int $id): ResponseInterface
    {
        $context = $this->clientContext($clientId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $document = $this->documents
            ->where('company_id', $context['company_id'])
            ->where('client_id', $clientId)
            ->find($id);
        if ($document === null) {
            return $this->notFound();
        }

        try {
            $this->documents->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Client document deleted successfully.',
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

    private function baseQuery(): ClientDocumentModel
    {
        return $this->documents
            ->select([
                'client_documents.*',
                'document_types.document_type_code',
                'document_types.document_type_name',
                'client_document_statuses.status_code AS document_status_code',
                'client_document_statuses.status_name AS document_status_name',
            ])
            ->join(
                'document_types',
                'document_types.company_id = client_documents.company_id'
                . ' AND document_types.id = client_documents.document_type_id'
            )
            ->join(
                'client_document_statuses',
                'client_document_statuses.id = client_documents.client_document_status_id'
            );
    }

    private function findDocument(int $companyId, int $clientId, int $id): ?array
    {
        return $this->baseQuery()
            ->where('client_documents.company_id', $companyId)
            ->where('client_documents.client_id', $clientId)
            ->find($id);
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'document_type_id',
            'document_number',
            'document_title',
            'document_date',
            'valid_from',
            'valid_until',
            'client_document_status_id',
            'is_confidential',
            'remarks',
        ]));
    }

    private function documentType(int $companyId, int $documentTypeId): ?array
    {
        if ($documentTypeId <= 0) {
            return null;
        }

        return db_connect()->table('document_types')
            ->select('document_types.*')
            ->join(
                'document_types_entity_scope_masters',
                'document_types_entity_scope_masters.id = document_types.entity_scope_id'
            )
            ->where('document_types.company_id', $companyId)
            ->where('document_types.id', $documentTypeId)
            ->where('document_types.is_active', 1)
            ->where('document_types.deleted_at', null)
            ->where('document_types_entity_scope_masters.entity_scope_code', 'CLIENT')
            ->where('document_types_entity_scope_masters.is_active', 1)
            ->get()->getRowArray();
    }

    private function validateStatus(int $statusId): ?ResponseInterface
    {
        if ($statusId <= 0 || db_connect()->table('client_document_statuses')
            ->where('id', $statusId)
            ->where('is_active', 1)
            ->countAllResults() === 0) {
            return $this->invalid([
                'client_document_status_id' => 'The selected client document status is invalid.',
            ]);
        }

        return null;
    }

    private function validateDates(array $data): ?ResponseInterface
    {
        $from = $data['valid_from'] ?? null;
        $until = $data['valid_until'] ?? null;

        if ($from !== null && $from !== '' && $until !== null && $until !== '' && $until < $from) {
            return $this->invalid(['valid_until' => 'Valid until cannot be earlier than valid from.']);
        }

        return null;
    }

    private function validateFile(mixed $file, array $documentType): ?ResponseInterface
    {
        if ($file === null || ! $file->isValid()) {
            return $this->invalid(['document_file' => 'A valid document file is required.']);
        }

        $extension = strtolower((string) $file->getClientExtension());
        $allowed = array_values(array_filter(array_map(
            static fn (string $value): string => strtolower(trim($value)),
            explode(',', (string) ($documentType['allowed_extensions'] ?? ''))
        )));

        if ($allowed !== [] && ! in_array($extension, $allowed, true)) {
            return $this->invalid([
                'document_file' => 'Allowed file extensions: ' . implode(', ', $allowed) . '.',
            ]);
        }

        $maximumBytes = (int) round((float) $documentType['maximum_file_size_mb'] * 1024 * 1024);
        if ($maximumBytes > 0 && $file->getSize() > $maximumBytes) {
            return $this->invalid([
                'document_file' => 'The file exceeds the '
                    . $documentType['maximum_file_size_mb'] . ' MB limit.',
            ]);
        }

        return null;
    }

    private function storeFile(mixed $file, int $companyId, int $clientId): array|ResponseInterface
    {
        $directory = WRITEPATH . 'uploads/client_documents/' . $companyId . '/' . $clientId;

        try {
            if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) {
                throw new \RuntimeException('Unable to create the document storage directory.');
            }

            $storedName = $file->getRandomName();
            $originalName = basename((string) $file->getClientName());
            $extension = strtolower((string) $file->getClientExtension());
            $mimeType = (string) $file->getMimeType();
            $fileSize = (int) $file->getSize();
            $file->move($directory, $storedName);

            $absolutePath = $directory . DIRECTORY_SEPARATOR . $storedName;

            return [
                'original_file_name' => $originalName,
                'stored_file_name' => $storedName,
                'file_path' => 'uploads/client_documents/' . $companyId . '/' . $clientId . '/' . $storedName,
                'file_extension' => $extension,
                'mime_type' => $mimeType,
                'file_size_bytes' => $fileSize,
                'file_hash_sha256' => hash_file('sha256', $absolutePath),
            ];
        } catch (Throwable $exception) {
            log_message('error', 'Client document file storage failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
                ->setJSON(['success' => false, 'message' => 'Unable to store the uploaded document.']);
        }
    }

    private function removeStoredFile(string $relativePath): void
    {
        $absolutePath = WRITEPATH . ltrim($relativePath, '/\\');
        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }
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
            ->setJSON(['success' => false, 'message' => 'Client document not found.']);
    }

    private function serverError(Throwable $exception): ResponseInterface
    {
        log_message('error', 'Client document operation failed: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the client document request.']);
    }
}
