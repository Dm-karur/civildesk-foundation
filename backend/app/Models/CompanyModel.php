<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class CompanyModel extends Model
{
    protected $table            = 'companies';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_code',
        'company_name',
        'legal_name',
        'company_type_id',
        'gstin',
        'pan',
        'cin',
        'email',
        'phone',
        'website',
        'address_line1',
        'address_line2',
        'city',
        'district',
        'state_name',
        'state_code',
        'country_code',
        'postal_code',
        'logo_path',
        'date_format',
        'currency_code',
        'timezone',
        'subscription_status_id',
        'subscription_start',
        'subscription_end',
        'is_active',
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [
        'id'                     => 'integer',
        'company_type_id'        => 'integer',
        'subscription_status_id' => 'integer',
        'is_active'              => 'boolean',
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
        'company_code' => [
            'label' => 'Company code',
            'rules' => 'required|max_length[30]',
        ],
        'company_name' => [
            'label' => 'Company name',
            'rules' => 'required|max_length[150]',
        ],
        'legal_name' => [
            'label' => 'Legal name',
            'rules' => 'permit_empty|max_length[200]',
        ],
        'company_type_id' => [
            'label' => 'Company type',
            'rules' => 'required|is_natural_no_zero',
        ],
        'gstin' => [
            'label' => 'GSTIN',
            'rules' => 'permit_empty|exact_length[15]|alpha_numeric',
        ],
        'pan' => [
            'label' => 'PAN',
            'rules' => 'permit_empty|exact_length[10]|alpha_numeric',
        ],
        'cin' => [
            'label' => 'CIN',
            'rules' => 'permit_empty|max_length[21]|alpha_numeric',
        ],
        'email' => [
            'label' => 'Email',
            'rules' => 'permit_empty|valid_email|max_length[150]',
        ],
        'phone' => [
            'label' => 'Phone',
            'rules' => 'permit_empty|max_length[25]',
        ],
        'website' => [
            'label' => 'Website',
            'rules' => 'permit_empty|valid_url_strict|max_length[200]',
        ],
        'state_code' => [
            'label' => 'State code',
            'rules' => 'permit_empty|exact_length[2]|numeric',
        ],
        'country_code' => [
            'label' => 'Country code',
            'rules' => 'required|exact_length[2]|alpha',
        ],
        'currency_code' => [
            'label' => 'Currency code',
            'rules' => 'required|exact_length[3]|alpha',
        ],
        'timezone' => [
            'label' => 'Timezone',
            'rules' => 'required|max_length[60]',
        ],
        'subscription_status_id' => [
            'label' => 'Subscription status',
            'rules' => 'required|is_natural_no_zero',
        ],
        'subscription_start' => [
            'label' => 'Subscription start',
            'rules' => 'permit_empty|valid_date[Y-m-d]',
        ],
        'subscription_end' => [
            'label' => 'Subscription end',
            'rules' => 'permit_empty|valid_date[Y-m-d]',
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
                'company_code',
                'gstin',
                'pan',
                'cin',
                'country_code',
                'currency_code',
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
                'company_name',
                'legal_name',
                'email',
                'phone',
                'website',
                'address_line1',
                'address_line2',
                'city',
                'district',
                'state_name',
                'postal_code',
                'timezone',
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
