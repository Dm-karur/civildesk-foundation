<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectBudgetLineModel extends Model
{
    protected $table = 'project_budget_lines';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = true;
    protected $protectFields = true;
    protected $allowedFields = [
        'company_id', 'project_id', 'budget_id', 'boq_item_id', 'site_id',
        'work_zone_id', 'work_category_id', 'cost_type_id', 'line_code',
        'line_description', 'planned_quantity', 'uom_id', 'planned_rate',
        'planned_amount', 'committed_amount', 'actual_amount', 'display_order',
        'notes', 'created_by', 'updated_by',
    ];
    protected array $casts = [
        'id' => 'integer', 'company_id' => 'integer', 'project_id' => 'integer',
        'budget_id' => 'integer', 'boq_item_id' => '?integer', 'site_id' => '?integer',
        'work_zone_id' => '?integer', 'work_category_id' => 'integer',
        'cost_type_id' => 'integer', 'planned_quantity' => 'float',
        'uom_id' => '?integer', 'planned_rate' => 'float',
        'planned_amount' => 'float', 'committed_amount' => 'float',
        'actual_amount' => 'float', 'display_order' => 'integer',
        'created_by' => '?integer', 'updated_by' => '?integer',
    ];
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';
    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero', 'project_id' => 'required|is_natural_no_zero',
        'budget_id' => 'required|is_natural_no_zero', 'boq_item_id' => 'permit_empty|is_natural_no_zero',
        'site_id' => 'permit_empty|is_natural_no_zero', 'work_zone_id' => 'permit_empty|is_natural_no_zero',
        'work_category_id' => 'required|is_natural_no_zero', 'cost_type_id' => 'required|is_natural_no_zero',
        'line_code' => 'required|max_length[50]|alpha_numeric_punct',
        'line_description' => 'required|max_length[250]',
        'planned_quantity' => 'required|decimal|greater_than_equal_to[0]',
        'uom_id' => 'permit_empty|is_natural_no_zero',
        'planned_rate' => 'required|decimal|greater_than_equal_to[0]',
        'planned_amount' => 'required|decimal|greater_than_equal_to[0]',
        'committed_amount' => 'required|decimal|greater_than_equal_to[0]',
        'actual_amount' => 'required|decimal|greater_than_equal_to[0]',
        'display_order' => 'required|is_natural', 'notes' => 'permit_empty|max_length[500]',
    ];
    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) return $data;
        if (array_key_exists('line_code', $data['data'])) {
            $data['data']['line_code'] = strtoupper(trim((string) $data['data']['line_code']));
        }
        foreach (['line_description', 'notes'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }
        foreach (['boq_item_id', 'site_id', 'work_zone_id', 'uom_id'] as $field) {
            if (($data['data'][$field] ?? null) === '') $data['data'][$field] = null;
        }
        return $data;
    }
}
