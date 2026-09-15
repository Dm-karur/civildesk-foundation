<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;
class DailyOperationsMastersController extends DailyOperationsApiController
{
    public function index():ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$db=db_connect();
        $tables=[
            'report_statuses'=>'daily_site_reports_status_masters','shift_types'=>'daily_site_reports_shift_type_masters',
            'approval_actions'=>'daily_report_approvals_action_type_masters','approval_from_statuses'=>'daily_report_approvals_from_status_masters','approval_to_statuses'=>'daily_report_approvals_to_status_masters',
            'progress_quality_statuses'=>'daily_work_progress_quality_status_masters','progress_work_statuses'=>'daily_work_progress_work_status_masters',
            'manpower_source_types'=>'daily_site_manpower_source_type_masters','equipment_ownership_types'=>'daily_site_equipment_ownership_type_masters','equipment_statuses'=>'daily_site_equipment_status_masters',
            'weather_periods'=>'daily_site_weather_weather_period_masters','weather_conditions'=>'daily_site_weather_weather_condition_masters','weather_work_impacts'=>'daily_site_weather_work_impact_masters',
            'issue_types'=>'daily_site_issues_issue_type_masters','issue_priorities'=>'daily_site_issues_priority_masters','issue_work_impacts'=>'daily_site_issues_work_impact_masters','issue_statuses'=>'daily_site_issues_status_masters',
            'visitor_types'=>'daily_site_visitors_visit_type_masters','photo_types'=>'daily_site_photos_photo_type_masters','material_source_types'=>'daily_material_consumption_source_type_masters',
        ];
        $out=[];foreach($tables as$k=>$t)$out[$k]=$db->table($t)->where('is_active',1)->orderBy('sort_order')->get()->getResultArray();
        $c=$this->company($u);$out['labour_categories']=$db->table('labour_categories')->where('company_id',$c)->where('is_active',1)->where('deleted_at',null)->orderBy('category_name')->get()->getResultArray();
        $out['units']=$db->table('units_of_measurement')->where('company_id',$c)->where('is_active',1)->where('deleted_at',null)->orderBy('unit_name')->get()->getResultArray();
        return $this->ok('Daily operations masters retrieved successfully.','masters',$out);
    }
}
