<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ClientContactModel extends Model
{
    protected $table            = 'client_contacts';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'client_id',
        'contact_name',
        'designation',
        'department',
        'email',
        'phone',
        'alternate_phone',
        'communication_mode_id',
        'is_primary',
        'receives_billing',
        'receives_site_updates',
        'notes',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                    => 'integer',
        'company_id'            => 'integer',
        'client_id'             => 'integer',
        'communication_mode_id' => 'integer',
        'is_primary'            => 'boolean',
        'receives_billing'      => 'boolean',
        'receives_site_updates' => 'boolean',
        'is_active'             => 'boolean',
        'created_by'            => '?integer',
        'updated_by'            => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'            => 'required|is_natural_no_zero',
        'client_id'             => 'required|is_natural_no_zero',
        'contact_name'          => 'required|max_length[150]',
        'designation'           => 'permit_empty|max_length[120]',
        'department'            => 'permit_empty|max_length[120]',
        'email'                 => 'permit_empty|valid_email|max_length[150]',
        'phone'                 => 'permit_empty|max_length[25]',
        'alternate_phone'       => 'permit_empty|max_length[25]',
        'communication_mode_id' => 'required|is_natural_no_zero',
        'is_primary'            => 'required|in_list[0,1]',
        'receives_billing'      => 'required|in_list[0,1]',
        'receives_site_updates' => 'required|in_list[0,1]',
        'notes'                 => 'permit_empty|max_length[500]',
        'is_active'             => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach ([
            'contact_name', 'designation', 'department', 'email', 'phone',
            'alternate_phone', 'notes',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        if (isset($data['data']['email'])) {
            $data['data']['email'] = strtolower((string) $data['data']['email']);
        }

        return $data;
    }
}
