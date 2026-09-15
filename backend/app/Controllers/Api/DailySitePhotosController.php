<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Models\DailySitePhotoModel;
use CodeIgniter\HTTP\ResponseInterface;

class DailySitePhotosController extends DailyOperationsApiController
{
    public function create(int $reportId):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if(!$this->editable($r))return $this->conflict('Photos can only be added while the report is editable.');$file=$this->request->getFile('photo');if(!$file||!$file->isValid()||$file->hasMoved())return $this->invalid(['photo'=>'A valid photo file is required.']);$allowed=['image/jpeg','image/png','image/webp'];if(!in_array($file->getMimeType(),$allowed,true))return $this->invalid(['photo'=>'Only JPEG, PNG and WEBP files are allowed.']);if($file->getSize()>10*1024*1024)return $this->invalid(['photo'=>'Photo size cannot exceed 10 MB.']);
        $in=$this->request->getPost();$title=trim((string)($in['title']??''));$type=(int)($in['photo_type_id']??0);$e=[];if($title==='')$e['title']='This field is required.';if(!$this->active('daily_site_photos_photo_type_masters',$type))$e['photo_type_id']='Select a valid photo type.';$company=$this->company($u);$zone=(int)($in['zone_id']??0);if(!$this->validZone($zone?:null,(int)$r['site_id'],$company))$e['zone_id']='Select a valid site zone.';foreach(['work_progress_id'=>'daily_work_progress','issue_id'=>'daily_site_issues']as$f=>$t)if((int)($in[$f]??0)>0&&!db_connect()->table($t)->where(['id'=>(int)$in[$f],'daily_report_id'=>$reportId,'company_id'=>$company])->where('deleted_at',null)->countAllResults())$e[$f]='Select a record from this daily report.';if($e)return $this->invalid($e);
        $dir=WRITEPATH.'uploads/daily-reports/'.$reportId;if(!is_dir($dir)&&!mkdir($dir,0775,true)&&!is_dir($dir))return $this->response->setStatusCode(500)->setJSON(['success'=>false,'message'=>'Unable to create the photo upload directory.']);$name=$file->getRandomName();$clientName=$file->getClientName();$mimeType=$file->getMimeType();$fileSize=$file->getSize();$file->move($dir,$name);$relative='uploads/daily-reports/'.$reportId.'/'.$name;$data=['company_id'=>$company,'daily_report_id'=>$reportId,'work_progress_id'=>(int)($in['work_progress_id']??0)?:null,'issue_id'=>(int)($in['issue_id']??0)?:null,'zone_id'=>$zone?:null,'photo_type_id'=>$type,'title'=>$title,'description'=>$in['description']??null,'file_name'=>$clientName,'file_path'=>$relative,'mime_type'=>$mimeType,'file_size_bytes'=>$fileSize,'captured_at'=>$in['captured_at']??null,'latitude'=>$in['latitude']??null,'longitude'=>$in['longitude']??null,'captured_by'=>(int)$u->id,'display_order'=>(int)($in['display_order']??0),'is_client_visible'=>(int)($in['is_client_visible']??0),'created_by'=>(int)$u->id];$id=(int)(new DailySitePhotoModel())->insert($data,true);return $this->ok('Daily site photo uploaded successfully.','photo',$this->photo($id,$reportId,$company),201);
    }
    public function update(int $reportId,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if(!$this->editable($r))return $this->conflict('Photos can only be changed while the report is editable.');$old=$this->photo($id,$reportId,$this->company($u));if(!$old)return $this->notFound('Daily site photo not found.');$in=$this->input();if($in===null)return $this->invalid(['body'=>'A valid JSON request body is required.']);$fields=['work_progress_id','issue_id','zone_id','photo_type_id','title','description','captured_at','latitude','longitude','display_order','is_client_visible'];$d=array_intersect_key($in,array_flip($fields));$m=array_merge($old,$d);$e=[];if(trim((string)$m['title'])==='')$e['title']='This field is required.';if(!$this->active('daily_site_photos_photo_type_masters',(int)$m['photo_type_id']))$e['photo_type_id']='Select a valid photo type.';if(!$this->validZone((int)($m['zone_id']??0)?:null,(int)$r['site_id'],$this->company($u)))$e['zone_id']='Select a valid site zone.';if($e)return $this->invalid($e);(new DailySitePhotoModel())->update($id,$d);return $this->ok('Daily site photo updated successfully.','photo',$this->photo($id,$reportId,$this->company($u)));
    }
    public function download(int $reportId,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();if(!$this->report($reportId,$u))return $this->notFound('Daily site report not found.');$p=$this->photo($id,$reportId,$this->company($u));if(!$p)return $this->notFound('Daily site photo not found.');$path=WRITEPATH.$p['file_path'];if(!is_file($path))return $this->notFound('Photo file not found.');return $this->response->download($path,null)->setFileName((string)$p['file_name']);
    }
    public function delete(int $reportId,int $id):ResponseInterface
    {
        $u=$this->user();if(!$u)return $this->unauthorized();$r=$this->report($reportId,$u,true);if(!$r)return $this->notFound('Daily site report not found.');if(!$this->editable($r))return $this->conflict('Photos can only be deleted while the report is editable.');if(!$this->photo($id,$reportId,$this->company($u)))return $this->notFound('Daily site photo not found.');(new DailySitePhotoModel())->delete($id);return $this->response->setJSON(['success'=>true,'message'=>'Daily site photo deleted successfully.']);
    }
    private function photo(int $id,int $report,int $company):?array{return db_connect()->table('daily_site_photos')->where(['id'=>$id,'daily_report_id'=>$report,'company_id'=>$company])->where('deleted_at',null)->get()->getRowArray();}
}
