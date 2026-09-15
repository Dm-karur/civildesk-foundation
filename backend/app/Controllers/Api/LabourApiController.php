<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

abstract class LabourApiController extends BaseController
{
    protected AuthorizationService $authorization;

    public function __construct()
    {
        $this->authorization = new AuthorizationService();
    }

    protected function user(): ?object { return auth('session')->user(); }
    protected function input(): ?array { $v = $this->request->getJSON(true); return is_array($v) ? $v : null; }
    protected function companyId(object $user): int { return (int) $user->company_id; }
    protected function now(): string { return date('Y-m-d H:i:s'); }

    protected function masterId(string $table, string $codeColumn, string $code): ?int
    {
        $row = db_connect()->table($table)->select('id')->where($codeColumn, $code)->where('is_active', 1)->get()->getRowArray();
        return $row ? (int) $row['id'] : null;
    }

    protected function project(int $id, object $user, bool $operate = false): ?array
    {
        $row = db_connect()->table('projects')->where('id', $id)->where('company_id', $this->companyId($user))->where('deleted_at', null)->get()->getRowArray();
        if ($row === null) return null;
        $branchId = (int) ($row['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch($branchId, $operate ? 'OPERATE' : 'VIEW', $user)) return null;
        return $row;
    }

    protected function site(int $siteId, int $projectId, object $user, bool $operate = false): ?array
    {
        if ($this->project($projectId, $user, $operate) === null) return null;
        return db_connect()->table('project_sites')->where('id', $siteId)->where('company_id', $this->companyId($user))->where('project_id', $projectId)->where('deleted_at', null)->get()->getRowArray();
    }

    protected function activeMaster(string $table, int $id): bool
    { return $id > 0 && db_connect()->table($table)->where('id', $id)->where('is_active', 1)->countAllResults() > 0; }

    protected function required(array $data, array $fields): array
    {
        $errors = [];
        foreach ($fields as $field) if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) $errors[$field] = 'This field is required.';
        return $errors;
    }

    protected function record(string $table, int $id, int $companyId, bool $soft = false): ?array
    {
        $b = db_connect()->table($table)->where('id', $id)->where('company_id', $companyId);
        if ($soft) $b->where('deleted_at', null);
        return $b->get()->getRowArray();
    }

    protected function statusLog(int $companyId, string $entityCode, int $entityId, ?string $old, string $new, string $action, ?string $remarks, int $userId): void
    {
        $type = $this->masterId('labour_status_logs_entity_type_masters', 'entity_type_code', $entityCode);
        if ($type === null) return;
        db_connect()->table('labour_status_logs')->insert(['company_id'=>$companyId,'entity_type_id'=>$type,'entity_id'=>$entityId,'old_status'=>$old,'new_status'=>$new,'action_code'=>$action,'remarks'=>$remarks,'changed_by'=>$userId,'changed_at'=>$this->now()]);
    }

    protected function transaction(callable $work, string $message): ResponseInterface
    {
        $db = db_connect(); $db->transBegin();
        try { $response = $work($db); if ($db->transStatus() === false) throw new \RuntimeException('Database transaction failed.'); $db->transCommit(); return $response; }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError($message, $e); }
    }

    protected function ok(string $message, string $key, mixed $value, int $status = 200): ResponseInterface
    { return $this->response->setStatusCode($status)->setJSON(['success'=>true,'message'=>$message,'data'=>[$key=>$value]]); }

    protected function invalid(array $errors, string $message = 'Validation failed.'): ResponseInterface
    {
        return $this->response->setStatusCode(422)->setJSON([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ]);
    }

    protected function unauthorized(string $message = 'Authentication is required.'): ResponseInterface
    {
        return $this->response->setStatusCode(401)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }

    protected function notFound(string $message = 'Record not found.'): ResponseInterface
    {
        return $this->response->setStatusCode(404)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }

    protected function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {exception}', ['exception' => $exception]);

        return $this->response->setStatusCode(500)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }
}
