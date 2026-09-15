<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteReportModel extends DailyOperationModel
{
    protected $table='daily_site_reports';
    protected $allowedFields=['company_id','project_id','site_id','report_no','report_date','shift_type_id','work_start_time','work_end_time','prepared_by','site_engineer_id','supervisor_id','safety_briefing_done','safety_incident_count','total_manpower','total_equipment','planned_progress_percentage','actual_progress_percentage','overall_work_summary','next_day_plan','client_instructions','internal_notes','status_id','submitted_by','submitted_at','approved_by','approved_at','approval_remarks','created_by','updated_by'];
}
