<?php
declare(strict_types=1);
namespace App\Models;
class DailySitePhotoModel extends DailyOperationModel
{
    protected $table='daily_site_photos';
    protected $allowedFields=['company_id','daily_report_id','work_progress_id','issue_id','zone_id','photo_type_id','title','description','file_name','file_path','mime_type','file_size_bytes','captured_at','latitude','longitude','captured_by','display_order','is_client_visible','created_by'];
}
