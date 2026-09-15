<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class BoqSectionModel extends Model
{
    protected $table            = 'boq_sections';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'project_id',
        'boq_id',
        'parent_section_id',
        'section_code',
        'section_name',
        'description',
        'display_order',
        'section_amount',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'id'                => 'integer',
        'company_id'        => 'integer',
        'project_id'        => 'integer',
        'boq_id'            => 'integer',
        'parent_section_id' => '?integer',
        'display_order'     => 'integer',
        'section_amount'    => 'float',
        'created_by'        => '?integer',
        'updated_by'        => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'        => 'required|is_natural_no_zero',
        'project_id'        => 'required|is_natural_no_zero',
        'boq_id'            => 'required|is_natural_no_zero',
        'parent_section_id' => 'permit_empty|is_natural_no_zero',
        'section_code'      => 'required|max_length[40]|alpha_numeric_punct',
        'section_name'      => 'required|max_length[180]',
        'description'       => 'permit_empty|max_length[500]',
        'display_order'     => 'required|is_natural',
        'section_amount'    => 'required|decimal|greater_than_equal_to[0]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        if (array_key_exists('section_code', $data['data'])) {
            $data['data']['section_code'] = strtoupper(trim((string) $data['data']['section_code']));
        }

        foreach (['section_name', 'description'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        if (($data['data']['parent_section_id'] ?? null) === '') {
            $data['data']['parent_section_id'] = null;
        }

        return $data;
    }
}
