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
                if ($parentId !== null && isset($visible[$parentId])) {
                    $visible[$parentId]['children'][] = &$item;
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
}
