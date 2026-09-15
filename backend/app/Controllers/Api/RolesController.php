<?php

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Throwable;

class RolesController extends ResourceController
{
    protected $format = 'json';

    /**
     * GET /api/roles
     */
    public function index(): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();

        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $db = db_connect();

        $roles = $db->table('roles AS r')
            ->select([
                'r.id',
                'r.company_id',
                'r.role_code',
                'r.role_name',
                'r.description',
                'r.role_scope_id',
                'rs.scope_code AS role_scope_code',
                'rs.scope_name AS role_scope_name',
                'r.is_system_role',
                'r.is_active',
                'r.created_by',
                'r.updated_by',
                'r.created_at',
                'r.updated_at',
                'COUNT(rp.id) AS permission_count',
            ])
            ->join('role_scopes AS rs', 'rs.id = r.role_scope_id', 'inner')
            ->join(
                'role_permissions AS rp',
                'rp.role_id = r.id
                 AND rp.company_id = r.company_id
                 AND rp.is_active = 1
                 AND rp.deleted_at IS NULL',
                'left',
                false
            )
            ->where('r.company_id', $userContext['company_id'])
            ->where('r.deleted_at', null)
            ->groupBy([
                'r.id',
                'r.company_id',
                'r.role_code',
                'r.role_name',
                'r.description',
                'r.role_scope_id',
                'rs.scope_code',
                'rs.scope_name',
                'r.is_system_role',
                'r.is_active',
                'r.created_by',
                'r.updated_by',
                'r.created_at',
                'r.updated_at',
            ])
            ->orderBy('r.is_system_role', 'DESC')
            ->orderBy('r.role_name', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($roles as &$role) {
            $role = $this->normaliseRole($role);
        }
        unset($role);

        return $this->respond([
            'status'  => 'success',
            'message' => 'Roles retrieved successfully.',
            'data'    => [
                'roles' => $roles,
                'count' => count($roles),
            ],
        ]);
    }

    /**
     * GET /api/roles/{id}
     */
    public function show($id = null): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();

        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $roleId = filter_var($id, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($roleId === false) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'A valid role ID is required.',
                'errors'  => [
                    'id' => 'Role ID must be a positive integer.',
                ],
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = db_connect();

        $role = $db->table('roles AS r')
            ->select([
                'r.id', 'r.company_id', 'r.role_code', 'r.role_name',
                'r.description', 'r.role_scope_id',
                'rs.scope_code AS role_scope_code',
                'rs.scope_name AS role_scope_name',
                'r.is_system_role', 'r.is_active', 'r.created_by',
                'r.updated_by', 'r.created_at', 'r.updated_at',
            ])
            ->join('role_scopes AS rs', 'rs.id = r.role_scope_id', 'inner')
            ->where('r.id', (int) $roleId)
            ->where('r.company_id', $userContext['company_id'])
            ->where('r.deleted_at', null)
            ->get()
            ->getRowArray();

        if ($role === null) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Role not found.',
            ], ResponseInterface::HTTP_NOT_FOUND);
        }

        $permissions = $db->table('role_permissions AS rp')
            ->select([
                'p.id',
                'p.module_code',
                'p.permission_code',
                'p.permission_name',
                'p.action_type_id',
                'pat.action_type_code',
                'pat.action_type_name',
                'p.description',
                'p.display_order',
                'p.is_active',
                'rp.id AS role_permission_id',
                'rp.granted_by',
                'rp.granted_at',
                'rp.created_at AS assigned_at',
                'rp.updated_at AS assignment_updated_at',
            ])
            ->join('permissions AS p', 'p.id = rp.permission_id', 'inner')
            ->join('permissions_action_type_masters AS pat', 'pat.id = p.action_type_id', 'inner')
            ->where('rp.company_id', $userContext['company_id'])
            ->where('rp.role_id', (int) $roleId)
            ->where('rp.is_active', 1)
            ->where('rp.deleted_at', null)
            ->where('p.is_active', 1)
            ->where('p.deleted_at', null)
            ->orderBy('p.module_code', 'ASC')
            ->orderBy('p.display_order', 'ASC')
            ->orderBy('p.permission_name', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($permissions as &$permission) {
            $permission = $this->normalisePermission($permission);
        }
        unset($permission);

        $role                     = $this->normaliseRole($role);
        $role['permissions']      = $permissions;
        $role['permission_count'] = count($permissions);

        return $this->respond([
            'status'  => 'success',
            'message' => 'Role retrieved successfully.',
            'data'    => [
                'role' => $role,
            ],
        ]);
    }

    /**
     * PUT /api/roles/{id}/permissions
     *
     * Expected JSON:
     * {
     *     "permission_ids": [7, 12]
     * }
     *
     * An empty array is valid and revokes every permission from the role.
     */
    public function updatePermissions($id = null): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();

        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $roleId = filter_var($id, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($roleId === false) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'A valid role ID is required.',
                'errors'  => [
                    'id' => 'Role ID must be a positive integer.',
                ],
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $payload = $this->request->getJSON(true);

        if (! is_array($payload)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'The request body must contain valid JSON.',
                'errors'  => [
                    'body' => 'A valid JSON request body is required.',
                ],
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        if (! array_key_exists('permission_ids', $payload)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Permission validation failed.',
                'errors'  => [
                    'permission_ids' => 'The permission_ids field is required.',
                ],
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (! is_array($payload['permission_ids'])) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Permission validation failed.',
                'errors'  => [
                    'permission_ids' => 'The permission_ids field must be an array.',
                ],
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        }

        $permissionIds = [];
        $invalidValues = [];

        foreach ($payload['permission_ids'] as $permissionId) {
            $validatedId = filter_var(
                $permissionId,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]]
            );

            if ($validatedId === false) {
                $invalidValues[] = $permissionId;
                continue;
            }

            $permissionIds[] = (int) $validatedId;
        }

        if ($invalidValues !== []) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Permission validation failed.',
                'errors'  => [
                    'permission_ids' => 'Every permission ID must be a positive integer.',
                    'invalid_values'  => $invalidValues,
                ],
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        }

        $permissionIds = array_values(array_unique($permissionIds));
        sort($permissionIds);

        $db  = db_connect();
        $now = date('Y-m-d H:i:s');

        try {
            $db->transBegin();

            /*
             * Lock the company-isolated role during synchronisation.
             * A role from another company intentionally returns 404.
             */
            $role = $db->query(
                'SELECT
                    id,
                    company_id,
                    role_code,
                    role_name,
                    description,
                    role_scope_id,
                    is_system_role,
                    is_active,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at
                 FROM roles
                 WHERE id = ?
                   AND company_id = ?
                   AND deleted_at IS NULL
                 LIMIT 1
                 FOR UPDATE',
                [
                    (int) $roleId,
                    $userContext['company_id'],
                ]
            )->getRowArray();

            if ($role === null) {
                $db->transRollback();

                return $this->respond([
                    'status'  => 'error',
                    'message' => 'Role not found.',
                ], ResponseInterface::HTTP_NOT_FOUND);
            }

            /*
             * Permissions are global records because permissions has no
             * company_id column. Only active, non-deleted permissions can
             * be assigned.
             */
            if ($permissionIds !== []) {
                $validPermissionRows = $db->table('permissions')
                    ->select([
                        'id',
                        'permission_code',
                    ])
                    ->whereIn('id', $permissionIds)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->get()
                    ->getResultArray();

                $validPermissionIds = array_map(
                    static fn (array $permission): int => (int) $permission['id'],
                    $validPermissionRows
                );

                sort($validPermissionIds);

                $unknownPermissionIds = array_values(
                    array_diff($permissionIds, $validPermissionIds)
                );

                if ($unknownPermissionIds !== []) {
                    $db->transRollback();

                    return $this->respond([
                        'status'  => 'error',
                        'message' => 'Permission validation failed.',
                        'errors'  => [
                            'permission_ids' => 'One or more permissions do not exist, are inactive, or have been deleted.',
                            'invalid_ids'     => $unknownPermissionIds,
                        ],
                    ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
                }
            }

            $existingRows = $db->table('role_permissions')
                ->select([
                    'id',
                    'permission_id',
                ])
                ->where('company_id', $userContext['company_id'])
                ->where('role_id', (int) $roleId)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->get()
                ->getResultArray();

            $existingByPermissionId = [];

            foreach ($existingRows as $existingRow) {
                $existingByPermissionId[(int) $existingRow['permission_id']] =
                    (int) $existingRow['id'];
            }

            $existingPermissionIds = array_keys($existingByPermissionId);

            $permissionIdsToRemove = array_values(
                array_diff($existingPermissionIds, $permissionIds)
            );

            $permissionIdsToAdd = array_values(
                array_diff($permissionIds, $existingPermissionIds)
            );

            /*
             * Soft-delete removed grants. This also changes active_grant
             * from 1 to NULL, allowing a future fresh grant under the
             * uq_role_permissions_active generated-column constraint.
             */
            if ($permissionIdsToRemove !== []) {
                $rolePermissionIdsToRemove = [];

                foreach ($permissionIdsToRemove as $permissionIdToRemove) {
                    $rolePermissionIdsToRemove[] =
                        $existingByPermissionId[$permissionIdToRemove];
                }

                $db->table('role_permissions')
                    ->where('company_id', $userContext['company_id'])
                    ->where('role_id', (int) $roleId)
                    ->whereIn('id', $rolePermissionIdsToRemove)
                    ->where('deleted_at', null)
                    ->update([
                        'is_active' => 0,
                        'updated_at' => $now,
                        'deleted_at' => $now,
                    ]);
            }

            if ($permissionIdsToAdd !== []) {
                $newGrants = [];

                foreach ($permissionIdsToAdd as $permissionIdToAdd) {
                    $newGrants[] = [
                        'company_id'   => $userContext['company_id'],
                        'role_id'      => (int) $roleId,
                        'permission_id' => $permissionIdToAdd,
                        'granted_by'   => $userContext['user_id'],
                        'granted_at'   => $now,
                        'is_active'    => 1,
                        'created_at'   => $now,
                        'updated_at'   => $now,
                        'deleted_at'   => null,
                    ];
                }

                $db->table('role_permissions')->insertBatch($newGrants);
            }

            $db->table('roles')
                ->where('id', (int) $roleId)
                ->where('company_id', $userContext['company_id'])
                ->where('deleted_at', null)
                ->update([
                    'updated_by' => $userContext['user_id'],
                    'updated_at' => $now,
                ]);

            if ($db->transStatus() === false) {
                $db->transRollback();

                return $this->respond([
                    'status'  => 'error',
                    'message' => 'Role permissions could not be updated.',
                ], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
            }

            $db->transCommit();
        } catch (Throwable $exception) {
            if ($db->transStatus() !== false) {
                $db->transRollback();
            }

            log_message(
                'error',
                'Role permission synchronisation failed for role {roleId}: {message}',
                [
                    'roleId' => (int) $roleId,
                    'message' => $exception->getMessage(),
                ]
            );

            return $this->respond([
                'status'  => 'error',
                'message' => 'Role permissions could not be updated.',
            ], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        $permissions = [];

        if ($permissionIds !== []) {
            $permissions = $db->table('role_permissions AS rp')
                ->select([
                    'p.id',
                    'p.module_code',
                    'p.permission_code',
                    'p.permission_name',
                    'p.action_type_id',
                    'pat.action_type_code',
                    'pat.action_type_name',
                    'p.description',
                    'p.display_order',
                    'p.is_active',
                    'rp.id AS role_permission_id',
                    'rp.granted_by',
                    'rp.granted_at',
                    'rp.created_at AS assigned_at',
                    'rp.updated_at AS assignment_updated_at',
                ])
                ->join('permissions AS p', 'p.id = rp.permission_id', 'inner')
                ->join('permissions_action_type_masters AS pat', 'pat.id = p.action_type_id', 'inner')
                ->where('rp.company_id', $userContext['company_id'])
                ->where('rp.role_id', (int) $roleId)
                ->where('rp.is_active', 1)
                ->where('rp.deleted_at', null)
                ->where('p.is_active', 1)
                ->where('p.deleted_at', null)
                ->orderBy('p.module_code', 'ASC')
                ->orderBy('p.display_order', 'ASC')
                ->orderBy('p.permission_name', 'ASC')
                ->get()
                ->getResultArray();

            foreach ($permissions as &$permission) {
                $permission = $this->normalisePermission($permission);
            }
            unset($permission);
        }

        $role                     = $this->normaliseRole($role);
        $role['updated_by']       = $userContext['user_id'];
        $role['updated_at']       = $now;
        $role['permissions']      = $permissions;
        $role['permission_count'] = count($permissions);

        return $this->respond([
            'status'  => 'success',
            'message' => 'Role permissions updated successfully.',
            'data'    => [
                'role'    => $role,
                'changes' => [
                    'added_permission_ids'   => $permissionIdsToAdd,
                    'removed_permission_ids' => $permissionIdsToRemove,
                    'assigned_permission_ids' => $permissionIds,
                ],
            ],
        ]);
    }

    /**
     * POST /api/roles
     */
    public function create(): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();
        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $payload = $this->request->getJSON(true);
        if (!is_array($payload)) {
            return $this->respond(['status' => 'error', 'message' => 'Invalid JSON body.'], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = db_connect();

        $data = [
            'company_id'    => $userContext['company_id'],
            'role_code'     => trim($payload['role_code'] ?? ''),
            'role_name'     => trim($payload['role_name'] ?? ''),
            'description'   => trim($payload['description'] ?? ''),
            'role_scope_id' => 1, // Defaulting to 1 for custom roles
            'is_system_role'=> 0,
            'is_active'     => isset($payload['is_active']) ? (int) $payload['is_active'] : 1,
            'created_by'    => $userContext['user_id'],
            'updated_by'    => $userContext['user_id'],
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s')
        ];

        if (empty($data['role_code']) || empty($data['role_name'])) {
            return $this->respond([
                'status' => 'error',
                'message' => 'role_code and role_name are required.'
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        }

        $db->table('roles')->insert($data);
        $roleId = $db->insertID();

        return $this->respond([
            'status' => 'success',
            'message' => 'Role created successfully',
            'data' => array_merge(['id' => $roleId], $data)
        ], ResponseInterface::HTTP_CREATED);
    }

    /**
     * PUT/PATCH /api/roles/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();
        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $roleId = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($roleId === false) {
            return $this->respond(['status' => 'error', 'message' => 'Invalid Role ID.'], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $payload = $this->request->getJSON(true);
        if (!is_array($payload)) {
            return $this->respond(['status' => 'error', 'message' => 'Invalid JSON body.'], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = db_connect();
        
        $role = $db->table('roles')
            ->where('id', $roleId)
            ->where('company_id', $userContext['company_id'])
            ->get()->getRowArray();

        if (!$role) {
            return $this->respond(['status' => 'error', 'message' => 'Role not found.'], ResponseInterface::HTTP_NOT_FOUND);
        }
        if ($role['is_system_role']) {
            return $this->respond(['status' => 'error', 'message' => 'Cannot update system roles.'], ResponseInterface::HTTP_FORBIDDEN);
        }

        $updateData = [
            'updated_by' => $userContext['user_id'],
            'updated_at' => date('Y-m-d H:i:s')
        ];

        if (isset($payload['role_code'])) $updateData['role_code'] = trim($payload['role_code']);
        if (isset($payload['role_name'])) $updateData['role_name'] = trim($payload['role_name']);
        if (isset($payload['description'])) $updateData['description'] = trim($payload['description']);
        if (isset($payload['is_active'])) $updateData['is_active'] = (int) $payload['is_active'];

        $db->table('roles')->where('id', $roleId)->update($updateData);

        return $this->respond([
            'status' => 'success',
            'message' => 'Role updated successfully'
        ]);
    }

    /**
     * DELETE /api/roles/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $userContext = $this->getAuthenticatedUserContext();
        if ($userContext === null) {
            return $this->failUnauthorizedResponse();
        }

        $roleId = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($roleId === false) {
            return $this->respond(['status' => 'error', 'message' => 'Invalid Role ID.'], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = db_connect();
        
        $role = $db->table('roles')
            ->where('id', $roleId)
            ->where('company_id', $userContext['company_id'])
            ->get()->getRowArray();

        if (!$role) {
            return $this->respond(['status' => 'error', 'message' => 'Role not found.'], ResponseInterface::HTTP_NOT_FOUND);
        }
        if ($role['is_system_role']) {
            return $this->respond(['status' => 'error', 'message' => 'Cannot delete system roles.'], ResponseInterface::HTTP_FORBIDDEN);
        }

        $db->table('roles')->where('id', $roleId)->update([
            'deleted_at' => date('Y-m-d H:i:s'),
            'updated_by' => $userContext['user_id']
        ]);

        return $this->respond([
            'status' => 'success',
            'message' => 'Role deleted successfully'
        ]);
    }

    /**
     * Return authenticated user and company identifiers.
     */
    private function getAuthenticatedUserContext(): ?array
    {
        $user = auth()->user();

        if ($user === null) {
            return null;
        }

        $userId    = (int) ($user->id ?? 0);
        $companyId = (int) ($user->company_id ?? 0);

        if ($userId < 1 || $companyId < 1) {
            return null;
        }

        return [
            'user_id'    => $userId,
            'company_id' => $companyId,
        ];
    }

    private function failUnauthorizedResponse(): ResponseInterface
    {
        return $this->respond([
            'status'  => 'error',
            'message' => 'Authentication is required.',
        ], ResponseInterface::HTTP_UNAUTHORIZED);
    }

    private function normaliseRole(array $role): array
    {
        $role['id']             = (int) $role['id'];
        $role['company_id']     = (int) $role['company_id'];
        $role['role_scope_id']  = (int) $role['role_scope_id'];
        $role['is_system_role'] = (bool) $role['is_system_role'];
        $role['is_active']      = (bool) $role['is_active'];

        if (array_key_exists('permission_count', $role)) {
            $role['permission_count'] = (int) $role['permission_count'];
        }

        if (array_key_exists('created_by', $role)) {
            $role['created_by'] = $role['created_by'] !== null
                ? (int) $role['created_by']
                : null;
        }

        if (array_key_exists('updated_by', $role)) {
            $role['updated_by'] = $role['updated_by'] !== null
                ? (int) $role['updated_by']
                : null;
        }

        return $role;
    }

    private function normalisePermission(array $permission): array
    {
        $permission['id']        = (int) $permission['id'];
        $permission['action_type_id'] = (int) $permission['action_type_id'];
        $permission['is_active'] = (bool) $permission['is_active'];

        if (array_key_exists('display_order', $permission)) {
            $permission['display_order'] =
                (int) $permission['display_order'];
        }

        if (array_key_exists('role_permission_id', $permission)) {
            $permission['role_permission_id'] =
                (int) $permission['role_permission_id'];
        }

        if (array_key_exists('granted_by', $permission)) {
            $permission['granted_by'] =
                $permission['granted_by'] !== null
                    ? (int) $permission['granted_by']
                    : null;
        }

        return $permission;
    }
}
