<?php
declare(strict_types=1);
namespace App\Controllers\Api;

class ExpenseMastersController extends ExpenseApiController
{
    private array $masters=[
        'expense_scopes'=>['expense_categories_expense_scope_masters','expense_scope_code'],
        'request_statuses'=>['expense_requests_status_masters','status_code'],
        'bill_statuses'=>['expense_bills_status_masters','status_code'],
        'bill_payment_statuses'=>['expense_bills_payment_status_masters','payment_status_code'],
        'payee_types'=>['expense_bills_payee_type_masters','payee_type_code'],
        'payment_modes'=>['expense_payments_payment_mode_masters','payment_mode_code'],
        'payment_statuses'=>['expense_payments_status_masters','status_code'],
        'allocation_types'=>['expense_allocations_allocation_type_masters','allocation_type_code'],
        'approval_actions'=>['expense_approvals_action_type_masters','action_type_code'],
        'snapshot_levels'=>['project_cost_snapshots_snapshot_level_masters','snapshot_level_code'],
    ];
    public function index(){return$this->safe(function(){if(!$u=$this->user())return$this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);$data=[];$db=db_connect();foreach($this->masters as$key=>$cfg)$data[$key]=$db->table($cfg[0])->where('is_active',1)->orderBy('sort_order','ASC')->get()->getResultArray();$data['expense_categories']=$db->table('expense_categories')->where(['company_id'=>$this->company($u),'is_active'=>1])->where('deleted_at',null)->orderBy('display_order','ASC')->get()->getResultArray();$data['document_types']=$db->table('document_types dt')->select('dt.*')->join('document_types_entity_scope_masters es','es.id=dt.entity_scope_id')->where(['dt.company_id'=>$this->company($u),'dt.is_active'=>1,'es.entity_scope_code'=>'EXPENSE'])->where('dt.deleted_at',null)->get()->getResultArray();return$this->ok('Expense and costing masters retrieved.','masters',$data);});}
    public function categories(){return$this->safe(function(){if(!$u=$this->user())return$this->missing();$b=db_connect()->table('expense_categories ec')->select('ec.*,es.expense_scope_code,es.expense_scope_name')->join('expense_categories_expense_scope_masters es','es.id=ec.expense_scope_id')->where('ec.company_id',$this->company($u))->where('ec.deleted_at',null);return$this->ok('Expense categories retrieved.','expense_categories',$b->orderBy('ec.display_order','ASC')->get()->getResultArray());});}
    public function createCategory(){return$this->saveCategory();}
    public function updateCategory(int$id){return$this->saveCategory($id);}
    private function saveCategory(?int$id=null){return$this->safe(function()use($id){if(!$u=$this->user())return$this->missing();$d=$this->input();$e=$this->required($d,['category_code','category_name','expense_scope_id']);if($e)return$this->invalid($e);$c=$this->company($u);$existing=$id?$this->row('expense_categories',$id,$c):null;if($id&&!$existing)return$this->missing('Expense category not found.');$row=['company_id'=>$c,'parent_id'=>isset($d['parent_id'])?(int)$d['parent_id']:null,'category_code'=>trim($d['category_code']),'category_name'=>trim($d['category_name']),'expense_scope_id'=>(int)$d['expense_scope_id'],'default_taxable'=>(int)($d['default_taxable']??0),'requires_document'=>(int)($d['requires_document']??0),'description'=>$d['description']??null,'display_order'=>(int)($d['display_order']??0),'is_active'=>(int)($d['is_active']??1),'updated_by'=>(int)$u->id];$db=db_connect();$dup=$db->table('expense_categories')->where(['company_id'=>$c,'category_code'=>$row['category_code']])->where('deleted_at',null);if($id)$dup->where('id !=',$id);if($dup->countAllResults())return$this->conflict('Expense category code already exists.');if($id){$db->table('expense_categories')->where('id',$id)->update($row);}else{$row['created_by']=(int)$u->id;$db->table('expense_categories')->insert($row);$id=(int)$db->insertID();}return$this->ok('Expense category saved.','expense_category',$this->row('expense_categories',$id,$c),$existing?200:201);});}
}
