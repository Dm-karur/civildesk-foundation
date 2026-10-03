<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

final class NavigationController extends BaseController
{
    public function index(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
        }

        try {
            $authorization = new AuthorizationService();
            $permissions = array_fill_keys(
                $authorization->getPermissionCodes($user),
                true
            );
            $isSuperAdmin = $authorization->isSuperAdmin($user);

            $rows = db_connect()->table('navigation_items AS navigation')
                ->select([
                    'navigation.id',
                    'navigation.parent_id',
                    'navigation.item_code',
                    'navigation.item_name',
                    'item_type.type_code AS item_type',
                    'navigation.route_path',
                    'navigation.icon_key',
                    'navigation.required_permission_code',
                    'navigation.display_order',
                ])
                ->join(
                    'navigation_item_types AS item_type',
                    'item_type.id = navigation.item_type_id '
                    . 'AND item_type.is_active = 1'
                )
                ->join(
                    'company_navigation_items AS company_navigation',
                    'company_navigation.navigation_item_id = navigation.id '
                    . 'AND company_navigation.company_id = ' . (int) $user->company_id,
                    'left',
                    false
                )
                ->where('navigation.is_active', 1)
                ->where('navigation.deleted_at', null)
                ->groupStart()
                    ->where('company_navigation.is_enabled', 1)
                    ->orWhere('company_navigation.id', null)
                ->groupEnd()
                ->orderBy('navigation.display_order', 'ASC')
                ->orderBy('navigation.id', 'ASC')
                ->get()
                ->getResultArray();

            $visible = [];
            foreach ($rows as $row) {
                $required = strtolower(trim((string) ($row['required_permission_code'] ?? '')));
                if (! $isSuperAdmin && $required !== '' && ! isset($permissions[$required])) {
                    continue;
                }

                $row['id'] = (int) $row['id'];
                $row['parent_id'] = $row['parent_id'] !== null ? (int) $row['parent_id'] : null;
                $row['display_order'] = (int) $row['display_order'];
                $row['children'] = [];
                $visible[$row['id']] = $row;
            }

            $tree = [];
            foreach ($visible as $id => &$item) {
                $parentId = $item['parent_id'];
                if ($parentId !== null) {
                    if (isset($visible[$parentId])) {
                        $visible[$parentId]['children'][] = &$item;
                    }
                    // If parent is disabled/not visible, do not promote orphaned child to root
                } else {
                    $tree[] = &$item;
                }
            }
            unset($item);

            $pruneEmptyGroups = static function (array $items) use (&$pruneEmptyGroups): array {
                $result = [];
                foreach ($items as $item) {
                    $item['children'] = $pruneEmptyGroups($item['children'] ?? []);
                    $isEmptyGroup = ($item['item_type'] ?? '') === 'GROUP'
                        && empty($item['route_path'])
                        && $item['children'] === [];
                    if (! $isEmptyGroup) {
                        $result[] = $item;
                    }
                }
                return $result;
            };
            $tree = $pruneEmptyGroups($tree);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Navigation retrieved successfully.',
                'data' => ['navigation' => $tree],
            ]);
        } catch (Throwable $exception) {
            log_message('error', 'Navigation retrieval failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Unable to retrieve navigation.',
            ]);
        }
    }

    public function modules(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
        }

        try {
            $companyId = (int) $user->company_id;
            $db = db_connect();

            $modules = $db->table('navigation_items AS n')
                ->select([
                    'n.id',
                    'n.item_code',
                    'n.item_name',
                    'n.route_path',
                    'n.icon_key',
                    'n.display_order',
                    'COALESCE(cn.is_enabled, 1) AS is_enabled',
                ])
                ->join(
                    'company_navigation_items AS cn',
                    'cn.navigation_item_id = n.id AND cn.company_id = ' . $companyId,
                    'left',
                    false
                )
                ->where('n.parent_id', null)
                ->where('n.is_active', 1)
                ->where('n.deleted_at', null)
                ->orderBy('n.display_order', 'ASC')
                ->orderBy('n.id', 'ASC')
                ->get()
                ->getResultArray();

            $counts = $db->table('navigation_items')
                ->select('parent_id, COUNT(*) AS total_items')
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->groupBy('parent_id')
                ->get()
                ->getResultArray();

            $countsMap = [];
            foreach ($counts as $c) {
                if ($c['parent_id'] !== null) {
                    $countsMap[(int) $c['parent_id']] = (int) $c['total_items'];
                }
            }

            $descriptions = [
                'DASHBOARD' => 'Executive, project, site, and financial overview dashboards.',
                'PROJECTS' => 'Centralized project register, client associations, and documentation.',
                'SITES_LOCATIONS' => 'Physical site directories, GPS coordinates, work zones, and team mapping.',
                'PRIMARY_CLIENTS' => 'Client contacts, company details, billing addresses, and documentation.',
                'BOQ_BUDGET' => 'Bill of Quantities, cost estimation, project budgets, and variation approvals.',
                'PROJECT_PLANNING' => 'Activity schedules, look-ahead planning, and material forecast demands.',
                'LABOUR_ATTENDANCE' => 'Daily labour muster, timesheets, contractor wages, and manpower costing.',
                'PRIMARY_HRM' => 'Employee GPS mobile check-in, leave management, shifts, and payroll.',
                'MATERIALS_INVENTORY' => 'Material catalogue, stock ledgers, receipts, transfers, and consumption.',
                'PROCUREMENT' => 'Purchase requisitions, RFQs, vendor quotations, purchase orders, and goods receipt.',
                'DAILY_SITE_OPERATIONS' => 'Daily Progress Reports (DPR), equipment usage, site photos, and roadblocks.',
                'SUBCONTRACT_MANAGEMENT' => 'Subcontractor master, work orders, measurement sheets, RA bills, and retention.',
                'CLIENT_BILLING' => 'Client contracts, advances, RA billing, payment receipts, and outstanding aging.',
                'FINANCE_COST_CONTROL' => 'Budget vs actual analysis, project expenses, vendor payables, and cash flow.',
                'REPORTS_ANALYTICS' => 'Executive analytics, cost trends, labour deployment, and profitability reports.',
                'COMMUNICATION' => 'Project messaging, client updates, document sharing, and notification logs.',
                'CLIENT_PORTAL' => 'External portal for clients to track progress, approve deliverables, and review bills.',
                'MASTERS' => 'Master data configuration for units, materials, trades, categories, and crews.',
                'ADMINISTRATION' => 'System settings, company & branch management, user roles, and security audit logs.',
            ];

            $result = [];
            foreach ($modules as $mod) {
                $code = strtoupper(trim((string) $mod['item_code']));
                $id = (int) $mod['id'];
                $result[] = [
                    'id' => $id,
                    'item_code' => $code,
                    'item_name' => (string) $mod['item_name'],
                    'icon_key' => (string) ($mod['icon_key'] ?: 'folder'),
                    'route_path' => $mod['route_path'],
                    'display_order' => (int) $mod['display_order'],
                    'sub_items_count' => $countsMap[$id] ?? 0,
                    'description' => $descriptions[$code] ?? 'Module features and operational workflows.',
                    'is_enabled' => (int) $mod['is_enabled'] === 1,
                    'is_locked' => in_array($code, ['ADMINISTRATION', 'DASHBOARD'], true),
                ];
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Modules retrieved successfully.',
                'data' => ['modules' => $result],
            ]);
        } catch (Throwable $exception) {
            log_message('error', 'Modules retrieval failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Unable to retrieve modules.',
            ]);
        }
    }

    public function toggleModule(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
        }

        try {
            $json = $this->request->getJSON(true) ?? $this->request->getPost();
            $moduleId = isset($json['module_id']) ? (int) $json['module_id'] : 0;
            $itemCode = isset($json['item_code']) ? strtoupper(trim((string) $json['item_code'])) : '';
            $isEnabled = isset($json['is_enabled']) ? (bool) $json['is_enabled'] : true;

            $companyId = (int) $user->company_id;
            $db = db_connect();

            $builder = $db->table('navigation_items');
            if ($moduleId > 0) {
                $builder->where('id', $moduleId);
            } elseif ($itemCode !== '') {
                $builder->where('item_code', $itemCode);
            } else {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'message' => 'Module ID or item code is required.',
                ]);
            }

            $module = $builder->get()->getRowArray();
            if (! $module) {
                return $this->response->setStatusCode(404)->setJSON([
                    'success' => false,
                    'message' => 'Module not found.',
                ]);
            }

            $actualCode = strtoupper(trim((string) $module['item_code']));
            if (in_array($actualCode, ['ADMINISTRATION', 'DASHBOARD'], true) && ! $isEnabled) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'message' => 'Core system modules (Administration, Dashboard) cannot be disabled.',
                ]);
            }

            $actualId = (int) $module['id'];
            $statusInt = $isEnabled ? 1 : 0;

            // Collect all descendant ids recursively
            $allIdsToUpdate = [$actualId];
            $findChildren = static function (array $parentIds) use ($db, &$findChildren, &$allIdsToUpdate): void {
                if (empty($parentIds)) {
                    return;
                }
                $children = $db->table('navigation_items')
                    ->select('id')
                    ->whereIn('parent_id', $parentIds)
                    ->get()
                    ->getResultArray();
                $childIds = array_map(static fn($r) => (int) $r['id'], $children);
                if (! empty($childIds)) {
                    foreach ($childIds as $cid) {
                        $allIdsToUpdate[] = $cid;
                    }
                    $findChildren($childIds);
                }
            };
            $findChildren([$actualId]);

            // Upsert records in company_navigation_items
            foreach ($allIdsToUpdate as $navId) {
                $existing = $db->table('company_navigation_items')
                    ->where('company_id', $companyId)
                    ->where('navigation_item_id', $navId)
                    ->get()
                    ->getRowArray();

                if ($existing) {
                    $db->table('company_navigation_items')
                        ->where('id', (int) $existing['id'])
                        ->update([
                            'is_enabled' => $statusInt,
                            'updated_by' => (int) $user->id,
                            'updated_at' => date('Y-m-d H:i:s'),
                        ]);
                } else {
                    $db->table('company_navigation_items')->insert([
                        'company_id' => $companyId,
                        'navigation_item_id' => $navId,
                        'is_enabled' => $statusInt,
                        'created_by' => (int) $user->id,
                        'updated_by' => (int) $user->id,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                }
            }

            // Record audit log
            try {
                $db->table('activity_logs')->insert([
                    'company_id' => $companyId,
                    'user_id' => (int) $user->id,
                    'module_code' => 'ADMINISTRATION',
                    'action_code' => $isEnabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
                    'description' => sprintf(
                        'Module %s (%s) was %s by administrator.',
                        $module['item_name'],
                        $actualCode,
                        $isEnabled ? 'enabled' : 'disabled'
                    ),
                    'occurred_at' => date('Y-m-d H:i:s'),
                ]);
            } catch (Throwable $ignore) {
                // Table differences handled safely
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => sprintf(
                    'Module "%s" has been %s.',
                    $module['item_name'],
                    $isEnabled ? 'enabled' : 'disabled'
                ),
                'data' => [
                    'module_id' => $actualId,
                    'item_code' => $actualCode,
                    'is_enabled' => $isEnabled,
                ],
            ]);
        } catch (Throwable $exception) {
            log_message('error', 'Module toggle failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Unable to update module status.',
            ]);
        }
    }

    public function bulkToggle(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
        }

        try {
            $json = $this->request->getJSON(true) ?? $this->request->getPost();
            $modules = $json['modules'] ?? [];
            if (! is_array($modules) || empty($modules)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'message' => 'Modules list is required.',
                ]);
            }

            $companyId = (int) $user->company_id;
            $db = db_connect();

            foreach ($modules as $mod) {
                $code = strtoupper(trim((string) ($mod['item_code'] ?? '')));
                $id = (int) ($mod['id'] ?? 0);
                $isEnabled = (bool) ($mod['is_enabled'] ?? true);

                if (in_array($code, ['ADMINISTRATION', 'DASHBOARD'], true) && ! $isEnabled) {
                    continue;
                }

                $query = $db->table('navigation_items');
                if ($id > 0) {
                    $query->where('id', $id);
                } elseif ($code !== '') {
                    $query->where('item_code', $code);
                } else {
                    continue;
                }
                $item = $query->get()->getRowArray();
                if (! $item) continue;

                $itemId = (int) $item['id'];
                $statusInt = $isEnabled ? 1 : 0;

                // Update item and children
                $childIds = [$itemId];
                $cRows = $db->table('navigation_items')->select('id')->where('parent_id', $itemId)->get()->getResultArray();
                foreach ($cRows as $cr) $childIds[] = (int) $cr['id'];

                foreach ($childIds as $navId) {
                    $existing = $db->table('company_navigation_items')
                        ->where('company_id', $companyId)
                        ->where('navigation_item_id', $navId)
                        ->get()
                        ->getRowArray();

                    if ($existing) {
                        $db->table('company_navigation_items')
                            ->where('id', (int) $existing['id'])
                            ->update([
                                'is_enabled' => $statusInt,
                                'updated_by' => (int) $user->id,
                                'updated_at' => date('Y-m-d H:i:s'),
                            ]);
                    } else {
                        $db->table('company_navigation_items')->insert([
                            'company_id' => $companyId,
                            'navigation_item_id' => $navId,
                            'is_enabled' => $statusInt,
                            'created_by' => (int) $user->id,
                            'updated_by' => (int) $user->id,
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s'),
                        ]);
                    }
                }
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Module configuration updated successfully.',
            ]);
        } catch (Throwable $exception) {
            log_message('error', 'Bulk module toggle failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Unable to bulk update modules.',
            ]);
        }
    }
}
