<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class BranchModel extends Model
{
    protected $table            = 'branches';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'branch_code',
        'branch_name',
        'branch_type_id',
        'gstin',
        'email',
        'phone',
        'address_line1',
        'address_line2',
        'city',
        'district',
        'state_name',
        'state_code',
        'country_code',
        'postal_code',
        'latitude',
        'longitude',
        'is_head_office',
        'is_active',
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [
        'id'             => 'integer',
        'company_id'     => 'integer',
        'branch_type_id' => 'integer',
        'latitude'       => '?float',
        'longitude'      => '?float',
        'is_head_office' => 'boolean',
        'is_active'      => 'boolean',
    ];

    protected array $castHandlers = [];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules = [
        'company_id' => [
            'label' => 'Company',
            'rules' => 'required|is_natural_no_zero',
        ],
        'branch_code' => [
            'label' => 'Branch code',
            'rules' => 'required|max_length[30]',
        ],
        'branch_name' => [
            'label' => 'Branch name',
            'rules' => 'required|max_length[150]',
        ],
        'branch_type_id' => [
            'label' => 'Branch type',
            'rules' => 'required|is_natural_no_zero',
        ],
        'gstin' => [
            'label' => 'GSTIN',
            'rules' => 'permit_empty|exact_length[15]|alpha_numeric',
        ],
        'email' => [
            'label' => 'Email',
            'rules' => 'permit_empty|valid_email|max_length[150]',
        ],
        'phone' => [
            'label' => 'Phone',
            'rules' => 'permit_empty|max_length[25]',
        ],
        'state_code' => [
            'label' => 'State code',
            'rules' => 'permit_empty|exact_length[2]|numeric',
        ],
        'country_code' => [
            'label' => 'Country code',
            'rules' => 'required|exact_length[2]|alpha',
        ],
        'latitude' => [
            'label' => 'Latitude',
            'rules' => 'permit_empty|decimal|greater_than_equal_to[-90]|less_than_equal_to[90]',
        ],
        'longitude' => [
            'label' => 'Longitude',
            'rules' => 'permit_empty|decimal|greater_than_equal_to[-180]|less_than_equal_to[180]',
        ],
        'is_head_office' => [
            'label' => 'Head-office status',
            'rules' => 'required|in_list[0,1]',
        ],
        'is_active' => [
            'label' => 'Active status',
            'rules' => 'required|in_list[0,1]',
        ],
    ];

    protected $validationMessages = [];

    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = ['normalizeData'];
    protected $beforeUpdate   = ['normalizeData'];
    protected $afterInsert    = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (
            [
                'branch_code',
                'gstin',
                'country_code',
            ] as $field
        ) {
            if (
                array_key_exists($field, $data['data'])
                && $data['data'][$field] !== null
            ) {
                $data['data'][$field] = strtoupper(
                    trim((string) $data['data'][$field])
                );
            }
        }

        foreach (
            [
                'branch_name',
                'email',
                'phone',
                'address_line1',
                'address_line2',
                'city',
                'district',
                'state_name',
                'postal_code',
            ] as $field
        ) {
            if (
                array_key_exists($field, $data['data'])
                && is_string($data['data'][$field])
            ) {
                $data['data'][$field] = trim($data['data'][$field]);
            }
        }

        return $data;
    }
}
