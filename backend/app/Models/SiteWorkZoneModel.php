<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class SiteWorkZoneModel extends Model
{
    protected $table = 'site_work_zones';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useSoftDeletes = true;
    protected $allowedFields = [
        'company_id','project_id','site_id','parent_zone_id','zone_code','zone_name','zone_type_id',
        'description','planned_start_date','planned_end_date','status_id','progress_percentage',
        'display_order','is_active','created_by','updated_by',
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';
    protected array $casts = [
        'id'=>'integer','company_id'=>'integer','project_id'=>'integer','site_id'=>'integer',
        'parent_zone_id'=>'?integer','zone_type_id'=>'integer','status_id'=>'integer',
        'progress_percentage'=>'float','display_order'=>'integer','is_active'=>'boolean',
        'created_by'=>'?integer','updated_by'=>'?integer',
    ];
    protected $validationRules = [
        'company_id'=>'required|is_natural_no_zero','project_id'=>'required|is_natural_no_zero',
        'site_id'=>'required|is_natural_no_zero','parent_zone_id'=>'permit_empty|is_natural_no_zero',
        'zone_code'=>'required|max_length[30]|alpha_numeric_punct','zone_name'=>'required|max_length[150]',
        'zone_type_id'=>'required|is_natural_no_zero','description'=>'permit_empty|max_length[500]',
        'planned_start_date'=>'permit_empty|valid_date[Y-m-d]','planned_end_date'=>'permit_empty|valid_date[Y-m-d]',
        'status_id'=>'required|is_natural_no_zero','progress_percentage'=>'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'display_order'=>'required|is_natural','is_active'=>'required|in_list[0,1]',
    ];
    protected $beforeInsert = ['normalize'];
    protected $beforeUpdate = ['normalize'];

    protected function normalize(array $data): array
    {
        if (!isset($data['data'])) return $data;
        if (array_key_exists('zone_code', $data['data'])) $data['data']['zone_code'] = strtoupper(trim((string)$data['data']['zone_code']));
        foreach (['zone_name','description'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $v = trim($data['data'][$field]); $data['data'][$field] = $v === '' ? null : $v;
            }
        }
        foreach (['parent_zone_id','planned_start_date','planned_end_date'] as $field) {
            if (($data['data'][$field] ?? null) === '') $data['data'][$field] = null;
        }
        return $data;
    }
}
