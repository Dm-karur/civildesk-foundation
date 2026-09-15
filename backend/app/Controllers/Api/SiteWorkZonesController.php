<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\SiteWorkZoneModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class SiteWorkZonesController extends BaseController
{
    private SiteWorkZoneModel $zones;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->zones = new SiteWorkZoneModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        try {
            $b = $this->baseQuery()->where('site_work_zones.company_id', (int)$user->company_id);
            $siteId = (int)($this->request->getGet('site_id') ?? 0);
            if ($siteId > 0) {
                $site = $this->accessibleSite($siteId, $user);
                if ($site === null) return $this->forbidden('You cannot access the selected site.');
                $b->where('site_work_zones.site_id', $siteId);
            } elseif (!$this->authorization->isSuperAdmin($user)) {
                $ids = $this->authorization->getAccessibleBranchIds($user);
                if ($ids === []) return $this->successList([]);
                $b->whereIn('projects.branch_id', $ids);
            }
            foreach (['project_id','parent_zone_id','zone_type_id','status_id'] as $f) {
                $v = (int)($this->request->getGet($f) ?? 0); if ($v > 0) $b->where('site_work_zones.'.$f, $v);
            }
            $active = $this->request->getGet('is_active');
            if ($active !== null && in_array((string)$active, ['0','1'], true)) $b->where('site_work_zones.is_active', (int)$active);
            $q = trim((string)($this->request->getGet('search') ?? ''));
            if ($q !== '') $b->groupStart()->like('site_work_zones.zone_code',$q)->orLike('site_work_zones.zone_name',$q)->orLike('project_sites.site_name',$q)->groupEnd();
            return $this->successList($b->orderBy('project_sites.site_name')->orderBy('site_work_zones.display_order')->orderBy('site_work_zones.zone_name')->findAll());
        } catch (Throwable $e) { return $this->serverError('Site zone list retrieval failed.', $e); }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $zone = $this->baseQuery()->where('site_work_zones.company_id',(int)$user->company_id)->find($id);
        if ($zone === null || $this->accessibleSite((int)$zone['site_id'],$user) === null) return $this->notFound();
        return $this->response->setJSON(['success'=>true,'message'=>'Site zone retrieved successfully.','data'=>['zone'=>$zone]]);
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $input = $this->request->getJSON(true); if (!is_array($input)) return $this->invalid(['body'=>'A valid JSON request body is required.']);
        $siteId = (int)($input['site_id'] ?? 0); $site = $this->accessibleSite($siteId,$user,true);
        if ($site === null) return $this->invalid(['site_id'=>'Select a valid site you are permitted to operate.']);
        $data = $this->writable($input); $data['company_id']=(int)$user->company_id; $data['project_id']=(int)$site['project_id'];
        $data['created_by']=(int)$user->id; $data['updated_by']=(int)$user->id;
        $data += ['parent_zone_id'=>null,'zone_type_id'=>1,'planned_start_date'=>null,'planned_end_date'=>null,'status_id'=>1,'progress_percentage'=>0,'display_order'=>0,'is_active'=>1];
        $errors = $this->validateZoneData($data,null); if ($errors !== []) return $this->invalid($errors);
        try {
            if (!$this->zones->insert($data)) return $this->invalid($this->zones->errors());
            $id=(int)$this->zones->getInsertID();
            return $this->response->setStatusCode(201)->setJSON(['success'=>true,'message'=>'Site zone created successfully.','data'=>['zone'=>$this->baseQuery()->find($id)]]);
        } catch (DatabaseException $e) { return $this->conflict(); } catch (Throwable $e) { return $this->serverError('Site zone creation failed.',$e); }
    }

    public function update(int $id): ResponseInterface
    {
        $user=auth('session')->user(); if ($user===null) return $this->unauthorized();
        $existing=$this->zones->where('company_id',(int)$user->company_id)->find($id);
        if ($existing===null || $this->accessibleSite((int)$existing['site_id'],$user,true)===null) return $this->notFound();
        $input=$this->request->getJSON(true); if (!is_array($input)||$input===[]) return $this->invalid(['body'=>'A non-empty JSON request body is required.']);
        $data=$this->writable($input); unset($data['site_id']); $data['updated_by']=(int)$user->id;
        $merged=array_merge($existing,$data); $errors=$this->validateZoneData($merged,$id); if ($errors!==[]) return $this->invalid($errors);
        try {
            if (!$this->zones->update($id,$data)) return $this->invalid($this->zones->errors());
            return $this->response->setJSON(['success'=>true,'message'=>'Site zone updated successfully.','data'=>['zone'=>$this->baseQuery()->find($id)]]);
        } catch (DatabaseException $e) { return $this->conflict(); } catch (Throwable $e) { return $this->serverError('Site zone update failed.',$e); }
    }

    public function delete(int $id): ResponseInterface
    {
        $user=auth('session')->user(); if ($user===null) return $this->unauthorized();
        $zone=$this->zones->where('company_id',(int)$user->company_id)->find($id);
        if ($zone===null || $this->accessibleSite((int)$zone['site_id'],$user,true)===null) return $this->notFound();
        if (db_connect()->table('site_work_zones')->where('parent_zone_id',$id)->where('deleted_at',null)->countAllResults()>0)
            return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'This zone cannot be deleted while it has active child zones.']);
        try { $this->zones->update($id,['updated_by'=>(int)$user->id]); $this->zones->delete($id); return $this->response->setJSON(['success'=>true,'message'=>'Site zone deleted successfully.']); }
        catch (DatabaseException $e) { return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'This zone cannot be deleted because it is used by existing records.']); }
        catch (Throwable $e) { return $this->serverError('Site zone deletion failed.',$e); }
    }

    private function validateZoneData(array $data, ?int $exceptId): array
    {
        $errors=[]; $siteId=(int)($data['site_id']??0);
        foreach (['zone_type_id'=>'site_work_zones_zone_type_masters','status_id'=>'site_work_zones_status_masters'] as $f=>$t)
            if (!$this->activeMaster($t,(int)($data[$f]??0))) $errors[$f]='Select a valid active '.str_replace('_id','',str_replace('_',' ',$f)).'.';
        if (!empty($data['planned_start_date'])&&!empty($data['planned_end_date'])&&$data['planned_end_date']<$data['planned_start_date']) $errors['planned_end_date']='Planned end date cannot be before planned start date.';
        $parent=(int)($data['parent_zone_id']??0);
        if ($exceptId!==null && $parent===$exceptId) $errors['parent_zone_id']='A zone cannot be its own parent.';
        if ($parent>0 && !($exceptId!==null && $parent===$exceptId)) {
            $p=$this->zones->find($parent);
            if ($p===null||(int)$p['site_id']!==$siteId) $errors['parent_zone_id']='Select a valid parent zone from the same site.';
            elseif ($exceptId!==null && $this->wouldCreateCycle($exceptId,$parent)) $errors['parent_zone_id']='The selected parent would create a circular zone hierarchy.';
        }
        $b=db_connect()->table('site_work_zones')->where('site_id',$siteId)->where('zone_code',strtoupper(trim((string)($data['zone_code']??''))))->where('deleted_at',null);
        if ($exceptId!==null) $b->where('id !=',$exceptId);
        if ($b->countAllResults()>0) $errors['zone_code']='The zone code already exists for the selected site.';
        return $errors;
    }

    private function wouldCreateCycle(int $id,int $parent): bool
    {
        $seen=[];
        while ($parent>0) { if ($parent===$id||isset($seen[$parent])) return true; $seen[$parent]=true; $row=$this->zones->find($parent); $parent=(int)($row['parent_zone_id']??0); }
        return false;
    }

    private function accessibleSite(int $siteId, object $user, bool $operate=false): ?array
    {
        $site=db_connect()->table('project_sites s')->select('s.*, p.branch_id')->join('projects p','p.id=s.project_id AND p.company_id=s.company_id')->where('s.id',$siteId)->where('s.company_id',(int)$user->company_id)->where('s.deleted_at',null)->where('p.deleted_at',null)->get()->getRowArray();
        if ($site===null) return null; $branch=(int)($site['branch_id']??0);
        if ($branch>0&&!$this->authorization->canAccessBranch($branch,$operate?'OPERATE':'VIEW',$user)) return null;
        return $site;
    }

    private function baseQuery(): SiteWorkZoneModel
    {
        return $this->zones->select(['site_work_zones.*','projects.project_code','projects.project_name','projects.branch_id AS project_branch_id','project_sites.site_code','project_sites.site_name','parent.zone_code AS parent_zone_code','parent.zone_name AS parent_zone_name','zt.zone_type_code','zt.zone_type_name','zs.status_code','zs.status_name'])
            ->join('projects','projects.id=site_work_zones.project_id AND projects.company_id=site_work_zones.company_id')
            ->join('project_sites','project_sites.id=site_work_zones.site_id AND project_sites.project_id=site_work_zones.project_id')
            ->join('site_work_zones parent','parent.id=site_work_zones.parent_zone_id','left')
            ->join('site_work_zones_zone_type_masters zt','zt.id=site_work_zones.zone_type_id')
            ->join('site_work_zones_status_masters zs','zs.id=site_work_zones.status_id');
    }

    private function writable(array $i): array { return array_intersect_key($i,array_flip(['site_id','parent_zone_id','zone_code','zone_name','zone_type_id','description','planned_start_date','planned_end_date','status_id','progress_percentage','display_order','is_active'])); }
    private function activeMaster(string $t,int $id): bool { return $id>0&&db_connect()->table($t)->where('id',$id)->where('is_active',1)->countAllResults()===1; }
    private function successList(array $z): ResponseInterface { return $this->response->setJSON(['success'=>true,'message'=>'Site zones retrieved successfully.','data'=>['zones'=>$z]]); }
    private function unauthorized(): ResponseInterface { return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication required.']); }
    private function forbidden(string $m): ResponseInterface { return $this->response->setStatusCode(403)->setJSON(['success'=>false,'message'=>$m]); }
    private function notFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>'Site zone not found.']); }
    private function invalid(array $e): ResponseInterface { return $this->response->setStatusCode(422)->setJSON(['success'=>false,'message'=>'Validation failed.','errors'=>$e]); }
    private function conflict(): ResponseInterface { return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'Zone code already exists for this site or the record conflicts with existing data.']); }
    private function serverError(string $m,Throwable $e): ResponseInterface { log_message('error',$m.' {message}',['message'=>$e->getMessage()]); return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>$m]); }
}
