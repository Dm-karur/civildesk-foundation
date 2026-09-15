<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class BoqItemModel extends Model
{
    protected $table            = 'boq_items';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id', 'project_id', 'boq_id', 'section_id', 'site_id',
        'work_zone_id', 'work_category_id', 'uom_id', 'item_code',
        'item_name', 'specification', 'quantity', 'rate', 'amount',
        'executed_quantity', 'balance_quantity', 'execution_progress',
        'wastage_percentage', 'progress_weightage', 'is_provisional',
        'display_order', 'notes', 'created_by', 'updated_by',
    ];

    protected array $casts = [
        'id' => 'integer', 'company_id' => 'integer', 'project_id' => 'integer',
        'boq_id' => 'integer', 'section_id' => 'integer', 'site_id' => '?integer',
        'work_zone_id' => '?integer', 'work_category_id' => 'integer',
        'uom_id' => 'integer', 'quantity' => 'float', 'rate' => 'float',
        'amount' => 'float', 'executed_quantity' => 'float', 'balance_quantity' => 'float',
        'execution_progress' => 'float',
        'wastage_percentage' => 'float',
        'progress_weightage' => 'float', 'is_provisional' => 'boolean',
        'display_order' => 'integer', 'created_by' => '?integer',
        'updated_by' => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'          => 'required|is_natural_no_zero',
        'project_id'          => 'required|is_natural_no_zero',
        'boq_id'              => 'required|is_natural_no_zero',
        'section_id'          => 'required|is_natural_no_zero',
        'site_id'             => 'permit_empty|is_natural_no_zero',
        'work_zone_id'        => 'permit_empty|is_natural_no_zero',
        'work_category_id'    => 'required|is_natural_no_zero',
        'uom_id'              => 'required|is_natural_no_zero',
        'item_code'           => 'required|max_length[50]|alpha_numeric_punct',
        'item_name'           => 'required|max_length[220]',
        'specification'       => 'permit_empty',
        'quantity'            => 'required|decimal|greater_than_equal_to[0]',
        'rate'                => 'required|decimal|greater_than_equal_to[0]',
        'amount'              => 'required|decimal|greater_than_equal_to[0]',
        'wastage_percentage'  => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'progress_weightage'  => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'is_provisional'      => 'required|in_list[0,1]',
        'display_order'       => 'required|is_natural',
        'notes'               => 'permit_empty|max_length[500]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('item_code', $data['data'])) {
            $data['data']['item_code'] = strtoupper(trim((string) $data['data']['item_code']));
        }
        foreach (['item_name', 'specification', 'notes'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }
        foreach (['site_id', 'work_zone_id'] as $field) {
            if (($data['data'][$field] ?? null) === '') {
                $data['data'][$field] = null;
            }
        }
        if (array_key_exists('is_provisional', $data['data'])) {
            $data['data']['is_provisional'] = filter_var(
                $data['data']['is_provisional'], FILTER_VALIDATE_BOOLEAN
            ) ? 1 : 0;
        }

        return $data;
    }
}
