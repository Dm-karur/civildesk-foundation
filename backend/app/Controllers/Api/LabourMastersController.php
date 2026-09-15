<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class LabourMastersController extends LabourApiController
{
    private const MASTER_TABLES = [
        'category-skill-levels'=>['labour_categories_skill_level_masters','skill_level_name'],
        'category-wage-bases'=>['labour_categories_wage_basis_masters','wage_basis_name'],
        'contractor-statuses'=>['labour_contractors_status_masters','status_name'],
        'employment-sources'=>['labour_workers_employment_source_masters','employment_source_name'],
        'genders'=>['labour_workers_gender_masters','gender_name'],
        'worker-id-types'=>['labour_workers_id_type_masters','id_type_name'],
        'worker-statuses'=>['labour_workers_status_masters','status_name'],
        'worker-wage-bases'=>['labour_workers_wage_basis_masters','wage_basis_name'],
        'document-statuses'=>['labour_worker_documents_verification_status_masters','verification_status_name'],
        'assignment-statuses'=>['labour_project_assignments_status_masters','status_name'],
        'assignment-wage-bases'=>['labour_project_assignments_wage_basis_masters','wage_basis_name'],
        'attendance-statuses'=>['labour_attendance_entries_attendance_status_masters','attendance_status_name'],
        'attendance-sources'=>['labour_attendance_entries_attendance_source_masters','attendance_source_name'],
        'attendance-batch-statuses'=>['labour_attendance_batches_status_masters','status_name'],
        'wage-period-statuses'=>['labour_wage_periods_status_masters','status_name'],
        'wage-payment-statuses'=>['labour_wage_lines_payment_status_masters','payment_status_name'],
        'payment-modes'=>['labour_payments_payment_mode_masters','payment_mode_name'],
        'payment-statuses'=>['labour_payments_status_masters','status_name'],
    ];

    public function masters(): ResponseInterface
    {
        if ($this->user() === null) return $this->unauthorized();
        $data=[]; foreach (self::MASTER_TABLES as $key=>[$table,$name]) $data[$key]=db_connect()->table($table)->where('is_active',1)->orderBy('sort_order')->orderBy($name)->get()->getResultArray();
        $data['subcontractors']=db_connect()->table('subcontractors s')->select('s.id,s.contractor_code,s.contractor_name,s.contact_person,s.phone,s.email,s.status_id')->join('subcontractors_status_masters sm','sm.id=s.status_id')->where('s.company_id',$this->companyId($this->user()))->where('s.deleted_at',null)->where('sm.is_active',1)->where('sm.status_code','ACTIVE')->orderBy('s.contractor_name')->get()->getResultArray();
        return $this->ok('Labour masters retrieved successfully.','masters',$data);
    }

    public function categories(): ResponseInterface { return $this->list('labour_categories',['category_code','category_name','description'],'labour_categories'); }
    public function contractors(): ResponseInterface
    {
        $u=$this->user();if($u===null)return $this->unauthorized();$company=$this->companyId($u);
        $b=db_connect()->table('labour_contractors lc')->select('lc.*,s.contractor_code AS subcontractor_code,s.contractor_name AS subcontractor_name,s.contact_person AS subcontractor_contact_person,s.phone AS subcontractor_phone')->join('subcontractors s','s.id=lc.subcontractor_id AND s.company_id=lc.company_id','left')->where('lc.company_id',$company)->where('lc.deleted_at',null);
        if(ctype_digit((string)($this->request->getGet('subcontractor_id')??'')))$b->where('lc.subcontractor_id',(int)$this->request->getGet('subcontractor_id'));
        $q=trim((string)($this->request->getGet('search')??''));if($q!=='')$b->groupStart()->like('lc.contractor_code',$q)->orLike('lc.contractor_name',$q)->orLike('lc.contact_person',$q)->orLike('lc.phone',$q)->orLike('s.contractor_code',$q)->orLike('s.contractor_name',$q)->groupEnd();
        return $this->ok('Labour contractors retrieved successfully.','labour_contractors',$b->orderBy('lc.id','DESC')->get()->getResultArray());
    }
    public function category(int $id): ResponseInterface { return $this->showRecord('labour_categories',$id,'labour_category'); }
    public function contractor(int $id): ResponseInterface
    {
        $u=$this->user();if($u===null)return $this->unauthorized();$r=db_connect()->table('labour_contractors lc')->select('lc.*,s.contractor_code AS subcontractor_code,s.contractor_name AS subcontractor_name,s.contact_person AS subcontractor_contact_person,s.phone AS subcontractor_phone')->join('subcontractors s','s.id=lc.subcontractor_id AND s.company_id=lc.company_id','left')->where('lc.id',$id)->where('lc.company_id',$this->companyId($u))->where('lc.deleted_at',null)->get()->getRowArray();return$r?$this->ok('Record retrieved successfully.','labour_contractor',$r):$this->notFound();
    }

    public function createCategory(): ResponseInterface
    {
        return $this->save('labour_categories',null,['category_code','category_name','skill_level_id','wage_basis_id'],
            ['category_code','category_name','skill_level_id','wage_basis_id','default_wage_rate','overtime_multiplier','description','display_order','is_active'],
            ['skill_level_id'=>['labour_categories_skill_level_masters'],'wage_basis_id'=>['labour_categories_wage_basis_masters']], 'category_code','labour_category');
    }
    public function updateCategory(int $id): ResponseInterface
    {
        return $this->save('labour_categories',$id,['category_code','category_name','skill_level_id','wage_basis_id'],
            ['category_code','category_name','skill_level_id','wage_basis_id','default_wage_rate','overtime_multiplier','description','display_order','is_active'],
            ['skill_level_id'=>['labour_categories_skill_level_masters'],'wage_basis_id'=>['labour_categories_wage_basis_masters']], 'category_code','labour_category');
    }
    public function createContractor(): ResponseInterface { return $this->saveContractor(null); }
    public function updateContractor(int $id): ResponseInterface { return $this->saveContractor($id); }

    public function deleteCategory(int $id): ResponseInterface { return $this->softDelete('labour_categories',$id,[['labour_workers','labour_category_id'],['labour_project_assignments','labour_category_id']]); }
    public function deleteContractor(int $id): ResponseInterface { return $this->softDelete('labour_contractors',$id,[['labour_workers','contractor_id'],['labour_wage_periods','contractor_id'],['labour_payments','contractor_id']]); }

    private function saveContractor(?int $id): ResponseInterface
    {
        $u=$this->user();if($u===null)return $this->unauthorized();$in=$this->input();if($in===null)return $this->invalid(['body'=>'A valid JSON request body is required.']);$company=$this->companyId($u);$old=$id?$this->record('labour_contractors',$id,$company,true):null;if($id&&$old===null)return $this->notFound();
        $fields=['subcontractor_id','contractor_code','contractor_name','contact_person','phone','alternate_phone','email','gstin','pan','address_line1','address_line2','city','district','state_name','postal_code','bank_name','bank_account_name','bank_account_no','bank_ifsc','payment_terms_days','status_id','notes'];$data=array_intersect_key($in,array_flip($fields));$m=array_merge($old??[],$data);$errors=$this->required($m,['subcontractor_id','contractor_code','contractor_name','status_id']);
        $sub=db_connect()->table('subcontractors s')->select('s.id')->join('subcontractors_status_masters sm','sm.id=s.status_id')->where('s.id',(int)($m['subcontractor_id']??0))->where('s.company_id',$company)->where('s.deleted_at',null)->where('sm.is_active',1)->where('sm.status_code','ACTIVE')->get()->getRowArray();if(!$sub)$errors['subcontractor_id']='Select a valid active company subcontractor.';
        if(!$this->activeMaster('labour_contractors_status_masters',(int)($m['status_id']??0)))$errors['status_id']='Select a valid active master value.';
        $dup=db_connect()->table('labour_contractors')->where('company_id',$company)->where('contractor_code',trim((string)($m['contractor_code']??'')))->where('deleted_at',null);if($id)$dup->where('id !=',$id);if(($m['contractor_code']??'')!==''&&$dup->countAllResults())$errors['contractor_code']='This code already exists.';
        $linked=db_connect()->table('labour_contractors')->where('company_id',$company)->where('subcontractor_id',(int)($m['subcontractor_id']??0))->where('deleted_at',null);if($id)$linked->where('id !=',$id);if(!empty($m['subcontractor_id'])&&$linked->countAllResults())$errors['subcontractor_id']='This subcontractor is already linked to another labour-contractor profile.';
        if($errors)return $this->invalid($errors);$data['updated_by']=(int)$u->id;$data['updated_at']=$this->now();if(!$id)$data+=['company_id'=>$company,'created_by'=>(int)$u->id,'created_at'=>$this->now()];try{$b=db_connect()->table('labour_contractors');$id?$b->where('id',$id)->update($data):$b->insert($data);$id??=(int)db_connect()->insertID();return$this->contractor($id);}catch(Throwable$e){return$this->serverError('Labour contractor save failed.',$e);}
    }

    private function list(string $table,array $searchFields,string $key): ResponseInterface
    {
        $u=$this->user(); if($u===null)return $this->unauthorized();
        $b=db_connect()->table($table)->where('company_id',$this->companyId($u))->where('deleted_at',null);
        $q=trim((string)($this->request->getGet('search')??'')); if($q!==''){$b->groupStart();foreach($searchFields as $i=>$f)$i?$b->orLike($f,$q):$b->like($f,$q);$b->groupEnd();}
        if(($a=$this->request->getGet('is_active'))!==null&&in_array((string)$a,['0','1'],true))$b->where('is_active',(int)$a);
        return $this->ok(ucwords(str_replace('_',' ',$key)).' retrieved successfully.',$key,$b->orderBy('id','DESC')->get()->getResultArray());
    }

    private function showRecord(string $table,int $id,string $key): ResponseInterface
    { $u=$this->user();if($u===null)return $this->unauthorized();$r=$this->record($table,$id,$this->companyId($u),true);return $r?$this->ok('Record retrieved successfully.',$key,$r):$this->notFound(); }

    private function save(string $table,?int $id,array $required,array $fields,array $masters,string $unique,string $key): ResponseInterface
    {
        $u=$this->user();if($u===null)return $this->unauthorized();$in=$this->input();if($in===null)return $this->invalid(['body'=>'A valid JSON request body is required.']);
        $company=$this->companyId($u);$existing=$id? $this->record($table,$id,$company,true):null;if($id&&$existing===null)return $this->notFound();
        $data=array_intersect_key($in,array_flip($fields));$merged=array_merge($existing??[],$data);$errors=$this->required($merged,$required);
        foreach($masters as $field=>[$mt])if(isset($merged[$field])&&!$this->activeMaster($mt,(int)$merged[$field]))$errors[$field]='Select a valid active master value.';
        $dup=db_connect()->table($table)->where('company_id',$company)->where($unique,trim((string)($merged[$unique]??'')))->where('deleted_at',null);if($id)$dup->where('id !=',$id);if(($merged[$unique]??'')!==''&&$dup->countAllResults())$errors[$unique]='This code already exists.';
        if($errors)return $this->invalid($errors);$data['updated_by']=(int)$u->id;if(!$id){$data['company_id']=$company;$data['created_by']=(int)$u->id;$data['created_at']=$this->now();}$data['updated_at']=$this->now();
        try{$b=db_connect()->table($table);$id?$b->where('id',$id)->update($data):$b->insert($data);$id??=(int)db_connect()->insertID();return $this->ok($id&&$existing?'Record updated successfully.':'Record created successfully.',$key,$this->record($table,$id,$company,true),$existing?200:201);}catch(Throwable$e){return $this->serverError('Labour master save failed.',$e);}
    }

    private function softDelete(string $table,int $id,array $uses): ResponseInterface
    { $u=$this->user();if($u===null)return $this->unauthorized();$r=$this->record($table,$id,$this->companyId($u),true);if(!$r)return $this->notFound();foreach($uses as[$t,$f])if(db_connect()->table($t)->where($f,$id)->countAllResults())return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'Record is in use and cannot be deleted.']);db_connect()->table($table)->where('id',$id)->update(['deleted_at'=>$this->now(),'updated_by'=>(int)$u->id,'updated_at'=>$this->now()]);return $this->response->setJSON(['success'=>true,'message'=>'Record deleted successfully.']); }
}
