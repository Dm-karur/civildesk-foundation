<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectTypeModel extends Model
{
    protected $table            = 'project_types';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'project_type_code',
        'project_type_name',
        'billing_method_id',
        'default_duration_days',
        'description',
        'display_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                    => 'integer',
        'company_id'            => 'integer',
        'billing_method_id'     => 'integer',
        'default_duration_days' => '?integer',
        'display_order'         => 'integer',
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
        'project_type_code'     => 'required|max_length[30]|alpha_numeric_punct',
        'project_type_name'     => 'required|max_length[120]',
        'billing_method_id'     => 'required|is_natural_no_zero',
        'default_duration_days' => 'permit_empty|is_natural_no_zero',
        'description'           => 'permit_empty|max_length[500]',
        'display_order'         => 'required|is_natural',
        'is_active'             => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('project_type_code', $data['data'])) {
            $data['data']['project_type_code'] = strtoupper(
                trim((string) $data['data']['project_type_code'])
            );
        }

        foreach (['project_type_name', 'description'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        return $data;
    }
}
