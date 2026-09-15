<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ClientModel extends Model
{
    protected $table            = 'clients';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'branch_id',
        'client_code',
        'client_name',
        'legal_name',
        'client_type_id',
        'industry_type',
        'gst_registration_type_id',
        'gstin',
        'pan',
        'tan',
        'email',
        'phone',
        'website',
        'billing_currency',
        'payment_terms_days',
        'credit_limit',
        'tax_deduction_applicable',
        'client_source_id',
        'client_status_id',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                         => 'integer',
        'company_id'                 => 'integer',
        'branch_id'                  => '?integer',
        'client_type_id'             => 'integer',
        'gst_registration_type_id'   => 'integer',
        'payment_terms_days'         => 'integer',
        'credit_limit'               => 'float',
        'tax_deduction_applicable'   => 'boolean',
        'client_source_id'           => 'integer',
        'client_status_id'           => 'integer',
        'created_by'                 => '?integer',
        'updated_by'                 => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero',
        'branch_id' => 'permit_empty|is_natural_no_zero',
        'client_code' => 'required|max_length[30]',
        'client_name' => 'required|max_length[180]',
        'legal_name' => 'permit_empty|max_length[220]',
        'client_type_id' => 'required|is_natural_no_zero',
        'industry_type' => 'permit_empty|max_length[120]',
        'gst_registration_type_id' => 'required|is_natural_no_zero',
        'gstin' => 'permit_empty|exact_length[15]|alpha_numeric',
        'pan' => 'permit_empty|exact_length[10]|alpha_numeric',
        'tan' => 'permit_empty|exact_length[10]|alpha_numeric',
        'email' => 'permit_empty|valid_email|max_length[150]',
        'phone' => 'permit_empty|max_length[25]',
        'website' => 'permit_empty|valid_url_strict|max_length[200]',
        'billing_currency' => 'required|exact_length[3]|alpha',
        'payment_terms_days' => 'required|is_natural',
        'credit_limit' => 'required|decimal|greater_than_equal_to[0]',
        'tax_deduction_applicable' => 'required|in_list[0,1]',
        'client_source_id' => 'required|is_natural_no_zero',
        'client_status_id' => 'required|is_natural_no_zero',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['client_code', 'gstin', 'pan', 'tan', 'billing_currency'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] !== null) {
                $data['data'][$field] = strtoupper(trim((string) $data['data'][$field]));
            }
        }

        foreach ([
            'client_name', 'legal_name', 'industry_type', 'email', 'phone',
            'website', 'notes',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        return $data;
    }
}
