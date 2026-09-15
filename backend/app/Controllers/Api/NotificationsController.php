<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\NotificationModel;
use CodeIgniter\HTTP\ResponseInterface;

class NotificationsController extends BaseController
{
    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']);
        $model = new NotificationModel();
        $builder = $model->select('notifications.*, em.event_code, em.event_name')
            ->join('notification_event_masters em', 'em.id = notifications.event_id')
            ->where('notifications.company_id', (int) $user->company_id)
            ->where('notifications.recipient_user_id', (int) $user->id);
        if ($this->request->getGet('unread') === '1') $builder->where('notifications.is_read', 0);
        $rows = $builder->orderBy('notifications.id', 'DESC')->findAll(200);
        return $this->response->setJSON(['success' => true, 'message' => 'Notifications retrieved successfully.', 'data' => ['notifications' => $rows]]);
    }

    public function markRead(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']);
        $model = new NotificationModel();
        $row = $model->where('company_id', (int) $user->company_id)->where('recipient_user_id', (int) $user->id)->find($id);
        if ($row === null) return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Notification not found.']);
        if (! (bool) $row['is_read']) $model->update($id, ['is_read' => 1, 'read_at' => date('Y-m-d H:i:s')]);
        return $this->response->setJSON(['success' => true, 'message' => 'Notification marked as read.', 'data' => ['notification' => $model->find($id)]]);
    }

    public function markAllRead(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']);
        db_connect()->table('notifications')
            ->where('company_id', (int) $user->company_id)
            ->where('recipient_user_id', (int) $user->id)
            ->where('is_read', 0)
            ->update(['is_read' => 1, 'read_at' => date('Y-m-d H:i:s')]);
        return $this->response->setJSON(['success' => true, 'message' => 'All notifications marked as read.']);
    }
}
