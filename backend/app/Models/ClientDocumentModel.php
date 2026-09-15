<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class ClientDocumentModel extends Model
{
    protected $table            = 'client_documents';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'company_id',
        'client_id',
        'document_type_id',
        'document_number',
        'document_title',
        'document_date',
        'valid_from',
        'valid_until',
        'original_file_name',
        'stored_file_name',
        'file_path',
        'file_extension',
        'mime_type',
        'file_size_bytes',
        'file_hash_sha256',
        'version_number',
        'client_document_status_id',
        'is_confidential',
        'remarks',
        'uploaded_by',
    ];

    protected array $casts = [
        'id'                        => 'integer',
        'company_id'                => 'integer',
        'client_id'                 => 'integer',
        'document_type_id'          => 'integer',
        'file_size_bytes'           => 'integer',
        'version_number'            => 'integer',
        'client_document_status_id' => 'integer',
        'is_confidential'           => 'boolean',
        'uploaded_by'               => '?integer',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $validationRules = [
        'company_id'                => 'required|is_natural_no_zero',
        'client_id'                 => 'required|is_natural_no_zero',
        'document_type_id'          => 'required|is_natural_no_zero',
        'document_number'           => 'permit_empty|max_length[100]',
        'document_title'            => 'required|max_length[180]',
        'document_date'             => 'permit_empty|valid_date[Y-m-d]',
        'valid_from'                => 'permit_empty|valid_date[Y-m-d]',
        'valid_until'               => 'permit_empty|valid_date[Y-m-d]',
        'original_file_name'        => 'required|max_length[255]',
        'stored_file_name'          => 'required|max_length[255]',
        'file_path'                 => 'required|max_length[700]',
        'file_extension'            => 'required|max_length[20]',
        'mime_type'                 => 'permit_empty|max_length[120]',
        'file_size_bytes'           => 'required|is_natural_no_zero',
        'file_hash_sha256'          => 'permit_empty|exact_length[64]',
        'version_number'            => 'required|is_natural_no_zero',
        'client_document_status_id' => 'required|is_natural_no_zero',
        'is_confidential'           => 'required|in_list[0,1]',
        'remarks'                   => 'permit_empty|max_length[500]',
    ];

    protected $beforeInsert = ['normalizeData'];
    protected $beforeUpdate = ['normalizeData'];

    protected function normalizeData(array $data): array
    {
        if (! isset($data['data'])) {
            return $data;
        }

        foreach (['document_number', 'document_title', 'remarks'] as $field) {
            if (array_key_exists($field, $data['data']) && is_string($data['data'][$field])) {
                $value = trim($data['data'][$field]);
                $data['data'][$field] = $value === '' ? null : $value;
            }
        }

        foreach (['document_date', 'valid_from', 'valid_until'] as $field) {
            if (array_key_exists($field, $data['data']) && $data['data'][$field] === '') {
                $data['data'][$field] = null;
            }
        }

        return $data;
    }
}
