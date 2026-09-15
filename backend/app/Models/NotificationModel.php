<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

class NotificationModel extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $protectFields = true;
    protected $allowedFields = [
        'company_id', 'recipient_user_id', 'event_id', 'project_id',
        'source_module', 'source_table', 'source_record_id', 'title', 'message',
        'action_url', 'is_read', 'read_at', 'email_sent', 'email_sent_at',
        'email_error', 'created_by',
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected array $casts = [
        'id' => 'integer', 'company_id' => 'integer',
        'recipient_user_id' => 'integer', 'event_id' => 'integer',
        'project_id' => '?integer', 'source_record_id' => '?integer',
        'is_read' => 'boolean', 'email_sent' => 'boolean',
        'created_by' => '?integer',
    ];
}
