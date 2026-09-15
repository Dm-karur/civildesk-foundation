<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ProjectDocumentModel extends Model
{
    protected $table = 'project_documents';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = true;
    protected $protectFields = true;

    protected $allowedFields = [
        'company_id', 'project_id', 'site_id', 'document_type_id', 'document_code',
        'document_title', 'document_number', 'revision_number', 'document_date',
        'valid_from', 'expiry_date', 'file_name', 'original_file_name', 'storage_path',
        'file_extension', 'mime_type', 'file_size_bytes', 'file_hash_sha256',
        'version_number', 'status_id', 'remarks', 'uploaded_by', 'approved_by', 'approved_at',
    ];

    protected array $casts = [
        'id' => 'integer', 'company_id' => 'integer', 'project_id' => 'integer',
        'site_id' => '?integer', 'document_type_id' => 'integer',
        'file_size_bytes' => '?integer', 'version_number' => 'integer',
        'status_id' => 'integer', 'uploaded_by' => '?integer', 'approved_by' => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';

    protected $validationRules = [
        'company_id' => 'required|is_natural_no_zero',
        'project_id' => 'required|is_natural_no_zero',
        'site_id' => 'permit_empty|is_natural_no_zero',
        'document_type_id' => 'required|is_natural_no_zero',
        'document_code' => 'permit_empty|max_length[50]',
        'document_title' => 'required|max_length[200]',
        'document_number' => 'permit_empty|max_length[100]',
        'revision_number' => 'permit_empty|max_length[30]',
        'document_date' => 'permit_empty|valid_date[Y-m-d]',
        'valid_from' => 'permit_empty|valid_date[Y-m-d]',
        'expiry_date' => 'permit_empty|valid_date[Y-m-d]',
        'file_name' => 'required|max_length[255]',
        'original_file_name' => 'required|max_length[255]',
        'storage_path' => 'required|max_length[700]',
        'file_extension' => 'permit_empty|max_length[20]',
        'mime_type' => 'permit_empty|max_length[150]',
        'file_size_bytes' => 'permit_empty|is_natural_no_zero',
        'file_hash_sha256' => 'permit_empty|exact_length[64]',
        'version_number' => 'required|is_natural_no_zero',
        'status_id' => 'required|is_natural_no_zero',
        'remarks' => 'permit_empty|max_length[500]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['document_code', 'document_title', 'document_number', 'revision_number', 'remarks'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }
        foreach (['site_id', 'document_date', 'valid_from', 'expiry_date'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }
        return $data;
    }
}
