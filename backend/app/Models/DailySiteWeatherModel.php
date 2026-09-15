<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteWeatherModel extends DailyOperationModel
{
    protected $table='daily_site_weather';
    protected $allowedFields=['company_id','daily_report_id','observation_time','weather_period_id','weather_condition_id','temperature_c','humidity_percentage','rainfall_mm','work_impact_id','lost_hours','remarks','created_by'];
}
