<?php
declare(strict_types=1);
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Services\ExpenseNotificationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

abstract class ExpenseApiController extends BaseController
{
    protected AuthorizationService $authorization;
    protected ExpenseNotificationService $notifier;
    public function __construct(){ $this->authorization=new AuthorizationService(); $this->notifier=new ExpenseNotificationService(); }
    protected function user():?object{return auth('session')->user();}
    protected function company(object $u):int{return (int)$u->company_id;}
    protected function input():array{$v=$this->request->getJSON(true);return is_array($v)?$v:[];}
    protected function now():string{return date('Y-m-d H:i:s');}
    protected function ok(string $message,string $key,mixed $value,int $status=200):ResponseInterface{return $this->response->setStatusCode($status)->setJSON(['success'=>true,'message'=>$message,'data'=>[$key=>$value]]);}
    protected function invalid(array $errors,string $message='Validation failed.'):ResponseInterface{return $this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>$message,'errors'=>$errors]);}
    protected function missing(string $message='Record not found.'):ResponseInterface{return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>$message]);}
    protected function conflict(string $message):ResponseInterface{return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$message]);}
    protected function required(array $data,array $fields):array{$e=[];foreach($fields as$f)if(!array_key_exists($f,$data)||$data[$f]===null||(is_string($data[$f])&&trim($data[$f])===''))$e[$f]='This field is required.';return $e;}
    protected function row(string $table,int $id,int $company,bool $soft=true):?array{$b=db_connect()->table($table)->where(['id'=>$id,'company_id'=>$company]);if($soft)$b->where('deleted_at',null);return$b->get()->getRowArray();}
    protected function masterId(string $table,string $column,string $code):?int{$r=db_connect()->table($table)->select('id')->where([$column=>$code,'is_active'=>1])->get()->getRowArray();return$r?(int)$r['id']:null;}
    protected function statusCode(string $table,string $column,int $id):string{return(string)(db_connect()->table($table)->select($column)->where('id',$id)->get()->getRowArray()[$column]??'');}
    protected function project(int $id,object $u,bool $operate=false):?array{$p=$this->row('projects',$id,$this->company($u));if(!$p)return null;$branch=(int)($p['branch_id']??0);return$branch&&!$this->authorization->canAccessBranch($branch,$operate?'OPERATE':'VIEW',$u)?null:$p;}
    protected function validSite(?int $id,int $project,int $company):bool{return!$id||db_connect()->table('project_sites')->where(['id'=>$id,'project_id'=>$project,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0;}
    protected function validZone(?int $id,?int $site,int $company):bool{return!$id||($site&&db_connect()->table('site_work_zones')->where(['id'=>$id,'site_id'=>$site,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0);}
    protected function logStatus(string $entity,int $id,?string $old,string $new,int $company,int $user,?string $remarks):void{$type=$this->masterId('expense_status_logs_entity_type_masters','entity_type_code',$entity);if($type)db_connect()->table('expense_status_logs')->insert(['company_id'=>$company,'entity_type_id'=>$type,'entity_id'=>$id,'old_status'=>$old,'new_status'=>$new,'changed_by'=>$user,'changed_at'=>$this->now(),'remarks'=>$remarks]);}
    protected function approval(string $entity,int $id,string $action,int $company,int $user,?string $remarks):void{$et=$this->masterId('expense_approvals_entity_type_masters','entity_type_code',$entity);$at=$this->masterId('expense_approvals_action_type_masters','action_type_code',$action);if($et&&$at)db_connect()->table('expense_approvals')->insert(['company_id'=>$company,'entity_type_id'=>$et,'entity_id'=>$id,'approval_level'=>1,'action_type_id'=>$at,'action_by'=>$user,'action_at'=>$this->now(),'remarks'=>$remarks]);}
    protected function safe(callable $fn):ResponseInterface{try{return$fn();}catch(Throwable $e){log_message('error','Expense API error: {error}',['error'=>$e->getMessage()]);return$this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to complete expense or costing operation.']);}}
}
