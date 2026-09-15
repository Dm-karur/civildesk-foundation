<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;

abstract class DailyOperationsApiController extends BaseController
{
    protected AuthorizationService $authorization;

    public function __construct(){ $this->authorization=new AuthorizationService(); }
    protected function user():?object{return auth('session')->user();}
    protected function company(object $u):int{return (int)$u->company_id;}
    protected function input():?array{$v=$this->request->getJSON(true);return is_array($v)?$v:null;}
    protected function now():string{return date('Y-m-d H:i:s');}
    protected function ok(string $message,string $key,mixed $value,int $status=200):ResponseInterface{return $this->response->setStatusCode($status)->setJSON(['success'=>true,'message'=>$message,'data'=>[$key=>$value]]);}
    protected function invalid(array $errors,string $message='Validation failed.'):ResponseInterface{return $this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>$message,'errors'=>$errors]);}
    protected function unauthorized():ResponseInterface{return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);}
    protected function notFound(string $message='Record not found.'):ResponseInterface{return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>$message]);}
    protected function conflict(string $message):ResponseInterface{return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$message]);}
    protected function required(array $data,array $fields):array{$e=[];foreach($fields as$f)if(!array_key_exists($f,$data)||$data[$f]===null||(is_string($data[$f])&&trim($data[$f])===''))$e[$f]='This field is required.';return $e;}
    protected function active(string $table,int $id):bool{return $id>0&&db_connect()->table($table)->where('id',$id)->where('is_active',1)->countAllResults()>0;}
    protected function masterId(string $table,string $column,string $code):?int{$r=db_connect()->table($table)->select('id')->where($column,$code)->where('is_active',1)->get()->getRowArray();return $r?(int)$r['id']:null;}
    protected function row(string $table,int $id,int $company,bool $soft=true):?array{$b=db_connect()->table($table)->where(['id'=>$id,'company_id'=>$company]);if($soft)$b->where('deleted_at',null);return $b->get()->getRowArray();}
    protected function project(int $id,object $user,bool $operate=false):?array{$p=$this->row('projects',$id,$this->company($user));if(!$p)return null;$branch=(int)($p['branch_id']??0);if($branch>0&&!$this->authorization->canAccessBranch($branch,$operate?'OPERATE':'VIEW',$user))return null;return $p;}
    protected function report(int $id,object $user,bool $operate=false):?array{$r=$this->row('daily_site_reports',$id,$this->company($user));return $r&&$this->project((int)$r['project_id'],$user,$operate)?$r:null;}
    protected function validSite(int $site,int $project,int $company):bool{return db_connect()->table('project_sites')->where(['id'=>$site,'project_id'=>$project,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0;}
    protected function validZone(?int $zone,int $site,int $company):bool{return !$zone||db_connect()->table('site_work_zones')->where(['id'=>$zone,'site_id'=>$site,'company_id'=>$company])->where('deleted_at',null)->countAllResults()>0;}
    protected function editable(array $report):bool{$code=$this->statusCode($report);return in_array($code,['DRAFT','REOPENED','REJECTED'],true);}
    protected function statusCode(array $report):string{$r=db_connect()->table('daily_site_reports_status_masters')->select('status_code')->where('id',(int)$report['status_id'])->get()->getRowArray();return (string)($r['status_code']??'');}
    protected function validCompanyUser(?int $id,int $company):bool{return !$id||db_connect()->table('users')->where(['id'=>$id,'company_id'=>$company,'is_active'=>1,'active'=>1])->where('deleted_at',null)->countAllResults()>0;}
}
