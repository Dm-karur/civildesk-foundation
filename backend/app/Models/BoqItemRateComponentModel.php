<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class BoqItemRateComponentModel extends Model
{
    protected $table            = 'boq_item_rate_components';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'boq_item_id', 'component_type_id', 'component_name',
        'quantity_factor', 'component_rate', 'component_amount',
        'remarks', 'display_order', 'created_by',
    ];

    protected array $casts = [
        'id'                => 'integer',
        'boq_item_id'       => 'integer',
        'component_type_id' => 'integer',
        'quantity_factor'   => 'float',
        'component_rate'    => 'float',
        'component_amount'  => 'float',
        'display_order'     => 'integer',
        'created_by'        => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'boq_item_id'       => 'required|is_natural_no_zero',
        'component_type_id' => 'required|is_natural_no_zero',
        'component_name'    => 'required|max_length[160]',
        'quantity_factor'   => 'required|decimal|greater_than_equal_to[0]',
        'component_rate'    => 'required|decimal|greater_than_equal_to[0]',
        'component_amount'  => 'required|decimal|greater_than_equal_to[0]',
        'remarks'           => 'permit_empty|max_length[500]',
        'display_order'     => 'required|is_natural',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['component_name', 'remarks'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        return $data;
    }
}
