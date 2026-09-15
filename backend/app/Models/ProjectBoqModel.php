<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectBoqModel extends Model
{
    protected $table            = 'project_boqs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'site_id',
        'project_id',
        'boq_code',
        'boq_name',
        'version_no',
        'revision_no',
        'boq_date',
        'valid_from',
        'currency_code',
        'status_id',
        'total_amount',
        'notes',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'           => 'integer',
        'company_id'   => 'integer',
        'site_id'      => '?integer',
        'project_id'   => 'integer',
        'version_no'   => 'integer',
        'revision_no'  => 'integer',
        'status_id'    => 'integer',
        'total_amount' => 'float',
        'submitted_by' => '?integer',
        'approved_by'  => '?integer',
        'created_by'   => '?integer',
        'updated_by'   => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'   => 'required|is_natural_no_zero',
        'site_id'      => 'permit_empty|is_natural_no_zero',
        'project_id'   => 'required|is_natural_no_zero',
        'boq_code'     => 'required|max_length[40]|alpha_numeric_punct',
        'boq_name'     => 'required|max_length[180]',
        'version_no'   => 'required|is_natural_no_zero',
        'revision_no'  => 'required|is_natural',
        'boq_date'     => 'required|valid_date[Y-m-d]',
        'valid_from'   => 'permit_empty|valid_date[Y-m-d]',
        'currency_code'=> 'required|exact_length[3]|alpha',
        'status_id'    => 'required|is_natural_no_zero',
        'total_amount' => 'required|decimal|greater_than_equal_to[0]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['boq_code', 'currency_code'] as $field) {
            if (array_key_exists($field, $data['data'])) {
                $data['data'][$field] = strtoupper(trim((string) $data['data'][$field]));
            }
        }

        foreach (['boq_name', 'notes'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach (['valid_from', 'submitted_by', 'submitted_at', 'approved_by', 'approved_at'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        return $data;
    }
}
