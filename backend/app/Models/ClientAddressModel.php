<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ClientAddressModel extends Model
{
    protected $table            = 'client_addresses';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'client_id',
        'address_type_id',
        'address_name',
        'attention_to',
        'address_line1',
        'address_line2',
        'landmark',
        'city',
        'district',
        'state_name',
        'state_code',
        'country_code',
        'postal_code',
        'gstin',
        'latitude',
        'longitude',
        'is_primary',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'              => 'integer',
        'company_id'      => 'integer',
        'client_id'       => 'integer',
        'address_type_id' => 'integer',
        'latitude'        => '?float',
        'longitude'       => '?float',
        'is_primary'      => 'boolean',
        'is_active'       => 'boolean',
        'created_by'      => '?integer',
        'updated_by'      => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'      => 'required|is_natural_no_zero',
        'client_id'       => 'required|is_natural_no_zero',
        'address_type_id' => 'required|is_natural_no_zero',
        'address_name'    => 'permit_empty|max_length[120]',
        'attention_to'    => 'permit_empty|max_length[150]',
        'address_line1'   => 'required|max_length[200]',
        'address_line2'   => 'permit_empty|max_length[200]',
        'landmark'        => 'permit_empty|max_length[150]',
        'city'            => 'required|max_length[100]',
        'district'        => 'permit_empty|max_length[100]',
        'state_name'      => 'required|max_length[100]',
        'state_code'      => 'permit_empty|exact_length[2]|numeric',
        'country_code'    => 'required|exact_length[2]|alpha',
        'postal_code'     => 'required|max_length[12]',
        'gstin'           => 'permit_empty|exact_length[15]|alpha_numeric',
        'latitude'        => 'permit_empty|decimal|greater_than_equal_to[-90]|less_than_equal_to[90]',
        'longitude'       => 'permit_empty|decimal|greater_than_equal_to[-180]|less_than_equal_to[180]',
        'is_primary'      => 'required|in_list[0,1]',
        'is_active'       => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['state_code', 'country_code', 'gstin'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] !== null) {
                $value = strtoupper(trim((string) $data['data'][$field]));
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach ([
            'address_name', 'attention_to', 'address_line1', 'address_line2',
            'landmark', 'city', 'district', 'state_name', 'postal_code',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        return $data;
    }
}
