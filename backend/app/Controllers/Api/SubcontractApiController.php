<?php
declare(strict_types=1);
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Services\SubcontractNotificationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

abstract class SubcontractApiController extends BaseController
{
    protected AuthorizationService $authorization;
    protected SubcontractNotificationService $notifier;
    public function __construct(){ $this->authorization=new AuthorizationService();$this->notifier=new SubcontractNotificationService(); }
    protected function user():?object{return auth('session')->user();}
    protected function company(object $u):int{return (int)$u->company_id;}
    protected function input():?array{$v=$this->request->getJSON(true);return is_array($v)?$v:null;}
    protected function now():string{return date('Y-m-d H:i:s');}
    protected function ok(string $m,string $k,mixed $v,int $s=200):ResponseInterface{return $this->response->setStatusCode($s)->setJSON(['success'=>true,'message'=>$m,'data'=>[$k=>$v]]);}
    protected function invalid(array $e,string $m='Validation failed.'):ResponseInterface{return $this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>$m,'errors'=>$e]);}
    protected function unauthorized():ResponseInterface{return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);}
    protected function missing(string $m='Record not found.'):ResponseInterface{return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>$m]);}
    protected function conflict(string $m):ResponseInterface{return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$m]);}
    protected function required(array $d,array $fs):array{$e=[];foreach($fs as$f)if(!array_key_exists($f,$d)||$d[$f]===null||(is_string($d[$f])&&trim($d[$f])===''))$e[$f]='This field is required.';return $e;}
    protected function row(string $t,int $id,int $c,bool $soft=true):?array{$b=db_connect()->table($t)->where(['id'=>$id,'company_id'=>$c]);if($soft)$b->where('deleted_at',null);return $b->get()->getRowArray();}
    protected function masterId(string $t,string $col,string $code):?int{$r=db_connect()->table($t)->select('id')->where([$col=>$code,'is_active'=>1])->get()->getRowArray();return $r?(int)$r['id']:null;}
    protected function code(string $t,string $col,int $id):string{return (string)(db_connect()->table($t)->select($col)->where('id',$id)->get()->getRowArray()[$col]??'');}
    protected function project(int $id,object $u,bool $operate=false):?array{$p=$this->row('projects',$id,$this->company($u));if(!$p)return null;$b=(int)($p['branch_id']??0);return $b&&!$this->authorization->canAccessBranch($b,$operate?'OPERATE':'VIEW',$u)?null:$p;}
    protected function validSite(?int $id,int $project,int $company):bool{return !$id||db_connect()->table('project_sites')->where(['id'=>$id,'project_id'=>$project,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0;}
    protected function validZone(?int $id,?int $site,int $company):bool{return !$id||($site&&db_connect()->table('site_work_zones')->where(['id'=>$id,'site_id'=>$site,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0);}
    protected function logStatus(string $entity,int $id,?string $old,string $new,string $action,int $company,int $user,?string $remarks):void{$et=$this->masterId('subcontract_status_logs_entity_type_masters','entity_type_code',$entity);$at=$this->masterId('subcontract_status_logs_action_type_masters','action_type_code',$action)??$this->masterId('subcontract_status_logs_action_type_masters','action_type_code','STATUS_CHANGED');if($et&&$at)db_connect()->table('subcontract_status_logs')->insert(['company_id'=>$company,'entity_type_id'=>$et,'entity_id'=>$id,'old_status'=>$old,'new_status'=>$new,'action_type_id'=>$at,'changed_by'=>$user,'changed_at'=>$this->now(),'remarks'=>$remarks]);}
    protected function safe(callable $fn):ResponseInterface{try{return $fn();}catch(Throwable $e){log_message('error','Subcontract API error: {error}',['error'=>$e->getMessage()]);return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to complete subcontract operation.']);}}
}
