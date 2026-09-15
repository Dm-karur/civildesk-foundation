<?php
declare(strict_types=1);
namespace App\Models;
use CodeIgniter\Model;
class LabourAttendanceExceptionModel extends Model
{
    protected $table='labour_attendance_exceptions'; protected $primaryKey='id'; protected $returnType='array';
    protected $useSoftDeletes=true; protected $useTimestamps=true; protected $protectFields=true;
    protected $allowedFields=['company_id','project_id','site_id','worker_id','incident_date','exception_category_id','regular_hours_credit','adjusted_check_in','adjusted_check_out','overtime_hours_credit','reason','status_id','submitted_by','submitted_at','approved_by','approved_at','approval_remarks','created_by','updated_by'];
    protected array $casts=['id'=>'integer','company_id'=>'integer','project_id'=>'integer','site_id'=>'?integer','worker_id'=>'integer','exception_category_id'=>'integer','regular_hours_credit'=>'float','overtime_hours_credit'=>'float','status_id'=>'integer'];
}
