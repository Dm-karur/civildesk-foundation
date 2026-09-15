<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;

class DailyOperationEntriesController extends DailyOperationsApiController
{
    private array $config=[
        'work-progress'=>['table'=>'daily_work_progress','model'=>\App\Models\DailyWorkProgressModel::class,'key'=>'work_progress','required'=>['boq_item_id','uom_id','quality_status_id','work_status_id'],'fields'=>['boq_item_id','zone_id','uom_id','location_description','planned_qty_for_day','completed_qty_for_day','cumulative_qty_before','cumulative_qty_after','completion_percentage','quality_status_id','inspected_by','inspected_at','measurement_reference','work_status_id','remarks']],
        'manpower'=>['table'=>'daily_site_manpower','model'=>\App\Models\DailySiteManpowerModel::class,'key'=>'manpower','required'=>['labour_category_id','source_type_id'],'fields'=>['labour_category_id','contractor_id','zone_id','planned_count','present_count','absent_count','overtime_workers','total_regular_hours','total_overtime_hours','source_type_id','work_description','remarks']],
        'equipment'=>['table'=>'daily_site_equipment','model'=>\App\Models\DailySiteEquipmentModel::class,'key'=>'equipment','required'=>['equipment_name','ownership_type_id','status_id'],'fields'=>['zone_id','equipment_code','equipment_name','ownership_type_id','supplier_or_owner','operator_name','quantity','start_time','end_time','working_hours','idle_hours','breakdown_hours','fuel_consumed','fuel_uom','meter_opening','meter_closing','status_id','work_description','remarks']],
        'weather'=>['table'=>'daily_site_weather','model'=>\App\Models\DailySiteWeatherModel::class,'key'=>'weather','required'=>['weather_period_id','weather_condition_id','work_impact_id'],'fields'=>['observation_time','weather_period_id','weather_condition_id','temperature_c','humidity_percentage','rainfall_mm','work_impact_id','lost_hours','remarks']],
        'issues'=>['table'=>'daily_site_issues','model'=>\App\Models\DailySiteIssueModel::class,'key'=>'issue','required'=>['issue_no','issue_type_id','title','description','priority_id','work_impact_id','status_id'],'fields'=>['zone_id','issue_no','issue_type_id','title','description','priority_id','work_impact_id','lost_hours','reported_by','assigned_to','target_resolution_date','resolved_date','resolution','status_id']],
        'visitors'=>['table'=>'daily_site_visitors','model'=>\App\Models\DailySiteVisitorModel::class,'key'=>'visitor','required'=>['visitor_name','visit_type_id'],'fields'=>['visitor_name','organisation','designation','phone','visit_type_id','purpose','check_in_time','check_out_time','hosted_by','instructions_or_observations','follow_up_required','follow_up_owner','follow_up_date']],
        'material-consumption'=>['table'=>'daily_material_consumption','model'=>\App\Models\DailyMaterialConsumptionModel::class,'key'=>'material_consumption','required'=>['material_id','uom_id','source_type_id'],'fields'=>['work_progress_id','material_id','uom_id','zone_id','stock_transaction_id','issued_qty','consumed_qty','returned_qty','wasted_qty','unit_rate','source_type_id','remarks']],
    ];

    public function index(int $reportId,string $type):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u);if(!$r)return $this->notFound('Daily site report not found.');$c=$this->config[$type]??null;if(!$c)return $this->notFound('Daily operation entry type not found.');$rows=db_connect()->table($c['table'])->where(['company_id'=>$this->company($u),'daily_report_id'=>$reportId])->where('deleted_at',null)->orderBy('id')->get()->getResultArray();return $this->ok('Daily operation entries retrieved successfully.',$this->pluralKey($type),$rows);
    }
    public function show(int $reportId,string $type,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u);if(!$r)return $this->notFound('Daily site report not found.');$c=$this->config[$type]??null;if(!$c)return $this->notFound('Daily operation entry type not found.');$row=$this->entry($c,$id,$reportId,$this->company($u));return $row?$this->ok('Daily operation entry retrieved successfully.',$c['key'],$row):$this->notFound();
    }
    public function create(int $reportId,string $type):ResponseInterface{return $this->save($reportId,$type,null);}
    public function update(int $reportId,string $type,int $id):ResponseInterface{return $this->save($reportId,$type,$id);}
    private function save(int $reportId,string $type,?int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if(!$this->editable($r))return $this->conflict('Entries can only be changed while the report is editable.');$c=$this->config[$type]??null;if(!$c)return $this->notFound('Daily operation entry type not found.');$in=$this->input();if($in===null)return $this->invalid(['body'=>'A valid JSON request body is required.']);$company=$this->company($u);$old=$id?$this->entry($c,$id,$reportId,$company):null;if($id&&!$old)return $this->notFound();$d=array_intersect_key($in,array_flip($c['fields']));$m=array_merge($old??[],$d);$e=$this->required($m,$c['required']);$this->validateEntry($type,$m,$r,$e,$company,$id);if($e)return $this->invalid($e);
        if($type==='work-progress'){$d['cumulative_qty_after']=(float)($m['cumulative_qty_before']??0)+(float)($m['completed_qty_for_day']??0);$boq=db_connect()->table('boq_items')->select('quantity')->where(['id'=>(int)$m['boq_item_id'],'project_id'=>(int)$r['project_id']])->where('deleted_at',null)->get()->getRowArray();$d['completion_percentage']=$boq&&(float)$boq['quantity']>0?round(((float)$d['cumulative_qty_after']/(float)$boq['quantity'])*100,4):0;}
        if($type==='material-consumption')$d['consumption_value']=round((float)($m['consumed_qty']??0)*(float)($m['unit_rate']??0),2);
        $d['company_id']=$company;$d['daily_report_id']=$reportId;$d['updated_by']=(int)$u->id;$d['created_by']=$old?($old['created_by']??(int)$u->id):(int)$u->id;if(in_array($type,['work-progress','material-consumption'],true))$d['project_id']=(int)$r['project_id'];if($type==='work-progress')$d['site_id']=(int)$r['site_id'];$modelClass=$c['model'];$model=new $modelClass();$id?$model->update($id,$d):$id=(int)$model->insert($d,true);$this->syncTotals($reportId);
        if($type==='work-progress'&&!empty($m['boq_item_id'])){
            $bId=(int)$m['boq_item_id'];
            $totExec=(float)(db_connect()->table('daily_work_progress')->selectSum('completed_qty_for_day','tot')->where('boq_item_id',$bId)->where('deleted_at',null)->get()->getRowArray()['tot']??0);
            $bItm=db_connect()->table('boq_items')->where('id',$bId)->get()->getRowArray();
            if($bItm){
                $q=(float)($bItm['quantity']??0);
                $bal=max(0.0,$q-$totExec);
                $pct=$q>0?min(100.0,round(($totExec/$q)*100,2)):0.0;
                db_connect()->table('boq_items')->where('id',$bId)->update(['executed_quantity'=>$totExec,'balance_quantity'=>$bal,'execution_progress'=>$pct]);
            }
        }
        return $this->ok('Daily operation entry '.($old?'updated':'created').' successfully.',$c['key'],$this->entry($c,$id,$reportId,$company),$old?200:201);
    }
    public function delete(int $reportId,string $type,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if(!$this->editable($r))return $this->conflict('Entries can only be deleted while the report is editable.');$c=$this->config[$type]??null;if(!$c)return $this->notFound();$ent=$this->entry($c,$id,$reportId,$this->company($u));if(!$ent)return $this->notFound();$modelClass=$c['model'];$model=new $modelClass();$model->delete($id);$this->syncTotals($reportId);
        if($type==='work-progress'&&!empty($ent['boq_item_id'])){
            $bId=(int)$ent['boq_item_id'];
            $totExec=(float)(db_connect()->table('daily_work_progress')->selectSum('completed_qty_for_day','tot')->where('boq_item_id',$bId)->where('deleted_at',null)->get()->getRowArray()['tot']??0);
            $bItm=db_connect()->table('boq_items')->where('id',$bId)->get()->getRowArray();
            if($bItm){
                $q=(float)($bItm['quantity']??0);
                $bal=max(0.0,$q-$totExec);
                $pct=$q>0?min(100.0,round(($totExec/$q)*100,2)):0.0;
                db_connect()->table('boq_items')->where('id',$bId)->update(['executed_quantity'=>$totExec,'balance_quantity'=>$bal,'execution_progress'=>$pct]);
            }
        }
        return $this->response->setJSON(['success'=>true,'message'=>'Daily operation entry deleted successfully.']);
    }
    public function inspect(int $reportId,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');$c=$this->config['work-progress'];$row=$this->entry($c,$id,$reportId,$this->company($u));if(!$row)return $this->notFound('Work progress entry not found.');$in=$this->input()??[];$quality=(int)($in['quality_status_id']??0);if(!$this->active('daily_work_progress_quality_status_masters',$quality))return $this->invalid(['quality_status_id'=>'Select a valid quality status.']);$d=['quality_status_id'=>$quality,'inspected_by'=>(int)$u->id,'inspected_at'=>$this->now(),'updated_by'=>(int)$u->id];if(array_key_exists('remarks',$in))$d['remarks']=$in['remarks'];(new \App\Models\DailyWorkProgressModel())->update($id,$d);return $this->ok('Work progress inspected successfully.','work_progress',$this->entry($c,$id,$reportId,$this->company($u)));
    }
    private function validateEntry(string $type,array $m,array $r,array &$e,int $company,?int $id):void
    {
        $zone=isset($m['zone_id'])?(int)$m['zone_id']:null;if(!$this->validZone($zone,(int)$r['site_id'],$company))$e['zone_id']='Select a valid site zone.';
        $masterMap=['work-progress'=>[['quality_status_id','daily_work_progress_quality_status_masters'],['work_status_id','daily_work_progress_work_status_masters']],'manpower'=>[['source_type_id','daily_site_manpower_source_type_masters']],'equipment'=>[['ownership_type_id','daily_site_equipment_ownership_type_masters'],['status_id','daily_site_equipment_status_masters']],'weather'=>[['weather_period_id','daily_site_weather_weather_period_masters'],['weather_condition_id','daily_site_weather_weather_condition_masters'],['work_impact_id','daily_site_weather_work_impact_masters']],'issues'=>[['issue_type_id','daily_site_issues_issue_type_masters'],['priority_id','daily_site_issues_priority_masters'],['work_impact_id','daily_site_issues_work_impact_masters'],['status_id','daily_site_issues_status_masters']],'visitors'=>[['visit_type_id','daily_site_visitors_visit_type_masters']],'material-consumption'=>[['source_type_id','daily_material_consumption_source_type_masters']]];
        foreach($masterMap[$type]??[]as[$f,$t])if(!$this->active($t,(int)($m[$f]??0)))$e[$f]='Select a valid controlled value.';
        foreach(['planned_count','present_count','absent_count','overtime_workers','quantity','working_hours','idle_hours','breakdown_hours','fuel_consumed','lost_hours','planned_qty_for_day','completed_qty_for_day','cumulative_qty_before','issued_qty','consumed_qty','returned_qty','wasted_qty','unit_rate']as$f)if(isset($m[$f])&&(float)$m[$f]<0)$e[$f]='Value cannot be negative.';
        if($type==='work-progress'){if(!db_connect()->table('boq_items')->where(['id'=>(int)($m['boq_item_id']??0),'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e['boq_item_id']='Select a valid BOQ item.';if(!db_connect()->table('units_of_measurement')->where(['id'=>(int)($m['uom_id']??0),'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e['uom_id']='Select a valid company UOM.';}
        if($type==='manpower'){if(!db_connect()->table('labour_categories')->where(['id'=>(int)($m['labour_category_id']??0),'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e['labour_category_id']='Select a valid labour category.';if(!empty($m['contractor_id'])&&!$this->row('labour_contractors',(int)$m['contractor_id'],$company))$e['contractor_id']='Select a valid labour contractor.';}
        if($type==='issues'){foreach(['reported_by','assigned_to']as$f)if(!$this->validCompanyUser(isset($m[$f])?(int)$m[$f]:null,$company))$e[$f]='Select a valid company user.';$b=db_connect()->table('daily_site_issues')->where(['company_id'=>$company,'issue_no'=>(string)($m['issue_no']??'')])->where('deleted_at',null);if($id)$b->where('id !=',$id);if($b->countAllResults())$e['issue_no']='Issue number already exists.';}
        if($type==='visitors')foreach(['hosted_by','follow_up_owner']as$f)if(!$this->validCompanyUser(isset($m[$f])?(int)$m[$f]:null,$company))$e[$f]='Select a valid company user.';
        if($type==='material-consumption'){if(!db_connect()->table('materials')->where(['id'=>(int)($m['material_id']??0),'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e['material_id']='Select a valid company material.';if(!db_connect()->table('units_of_measurement')->where(['id'=>(int)($m['uom_id']??0),'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e['uom_id']='Select a valid company UOM.';if(!empty($m['work_progress_id'])&&!$this->entry($this->config['work-progress'],(int)$m['work_progress_id'],(int)$r['id'],$company))$e['work_progress_id']='Select work progress from this report.';if(!empty($m['stock_transaction_id'])&&!db_connect()->table('material_transactions')->where(['id'=>(int)$m['stock_transaction_id'],'company_id'=>$company,'project_id'=>(int)$r['project_id']])->where('deleted_at',null)->countAllResults())$e['stock_transaction_id']='Select a valid project stock transaction.';}
    }
    private function entry(array $c,int $id,int $report,int $company):?array{return db_connect()->table($c['table'])->where(['id'=>$id,'daily_report_id'=>$report,'company_id'=>$company])->where('deleted_at',null)->get()->getRowArray();}
    private function pluralKey(string $type):string{return str_replace('-','_',$type).($type==='equipment'?'':($type==='weather'?'':'s'));}
    private function syncTotals(int $report):void{$db=db_connect();$man=(int)($db->table('daily_site_manpower')->selectSum('present_count','total')->where('daily_report_id',$report)->where('deleted_at',null)->get()->getRowArray()['total']??0);$eq=(int)($db->table('daily_site_equipment')->selectSum('quantity','total')->where('daily_report_id',$report)->where('deleted_at',null)->get()->getRowArray()['total']??0);$db->table('daily_site_reports')->where('id',$report)->update(['total_manpower'=>$man,'total_equipment'=>$eq]);}
}
