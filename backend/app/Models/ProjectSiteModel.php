<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectSiteModel extends Model
{
    protected $table            = 'project_sites';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'project_id',
        'site_code',
        'site_name',
        'site_type_id',
        'address_line1',
        'address_line2',
        'landmark',
        'city',
        'district',
        'state_name',
        'state_code',
        'country_code',
        'postal_code',
        'latitude',
        'longitude',
        'geofence_radius_m',
        'contact_name',
        'contact_phone',
        'site_engineer_id',
        'supervisor_id',
        'planned_start_date',
        'actual_start_date',
        'expected_end_date',
        'actual_end_date',
        'site_status_id',
        'progress_percentage',
        'is_primary',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                  => 'integer',
        'company_id'          => 'integer',
        'project_id'          => 'integer',
        'site_type_id'        => 'integer',
        'latitude'            => '?float',
        'longitude'           => '?float',
        'geofence_radius_m'   => '?integer',
        'site_engineer_id'    => '?integer',
        'supervisor_id'       => '?integer',
        'site_status_id'      => 'integer',
        'progress_percentage' => 'float',
        'is_primary'          => 'boolean',
        'created_by'          => '?integer',
        'updated_by'          => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'          => 'required|is_natural_no_zero',
        'project_id'          => 'required|is_natural_no_zero',
        'site_code'           => 'required|max_length[30]|alpha_numeric_punct',
        'site_name'           => 'required|max_length[180]',
        'site_type_id'        => 'required|is_natural_no_zero',
        'address_line1'       => 'permit_empty|max_length[200]',
        'address_line2'       => 'permit_empty|max_length[200]',
        'landmark'            => 'permit_empty|max_length[150]',
        'city'                => 'permit_empty|max_length[100]',
        'district'            => 'permit_empty|max_length[100]',
        'state_name'          => 'permit_empty|max_length[100]',
        'state_code'          => 'permit_empty|exact_length[2]|alpha_numeric',
        'country_code'        => 'required|exact_length[2]|alpha',
        'postal_code'         => 'permit_empty|max_length[12]|alpha_numeric_punct',
        'latitude'            => 'permit_empty|decimal|greater_than_equal_to[-90]|less_than_equal_to[90]',
        'longitude'           => 'permit_empty|decimal|greater_than_equal_to[-180]|less_than_equal_to[180]',
        'geofence_radius_m'   => 'permit_empty|is_natural_no_zero',
        'contact_name'        => 'permit_empty|max_length[120]',
        'contact_phone'       => 'permit_empty|max_length[25]',
        'site_engineer_id'    => 'permit_empty|is_natural_no_zero',
        'supervisor_id'       => 'permit_empty|is_natural_no_zero',
        'planned_start_date'  => 'permit_empty|valid_date[Y-m-d]',
        'actual_start_date'   => 'permit_empty|valid_date[Y-m-d]',
        'expected_end_date'   => 'permit_empty|valid_date[Y-m-d]',
        'actual_end_date'     => 'permit_empty|valid_date[Y-m-d]',
        'site_status_id'      => 'required|is_natural_no_zero',
        'progress_percentage' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'is_primary'          => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['site_code', 'state_code', 'country_code'] as $field) {
            if (array_key_exists($field, $data['data'])) {
                $data['data'][$field] = strtoupper(trim((string) $data['data'][$field]));
            }
        }

        foreach ([
            'site_name', 'address_line1', 'address_line2', 'landmark', 'city', 'district',
            'state_name', 'postal_code', 'contact_name', 'contact_phone', 'notes',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach ([
            'latitude', 'longitude', 'geofence_radius_m', 'site_engineer_id', 'supervisor_id',
            'planned_start_date', 'actual_start_date', 'expected_end_date', 'actual_end_date',
        ] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        if (array_key_exists('is_primary', $data['data'])) {
            $data['data']['is_primary'] = filter_var(
                $data['data']['is_primary'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ? 1 : 0;
        }

        return $data;
    }
}
