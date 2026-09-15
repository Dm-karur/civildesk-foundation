<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ProjectTypeModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectTypesController extends BaseController
{
    private ProjectTypeModel $projectTypes;

    public function __construct()
    {
        $this->projectTypes = new ProjectTypeModel();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('project_types.company_id', (int) $user->company_id);

            $active = $this->request->getGet('is_active');
            if ($active !== null && in_array((string) $active, ['0', '1'], true)) {
                $builder->where('project_types.is_active', (int) $active);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('project_types.project_type_code', $search)
                    ->orLike('project_types.project_type_name', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project types retrieved successfully.',
                'data' => [
                    'project_types' => $builder
                        ->orderBy('project_types.display_order', 'ASC')
                        ->orderBy('project_types.project_type_name', 'ASC')
                        ->findAll(),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project type list retrieval failed.', $exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $record = $this->baseQuery()
                ->where('project_types.company_id', (int) $user->company_id)
                ->find($id);

            if ($record === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project type retrieved successfully.',
                'data' => ['project_type' => $record],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project type retrieval failed.', $exception);
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
        $data += ['display_order' => 0, 'is_active' => 1];

        if (! $this->billingMethodExists((int) ($data['billing_method_id'] ?? 0))) {
            return $this->invalid(['billing_method_id' => 'Select a valid active billing method.']);
        }

        try {
            if (! $this->projectTypes->insert($data)) {
                return $this->invalid($this->projectTypes->errors());
            }

            $id = (int) $this->projectTypes->getInsertID();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Project type created successfully.',
                    'data' => ['project_type' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Project type creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->projectTypes
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['company_id'], $data['created_by']);
        $data['updated_by'] = (int) $user->id;
        $billingMethodId = (int) ($data['billing_method_id'] ?? $existing['billing_method_id']);

        if (! $this->billingMethodExists($billingMethodId)) {
            return $this->invalid(['billing_method_id' => 'Select a valid active billing method.']);
        }

        try {
            if (! $this->projectTypes->update($id, $data)) {
                return $this->invalid($this->projectTypes->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project type updated successfully.',
                'data' => ['project_type' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Project type update failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $record = $this->projectTypes
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($record === null) {
            return $this->notFound();
        }

        try {
            if (db_connect()->table('projects')
                ->where('company_id', (int) $user->company_id)
                ->where('project_type_id', $id)
                ->where('deleted_at', null)
                ->countAllResults() > 0) {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Project type is in use and cannot be deleted.',
                    ]);
            }

            $this->projectTypes->update($id, ['updated_by' => (int) $user->id]);
            $this->projectTypes->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project type deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Project type deletion failed.', $exception);
        }
    }

    private function baseQuery(): ProjectTypeModel
    {
        return $this->projectTypes
            ->select([
                'project_types.*',
                'billing_methods.method_code AS billing_method_code',
                'billing_methods.method_name AS billing_method_name',
            ])
            ->join('billing_methods', 'billing_methods.id = project_types.billing_method_id');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'project_type_code',
            'project_type_name',
            'billing_method_id',
            'default_duration_days',
            'description',
            'display_order',
            'is_active',
        ]));
    }

    private function billingMethodExists(int $id): bool
    {
        return $id > 0 && db_connect()->table('billing_methods')
            ->where('id', $id)
            ->where('is_active', 1)
            ->countAllResults() === 1;
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON(['success' => false, 'message' => 'Authentication required.']);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Project type not found.']);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $errors,
            ]);
    }

    private function conflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'Project type database conflict: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON([
                'success' => false,
                'message' => 'Project type code already exists for this company or the record conflicts with existing data.',
            ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the project type request.']);
    }
}
