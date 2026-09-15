<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class WorkLocationModel extends Model
{
    protected $table = 'work_locations';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = true;
    protected $protectFields = true;

    protected $allowedFields = [
        'company_id', 'project_id', 'site_id', 'zone_id', 'parent_location_id',
        'location_code', 'location_name', 'location_type_id', 'description',
        'planned_start_date', 'planned_end_date', 'status_id', 'progress_percentage',
        'display_order', 'is_active', 'created_by', 'updated_by',
    ];

    protected array $casts = [
        'id' => 'integer',
        'company_id' => 'integer',
        'project_id' => 'integer',
        'site_id' => 'integer',
        'zone_id' => '?integer',
        'parent_location_id' => '?integer',
        'location_type_id' => 'integer',
        'status_id' => 'integer',
        'progress_percentage' => 'float',
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'created_by' => '?integer',
        'updated_by' => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';

    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero',
        'project_id' => 'required|is_natural_no_zero',
        'site_id' => 'required|is_natural_no_zero',
        'zone_id' => 'permit_empty|is_natural_no_zero',
        'parent_location_id' => 'permit_empty|is_natural_no_zero',
        'location_code' => 'required|max_length[30]|alpha_numeric_punct',
        'location_name' => 'required|max_length[150]',
        'location_type_id' => 'required|is_natural_no_zero',
        'description' => 'permit_empty|max_length[500]',
        'planned_start_date' => 'permit_empty|valid_date[Y-m-d]',
        'planned_end_date' => 'permit_empty|valid_date[Y-m-d]',
        'status_id' => 'required|is_natural_no_zero',
        'progress_percentage' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'display_order' => 'required|is_natural',
        'is_active' => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (!isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('location_code', $data['data'])) {
            $data['data']['location_code'] = strtoupper(trim((string) $data['data']['location_code']));
        }

        foreach (['location_name', 'description'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach (['zone_id', 'parent_location_id', 'planned_start_date', 'planned_end_date'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        return $data;
    }
}
