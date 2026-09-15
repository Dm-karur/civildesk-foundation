<?php

declare(strict_types=1);

namespace App\Libraries;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

class AuthorizationService
{
    private BaseConnection $db;

    public function __construct()
    {
        $this->db = db_connect();
    }

    /**
     * Check whether the authenticated user is a super administrator.
     */
    public function isSuperAdmin(?object $user = null): bool
    {
        $user ??= auth('session')->user();

        if (
            $user === null
            || (int) ($user->is_super_admin ?? 0) !== 1
            || (int) ($user->is_active ?? 0) !== 1
        ) {
            return false;
        }

        return $this->db->table('user_statuses')
            ->where('id', (int) ($user->user_status_id ?? 0))
            ->where('status_code', 'ACTIVE')
            ->where('is_login_allowed', 1)
            ->where('is_active', 1)
            ->countAllResults() > 0;
    }

    /**
     * Check whether the authenticated user belongs to a company.
     */
    public function belongsToCompany(
        int $companyId,
        ?object $user = null
    ): bool {
        $user ??= auth('session')->user();

        if ($user === null || $companyId <= 0) {
            return false;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return (int) ($user->company_id ?? 0) === $companyId;
    }

    /**
     * Check whether the user has an active role.
     */
    public function hasRole(
        string $roleCode,
        ?object $user = null
    ): bool {
        $user ??= auth('session')->user();
        $roleCode = strtoupper(trim($roleCode));

        if ($user === null || $roleCode === '') {
            return false;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $today = date('Y-m-d');

        return $this->db->table('user_roles ur')
            ->join(
                'roles r',
                'r.id = ur.role_id AND r.company_id = ur.company_id',
                'inner'
            )
            ->where('ur.company_id', (int) $user->company_id)
            ->where('ur.user_id', (int) $user->id)
            ->where('ur.is_active', 1)
            ->where('ur.deleted_at', null)
            ->where('r.role_code', $roleCode)
            ->where('r.is_active', 1)
            ->where('r.deleted_at', null)
            ->groupStart()
                ->where('ur.valid_from', null)
                ->orWhere('ur.valid_from <=', $today)
            ->groupEnd()
            ->groupStart()
                ->where('ur.valid_until', null)
                ->orWhere('ur.valid_until >=', $today)
            ->groupEnd()
            ->countAllResults() > 0;
    }

    /**
     * Check whether the user has an active permission.
     */
    public function hasPermission(
        string $permissionCode,
        ?object $user = null
    ): bool {
        $user ??= auth('session')->user();
        $permissionCode = strtolower(trim($permissionCode));

        if ($user === null || $permissionCode === '') {
            return false;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $today = date('Y-m-d');

        return $this->db->table('user_roles ur')
            ->join(
                'roles r',
                'r.id = ur.role_id AND r.company_id = ur.company_id',
                'inner'
            )
            ->join(
                'role_permissions rp',
                'rp.role_id = r.id AND rp.company_id = ur.company_id',
                'inner'
            )
            ->join(
                'permissions p',
                'p.id = rp.permission_id',
                'inner'
            )
            ->where('ur.company_id', (int) $user->company_id)
            ->where('ur.user_id', (int) $user->id)
            ->where('ur.is_active', 1)
            ->where('ur.deleted_at', null)
            ->where('r.is_active', 1)
            ->where('r.deleted_at', null)
            ->where('rp.is_active', 1)
            ->where('rp.deleted_at', null)
            ->where('p.permission_code', $permissionCode)
            ->where('p.is_active', 1)
            ->where('p.deleted_at', null)
            ->groupStart()
                ->where('ur.valid_from', null)
                ->orWhere('ur.valid_from <=', $today)
            ->groupEnd()
            ->groupStart()
                ->where('ur.valid_until', null)
                ->orWhere('ur.valid_until >=', $today)
            ->groupEnd()
            ->countAllResults() > 0;
    }

    /**
     * Return all active permission codes available to the user.
     *
     * @return list<string>
     */
    public function getPermissionCodes(?object $user = null): array
    {
        $user ??= auth('session')->user();

        if ($user === null) {
            return [];
        }

        if ($this->isSuperAdmin($user)) {
            $rows = $this->db->table('permissions')
                ->select('permission_code')
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->orderBy('module_code', 'ASC')
                ->orderBy('display_order', 'ASC')
                ->get()
                ->getResultArray();
        } else {
            $today = date('Y-m-d');

            $rows = $this->db->table('user_roles ur')
                ->select('p.permission_code')
                ->distinct()
                ->join(
                    'roles r',
                    'r.id = ur.role_id AND r.company_id = ur.company_id',
                    'inner'
                )
                ->join(
                    'role_permissions rp',
                    'rp.role_id = r.id AND rp.company_id = ur.company_id',
                    'inner'
                )
                ->join('permissions p', 'p.id = rp.permission_id', 'inner')
                ->where('ur.company_id', (int) $user->company_id)
                ->where('ur.user_id', (int) $user->id)
                ->where('ur.is_active', 1)
                ->where('ur.deleted_at', null)
                ->where('r.is_active', 1)
                ->where('r.deleted_at', null)
                ->where('rp.is_active', 1)
                ->where('rp.deleted_at', null)
                ->where('p.is_active', 1)
                ->where('p.deleted_at', null)
                ->groupStart()
                    ->where('ur.valid_from', null)
                    ->orWhere('ur.valid_from <=', $today)
                ->groupEnd()
                ->groupStart()
                    ->where('ur.valid_until', null)
                    ->orWhere('ur.valid_until >=', $today)
                ->groupEnd()
                ->orderBy('p.permission_code', 'ASC')
                ->get()
                ->getResultArray();
        }

        return array_values(array_map(
            static fn (array $row): string =>
                (string) $row['permission_code'],
            $rows
        ));
    }

    /**
     * Check whether the user can access a branch.
     */
    public function canAccessBranch(
        int $branchId,
        string $requiredLevel = 'VIEW',
        ?object $user = null
    ): bool {
        $user ??= auth('session')->user();

        if ($user === null || $branchId <= 0) {
            return false;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        $requiredLevel = strtoupper(trim($requiredLevel));

        $levelWeight = [
            'VIEW'    => 1,
            'OPERATE' => 2,
            'MANAGE'  => 3,
        ];

        if (! isset($levelWeight[$requiredLevel])) {
            return false;
        }

        $today = date('Y-m-d');

        $access = $this->db->table('user_branch_access uba')
            ->select('alm.access_level_code')
            ->join('user_branch_access_access_level_masters alm', 'alm.id = uba.access_level_id')
            ->where('uba.company_id', (int) $user->company_id)
            ->where('uba.user_id', (int) $user->id)
            ->where('uba.branch_id', $branchId)
            ->where('uba.is_active', 1)
            ->where('uba.deleted_at', null)
            ->where('alm.is_active', 1)
            ->groupStart()
                ->where('uba.valid_from', null)
                ->orWhere('uba.valid_from <=', $today)
            ->groupEnd()
            ->groupStart()
                ->where('uba.valid_until', null)
                ->orWhere('uba.valid_until >=', $today)
            ->groupEnd()
            ->get()
            ->getRowArray();

        if ($access === null) {
            return false;
        }

        $actualLevel = strtoupper((string) $access['access_level_code']);

        return isset($levelWeight[$actualLevel])
            && $levelWeight[$actualLevel] >= $levelWeight[$requiredLevel];
    }

    /**
     * Return branch IDs accessible to the user.
     *
     * @return list<int>
     */
    public function getAccessibleBranchIds(?object $user = null): array
    {
        $user ??= auth('session')->user();

        if ($user === null) {
            return [];
        }

        if ($this->isSuperAdmin($user)) {
            $rows = $this->db->table('branches')
                ->select('id')
                ->where('company_id', (int) $user->company_id)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->orderBy('id', 'ASC')
                ->get()
                ->getResultArray();
        } else {
            $today = date('Y-m-d');

            $rows = $this->db->table('user_branch_access')
                ->select('branch_id AS id')
                ->where('company_id', (int) $user->company_id)
                ->where('user_id', (int) $user->id)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->groupStart()
                    ->where('valid_from', null)
                    ->orWhere('valid_from <=', $today)
                ->groupEnd()
                ->groupStart()
                    ->where('valid_until', null)
                    ->orWhere('valid_until >=', $today)
                ->groupEnd()
                ->orderBy('branch_id', 'ASC')
                ->get()
                ->getResultArray();
        }

        return array_values(array_map(
            static fn (array $row): int => (int) $row['id'],
            $rows
        ));
    }

    /**
     * Throw an exception when company access is not allowed.
     */
    public function requireCompany(
        int $companyId,
        ?object $user = null
    ): void {
        if (! $this->belongsToCompany($companyId, $user)) {
            throw new RuntimeException('Company access denied.');
        }
    }

    /**
     * Throw an exception when a required permission is missing.
     */
    public function requirePermission(
        string $permissionCode,
        ?object $user = null
    ): void {
        if (! $this->hasPermission($permissionCode, $user)) {
            throw new RuntimeException('Permission denied.');
        }
    }

    /**
     * Throw an exception when branch access is not allowed.
     */
    public function requireBranch(
        int $branchId,
        string $requiredLevel = 'VIEW',
        ?object $user = null
    ): void {
        if (! $this->canAccessBranch(
            $branchId,
            $requiredLevel,
            $user
        )) {
            throw new RuntimeException('Branch access denied.');
        }
    }
}
