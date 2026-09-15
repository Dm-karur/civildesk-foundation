<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UnitOfMeasurementModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class UnitsOfMeasurementController extends BaseController
{
    private UnitOfMeasurementModel $units;

    public function __construct()
    {
        $this->units = new UnitOfMeasurementModel();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('units_of_measurement.company_id', (int) $user->company_id);

            $unitTypeId = $this->request->getGet('unit_type_id');
            if ($unitTypeId !== null && ctype_digit((string) $unitTypeId)) {
                $builder->where('units_of_measurement.unit_type_id', (int) $unitTypeId);
            }

            foreach (['is_system_defined', 'is_active'] as $filter) {
                $value = $this->request->getGet($filter);
                if ($value !== null && in_array((string) $value, ['0', '1'], true)) {
                    $builder->where('units_of_measurement.' . $filter, (int) $value);
                }
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('units_of_measurement.unit_code', $search)
                    ->orLike('units_of_measurement.unit_name', $search)
                    ->orLike('units_of_measurement.unit_symbol', $search)
                    ->groupEnd();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Units of measurement retrieved successfully.',
                'data' => [
                    'units_of_measurement' => $builder
                        ->orderBy('units_of_measurement.display_order', 'ASC')
                        ->orderBy('units_of_measurement.unit_name', 'ASC')
                        ->findAll(),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Unit list retrieval failed.', $exception);
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
                ->where('units_of_measurement.company_id', (int) $user->company_id)
                ->find($id);

            if ($record === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Unit of measurement retrieved successfully.',
                'data' => ['unit_of_measurement' => $record],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Unit retrieval failed.', $exception);
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
        $data['is_system_defined'] = 0;
        $data += ['decimal_places' => 2, 'display_order' => 0, 'is_active' => 1];

        $errors = $this->businessValidation($data, (int) $user->company_id);
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        try {
            if (! $this->units->insert($data)) {
                return $this->invalid($this->units->errors());
            }

            $id = (int) $this->units->getInsertID();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Unit of measurement created successfully.',
                    'data' => ['unit_of_measurement' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Unit creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->units
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
            return $this->invalid(['body' => 'No writable unit fields were supplied.']);
        }

        if ((int) $existing['is_system_defined'] === 1) {
            foreach (['unit_code', 'unit_type_id'] as $protectedField) {
                if (array_key_exists($protectedField, $data)
                    && (string) $data[$protectedField] !== (string) $existing[$protectedField]) {
                    return $this->invalid([
                        $protectedField => 'This field cannot be changed for a system-defined unit.',
                    ]);
                }
            }
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
            if (! $this->units->update($id, $data)) {
                return $this->invalid($this->units->errors());
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Unit of measurement updated successfully.',
                'data' => ['unit_of_measurement' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            return $this->conflict($exception);
        } catch (Throwable $exception) {
            return $this->serverError('Unit update failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $record = $this->units
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($record === null) {
            return $this->notFound();
        }

        if ((int) $record['is_system_defined'] === 1) {
            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                ->setJSON([
                    'success' => false,
                    'message' => 'A system-defined unit cannot be deleted.',
                ]);
        }

        try {
            foreach ($this->referenceColumns() as [$table, $column]) {
                if (db_connect()->table($table)->where($column, $id)->countAllResults() > 0) {
                    return $this->response
                        ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
                        ->setJSON([
                            'success' => false,
                            'message' => 'Unit is in use and cannot be deleted.',
                        ]);
                }
            }

            $this->units->update($id, ['updated_by' => (int) $user->id]);
            $this->units->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Unit of measurement deleted successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Unit deletion failed.', $exception);
        }
    }

    private function baseQuery(): UnitOfMeasurementModel
    {
        return $this->units
            ->select([
                'units_of_measurement.*',
                'units_of_measurement_unit_type_masters.unit_type_code',
                'units_of_measurement_unit_type_masters.unit_type_name',
            ])
            ->join(
                'units_of_measurement_unit_type_masters',
                'units_of_measurement_unit_type_masters.id = units_of_measurement.unit_type_id'
            );
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'unit_code', 'unit_name', 'unit_symbol', 'unit_type_id',
            'decimal_places', 'description', 'display_order', 'is_active',
        ]));
    }

    private function businessValidation(
        array $data,
        int $companyId,
        ?int $ignoreId = null
    ): array {
        $errors = [];
        $unitTypeId = (int) ($data['unit_type_id'] ?? 0);

        if ($unitTypeId <= 0 || db_connect()
            ->table('units_of_measurement_unit_type_masters')
            ->where('id', $unitTypeId)
            ->where('is_active', 1)
            ->countAllResults() !== 1) {
            $errors['unit_type_id'] = 'Select a valid active unit type.';
        }

        $decimalPlaces = $data['decimal_places'] ?? null;
        if (! is_numeric($decimalPlaces)
            || (int) $decimalPlaces < 0
            || (int) $decimalPlaces > 6
            || (string) (int) $decimalPlaces !== (string) $decimalPlaces) {
            $errors['decimal_places'] = 'Decimal places must be a whole number from 0 to 6.';
        }

        foreach (['display_order'] as $integerField) {
            $value = $data[$integerField] ?? null;
            if (! is_numeric($value)
                || (int) $value < 0
                || (string) (int) $value !== (string) $value) {
                $errors[$integerField] = 'Display order must be zero or a positive whole number.';
            }
        }

        if (isset($data['is_active'])
            && ! in_array((string) $data['is_active'], ['0', '1'], true)) {
            $errors['is_active'] = 'Is active must be 0 or 1.';
        }

        $code = strtoupper(trim((string) ($data['unit_code'] ?? '')));
        if ($code !== '') {
            $duplicate = db_connect()->table('units_of_measurement')
                ->where('company_id', $companyId)
                ->where('unit_code', $code)
                ->where('deleted_at', null);

            if ($ignoreId !== null) {
                $duplicate->where('id !=', $ignoreId);
            }

            if ($duplicate->countAllResults() > 0) {
                $errors['unit_code'] = 'Unit code already exists for this company.';
            }
        }

        return $errors;
    }

    private function referenceColumns(): array
    {
        return [
            ['boq_items', 'uom_id'],
            ['daily_material_consumption', 'uom_id'],
            ['daily_work_progress', 'uom_id'],
            ['materials', 'base_uom_id'],
            ['material_purchase_order_items', 'uom_id'],
            ['material_receipt_items', 'uom_id'],
            ['material_request_items', 'uom_id'],
            ['material_transaction_items', 'uom_id'],
            ['project_budget_lines', 'uom_id'],
            ['site_units', 'area_uom_id'],
            ['subcontract_work_order_items', 'uom_id'],
        ];
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
            ->setJSON(['success' => false, 'message' => 'Unit of measurement not found.']);
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
        log_message('warning', 'Unit database conflict: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON([
                'success' => false,
                'message' => 'Unit code conflicts with existing company data.',
            ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);

        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the unit request.']);
    }
}
