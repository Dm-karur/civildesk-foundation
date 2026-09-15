<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectModel extends Model
{
    protected $table            = 'projects';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'branch_id',
        'client_id',
        'project_type_id',
        'financial_year_id',
        'project_code',
        'project_name',
        'description',
        'client_reference_no',
        'work_order_no',
        'work_order_date',
        'contract_date',
        'planned_start_date',
        'actual_start_date',
        'expected_completion_date',
        'actual_completion_date',
        'defect_liability_end_date',
        'contract_value',
        'approved_budget',
        'billing_method_id',
        'retention_percentage',
        'tax_percentage',
        'currency_code',
        'project_manager_id',
        'site_engineer_id',
        'priority_id',
        'project_status_id',
        'progress_percentage',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                         => 'integer',
        'company_id'                 => 'integer',
        'branch_id'                  => '?integer',
        'client_id'                  => 'integer',
        'project_type_id'            => 'integer',
        'financial_year_id'          => '?integer',
        'contract_value'             => 'float',
        'approved_budget'            => 'float',
        'billing_method_id'          => 'integer',
        'retention_percentage'       => 'float',
        'tax_percentage'             => 'float',
        'project_manager_id'         => '?integer',
        'site_engineer_id'           => '?integer',
        'priority_id'                => 'integer',
        'project_status_id'          => 'integer',
        'progress_percentage'        => 'float',
        'created_by'                 => '?integer',
        'updated_by'                 => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'           => 'required|is_natural_no_zero',
        'branch_id'            => 'permit_empty|is_natural_no_zero',
        'client_id'            => 'required|is_natural_no_zero',
        'project_type_id'      => 'required|is_natural_no_zero',
        'financial_year_id'    => 'permit_empty|is_natural_no_zero',
        'project_code'         => 'required|max_length[30]|alpha_numeric_punct',
        'project_name'         => 'required|max_length[200]',
        'client_reference_no'  => 'permit_empty|max_length[80]',
        'work_order_no'        => 'permit_empty|max_length[80]',
        'work_order_date'      => 'permit_empty|valid_date[Y-m-d]',
        'contract_date'        => 'permit_empty|valid_date[Y-m-d]',
        'planned_start_date'   => 'permit_empty|valid_date[Y-m-d]',
        'actual_start_date'    => 'permit_empty|valid_date[Y-m-d]',
        'expected_completion_date' => 'permit_empty|valid_date[Y-m-d]',
        'actual_completion_date'   => 'permit_empty|valid_date[Y-m-d]',
        'defect_liability_end_date' => 'permit_empty|valid_date[Y-m-d]',
        'contract_value'       => 'required|decimal|greater_than_equal_to[0]',
        'approved_budget'      => 'required|decimal|greater_than_equal_to[0]',
        'billing_method_id'    => 'required|is_natural_no_zero',
        'retention_percentage' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'tax_percentage'       => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'currency_code'        => 'required|exact_length[3]|alpha',
        'project_manager_id'   => 'permit_empty|is_natural_no_zero',
        'site_engineer_id'     => 'permit_empty|is_natural_no_zero',
        'priority_id'          => 'required|is_natural_no_zero',
        'project_status_id'    => 'required|is_natural_no_zero',
        'progress_percentage'  => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('project_code', $data['data'])) {
            $data['data']['project_code'] = strtoupper(trim((string) $data['data']['project_code']));
        }

        if (array_key_exists('currency_code', $data['data'])) {
            $data['data']['currency_code'] = strtoupper(trim((string) $data['data']['currency_code']));
        }

        foreach ([
            'project_name', 'description', 'client_reference_no', 'work_order_no', 'notes',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach ([
            'branch_id', 'financial_year_id', 'project_manager_id', 'site_engineer_id',
            'work_order_date', 'contract_date', 'planned_start_date', 'actual_start_date',
            'expected_completion_date', 'actual_completion_date', 'defect_liability_end_date',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        return $data;
    }
}
