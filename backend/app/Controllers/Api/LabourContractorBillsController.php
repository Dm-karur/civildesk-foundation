<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use App\Models\LabourContractorBillModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class LabourContractorBillsController extends LabourApiController
{
 private LabourContractorBillModel $model;
 public function __construct(){parent::__construct();$this->model=new LabourContractorBillModel();}

 public function masters():ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$db=db_connect();$data=[
   'bill_statuses'=>$db->table('labour_contractor_bill_status_masters')->where('is_active',1)->orderBy('sort_order')->get()->getResultArray(),
   'payment_statuses'=>$db->table('labour_contractor_bill_payment_status_masters')->where('is_active',1)->orderBy('sort_order')->get()->getResultArray(),
   'charge_types'=>$db->table('labour_contractor_bill_charge_type_masters ct')->select('ct.*,d.direction_code,d.direction_name,d.calculation_sign')->join('labour_contractor_bill_charge_direction_masters d','d.id=ct.direction_id')->where('ct.is_active',1)->orderBy('ct.sort_order')->get()->getResultArray(),
   'payment_modes'=>$db->table('labour_payments_payment_mode_masters')->where('is_active',1)->orderBy('sort_order')->get()->getResultArray(),
  ];return$this->ok('Labour contractor billing masters retrieved.','masters',$data);
 }

 public function index():ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$b=$this->base()->where('b.company_id',$this->companyId($u));if(!$this->authorization->isSuperAdmin($u)){$ids=$this->authorization->getAccessibleBranchIds($u);if(!$ids)return$this->ok('Labour contractor bills retrieved.','bills',[]);$b->groupStart()->whereIn('p.branch_id',$ids)->orWhere('p.branch_id',null)->groupEnd();}
  foreach(['project_id','site_id','contractor_id','status_id','payment_status_id']as$f){$v=(int)($this->request->getGet($f)??0);if($v)$b->where('b.'.$f,$v);}
  if($this->request->getGet('date_from'))$b->where('b.period_end >=',$this->request->getGet('date_from'));
  if($this->request->getGet('date_to'))$b->where('b.period_start <=',$this->request->getGet('date_to'));
  $rows=$b->orderBy('b.id','DESC')->get()->getResultArray();if(!$this->canSeeMoney($u))$rows=array_map(fn($r)=>$this->hideMoney($r),$rows);
  return$this->ok('Labour contractor bills retrieved.','bills',$rows);
 }

 public function show(int$id):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound('Labour contractor bill not found.');
  $r['daily_entries']=db_connect()->table('labour_contractor_bill_daily_entries')->where('bill_id',$id)->orderBy('work_date')->get()->getResultArray();
  if($this->canSeeMoney($u)){
   $r['charges']=$this->charges($id);$r['payments']=db_connect()->table('labour_contractor_bill_payments p')->select('p.*,m.payment_mode_code,m.payment_mode_name')->join('labour_payments_payment_mode_masters m','m.id=p.payment_mode_id')->where('p.bill_id',$id)->orderBy('p.id','DESC')->get()->getResultArray();
  }else{$r=$this->hideMoney($r);}
  return$this->ok('Labour contractor bill retrieved.','bill',$r);
 }

 public function create():ResponseInterface{return$this->saveHeader(null);}
 public function update(int$id):ResponseInterface{return$this->saveHeader($id);}
 private function saveHeader(?int$id):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$in=$this->input()??[];$c=$this->companyId($u);$old=$id?$this->row($id,$u):null;if($id&&!$old)return$this->notFound();
  if($old&&!in_array($old['status_code'],['DRAFT','REJECTED'],true))return$this->conflict('Only Draft or Rejected bills can be edited.');
  $fields=['project_id','site_id','contractor_id','bill_no','work_activity','period_start','period_end','remarks'];$d=array_intersect_key($in,array_flip($fields));$m=array_merge($old??[],$d);$e=$this->required($m,['project_id','site_id','contractor_id','bill_no','work_activity','period_start','period_end']);
  if(!$this->site((int)($m['site_id']??0),(int)($m['project_id']??0),$u,true))$e['site_id']='Select an accessible project site.';
  if(!$this->record('labour_contractors',(int)($m['contractor_id']??0),$c,true))$e['contractor_id']='Select a valid labour contractor.';
  if(($m['period_end']??'')<($m['period_start']??''))$e['period_end']='Period end cannot precede period start.';
  $q=db_connect()->table('labour_contractor_bills')->where(['company_id'=>$c,'bill_no'=>trim((string)($m['bill_no']??''))])->where('deleted_at',null);if($id)$q->where('id !=',$id);if(($m['bill_no']??'')!==''&&$q->countAllResults())$e['bill_no']='Bill number already exists.';if($e)return$this->invalid($e);
  $draft=$this->masterId('labour_contractor_bill_status_masters','status_code','DRAFT');$unpaid=$this->masterId('labour_contractor_bill_payment_status_masters','status_code','UNPAID');$d['updated_by']=(int)$u->id;if(!$id)$d+=['company_id'=>$c,'status_id'=>$draft,'payment_status_id'=>$unpaid,'created_by'=>(int)$u->id];else if($old['status_code']==='REJECTED')$d['status_id']=$draft;
  if($id)$this->model->update($id,$d);else{$this->model->insert($d);$id=(int)$this->model->getInsertID();}return$this->show($id);
 }

 public function addEntry(int$id):ResponseInterface{return$this->saveEntry($id,null);} public function updateEntry(int$id,int$entryId):ResponseInterface{return$this->saveEntry($id,$entryId);}
 private function saveEntry(int$id,?int$entryId):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$bill=$this->row($id,$u);if(!$bill)return$this->notFound();if(!in_array($bill['status_code'],['DRAFT','REJECTED'],true))return$this->conflict('Daily manpower can be changed only in Draft or Rejected status.');
  $in=$this->input()??[];$old=$entryId?db_connect()->table('labour_contractor_bill_daily_entries')->where(['id'=>$entryId,'bill_id'=>$id])->get()->getRowArray():null;if($entryId&&!$old)return$this->notFound('Daily entry not found.');$d=array_intersect_key($in,array_flip(['work_date','manpower_units','work_description','remarks']));$m=array_merge($old??[],$d);$e=$this->required($m,['work_date','manpower_units']);if(($m['work_date']??'')<$bill['period_start']||($m['work_date']??'')>$bill['period_end'])$e['work_date']='Work date must fall within the bill period.';if((float)($m['manpower_units']??0)<0)$e['manpower_units']='Manpower units cannot be negative.';if($e)return$this->invalid($e);$d['updated_by']=(int)$u->id;if(!$entryId)$d+=['company_id'=>$this->companyId($u),'bill_id'=>$id,'created_by'=>(int)$u->id];$b=db_connect()->table('labour_contractor_bill_daily_entries');$entryId?$b->where('id',$entryId)->update($d):$b->insert($d);$this->recalc($id);return$this->show($id);
 }
 public function deleteEntry(int$id,int$entryId):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$bill=$this->row($id,$u);if(!$bill)return$this->notFound();if(!in_array($bill['status_code'],['DRAFT','REJECTED'],true))return$this->conflict('Daily manpower cannot be deleted in the current status.');db_connect()->table('labour_contractor_bill_daily_entries')->where(['id'=>$entryId,'bill_id'=>$id])->delete();$this->recalc($id);return$this->show($id);}

 public function submit(int$id):ResponseInterface{return$this->transition($id,['DRAFT','REJECTED'],'SUBMITTED','submitted');}
 public function verify(int$id):ResponseInterface{return$this->transition($id,['SUBMITTED'],'VERIFIED','verified');}
 public function reject(int$id):ResponseInterface{return$this->transition($id,['SUBMITTED','VERIFIED','PRICED'],'REJECTED','rejected');}
 private function transition(int$id,array$from,string$to,string$verb):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if(!in_array($r['status_code'],$from,true))return$this->conflict('Invalid bill status transition.');if($to==='SUBMITTED'&&db_connect()->table('labour_contractor_bill_daily_entries')->where('bill_id',$id)->countAllResults()===0)return$this->invalid(['daily_entries'=>'At least one daily manpower entry is required.']);$d=['status_id'=>$this->masterId('labour_contractor_bill_status_masters','status_code',$to),'updated_by'=>(int)$u->id];if($to==='SUBMITTED')$d+=['submitted_by'=>(int)$u->id,'submitted_at'=>$this->now()];if($to==='VERIFIED')$d+=['verified_by'=>(int)$u->id,'verified_at'=>$this->now()];$this->model->update($id,$d);return$this->ok('Labour contractor bill '.$verb.' successfully.','bill',$this->row($id,$u));}

 public function price(int$id):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if(!in_array($r['status_code'],['VERIFIED','PRICED'],true))return$this->conflict('Only a verified bill can be priced.');$in=$this->input()??[];$rate=(float)($in['labour_rate']??-1);if($rate<0)return$this->invalid(['labour_rate'=>'Labour rate must be zero or greater.']);$round=(float)($in['round_off']??0);$this->model->update($id,['labour_rate'=>$rate,'round_off'=>$round,'status_id'=>$this->masterId('labour_contractor_bill_status_masters','status_code','PRICED'),'priced_by'=>(int)$u->id,'priced_at'=>$this->now(),'updated_by'=>(int)$u->id]);$this->recalc($id);return$this->show($id);
 }
 public function addCharge(int$id):ResponseInterface{return$this->saveCharge($id,null);}public function updateCharge(int$id,int$chargeId):ResponseInterface{return$this->saveCharge($id,$chargeId);}
 private function saveCharge(int$id,?int$chargeId):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if(!in_array($r['status_code'],['VERIFIED','PRICED'],true))return$this->conflict('Charges can be entered only during pricing.');$in=$this->input()??[];$old=$chargeId?db_connect()->table('labour_contractor_bill_charges')->where(['id'=>$chargeId,'bill_id'=>$id])->get()->getRowArray():null;$d=array_intersect_key($in,array_flip(['charge_type_id','description','quantity','rate','amount','remarks']));$m=array_merge($old??[],$d);$e=$this->required($m,['charge_type_id']);if(!$this->activeMaster('labour_contractor_bill_charge_type_masters',(int)($m['charge_type_id']??0)))$e['charge_type_id']='Select a valid charge type.';$qty=(float)($m['quantity']??1);$rate=(float)($m['rate']??0);$amount=array_key_exists('amount',$d)?(float)$d['amount']:$qty*$rate;if($amount<0)$e['amount']='Charge amount cannot be negative.';if($e)return$this->invalid($e);$d+=['quantity'=>$qty,'rate'=>$rate];$d['amount']=$amount;$d['updated_by']=(int)$u->id;if(!$chargeId)$d+=['company_id'=>$this->companyId($u),'bill_id'=>$id,'created_by'=>(int)$u->id];$b=db_connect()->table('labour_contractor_bill_charges');$chargeId?$b->where('id',$chargeId)->update($d):$b->insert($d);$this->recalc($id);return$this->show($id);}
 public function deleteCharge(int$id,int$chargeId):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if(!in_array($r['status_code'],['VERIFIED','PRICED'],true))return$this->conflict('Charges cannot be deleted in the current status.');db_connect()->table('labour_contractor_bill_charges')->where(['id'=>$chargeId,'bill_id'=>$id])->delete();$this->recalc($id);return$this->show($id);}
 public function approve(int$id):ResponseInterface{$u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if($r['status_code']!=='PRICED')return$this->conflict('Only a priced bill can be approved.');$this->model->update($id,['status_id'=>$this->masterId('labour_contractor_bill_status_masters','status_code','APPROVED'),'approved_by'=>(int)$u->id,'approved_at'=>$this->now(),'updated_by'=>(int)$u->id]);return$this->show($id);}

 public function recordPayment(int$id):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();$r=$this->row($id,$u);if(!$r)return$this->notFound();if($r['status_code']!=='APPROVED')return$this->conflict('Payments require an approved bill.');$in=$this->input()??[];$e=$this->required($in,['payment_no','payment_date','payment_mode_id','amount','recipient_name']);$amount=(float)($in['amount']??0);if($amount<=0||$amount>(float)$r['balance_amount'])$e['amount']='Payment must be greater than zero and cannot exceed the outstanding balance.';if(!$this->activeMaster('labour_payments_payment_mode_masters',(int)($in['payment_mode_id']??0)))$e['payment_mode_id']='Select a valid payment mode.';if(db_connect()->table('labour_contractor_bill_payments')->where(['company_id'=>$this->companyId($u),'payment_no'=>$in['payment_no']??''])->countAllResults())$e['payment_no']='Payment number already exists.';if($e)return$this->invalid($e);$d=array_intersect_key($in,array_flip(['payment_no','payment_date','payment_mode_id','reference_no','amount','recipient_name','remarks']));$d+=['company_id'=>$this->companyId($u),'bill_id'=>$id,'paid_by'=>(int)$u->id];db_connect()->table('labour_contractor_bill_payments')->insert($d);$this->recalc($id);return$this->show($id);
 }

 public function print(int$id):ResponseInterface
 {
  $u=$this->user();if(!$u)return$this->unauthorized();if(!$this->canSeeMoney($u))return$this->response->setStatusCode(403)->setJSON(['success'=>false,'message'=>'You are not authorised to view bill amounts.']);$r=$this->row($id,$u);if(!$r)return$this->notFound();$entries=db_connect()->table('labour_contractor_bill_daily_entries')->where('bill_id',$id)->orderBy('work_date')->get()->getResultArray();$charges=$this->charges($id);$e=fn($v)=>htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');$rows='';foreach($entries as$x)$rows.='<tr><td>'.$e($x['work_date']).'</td><td>'.$e($x['manpower_units']).'</td><td>'.$e($x['work_description']).'</td></tr>';$cr='';foreach($charges as$x)$cr.='<tr><td>'.$e($x['charge_name']).'</td><td>'.$e($x['amount']).'</td></tr>';$html='<!doctype html><html><head><meta charset="utf-8"><title>'.$e($r['bill_no']).'</title><style>body{font-family:Arial;margin:30px;color:#222}h2{text-align:center}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #555;padding:7px}th{background:#eee}.right{text-align:right}.sign{margin-top:55px;display:flex;justify-content:space-between}</style></head><body><h2>Labour Contractor Daily Work & Billing Sheet</h2><table><tr><th>Bill No</th><td>'.$e($r['bill_no']).'</td><th>Period</th><td>'.$e($r['period_start']).' to '.$e($r['period_end']).'</td></tr><tr><th>Project</th><td>'.$e($r['project_name']).'</td><th>Site</th><td>'.$e($r['site_name']).'</td></tr><tr><th>Contractor</th><td>'.$e($r['contractor_name']).'</td><th>Activity</th><td>'.$e($r['work_activity']).'</td></tr></table><table><tr><th>Date</th><th>Manpower Units</th><th>Description</th></tr>'.$rows.'<tr><th>Total</th><th>'.$e($r['total_manpower_units']).'</th><th></th></tr></table><table><tr><th>Labour rate</th><td class="right">'.$e($r['labour_rate']).'</td></tr><tr><th>Labour amount</th><td class="right">'.$e($r['labour_amount']).'</td></tr>'.$cr.'<tr><th>Round off</th><td class="right">'.$e($r['round_off']).'</td></tr><tr><th>Total amount</th><th class="right">'.$e($r['total_amount']).'</th></tr></table><div class="sign"><span>Engineer</span><span>Supervisor</span><span>Receiver</span></div><script>window.print()</script></body></html>';return$this->response->setContentType('text/html')->setBody($html);
 }

 private function recalc(int$id):void
 {
  $db=db_connect();$bill=$db->table('labour_contractor_bills')->where('id',$id)->get()->getRowArray();$units=(float)($db->table('labour_contractor_bill_daily_entries')->selectSum('manpower_units')->where('bill_id',$id)->get()->getRowArray()['manpower_units']??0);$labour=round($units*(float)($bill['labour_rate']??0),2);$sums=$db->table('labour_contractor_bill_charges c')->select('COALESCE(SUM(CASE WHEN d.calculation_sign=1 THEN c.amount ELSE 0 END),0) additions,COALESCE(SUM(CASE WHEN d.calculation_sign=-1 THEN c.amount ELSE 0 END),0) deductions',false)->join('labour_contractor_bill_charge_type_masters t','t.id=c.charge_type_id')->join('labour_contractor_bill_charge_direction_masters d','d.id=t.direction_id')->where('c.bill_id',$id)->get()->getRowArray();$add=(float)$sums['additions'];$ded=(float)$sums['deductions'];$total=round($labour+$add-$ded+(float)$bill['round_off'],2);$paid=(float)($db->table('labour_contractor_bill_payments')->selectSum('amount')->where('bill_id',$id)->get()->getRowArray()['amount']??0);$balance=max(0,round($total-$paid,2));$pcode=$paid<=0?'UNPAID':($balance<=0?'PAID':'PARTIALLY_PAID');$db->table('labour_contractor_bills')->where('id',$id)->update(['total_manpower_units'=>$units,'labour_amount'=>$labour,'total_additions'=>$add,'total_deductions'=>$ded,'total_amount'=>$total,'paid_amount'=>$paid,'balance_amount'=>$balance,'payment_status_id'=>$this->masterId('labour_contractor_bill_payment_status_masters','status_code',$pcode)]);
 }
 private function row(int$id,object$u):?array{$r=$this->base()->where('b.id',$id)->where('b.company_id',$this->companyId($u))->get()->getRowArray();return$r&&$this->project((int)$r['project_id'],$u)?$r:null;}
 private function base(){return db_connect()->table('labour_contractor_bills b')->select('b.*,p.project_code,p.project_name,p.client_id,s.site_code,s.site_name,c.contractor_code,c.contractor_name,st.status_code,st.status_name,ps.status_code payment_status_code,ps.status_name payment_status_name')->join('projects p','p.id=b.project_id')->join('project_sites s','s.id=b.site_id')->join('labour_contractors c','c.id=b.contractor_id')->join('labour_contractor_bill_status_masters st','st.id=b.status_id')->join('labour_contractor_bill_payment_status_masters ps','ps.id=b.payment_status_id')->where('b.deleted_at',null);}
 private function charges(int$id):array{return db_connect()->table('labour_contractor_bill_charges c')->select('c.*,t.charge_code,t.charge_name,d.direction_code,d.calculation_sign')->join('labour_contractor_bill_charge_type_masters t','t.id=c.charge_type_id')->join('labour_contractor_bill_charge_direction_masters d','d.id=t.direction_id')->where('c.bill_id',$id)->orderBy('c.id')->get()->getResultArray();}
 private function canSeeMoney(object$u):bool{return$this->authorization->hasPermission('wages.view',$u)||$this->authorization->hasPermission('wages.calculate',$u)||$this->authorization->hasPermission('wages.approve',$u)||$this->authorization->hasPermission('wages.pay',$u)||$this->authorization->isSuperAdmin($u);}
 private function hideMoney(array$r):array{foreach(['labour_rate','labour_amount','total_additions','total_deductions','round_off','total_amount','paid_amount','balance_amount','payment_status_id','payment_status_code','payment_status_name','charges','payments']as$f)unset($r[$f]);return$r;}
 private function conflict(string$m):ResponseInterface{return$this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>$m]);}
}
