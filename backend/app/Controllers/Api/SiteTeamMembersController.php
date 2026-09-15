<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\SiteTeamMemberModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class SiteTeamMembersController extends BaseController
{
    private SiteTeamMemberModel $members;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->members = new SiteTeamMemberModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $siteId): ResponseInterface
    {
        $ctx = $this->siteContext($siteId, false);
        if ($ctx instanceof ResponseInterface) return $ctx;
        try {
            $q = $this->baseQuery()->where('site_team_members.company_id',$ctx['company_id'])->where('site_team_members.site_id',$siteId);
            foreach (['team_role_id','user_id'] as $field) {
                $v=(int)($this->request->getGet($field)??0); if($v>0)$q->where('site_team_members.'.$field,$v);
            }
            $active=$this->request->getGet('is_active'); if($active!==null && in_array((string)$active,['0','1'],true))$q->where('site_team_members.is_active',(int)$active);
            return $this->response->setJSON(['success'=>true,'message'=>'Site team members retrieved successfully.','data'=>['team_members'=>$q->orderBy('site_team_members.is_primary','DESC')->orderBy('project_team_roles.sort_order','ASC')->orderBy('users.first_name','ASC')->findAll()]]);
        } catch(Throwable $e){return $this->serverError($e);}
    }

    public function show(int $siteId,int $id): ResponseInterface
    {
        $ctx=$this->siteContext($siteId,false); if($ctx instanceof ResponseInterface)return $ctx;
        $row=$this->findMember($ctx['company_id'],$siteId,$id); if($row===null)return $this->notFound();
        return $this->response->setJSON(['success'=>true,'message'=>'Site team member retrieved successfully.','data'=>['team_member'=>$row]]);
    }

    public function create(int $siteId): ResponseInterface
    {
        $ctx=$this->siteContext($siteId,true); if($ctx instanceof ResponseInterface)return $ctx;
        $input=$this->request->getJSON(true); if(!is_array($input))return $this->invalid(['body'=>'A valid JSON request body is required.']);
        $data=$this->writableData($input)+['is_primary'=>0,'can_approve'=>0,'is_active'=>1];
        $data['company_id']=$ctx['company_id'];$data['project_id']=$ctx['project_id'];$data['site_id']=$siteId;$data['created_by']=$ctx['user_id'];$data['updated_by']=$ctx['user_id'];
        $v=$this->validateAssignment($data,$ctx['company_id']); if($v!==null)return $v;
        if($this->duplicateExists($siteId,(int)$data['user_id'],(int)$data['team_role_id']))return $this->conflict('This user is already assigned to the site in the selected role.');
        $db=db_connect();$db->transBegin();
        try{
            if((int)$data['is_primary']===1)$this->clearPrimary($ctx['company_id'],$siteId,(int)$data['team_role_id'],$ctx['user_id']);
            if(!$this->members->insert($data)){ $db->transRollback(); return $this->invalid($this->members->errors()); }
            $id=(int)$this->members->getInsertID();$db->transCommit();
            return $this->response->setStatusCode(201)->setJSON(['success'=>true,'message'=>'Site team member assigned successfully.','data'=>['team_member'=>$this->findMember($ctx['company_id'],$siteId,$id)]]);
        }catch(DatabaseException $e){$db->transRollback();return $this->conflict('This site team assignment already exists or conflicts with existing data.');}catch(Throwable $e){$db->transRollback();return $this->serverError($e);}
    }

    public function update(int $siteId,int $id): ResponseInterface
    {
        $ctx=$this->siteContext($siteId,true); if($ctx instanceof ResponseInterface)return $ctx;
        $existing=$this->members->where('company_id',$ctx['company_id'])->where('site_id',$siteId)->find($id);if($existing===null)return $this->notFound();
        $input=$this->request->getJSON(true);if(!is_array($input)||$input===[])return $this->invalid(['body'=>'A non-empty JSON request body is required.']);
        $data=$this->writableData($input);unset($data['user_id']);$data['updated_by']=$ctx['user_id'];$merged=array_merge($existing,$data);
        $v=$this->validateAssignment($merged,$ctx['company_id']);if($v!==null)return $v;
        if($this->duplicateExists($siteId,(int)$existing['user_id'],(int)$merged['team_role_id'],$id))return $this->conflict('This user is already assigned to the site in the selected role.');
        $db=db_connect();$db->transBegin();try{
            if((int)$merged['is_primary']===1)$this->clearPrimary($ctx['company_id'],$siteId,(int)$merged['team_role_id'],$ctx['user_id'],$id);
            if(!$this->members->update($id,$data)){ $db->transRollback(); return $this->invalid($this->members->errors()); }
            $db->transCommit();return $this->response->setJSON(['success'=>true,'message'=>'Site team member updated successfully.','data'=>['team_member'=>$this->findMember($ctx['company_id'],$siteId,$id)]]);
        }catch(Throwable $e){$db->transRollback();return $this->serverError($e);}
    }

    public function delete(int $siteId,int $id): ResponseInterface
    {
        $ctx=$this->siteContext($siteId,true);if($ctx instanceof ResponseInterface)return $ctx;
        $row=$this->members->where('company_id',$ctx['company_id'])->where('site_id',$siteId)->find($id);if($row===null)return $this->notFound();
        try{$this->members->update($id,['is_active'=>0,'updated_by'=>$ctx['user_id']]);$this->members->delete($id);return $this->response->setJSON(['success'=>true,'message'=>'Site team member removed successfully.']);}catch(Throwable $e){return $this->serverError($e);}
    }

    private function siteContext(int $siteId,bool $operate): array|ResponseInterface
    {
        $user=auth('session')->user();if($user===null)return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication required.']);
        $site=db_connect()->table('project_sites ps')->select('ps.*, p.branch_id')->join('projects p','p.id=ps.project_id')->where('ps.id',$siteId)->where('ps.company_id',(int)$user->company_id)->where('ps.deleted_at',null)->where('p.deleted_at',null)->get()->getRowArray();
        if($site===null)return $this->siteNotFound();$branchId=(int)($site['branch_id']??0);
        if(!$this->authorization->isSuperAdmin($user)&&$branchId>0&&!$this->authorization->canAccessBranch($branchId,$operate?'OPERATE':'VIEW',$user))return $this->siteNotFound();
        return ['company_id'=>(int)$user->company_id,'user_id'=>(int)$user->id,'project_id'=>(int)$site['project_id']];
    }

    private function baseQuery(): SiteTeamMemberModel
    {
        return $this->members->select(['site_team_members.*','users.employee_code','users.username','users.first_name','users.last_name','users.email','users.designation','project_team_roles.role_code AS team_role_code','project_team_roles.role_name AS team_role_name','project_sites.site_code','project_sites.site_name','projects.project_code','projects.project_name'])->join('users','users.id=site_team_members.user_id')->join('project_team_roles','project_team_roles.id=site_team_members.team_role_id')->join('project_sites','project_sites.id=site_team_members.site_id')->join('projects','projects.id=site_team_members.project_id');
    }
    private function findMember(int $companyId,int $siteId,int $id):?array{return $this->baseQuery()->where('site_team_members.company_id',$companyId)->where('site_team_members.site_id',$siteId)->find($id);}
    private function writableData(array $input):array{return array_intersect_key($input,array_flip(['user_id','team_role_id','responsibility','assignment_start','assignment_end','is_primary','can_approve','is_active']));}
    private function validateAssignment(array $d,int $companyId):?ResponseInterface
    {
        $e=[];$db=db_connect();$uid=(int)($d['user_id']??0);$rid=(int)($d['team_role_id']??0);
        if($uid<=0||$db->table('users')->where('id',$uid)->where('company_id',$companyId)->where('is_active',1)->where('deleted_at',null)->countAllResults()!==1)$e['user_id']='Select a valid active user for this company.';
        if($rid<=0||$db->table('project_team_roles')->where('id',$rid)->where('is_active',1)->countAllResults()!==1)$e['team_role_id']='Select a valid active project team role.';
        if(!empty($d['assignment_start'])&&!empty($d['assignment_end'])&&$d['assignment_end']<$d['assignment_start'])$e['assignment_end']='Assignment end date cannot be before the start date.';
        foreach (['is_primary', 'can_approve', 'is_active'] as $f) {
            if (!array_key_exists($f, $d)) {
                continue;
            }

            $value = $d[$f];
            $isValidBinary = is_bool($value)
                || (is_int($value) && in_array($value, [0, 1], true))
                || (is_string($value) && in_array($value, ['0', '1'], true));

            if (!$isValidBinary) {
                $e[$f] = 'The ' . $f . ' field must be 0 or 1.';
            }
        }
        return $e===[]?null:$this->invalid($e);
    }
    private function duplicateExists(int $siteId,int $userId,int $roleId,?int $except=null):bool{$b=db_connect()->table('site_team_members')->where('site_id',$siteId)->where('user_id',$userId)->where('team_role_id',$roleId)->where('deleted_at',null);if($except!==null)$b->where('id !=',$except);return $b->countAllResults()>0;}
    private function clearPrimary(int $companyId,int $siteId,int $roleId,int $userId,?int $except=null):void{$b=db_connect()->table('site_team_members')->where('company_id',$companyId)->where('site_id',$siteId)->where('team_role_id',$roleId)->where('deleted_at',null);if($except!==null)$b->where('id !=',$except);$b->update(['is_primary'=>0,'updated_by'=>$userId]);}
    private function invalid(array $errors):ResponseInterface{return $this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>'Validation failed.','errors'=>$errors]);}
    private function conflict(string $m):ResponseInterface{return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$m]);}
    private function siteNotFound():ResponseInterface{return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>'Site not found.']);}
    private function notFound():ResponseInterface{return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>'Site team member not found.']);}
    private function serverError(Throwable $e):ResponseInterface{log_message('error','Site team operation failed: {message}',['message'=>$e->getMessage()]);return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to process the site team request.']);}
}
