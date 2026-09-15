<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NotificationModel;
use Throwable;

class ExpenseNotificationService
{
    private $db;
    private NotificationModel $notifications;

    private array $types = [
        'REQUEST' => [
            'prefix' => 'EXPENSE_REQUEST',
            'label' => 'Expense request',
            'table' => 'expense_requests',
            'number' => 'request_no',
            'permission' => 'expenses.approve_request',
            'url' => '/expense-requests/',
        ],
        'BILL' => [
            'prefix' => 'EXPENSE_BILL',
            'label' => 'Expense bill',
            'table' => 'expense_bills',
            'number' => 'internal_voucher_no',
            'permission' => 'expenses.approve_bill',
            'url' => '/expense-bills/',
        ],
        'PAYMENT' => [
            'prefix' => 'EXPENSE_PAYMENT',
            'label' => 'Expense payment',
            'table' => 'expense_payments',
            'number' => 'payment_no',
            'permission' => 'expense_payments.approve',
            'url' => '/expense-payments/',
        ],
    ];

    public function __construct()
    {
        $this->db = db_connect();
        $this->notifications = new NotificationModel();
    }

    public function notify(string $type, array $record, string $action, int $actorId): void
    {
        $type = strtoupper($type);
        $action = strtoupper($action);
        $config = $this->types[$type] ?? null;

        if ($config === null) {
            log_message('error', 'Unsupported expense notification type: {type}', ['type' => $type]);
            return;
        }

        $eventCode = $config['prefix'] . '_' . $action;
        $event = $this->db->table('notification_event_masters')
            ->where('event_code', $eventCode)
            ->where('is_active', 1)
            ->get()->getRowArray();

        if ($event === null) {
            log_message('error', 'Expense notification event is not configured: {event}', ['event' => $eventCode]);
            return;
        }

        $project = $this->db->table('projects')
            ->select('id, project_name, branch_id')
            ->where('id', (int) ($record['project_id'] ?? 0))
            ->where('company_id', (int) ($record['company_id'] ?? 0))
            ->where('deleted_at', null)
            ->get()->getRowArray();

        if ($project === null) {
            log_message('error', 'Expense notification project is unavailable for record {id}.', [
                'id' => (int) ($record['id'] ?? 0),
            ]);
            return;
        }

        if ($action === 'SUBMITTED') {
            $recipients = $this->approvers($record, $project, $config['permission'], $actorId, true);

            // If no separate approver exists, allow the active actor only when the actor
            // is genuinely a super admin or holds the required approval permission.
            if ($recipients === []) {
                $recipients = $this->approvers($record, $project, $config['permission'], $actorId, false);
            }
        } else {
            $recipients = $this->originator($record);
        }

        if ($recipients === []) {
            log_message('error', 'No recipient found for expense event {event}, record {id}.', [
                'event' => $eventCode,
                'id' => (int) ($record['id'] ?? 0),
            ]);
            return;
        }

        $verb = match ($action) {
            'SUBMITTED' => 'submitted for approval',
            'APPROVE' => 'approved',
            'REJECT' => 'rejected',
            'POST' => 'posted',
            'MARK_PAID' => 'marked paid',
            default => strtolower(str_replace('_', ' ', $action)),
        };
        $reference = (string) ($record[$config['number']] ?? ('#' . (int) $record['id']));
        $title = $config['label'] . ' ' . $verb;
        $message = $reference . ' has been ' . $verb . '.';

        foreach ($recipients as $recipient) {
            $notificationId = $this->notifications->insert([
                'company_id' => (int) $record['company_id'],
                'recipient_user_id' => (int) $recipient['id'],
                'event_id' => (int) $event['id'],
                'project_id' => (int) $record['project_id'],
                'source_module' => 'EXPENSE',
                'source_table' => $config['table'],
                'source_record_id' => (int) $record['id'],
                'title' => $title,
                'message' => $message,
                'action_url' => $config['url'] . (int) $record['id'],
                'is_read' => 0,
                'email_sent' => 0,
                'created_by' => $actorId,
            ], true);

            if (! is_int($notificationId) || $notificationId <= 0) {
                log_message('error', 'Unable to create expense notification for user {user}.', [
                    'user' => (int) $recipient['id'],
                ]);
                continue;
            }

            $this->sendEmail($notificationId, $recipient, $title, $message, $project);
        }
    }

    private function approvers(
        array $record,
        array $project,
        string $permission,
        int $actorId,
        bool $excludeActor
    ): array {
        $today = date('Y-m-d');
        $builder = $this->db->table('users u')->distinct()
            ->select('u.id, u.email, u.first_name, u.last_name')
            ->join('user_statuses us', 'us.id = u.user_status_id')
            ->join('user_roles ur', 'ur.user_id = u.id AND ur.company_id = u.company_id', 'left')
            ->join('roles r', 'r.id = ur.role_id AND r.company_id = ur.company_id', 'left')
            ->join('role_permissions rp', 'rp.role_id = r.id AND rp.company_id = r.company_id', 'left')
            ->join('permissions p', 'p.id = rp.permission_id', 'left')
            ->join('user_branch_access uba', 'uba.user_id = u.id AND uba.company_id = u.company_id', 'left')
            ->join('user_branch_access_access_level_masters alm', 'alm.id = uba.access_level_id', 'left')
            ->where('u.company_id', (int) $record['company_id'])
            ->where('u.is_active', 1)
            ->where('u.active', 1)
            ->where('u.deleted_at', null)
            ->where('us.status_code', 'ACTIVE')
            ->where('us.is_login_allowed', 1)
            ->where('us.is_active', 1)
            ->groupStart()
                ->where('u.is_super_admin', 1)
                ->orGroupStart()
                    ->where('ur.is_active', 1)
                    ->where('ur.deleted_at', null)
                    ->where('r.is_active', 1)
                    ->where('r.deleted_at', null)
                    ->where('rp.is_active', 1)
                    ->where('rp.deleted_at', null)
                    ->where('p.permission_code', $permission)
                    ->where('p.is_active', 1)
                    ->where('p.deleted_at', null)
                    ->groupStart()->where('ur.valid_from', null)->orWhere('ur.valid_from <=', $today)->groupEnd()
                    ->groupStart()->where('ur.valid_until', null)->orWhere('ur.valid_until >=', $today)->groupEnd()
                ->groupEnd()
            ->groupEnd();

        if ($excludeActor) {
            $builder->where('u.id !=', $actorId);
        } else {
            $builder->where('u.id', $actorId);
        }

        if ((int) ($project['branch_id'] ?? 0) > 0) {
            $builder->groupStart()
                ->where('u.is_super_admin', 1)
                ->orGroupStart()
                    ->where('uba.branch_id', (int) $project['branch_id'])
                    ->where('uba.is_active', 1)
                    ->where('uba.deleted_at', null)
                    ->whereIn('alm.access_level_code', ['OPERATE', 'MANAGE'])
                    ->where('alm.is_active', 1)
                    ->groupStart()->where('uba.valid_from', null)->orWhere('uba.valid_from <=', $today)->groupEnd()
                    ->groupStart()->where('uba.valid_until', null)->orWhere('uba.valid_until >=', $today)->groupEnd()
                ->groupEnd()
            ->groupEnd();
        }

        return $builder->get()->getResultArray();
    }

    private function originator(array $record): array
    {
        $userId = (int) ($record['submitted_by'] ?? $record['created_by'] ?? 0);
        if ($userId <= 0) {
            return [];
        }

        return $this->db->table('users u')
            ->select('u.id, u.email, u.first_name, u.last_name')
            ->join('user_statuses us', 'us.id = u.user_status_id')
            ->where('u.id', $userId)
            ->where('u.company_id', (int) $record['company_id'])
            ->where('u.is_active', 1)
            ->where('u.active', 1)
            ->where('u.deleted_at', null)
            ->where('us.status_code', 'ACTIVE')
            ->where('us.is_login_allowed', 1)
            ->where('us.is_active', 1)
            ->get()->getResultArray();
    }

    private function sendEmail(
        int $notificationId,
        array $recipient,
        string $subject,
        string $message,
        array $project
    ): void {
        $recipientEmail = trim((string) ($recipient['email'] ?? ''));
        if ($recipientEmail === '') {
            $error = 'Recipient email address is empty.';
            $this->notifications->update($notificationId, ['email_error' => $error]);
            log_message('error', 'Expense email failed for notification {id}: {error}', [
                'id' => $notificationId,
                'error' => $error,
            ]);
            return;
        }

        try {
            $email = service('email');
            $name = trim((string) ($recipient['first_name'] ?? '') . ' ' . (string) ($recipient['last_name'] ?? ''));
            $email->setTo($recipientEmail)
                ->setSubject($subject)
                ->setMessage(
                    '<p>Hello ' . esc($name) . ',</p>' .
                    '<p>' . esc($message) . '</p>' .
                    '<p>Project: ' . esc((string) $project['project_name']) . '</p>'
                );

            if (! $email->send()) {
                throw new \RuntimeException(strip_tags($email->printDebugger(['headers'])));
            }

            $this->notifications->update($notificationId, [
                'email_sent' => 1,
                'email_sent_at' => date('Y-m-d H:i:s'),
                'email_error' => null,
            ]);
        } catch (Throwable $exception) {
            $error = mb_substr($exception->getMessage(), 0, 1000);
            $this->notifications->update($notificationId, ['email_error' => $error]);
            log_message('error', 'Expense email failed for notification {id}: {error}', [
                'id' => $notificationId,
                'error' => $error,
            ]);
        }
    }
}
