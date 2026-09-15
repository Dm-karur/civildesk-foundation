<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteIssueModel extends DailyOperationModel
{
    protected $table='daily_site_issues';
    protected $allowedFields=['company_id','daily_report_id','zone_id','issue_no','issue_type_id','title','description','priority_id','work_impact_id','lost_hours','reported_by','assigned_to','target_resolution_date','resolved_date','resolution','status_id','created_by','updated_by'];
}
