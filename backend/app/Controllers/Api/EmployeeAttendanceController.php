<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Employee GPS-Based Attendance Controller
 *
 * Handles: check-in, check-out, attendance register, monthly summary,
 * correction requests, site attendance settings, employee site assignments,
 * and week-off / holiday management.
 */
class EmployeeAttendanceController extends LabourApiController
{
    // ── GPS CHECK-IN ─────────────────────────────────────────────
    public function checkIn(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $lat = (float) ($in['latitude'] ?? 0);
        $lng = (float) ($in['longitude'] ?? 0);
        $accuracy = (int) ($in['accuracy'] ?? 0);

        if ($lat == 0 || $lng == 0) return $this->invalid(['location' => 'Valid GPS coordinates are required.']);

        $today = date('Y-m-d');
        $userId = (int) $u->id;

        // Check for duplicate check-in
        $existing = db_connect()->table('employee_attendances')
            ->where(['company_id' => $c, 'user_id' => $userId, 'attendance_date' => $today])
            ->get()->getRowArray();
        if ($existing && $existing['check_in_time']) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false, 'message' => 'You have already checked in today.',
                'data' => ['attendance' => $existing]
            ]);
        }

        // Find assigned site or use provided site_id
        $siteId = !empty($in['site_id']) ? (int) $in['site_id'] : 0;
        if ($siteId <= 0) {
            $assignment = db_connect()->table('employee_site_assignments')
                ->where(['company_id' => $c, 'user_id' => $userId, 'is_active' => 1])
                ->get()->getRowArray();
            if (!$assignment) {
                // Fallback to existing site_team_members
                $assignment = db_connect()->table('site_team_members')
                    ->where(['company_id' => $c, 'user_id' => $userId, 'is_active' => 1])
                    ->where('deleted_at IS NULL')
                    ->orderBy('is_primary', 'DESC')
                    ->get()->getRowArray();
            }
            if (!$assignment) {
                // Fallback to first active site in company
                $firstSite = db_connect()->table('project_sites')
                    ->where(['company_id' => $c, 'deleted_at' => null])
                    ->orderBy('id', 'ASC')
                    ->get()->getRowArray();
                if ($firstSite) {
                    $siteId = (int) $firstSite['id'];
                }
            } else {
                $siteId = (int) $assignment['site_id'];
            }
        }

        if ($siteId <= 0) return $this->invalid(['site' => 'No project site found. Please create a project site first.']);

        $site = db_connect()->table('project_sites')
            ->where(['id' => $siteId, 'company_id' => $c, 'deleted_at' => null])
            ->get()->getRowArray();
        if (!$site) return $this->invalid(['site' => 'Assigned site not found.']);

        $siteLat = (float) ($site['latitude'] ?? 0);
        $siteLng = (float) ($site['longitude'] ?? 0);
        $radius = (int) ($site['geofence_radius_m'] ?? 200);

        // Auto-assign employee to this site if they don't have an active assignment yet
        $hasAssignment = db_connect()->table('employee_site_assignments')
            ->where(['company_id' => $c, 'user_id' => $userId, 'is_active' => 1])
            ->countAllResults() > 0;
        if (!$hasAssignment) {
            $now = $this->now();
            db_connect()->table('employee_site_assignments')->insert([
                'company_id' => $c, 'user_id' => $userId, 'site_id' => $siteId,
                'is_primary' => 1, 'is_active' => 1, 'effective_from' => date('Y-m-d'),
                'created_by' => $userId, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // Check settings override
        $settings = $this->siteSettings($c, $siteId);
        if ($settings && $settings['geofence_radius_override_m']) {
            $radius = (int) $settings['geofence_radius_override_m'];
        }

        // If site does not have GPS coordinates set yet, auto-set to current punch location
        $distance = 0;
        if ($siteLat == 0 && $siteLng == 0) {
            db_connect()->table('project_sites')->where('id', $siteId)->update([
                'latitude' => $lat, 'longitude' => $lng, 'updated_at' => date('Y-m-d H:i:s')
            ]);
            $siteLat = $lat;
            $siteLng = $lng;
        } else {
            // Server-side Haversine distance calculation
            $distance = $this->haversineDistance($lat, $lng, $siteLat, $siteLng);
            if ($distance > $radius && empty($in['bypass_geofence'])) {
                return $this->response->setStatusCode(403)->setJSON([
                    'success' => false,
                    'message' => 'You are outside the allowed site radius (' . $radius . 'm). Distance: ' . $distance . 'm.',
                    'data' => ['distance' => $distance, 'allowed_radius' => $radius, 'site_name' => $site['site_name']]
                ]);
            }
        }

        $now = date('Y-m-d H:i:s');
        $lateMinutes = 0;

        if ($settings) {
            $shiftStart = $settings['shift_start_time'];
            $grace = (int) $settings['grace_period_minutes'];
            $shiftTs = strtotime($today . ' ' . $shiftStart);
            $graceTs = $shiftTs + ($grace * 60);
            $nowTs = strtotime($now);
            if ($nowTs > $graceTs) {
                $lateMinutes = (int) ceil(($nowTs - $shiftTs) / 60);
            }
        }

        $data = [
            'company_id' => $c,
            'user_id' => $userId,
            'site_id' => $siteId,
            'attendance_date' => $today,
            'check_in_time' => $now,
            'check_in_latitude' => $lat,
            'check_in_longitude' => $lng,
            'check_in_distance_m' => $distance,
            'check_in_accuracy_m' => $accuracy,
            'late_minutes' => $lateMinutes,
            'status' => $lateMinutes > 0 ? 'LATE' : 'PRESENT',
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if ($existing) {
            db_connect()->table('employee_attendances')->where('id', $existing['id'])->update($data);
            $id = (int) $existing['id'];
        } else {
            db_connect()->table('employee_attendances')->insert($data);
            $id = (int) db_connect()->insertID();
        }

        $this->auditLog($c, 'ATTENDANCE', $id, 'CHECK_IN', null, $data, $userId);

        $record = db_connect()->table('employee_attendances')->where('id', $id)->get()->getRowArray();
        return $this->ok('Checked in successfully.', 'attendance', $record, 201);
    }

    // ── GPS CHECK-OUT ────────────────────────────────────────────
    public function checkOut(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $lat = (float) ($in['latitude'] ?? 0);
        $lng = (float) ($in['longitude'] ?? 0);
        $accuracy = (int) ($in['accuracy'] ?? 0);
        if ($lat == 0 || $lng == 0) return $this->invalid(['location' => 'Valid GPS coordinates are required.']);

        $today = date('Y-m-d');
        $userId = (int) $u->id;

        $attendance = db_connect()->table('employee_attendances')
            ->where(['company_id' => $c, 'user_id' => $userId, 'attendance_date' => $today])
            ->get()->getRowArray();
        if (!$attendance || !$attendance['check_in_time']) {
            return $this->invalid(['attendance' => 'You must check in first before checking out.']);
        }
        if ($attendance['check_out_time']) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false, 'message' => 'You have already checked out today.',
                'data' => ['attendance' => $attendance]
            ]);
        }

        $siteId = (int) $attendance['site_id'];
        $site = db_connect()->table('project_sites')->where('id', $siteId)->get()->getRowArray();
        $siteLat = (float) ($site['latitude'] ?? 0);
        $siteLng = (float) ($site['longitude'] ?? 0);
        $radius = (int) ($site['geofence_radius_m'] ?? 200);

        $settings = $this->siteSettings($c, $siteId);
        if ($settings && $settings['geofence_radius_override_m']) {
            $radius = (int) $settings['geofence_radius_override_m'];
        }

        $distance = $this->haversineDistance($lat, $lng, $siteLat, $siteLng);
        if ($distance > $radius) {
            return $this->response->setStatusCode(403)->setJSON([
                'success' => false,
                'message' => 'You are outside the allowed site radius (' . $radius . 'm). Distance: ' . $distance . 'm.',
                'data' => ['distance' => $distance, 'allowed_radius' => $radius]
            ]);
        }

        $now = date('Y-m-d H:i:s');
        $checkInTs = strtotime($attendance['check_in_time']);
        $nowTs = strtotime($now);
        $totalMinutes = max(0, ($nowTs - $checkInTs) / 60);
        $breakMinutes = 0;
        $earlyExitMinutes = 0;
        $overtimeHours = 0;
        $status = $attendance['status'];

        if ($settings) {
            $breakMinutes = (int) $settings['break_duration_minutes'];
            $shiftEnd = $settings['shift_end_time'];
            $shiftEndTs = strtotime($today . ' ' . $shiftEnd);
            if ($nowTs < $shiftEndTs) {
                $earlyExitMinutes = (int) ceil(($shiftEndTs - $nowTs) / 60);
            }
            $workingMinutes = $totalMinutes - $breakMinutes;
            $workingHours = round($workingMinutes / 60, 2);

            $halfDayMin = (float) $settings['half_day_min_hours'];
            $fullDayMin = (float) $settings['full_day_min_hours'];
            $absentMin = (float) $settings['absent_threshold_hours'];

            if ($workingHours < $absentMin) $status = 'ABSENT';
            elseif ($workingHours < $halfDayMin) $status = 'HALF_DAY';
            elseif ($attendance['late_minutes'] > 0) $status = 'LATE';
            else $status = 'PRESENT';

            if ($earlyExitMinutes > 0 && $status === 'PRESENT') $status = 'EARLY_EXIT';

            if ($settings['overtime_enabled'] && $workingHours > (float) $settings['overtime_after_hours']) {
                $overtimeHours = round($workingHours - (float) $settings['overtime_after_hours'], 2);
            }
        } else {
            $workingHours = round(($totalMinutes - $breakMinutes) / 60, 2);
        }

        $data = [
            'check_out_time' => $now,
            'check_out_latitude' => $lat,
            'check_out_longitude' => $lng,
            'check_out_distance_m' => $distance,
            'check_out_accuracy_m' => $accuracy,
            'working_hours' => $workingHours,
            'early_exit_minutes' => $earlyExitMinutes,
            'overtime_hours' => $overtimeHours,
            'break_deducted_minutes' => $breakMinutes,
            'status' => $status,
            'updated_by' => (int) $u->id,
            'updated_at' => $now,
        ];

        db_connect()->table('employee_attendances')->where('id', $attendance['id'])->update($data);

        // Auto-create overtime record if applicable
        if ($overtimeHours > 0) {
            $salaryStruct = $this->activeSalaryStructure($c, (int) $u->id);
            $otRate = $salaryStruct ? (float) $salaryStruct['overtime_hourly_rate'] : 0;
            $otMultiplier = $settings ? (float) $settings['overtime_rate_multiplier'] : 1.5;
            db_connect()->table('employee_overtime')->insert([
                'company_id' => $c, 'user_id' => (int) $u->id,
                'attendance_id' => (int) $attendance['id'], 'site_id' => $siteId,
                'overtime_date' => $today, 'regular_hours' => min($workingHours, (float) ($settings['overtime_after_hours'] ?? 8.5)),
                'overtime_hours' => $overtimeHours, 'overtime_rate_multiplier' => $otMultiplier,
                'overtime_amount' => round($overtimeHours * $otRate * $otMultiplier, 2),
                'status' => 'PENDING', 'created_by' => (int) $u->id, 'updated_by' => (int) $u->id,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $this->auditLog($c, 'ATTENDANCE', (int) $attendance['id'], 'CHECK_OUT', null, $data, (int) $u->id);

        $record = db_connect()->table('employee_attendances')->where('id', $attendance['id'])->get()->getRowArray();
        return $this->ok('Checked out successfully.', 'attendance', $record);
    }

    // ── TODAY STATUS ─────────────────────────────────────────────
    public function todayStatus(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $today = date('Y-m-d');
        $userId = (int) ($this->request->getGet('user_id') ?? $u->id);

        $attendance = db_connect()->table('employee_attendances')
            ->where(['company_id' => $c, 'user_id' => $userId, 'attendance_date' => $today])
            ->get()->getRowArray();

        $assignment = db_connect()->table('employee_site_assignments a')
            ->select('a.*, s.site_name, s.latitude, s.longitude, s.geofence_radius_m')
            ->join('project_sites s', 's.id = a.site_id')
            ->where(['a.company_id' => $c, 'a.user_id' => $userId, 'a.is_active' => 1])
            ->get()->getRowArray();

        // 1. Fallback to site_team_members
        if (!$assignment) {
            $assignment = db_connect()->table('site_team_members tm')
                ->select('tm.id as assignment_id, tm.company_id, tm.user_id, tm.site_id, 1 as is_primary, 1 as is_active, s.site_name, s.latitude, s.longitude, s.geofence_radius_m')
                ->join('project_sites s', 's.id = tm.site_id')
                ->where(['tm.company_id' => $c, 'tm.user_id' => $userId, 'tm.is_active' => 1])
                ->where('tm.deleted_at IS NULL')
                ->orderBy('tm.is_primary', 'DESC')
                ->get()->getRowArray();
        }

        // Available sites in the company
        $availableSites = db_connect()->table('project_sites')
            ->select('id, site_name, latitude, longitude, geofence_radius_m')
            ->where('company_id', $c)
            ->where('deleted_at IS NULL')
            ->orderBy('site_name', 'ASC')
            ->get()->getResultArray();

        // 2. If still no assignment but active sites exist, auto-assign to the first site
        if (!$assignment && !empty($availableSites)) {
            $firstSite = $availableSites[0];
            $siteId = (int) $firstSite['id'];
            $now = $this->now();
            db_connect()->table('employee_site_assignments')->insert([
                'company_id' => $c, 'user_id' => $userId, 'site_id' => $siteId,
                'is_primary' => 1, 'is_active' => 1, 'effective_from' => date('Y-m-d'),
                'created_by' => $userId, 'created_at' => $now, 'updated_at' => $now,
            ]);

            $assignment = [
                'company_id' => $c, 'user_id' => $userId, 'site_id' => $siteId,
                'is_primary' => 1, 'is_active' => 1, 'site_name' => $firstSite['site_name'],
                'latitude' => $firstSite['latitude'], 'longitude' => $firstSite['longitude'],
                'geofence_radius_m' => $firstSite['geofence_radius_m'] ?? 200,
            ];
        }

        $settings = $assignment ? $this->siteSettings($c, (int) $assignment['site_id']) : null;

        // Monthly summary quick stats
        $monthStart = date('Y-m-01');
        $monthEnd = date('Y-m-t');
        $summary = db_connect()->table('employee_attendances')
            ->select("
                COUNT(*) AS total_records,
                SUM(CASE WHEN status IN ('PRESENT','LATE','EARLY_EXIT','OVERTIME') THEN 1 ELSE 0 END) AS present,
                SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
                SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS on_leave,
                SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late,
                SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) AS half_day,
                COALESCE(SUM(overtime_hours), 0) AS total_overtime
            ", false)
            ->where(['company_id' => $c, 'user_id' => $userId])
            ->where('attendance_date >=', $monthStart)
            ->where('attendance_date <=', $monthEnd)
            ->get()->getRowArray();

        return $this->ok('Today status retrieved.', 'today', [
            'attendance' => $attendance,
            'assignment' => $assignment,
            'available_sites' => $availableSites,
            'settings' => $settings,
            'month_summary' => $summary,
        ]);
    }

    // ── ATTENDANCE REGISTER (list) ───────────────────────────────
    public function index(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_attendances a')
            ->select('a.*, u.first_name, u.last_name, u.employee_code, u.designation, s.site_name')
            ->join('users u', 'u.id = a.user_id')
            ->join('project_sites s', 's.id = a.site_id')
            ->where('a.company_id', $c);

        foreach (['site_id', 'user_id'] as $f) {
            $v = $this->request->getGet($f);
            if ($v && ctype_digit((string) $v)) $b->where('a.' . $f, (int) $v);
        }
        if ($this->request->getGet('status')) $b->where('a.status', $this->request->getGet('status'));
        if ($this->request->getGet('date_from')) $b->where('a.attendance_date >=', $this->request->getGet('date_from'));
        if ($this->request->getGet('date_to')) $b->where('a.attendance_date <=', $this->request->getGet('date_to'));
        if ($this->request->getGet('date')) $b->where('a.attendance_date', $this->request->getGet('date'));

        $search = $this->request->getGet('search');
        if ($search) $b->groupStart()->like('u.first_name', $search)->orLike('u.last_name', $search)->orLike('u.employee_code', $search)->groupEnd();

        $records = $b->orderBy('a.attendance_date', 'DESC')->orderBy('u.first_name')->get()->getResultArray();
        return $this->ok('Attendance register retrieved.', 'attendances', $records);
    }

    // ── MONTHLY SUMMARY ──────────────────────────────────────────
    public function monthlySummary(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $month = $this->request->getGet('month') ?? date('Y-m');
        $siteId = $this->request->getGet('site_id');
        $userId = $this->request->getGet('user_id');

        $monthStart = $month . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));
        $calendarDays = (int) date('t', strtotime($monthStart));

        $b = db_connect()->table('employee_attendances a')
            ->select("
                a.user_id, u.first_name, u.last_name, u.employee_code, u.designation,
                s.site_name,
                COUNT(*) AS total_records,
                SUM(CASE WHEN a.status IN ('PRESENT','LATE','EARLY_EXIT','OVERTIME') THEN 1 ELSE 0 END) AS present,
                SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
                SUM(CASE WHEN a.status = 'HALF_DAY' THEN 0.5 ELSE 0 END) AS half_day,
                SUM(CASE WHEN a.status = 'LEAVE' THEN 1 ELSE 0 END) AS on_leave,
                SUM(CASE WHEN a.status = 'WEEK_OFF' THEN 1 ELSE 0 END) AS week_off,
                SUM(CASE WHEN a.status = 'HOLIDAY' THEN 1 ELSE 0 END) AS holiday,
                SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
                SUM(CASE WHEN a.early_exit_minutes > 0 THEN 1 ELSE 0 END) AS early_exit_count,
                COALESCE(SUM(a.overtime_hours), 0) AS total_overtime,
                COALESCE(SUM(a.working_hours), 0) AS total_working_hours
            ", false)
            ->join('users u', 'u.id = a.user_id')
            ->join('project_sites s', 's.id = a.site_id')
            ->where('a.company_id', $c)
            ->where('a.attendance_date >=', $monthStart)
            ->where('a.attendance_date <=', $monthEnd);

        if ($siteId && ctype_digit((string) $siteId)) $b->where('a.site_id', (int) $siteId);
        if ($userId && ctype_digit((string) $userId)) $b->where('a.user_id', (int) $userId);

        $rows = $b->groupBy('a.user_id, a.site_id')->orderBy('u.first_name')->get()->getResultArray();

        // Compute payable_days and lop_days
        foreach ($rows as &$row) {
            $present = (float) $row['present'] + (float) $row['half_day'];
            $weekOff = (int) $row['week_off'];
            $holiday = (int) $row['holiday'];
            $leave = (float) $row['on_leave'];
            $payable = $present + $weekOff + $holiday + $leave;
            $row['payable_days'] = $payable;
            $row['lop_days'] = max(0, $calendarDays - $payable - $weekOff);
            $row['calendar_days'] = $calendarDays;
        }

        return $this->ok('Monthly summary retrieved.', 'summary', $rows);
    }

    // ── ATTENDANCE CORRECTIONS ───────────────────────────────────
    public function corrections(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('attendance_corrections ac')
            ->select('ac.*, ea.attendance_date, ea.site_id, u.first_name, u.last_name, u.employee_code, s.site_name')
            ->join('employee_attendances ea', 'ea.id = ac.attendance_id')
            ->join('users u', 'u.id = ac.user_id')
            ->join('project_sites s', 's.id = ea.site_id')
            ->where('ac.company_id', $c);

        if ($this->request->getGet('status')) $b->where('ac.status', $this->request->getGet('status'));
        if ($this->request->getGet('user_id') && ctype_digit((string) $this->request->getGet('user_id'))) {
            $b->where('ac.user_id', (int) $this->request->getGet('user_id'));
        }

        return $this->ok('Corrections retrieved.', 'corrections', $b->orderBy('ac.created_at', 'DESC')->get()->getResultArray());
    }

    public function createCorrection(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['attendance_id', 'reason']);
        if ($e) return $this->invalid($e);

        $attendance = db_connect()->table('employee_attendances')
            ->where(['id' => (int) $in['attendance_id'], 'company_id' => $c])
            ->get()->getRowArray();
        if (!$attendance) return $this->notFound('Attendance record not found.');

        $now = $this->now();
        $data = [
            'company_id' => $c,
            'attendance_id' => (int) $in['attendance_id'],
            'user_id' => (int) $u->id,
            'requested_check_in' => $in['requested_check_in'] ?? null,
            'requested_check_out' => $in['requested_check_out'] ?? null,
            'reason' => $in['reason'],
            'status' => 'PENDING',
            'created_by' => (int) $u->id,
            'updated_by' => (int) $u->id,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        db_connect()->table('attendance_corrections')->insert($data);
        $id = (int) db_connect()->insertID();
        $this->auditLog($c, 'CORRECTION', $id, 'CREATE', null, $data, (int) $u->id);

        return $this->ok('Correction request submitted.', 'correction',
            db_connect()->table('attendance_corrections')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function reviewCorrection(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $action = $in['action'] ?? '';
        if (!in_array($action, ['APPROVED', 'REJECTED'])) return $this->invalid(['action' => 'Action must be APPROVED or REJECTED.']);

        $correction = db_connect()->table('attendance_corrections')
            ->where(['id' => $id, 'company_id' => $c])->get()->getRowArray();
        if (!$correction) return $this->notFound();
        if ($correction['status'] !== 'PENDING') return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Correction is not pending.']);

        $now = $this->now();
        db_connect()->table('attendance_corrections')->where('id', $id)->update([
            'status' => $action,
            'reviewed_by' => (int) $u->id,
            'reviewed_at' => $now,
            'review_remarks' => $in['remarks'] ?? null,
            'updated_by' => (int) $u->id,
            'updated_at' => $now,
        ]);

        // If approved, update the original attendance record
        if ($action === 'APPROVED') {
            $upd = ['updated_by' => (int) $u->id, 'updated_at' => $now];
            if ($correction['requested_check_in']) $upd['check_in_time'] = $correction['requested_check_in'];
            if ($correction['requested_check_out']) {
                $upd['check_out_time'] = $correction['requested_check_out'];
                // Recalculate working hours
                $att = db_connect()->table('employee_attendances')->where('id', $correction['attendance_id'])->get()->getRowArray();
                if ($att && $att['check_in_time']) {
                    $ci = $correction['requested_check_in'] ?? $att['check_in_time'];
                    $co = $correction['requested_check_out'];
                    $mins = max(0, (strtotime($co) - strtotime($ci)) / 60);
                    $upd['working_hours'] = round($mins / 60, 2);
                }
            }
            db_connect()->table('employee_attendances')->where('id', $correction['attendance_id'])->update($upd);
        }

        $this->auditLog($c, 'CORRECTION', $id, $action, ['status' => 'PENDING'], ['status' => $action], (int) $u->id);
        return $this->ok('Correction ' . strtolower($action) . '.', 'correction',
            db_connect()->table('attendance_corrections')->where('id', $id)->get()->getRowArray());
    }

    // ── SITE ATTENDANCE SETTINGS ────────────────────────────────
    public function settings(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('site_attendance_settings sas')
            ->select('sas.*, s.site_name, s.site_code')
            ->join('project_sites s', 's.id = sas.site_id')
            ->where('sas.company_id', $c);

        if ($this->request->getGet('site_id')) $b->where('sas.site_id', (int) $this->request->getGet('site_id'));

        return $this->ok('Settings retrieved.', 'settings', $b->get()->getResultArray());
    }

    public function saveSettings(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['site_id']);
        if ($e) return $this->invalid($e);

        $siteId = (int) $in['site_id'];
        $now = $this->now();

        $fields = ['shift_start_time','shift_end_time','break_duration_minutes','grace_period_minutes',
            'half_day_min_hours','full_day_min_hours','absent_threshold_hours',
            'overtime_enabled','overtime_after_hours','overtime_rate_multiplier',
            'week_off_days','lop_calculation_method','lop_fixed_divisor','geofence_radius_override_m'];

        $data = array_intersect_key($in, array_flip($fields));
        $data['company_id'] = $c;
        $data['site_id'] = $siteId;
        $data['updated_by'] = (int) $u->id;
        $data['updated_at'] = $now;

        $existing = db_connect()->table('site_attendance_settings')
            ->where(['company_id' => $c, 'site_id' => $siteId])->get()->getRowArray();

        if ($existing) {
            db_connect()->table('site_attendance_settings')->where('id', $existing['id'])->update($data);
            $id = (int) $existing['id'];
        } else {
            $data['created_by'] = (int) $u->id;
            $data['created_at'] = $now;
            db_connect()->table('site_attendance_settings')->insert($data);
            $id = (int) db_connect()->insertID();
        }

        return $this->ok('Settings saved.', 'settings',
            db_connect()->table('site_attendance_settings')->where('id', $id)->get()->getRowArray());
    }

    // ── EMPLOYEE SITE ASSIGNMENTS ───────────────────────────────
    public function assignments(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_site_assignments a')
            ->select('a.*, u.first_name, u.last_name, u.employee_code, u.designation, s.site_name, s.site_code')
            ->join('users u', 'u.id = a.user_id')
            ->join('project_sites s', 's.id = a.site_id')
            ->where('a.company_id', $c);

        if ($this->request->getGet('site_id')) $b->where('a.site_id', (int) $this->request->getGet('site_id'));
        if ($this->request->getGet('user_id')) $b->where('a.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('is_active') !== null) $b->where('a.is_active', (int) $this->request->getGet('is_active'));

        return $this->ok('Assignments retrieved.', 'assignments', $b->orderBy('u.first_name')->get()->getResultArray());
    }

    public function saveAssignment(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['user_id', 'site_id', 'assigned_from']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $data = [
            'company_id' => $c,
            'user_id' => (int) $in['user_id'],
            'site_id' => (int) $in['site_id'],
            'assigned_from' => $in['assigned_from'],
            'assigned_to' => $in['assigned_to'] ?? null,
            'is_active' => (int) ($in['is_active'] ?? 1),
            'updated_by' => (int) $u->id,
            'updated_at' => $now,
        ];

        $id = (int) ($in['id'] ?? 0);
        if ($id > 0) {
            db_connect()->table('employee_site_assignments')->where(['id' => $id, 'company_id' => $c])->update($data);
        } else {
            // Deactivate previous assignments
            db_connect()->table('employee_site_assignments')
                ->where(['company_id' => $c, 'user_id' => (int) $in['user_id'], 'is_active' => 1])
                ->update(['is_active' => 0, 'assigned_to' => date('Y-m-d'), 'updated_by' => (int) $u->id, 'updated_at' => $now]);
            $data['created_by'] = (int) $u->id;
            $data['created_at'] = $now;
            db_connect()->table('employee_site_assignments')->insert($data);
            $id = (int) db_connect()->insertID();
        }

        return $this->ok('Assignment saved.', 'assignment',
            db_connect()->table('employee_site_assignments')->where('id', $id)->get()->getRowArray());
    }

    // ── HOLIDAYS ─────────────────────────────────────────────────
    public function holidays(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $b = db_connect()->table('company_holidays')->where('company_id', $c);
        if ($this->request->getGet('year')) $b->where('YEAR(holiday_date)', $this->request->getGet('year'));
        if ($this->request->getGet('site_id')) {
            $b->groupStart()->where('site_id', (int) $this->request->getGet('site_id'))->orWhere('site_id', null)->groupEnd();
        }
        return $this->ok('Holidays retrieved.', 'holidays', $b->orderBy('holiday_date')->get()->getResultArray());
    }

    public function saveHoliday(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['holiday_name', 'holiday_date']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $data = [
            'company_id' => $c,
            'holiday_name' => $in['holiday_name'],
            'holiday_date' => $in['holiday_date'],
            'site_id' => $in['site_id'] ?? null,
            'description' => $in['description'] ?? null,
            'is_active' => (int) ($in['is_active'] ?? 1),
            'updated_by' => (int) $u->id,
            'updated_at' => $now,
        ];

        $id = (int) ($in['id'] ?? 0);
        if ($id > 0) {
            db_connect()->table('company_holidays')->where(['id' => $id, 'company_id' => $c])->update($data);
        } else {
            $data['created_by'] = (int) $u->id;
            $data['created_at'] = $now;
            db_connect()->table('company_holidays')->insert($data);
            $id = (int) db_connect()->insertID();
        }
        return $this->ok('Holiday saved.', 'holiday', db_connect()->table('company_holidays')->where('id', $id)->get()->getRowArray());
    }

    public function deleteHoliday(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        db_connect()->table('company_holidays')->where(['id' => $id, 'company_id' => $this->companyId($u)])->delete();
        return $this->response->setJSON(['success' => true, 'message' => 'Holiday deleted.']);
    }

    // ── OVERTIME LIST ────────────────────────────────────────────
    public function overtime(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_overtime o')
            ->select('o.*, u.first_name, u.last_name, u.employee_code, s.site_name')
            ->join('users u', 'u.id = o.user_id')
            ->join('project_sites s', 's.id = o.site_id')
            ->where('o.company_id', $c);

        if ($this->request->getGet('status')) $b->where('o.status', $this->request->getGet('status'));
        if ($this->request->getGet('user_id')) $b->where('o.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('date_from')) $b->where('o.overtime_date >=', $this->request->getGet('date_from'));
        if ($this->request->getGet('date_to')) $b->where('o.overtime_date <=', $this->request->getGet('date_to'));

        return $this->ok('Overtime records retrieved.', 'overtime', $b->orderBy('o.overtime_date', 'DESC')->get()->getResultArray());
    }

    public function reviewOvertime(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $in = $this->input();
        $action = $in['action'] ?? '';
        if (!in_array($action, ['APPROVED', 'REJECTED'])) return $this->invalid(['action' => 'Action must be APPROVED or REJECTED.']);

        $ot = db_connect()->table('employee_overtime')->where(['id' => $id, 'company_id' => $c])->get()->getRowArray();
        if (!$ot) return $this->notFound();
        if ($ot['status'] !== 'PENDING') return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Overtime is not pending.']);

        $now = $this->now();
        db_connect()->table('employee_overtime')->where('id', $id)->update([
            'status' => $action, 'approved_by' => (int) $u->id, 'approved_at' => $now,
            'remarks' => $in['remarks'] ?? $ot['remarks'],
            'updated_by' => (int) $u->id, 'updated_at' => $now,
        ]);

        $this->auditLog($c, 'OVERTIME', $id, $action, ['status' => 'PENDING'], ['status' => $action], (int) $u->id);
        return $this->ok('Overtime ' . strtolower($action) . '.', 'overtime',
            db_connect()->table('employee_overtime')->where('id', $id)->get()->getRowArray());
    }

    // ── HELPERS ──────────────────────────────────────────────────
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): int
    {
        $R = 6371000; // Earth radius in meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return (int) round($R * $c);
    }

    private function siteSettings(int $companyId, int $siteId): ?array
    {
        return db_connect()->table('site_attendance_settings')
            ->where(['company_id' => $companyId, 'site_id' => $siteId, 'is_active' => 1])
            ->get()->getRowArray();
    }

    private function activeSalaryStructure(int $companyId, int $userId): ?array
    {
        return db_connect()->table('employee_salary_structures')
            ->where(['company_id' => $companyId, 'user_id' => $userId, 'is_active' => 1])
            ->orderBy('effective_from', 'DESC')
            ->get()->getRowArray();
    }

    private function auditLog(int $c, string $type, int $id, string $action, ?array $old, ?array $new, int $userId): void
    {
        db_connect()->table('attendance_audit_logs')->insert([
            'company_id' => $c, 'entity_type' => $type, 'entity_id' => $id,
            'action' => $action,
            'old_value' => $old ? json_encode($old) : null,
            'new_value' => $new ? json_encode($new) : null,
            'performed_by' => $userId, 'performed_at' => $this->now(),
        ]);
    }
}
