<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class UnitOfMeasurementModel extends Model
{
    protected $table            = 'units_of_measurement';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id', 'unit_code', 'unit_name', 'unit_symbol', 'unit_type_id',
        'decimal_places', 'description', 'display_order', 'is_system_defined',
        'is_active', 'created_by', 'updated_by',
    ];

    protected array $casts = [
        'id'                => 'integer',
        'company_id'        => 'integer',
        'unit_type_id'      => 'integer',
        'decimal_places'    => 'integer',
        'display_order'     => 'integer',
        'is_system_defined' => 'boolean',
        'is_active'         => 'boolean',
        'created_by'        => '?integer',
        'updated_by'        => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'     => 'required|is_natural_no_zero',
        'unit_code'      => 'required|max_length[20]|alpha_numeric_punct',
        'unit_name'      => 'required|max_length[80]',
        'unit_symbol'    => 'required|max_length[20]',
        'unit_type_id'   => 'required|is_natural_no_zero',
        'decimal_places' => 'required|integer|greater_than_equal_to[0]|less_than_equal_to[6]',
        'display_order'  => 'required|integer|greater_than_equal_to[0]',
        'is_active'      => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('unit_code', $data['data'])) {
            $data['data']['unit_code'] = strtoupper(trim((string) $data['data']['unit_code']));
        }

        foreach (['unit_name', 'unit_symbol', 'description'] as $field) {
            if (array_key_exists($field, $data['data'])) {
                $value = trim((string) $data['data'][$field]);
                $data['data'][$field] = $value === '' && $field === 'description' ? null : $value;
            }
        }

        return $data;
    }
}
