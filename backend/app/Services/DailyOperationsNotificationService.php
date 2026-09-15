<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NotificationModel;
use Throwable;

class DailyOperationsNotificationService
{
    private $db;
    private NotificationModel $notifications;
    public function __construct(){ $this->db=db_connect();$this->notifications=new NotificationModel(); }

    public function notify(array $report,string $action,int $actorId):void
    {
        $action=strtoupper($action);$event=$this->db->table('notification_event_masters')->where(['event_code'=>'DAILY_REPORT_'.$action,'is_active'=>1])->get()->getRowArray();if(!$event){log_message('error','Daily report notification event is not configured: {event}',['event'=>'DAILY_REPORT_'.$action]);return;}
        $project=$this->db->table('projects')->select('id,project_name,branch_id')->where(['id'=>(int)$report['project_id'],'company_id'=>(int)$report['company_id']])->where('deleted_at',null)->get()->getRowArray();if(!$project)return;
        $permission=$action==='SUBMITTED'?'daily_reports.review':($action==='REVIEWED'?'daily_reports.approve':null);$recipients=$permission?$this->approvers($report,$project,$permission,$actorId):$this->originator($report,$actorId);$verb=strtolower($action);$title='Daily site report '.$verb;$message=sprintf('%s has been %s.',(string)$report['report_no'],$verb);
        foreach($recipients as$r){$id=$this->notifications->insert(['company_id'=>(int)$report['company_id'],'recipient_user_id'=>(int)$r['id'],'event_id'=>(int)$event['id'],'project_id'=>(int)$report['project_id'],'source_module'=>'DAILY_REPORT','source_table'=>'daily_site_reports','source_record_id'=>(int)$report['id'],'title'=>$title,'message'=>$message,'action_url'=>'/daily-site-reports/'.(int)$report['id'],'is_read'=>0,'email_sent'=>0,'created_by'=>$actorId],true);if(is_int($id)&&$id>0)$this->sendEmail($id,$r,$title,$message,$project);}
    }
    private function approvers(array $report,array $project,string $permission,int $actorId):array
    {
        $today=date('Y-m-d');$b=$this->db->table('users u')->distinct()->select('u.id,u.email,u.first_name,u.last_name')->join('user_statuses us','us.id=u.user_status_id')->join('user_roles ur','ur.user_id=u.id AND ur.company_id=u.company_id','left')->join('roles r','r.id=ur.role_id AND r.company_id=ur.company_id','left')->join('role_permissions rp','rp.role_id=r.id AND rp.company_id=r.company_id','left')->join('permissions p','p.id=rp.permission_id','left')->join('user_branch_access uba','uba.user_id=u.id AND uba.company_id=u.company_id','left')->join('user_branch_access_access_level_masters alm','alm.id=uba.access_level_id','left')->where('u.company_id',(int)$report['company_id'])->where(['u.is_active'=>1,'u.active'=>1])->where('u.deleted_at',null)->where(['us.status_code'=>'ACTIVE','us.is_login_allowed'=>1,'us.is_active'=>1])->groupStart()->where('u.is_super_admin',1)->orGroupStart()->where(['ur.is_active'=>1,'r.is_active'=>1,'rp.is_active'=>1,'p.is_active'=>1])->where('ur.deleted_at',null)->where('r.deleted_at',null)->where('rp.deleted_at',null)->where('p.deleted_at',null)->where('p.permission_code',$permission)->groupStart()->where('ur.valid_from',null)->orWhere('ur.valid_from <=',$today)->groupEnd()->groupStart()->where('ur.valid_until',null)->orWhere('ur.valid_until >=',$today)->groupEnd()->groupEnd()->groupEnd();
        if((int)($project['branch_id']??0)>0)$b->groupStart()->where('u.is_super_admin',1)->orGroupStart()->where('uba.branch_id',(int)$project['branch_id'])->where(['uba.is_active'=>1,'alm.is_active'=>1])->where('uba.deleted_at',null)->whereIn('alm.access_level_code',['OPERATE','MANAGE'])->groupStart()->where('uba.valid_from',null)->orWhere('uba.valid_from <=',$today)->groupEnd()->groupStart()->where('uba.valid_until',null)->orWhere('uba.valid_until >=',$today)->groupEnd()->groupEnd()->groupEnd();return $b->get()->getResultArray();
    }
    private function originator(array $report,int $actorId):array{$id=(int)($report['submitted_by']??$report['created_by']??0);if($id<=0)return[];return $this->db->table('users u')->select('u.id,u.email,u.first_name,u.last_name')->join('user_statuses us','us.id=u.user_status_id')->where(['u.id'=>$id,'u.company_id'=>(int)$report['company_id'],'u.is_active'=>1,'u.active'=>1,'us.status_code'=>'ACTIVE','us.is_login_allowed'=>1,'us.is_active'=>1])->where('u.deleted_at',null)->get()->getResultArray();}
    private function sendEmail(int $notificationId,array $recipient,string $subject,string $message,array $project):void
    {
        if(trim((string)($recipient['email']??''))===''){ $this->notifications->update($notificationId,['email_error'=>'Recipient email address is empty.']);return; }
        try{$email=service('email');$email->setTo((string)$recipient['email'])->setSubject($subject)->setMessage('<p>Hello '.esc(trim(($recipient['first_name']??'').' '.($recipient['last_name']??''))).',</p><p>'.esc($message).'</p><p>Project: '.esc((string)$project['project_name']).'</p>');if(!$email->send())throw new \RuntimeException(strip_tags($email->printDebugger(['headers'])));$this->notifications->update($notificationId,['email_sent'=>1,'email_sent_at'=>date('Y-m-d H:i:s'),'email_error'=>null]);}catch(Throwable $e){$error=mb_substr($e->getMessage(),0,1000);$this->notifications->update($notificationId,['email_error'=>$error]);log_message('error','Daily report email failed for notification {id}: {error}',['id'=>$notificationId,'error'=>$error]);}
    }
}
