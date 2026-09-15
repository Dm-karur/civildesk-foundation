<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectTeamMemberModel extends Model
{
    protected $table            = 'project_team_members';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'project_id',
        'user_id',
        'team_role_id',
        'responsibility',
        'assignment_start',
        'assignment_end',
        'is_primary',
        'can_approve',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'             => 'integer',
        'company_id'     => 'integer',
        'project_id'     => 'integer',
        'user_id'        => 'integer',
        'team_role_id'   => '?integer',
        'is_primary'     => 'boolean',
        'can_approve'    => 'boolean',
        'is_active'      => 'boolean',
        'created_by'     => '?integer',
        'updated_by'     => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'       => 'required|is_natural_no_zero',
        'project_id'       => 'required|is_natural_no_zero',
        'user_id'          => 'required|is_natural_no_zero',
        'team_role_id'     => 'permit_empty|is_natural_no_zero',
        'responsibility'   => 'permit_empty|max_length[500]',
        'assignment_start' => 'permit_empty|valid_date[Y-m-d]',
        'assignment_end'   => 'permit_empty|valid_date[Y-m-d]',
        'is_primary'       => 'required|in_list[0,1]',
        'can_approve'      => 'required|in_list[0,1]',
        'is_active'        => 'required|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('responsibility', $data['data'])) {
            $value = trim((string) ($data['data']['responsibility'] ?? ''));
            $data['data']['responsibility'] = $value === '' ? null : $value;
        }

        foreach (['team_role_id', 'assignment_start', 'assignment_end'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        return $data;
    }
}
