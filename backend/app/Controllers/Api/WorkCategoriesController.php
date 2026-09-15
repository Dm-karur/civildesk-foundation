<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\WorkCategoryModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class WorkCategoriesController extends BaseController
{
    private WorkCategoryModel $categories;

    public function __construct()
    {
        $this->categories = new WorkCategoryModel();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('work_categories.company_id', (int) $user->company_id);

            foreach (['parent_id', 'work_stage_id', 'progress_method_id'] as $filter) {
                $value = $this->request->getGet($filter);
                if ($value !== null && ctype_digit((string) $value)) {
                    $builder->where('work_categories.' . $filter, (int) $value);
                }
            }

            $rootOnly = $this->request->getGet('root_only');
            if ($rootOnly !== null && in_array((string) $rootOnly, ['0', '1'], true)) {
                if ((string) $rootOnly === '1') {
                    $builder->where('work_categories.parent_id', null);
                } else {
                    $builder->where('work_categories.parent_id IS NOT NULL', null, false);
                }
            }

            $isActive = $this->request->getGet('is_active');
            if ($isActive !== null && in_array((string) $isActive, ['0', '1'], true)) {
                $builder->where('work_categories.is_active', (int) $isActive);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('work_categories.category_code', $search)
                    ->orLike('work_categories.category_name', $search)
                    ->orLike('work_categories.description', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work categories retrieved successfully.',
                'data' => [
                    'work_categories' => $builder
                        ->orderBy('work_categories.display_order', 'ASC')
                        ->orderBy('work_categories.category_name', 'ASC')
                        ->findAll(),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Work-category list retrieval failed.', $exception);
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
                ->where('work_categories.company_id', (int) $user->company_id)
                ->find($id);

            if ($record === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work category retrieved successfully.',
                'data' => ['work_category' => $record],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Work-category retrieval failed.', $exception);
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
            'parent_id' => null,
            'display_order' => 0,
            'is_active' => 1,
        ];

        $errors = $this->businessValidation($data, (int) $user->company_id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (! $this->categories->insert($data)) {
                return $this->invalid($this->categories->errors());
            }

            $id = (int) $this->categories->getInsertID();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Work category created successfully.',
                    'data' => ['work_category' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Work-category creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->categories
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
        if ($data === []) {
            return $this->invalid(['body' => 'No writable work-category fields were supplied.']);
        }

        $merged = array_merge($existing, $data);
        $errors = $this->businessValidation(
            $merged,
            (int) $user->company_id,
            $id
        );
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        $data['updated_by'] = (int) $user->id;

        try {
            if (! $this->categories->update($id, $data)) {
                return $this->invalid($this->categories->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work category updated successfully.',
                'data' => ['work_category' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Work-category update failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $record = $this->categories
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($record === null) {
            return $this->notFound();
        }

        try {
            $activeChildren = db_connect()->table('work_categories')
                ->where('company_id', (int) $user->company_id)
                ->where('parent_id', $id)
                ->where('deleted_at', null)
                ->countAllResults();

            if ($activeChildren > 0) {
                return $this->inUse('Work category has child categories and cannot be deleted.');
            }

            foreach ([['boq_items', 'work_category_id'], ['project_budget_lines', 'work_category_id']] as [$table, $column]) {
                if (db_connect()->table($table)->where($column, $id)->countAllResults() > 0) {
                    return $this->inUse('Work category is in use and cannot be deleted.');
                }
            }

            $this->categories->update($id, ['updated_by' => (int) $user->id]);
            $this->categories->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Work category deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Work-category deletion failed.', $exception);
        }
    }

    private function baseQuery(): WorkCategoryModel
    {
        return $this->categories
            ->select([
                'work_categories.*',
                'parent.category_code AS parent_code',
                'parent.category_name AS parent_name',
                'work_categories_work_stage_masters.work_stage_code',
                'work_categories_work_stage_masters.work_stage_name',
                'work_categories_progress_method_masters.progress_method_code',
                'work_categories_progress_method_masters.progress_method_name',
            ])
            ->join('work_categories AS parent', 'parent.id = work_categories.parent_id', 'left')
            ->join(
                'work_categories_work_stage_masters',
                'work_categories_work_stage_masters.id = work_categories.work_stage_id'
            )
            ->join(
                'work_categories_progress_method_masters',
                'work_categories_progress_method_masters.id = work_categories.progress_method_id'
            );
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'parent_id', 'category_code', 'category_name', 'work_stage_id',
            'progress_method_id', 'description', 'display_order', 'is_active',
        ]));
    }

    private function businessValidation(
        array $data,
        int $companyId,
        ?int $ignoreId = null
    ): array {
        $errors = [];
        $db = db_connect();

        foreach ([
            'work_stage_id' => [
                'table' => 'work_categories_work_stage_masters',
                'message' => 'Select a valid active work stage.',
            ],
            'progress_method_id' => [
                'table' => 'work_categories_progress_method_masters',
                'message' => 'Select a valid active progress method.',
            ],
        ] as $field => $definition) {
            $value = (int) ($data[$field] ?? 0);
            if ($value <= 0 || $db->table($definition['table'])
                ->where('id', $value)
                ->where('is_active', 1)
                ->countAllResults() !== 1) {
                $errors[$field] = $definition['message'];
            }
        }

        $parentId = $data['parent_id'] ?? null;
        if ($parentId !== null && $parentId !== '') {
            $parentId = (int) $parentId;
            $parent = $db->table('work_categories')
                ->select('id')
                ->where('id', $parentId)
                ->where('company_id', $companyId)
                ->where('deleted_at', null)
                ->get()->getRowArray();

            if ($parentId <= 0 || $parent === null) {
                $errors['parent_id'] = 'Select a valid work category from the same company.';
            } elseif ($ignoreId !== null && (
                $parentId === $ignoreId || $this->isDescendant($parentId, $ignoreId, $companyId)
            )) {
                $errors['parent_id'] = 'A category cannot use itself or one of its descendants as parent.';
            }
        }

        $displayOrder = $data['display_order'] ?? null;
        if (! is_numeric($displayOrder)
            || (int) $displayOrder < 0
            || (string) (int) $displayOrder !== (string) $displayOrder) {
            $errors['display_order'] = 'Display order must be zero or a positive whole number.';
        }

        if (isset($data['is_active'])
            && ! in_array((string) $data['is_active'], ['0', '1'], true)) {
            $errors['is_active'] = 'Is active must be 0 or 1.';
        }

        $code = strtoupper(trim((string) ($data['category_code'] ?? '')));
        if ($code !== '') {
            $duplicate = $db->table('work_categories')
                ->where('company_id', $companyId)
                ->where('category_code', $code)
                ->where('deleted_at', null);

            if ($ignoreId !== null) {
                $duplicate->where('id !=', $ignoreId);
            }

            if ($duplicate->countAllResults() > 0) {
                $errors['category_code'] = 'Work-category code already exists for this company.';
            }
        }

        return $errors;
    }

    private function isDescendant(int $candidateId, int $categoryId, int $companyId): bool
    {
        $currentId = $candidateId;
        $visited = [];

        while ($currentId > 0 && ! isset($visited[$currentId])) {
            $visited[$currentId] = true;
            $row = db_connect()->table('work_categories')
                ->select('parent_id')
                ->where('id', $currentId)
                ->where('company_id', $companyId)
                ->where('deleted_at', null)
                ->get()->getRowArray();

            if ($row === null || $row['parent_id'] === null) {
                return false;
            }

            $currentId = (int) $row['parent_id'];
            if ($currentId === $categoryId) {
                return true;
            }
        }

        return false;
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
            ->setJSON(['success' => false, 'message' => 'Work category not found.']);
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

    private function inUse(string $message): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON(['success' => false, 'message' => $message]);
    }

    private function conflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'Work-category database conflict: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON([
                'success' => false,
                'message' => 'Work-category code conflicts with existing company data.',
            ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the work-category request.']);
    }
}
