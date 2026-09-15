<?php
declare(strict_types=1);
namespace App\Models;
class DailyMaterialConsumptionModel extends DailyOperationModel
{
    protected $table='daily_material_consumption';
    protected $allowedFields=['company_id','project_id','daily_report_id','work_progress_id','material_id','uom_id','zone_id','stock_transaction_id','issued_qty','consumed_qty','returned_qty','wasted_qty','unit_rate','consumption_value','source_type_id','remarks','created_by','updated_by'];
}
