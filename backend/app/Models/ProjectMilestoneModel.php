<?php
declare(strict_types=1);
namespace App\Models;
use CodeIgniter\Model;
class ProjectMilestoneModel extends Model
{
    protected $table='project_milestones'; protected $primaryKey='id'; protected $returnType='array';
    protected $useSoftDeletes=true; protected $useTimestamps=true; protected $protectFields=true;
    protected $allowedFields=['company_id','project_id','work_stage_id','milestone_code','milestone_name','target_date','actual_completion_date','progress_percentage','weightage_percentage','billing_trigger','billing_percentage','status_id','remarks','created_by','updated_by'];
    protected array $casts=['id'=>'integer','company_id'=>'integer','project_id'=>'integer','work_stage_id'=>'integer','progress_percentage'=>'float','weightage_percentage'=>'float','billing_trigger'=>'boolean','billing_percentage'=>'float','status_id'=>'integer'];
    protected $validationRules=['company_id'=>'required|is_natural_no_zero','project_id'=>'required|is_natural_no_zero','work_stage_id'=>'required|is_natural_no_zero','milestone_code'=>'required|max_length[50]|alpha_numeric_punct','milestone_name'=>'required|max_length[200]','target_date'=>'required|valid_date[Y-m-d]','actual_completion_date'=>'permit_empty|valid_date[Y-m-d]','progress_percentage'=>'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]','weightage_percentage'=>'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]','billing_trigger'=>'required|in_list[0,1]','billing_percentage'=>'required|decimal|greater_than_equal_to[0]|less_than_equal_to[100]','status_id'=>'required|is_natural_no_zero'];
}
