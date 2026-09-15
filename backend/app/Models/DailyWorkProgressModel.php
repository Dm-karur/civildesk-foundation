<?php
declare(strict_types=1);
namespace App\Models;
class DailyWorkProgressModel extends DailyOperationModel
{
    protected $table='daily_work_progress';
    protected $allowedFields=['company_id','project_id','daily_report_id','boq_item_id','site_id','zone_id','uom_id','location_description','planned_qty_for_day','completed_qty_for_day','cumulative_qty_before','cumulative_qty_after','completion_percentage','quality_status_id','inspected_by','inspected_at','measurement_reference','work_status_id','remarks','created_by','updated_by'];
}
