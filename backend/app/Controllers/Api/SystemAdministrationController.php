<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class SystemAdministrationController extends BaseController
{
    private function user(): ?object { return auth('session')->user(); }
    private function fail(string $message, int $status = 400): ResponseInterface { return $this->response->setStatusCode($status)->setJSON(['success'=>false,'message'=>$message]); }
    private function ok(string $message, string $key, mixed $data): ResponseInterface { return $this->response->setJSON(['success'=>true,'message'=>$message,'data'=>[$key=>$data]]); }
    private function safe(callable $callback): ResponseInterface { try { return $callback(); } catch (Throwable $e) { log_message('error','Module 12 API error: {error}',['error'=>$e->getMessage()]); return $this->fail('Unable to complete the system administration request.',500); } }
    private function input(): array { $json=$this->request->getJSON(true); return is_array($json)?$json:$this->request->getPost(); }

    public function masters(): ResponseInterface
    {
        return $this->safe(function(){ if(!$this->user())return $this->fail('Authentication required.',401); $db=db_connect(); return $this->ok('System administration masters retrieved.','masters',[
            'activity_statuses'=>$db->table('activity_logs_status_masters')->where('is_active',1)->orderBy('sort_order')->get()->getResultArray(),
            'notification_events'=>$db->table('notification_event_masters')->where('is_active',1)->orderBy('sort_order')->get()->getResultArray()
        ]); });
    }

    public function notificationSummary(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $c=(int)$u->company_id; $db=db_connect();
            $row=$db->query("SELECT COUNT(*) total, SUM(is_read=0) unread, SUM(email_sent=1) email_sent, SUM(email_sent=0 AND email_error IS NOT NULL) email_failed, SUM(email_sent=0 AND email_error IS NULL) email_pending, COUNT(DISTINCT source_module) source_modules FROM notifications WHERE company_id=?",[$c])->getRowArray();
            $modules=$db->query("SELECT source_module,COUNT(*) total,SUM(is_read=0) unread,SUM(email_sent=1) email_sent,SUM(email_sent=0 AND email_error IS NOT NULL) email_failed FROM notifications WHERE company_id=? GROUP BY source_module ORDER BY source_module",[$c])->getResultArray();
            return $this->ok('Notification health summary generated.','notification_summary',['totals'=>$row,'modules'=>$modules]); });
    }

    public function notifications(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $b=db_connect()->table('notifications n')->select('n.*,e.event_code,e.event_name,u.email recipient_email,u.first_name,u.last_name,p.project_name')->join('notification_event_masters e','e.id=n.event_id')->join('users u','u.id=n.recipient_user_id')->join('projects p','p.id=n.project_id','left')->where('n.company_id',(int)$u->company_id);
            if($v=$this->request->getGet('source_module'))$b->where('n.source_module',strtoupper(trim((string)$v))); if($v=$this->request->getGet('event_code'))$b->where('e.event_code',strtoupper(trim((string)$v))); if($this->request->getGet('email_status')==='sent')$b->where('n.email_sent',1); if($this->request->getGet('email_status')==='failed')$b->where('n.email_sent',0)->where('n.email_error IS NOT NULL',null,false); if($this->request->getGet('unread')==='1')$b->where('n.is_read',0); if($v=$this->request->getGet('from_date'))$b->where('n.created_at >=',$v.' 00:00:00'); if($v=$this->request->getGet('to_date'))$b->where('n.created_at <=',$v.' 23:59:59');
            return $this->ok('Notification administration records retrieved.','notifications',$b->orderBy('n.id','DESC')->limit(500)->get()->getResultArray()); });
    }

    public function auditLogs(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $b=db_connect()->table('activity_logs a')->select('a.*,s.status_code,s.status_name,u.email user_email,u.first_name,u.last_name,b.branch_name')->join('activity_logs_status_masters s','s.id=a.status_id')->join('users u','u.id=a.user_id','left')->join('branches b','b.id=a.branch_id','left')->where('a.company_id',(int)$u->company_id);
            if($v=$this->request->getGet('module_code'))$b->where('a.module_code',strtoupper(trim((string)$v))); if($v=$this->request->getGet('action_code'))$b->where('a.action_code',strtoupper(trim((string)$v))); if($v=$this->request->getGet('status'))$b->where('s.status_code',strtoupper(trim((string)$v))); if($v=$this->request->getGet('user_id'))$b->where('a.user_id',(int)$v); if($v=$this->request->getGet('from_date'))$b->where('a.occurred_at >=',$v.' 00:00:00'); if($v=$this->request->getGet('to_date'))$b->where('a.occurred_at <=',$v.' 23:59:59');
            return $this->ok('Activity audit trail retrieved.','audit_logs',$b->orderBy('a.id','DESC')->limit(500)->get()->getResultArray()); });
    }

    public function auditDetail(int $id): ResponseInterface
    {
        return $this->safe(function()use($id){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $row=db_connect()->table('activity_logs a')->select('a.*,s.status_code,s.status_name,u.email user_email,u.first_name,u.last_name')->join('activity_logs_status_masters s','s.id=a.status_id')->join('users u','u.id=a.user_id','left')->where(['a.id'=>$id,'a.company_id'=>(int)$u->company_id])->get()->getRowArray(); if(!$row)return $this->fail('Audit log not found.',404); foreach(['old_values','new_values']as$f)if(is_string($row[$f]??null))$row[$f]=json_decode($row[$f],true); return $this->ok('Activity audit detail retrieved.','audit_log',$row); });
    }

    public function recordAudit(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $d=$this->input(); foreach(['module_code','action_code','description']as$f)if(trim((string)($d[$f]??''))==='')return $this->fail($f.' is required.'); $db=db_connect(); $statusCode=strtoupper((string)($d['status']??'SUCCESS')); $status=$db->table('activity_logs_status_masters')->select('id')->where(['status_code'=>$statusCode,'is_active'=>1])->get()->getRowArray(); if(!$status)return $this->fail('Activity status master is invalid.'); $row=['company_id'=>(int)$u->company_id,'branch_id'=>isset($d['branch_id'])?(int)$d['branch_id']:((int)($u->default_branch_id??0)?:null),'user_id'=>(int)$u->id,'module_code'=>strtoupper(trim((string)$d['module_code'])),'action_code'=>strtoupper(trim((string)$d['action_code'])),'entity_type'=>$d['entity_type']??null,'entity_id'=>isset($d['entity_id'])?(int)$d['entity_id']:null,'description'=>trim((string)$d['description']),'old_values'=>isset($d['old_values'])?json_encode($d['old_values'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES):null,'new_values'=>isset($d['new_values'])?json_encode($d['new_values'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES):null,'request_method'=>$this->request->getMethod(),'request_url'=>(string)$this->request->getUri(),'ip_address'=>$this->request->getIPAddress(),'user_agent'=>mb_substr($this->request->getUserAgent()->getAgentString(),0,500),'session_id'=>(string)session_id(),'status_id'=>(int)$status['id'],'error_message'=>$d['error_message']??null,'occurred_at'=>date('Y-m-d H:i:s')]; $db->table('activity_logs')->insert($row); $id=(int)$db->insertID(); return $this->ok('Activity audit event recorded.','audit_log',$db->table('activity_logs')->where('id',$id)->get()->getRowArray())->setStatusCode(201); });
    }

    public function loginHistory(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $b=db_connect()->table('auth_logins l')->select('l.*,u.company_id,u.email user_email,u.first_name,u.last_name')->join('users u','u.id=l.user_id','left')->groupStart()->where('u.company_id',(int)$u->company_id)->orWhere('l.identifier',(string)$u->email)->groupEnd(); if($this->request->getGet('success')!==null)$b->where('l.success',(int)$this->request->getGet('success')); if($v=$this->request->getGet('from_date'))$b->where('l.date >=',$v.' 00:00:00'); if($v=$this->request->getGet('to_date'))$b->where('l.date <=',$v.' 23:59:59'); return $this->ok('Login security history retrieved.','login_history',$b->orderBy('l.id','DESC')->limit(500)->get()->getResultArray()); });
    }

    public function integrity(): ResponseInterface
    {
        return $this->safe(function(){ $u=$this->user(); if(!$u)return $this->fail('Authentication required.',401); $db=db_connect(); $required=['activity_logs','activity_logs_status_masters','auth_logins','notifications','notification_event_masters']; $tables=[]; foreach($required as$t)$tables[$t]=$db->tableExists($t); $events=(int)($db->query('SELECT COUNT(*) total FROM notification_event_masters WHERE is_active=1')->getRowArray()['total']??0); $orphans=(int)($db->query('SELECT COUNT(*) total FROM notifications n LEFT JOIN notification_event_masters e ON e.id=n.event_id WHERE n.company_id=? AND e.id IS NULL',[(int)$u->company_id])->getRowArray()['total']??0); $failures=(int)($db->query('SELECT COUNT(*) total FROM notifications WHERE company_id=? AND email_sent=0 AND email_error IS NOT NULL',[(int)$u->company_id])->getRowArray()['total']??0); return $this->ok('System integrity check completed.','integrity',['healthy'=>!in_array(false,$tables,true)&&$events>0&&$orphans===0,'tables'=>$tables,'active_notification_events'=>$events,'orphan_notifications'=>$orphans,'historical_email_failures'=>$failures]); });
    }
}
