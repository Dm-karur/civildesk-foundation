<?php
declare(strict_types=1);
namespace App\Models;
use CodeIgniter\Model;
class LabourContractorBillModel extends Model
{
 protected $table='labour_contractor_bills'; protected $primaryKey='id'; protected $returnType='array';
 protected $useSoftDeletes=true; protected $useTimestamps=true; protected $protectFields=true;
 protected $allowedFields=['company_id','project_id','site_id','contractor_id','bill_no','work_activity','period_start','period_end','labour_rate','total_manpower_units','labour_amount','total_additions','total_deductions','round_off','total_amount','paid_amount','balance_amount','status_id','payment_status_id','remarks','submitted_by','submitted_at','verified_by','verified_at','priced_by','priced_at','approved_by','approved_at','created_by','updated_by'];
 protected array $casts=['id'=>'integer','company_id'=>'integer','project_id'=>'integer','site_id'=>'integer','contractor_id'=>'integer','labour_rate'=>'?float','total_manpower_units'=>'float','labour_amount'=>'float','total_additions'=>'float','total_deductions'=>'float','round_off'=>'float','total_amount'=>'float','paid_amount'=>'float','balance_amount'=>'float','status_id'=>'integer','payment_status_id'=>'integer'];
}
