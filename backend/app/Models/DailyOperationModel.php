<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

abstract class DailyOperationModel extends Model
{
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $protectFields = true;
    protected $useSoftDeletes = true;
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';
}
