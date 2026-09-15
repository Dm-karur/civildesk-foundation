<?php
declare(strict_types=1);
namespace App\Models;
class DailySiteEquipmentModel extends DailyOperationModel
{
    protected $table='daily_site_equipment';
    protected $allowedFields=['company_id','daily_report_id','zone_id','equipment_code','equipment_name','ownership_type_id','supplier_or_owner','operator_name','quantity','start_time','end_time','working_hours','idle_hours','breakdown_hours','fuel_consumed','fuel_uom','meter_opening','meter_closing','status_id','work_description','remarks','created_by','updated_by'];
}
