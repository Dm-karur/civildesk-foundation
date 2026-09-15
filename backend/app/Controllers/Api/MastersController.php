<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class MastersController extends BaseController
{
    /**
     * Return the active master values required across the system.
     * Fully resilient: handles missing tables, null session user, and secondary joins gracefully.
     */
    public function index(): ResponseInterface
    {
        try {
            $db = db_connect();
            $user = auth('session')->user();
            $companyId = $user ? (int) $user->company_id : 1;

            $safeQuery = static function (string $table, callable $callback, array $fallback = []) use ($db): array {
                if (! $db->tableExists($table)) {
                    return $fallback;
                }
                try {
                    return $callback($db->table($table)) ?? $fallback;
                } catch (Throwable) {
                    return $fallback;
                }
            };

            $data = [
                'company_types' => $safeQuery('company_types', fn ($t) =>
                    $t->select('id, type_code AS code, type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'subscription_statuses' => $safeQuery('subscription_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'branch_types' => $safeQuery('branch_types', fn ($t) =>
                    $t->select('id, type_code AS code, type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'user_types' => $safeQuery('users_user_type_masters', fn ($t) =>
                    $t->select('id, user_type_code AS code, user_type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'user_statuses' => $safeQuery('user_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name, is_login_allowed')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'access_levels' => $safeQuery('user_branch_access_access_level_masters', fn ($t) =>
                    $t->select('id, access_level_code AS code, access_level_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'role_scopes' => $safeQuery('role_scopes', fn ($t) =>
                    $t->select('id, scope_code AS code, scope_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'permission_action_types' => $safeQuery('permissions_action_type_masters', fn ($t) =>
                    $t->select('id, action_type_code AS code, action_type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'gst_registration_types' => $safeQuery('gst_registration_types', fn ($t) =>
                    $t->select('id, type_code AS code, type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'client_sources' => $safeQuery('client_sources', fn ($t) =>
                    $t->select('id, source_code AS code, source_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'client_statuses' => $safeQuery('client_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'communication_modes' => $safeQuery('communication_modes', fn ($t) =>
                    $t->select('id, mode_code AS code, mode_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'client_document_types' => $safeQuery('document_types', fn ($t) =>
                    $t->select([
                        'document_types.id',
                        'document_types.document_type_code AS code',
                        'document_types.document_type_name AS name',
                        'document_types.allowed_extensions',
                        'document_types.maximum_file_size_mb',
                        'document_types.expiry_tracking',
                        'document_types.is_mandatory',
                    ])
                    ->join('document_types_entity_scope_masters', 'document_types_entity_scope_masters.id = document_types.entity_scope_id')
                    ->where('document_types.company_id', $companyId)
                    ->where('document_types.is_active', 1)
                    ->where('document_types.deleted_at', null)
                    ->where('document_types_entity_scope_masters.entity_scope_code', 'CLIENT')
                    ->where('document_types_entity_scope_masters.is_active', 1)
                    ->orderBy('document_types.display_order', 'ASC')
                    ->get()->getResultArray()
                ),
                'client_document_statuses' => $safeQuery('client_document_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_document_types' => $safeQuery('document_types', fn ($t) =>
                    $t->select([
                        'document_types.id',
                        'document_types.document_type_code AS code',
                        'document_types.document_type_name AS name',
                        'document_types.allowed_extensions',
                        'document_types.maximum_file_size_mb',
                        'document_types.expiry_tracking',
                        'document_types.is_mandatory',
                    ])
                    ->join('document_types_entity_scope_masters', 'document_types_entity_scope_masters.id = document_types.entity_scope_id')
                    ->where('document_types.company_id', $companyId)
                    ->where('document_types.is_active', 1)
                    ->where('document_types.deleted_at', null)
                    ->where('document_types_entity_scope_masters.entity_scope_code', 'PROJECT')
                    ->where('document_types_entity_scope_masters.is_active', 1)
                    ->orderBy('document_types.display_order', 'ASC')
                    ->get()->getResultArray()
                ),
                'project_document_statuses' => $safeQuery('project_documents_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'billing_methods' => $safeQuery('billing_methods', fn ($t) =>
                    $t->select('id, method_code AS code, method_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_types' => $safeQuery('project_types', fn ($t) =>
                    $t->select([
                        'project_types.id',
                        'project_types.project_type_code AS code',
                        'project_types.project_type_name AS name',
                        'project_types.billing_method_id',
                        'billing_methods.method_code AS billing_method_code',
                        'billing_methods.method_name AS billing_method_name',
                        'project_types.default_duration_days',
                    ])
                    ->join('billing_methods', 'billing_methods.id = project_types.billing_method_id', 'left')
                    ->where('project_types.company_id', $companyId)
                    ->where('project_types.is_active', 1)
                    ->where('project_types.deleted_at', null)
                    ->orderBy('project_types.display_order', 'ASC')
                    ->get()->getResultArray()
                ),
                'project_statuses' => $safeQuery('project_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name, description, is_final')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_milestone_statuses' => $safeQuery('project_milestone_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray(),
                    [
                        ['id' => 1, 'code' => 'PLANNED', 'name' => 'Planned'],
                        ['id' => 2, 'code' => 'IN_PROGRESS', 'name' => 'In Progress'],
                        ['id' => 3, 'code' => 'ACHIEVED', 'name' => 'Achieved'],
                        ['id' => 4, 'code' => 'DELAYED', 'name' => 'Delayed'],
                        ['id' => 5, 'code' => 'CANCELLED', 'name' => 'Cancelled'],
                    ]
                ),
                'attendance_exception_categories' => $safeQuery('labour_attendance_exception_category_masters', fn ($t) =>
                    $t->select('id, category_code AS code, category_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray(),
                    [
                        ['id' => 1, 'code' => 'LATE_ENTRY', 'name' => 'Late Entry'],
                        ['id' => 2, 'code' => 'EARLY_EXIT', 'name' => 'Early Exit'],
                        ['id' => 3, 'code' => 'MISSED_PUNCH', 'name' => 'Missed Biometric Punch'],
                        ['id' => 4, 'code' => 'OVERTIME_DISPUTE', 'name' => 'Overtime Discrepancy'],
                        ['id' => 5, 'code' => 'UNAUTHORIZED_ABSENCE', 'name' => 'Unauthorized Absence'],
                    ]
                ),
                'attendance_exception_statuses' => $safeQuery('labour_attendance_exception_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray(),
                    [
                        ['id' => 1, 'code' => 'PENDING', 'name' => 'Pending Review'],
                        ['id' => 2, 'code' => 'APPROVED', 'name' => 'Approved'],
                        ['id' => 3, 'code' => 'REJECTED', 'name' => 'Rejected'],
                    ]
                ),
                'project_boq_statuses' => $safeQuery('project_boqs_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_budget_statuses' => $safeQuery('project_budgets_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_budget_cost_types' => $safeQuery('project_budget_lines_cost_type_masters', fn ($t) =>
                    $t->select('id, cost_type_code AS code, cost_type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'site_types' => $safeQuery('site_types', fn ($t) =>
                    $t->select('id, type_code AS code, type_name AS name, description')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'site_statuses' => $safeQuery('site_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name, description, is_final')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'site_zone_types' => $safeQuery('site_work_zones_zone_type_masters', fn ($t) =>
                    $t->select('id, zone_type_code AS code, zone_type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'site_zone_statuses' => $safeQuery('site_work_zones_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'work_location_types' => $safeQuery('work_location_types', fn ($t) =>
                    $t->select('id, type_code AS code, type_name AS name, description')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'work_location_statuses' => $safeQuery('work_location_statuses', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name, description')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'project_team_roles' => $safeQuery('project_team_roles', fn ($t) =>
                    $t->select('id, role_code AS code, role_name AS name, description')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'priorities' => $safeQuery('priorities', fn ($t) =>
                    $t->select('id, priority_code AS code, priority_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'financial_years' => $safeQuery('financial_years', fn ($t) =>
                    $t->select('id, year_code AS code, year_name AS name, start_date, end_date, status_id, is_current')
                    ->where('company_id', $companyId)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->orderBy('start_date', 'DESC')->get()->getResultArray()
                ),
                'financial_year_statuses' => $safeQuery('financial_years_status_masters', fn ($t) =>
                    $t->select('id, status_code AS code, status_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'unit_types' => $safeQuery('units_of_measurement_unit_type_masters', fn ($t) =>
                    $t->select('id, unit_type_code AS code, unit_type_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'units_of_measurement' => $safeQuery('units_of_measurement', fn ($t) =>
                    $t->select('id, unit_code AS code, unit_name AS name, unit_symbol, unit_type_id, decimal_places')
                    ->where('company_id', $companyId)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->orderBy('display_order', 'ASC')
                    ->orderBy('unit_name', 'ASC')->get()->getResultArray()
                ),
                'work_category_stages' => $safeQuery('work_categories_work_stage_masters', fn ($t) =>
                    $t->select('id, work_stage_code AS code, work_stage_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'work_category_progress_methods' => $safeQuery('work_categories_progress_method_masters', fn ($t) =>
                    $t->select('id, progress_method_code AS code, progress_method_name AS name')->where('is_active', 1)->orderBy('sort_order', 'ASC')->get()->getResultArray()
                ),
                'work_categories' => $safeQuery('work_categories', fn ($t) =>
                    $t->select('id, category_code AS code, category_name AS name, parent_id, work_stage_id, progress_method_id')
                    ->where('company_id', $companyId)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->orderBy('display_order', 'ASC')
                    ->orderBy('category_name', 'ASC')->get()->getResultArray()
                ),
                'project_clients' => $safeQuery('clients', fn ($t) =>
                    $t->select('id, client_code AS code, client_name AS name, branch_id')
                    ->where('company_id', $companyId)
                    ->where('deleted_at', null)
                    ->orderBy('client_name', 'ASC')->get()->getResultArray()
                ),
                'project_users' => $safeQuery('users', fn ($t) =>
                    $t->select('id, employee_code AS code, CONCAT(first_name, " ", COALESCE(last_name, "")) AS name, default_branch_id')
                    ->where('company_id', $companyId)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->orderBy('first_name', 'ASC')->get()->getResultArray()
                ),
            ];

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Masters retrieved successfully.',
                'data'    => $data,
            ]);
        } catch (Throwable $exception) {
            log_message('error', 'Master retrieval failed: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
                ->setJSON([
                    'success' => false,
                    'message' => 'Unable to retrieve masters: ' . $exception->getMessage(),
                ]);
        }
    }
}
