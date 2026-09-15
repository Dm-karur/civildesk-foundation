<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

final class ApprovalsController extends BaseController
{
    private AuthorizationService $authorization;

    /** @var array<string,array<string,mixed>> */
    private array $types;

    public function __construct()
    {
        $this->authorization = new AuthorizationService();
        $this->types = [
            'BOQ' => ['table'=>'project_boqs','status'=>'project_boqs_status_masters','status_col'=>'status_code','no'=>'boq_code','date'=>'boq_date','permission'=>'boq.approve','controller'=>ProjectBoqsController::class,'approve'=>'approve','reject'=>'reject','project'=>'project_id','deleted'=>true],
            'BUDGET' => ['table'=>'project_budgets','status'=>'project_budgets_status_masters','status_col'=>'status_code','no'=>'budget_code','date'=>'budget_date','permission'=>'budget.approve','controller'=>ProjectBudgetsController::class,'approve'=>'approve','reject'=>'reject','project'=>'project_id','deleted'=>true],
            'BUDGET_REVISION' => ['table'=>'budget_revisions','status'=>'budget_revisions_status_masters','status_col'=>'status_code','no'=>'revision_no','date'=>'revision_date','permission'=>'budget.approve','controller'=>ProjectBudgetsController::class,'approve'=>'approveRevision','reject'=>'rejectRevision','parent'=>'budget_id','project'=>'project_id','deleted'=>false],
            'MATERIAL_REQUEST' => ['table'=>'material_requests','status'=>'material_requests_status_masters','status_col'=>'status_code','no'=>'request_no','date'=>'request_date','permission'=>'materials.approve_request','controller'=>MaterialDocumentsController::class,'method'=>'action','route_type'=>'requests','project'=>'project_id','deleted'=>true],
            'PURCHASE_ORDER' => ['table'=>'material_purchase_orders','status'=>'material_purchase_orders_status_masters','status_col'=>'status_code','no'=>'po_no','date'=>'po_date','permission'=>'purchase_orders.approve','controller'=>MaterialDocumentsController::class,'method'=>'action','route_type'=>'purchase-orders','project'=>'project_id','deleted'=>true],
            'MATERIAL_TRANSACTION' => ['table'=>'material_transactions','status'=>'material_transactions_status_masters','status_col'=>'status_code','no'=>'transaction_no','date'=>'transaction_date','permission'=>'material_stock.approve','controller'=>MaterialDocumentsController::class,'method'=>'action','route_type'=>'transactions','project'=>'project_id','deleted'=>true],
            'DAILY_REPORT' => ['table'=>'daily_site_reports','status'=>'daily_site_reports_status_masters','status_col'=>'status_code','no'=>'report_no','date'=>'report_date','permission'=>'daily_reports.approve','controller'=>DailySiteReportsController::class,'method'=>'action','project'=>'project_id','deleted'=>true],
            'WORK_ORDER' => ['table'=>'subcontract_work_orders','status'=>'subcontract_work_orders_status_masters','status_col'=>'status_code','no'=>'work_order_no','date'=>'work_order_date','permission'=>'work_orders.approve','controller'=>SubcontractDocumentsController::class,'method'=>'action','route_type'=>'work-orders','project'=>'project_id','deleted'=>true],
            'MEASUREMENT' => ['table'=>'subcontract_measurements','status'=>'subcontract_measurements_status_masters','status_col'=>'status_code','no'=>'measurement_no','date'=>'measurement_date','permission'=>'measurements.approve','controller'=>SubcontractDocumentsController::class,'method'=>'action','route_type'=>'measurements','project'=>'project_id','deleted'=>true],
            'RA_BILL' => ['table'=>'subcontract_ra_bills','status'=>'subcontract_ra_bills_status_masters','status_col'=>'status_code','no'=>'ra_bill_no','date'=>'bill_date','permission'=>'ra_bills.certify','controller'=>SubcontractDocumentsController::class,'method'=>'action','route_type'=>'ra-bills','project'=>'project_id','deleted'=>true],
            'SUBCONTRACT_PAYMENT' => ['table'=>'subcontract_payments','status'=>'subcontract_payments_status_masters','status_col'=>'status_code','no'=>'payment_no','date'=>'payment_date','permission'=>'payments.approve','controller'=>SubcontractDocumentsController::class,'method'=>'action','route_type'=>'payments','project'=>'project_id','deleted'=>true],
            'EXPENSE_REQUEST' => ['table'=>'expense_requests','status'=>'expense_requests_status_masters','status_col'=>'status_code','no'=>'request_no','date'=>'request_date','permission'=>'expenses.approve_request','controller'=>ExpenseRequestsController::class,'method'=>'action','project'=>'project_id','deleted'=>true],
            'EXPENSE_BILL' => ['table'=>'expense_bills','status'=>'expense_bills_status_masters','status_col'=>'status_code','no'=>'internal_voucher_no','date'=>'bill_date','permission'=>'expenses.approve_bill','controller'=>ExpenseBillsController::class,'method'=>'action','project'=>'project_id','deleted'=>true],
            'EXPENSE_PAYMENT' => ['table'=>'expense_payments','status'=>'expense_payments_status_masters','status_col'=>'status_code','no'=>'payment_no','date'=>'payment_date','permission'=>'expense_payments.approve','controller'=>ExpensePaymentsController::class,'method'=>'action','project'=>'project_id','deleted'=>true],
        ];
    }

    public function summary(): ResponseInterface
    {
        $items = $this->pendingItems();
        $byModule = [];
        foreach ($items as $item) $byModule[$item['module']] = ($byModule[$item['module']] ?? 0) + 1;
        ksort($byModule);
        return $this->ok('Approval summary retrieved successfully.', ['total_pending'=>count($items),'by_module'=>$byModule]);
    }

    public function index(): ResponseInterface
    {
        $items = $this->pendingItems();
        $module = strtoupper(trim((string)($this->request->getGet('module') ?? '')));
        $projectId = (int)($this->request->getGet('project_id') ?? 0);
        $search = strtolower(trim((string)($this->request->getGet('search') ?? '')));
        $items = array_values(array_filter($items, static function(array $r) use ($module,$projectId,$search): bool {
            if ($module !== '' && $r['module'] !== $module) return false;
            if ($projectId > 0 && (int)$r['project_id'] !== $projectId) return false;
            return $search === '' || str_contains(strtolower($r['document_no'].' '.$r['project_name']), $search);
        }));
        return $this->ok('Pending approvals retrieved successfully.', ['approvals'=>$items,'count'=>count($items)]);
    }

    public function show(string $module, int $id): ResponseInterface
    {
        $module = strtoupper($module);
        foreach ($this->pendingItems() as $item) if ($item['module']===$module && (int)$item['id']===$id) return $this->ok('Approval item retrieved successfully.', ['approval'=>$item]);
        return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>'Pending approval item not found or not accessible.']);
    }

    public function action(string $module, int $id, string $action): ResponseInterface
    {
        $user = auth('session')->user();
        $module = strtoupper($module); $action = strtolower($action);
        if (!$user) return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);
        $cfg = $this->types[$module] ?? null;
        if (!$cfg || !in_array($action,['approve','reject','review','verify','certify'],true)) return $this->response->setStatusCode(404)->setJSON(['success'=>false,'message'=>'Approval action not found.']);
        if (!$this->authorization->hasPermission($cfg['permission'],$user)) return $this->response->setStatusCode(403)->setJSON(['success'=>false,'message'=>'You do not have permission for this approval action.']);
        $status=$this->pendingStatus($module,$cfg,$id,(int)$user->company_id);
        if ($status===null || !in_array(strtoupper($action),$this->allowedActions($module,$status),true)) return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'This action is not allowed for the current approval stage.']);
        try {
            $controller = new $cfg['controller']();
            $controller->initController($this->request, $this->response, service('logger'));
            if (isset($cfg[$action])) {
                if(isset($cfg['parent'])){$row=db_connect()->table($cfg['table'])->select($cfg['parent'])->where(['id'=>$id,'company_id'=>(int)$user->company_id])->get()->getRowArray();return$controller->{$cfg[$action]}((int)$row[$cfg['parent']],$id);}
                return $controller->{$cfg[$action]}($id);
            }
            $method = $cfg['method'];
            if (isset($cfg['route_type'])) return $controller->{$method}($cfg['route_type'],$id,$action);
            return $controller->{$method}($id,$action);
        } catch (Throwable $e) {
            log_message('error','Standalone approval dispatch failed: {error}',['error'=>$e->getMessage()]);
            return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to complete the approval action.']);
        }
    }

    public function history(): ResponseInterface
    {
        $user=auth('session')->user(); if(!$user)return $this->response->setStatusCode(401)->setJSON(['success'=>false,'message'=>'Authentication is required.']);
        $b=db_connect()->table('notifications n')->select('n.id,n.source_module AS module,n.source_table,n.source_record_id,n.title,n.message,n.created_at,n.email_sent,n.email_sent_at,u.first_name,u.last_name')->join('users u','u.id=n.recipient_user_id','left')->where('n.company_id',(int)$user->company_id)->groupStart()->like('n.title','approved')->orLike('n.title','rejected')->groupEnd();
        if($this->request->getGet('date_from'))$b->where('DATE(n.created_at) >=',(string)$this->request->getGet('date_from')); if($this->request->getGet('date_to'))$b->where('DATE(n.created_at) <=',(string)$this->request->getGet('date_to'));
        return $this->ok('Consolidated approval history retrieved successfully.',['history'=>$b->orderBy('n.id','DESC')->limit(500)->get()->getResultArray()]);
    }

    private function pendingItems(): array
    {
        $user=auth('session')->user(); if(!$user)return[]; $company=(int)$user->company_id; $result=[]; $db=db_connect();
        foreach($this->types as$module=>$cfg){if(!$this->authorization->hasPermission($cfg['permission'],$user))continue;$statuses=$this->pendingStatuses($module);$b=$db->table($cfg['table'].' d')->select("d.id,d.{$cfg['no']} AS document_no,d.{$cfg['date']} AS document_date,d.{$cfg['project']} AS project_id,p.project_name,s.{$cfg['status_col']} AS status_code,d.created_at,d.updated_at")->join($cfg['status'].' s','s.id=d.status_id')->join('projects p',"p.id=d.{$cfg['project']} AND p.company_id=d.company_id",'left')->where('d.company_id',$company)->whereIn('s.'.$cfg['status_col'],$statuses);if($cfg['deleted'])$b->where('d.deleted_at',null);foreach($b->get()->getResultArray()as$r){$r['module']=$module;$r['allowed_actions']=$this->allowedActions($module,(string)$r['status_code']);$result[]=$r;}}
        usort($result,static fn($a,$b)=>strcmp((string)$b['updated_at'],(string)$a['updated_at'])); return$result;
    }

    private function pendingStatus(string $module,array $cfg,int$id,int$company):?string
    { $row=db_connect()->table($cfg['table'].' d')->select('s.'.$cfg['status_col'].' AS status_code')->join($cfg['status'].' s','s.id=d.status_id')->where(['d.id'=>$id,'d.company_id'=>$company]);if($cfg['deleted'])$row->where('d.deleted_at',null);$r=$row->get()->getRowArray();$status=$r?(string)$r['status_code']:null;return$status!==null&&in_array($status,$this->pendingStatuses($module),true)?$status:null; }

    private function pendingStatuses(string $module):array
    { return match($module){'MEASUREMENT'=>['SUBMITTED','VERIFIED'],'RA_BILL'=>['SUBMITTED','VERIFIED','APPROVED'],'DAILY_REPORT'=>['SUBMITTED','REVIEWED'],default=>['SUBMITTED']}; }

    private function allowedActions(string$module,string$status):array
    { return match($module.'_'.$status){'MEASUREMENT_SUBMITTED','RA_BILL_SUBMITTED'=>['VERIFY','REJECT'],'MEASUREMENT_VERIFIED','RA_BILL_VERIFIED'=>['APPROVE','REJECT'],'RA_BILL_APPROVED'=>['CERTIFY','REJECT'],'DAILY_REPORT_SUBMITTED'=>['REVIEW','APPROVE','REJECT'],'DAILY_REPORT_REVIEWED'=>['APPROVE','REJECT'],default=>['APPROVE','REJECT']}; }

    private function ok(string$message,array$data):ResponseInterface{return$this->response->setJSON(['success'=>true,'message'=>$message,'data'=>$data]);}
}
