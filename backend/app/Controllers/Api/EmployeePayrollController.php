<?php
declare(strict_types=1);
namespace App\Controllers\Api;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Employee Payroll Controller
 *
 * Handles: salary structures, advances/loans, monthly payroll generation,
 * payroll approval/locking, payslips, and payroll reports.
 */
class EmployeePayrollController extends LabourApiController
{
    // ── SALARY STRUCTURES ────────────────────────────────────────
    public function salaryStructures(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $b = db_connect()->table('employee_salary_structures ss')
            ->select('ss.*, u.first_name, u.last_name, u.employee_code, u.designation')
            ->join('users u', 'u.id = ss.user_id')
            ->where('ss.company_id', $c);
        if ($this->request->getGet('user_id')) $b->where('ss.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('is_active')) $b->where('ss.is_active', (int) $this->request->getGet('is_active'));
        return $this->ok('Salary structures retrieved.', 'salary_structures', $b->orderBy('u.first_name')->get()->getResultArray());
    }

    public function saveSalaryStructure(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $e = $this->required($in, ['user_id', 'effective_from', 'basic_salary']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $fields = ['basic_salary','hra','conveyance_allowance','special_allowance','other_allowance',
            'site_allowance_per_day','overtime_hourly_rate','epf_percentage','esi_percentage',
            'professional_tax','other_deduction'];
        $data = array_intersect_key($in, array_flip($fields));
        $data['company_id'] = $c;
        $data['user_id'] = (int) $in['user_id'];
        $data['effective_from'] = $in['effective_from'];
        $data['is_active'] = (int) ($in['is_active'] ?? 1);
        $data['updated_by'] = (int) $u->id;
        $data['updated_at'] = $now;

        $id = (int) ($in['id'] ?? 0);
        if ($id > 0) {
            db_connect()->table('employee_salary_structures')->where(['id' => $id, 'company_id' => $c])->update($data);
        } else {
            // Deactivate previous structures for same user
            db_connect()->table('employee_salary_structures')
                ->where(['company_id' => $c, 'user_id' => (int) $in['user_id'], 'is_active' => 1])
                ->update(['is_active' => 0, 'updated_at' => $now]);
            $data['created_by'] = (int) $u->id; $data['created_at'] = $now;
            db_connect()->table('employee_salary_structures')->insert($data);
            $id = (int) db_connect()->insertID();
        }
        return $this->ok('Salary structure saved.', 'salary_structure',
            db_connect()->table('employee_salary_structures')->where('id', $id)->get()->getRowArray());
    }

    // ── ADVANCES / LOANS ─────────────────────────────────────────
    public function advances(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $b = db_connect()->table('employee_advances adv')
            ->select('adv.*, u.first_name, u.last_name, u.employee_code')
            ->join('users u', 'u.id = adv.user_id')
            ->where('adv.company_id', $c);
        if ($this->request->getGet('user_id')) $b->where('adv.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('is_active') !== null) $b->where('adv.is_active', (int) $this->request->getGet('is_active'));
        return $this->ok('Advances retrieved.', 'advances', $b->orderBy('adv.disbursed_date', 'DESC')->get()->getResultArray());
    }

    public function saveAdvance(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $e = $this->required($in, ['user_id', 'amount', 'disbursed_date']);
        if ($e) return $this->invalid($e);

        $now = $this->now();
        $data = [
            'company_id' => $c,
            'user_id' => (int) $in['user_id'],
            'advance_type' => $in['advance_type'] ?? 'ADVANCE',
            'amount' => (float) $in['amount'],
            'disbursed_date' => $in['disbursed_date'],
            'monthly_deduction' => (float) ($in['monthly_deduction'] ?? 0),
            'total_recovered' => (float) ($in['total_recovered'] ?? 0),
            'is_active' => (int) ($in['is_active'] ?? 1),
            'remarks' => $in['remarks'] ?? null,
            'updated_by' => (int) $u->id, 'updated_at' => $now,
        ];
        $id = (int) ($in['id'] ?? 0);
        if ($id > 0) {
            db_connect()->table('employee_advances')->where(['id' => $id, 'company_id' => $c])->update($data);
        } else {
            $data['created_by'] = (int) $u->id; $data['created_at'] = $now;
            db_connect()->table('employee_advances')->insert($data);
            $id = (int) db_connect()->insertID();
        }
        return $this->ok('Advance saved.', 'advance',
            db_connect()->table('employee_advances')->where('id', $id)->get()->getRowArray());
    }

    // ── GENERATE PAYROLL ─────────────────────────────────────────
    public function generatePayroll(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        if (!$in) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $e = $this->required($in, ['payroll_month']);
        if ($e) return $this->invalid($e);

        $month = $in['payroll_month']; // YYYY-MM
        $siteFilter = (int) ($in['site_id'] ?? 0);
        $userFilter = (int) ($in['user_id'] ?? 0);

        return $this->transaction(function ($db) use ($c, $month, $siteFilter, $userFilter, $u) {
            $monthStart = $month . '-01';
            $monthEnd = date('Y-m-t', strtotime($monthStart));
            $calendarDays = (int) date('t', strtotime($monthStart));
            $now = $this->now();

            // Get employees with attendance in this month
            $q = $db->table('employee_attendances a')
                ->select('DISTINCT a.user_id, a.site_id')
                ->where('a.company_id', $c)
                ->where('a.attendance_date >=', $monthStart)
                ->where('a.attendance_date <=', $monthEnd);

            if ($siteFilter > 0) $q->where('a.site_id', $siteFilter);
            if ($userFilter > 0) $q->where('a.user_id', $userFilter);

            $employees = $q->get()->getResultArray();
            $generated = [];

            foreach ($employees as $emp) {
                $userId = (int) $emp['user_id'];
                $siteId = (int) $emp['site_id'];

                // Skip if already locked
                $existing = $db->table('employee_payrolls')
                    ->where(['company_id' => $c, 'user_id' => $userId, 'payroll_month' => $month])
                    ->get()->getRowArray();
                if ($existing && in_array($existing['status'], ['APPROVED', 'LOCKED'])) continue;

                // Attendance summary
                $att = $db->table('employee_attendances')
                    ->select("
                        COUNT(*) AS total_records,
                        SUM(CASE WHEN status IN ('PRESENT','LATE','EARLY_EXIT','OVERTIME') THEN 1 ELSE 0 END) AS present_days,
                        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_days,
                        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS leave_days,
                        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) AS half_days,
                        SUM(CASE WHEN status = 'WEEK_OFF' THEN 1 ELSE 0 END) AS week_off_days,
                        SUM(CASE WHEN status = 'HOLIDAY' THEN 1 ELSE 0 END) AS holiday_days,
                        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
                        COALESCE(SUM(overtime_hours), 0) AS overtime_hours
                    ", false)
                    ->where(['company_id' => $c, 'user_id' => $userId, 'site_id' => $siteId])
                    ->where('attendance_date >=', $monthStart)
                    ->where('attendance_date <=', $monthEnd)
                    ->get()->getRowArray();

                // Get salary structure
                $salary = $db->table('employee_salary_structures')
                    ->where(['company_id' => $c, 'user_id' => $userId, 'is_active' => 1])
                    ->orderBy('effective_from', 'DESC')->get()->getRowArray();

                if (!$salary) continue;

                // Site settings for LOP divisor
                $settings = $db->table('site_attendance_settings')
                    ->where(['company_id' => $c, 'site_id' => $siteId, 'is_active' => 1])
                    ->get()->getRowArray();

                $lopMethod = $settings['lop_calculation_method'] ?? 'CALENDAR';
                $lopDivisor = $calendarDays;
                if ($lopMethod === 'FIXED') $lopDivisor = (int) ($settings['lop_fixed_divisor'] ?? 30);
                elseif ($lopMethod === 'WORKING') {
                    // Count working days (calendar - weekends)
                    $weekOffs = $settings ? explode(',', $settings['week_off_days'] ?? 'SUNDAY') : ['SUNDAY'];
                    $dayMap = ['SUNDAY'=>0,'MONDAY'=>1,'TUESDAY'=>2,'WEDNESDAY'=>3,'THURSDAY'=>4,'FRIDAY'=>5,'SATURDAY'=>6];
                    $offDays = array_map(fn($d) => $dayMap[strtoupper(trim($d))] ?? -1, $weekOffs);
                    $workingDays = 0;
                    for ($d = strtotime($monthStart); $d <= strtotime($monthEnd); $d += 86400) {
                        if (!in_array((int) date('w', $d), $offDays)) $workingDays++;
                    }
                    $lopDivisor = max(1, $workingDays);
                }

                $presentDays = (float) $att['present_days'] + ((float) $att['half_days'] * 0.5);
                $weekOffDays = (int) $att['week_off_days'];
                $holidayDays = (int) $att['holiday_days'];
                $leaveDays = (float) $att['leave_days'];
                $payableDays = $presentDays + $weekOffDays + $holidayDays + $leaveDays;
                $lopDays = max(0, $lopDivisor - $payableDays);

                // Earnings
                $basic = (float) $salary['basic_salary'];
                $hra = (float) $salary['hra'];
                $conveyance = (float) $salary['conveyance_allowance'];
                $special = (float) $salary['special_allowance'];
                $other = (float) $salary['other_allowance'];
                $siteAllowancePerDay = (float) $salary['site_allowance_per_day'];
                $otHourlyRate = (float) $salary['overtime_hourly_rate'];

                $siteAllowance = round($siteAllowancePerDay * $presentDays, 2);

                // Get approved overtime
                $otApproved = $db->table('employee_overtime')
                    ->select('COALESCE(SUM(overtime_hours), 0) AS ot_hours, COALESCE(SUM(overtime_amount), 0) AS ot_amount', false)
                    ->where(['company_id' => $c, 'user_id' => $userId, 'status' => 'APPROVED'])
                    ->where('overtime_date >=', $monthStart)->where('overtime_date <=', $monthEnd)
                    ->get()->getRowArray();

                $overtimeAmount = (float) ($otApproved['ot_amount'] ?? 0);
                $overtimeHours = (float) ($otApproved['ot_hours'] ?? 0);

                $grossSalary = $basic + $hra + $conveyance + $special + $other + $siteAllowance + $overtimeAmount;

                // Deductions
                $lopDeduction = $lopDays > 0 ? round(($basic / $lopDivisor) * $lopDays, 2) : 0;
                $epfDeduction = round($basic * (float) $salary['epf_percentage'] / 100, 2);
                $esiDeduction = round($grossSalary * (float) $salary['esi_percentage'] / 100, 2);
                $pt = (float) $salary['professional_tax'];
                $otherDeduction = (float) $salary['other_deduction'];

                // Advance & Loan deductions
                $advDeduction = 0; $loanDeduction = 0;
                $advances = $db->table('employee_advances')
                    ->where(['company_id' => $c, 'user_id' => $userId, 'is_active' => 1])
                    ->get()->getResultArray();
                foreach ($advances as $adv) {
                    $remaining = (float) $adv['amount'] - (float) $adv['total_recovered'];
                    if ($remaining <= 0) continue;
                    $deduct = min($remaining, (float) $adv['monthly_deduction']);
                    if ($adv['advance_type'] === 'LOAN') $loanDeduction += $deduct;
                    else $advDeduction += $deduct;
                    // Update recovered
                    $db->table('employee_advances')->where('id', $adv['id'])
                        ->set('total_recovered', 'total_recovered + ' . $deduct, false)->update();
                }

                $totalDeductions = $lopDeduction + $epfDeduction + $esiDeduction + $pt + $advDeduction + $loanDeduction + $otherDeduction;
                $netSalary = round($grossSalary - $totalDeductions, 2);

                $payrollData = [
                    'company_id' => $c, 'user_id' => $userId, 'payroll_month' => $month, 'site_id' => $siteId,
                    'total_days' => $calendarDays,
                    'working_days' => $lopDivisor,
                    'present_days' => $presentDays,
                    'absent_days' => (float) $att['absent_days'],
                    'leave_days' => $leaveDays,
                    'half_days' => (float) $att['half_days'],
                    'week_off_days' => $weekOffDays,
                    'holiday_days' => $holidayDays,
                    'lop_days' => $lopDays,
                    'overtime_hours' => $overtimeHours,
                    'late_count' => (int) $att['late_count'],
                    'payable_days' => $payableDays,
                    'basic_salary' => $basic, 'hra' => $hra,
                    'conveyance_allowance' => $conveyance, 'special_allowance' => $special,
                    'other_allowance' => $other, 'site_allowance' => $siteAllowance,
                    'overtime_amount' => $overtimeAmount,
                    'incentive' => 0, 'bonus' => 0,
                    'gross_salary' => $grossSalary,
                    'lop_deduction' => $lopDeduction,
                    'epf_deduction' => $epfDeduction,
                    'esi_deduction' => $esiDeduction,
                    'professional_tax' => $pt,
                    'advance_deduction' => $advDeduction,
                    'loan_deduction' => $loanDeduction,
                    'other_deduction' => $otherDeduction,
                    'total_deductions' => $totalDeductions,
                    'net_salary' => $netSalary,
                    'status' => 'DRAFT',
                    'generated_by' => (int) $u->id, 'generated_at' => $now,
                    'updated_by' => (int) $u->id, 'updated_at' => $now,
                ];

                if ($existing) {
                    $db->table('employee_payrolls')->where('id', $existing['id'])->update($payrollData);
                    $generated[] = (int) $existing['id'];
                } else {
                    $payrollData['created_by'] = (int) $u->id;
                    $payrollData['created_at'] = $now;
                    $db->table('employee_payrolls')->insert($payrollData);
                    $generated[] = (int) $db->insertID();
                }
            }

            return $this->ok('Payroll generated for ' . count($generated) . ' employees.', 'generated_count', count($generated));
        }, 'Payroll generation failed.');
    }

    // ── PAYROLL LIST ─────────────────────────────────────────────
    public function payrolls(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);

        $b = db_connect()->table('employee_payrolls p')
            ->select('p.*, u.first_name, u.last_name, u.employee_code, u.designation, s.site_name')
            ->join('users u', 'u.id = p.user_id')
            ->join('project_sites s', 's.id = p.site_id', 'left')
            ->where('p.company_id', $c);

        if ($this->request->getGet('payroll_month')) $b->where('p.payroll_month', $this->request->getGet('payroll_month'));
        if ($this->request->getGet('site_id')) $b->where('p.site_id', (int) $this->request->getGet('site_id'));
        if ($this->request->getGet('user_id')) $b->where('p.user_id', (int) $this->request->getGet('user_id'));
        if ($this->request->getGet('status')) $b->where('p.status', $this->request->getGet('status'));

        $search = $this->request->getGet('search');
        if ($search) $b->groupStart()->like('u.first_name', $search)->orLike('u.last_name', $search)->orLike('u.employee_code', $search)->groupEnd();

        return $this->ok('Payrolls retrieved.', 'payrolls', $b->orderBy('u.first_name')->get()->getResultArray());
    }

    public function payrollDetail(int $id): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $p = db_connect()->table('employee_payrolls p')
            ->select('p.*, u.first_name, u.last_name, u.employee_code, u.designation, u.phone, u.email, s.site_name, s.site_code, co.company_name, co.company_code')
            ->join('users u', 'u.id = p.user_id')
            ->join('project_sites s', 's.id = p.site_id', 'left')
            ->join('companies co', 'co.id = p.company_id')
            ->where(['p.id' => $id, 'p.company_id' => $c])
            ->get()->getRowArray();
        if (!$p) return $this->notFound();
        return $this->ok('Payroll detail retrieved.', 'payroll', $p);
    }

    // ── PAYROLL ACTIONS ──────────────────────────────────────────
    public function approvePayroll(int $id): ResponseInterface { return $this->payrollAction($id, 'APPROVED'); }
    public function lockPayroll(int $id): ResponseInterface { return $this->payrollAction($id, 'LOCKED'); }
    public function reopenPayroll(int $id): ResponseInterface { return $this->payrollAction($id, 'DRAFT', true); }

    private function payrollAction(int $id, string $targetStatus, bool $isReopen = false): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $p = db_connect()->table('employee_payrolls')->where(['id' => $id, 'company_id' => $c])->get()->getRowArray();
        if (!$p) return $this->notFound();

        $validTransitions = [
            'DRAFT' => ['APPROVED'],
            'APPROVED' => ['LOCKED'],
            'LOCKED' => ['DRAFT'], // reopen
        ];
        if (!$isReopen && !in_array($targetStatus, $validTransitions[$p['status']] ?? [])) {
            return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => 'Invalid payroll status transition from ' . $p['status'] . ' to ' . $targetStatus . '.']);
        }

        $now = $this->now();
        $upd = ['status' => $targetStatus, 'updated_by' => (int) $u->id, 'updated_at' => $now];
        if ($targetStatus === 'APPROVED') { $upd['approved_by'] = (int) $u->id; $upd['approved_at'] = $now; }
        if ($targetStatus === 'LOCKED') { $upd['locked_by'] = (int) $u->id; $upd['locked_at'] = $now; }

        db_connect()->table('employee_payrolls')->where('id', $id)->update($upd);

        // Audit log for reopen
        if ($isReopen) {
            db_connect()->table('attendance_audit_logs')->insert([
                'company_id' => $c, 'entity_type' => 'PAYROLL', 'entity_id' => $id,
                'action' => 'REOPEN', 'old_value' => json_encode(['status' => $p['status']]),
                'new_value' => json_encode(['status' => $targetStatus]),
                'performed_by' => (int) $u->id, 'performed_at' => $now,
            ]);
        }

        return $this->ok('Payroll ' . strtolower($targetStatus) . '.', 'payroll',
            db_connect()->table('employee_payrolls')->where('id', $id)->get()->getRowArray());
    }

    // ── BULK PAYROLL ACTIONS ──────────────────────────────────────
    public function bulkApprovePayroll(): ResponseInterface { return $this->bulkAction('APPROVED'); }
    public function bulkLockPayroll(): ResponseInterface { return $this->bulkAction('LOCKED'); }

    private function bulkAction(string $target): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u); $in = $this->input();
        $month = $in['payroll_month'] ?? '';
        if (!$month) return $this->invalid(['payroll_month' => 'Payroll month is required.']);

        $fromStatus = $target === 'APPROVED' ? 'DRAFT' : 'APPROVED';
        $now = $this->now();
        $upd = ['status' => $target, 'updated_by' => (int) $u->id, 'updated_at' => $now];
        if ($target === 'APPROVED') { $upd['approved_by'] = (int) $u->id; $upd['approved_at'] = $now; }
        if ($target === 'LOCKED') { $upd['locked_by'] = (int) $u->id; $upd['locked_at'] = $now; }

        $affected = db_connect()->table('employee_payrolls')
            ->where(['company_id' => $c, 'payroll_month' => $month, 'status' => $fromStatus])
            ->update($upd);

        return $this->ok('Payroll bulk ' . strtolower($target) . ' completed.', 'affected', $affected ? 1 : 0);
    }

    // ── PAYROLL REPORTS ──────────────────────────────────────────
    public function payrollSummary(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $month = $this->request->getGet('payroll_month') ?? date('Y-m');

        $summary = db_connect()->table('employee_payrolls')
            ->select("
                COUNT(*) AS total_employees,
                SUM(gross_salary) AS total_gross,
                SUM(total_deductions) AS total_deductions,
                SUM(net_salary) AS total_net,
                SUM(lop_deduction) AS total_lop,
                SUM(overtime_amount) AS total_overtime,
                SUM(site_allowance) AS total_site_allowance,
                SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) AS draft_count,
                SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
                SUM(CASE WHEN status = 'LOCKED' THEN 1 ELSE 0 END) AS locked_count
            ", false)
            ->where(['company_id' => $c, 'payroll_month' => $month])
            ->get()->getRowArray();

        return $this->ok('Payroll summary retrieved.', 'summary', $summary);
    }

    // ── ADMIN DASHBOARD STATS ────────────────────────────────────
    public function dashboardStats(): ResponseInterface
    {
        $u = $this->user(); if (!$u) return $this->unauthorized();
        $c = $this->companyId($u);
        $today = date('Y-m-d');

        $totalEmployees = db_connect()->table('employee_site_assignments')
            ->where(['company_id' => $c, 'is_active' => 1])->countAllResults();

        $todayStats = db_connect()->table('employee_attendances')
            ->select("
                COUNT(*) AS total,
                SUM(CASE WHEN status IN ('PRESENT','LATE','EARLY_EXIT','OVERTIME') THEN 1 ELSE 0 END) AS present,
                SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
                SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS on_leave,
                SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late,
                SUM(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NULL THEN 1 ELSE 0 END) AS currently_working,
                COALESCE(SUM(overtime_hours), 0) AS overtime_hours
            ", false)
            ->where(['company_id' => $c, 'attendance_date' => $today])
            ->get()->getRowArray();

        $pendingApprovals = [
            'leave' => db_connect()->table('employee_leave_requests')->where(['company_id' => $c, 'status' => 'PENDING'])->countAllResults(),
            'permission' => db_connect()->table('employee_permission_requests')->where(['company_id' => $c, 'status' => 'PENDING'])->countAllResults(),
            'correction' => db_connect()->table('attendance_corrections')->where(['company_id' => $c, 'status' => 'PENDING'])->countAllResults(),
            'overtime' => db_connect()->table('employee_overtime')->where(['company_id' => $c, 'status' => 'PENDING'])->countAllResults(),
        ];

        $currentMonth = date('Y-m');
        $payrollStatus = db_connect()->table('employee_payrolls')
            ->select("
                COUNT(*) AS total,
                SUM(net_salary) AS total_net,
                SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) AS draft,
                SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status = 'LOCKED' THEN 1 ELSE 0 END) AS locked
            ", false)
            ->where(['company_id' => $c, 'payroll_month' => $currentMonth])
            ->get()->getRowArray();

        return $this->ok('Dashboard stats retrieved.', 'stats', [
            'total_employees' => $totalEmployees,
            'today' => $todayStats,
            'pending_approvals' => $pendingApprovals,
            'payroll' => $payrollStatus,
        ]);
    }
}
