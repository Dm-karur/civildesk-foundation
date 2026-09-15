<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Services\DailyOperationsNotificationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class DailySiteReportsController extends DailyOperationsApiController
{
    private array $fields=['project_id','site_id','report_no','report_date','shift_type_id','work_start_time','work_end_time','prepared_by','site_engineer_id','supervisor_id','safety_briefing_done','safety_incident_count','planned_progress_percentage','actual_progress_percentage','overall_work_summary','next_day_plan','client_instructions','internal_notes'];

    public function index():ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$c=$this->company($u);$b=db_connect()->table('daily_site_reports r')->select('r.*,p.project_name,s.site_name,st.status_code,st.status_name,sh.shift_type_code,sh.shift_type_name')->join('projects p','p.id=r.project_id AND p.company_id=r.company_id')->join('project_sites s','s.id=r.site_id AND s.project_id=r.project_id')->join('daily_site_reports_status_masters st','st.id=r.status_id')->join('daily_site_reports_shift_type_masters sh','sh.id=r.shift_type_id')->where('r.company_id',$c)->where('r.deleted_at',null);
        foreach(['project_id','site_id','status_id']as$f)if((int)($this->request->getGet($f)??0)>0)$b->where('r.'.$f,(int)$this->request->getGet($f));
        if($this->request->getGet('date_from'))$b->where('r.report_date >=',(string)$this->request->getGet('date_from'));if($this->request->getGet('date_to'))$b->where('r.report_date <=',(string)$this->request->getGet('date_to'));
        $q=trim((string)($this->request->getGet('search')??''));if($q!=='')$b->groupStart()->like('r.report_no',$q)->orLike('r.overall_work_summary',$q)->orLike('p.project_name',$q)->orLike('s.site_name',$q)->groupEnd();
        $rows=[];foreach($b->orderBy('r.report_date','DESC')->orderBy('r.id','DESC')->get()->getResultArray()as$r)if($this->project((int)$r['project_id'],$u,false))$rows[]=$r;
        return $this->ok('Daily site reports retrieved successfully.','daily_site_reports',$rows);
    }

    public function show(int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($id,$u);if(!$r)return $this->notFound('Daily site report not found.');$db=db_connect();$c=$this->company($u);
        $r['status']=$db->table('daily_site_reports_status_masters')->where('id',$r['status_id'])->get()->getRowArray();$r['shift_type']=$db->table('daily_site_reports_shift_type_masters')->where('id',$r['shift_type_id'])->get()->getRowArray();
        foreach(['work_progress'=>'daily_work_progress','manpower'=>'daily_site_manpower','equipment'=>'daily_site_equipment','weather'=>'daily_site_weather','issues'=>'daily_site_issues','visitors'=>'daily_site_visitors','photos'=>'daily_site_photos','material_consumption'=>'daily_material_consumption','approvals'=>'daily_report_approvals']as$k=>$t){$b=$db->table($t)->where(['company_id'=>$c,'daily_report_id'=>$id]);if($t!=='daily_report_approvals')$b->where('deleted_at',null);$r[$k]=$b->orderBy('id')->get()->getResultArray();}
        return $this->ok('Daily site report retrieved successfully.','daily_site_report',$r);
    }

    public function create():ResponseInterface{return $this->save(null);}
    public function update(int $id):ResponseInterface{return $this->save($id);}
    private function save(?int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$in=$this->input();if($in===null)return $this->invalid(['body'=>'A valid JSON request body is required.']);$c=$this->company($u);$old=$id?$this->report($id,$u,true):null;if($id&&!$old)return $this->notFound('Daily site report not found.');if($old&&!$this->editable($old))return $this->conflict('Only a draft, reopened or rejected report can be edited.');
        $d=array_intersect_key($in,array_flip($this->fields));$m=array_merge($old??[],$d);$e=$this->required($m,['project_id','site_id','report_no','report_date','shift_type_id']);$p=$this->project((int)($m['project_id']??0),$u,true);if(!$p)$e['project_id']='Select an accessible company project.';if(!$this->validSite((int)($m['site_id']??0),(int)($m['project_id']??0),$c))$e['site_id']='Select a valid project site.';if(!$this->active('daily_site_reports_shift_type_masters',(int)($m['shift_type_id']??0)))$e['shift_type_id']='Select a valid shift type.';foreach(['prepared_by','site_engineer_id','supervisor_id']as$f)if(!$this->validCompanyUser(isset($m[$f])?(int)$m[$f]:null,$c))$e[$f]='Select a valid company user.';foreach(['planned_progress_percentage','actual_progress_percentage']as$f)if((float)($m[$f]??0)<0||(float)($m[$f]??0)>100)$e[$f]='Value must be between 0 and 100.';
        $dup=db_connect()->table('daily_site_reports')->where(['company_id'=>$c,'project_id'=>(int)($m['project_id']??0),'site_id'=>(int)($m['site_id']??0),'report_date'=>(string)($m['report_date']??'')])->where('deleted_at',null);if($id)$dup->where('id !=',$id);if($dup->countAllResults())$e['report_date']='An active report already exists for this project, site and date.';$no=db_connect()->table('daily_site_reports')->where(['company_id'=>$c,'report_no'=>(string)($m['report_no']??'')])->where('deleted_at',null);if($id)$no->where('id !=',$id);if($no->countAllResults())$e['report_no']='Report number already exists.';if($e)return $this->invalid($e);
        $d['updated_by']=(int)$u->id;if(!$id){$d['company_id']=$c;$d['status_id']=$this->masterId('daily_site_reports_status_masters','status_code','DRAFT');$d['created_by']=(int)$u->id;}$model=new \App\Models\DailySiteReportModel();$id?$model->update($id,$d):$id=(int)$model->insert($d,true);return $this->ok('Daily site report '.($old?'updated':'created').' successfully.','daily_site_report',$this->report($id,$u),$old?200:201);
    }

    public function delete(int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($id,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if($this->statusCode($r)!=='DRAFT')return $this->conflict('Only a draft report can be deleted.');(new \App\Models\DailySiteReportModel())->delete($id);return $this->response->setJSON(['success'=>true,'message'=>'Daily site report deleted successfully.']);
    }

    public function action(int $id,string $action):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($id,$u,true);if(!$r)return $this->notFound('Daily site report not found.');$action=strtoupper($action);$from=$this->statusCode($r);$rules=['SUBMIT'=>[['DRAFT','REOPENED','REJECTED'],'SUBMITTED','SUBMITTED'],'REVIEW'=>[['SUBMITTED'],'REVIEWED','REVIEWED'],'APPROVE'=>[['SUBMITTED','REVIEWED'],'APPROVED','APPROVED'],'REJECT'=>[['SUBMITTED','REVIEWED'],'REJECTED','REJECTED'],'REOPEN'=>[['APPROVED','REJECTED','CANCELLED'],'REOPENED','REOPENED'],'CANCEL'=>[['DRAFT','SUBMITTED','REVIEWED','REOPENED','REJECTED'],'CANCELLED','CANCELLED']];if(!isset($rules[$action]))return $this->notFound('Workflow action not found.');[$allowed,$to,$event]=$rules[$action];if(!in_array($from,$allowed,true))return $this->conflict("Cannot {$action} a report in {$from} status.");$in=$this->input()??[];$remarks=trim((string)($in['remarks']??''));if(in_array($action,['REJECT','REOPEN','CANCEL'],true)&&$remarks==='')return $this->invalid(['remarks'=>'Remarks are required for this action.']);
        $db=db_connect();$db->transBegin();try{$toId=$this->masterId('daily_site_reports_status_masters','status_code',$to);$actId=$this->masterId('daily_report_approvals_action_type_masters','action_type_code',$event);$fromId=$this->masterId('daily_report_approvals_from_status_masters','from_status_code',$from);$historyTo=$this->masterId('daily_report_approvals_to_status_masters','to_status_code',$to);if(!$toId||!$actId||!$fromId||!$historyTo)throw new \RuntimeException('Workflow master configuration is incomplete.');$update=['status_id'=>$toId,'updated_by'=>(int)$u->id];if($action==='SUBMIT')$update+=['submitted_by'=>(int)$u->id,'submitted_at'=>$this->now()];if($action==='APPROVE')$update+=['approved_by'=>(int)$u->id,'approved_at'=>$this->now(),'approval_remarks'=>$remarks?:null];if($action==='REJECT')$update['approval_remarks']=$remarks;$db->table('daily_site_reports')->where('id',$id)->update($update);$db->table('daily_report_approvals')->insert(['company_id'=>$this->company($u),'daily_report_id'=>$id,'action_type_id'=>$actId,'from_status_id'=>$fromId,'to_status_id'=>$historyTo,'action_by'=>(int)$u->id,'action_at'=>$this->now(),'remarks'=>$remarks?:null,'created_at'=>$this->now()]);if($db->transStatus()===false)throw new \RuntimeException('Database transaction failed.');$db->transCommit();}catch(Throwable $e){$db->transRollback();log_message('error','Daily report workflow failed: {error}',['error'=>$e->getMessage()]);return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to complete daily report workflow action.']);}
        $updated=$this->report($id,$u);try{(new DailyOperationsNotificationService())->notify($updated,$event,(int)$u->id);}catch(Throwable $e){log_message('error','Daily report notification processing failed: {error}',['error'=>$e->getMessage()]);}
        return $this->ok('Daily site report '.strtolower($event).' successfully.','daily_site_report',$updated);
    }
}
