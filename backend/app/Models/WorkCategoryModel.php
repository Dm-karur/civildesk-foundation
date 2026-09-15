<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class WorkCategoryModel extends Model
{
    protected $table            = 'work_categories';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id', 'parent_id', 'category_code', 'category_name',
        'work_stage_id', 'progress_method_id', 'description', 'display_order',
        'is_active', 'created_by', 'updated_by',
    ];

    protected array $casts = [
        'id'                 => 'integer',
        'company_id'         => 'integer',
        'parent_id'          => '?integer',
        'work_stage_id'      => 'integer',
        'progress_method_id' => 'integer',
        'display_order'      => 'integer',
        'is_active'          => 'boolean',
        'created_by'         => '?integer',
        'updated_by'         => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'         => 'required|is_natural_no_zero',
        'category_code'      => 'required|max_length[30]|alpha_numeric_punct',
        'category_name'      => 'required|max_length[120]',
        'work_stage_id'      => 'required|is_natural_no_zero',
        'progress_method_id' => 'required|is_natural_no_zero',
        'description'        => 'permit_empty|max_length[500]',
        'display_order'      => 'required|integer|greater_than_equal_to[0]',
        'is_active'          => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('category_code', $data['data'])) {
            $data['data']['category_code'] = strtoupper(
                trim((string) $data['data']['category_code'])
            );
        }

        foreach (['category_name', 'description'] as $field) {
            if (array_key_exists($field, $data['data'])) {
                $value = trim((string) $data['data'][$field]);
                $data['data'][$field] = $value === '' && $field === 'description'
                    ? null
                    : $value;
            }
        }

        if (array_key_exists('parent_id', $data['data'])
            && ($data['data']['parent_id'] === '' || $data['data']['parent_id'] === null)) {
            $data['data']['parent_id'] = null;
        }

        return $data;
    }
}
