<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\FinancialYearModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class FinancialYearsController extends BaseController
{
    private FinancialYearModel $financialYears;

    public function __construct()
    {
        $this->financialYears = new FinancialYearModel();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('financial_years.company_id', (int) $user->company_id);

            $statusId = $this->request->getGet('status_id');
            if ($statusId !== null && ctype_digit((string) $statusId)) {
                $builder->where('financial_years.status_id', (int) $statusId);
            }

            foreach (['is_current', 'is_active'] as $filter) {
                $value = $this->request->getGet($filter);
                if ($value !== null && in_array((string) $value, ['0', '1'], true)) {
                    $builder->where('financial_years.' . $filter, (int) $value);
                }
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('financial_years.year_code', $search)
                    ->orLike('financial_years.year_name', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Financial years retrieved successfully.',
                'data' => [
                    'financial_years' => $builder
                        ->orderBy('financial_years.start_date', 'DESC')
                        ->findAll(),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Financial year list retrieval failed.', $exception);
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
                ->where('financial_years.company_id', (int) $user->company_id)
                ->find($id);

            if ($record === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Financial year retrieved successfully.',
                'data' => ['financial_year' => $record],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Financial year retrieval failed.', $exception);
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
        $data += ['is_current' => 0, 'is_active' => 1];

        $errors = $this->businessValidation($data, (int) $user->company_id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ((int) $data['is_current'] === 1) {
                $this->clearCurrentYear($db, (int) $user->company_id, (int) $user->id);
            }

            $this->applyClosureAudit($data, (int) $user->id);

            if (! $this->financialYears->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->financialYears->errors());
            }

            $id = (int) $this->financialYears->getInsertID();
            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Financial year created successfully.',
                    'data' => ['financial_year' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Financial year creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->financialYears
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
            return $this->invalid(['body' => 'No writable financial-year fields were supplied.']);
        }

        $merged = array_merge($existing, $data);
        $errors = $this->businessValidation($merged, (int) $user->company_id, $id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        $data['updated_by'] = (int) $user->id;
        $db = db_connect();
        $db->transBegin();

        try {
            if (array_key_exists('is_current', $data) && (int) $data['is_current'] === 1) {
                $this->clearCurrentYear($db, (int) $user->company_id, (int) $user->id, $id);
            }

            if (array_key_exists('status_id', $data)) {
                $this->applyClosureAudit($data, (int) $user->id, (int) $merged['status_id']);
            }

            if (! $this->financialYears->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->financialYears->errors());
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Financial year updated successfully.',
                'data' => ['financial_year' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Financial year update failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $record = $this->financialYears
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($record === null) {
            return $this->notFound();
        }

        if ((int) $record['is_current'] === 1) {
            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                ->setJSON([
                    'success' => false,
                    'message' => 'The current financial year cannot be deleted.',
                ]);
        }

        try {
            $references = [
                ['table' => 'projects', 'soft_delete' => true],
                ['table' => 'project_budgets', 'soft_delete' => true],
                ['table' => 'project_cashflow_forecasts', 'soft_delete' => false],
            ];

            foreach ($references as $reference) {
                $builder = db_connect()->table($reference['table'])
                    ->where('company_id', (int) $user->company_id)
                    ->where('financial_year_id', $id);

                if ($reference['soft_delete']) {
                    $builder->where('deleted_at', null);
                }

                if ($builder->countAllResults() > 0) {
                    return $this->response
                        ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                        ->setJSON([
                            'success' => false,
                            'message' => 'Financial year is in use and cannot be deleted.',
                        ]);
                }
            }

            $this->financialYears->update($id, ['updated_by' => (int) $user->id]);
            $this->financialYears->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Financial year deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Financial year deletion failed.', $exception);
        }
    }

    private function baseQuery(): FinancialYearModel
    {
        return $this->financialYears
            ->select([
                'financial_years.*',
                'financial_years_status_masters.status_code',
                'financial_years_status_masters.status_name',
                'TRIM(CONCAT(COALESCE(closed_user.first_name, ""), " ", COALESCE(closed_user.last_name, ""))) AS closed_by_name',
            ])
            ->join(
                'financial_years_status_masters',
                'financial_years_status_masters.id = financial_years.status_id'
            )
            ->join('users AS closed_user', 'closed_user.id = financial_years.closed_by', 'left');
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'year_code', 'year_name', 'start_date', 'end_date',
            'status_id', 'is_current', 'is_active',
        ]));
    }

    private function businessValidation(array $data, int $companyId, ?int $ignoreId = null): array
    {
        $errors = [];
        $statusId = (int) ($data['status_id'] ?? 0);

        if (! $this->statusExists($statusId)) {
            $errors['status_id'] = 'Select a valid active financial-year status.';
        }

        $startDate = (string) ($data['start_date'] ?? '');
        $endDate = (string) ($data['end_date'] ?? '');
        if ($startDate !== '' && $endDate !== '' && $endDate <= $startDate) {
            $errors['end_date'] = 'End date must be after start date.';
        }

        if ($startDate !== '' && $endDate !== '') {
            $overlap = db_connect()->table('financial_years')
                ->where('company_id', $companyId)
                ->where('deleted_at', null)
                ->where('start_date <=', $endDate)
                ->where('end_date >=', $startDate);

            if ($ignoreId !== null) {
                $overlap->where('id !=', $ignoreId);
            }

            if ($overlap->countAllResults() > 0) {
                $errors['date_range'] = 'Financial-year dates overlap an existing active record.';
            }
        }

        foreach (['is_current', 'is_active'] as $booleanField) {
            if (isset($data[$booleanField])
                && ! in_array((string) $data[$booleanField], ['0', '1'], true)) {
                $errors[$booleanField] = ucfirst(str_replace('_', ' ', $booleanField))
                    . ' must be 0 or 1.';
            }
        }

        return $errors;
    }

    private function statusExists(int $id): bool
    {
        return $id > 0 && db_connect()->table('financial_years_status_masters')
            ->where('id', $id)
            ->where('is_active', 1)
            ->countAllResults() === 1;
    }

    private function applyClosureAudit(array &$data, int $userId, ?int $statusId = null): void
    {
        $statusId ??= (int) ($data['status_id'] ?? 0);
        if ($statusId <= 0) {
            return;
        }

        $status = db_connect()->table('financial_years_status_masters')
            ->select('status_code')
            ->where('id', $statusId)
            ->get()->getRowArray();
        $statusCode = strtoupper((string) ($status['status_code'] ?? ''));

        if (in_array($statusCode, ['CLOSED', 'LOCKED'], true)) {
            $data['closed_by'] = $userId;
            $data['closed_at'] = date('Y-m-d H:i:s');
            $data['is_current'] = 0;
            return;
        }

        $data['closed_by'] = null;
        $data['closed_at'] = null;
    }

    private function clearCurrentYear(
        BaseConnection $db,
        int $companyId,
        int $userId,
        ?int $exceptId = null
    ): void {
        $builder = $db->table('financial_years')
            ->where('company_id', $companyId)
            ->where('is_current', 1)
            ->where('deleted_at', null);

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        $builder->update([
            'is_current' => 0,
            'updated_by' => $userId,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
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
            ->setJSON(['success' => false, 'message' => 'Financial year not found.']);
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
        log_message('warning', 'Financial year database conflict: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON([
                'success' => false,
                'message' => 'Financial-year code, date range or current-year selection conflicts with existing data.',
            ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the financial-year request.']);
    }
}
