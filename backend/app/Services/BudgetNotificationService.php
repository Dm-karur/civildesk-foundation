<?php

declare(strict_types=1);

namespace App\Services;

use App\Libraries\AuthorizationService;
use App\Models\NotificationModel;
use Throwable;

class BudgetNotificationService
{
    private $db;
    private NotificationModel $notifications;

    public function __construct() { $this->db = db_connect(); $this->notifications = new NotificationModel(); }

    public function notify(array $budget, string $eventCode, int $actorId): void
    {
        $event = $this->db->table('notification_event_masters')->where('event_code', $eventCode)->where('is_active', 1)->get()->getRowArray();
        if ($event === null) { log_message('error', 'Budget notification event is not configured: {event}', ['event' => $eventCode]); return; }
        $recipients = $eventCode === 'BUDGET_SUBMITTED' ? $this->approvers($budget, $actorId) : $this->submitter($budget);
        $title = match ($eventCode) { 'BUDGET_SUBMITTED' => 'Project budget awaiting approval', 'BUDGET_APPROVED' => 'Project budget approved', default => 'Project budget rejected' };
        $verb = match ($eventCode) { 'BUDGET_SUBMITTED' => 'submitted for approval', 'BUDGET_APPROVED' => 'approved', default => 'rejected' };
        $message = sprintf('%s - %s has been %s.', $budget['budget_code'], $budget['budget_name'], $verb);
        foreach ($recipients as $recipient) {
            $id = $this->notifications->insert(['company_id' => (int) $budget['company_id'], 'recipient_user_id' => (int) $recipient['id'],
                'event_id' => (int) $event['id'], 'project_id' => (int) $budget['project_id'], 'source_module' => 'BUDGET',
                'source_table' => 'project_budgets', 'source_record_id' => (int) $budget['id'], 'title' => $title, 'message' => $message,
                'action_url' => '/project-budgets/' . (int) $budget['id'], 'is_read' => 0, 'email_sent' => 0, 'created_by' => $actorId], true);
            if (is_int($id) && $id > 0) $this->sendEmail($id, $recipient, $title, $message, $budget);
        }
    }

    public function notifyRevision(array $budget, array $revision, string $eventCode, int $actorId): void
    {
        $event = $this->db->table('notification_event_masters')->where('event_code', $eventCode)->where('is_active', 1)->get()->getRowArray();
        if ($event === null) { log_message('error', 'Budget revision notification event is not configured: {event}', ['event' => $eventCode]); return; }
        $recipients = $eventCode === 'BUDGET_REVISION_SUBMITTED' ? $this->approvers($budget, $actorId) : $this->revisionRequester($budget, $revision);
        $title = match ($eventCode) { 'BUDGET_REVISION_SUBMITTED' => 'Budget revision awaiting approval', 'BUDGET_REVISION_APPROVED' => 'Budget revision approved', default => 'Budget revision rejected' };
        $verb = match ($eventCode) { 'BUDGET_REVISION_SUBMITTED' => 'submitted for approval', 'BUDGET_REVISION_APPROVED' => 'approved', default => 'rejected' };
        $message = sprintf('%s revision %d has been %s.', $budget['budget_code'], (int) $revision['revision_no'], $verb);
        foreach ($recipients as $recipient) {
            $id = $this->notifications->insert(['company_id' => (int) $budget['company_id'], 'recipient_user_id' => (int) $recipient['id'],
                'event_id' => (int) $event['id'], 'project_id' => (int) $budget['project_id'], 'source_module' => 'BUDGET_REVISION',
                'source_table' => 'budget_revisions', 'source_record_id' => (int) $revision['id'], 'title' => $title, 'message' => $message,
                'action_url' => '/project-budgets/' . (int) $budget['id'] . '/revisions/' . (int) $revision['id'], 'is_read' => 0,
                'email_sent' => 0, 'created_by' => $actorId], true);
            if (is_int($id) && $id > 0) $this->sendEmail($id, $recipient, $title, $message, $budget);
        }
    }

    private function revisionRequester(array $budget, array $revision): array
    {
        $id = (int) ($revision['requested_by'] ?? 0); if ($id <= 0) return [];
        $rows = $this->db->table('users u')->select('u.id,u.company_id,u.user_status_id,u.is_super_admin,u.is_active,u.email,u.first_name,u.last_name')
            ->join('user_statuses us', 'us.id=u.user_status_id')->where('u.id', $id)->where('u.company_id', (int) $budget['company_id'])
            ->where('u.is_active', 1)->where('u.active', 1)->where('u.deleted_at', null)->where('us.status_code', 'ACTIVE')
            ->where('us.is_login_allowed', 1)->where('us.is_active', 1)->get()->getResultArray();
        if ($rows === [] || (int) ($budget['branch_id'] ?? 0) === 0) return $rows;
        return (new AuthorizationService())->canAccessBranch((int) $budget['branch_id'], 'VIEW', (object) $rows[0]) ? $rows : [];
    }

    private function approvers(array $budget, int $actorId): array
    {
        $today = date('Y-m-d'); $q = $this->db->table('users u')->distinct()->select('u.id,u.email,u.first_name,u.last_name')
            ->join('user_statuses us', 'us.id=u.user_status_id')->join('user_roles ur', 'ur.user_id=u.id AND ur.company_id=u.company_id', 'left')
            ->join('roles r', 'r.id=ur.role_id AND r.company_id=ur.company_id', 'left')->join('role_permissions rp', 'rp.role_id=r.id AND rp.company_id=r.company_id', 'left')
            ->join('permissions p', 'p.id=rp.permission_id', 'left')->join('user_branch_access uba', 'uba.user_id=u.id AND uba.company_id=u.company_id', 'left')
            ->join('user_branch_access_access_level_masters alm', 'alm.id=uba.access_level_id', 'left')
            ->where('u.company_id', (int) $budget['company_id'])->where('u.id !=', $actorId)->where('u.is_active', 1)->where('u.active', 1)->where('u.deleted_at', null)
            ->where('us.status_code', 'ACTIVE')->where('us.is_login_allowed', 1)->where('us.is_active', 1)
            ->groupStart()->where('u.is_super_admin', 1)->orGroupStart()->where('ur.is_active', 1)->where('ur.deleted_at', null)->where('r.is_active', 1)->where('r.deleted_at', null)
            ->where('rp.is_active', 1)->where('rp.deleted_at', null)->where('p.permission_code', 'budget.approve')->where('p.is_active', 1)->where('p.deleted_at', null)
            ->groupStart()->where('ur.valid_from', null)->orWhere('ur.valid_from <=', $today)->groupEnd()->groupStart()->where('ur.valid_until', null)->orWhere('ur.valid_until >=', $today)->groupEnd()->groupEnd()->groupEnd();
        if ((int) ($budget['branch_id'] ?? 0) > 0) $q->groupStart()->where('u.is_super_admin', 1)->orGroupStart()->where('uba.branch_id', (int) $budget['branch_id'])->where('uba.is_active', 1)
            ->where('uba.deleted_at', null)->whereIn('alm.access_level_code', ['OPERATE','MANAGE'])->where('alm.is_active', 1)
            ->groupStart()->where('uba.valid_from', null)->orWhere('uba.valid_from <=', $today)->groupEnd()->groupStart()->where('uba.valid_until', null)->orWhere('uba.valid_until >=', $today)->groupEnd()->groupEnd()->groupEnd();
        return $q->get()->getResultArray();
    }

    private function submitter(array $budget): array
    {
        $id = (int) ($budget['submitted_by'] ?? 0); if ($id <= 0) return [];
        $rows = $this->db->table('users u')->select('u.id,u.company_id,u.user_status_id,u.is_super_admin,u.is_active,u.email,u.first_name,u.last_name')
            ->join('user_statuses us', 'us.id=u.user_status_id')->where('u.id', $id)->where('u.company_id', (int) $budget['company_id'])
            ->where('u.is_active', 1)->where('u.active', 1)->where('u.deleted_at', null)->where('us.status_code', 'ACTIVE')->where('us.is_login_allowed', 1)->where('us.is_active', 1)->get()->getResultArray();
        if ($rows === [] || (int) ($budget['branch_id'] ?? 0) === 0) return $rows;
        return (new AuthorizationService())->canAccessBranch((int) $budget['branch_id'], 'VIEW', (object) $rows[0]) ? $rows : [];
    }

    private function sendEmail(int $notificationId, array $recipient, string $subject, string $message, array $budget): void
    {
        if (trim((string) ($recipient['email'] ?? '')) === '') return;
        try { $email = service('email'); $email->setTo($recipient['email'])->setSubject($subject)->setMessage('<p>Hello ' . esc(trim(($recipient['first_name'] ?? '') . ' ' . ($recipient['last_name'] ?? ''))) . ',</p><p>' . esc($message) . '</p><p>Project: ' . esc((string) $budget['project_name']) . '</p>');
            if (! $email->send()) throw new \RuntimeException(strip_tags($email->printDebugger(['headers'])));
            $this->notifications->update($notificationId, ['email_sent' => 1, 'email_sent_at' => date('Y-m-d H:i:s'), 'email_error' => null]);
        } catch (Throwable $e) { $error = mb_substr($e->getMessage(), 0, 1000); $this->notifications->update($notificationId, ['email_error' => $error]); log_message('error', 'Budget email failed for notification {id}: {error}', ['id' => $notificationId, 'error' => $error]); }
    }
}
