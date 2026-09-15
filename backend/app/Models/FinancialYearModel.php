<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class FinancialYearModel extends Model
{
    protected $table            = 'financial_years';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id', 'year_code', 'year_name', 'start_date', 'end_date',
        'status_id', 'is_current', 'closed_by', 'closed_at', 'is_active',
        'created_by', 'updated_by',
    ];

    protected array $casts = [
        'id'         => 'integer',
        'company_id' => 'integer',
        'status_id'  => 'integer',
        'is_current' => 'boolean',
        'closed_by'  => '?integer',
        'is_active'  => 'boolean',
        'created_by' => '?integer',
        'updated_by' => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero',
        'year_code'  => 'required|max_length[20]|alpha_numeric_punct',
        'year_name'  => 'required|max_length[50]',
        'start_date' => 'required|valid_date[Y-m-d]',
        'end_date'   => 'required|valid_date[Y-m-d]',
        'status_id'  => 'required|is_natural_no_zero',
        'is_current' => 'required|in_list[0,1]',
        'is_active'  => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('year_code', $data['data'])) {
            $data['data']['year_code'] = strtoupper(trim((string) $data['data']['year_code']));
        }

        if (array_key_exists('year_name', $data['data'])) {
            $data['data']['year_name'] = trim((string) $data['data']['year_name']);
        }

        return $data;
    }
}
