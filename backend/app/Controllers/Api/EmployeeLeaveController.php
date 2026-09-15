<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Employee Leave & Permission Controller
 *
 * Handles: leave types, leave balances, leave requests, leave approval,
 * permission requests, and permission approval.
 */
class EmployeeLeaveController extends LabourApiController
{
    // ── LEAVE TYPES ──────────────────────────────────────────────
    public function leaveTypes(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $rows = db_connect()->table('leave_types')
            ->where('company_id', $c)->orWhere('company_id', 0)
            ->where('is_active', 1)->orderBy('sort_order')->get()->getResultArray();
        return $this->ok('Leave types retrieved.', 'leave_types', $rows);
    }

    public function saveLeaveType(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $e = $this->required($in, ['leave_type_name', 'leave_type_code']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $data = [
            'company_id' => $c,
            'leave_type_name' => $in['leave_type_name'],
            'leave_type_code' => strtoupper(trim($in['leave_type_code'])),
            'max_days_per_year' => (int) ($in['max_days_per_year'] ?? 0),
            'is_paid' => (int) ($in['is_paid'] ?? 1),
            'is_active' => (int) ($in['is_active'] ?? 1),
            'sort_order' => (int) ($in['sort_order'] ?? 0),
            'updated_by' => (int) $u->id, 'updated_at' => $now,
        ];

        $id = (int) ($in['id'] ?? 0);
        if ($id > 0) {
            db_connect()->table('leave_types')->where(['id' => $id, 'company_id' => $c])->update($data);
        } else {
            $data['created_by'] = (int) $u->id; $data['created_at'] = $now;
            db_connect()->table('leave_types')->insert($data);
            $id = (int) db_connect()->insertID();
        }
        return $this->ok('Leave type saved.', 'leave_type', db_connect()->table('leave_types')->where('id', $id)->get()->getRowArray());
    }

    // ── LEAVE BALANCES ───────────────────────────────────────────
    public function leaveBalances(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $userId = $this->request->getGet('user_id') ?? $u->id;
        $year = $this->request->getGet('year') ?? date('Y');

        $rows = db_connect()->table('employee_leave_balances lb')
            ->select('lb.*, lt.leave_type_name, lt.leave_type_code, lt.is_paid')
            ->join('leave_types lt', 'lt.id = lb.leave_type_id')
            ->where(['lb.company_id' => $c, 'lb.user_id' => (int) $userId, 'lb.year' => $year])
            ->get()->getResultArray();
        return $this->ok('Leave balances retrieved.', 'balances', $rows);
    }

    public function saveLeaveBalance(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $e = $this->required($in, ['user_id', 'leave_type_id', 'year', 'allocated']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $existing = db_connect()->table('employee_leave_balances')
            ->where(['company_id' => $c, 'user_id' => (int) $in['user_id'], 'leave_type_id' => (int) $in['leave_type_id'], 'year' => $in['year']])
            ->get()->getRowArray();

        if ($existing) {
            db_connect()->table('employee_leave_balances')->where('id', $existing['id'])
                ->update(['allocated' => (float) $in['allocated'], 'updated_at' => $now]);
            $id = (int) $existing['id'];
        } else {
            db_connect()->table('employee_leave_balances')->insert([
                'company_id' => $c, 'user_id' => (int) $in['user_id'],
                'leave_type_id' => (int) $in['leave_type_id'], 'year' => $in['year'],
                'allocated' => (float) $in['allocated'], 'used' => 0,
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $id = (int) db_connect()->insertID();
        }
        return $this->ok('Balance saved.', 'balance', db_connect()->table('employee_leave_balances')->where('id', $id)->get()->getRowArray());
    }

    // ── LEAVE REQUESTS ───────────────────────────────────────────
    public function leaveRequests(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_leave_requests lr')
            ->select('lr.*, lt.leave_type_name, lt.leave_type_code, u.first_name, u.last_name, u.employee_code')
            ->join('leave_types lt', 'lt.id = lr.leave_type_id')
            ->join('users u', 'u.id = lr.user_id')
            ->where('lr.company_id', $c);

        if ($this->request->getGet('status')) $b->where('lr.status', $this->request->getGet('status'));
        if ($this->request->getGet('user_id') && ctype_digit((string) $this->request->getGet('user_id')))
            $b->where('lr.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('date_from')) $b->where('lr.from_date >=', $this->request->getGet('date_from'));
        if ($this->request->getGet('date_to')) $b->where('lr.to_date <=', $this->request->getGet('date_to'));

        return $this->ok('Leave requests retrieved.', 'leave_requests',
            $b->orderBy('lr.created_at', 'DESC')->get()->getResultArray());
    }

    public function createLeaveRequest(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['leave_type_id', 'from_date', 'to_date']);
        if ($e) return $this->invalid($e);

        $from = strtotime($in['from_date']);
        $to = strtotime($in['to_date']);
        if ($to < $from) return $this->invalid(['to_date' => 'To date must be on or after from date.']);

        $totalDays = (float) ($in['total_days'] ?? (($to - $from) / 86400 + 1));
        $now = $this->now();
        $data = [
            'company_id' => $c, 'user_id' => (int) $u->id,
            'leave_type_id' => (int) $in['leave_type_id'],
            'from_date' => $in['from_date'], 'to_date' => $in['to_date'],
            'total_days' => $totalDays,
            'reason' => $in['reason'] ?? null,
            'status' => 'PENDING',
            'created_by' => (int) $u->id, 'updated_by' => (int) $u->id,
            'created_at' => $now, 'updated_at' => $now,
        ];

        db_connect()->table('employee_leave_requests')->insert($data);
        $id = (int) db_connect()->insertID();

        return $this->ok('Leave request submitted.', 'leave_request',
            db_connect()->table('employee_leave_requests')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function reviewLeaveRequest(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        $action = $in['action'] ?? '';
        if (!in_array($action, ['APPROVED', 'REJECTED', 'CANCELLED']))
            return $this->invalid(['action' => 'Action must be APPROVED, REJECTED, or CANCELLED.']);

        $lr = db_connect()->table('employee_leave_requests')->where(['id' => $id, 'company_id' => $c])->get()->getRowArray();
        if (!$lr) return $this->notFound();
        if ($lr['status'] !== 'PENDING') return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Leave request is not pending.']);

        $now = $this->now();
        db_connect()->table('employee_leave_requests')->where('id', $id)->update([
            'status' => $action, 'reviewed_by' => (int) $u->id, 'reviewed_at' => $now,
            'review_remarks' => $in['remarks'] ?? null,
            'updated_by' => (int) $u->id, 'updated_at' => $now,
        ]);

        // If approved: update leave balance & create attendance LEAVE entries
        if ($action === 'APPROVED') {
            // Deduct balance
            $year = date('Y', strtotime($lr['from_date']));
            db_connect()->table('employee_leave_balances')
                ->where(['company_id' => $c, 'user_id' => (int) $lr['user_id'], 'leave_type_id' => (int) $lr['leave_type_id'], 'year' => $year])
                ->set('used', 'used + ' . (float) $lr['total_days'], false)
                ->update();

            // Create LEAVE attendance entries for each day
            $from = strtotime($lr['from_date']);
            $to = strtotime($lr['to_date']);
            $assignment = db_connect()->table('employee_site_assignments')
                ->where(['company_id' => $c, 'user_id' => (int) $lr['user_id'], 'is_active' => 1])
                ->get()->getRowArray();
            $siteId = $assignment ? (int) $assignment['site_id'] : 0;

            for ($d = $from; $d <= $to; $d += 86400) {
                $dt = date('Y-m-d', $d);
                $existing = db_connect()->table('employee_attendances')
                    ->where(['company_id' => $c, 'user_id' => (int) $lr['user_id'], 'attendance_date' => $dt])
                    ->get()->getRowArray();
                if ($existing) {
                    db_connect()->table('employee_attendances')->where('id', $existing['id'])
                        ->update(['status' => 'LEAVE', 'remarks' => 'Leave approved: ' . ($lr['reason'] ?? ''), 'updated_by' => (int) $u->id, 'updated_at' => $now]);
                } else {
                    db_connect()->table('employee_attendances')->insert([
                        'company_id' => $c, 'user_id' => (int) $lr['user_id'],
                        'site_id' => $siteId, 'attendance_date' => $dt,
                        'status' => 'LEAVE', 'remarks' => 'Leave approved',
                        'created_by' => (int) $u->id, 'updated_by' => (int) $u->id,
                        'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
            }
        }

        return $this->ok('Leave request ' . strtolower($action) . '.', 'leave_request',
            db_connect()->table('employee_leave_requests')->where('id', $id)->get()->getRowArray());
    }

    // ── PERMISSION REQUESTS ──────────────────────────────────────
    public function permissionRequests(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_permission_requests pr')
            ->select('pr.*, u.first_name, u.last_name, u.employee_code')
            ->join('users u', 'u.id = pr.user_id')
            ->where('pr.company_id', $c);

        if ($this->request->getGet('status')) $b->where('pr.status', $this->request->getGet('status'));
        if ($this->request->getGet('user_id') && ctype_digit((string) $this->request->getGet('user_id')))
            $b->where('pr.user_id', (int) $this->request->getGet('user_id'));

        return $this->ok('Permission requests retrieved.', 'permission_requests',
            $b->orderBy('pr.created_at', 'DESC')->get()->getResultArray());
    }

    public function createPermissionRequest(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $e = $this->required($in, ['permission_date', 'from_time', 'to_time', 'reason']);
        if ($e) return $this->invalid($e);

        $fromTs = strtotime($in['from_time']);
        $toTs = strtotime($in['to_time']);
        $durationHours = round(max(0, ($toTs - $fromTs) / 3600), 2);

        $now = $this->now();
        db_connect()->table('employee_permission_requests')->insert([
            'company_id' => $c, 'user_id' => (int) $u->id,
            'permission_date' => $in['permission_date'],
            'from_time' => $in['from_time'], 'to_time' => $in['to_time'],
            'duration_hours' => $durationHours,
            'reason' => $in['reason'],
            'status' => 'PENDING',
            'created_by' => (int) $u->id, 'updated_by' => (int) $u->id,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $id = (int) db_connect()->insertID();
        return $this->ok('Permission request submitted.', 'permission_request',
            db_connect()->table('employee_permission_requests')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function reviewPermissionRequest(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        $action = $in['action'] ?? '';
        if (!in_array($action, ['APPROVED', 'REJECTED']))
            return $this->invalid(['action' => 'Action must be APPROVED or REJECTED.']);

        $pr = db_connect()->table('employee_permission_requests')->where(['id' => $id, 'company_id' => $c])->get()->getRowArray();
        if (!$pr) return $this->notFound();
        if ($pr['status'] !== 'PENDING') return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Permission request is not pending.']);

        $now = $this->now();
        db_connect()->table('employee_permission_requests')->where('id', $id)->update([
            'status' => $action, 'reviewed_by' => (int) $u->id, 'reviewed_at' => $now,
            'review_remarks' => $in['remarks'] ?? null,
            'updated_by' => (int) $u->id, 'updated_at' => $now,
        ]);

        if ($action === 'APPROVED') {
            $existing = db_connect()->table('employee_attendances')
                ->where(['company_id' => $c, 'user_id' => (int) $pr['user_id'], 'attendance_date' => $pr['permission_date']])
                ->get()->getRowArray();
            if ($existing) {
                db_connect()->table('employee_attendances')->where('id', $existing['id'])
                    ->update(['status' => 'PERMISSION', 'remarks' => 'Permission approved: ' . ($pr['reason'] ?? ''), 'updated_by' => (int) $u->id, 'updated_at' => $now]);
            }
        }

        return $this->ok('Permission request ' . strtolower($action) . '.', 'permission_request',
            db_connect()->table('employee_permission_requests')->where('id', $id)->get()->getRowArray());
    }
}
