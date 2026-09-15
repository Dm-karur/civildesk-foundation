<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

final class PermissionsController extends BaseController
{
    public function index(): ResponseInterface
    {
        $permissions = db_connect()->table('permissions AS permission')
            ->select([
                'permission.id',
                'permission.module_code',
                'permission.permission_code',
                'permission.permission_name',
                'permission.description',
                'permission.display_order',
                'action_type.action_type_code',
                'action_type.action_type_name',
            ])
            ->join(
                'permissions_action_type_masters AS action_type',
                'action_type.id = permission.action_type_id'
            )
            ->where('permission.is_active', 1)
            ->where('permission.deleted_at', null)
            ->orderBy('permission.module_code', 'ASC')
            ->orderBy('permission.display_order', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($permissions as &$permission) {
            $permission['id'] = (int) $permission['id'];
            $permission['display_order'] = (int) $permission['display_order'];
        }
        unset($permission);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Permissions retrieved successfully.',
            'data' => ['permissions' => $permissions],
        ]);
    }
}
