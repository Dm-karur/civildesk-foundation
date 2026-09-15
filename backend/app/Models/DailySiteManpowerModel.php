<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteManpowerModel extends DailyOperationModel
{
    protected $table='daily_site_manpower';
    protected $allowedFields=['company_id','daily_report_id','labour_category_id','contractor_id','zone_id','planned_count','present_count','absent_count','overtime_workers','total_regular_hours','total_overtime_hours','source_type_id','work_description','remarks','created_by','updated_by'];
}
