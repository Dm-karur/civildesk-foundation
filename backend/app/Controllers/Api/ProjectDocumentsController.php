<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectDocumentModel;
use App\Models\ProjectModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectDocumentsController extends BaseController
{
    private ProjectDocumentModel $documents;
    private ProjectModel $projects;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->documents = new ProjectDocumentModel();
        $this->projects = new ProjectModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();

        try {
            $builder = $this->baseQuery()->where('project_documents.company_id', (int) $user->company_id);
            $projectId = (int) ($this->request->getGet('project_id') ?? 0);
            if ($projectId > 0) {
                if ($this->projectContext($projectId) instanceof ResponseInterface) return $this->notFound('Project not found.');
                $builder->where('project_documents.project_id', $projectId);
            } elseif (! $this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) return $this->successList([]);
                $builder->groupStart()->whereIn('projects.branch_id', $branchIds)->orWhere('projects.branch_id', null)->groupEnd();
            }

            foreach (['site_id', 'document_type_id', 'status_id'] as $field) {
                $value = (int) ($this->request->getGet($field) ?? 0);
                if ($value > 0) $builder->where('project_documents.' . $field, $value);
            }
            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('project_documents.document_title', $search)
                    ->orLike('project_documents.document_number', $search)
                    ->orLike('project_documents.document_code', $search)
                    ->orLike('project_documents.original_file_name', $search)
                    ->groupEnd();
            }
            return $this->successList($builder->orderBy('project_documents.created_at', 'DESC')->findAll());
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $document = $this->accessibleDocument($id);
        if ($document instanceof ResponseInterface) return $document;
        return $this->response->setJSON(['success' => true, 'message' => 'Project document retrieved successfully.', 'data' => ['document' => $document]]);
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();

        $input = $this->request->getPost();
        $data = $this->writableData($input);
        $data['project_id'] = (int) ($data['project_id'] ?? 0);
        $context = $this->projectContext($data['project_id'], true);
        if ($context instanceof ResponseInterface) return $context;

        $data['company_id'] = $context['company_id'];
        $data['uploaded_by'] = $context['user_id'];
        $data += ['site_id' => null, 'version_number' => 1, 'status_id' => 1];

        $type = $this->documentType($context['company_id'], (int) ($data['document_type_id'] ?? 0));
        if ($type === null) return $this->invalid(['document_type_id' => 'The selected project document category is invalid.']);
        $referenceError = $this->validateReferences($data, $context['company_id']);
        if ($referenceError !== null) return $referenceError;
        $dateError = $this->validateDates($data);
        if ($dateError !== null) return $dateError;

        $file = $this->request->getFile('document_file') ?? $this->request->getFile('file');
        $fileError = $this->validateFile($file, $type);
        if ($fileError !== null) return $fileError;
        $stored = $this->storeFile($file, $context['company_id'], $data['project_id']);
        if ($stored instanceof ResponseInterface) return $stored;
        $data = array_merge($data, $stored);

        try {
            if (! $this->documents->insert($data)) {
                $this->removeStoredFile($stored['storage_path']);
                return $this->invalid($this->documents->errors());
            }
            $id = (int) $this->documents->getInsertID();
            return $this->response->setStatusCode(ResponseInterface::HTTP_CREATED)->setJSON([
                'success' => true, 'message' => 'Project document uploaded successfully.',
                'data' => ['document' => $this->findDocument($context['company_id'], $id)],
            ]);
        } catch (Throwable $exception) {
            $this->removeStoredFile($stored['storage_path']);
            return $this->serverError($exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $document = $this->accessibleDocument($id, true);
        if ($document instanceof ResponseInterface) return $document;
        $input = $this->request->getJSON(true);
        if (! is_array($input)) $input = $this->request->getRawInput();
        if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty request body is required.']);

        $data = $this->writableData($input);
        unset($data['project_id']);
        $merged = array_merge($document, $data);
        if ($this->documentType((int) $document['company_id'], (int) $merged['document_type_id']) === null) {
            return $this->invalid(['document_type_id' => 'The selected project document category is invalid.']);
        }
        $referenceError = $this->validateReferences($merged, (int) $document['company_id']);
        if ($referenceError !== null) return $referenceError;
        $dateError = $this->validateDates($merged);
        if ($dateError !== null) return $dateError;

        try {
            if (! $this->documents->update($id, $data)) return $this->invalid($this->documents->errors());
            return $this->response->setJSON(['success' => true, 'message' => 'Project document updated successfully.', 'data' => ['document' => $this->findDocument((int) $document['company_id'], $id)]]);
        } catch (Throwable $exception) { return $this->serverError($exception); }
    }

    public function download(int $id): ResponseInterface
    {
        $document = $this->accessibleDocument($id);
        if ($document instanceof ResponseInterface) return $document;
        $path = WRITEPATH . ltrim((string) $document['storage_path'], '/\\');
        if (! is_file($path)) return $this->notFound('The stored document file was not found.');
        return $this->response->download($path, null)->setFileName((string) $document['original_file_name']);
    }

    public function delete(int $id): ResponseInterface
    {
        $document = $this->accessibleDocument($id, true);
        if ($document instanceof ResponseInterface) return $document;
        try {
            $this->documents->delete($id);
            return $this->response->setJSON(['success' => true, 'message' => 'Project document archived successfully.']);
        } catch (Throwable $exception) { return $this->serverError($exception); }
    }

    private function projectContext(int $projectId, bool $operate = false): array|ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $project = $this->projects->where('company_id', (int) $user->company_id)->find($projectId);
        if ($project === null) return $this->notFound('Project not found.');
        $branchId = (int) ($project['branch_id'] ?? 0);
        if (! $this->authorization->isSuperAdmin($user) && $branchId > 0
            && ! $this->authorization->canAccessBranch($branchId, $operate ? 'OPERATE' : 'VIEW', $user)) {
            return $this->notFound('Project not found.');
        }
        return ['company_id' => (int) $user->company_id, 'user_id' => (int) $user->id, 'project' => $project];
    }

    private function accessibleDocument(int $id, bool $operate = false): array|ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $document = $this->findDocument((int) $user->company_id, $id);
        if ($document === null) return $this->notFound();
        $context = $this->projectContext((int) $document['project_id'], $operate);
        return $context instanceof ResponseInterface ? $context : $document;
    }

    private function baseQuery(): ProjectDocumentModel
    {
        return $this->documents->select([
            'project_documents.*', 'projects.project_code', 'projects.project_name',
            'project_sites.site_code', 'project_sites.site_name',
            'document_types.document_type_code', 'document_types.document_type_name',
            'project_documents_status_masters.status_code',
            'project_documents_status_masters.status_name',
        ])->join('projects', 'projects.id = project_documents.project_id AND projects.company_id = project_documents.company_id')
          ->join('project_sites', 'project_sites.id = project_documents.site_id AND project_sites.project_id = project_documents.project_id', 'left')
          ->join('document_types', 'document_types.id = project_documents.document_type_id AND document_types.company_id = project_documents.company_id')
          ->join('project_documents_status_masters', 'project_documents_status_masters.id = project_documents.status_id');
    }

    private function findDocument(int $companyId, int $id): ?array
    {
        return $this->baseQuery()->where('project_documents.company_id', $companyId)->find($id);
    }

    private function writableData(array $input): array
    {
        if (isset($input['document_category_id']) && ! isset($input['document_type_id'])) $input['document_type_id'] = $input['document_category_id'];
        return array_intersect_key($input, array_flip([
            'project_id', 'site_id', 'document_type_id', 'document_code', 'document_title',
            'document_number', 'revision_number', 'document_date', 'valid_from', 'expiry_date',
            'version_number', 'status_id', 'remarks',
        ]));
    }

    private function documentType(int $companyId, int $typeId): ?array
    {
        if ($typeId <= 0) return null;
        return db_connect()->table('document_types dt')->select('dt.*')
            ->join('document_types_entity_scope_masters es', 'es.id = dt.entity_scope_id')
            ->where(['dt.company_id' => $companyId, 'dt.id' => $typeId, 'dt.is_active' => 1, 'es.entity_scope_code' => 'PROJECT', 'es.is_active' => 1])
            ->where('dt.deleted_at', null)->get()->getRowArray();
    }

    private function validateReferences(array $data, int $companyId): ?ResponseInterface
    {
        $siteId = (int) ($data['site_id'] ?? 0);
        if ($siteId > 0 && db_connect()->table('project_sites')->where([
            'id' => $siteId, 'company_id' => $companyId, 'project_id' => (int) $data['project_id'],
        ])->where('deleted_at', null)->countAllResults() === 0) return $this->invalid(['site_id' => 'The selected site does not belong to this project.']);
        $statusId = (int) ($data['status_id'] ?? 0);
        if ($statusId <= 0 || db_connect()->table('project_documents_status_masters')->where(['id' => $statusId, 'is_active' => 1])->countAllResults() === 0) return $this->invalid(['status_id' => 'The selected document status is invalid.']);
        return null;
    }

    private function validateDates(array $data): ?ResponseInterface
    {
        $from = $data['valid_from'] ?? null; $expiry = $data['expiry_date'] ?? null;
        return ($from && $expiry && $expiry < $from) ? $this->invalid(['expiry_date' => 'Expiry date cannot be earlier than valid from.']) : null;
    }

    private function validateFile(mixed $file, array $type): ?ResponseInterface
    {
        if ($file === null || ! $file->isValid()) return $this->invalid(['document_file' => 'A valid document file is required.']);
        $extension = strtolower((string) $file->getClientExtension());
        $allowed = array_values(array_filter(array_map(static fn(string $v): string => strtolower(ltrim(trim($v), '.')), explode(',', (string) ($type['allowed_extensions'] ?? '')))));
        if ($allowed !== [] && ! in_array($extension, $allowed, true)) return $this->invalid(['document_file' => 'Allowed file extensions: ' . implode(', ', $allowed) . '.']);
        $maximum = (int) round((float) ($type['maximum_file_size_mb'] ?? 10) * 1024 * 1024);
        if ($maximum > 0 && $file->getSize() > $maximum) return $this->invalid(['document_file' => 'The file exceeds the ' . $type['maximum_file_size_mb'] . ' MB limit.']);
        return null;
    }

    private function storeFile(mixed $file, int $companyId, int $projectId): array|ResponseInterface
    {
        $directory = WRITEPATH . 'uploads/project_documents/' . $companyId . '/' . $projectId;
        try {
            if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) throw new \RuntimeException('Unable to create storage directory.');
            $name = $file->getRandomName(); $original = basename((string) $file->getClientName());
            $extension = strtolower((string) $file->getClientExtension()); $mime = (string) $file->getMimeType(); $size = (int) $file->getSize();
            $file->move($directory, $name); $relative = 'uploads/project_documents/' . $companyId . '/' . $projectId . '/' . $name;
            return ['file_name' => $name, 'original_file_name' => $original, 'storage_path' => $relative, 'file_extension' => $extension, 'mime_type' => $mime, 'file_size_bytes' => $size, 'file_hash_sha256' => hash_file('sha256', WRITEPATH . $relative)];
        } catch (Throwable $exception) { log_message('error', 'Project document storage failed: {message}', ['message' => $exception->getMessage()]); return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => 'Unable to store the uploaded document.']); }
    }

    private function removeStoredFile(string $path): void { $absolute = WRITEPATH . ltrim($path, '/\\'); if (is_file($absolute)) @unlink($absolute); }
    private function successList(array $documents): ResponseInterface { return $this->response->setJSON(['success' => true, 'message' => 'Project documents retrieved successfully.', 'data' => ['documents' => $documents]]); }
    private function unauthorized(): ResponseInterface { return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']); }
    private function invalid(array $errors): ResponseInterface { return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]); }
    private function notFound(string $message = 'Project document not found.'): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => $message]); }
    private function serverError(Throwable $exception): ResponseInterface { log_message('error', 'Project document operation failed: {message}', ['message' => $exception->getMessage()]); return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => 'Unable to process the project document request.']); }
}
