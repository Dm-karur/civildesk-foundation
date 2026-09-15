<?php
declare(strict_types=1);
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

abstract class MaterialApiController extends BaseController
{
    protected AuthorizationService $authorization;
    public function __construct(){ $this->authorization=new AuthorizationService(); }
    protected function user():?object{return auth('session')->user();}
    protected function input():?array{$v=$this->request->getJSON(true);return is_array($v)?$v:null;}
    protected function company(object $u):int{return(int)$u->company_id;}
    protected function now():string{return date('Y-m-d H:i:s');}
    protected function ok(string$m,string$k,mixed$v,int$s=200):ResponseInterface{return$this->response->setStatusCode($s)->setJSON(['success'=>true,'message'=>$m,'data'=>[$k=>$v]]);}
    protected function invalid(array$e,string$m='Validation failed.'):ResponseInterface{return$this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>$m,'errors'=>$e]);}
    protected function unauthorized():ResponseInterface{return$this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);}
    protected function notFound(string$m='Record not found.'):ResponseInterface{return$this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>$m]);}
    protected function conflict(string$m):ResponseInterface{return$this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$m]);}
    protected function required(array$d,array$f):array{$e=[];foreach($f as$x)if(!isset($d[$x])||(is_string($d[$x])&&trim($d[$x])===''))$e[$x]='This field is required.';return$e;}
    protected function row(string$t,int$id,int$c,bool$soft=true):?array{$b=db_connect()->table($t)->where('id',$id)->where('company_id',$c);if($soft)$b->where('deleted_at',null);return$b->get()->getRowArray();}
    protected function master(string$t,string$code):?array{return db_connect()->table($t)->where('is_active',1)->where(str_replace('_masters','',$t).'_code',$code)->get()->getRowArray();}
    protected function masterId(string$t,string$column,string$code):?int{$r=db_connect()->table($t)->select('id')->where($column,$code)->where('is_active',1)->get()->getRowArray();return$r?(int)$r['id']:null;}
    protected function active(string$t,int$id):bool{return$id>0&&db_connect()->table($t)->where('id',$id)->where('is_active',1)->countAllResults()>0;}
    protected function project(int$id,object$u,bool$operate=true):?array{$r=$this->row('projects',$id,$this->company($u));if(!$r)return null;$b=(int)($r['branch_id']??0);return$b&&!$this->authorization->canAccessBranch($b,$operate?'OPERATE':'VIEW',$u)?null:$r;}
    protected function site(int$id,int$p,object$u):?array{return$this->project($p,$u)?db_connect()->table('project_sites')->where(['id'=>$id,'company_id'=>$this->company($u),'project_id'=>$p])->where('deleted_at',null)->get()->getRowArray():null;}
    protected function zone(?int$id,int$site,int$c):bool{return$id===null||$id===0||db_connect()->table('site_work_zones')->where(['id'=>$id,'company_id'=>$c,'site_id'=>$site])->where('deleted_at',null)->countAllResults()>0;}
    protected function transaction(callable$f,string$m):ResponseInterface{$db=db_connect();$db->transBegin();try{$r=$f($db);if($db->transStatus()===false)throw new \RuntimeException('Database transaction failed.');$db->transCommit();return$r;}catch(Throwable$x){$db->transRollback();log_message('error',$m.' {exception}',['exception'=>$x]);return$this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>$m]);}}
    protected function saveHeader(string$t,array$allowed,array$required,?int$id,string$key,string$label):ResponseInterface{
        $u=$this->user();if(!$u)return$this->unauthorized();$in=$this->input();if($in===null)return$this->invalid(['body'=>'A valid JSON request body is required.']);$c=$this->company($u);$old=$id?$this->row($t,$id,$c):null;if($id&&!$old)return$this->notFound();$d=array_intersect_key($in,array_flip($allowed));$m=array_merge($old??[],$d);$e=$this->required($m,$required);if($e)return$this->invalid($e);$d['updated_by']=(int)$u->id;$d['updated_at']=$this->now();if(!$id)$d+=['company_id'=>$c,'created_by'=>(int)$u->id,'created_at'=>$this->now()];$b=db_connect()->table($t);$id?$b->where('id',$id)->update($d):$b->insert($d);$id??=(int)db_connect()->insertID();return$this->ok($label.($old?' updated':' created').' successfully.',$key,$this->row($t,$id,$c),$old?200:201);
    }
}
