<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectSiteModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectSitesController extends BaseController
{
    private ProjectSiteModel $sites;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->sites = new ProjectSiteModel();
        $this->authorization = new AuthorizationService();
    }

    /**
     * Return all master data required by the Site Registration and Edit form:
     * Clients, Site Types, Site Statuses, and Team Users (Engineers, Managers, Supervisors).
     * Fetches 100% real data directly from the live database.
     */
    public function formMasters(): ResponseInterface
    {
        try {
            $db = db_connect();
            $user = auth('session')->user();
            $companyId = $user ? (int) $user->company_id : 1;

            $clients = $db->table('clients')
                ->select('id, client_code, client_name, legal_name, phone, email')
                ->where('company_id', $companyId)
                ->where('deleted_at', null)
                ->orderBy('client_name', 'ASC')
                ->get()->getResultArray();

            $siteTypes = $db->table('site_types')
                ->select('id, type_code AS code, type_name AS name, description')
                ->where('is_active', 1)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            $siteStatuses = $db->table('site_statuses')
                ->select('id, status_code AS code, status_name AS name, description, is_final')
                ->where('is_active', 1)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            $users = $db->table('users')
                ->select([
                    'users.id',
                    'users.first_name',
                    'users.last_name',
                    'users.username',
                    'users.email',
                    'users.phone',
                    'users.designation',
                    'users.user_type_id',
                    'ut.user_type_name',
                    'ut.user_type_code',
                ])
                ->join('users_user_type_masters ut', 'ut.id = users.user_type_id', 'left')
                ->where('users.company_id', $companyId)
                ->where('users.is_active', 1)
                ->where('users.deleted_at', null)
                ->orderBy('users.first_name', 'ASC')
                ->orderBy('users.last_name', 'ASC')
                ->get()->getResultArray();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site form masters retrieved successfully.',
                'data'    => [
                    'clients'       => $clients,
                    'site_types'    => $siteTypes,
                    'site_statuses' => $siteStatuses,
                    'users'         => $users,
                ],
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Failed to load site form masters: ' . $e->getMessage(),
            ]);
        }
    }

    public function siteTypes(): ResponseInterface
    {
        try {
            $types = db_connect()->table('site_types')
                ->select('id, type_code AS code, type_name AS name, description')
                ->where('is_active', 1)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            return $this->response->setJSON([
                'success' => true,
                'data'    => ['site_types' => $types],
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function siteStatuses(): ResponseInterface
    {
        try {
            $statuses = db_connect()->table('site_statuses')
                ->select('id, status_code AS code, status_name AS name, description, is_final')
                ->where('is_active', 1)
                ->orderBy('sort_order', 'ASC')
                ->get()->getResultArray();

            return $this->response->setJSON([
                'success' => true,
                'data'    => ['site_statuses' => $statuses],
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Returns all geospatial locations for the company:
     * - Main Branch (Head Office)
     * - Normal Branches
     * - Construction Sites
     * Includes coordinates, radius, status, engineer, client, and operational stats.
     */
    public function mapLocations(): ResponseInterface
    {
        try {
            $db = db_connect();
            $user = auth('session')->user();
            $companyId = $user ? (int) $user->company_id : 1;

            $locations = [];

            // 1. Fetch Branches (Main Branch & Normal Branches)
            if ($db->tableExists('branches')) {
                $branchBuilder = $db->table('branches')
                    ->select('branches.*, bt.type_name AS branch_type_name')
                    ->join('branch_types bt', 'bt.id = branches.branch_type_id', 'left')
                    ->where('branches.company_id', $companyId)
                    ->where('branches.is_active', 1)
                    ->where('branches.deleted_at', null);

                $branchRows = $branchBuilder->get()->getResultArray();
                foreach ($branchRows as $b) {
                    if (empty($b['latitude']) || empty($b['longitude'])) {
                        continue;
                    }
                    $isMain = (int) ($b['is_head_office'] ?? 0) === 1;
                    $locations[] = [
                        'id'               => 'branch_' . $b['id'],
                        'entity_id'        => (int) $b['id'],
                        'location_type'    => $isMain ? 'MAIN_BRANCH' : 'BRANCH',
                        'type_label'       => $isMain ? 'Main Branch' : 'Branch',
                        'code'             => $b['branch_code'],
                        'name'             => $b['branch_name'],
                        'branch_type'      => $b['branch_type_name'] ?? ($isMain ? 'Head Office' : 'Normal Branch'),
                        'address'          => trim(($b['address_line1'] ?? '') . ', ' . ($b['city'] ?? '') . ' ' . ($b['state_name'] ?? '')),
                        'city'             => $b['city'] ?? '',
                        'state'            => $b['state_name'] ?? '',
                        'phone'            => $b['phone'] ?? '',
                        'latitude'         => (float) $b['latitude'],
                        'longitude'        => (float) $b['longitude'],
                        'radius'           => !empty($b['geofence_radius_m']) ? (float) $b['geofence_radius_m'] : null,
                        'status'           => 'ACTIVE',
                        'status_name'      => 'Active',
                        'is_head_office'   => $isMain,
                        'color'            => $isMain ? '#10B981' : '#F59E0B',
                    ];
                }
            }

            // 2. Fetch Construction Sites
            if ($db->tableExists('project_sites')) {
                $siteBuilder = $db->table('project_sites')
                    ->select([
                        'project_sites.*',
                        'st.type_name AS site_type_name',
                        'ss.status_code AS site_status_code',
                        'ss.status_name AS site_status_name',
                        'projects.client_id',
                        'clients.client_name',
                        'clients.client_code',
                        'u.first_name AS eng_first_name',
                        'u.last_name AS eng_last_name',
                        'u.phone AS eng_phone',
                    ])
                    ->join('site_types st', 'st.id = project_sites.site_type_id', 'left')
                    ->join('site_statuses ss', 'ss.id = project_sites.site_status_id', 'left')
                    ->join('projects', 'projects.id = project_sites.project_id', 'left')
                    ->join('clients', 'clients.id = projects.client_id', 'left')
                    ->join('users u', 'u.id = project_sites.site_engineer_id', 'left')
                    ->where('project_sites.company_id', $companyId)
                    ->where('project_sites.deleted_at', null);

                $siteRows = $siteBuilder->get()->getResultArray();
                $today = date('Y-m-d');

                foreach ($siteRows as $s) {
                    if (empty($s['latitude']) || empty($s['longitude'])) {
                        continue;
                    }

                    $todayAttendance = 0;
                    if ($db->tableExists('labour_attendance_batches')) {
                        $batchRow = $db->table('labour_attendance_batches')
                            ->selectSum('present_workers', 'total_present')
                            ->where('site_id', $s['id'])
                            ->where('attendance_date', $today)
                            ->get()->getRowArray();
                        $todayAttendance = (int) ($batchRow['total_present'] ?? 0);
                    }

                    $engName = trim(($s['eng_first_name'] ?? '') . ' ' . ($s['eng_last_name'] ?? ''));
                    if ($engName === '') {
                        $engName = $s['contact_name'] ?? 'Unassigned';
                    }

                    $locations[] = [
                        'id'                  => 'site_' . $s['id'],
                        'entity_id'           => (int) $s['id'],
                        'site_id'             => (int) $s['id'],
                        'site_code'           => $s['site_code'],
                        'site_name'           => $s['site_name'],
                        'location_type'       => 'SITE',
                        'type_label'          => 'Site',
                        'code'                => $s['site_code'],
                        'name'                => $s['site_name'],
                        'client_id'           => $s['client_id'] ? (int) $s['client_id'] : null,
                        'client'              => $s['client_name'] ?? 'Client Direct',
                        'client_name'         => $s['client_name'] ?? 'Client Direct',
                        'client_code'         => $s['client_code'] ?? '',
                        'site_engineer_id'    => $s['site_engineer_id'] ? (int) $s['site_engineer_id'] : null,
                        'site_engineer'       => $engName,
                        'site_engineer_name'  => $engName,
                        'site_engineer_phone' => $s['eng_phone'] ?? $s['contact_phone'] ?? '',
                        'site_type'           => $s['site_type_name'] ?? 'Construction Site',
                        'address'             => trim(($s['address_line1'] ?? '') . ', ' . ($s['city'] ?? '') . ' ' . ($s['state_name'] ?? '')),
                        'city'                => $s['city'] ?? '',
                        'district'            => $s['district'] ?? '',
                        'state'               => $s['state_name'] ?? '',
                        'postal_code'         => $s['postal_code'] ?? '',
                        'latitude'            => (float) $s['latitude'],
                        'longitude'           => (float) $s['longitude'],
                        'radius'              => !empty($s['geofence_radius_m']) ? (float) $s['geofence_radius_m'] : 150.0,
                        'status'              => $s['site_status_code'] ?? 'ACTIVE',
                        'status_name'         => $s['site_status_name'] ?? 'Active',
                        'progress_percentage' => (float) ($s['progress_percentage'] ?? 0),
                        'contract_value'      => (float) ($s['contract_value'] ?? 0),
                        'today_attendance'    => $todayAttendance,
                        'color'               => '#2563EB',
                    ];
                }
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Map locations retrieved successfully.',
                'data'    => [
                    'locations' => $locations,
                    'summary'   => [
                        'total'        => count($locations),
                        'main_branch'  => count(array_filter($locations, fn ($l) => $l['location_type'] === 'MAIN_BRANCH')),
                        'branches'     => count(array_filter($locations, fn ($l) => $l['location_type'] === 'BRANCH')),
                        'sites'        => count(array_filter($locations, fn ($l) => $l['location_type'] === 'SITE')),
                    ],
                ],
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'message' => 'Failed to load map locations: ' . $e->getMessage(),
            ]);
        }
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->baseQuery()
                ->where('project_sites.company_id', (int) $user->company_id);

            $projectId = (int) ($this->request->getGet('project_id') ?? 0);
            if ($projectId > 0) {
                $project = $this->getAccessibleProject($projectId, $user);
                if ($project === null) {
                    return $this->forbidden('You cannot access the selected project.');
                }
                $builder->where('project_sites.project_id', $projectId);
            } elseif (! $this->authorization->isSuperAdmin($user)) {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) {
                    return $this->successList([]);
                }
                $builder->groupStart()
                    ->whereIn('projects.branch_id', $branchIds)
                    ->orWhere('projects.branch_id', null)
                    ->groupEnd();
            }

            $clientId = (int) ($this->request->getGet('client_id') ?? 0);
            if ($clientId > 0) {
                $builder->where('projects.client_id', $clientId);
            }

            foreach (['site_type_id', 'site_status_id', 'site_engineer_id', 'supervisor_id'] as $filter) {
                $value = (int) ($this->request->getGet($filter) ?? 0);
                if ($value > 0) {
                    $builder->where('project_sites.' . $filter, $value);
                }
            }

            $isPrimary = $this->request->getGet('is_primary');
            if ($isPrimary !== null && in_array((string) $isPrimary, ['0', '1'], true)) {
                $builder->where('project_sites.is_primary', (int) $isPrimary);
            }

            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') {
                $builder->groupStart()
                    ->like('project_sites.site_code', $search)
                    ->orLike('project_sites.site_name', $search)
                    ->orLike('clients.client_name', $search)
                    ->orLike('project_sites.city', $search)
                    ->orLike('project_sites.district', $search)
                    ->orLike('projects.project_code', $search)
                    ->orLike('projects.project_name', $search)
                    ->groupEnd();
            }

            return $this->successList(
                $builder->orderBy('projects.project_name', 'ASC')
                    ->orderBy('project_sites.is_primary', 'DESC')
                    ->orderBy('project_sites.site_name', 'ASC')
                    ->findAll()
            );
        } catch (Throwable $exception) {
            return $this->serverError('Site list retrieval failed.', $exception);
        }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $site = $this->baseQuery()
                ->where('project_sites.company_id', (int) $user->company_id)
                ->find($id);

            if ($site === null || ! $this->canAccessSite($site, $user)) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site retrieved successfully.',
                'data' => ['site' => $site],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Site retrieval failed.', $exception);
        }
    }

    public function dashboard(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $site = $this->baseQuery()
                ->where('project_sites.company_id', (int) $user->company_id)
                ->find($id);

            if ($site === null || ! $this->canAccessSite($site, $user)) {
                return $this->notFound();
            }

            $db = db_connect();
            $today = date('Y-m-d');
            $projectId = (int) $site['project_id'];

            // 1. Today's Labour & Attendance
            $todayBatch = $db->table('labour_attendance_batches')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->where('attendance_date', $today)
                ->get()->getRowArray();

            $todayLabourCount = $todayBatch ? (int) ($todayBatch['present_workers'] ?? 0) : 0;
            $todayTotalWorkers = $todayBatch ? (int) ($todayBatch['total_workers'] ?? 0) : 0;
            $todayAttendancePct = $todayTotalWorkers > 0 ? round(($todayLabourCount / $todayTotalWorkers) * 100) : 0;

            // 2. Today's DPR
            $todayDpr = $db->table('daily_site_reports')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->where('report_date', $today)
                ->get()->getRowArray();

            $todayProgressPct = $todayDpr ? (float) ($todayDpr['actual_progress_percentage'] ?? 0) : (float) ($site['progress_percentage'] ?? 0);

            // 3. Materials received & consumed today
            $materialsReceivedToday = 0.0;
            $materialsConsumedToday = 0.0;
            if ($db->tableExists('daily_material_consumption')) {
                $matRec = $db->table('daily_material_consumption')
                    ->selectSum('received_quantity')
                    ->where('company_id', (int) $user->company_id)
                    ->where('site_id', $id)
                    ->where('consumption_date', $today)
                    ->get()->getRow();
                $materialsReceivedToday = (float) ($matRec->received_quantity ?? 0);

                $matCons = $db->table('daily_material_consumption')
                    ->selectSum('consumed_quantity')
                    ->where('company_id', (int) $user->company_id)
                    ->where('site_id', $id)
                    ->where('consumption_date', $today)
                    ->get()->getRow();
                $materialsConsumedToday = (float) ($matCons->consumed_quantity ?? 0);
            }

            // 4. Today's Expenses & Total Expenses
            $todayExpenses = (float) ($db->table('expense_bills')
                ->selectSum('gross_amount')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->where('bill_date', $today)
                ->get()->getRow()->gross_amount ?? 0);

            $totalExpenses = (float) ($db->table('expense_bills')
                ->selectSum('gross_amount')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->get()->getRow()->gross_amount ?? 0);

            // 5. Open Issues
            $openIssuesCount = 0;
            if ($db->tableExists('daily_site_issues')) {
                $openIssuesCount = $db->table('daily_site_issues')
                    ->join('daily_site_issues_status_masters st', 'st.id = daily_site_issues.status_id', 'left')
                    ->where('daily_site_issues.company_id', (int) $user->company_id)
                    ->where('daily_site_issues.site_id', $id)
                    ->groupStart()
                        ->whereNotIn('st.status_code', ['RESOLVED', 'CLOSED'])
                        ->orWhere('st.id', null)
                    ->groupEnd()
                    ->countAllResults();
            }

            // 6. Overall BOQ Budget & Actual Cost
            $boqTotal = (float) ($db->table('project_boqs')
                ->selectSum('total_amount')
                ->where('company_id', (int) $user->company_id)
                ->where('project_id', $projectId)
                ->get()->getRow()->total_amount ?? ($site['contract_value'] ?? 0));

            $actualCost = $totalExpenses;

            // 7. Recent 5 DPRs
            $recentDprs = $db->table('daily_site_reports')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->orderBy('report_date', 'DESC')
                ->limit(5)
                ->get()->getResultArray();

            // 8. Recent 6 Photos
            $recentPhotos = $db->table('daily_site_photos')
                ->where('company_id', (int) $user->company_id)
                ->where('site_id', $id)
                ->orderBy('id', 'DESC')
                ->limit(6)
                ->get()->getResultArray();

            // 9. Recent 5 Issues
            $recentIssues = [];
            if ($db->tableExists('daily_site_issues')) {
                $recentIssues = $db->table('daily_site_issues')
                    ->select('daily_site_issues.*, st.status_name, pr.priority_name')
                    ->join('daily_site_issues_status_masters st', 'st.id = daily_site_issues.status_id', 'left')
                    ->join('daily_site_issues_priority_masters pr', 'pr.id = daily_site_issues.priority_id', 'left')
                    ->where('daily_site_issues.company_id', (int) $user->company_id)
                    ->where('daily_site_issues.site_id', $id)
                    ->orderBy('daily_site_issues.id', 'DESC')
                    ->limit(5)
                    ->get()->getResultArray();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site dashboard retrieved successfully.',
                'data' => [
                    'site' => $site,
                    'kpis' => [
                        'today_labour' => $todayLabourCount,
                        'today_attendance_percentage' => $todayAttendancePct,
                        'today_work_progress' => $todayProgressPct,
                        'materials_received_today' => $materialsReceivedToday,
                        'materials_consumed_today' => $materialsConsumedToday,
                        'today_expenses' => $todayExpenses,
                        'open_issues' => $openIssuesCount,
                        'overall_progress_percentage' => (float) ($site['progress_percentage'] ?? 0),
                        'boq_budget' => $boqTotal,
                        'actual_cost' => $actualCost,
                        'remaining_budget' => max(0, $boqTotal - $actualCost),
                        'labour_cost' => 0,
                        'material_cost' => 0,
                        'expense_cost' => $totalExpenses,
                    ],
                    'recent_dprs' => $recentDprs,
                    'recent_photos' => $recentPhotos,
                    'recent_issues' => $recentIssues,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Site dashboard retrieval failed.', $exception);
        }
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $data = $this->writableData($input, true);
        $data['company_id'] = (int) $user->company_id;
        $data['created_by'] = (int) $user->id;
        $data['updated_by'] = (int) $user->id;
        $data += [
            'country_code' => 'IN',
            'latitude' => null,
            'longitude' => null,
            'geofence_radius_m' => null,
            'site_engineer_id' => null,
            'supervisor_id' => null,
            'planned_start_date' => null,
            'actual_start_date' => null,
            'expected_end_date' => null,
            'actual_end_date' => null,
            'progress_percentage' => 0,
            'is_primary' => 0,
        ];

        // Transparent auto-provisioning of underlying project if project_id is omitted
        if (empty($data['project_id']) || (int) $data['project_id'] <= 0) {
            $clientId = (int) ($input['client_id'] ?? 0);
            if ($clientId <= 0) {
                $firstClient = db_connect()->table('clients')
                    ->where('company_id', (int) $user->company_id)
                    ->where('deleted_at', null)
                    ->orderBy('id', 'ASC')->get()->getRowArray();
                $clientId = $firstClient ? (int) $firstClient['id'] : 1;
            }

            $siteCode = trim((string) ($data['site_code'] ?? 'SITE-' . time()));
            $siteName = trim((string) ($data['site_name'] ?? 'Site Operational Project'));
            $contractVal = (float) ($input['contract_value'] ?? 0);

            $projData = [
                'company_id' => (int) $user->company_id,
                'branch_id' => !empty($input['branch_id']) ? (int) $input['branch_id'] : null,
                'client_id' => $clientId,
                'project_type_id' => 1,
                'project_code' => $siteCode,
                'project_name' => $siteName,
                'description' => $data['notes'] ?? 'Auto-managed operational project for ' . $siteName,
                'planned_start_date' => $data['planned_start_date'] ?? null,
                'actual_start_date' => $data['actual_start_date'] ?? null,
                'expected_completion_date' => $data['expected_end_date'] ?? null,
                'actual_completion_date' => $data['actual_end_date'] ?? null,
                'contract_value' => $contractVal,
                'approved_budget' => $contractVal,
                'billing_method_id' => 1,
                'currency_code' => 'INR',
                'project_manager_id' => !empty($input['project_manager_id']) ? (int) $input['project_manager_id'] : (!empty($data['supervisor_id']) ? (int) $data['supervisor_id'] : null),
                'site_engineer_id' => !empty($data['site_engineer_id']) ? (int) $data['site_engineer_id'] : null,
                'priority_id' => 2,
                'project_status_id' => 1,
                'progress_percentage' => (float) ($data['progress_percentage'] ?? 0),
                'created_by' => (int) $user->id,
                'updated_by' => (int) $user->id,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            db_connect()->table('projects')->insert($projData);
            $data['project_id'] = (int) db_connect()->insertID();
        }

        $validation = $this->validateReferences($data, $user);
        if ($validation !== null) {
            return $validation;
        }

        $dateErrors = $this->validateDates($data);
        if ($dateErrors !== []) {
            return $this->invalid($dateErrors);
        }

        if ($this->duplicateSiteCodeExists(
            (int) $data['project_id'],
            (string) $data['site_code']
        )) {
            return $this->invalid([
                'site_code' => 'The site code already exists for the selected project.',
            ]);
        }

        $db = db_connect();
        try {
            $db->transBegin();

            if ((int) $data['is_primary'] === 1) {
                $this->clearOtherPrimarySites((int) $data['project_id'], null, (int) $user->id);
            }

            if (! $this->sites->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->sites->errors());
            }

            $id = (int) $this->sites->getInsertID();
            $db->table('site_status_logs')->insert([
                'company_id' => (int) $user->company_id,
                'project_id' => (int) $data['project_id'],
                'site_id' => $id,
                'from_status_id' => null,
                'to_status_id' => (int) $data['site_status_id'],
                'change_reason' => 'Site created.',
                'changed_by' => (int) $user->id,
            ]);

            if ($db->transStatus() === false) {
                throw new DatabaseException('Unable to create site and initial status history.');
            }

            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Site created successfully.',
                    'data' => ['site' => $this->baseQuery()->find($id)],
                ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Site creation failed.', $exception);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $existing = $this->sites
            ->where('company_id', (int) $user->company_id)
            ->find($id);
        if ($existing === null || ! $this->canAccessSite($existing, $user, true)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input, false);
        unset($data['company_id'], $data['created_by'], $data['project_id'], $data['site_status_id']);
        $data['updated_by'] = (int) $user->id;
        $merged = array_merge($existing, $data);

        $validation = $this->validateReferences($merged, $user);
        if ($validation !== null) {
            return $validation;
        }

        $dateErrors = $this->validateDates($merged);
        if ($dateErrors !== []) {
            return $this->invalid($dateErrors);
        }

        if (array_key_exists('site_code', $data) && $this->duplicateSiteCodeExists(
            (int) $existing['project_id'],
            (string) $data['site_code'],
            $id
        )) {
            return $this->invalid([
                'site_code' => 'The site code already exists for the selected project.',
            ]);
        }

        $db = db_connect();
        try {
            $db->transBegin();

            if ((int) ($merged['is_primary'] ?? 0) === 1) {
                $this->clearOtherPrimarySites((int) $existing['project_id'], $id, (int) $user->id);
            }

            if (! $this->sites->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->sites->errors());
            }

            if (!empty($existing['project_id'])) {
                $projUpdates = [];
                if (isset($input['contract_value'])) $projUpdates['contract_value'] = (float) $input['contract_value'];
                if (!empty($input['client_id'])) $projUpdates['client_id'] = (int) $input['client_id'];
                if (!empty($input['project_manager_id'])) $projUpdates['project_manager_id'] = (int) $input['project_manager_id'];
                if ($projUpdates !== []) {
                    $projUpdates['updated_by'] = (int) $user->id;
                    $projUpdates['updated_at'] = date('Y-m-d H:i:s');
                    $db->table('projects')->where('id', (int) $existing['project_id'])->update($projUpdates);
                }
            }

            if ($db->transStatus() === false) {
                throw new DatabaseException('Unable to update the site.');
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site updated successfully.',
                'data' => ['site' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Site update failed.', $exception);
        }
    }

    public function statusHistory(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $site = $this->sites->where('company_id', (int) $user->company_id)->find($id);
        if ($site === null || ! $this->canAccessSite($site, $user)) {
            return $this->notFound();
        }

        try {
            $history = db_connect()->table('site_status_logs logs')
                ->select([
                    'logs.id', 'logs.company_id', 'logs.project_id', 'logs.site_id',
                    'logs.from_status_id', 'from_status.status_code AS from_status_code',
                    'from_status.status_name AS from_status_name', 'logs.to_status_id',
                    'to_status.status_code AS to_status_code', 'to_status.status_name AS to_status_name',
                    'logs.change_reason', 'logs.changed_by', 'users.employee_code AS changed_by_employee_code',
                    'users.first_name AS changed_by_first_name', 'users.last_name AS changed_by_last_name',
                    'logs.changed_at',
                ])
                ->join('site_statuses from_status', 'from_status.id = logs.from_status_id', 'left')
                ->join('site_statuses to_status', 'to_status.id = logs.to_status_id', 'left')
                ->join('users', 'users.id = logs.changed_by', 'left')
                ->where('logs.company_id', (int) $user->company_id)
                ->where('logs.project_id', (int) $site['project_id'])
                ->where('logs.site_id', $id)
                ->orderBy('logs.changed_at', 'DESC')
                ->orderBy('logs.id', 'DESC')
                ->get()->getResultArray();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site status history retrieved successfully.',
                'data' => ['status_history' => $history],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Site status history retrieval failed.', $exception);
        }
    }

    public function changeStatus(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $site = $this->sites->where('company_id', (int) $user->company_id)->find($id);
        if ($site === null || ! $this->canAccessSite($site, $user, true)) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $toStatusId = (int) ($input['site_status_id'] ?? 0);
        $changeReason = trim((string) ($input['change_reason'] ?? ''));
        $errors = [];
        if ($toStatusId <= 0 || ! $this->activeMasterExists('site_statuses', $toStatusId)) {
            $errors['site_status_id'] = 'Select a valid active site status.';
        }
        if ($changeReason === '') {
            $errors['change_reason'] = 'Change reason is required.';
        } elseif (mb_strlen($changeReason) > 500) {
            $errors['change_reason'] = 'Change reason cannot exceed 500 characters.';
        }
        if ($toStatusId === (int) $site['site_status_id']) {
            $errors['site_status_id'] = 'The site is already in the selected status.';
        }
        if ($errors !== []) {
            return $this->invalid($errors);
        }

        $db = db_connect();
        try {
            $db->transBegin();
            if (! $this->sites->update($id, [
                'site_status_id' => $toStatusId,
                'updated_by' => (int) $user->id,
            ])) {
                $db->transRollback();
                return $this->invalid($this->sites->errors());
            }

            $db->table('site_status_logs')->insert([
                'company_id' => (int) $user->company_id,
                'project_id' => (int) $site['project_id'],
                'site_id' => $id,
                'from_status_id' => (int) $site['site_status_id'],
                'to_status_id' => $toStatusId,
                'change_reason' => $changeReason,
                'changed_by' => (int) $user->id,
            ]);

            if ($db->transStatus() === false) {
                throw new DatabaseException('Unable to save the site status history.');
            }
            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site status changed successfully.',
                'data' => ['site' => $this->baseQuery()->find($id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->databaseConflict($exception);
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError('Site status change failed.', $exception);
        }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        $site = $this->sites->where('company_id', (int) $user->company_id)->find($id);
        if ($site === null || ! $this->canAccessSite($site, $user, true)) {
            return $this->notFound();
        }

        try {
            $this->sites->update($id, ['updated_by' => (int) $user->id]);
            $this->sites->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Site deleted successfully.',
            ]);
        } catch (DatabaseException $exception) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)->setJSON([
                'success' => false,
                'message' => 'This site cannot be deleted because it is used by existing records.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError('Site deletion failed.', $exception);
        }
    }

    private function baseQuery(): ProjectSiteModel
    {
        return $this->sites
            ->select([
                'project_sites.*',
                'projects.project_code', 'projects.project_name', 'projects.branch_id AS project_branch_id',
                'projects.client_id', 'clients.client_code', 'clients.client_name',
                'projects.contract_value', 'projects.project_manager_id',
                'branches.branch_code', 'branches.branch_name',
                'site_types.type_code AS site_type_code', 'site_types.type_name AS site_type_name',
                'site_statuses.status_code AS site_status_code', 'site_statuses.status_name AS site_status_name',
                'engineer.employee_code AS site_engineer_code', 'engineer.first_name AS site_engineer_first_name',
                'engineer.last_name AS site_engineer_last_name',
                'supervisor.employee_code AS supervisor_code', 'supervisor.first_name AS supervisor_first_name',
                'supervisor.last_name AS supervisor_last_name',
                'manager.first_name AS project_manager_first_name', 'manager.last_name AS project_manager_last_name',
            ])
            ->join('projects', 'projects.id = project_sites.project_id AND projects.company_id = project_sites.company_id')
            ->join('clients', 'clients.id = projects.client_id', 'left')
            ->join('branches', 'branches.id = projects.branch_id', 'left')
            ->join('site_types', 'site_types.id = project_sites.site_type_id')
            ->join('site_statuses', 'site_statuses.id = project_sites.site_status_id')
            ->join('users engineer', 'engineer.id = project_sites.site_engineer_id', 'left')
            ->join('users supervisor', 'supervisor.id = project_sites.supervisor_id', 'left')
            ->join('users manager', 'manager.id = projects.project_manager_id', 'left');
    }

    private function writableData(array $input, bool $creating): array
    {
        $fields = [
            'project_id', 'site_code', 'site_name', 'site_type_id', 'address_line1', 'address_line2',
            'landmark', 'city', 'district', 'state_name', 'state_code', 'country_code', 'postal_code',
            'latitude', 'longitude', 'geofence_radius_m', 'contact_name', 'contact_phone',
            'site_engineer_id', 'supervisor_id', 'planned_start_date', 'actual_start_date',
            'expected_end_date', 'actual_end_date', 'site_status_id', 'progress_percentage',
            'is_primary', 'notes',
        ];

        if (! $creating) {
            $fields = array_values(array_diff($fields, ['project_id', 'site_status_id']));
        }

        return array_intersect_key($input, array_flip($fields));
    }

    private function validateReferences(array $data, object $user): ?ResponseInterface
    {
        $errors = [];
        $projectId = (int) ($data['project_id'] ?? 0);
        if ($projectId <= 0 || $this->getAccessibleProject($projectId, $user, true) === null) {
            $errors['project_id'] = 'Select a valid active project you are permitted to operate.';
        }

        foreach (['site_type_id' => 'site_types', 'site_status_id' => 'site_statuses'] as $field => $table) {
            $id = (int) ($data[$field] ?? 0);
            if (! $this->activeMasterExists($table, $id)) {
                $errors[$field] = 'Select a valid active ' . str_replace('_id', '', str_replace('_', ' ', $field)) . '.';
            }
        }

        foreach (['site_engineer_id', 'supervisor_id'] as $field) {
            $id = (int) ($data[$field] ?? 0);
            if ($id > 0 && ! $this->companyUserExists($id, (int) $user->company_id)) {
                $errors[$field] = 'Select a valid active user for this company.';
            }
        }

        return $errors === [] ? null : $this->invalid($errors);
    }

    private function validateDates(array $data): array
    {
        $errors = [];
        if (! empty($data['planned_start_date']) && ! empty($data['expected_end_date'])
            && $data['expected_end_date'] < $data['planned_start_date']) {
            $errors['expected_end_date'] = 'Expected end date cannot be before planned start date.';
        }
        if (! empty($data['actual_start_date']) && ! empty($data['actual_end_date'])
            && $data['actual_end_date'] < $data['actual_start_date']) {
            $errors['actual_end_date'] = 'Actual end date cannot be before actual start date.';
        }
        return $errors;
    }

    private function getAccessibleProject(int $projectId, object $user, bool $operate = false): ?array
    {
        $project = db_connect()->table('projects')
            ->where('id', $projectId)
            ->where('company_id', (int) $user->company_id)
            ->where('deleted_at', null)
            ->get()->getRowArray();
        if ($project === null) {
            return null;
        }

        $branchId = (int) ($project['branch_id'] ?? 0);
        if ($branchId > 0 && ! $this->authorization->canAccessBranch($branchId, $operate ? 'OPERATE' : 'VIEW', $user)) {
            return null;
        }
        return $project;
    }

    private function canAccessSite(array $site, object $user, bool $operate = false): bool
    {
        if ((int) $site['company_id'] !== (int) $user->company_id) {
            return false;
        }
        return $this->getAccessibleProject((int) $site['project_id'], $user, $operate) !== null;
    }

    private function activeMasterExists(string $table, int $id): bool
    {
        return $id > 0 && db_connect()->table($table)
            ->where('id', $id)->where('is_active', 1)->countAllResults() === 1;
    }

    private function companyUserExists(int $id, int $companyId): bool
    {
        return db_connect()->table('users')->where('id', $id)->where('company_id', $companyId)
            ->where('is_active', 1)->where('deleted_at', null)->countAllResults() === 1;
    }

    private function duplicateSiteCodeExists(int $projectId, string $siteCode, ?int $exceptId = null): bool
    {
        $builder = db_connect()->table('project_sites')
            ->where('project_id', $projectId)
            ->where('site_code', strtoupper(trim($siteCode)))
            ->where('deleted_at', null);

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        return $builder->countAllResults() > 0;
    }

    private function clearOtherPrimarySites(int $projectId, ?int $exceptId, int $userId): void
    {
        $builder = db_connect()->table('project_sites')
            ->where('project_id', $projectId)->where('is_primary', 1)->where('deleted_at', null);
        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }
        $builder->update(['is_primary' => 0, 'updated_by' => $userId]);
    }

    private function successList(array $sites): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'message' => 'Sites retrieved successfully.',
            'data' => ['sites' => $sites],
        ]);
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON(['success' => false, 'message' => 'Authentication required.']);
    }

    private function forbidden(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_FORBIDDEN)
            ->setJSON(['success' => false, 'message' => $message]);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Site not found.']);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function databaseConflict(DatabaseException $exception): ResponseInterface
    {
        log_message('warning', 'Site database conflict: {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)->setJSON([
            'success' => false,
            'message' => 'Site code already exists for this project or the record conflicts with existing data.',
        ]);
    }

    private function serverError(string $message, Throwable $exception): ResponseInterface
    {
        log_message('error', $message . ' {message}', ['message' => $exception->getMessage()]);
        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the site request.']);
    }
}
