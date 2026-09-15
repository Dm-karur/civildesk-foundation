<?php
declare(strict_types=1);
namespace App\Models;
use CodeIgniter\Model;
class DailyReportApprovalModel extends Model
{
    protected $table='daily_report_approvals';
    protected $primaryKey='id';
    protected $returnType='array';
    protected $allowedFields=['company_id','daily_report_id','action_type_id','from_status_id','to_status_id','action_by','action_at','remarks','created_at'];
    protected $useTimestamps=false;
}
