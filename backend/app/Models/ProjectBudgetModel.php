<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectBudgetModel extends Model
{
    protected $table = 'project_budgets';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = true;
    protected $protectFields = true;
    protected $allowedFields = [
        'company_id', 'project_id', 'financial_year_id', 'source_boq_id',
        'budget_code', 'budget_name', 'version_no', 'budget_date',
        'currency_code', 'direct_cost', 'overhead_cost', 'contingency_amount',
        'total_budget', 'status_id', 'notes', 'submitted_by', 'submitted_at',
        'approved_by', 'approved_at', 'created_by', 'updated_by',
    ];
    protected array $casts = [
        'id' => 'integer', 'company_id' => 'integer', 'project_id' => 'integer',
        'financial_year_id' => '?integer', 'source_boq_id' => '?integer',
        'version_no' => 'integer', 'direct_cost' => 'float',
        'overhead_cost' => 'float', 'contingency_amount' => 'float',
        'total_budget' => 'float', 'status_id' => 'integer',
        'submitted_by' => '?integer', 'approved_by' => '?integer',
        'created_by' => '?integer', 'updated_by' => '?integer',
    ];
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';
    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero',
        'project_id' => 'required|is_natural_no_zero',
        'financial_year_id' => 'permit_empty|is_natural_no_zero',
        'source_boq_id' => 'permit_empty|is_natural_no_zero',
        'budget_code' => 'required|max_length[40]|alpha_numeric_punct',
        'budget_name' => 'required|max_length[180]',
        'version_no' => 'required|is_natural_no_zero',
        'budget_date' => 'required|valid_date[Y-m-d]',
        'currency_code' => 'required|exact_length[3]|alpha',
        'direct_cost' => 'required|decimal|greater_than_equal_to[0]',
        'overhead_cost' => 'required|decimal|greater_than_equal_to[0]',
        'contingency_amount' => 'required|decimal|greater_than_equal_to[0]',
        'total_budget' => 'required|decimal|greater_than_equal_to[0]',
        'status_id' => 'required|is_natural_no_zero',
    ];
    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) return $data;
        foreach (['budget_code', 'currency_code'] as $field) {
            if (array_key_exists($field, $data['data'])) {
                $data['data'][$field] = strtoupper(trim((string) $data['data'][$field]));
            }
        }
        foreach (['budget_name', 'notes'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }
        foreach (['financial_year_id', 'source_boq_id'] as $field) {
            if (($data['data'][$field] ?? null) === '') $data['data'][$field] = null;
        }
        return $data;
    }
}
