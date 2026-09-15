<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteVisitorModel extends DailyOperationModel
{
    protected $table='daily_site_visitors';
    protected $allowedFields=['company_id','daily_report_id','visitor_name','organisation','designation','phone','visit_type_id','purpose','check_in_time','check_out_time','hosted_by','instructions_or_observations','follow_up_required','follow_up_owner','follow_up_date','created_by','updated_by'];
}
