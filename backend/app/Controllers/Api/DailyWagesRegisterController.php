<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

/**
 * Karur-style Daily Wages / Site Resource Register.
 *
 * IMPORTANT: This controller is intentionally separate from LabourWagesController.
 * Existing labour_wage_periods / labour_wage_lines are NOT read or modified here.
 */
class DailyWagesRegisterController extends LabourApiController
{
    private const CLASSIFICATIONS = ['Manpower', 'Equipment', 'Expense'];

    public function index(): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();

        $companyId = $this->companyId($u);
        $b = db_connect()->table('daily_wage_registers d')
            ->select('d.*,p.project_code,p.project_name,s.site_code,s.site_name,sc.contractor_code,sc.contractor_name')
            ->join('projects p', 'p.id=d.project_id', 'left')
            ->join('project_sites s', 's.id=d.site_id')
            ->join('subcontractors sc', 'sc.id=d.subcontractor_id')
            ->where('d.company_id', $companyId)
            ->where('d.deleted_at', null);

        foreach (['project_id', 'site_id', 'subcontractor_id'] as $field) {
            $v = $this->request->getGet($field);
            if (ctype_digit((string) ($v ?? ''))) $b->where('d.' . $field, (int) $v);
        }

        $date = trim((string) ($this->request->getGet('date') ?? ''));
        if ($date !== '') $b->where('d.wage_date', $date);

        $from = trim((string) ($this->request->getGet('from_date') ?? ''));
        $to   = trim((string) ($this->request->getGet('to_date') ?? ''));
        if ($from !== '') $b->where('d.wage_date >=', $from);
        if ($to !== '') $b->where('d.wage_date <=', $to);

        $search = trim((string) ($this->request->getGet('search') ?? ''));
        if ($search !== '') {
            $b->groupStart()
                ->like('sc.contractor_name', $search)
                ->orLike('sc.contractor_code', $search)
                ->orLike('s.site_name', $search)
                ->groupEnd();
        }

        return $this->ok(
            'Daily wage entries retrieved successfully.',
            'daily_wages',
            $b->orderBy('d.wage_date', 'DESC')->orderBy('d.id', 'DESC')->get()->getResultArray()
        );
    }

    public function show(int $id): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();

        $companyId = $this->companyId($u);
        $row = db_connect()->table('daily_wage_registers d')
            ->select('d.*,p.project_code,p.project_name,s.site_code,s.site_name,sc.contractor_code,sc.contractor_name')
            ->join('projects p', 'p.id=d.project_id', 'left')
            ->join('project_sites s', 's.id=d.site_id')
            ->join('subcontractors sc', 'sc.id=d.subcontractor_id')
            ->where('d.id', $id)
            ->where('d.company_id', $companyId)
            ->where('d.deleted_at', null)
            ->get()->getRowArray();

        if ($row === null) return $this->notFound();

        $row['lines'] = db_connect()->table('daily_wage_register_lines l')
            ->select('l.*')
            ->where('l.daily_wage_register_id', $id)
            ->orderBy('l.display_order')
            ->orderBy('l.id')
            ->get()->getResultArray();

        return $this->ok('Daily wage entry retrieved successfully.', 'daily_wage', $row);
    }

    /**
     * Data needed by the frontend form.
     * GET /api/daily-wages/setup?project_id=1&site_id=1&subcontractor_id=1
     */
    public function setup(): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);

        $projects = db_connect()->table('projects p')
            ->select('p.id,p.project_code,p.project_name,p.branch_id')
            ->where('p.company_id', $companyId)
            ->where('p.deleted_at', null)
            ->orderBy('p.project_name')
            ->get()->getResultArray();

        $sitesBuilder = db_connect()->table('project_sites s')
            ->select('s.id,s.project_id,s.site_code,s.site_name,s.address_line1,s.city')
            ->where('s.company_id', $companyId)
            ->where('s.deleted_at', null);
        $projectId = $this->request->getGet('project_id');
        if (ctype_digit((string) ($projectId ?? ''))) $sitesBuilder->where('s.project_id', (int) $projectId);
        $sites = $sitesBuilder->orderBy('s.site_name')->get()->getResultArray();

        $activeStatus = db_connect()->table('subcontractors_status_masters')
            ->select('id')->where('status_code', 'ACTIVE')->where('is_active', 1)->get()->getRowArray();

        $subsBuilder = db_connect()->table('subcontractors sc')
            ->select('sc.id,sc.contractor_code,sc.contractor_name,sc.contractor_type_id,ct.contractor_type_code,ct.contractor_type_name')
            ->join('subcontractors_contractor_type_masters ct', 'ct.id=sc.contractor_type_id', 'left')
            ->where('sc.company_id', $companyId)
            ->where('sc.deleted_at', null);
        if ($activeStatus) $subsBuilder->where('sc.status_id', (int) $activeStatus['id']);
        $subcontractors = $subsBuilder->orderBy('sc.contractor_name')->get()->getResultArray();

        $subcontractorTypes = db_connect()->table('subcontractors_contractor_type_masters')
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get()->getResultArray();

        $templates = [];
        $subcontractorId = $this->request->getGet('subcontractor_id');
        if (ctype_digit((string) ($subcontractorId ?? ''))) {
            $templates = db_connect()->table('daily_wage_item_templates')
                ->where('company_id', $companyId)
                ->where('subcontractor_id', (int) $subcontractorId)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->orderBy('display_order')
                ->orderBy('description')
                ->get()->getResultArray();

            // Fallback to type or global defaults if subcontractor has no specific templates
            if (empty($templates)) {
                $sub = db_connect()->table('subcontractors')->select('contractor_type_id')->where('id', (int) $subcontractorId)->get()->getRowArray();
                $typeId = $sub ? (int) $sub['contractor_type_id'] : null;

                $fb = db_connect()->table('daily_wage_item_templates')
                    ->where('company_id', $companyId)
                    ->where('is_active', 1)
                    ->where('deleted_at', null)
                    ->groupStart()
                        ->where('subcontractor_id', null);
                if ($typeId) {
                    $fb->orWhere('subcontractor_type_id', $typeId);
                }
                $templates = $fb->groupEnd()
                    ->orderBy('display_order')
                    ->orderBy('description')
                    ->get()->getResultArray();
            }
        } else {
            // Global default templates
            $templates = db_connect()->table('daily_wage_item_templates')
                ->where('company_id', $companyId)
                ->where('subcontractor_id', null)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->orderBy('display_order')
                ->orderBy('description')
                ->get()->getResultArray();
        }

        return $this->ok('Daily wage setup retrieved successfully.', 'setup', [
            'projects' => $projects,
            'sites' => $sites,
            'subcontractors' => $subcontractors,
            'subcontractor_types' => $subcontractorTypes,
            'templates' => $templates,
            'classifications' => self::CLASSIFICATIONS,
        ]);
    }

    public function templates(): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);

        $b = db_connect()->table('daily_wage_item_templates t')
            ->select('t.*,sc.contractor_code,sc.contractor_name,ct.contractor_type_name')
            ->join('subcontractors sc', 'sc.id=t.subcontractor_id', 'left')
            ->join('subcontractors_contractor_type_masters ct', 'ct.id=t.subcontractor_type_id', 'left')
            ->where('t.company_id', $companyId)
            ->where('t.deleted_at', null);

        $sub = $this->request->getGet('subcontractor_id');
        if (ctype_digit((string) ($sub ?? ''))) {
            $b->groupStart()
                ->where('t.subcontractor_id', (int) $sub)
                ->orWhere('t.subcontractor_id', null)
                ->groupEnd();
        }
        $active = $this->request->getGet('is_active');
        if (in_array((string) $active, ['0', '1'], true)) $b->where('t.is_active', (int) $active);

        return $this->ok('Daily wage templates retrieved successfully.', 'templates', $b->orderBy('t.display_order')->orderBy('t.id')->get()->getResultArray());
    }

    public function createTemplate(): ResponseInterface
    {
        return $this->saveTemplate(null);
    }

    public function updateTemplate(int $id): ResponseInterface
    {
        return $this->saveTemplate($id);
    }

    public function deleteTemplate(int $id): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);
        $row = $this->record('daily_wage_item_templates', $id, $companyId, true);
        if ($row === null) return $this->notFound();

        db_connect()->table('daily_wage_item_templates')->where(['id' => $id, 'company_id' => $companyId])->update([
            'is_active' => 0,
            'deleted_at' => $this->now(),
            'updated_by' => (int) $u->id,
            'updated_at' => $this->now(),
        ]);
        return $this->ok('Daily wage template deleted successfully.', 'id', $id);
    }

    /**
     * Payload:
     * {
     *   project_id, site_id, subcontractor_id, wage_date, global_remarks,
     *   lines:[{template_id?, description, classification, uom, quantity, rate, remarks?}]
     * }
     */
    public function create(): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $in = $this->input();
        if ($in === null) return $this->invalid(['body' => 'A valid JSON request body is required.']);

        $companyId = $this->companyId($u);
        $errors = $this->validateHeaderAndLines($in, $u);
        if ($errors) return $this->invalid($errors);

        $existing = db_connect()->table('daily_wage_registers')
            ->select('id')
            ->where('company_id', $companyId)
            ->where('site_id', (int) $in['site_id'])
            ->where('subcontractor_id', (int) $in['subcontractor_id'])
            ->where('wage_date', $in['wage_date'])
            ->where('deleted_at', null)
            ->get()->getRowArray();
        if ($existing) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false,
                'message' => 'A daily wage entry already exists for this subcontractor, site and date.',
                'data' => ['existing_id' => (int) $existing['id']],
            ]);
        }

        $db = db_connect();
        $db->transBegin();
        try {
            $header = [
                'company_id' => $companyId,
                'project_id' => (int) $in['project_id'],
                'site_id' => (int) $in['site_id'],
                'subcontractor_id' => (int) $in['subcontractor_id'],
                'wage_date' => (string) $in['wage_date'],
                'total_amount' => 0,
                'global_remarks' => trim((string) ($in['global_remarks'] ?? '')) ?: null,
                'status' => 'SUBMITTED',
                'created_by' => (int) $u->id,
                'updated_by' => (int) $u->id,
                'created_at' => $this->now(),
                'updated_at' => $this->now(),
            ];
            $db->table('daily_wage_registers')->insert($header);
            $id = (int) $db->insertID();
            $total = $this->insertLines($db, $id, $companyId, (array) $in['lines'], (int) $u->id);
            $db->table('daily_wage_registers')->where('id', $id)->update(['total_amount' => $total]);

            if ($db->transStatus() === false) throw new \RuntimeException('Database transaction failed.');
            $db->transCommit();
            return $this->show($id);
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->serverError('Daily wage entry could not be saved.', $e);
        }
    }

    public function update(int $id): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);
        $existing = $this->record('daily_wage_registers', $id, $companyId, true);
        if ($existing === null) return $this->notFound();

        $in = $this->input();
        if ($in === null) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $merged = array_merge($existing, $in);
        if (!array_key_exists('lines', $merged)) {
            $merged['lines'] = db_connect()->table('daily_wage_register_lines')->where('daily_wage_register_id', $id)->get()->getResultArray();
        }
        $errors = $this->validateHeaderAndLines($merged, $u);
        if ($errors) return $this->invalid($errors);

        $duplicate = db_connect()->table('daily_wage_registers')
            ->select('id')
            ->where('company_id', $companyId)
            ->where('site_id', (int) $merged['site_id'])
            ->where('subcontractor_id', (int) $merged['subcontractor_id'])
            ->where('wage_date', $merged['wage_date'])
            ->where('id !=', $id)
            ->where('deleted_at', null)
            ->get()->getRowArray();
        if ($duplicate) return $this->response->setStatusCode(409)->setJSON(['success'=>false,'message'=>'Another daily wage entry already exists for this subcontractor, site and date.']);

        $db = db_connect();
        $db->transBegin();
        try {
            $header = [
                'project_id' => (int) $merged['project_id'],
                'site_id' => (int) $merged['site_id'],
                'subcontractor_id' => (int) $merged['subcontractor_id'],
                'wage_date' => (string) $merged['wage_date'],
                'global_remarks' => trim((string) ($merged['global_remarks'] ?? '')) ?: null,
                'updated_by' => (int) $u->id,
                'updated_at' => $this->now(),
            ];
            $db->table('daily_wage_registers')->where(['id'=>$id,'company_id'=>$companyId])->update($header);

            if (array_key_exists('lines', $in)) {
                $db->table('daily_wage_register_lines')->where('daily_wage_register_id', $id)->delete();
                $total = $this->insertLines($db, $id, $companyId, (array) $in['lines'], (int) $u->id);
                $db->table('daily_wage_registers')->where('id', $id)->update(['total_amount' => $total]);
            }

            if ($db->transStatus() === false) throw new \RuntimeException('Database transaction failed.');
            $db->transCommit();
            return $this->show($id);
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->serverError('Daily wage entry could not be updated.', $e);
        }
    }

    public function cancel(int $id): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);
        $row = $this->record('daily_wage_registers', $id, $companyId, true);
        if ($row === null) return $this->notFound();

        db_connect()->table('daily_wage_registers')->where(['id'=>$id,'company_id'=>$companyId])->update([
            'status' => 'CANCELLED',
            'updated_by' => (int) $u->id,
            'updated_at' => $this->now(),
        ]);
        return $this->show($id);
    }

    public function weeklyReport(): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);

        $siteId = $this->request->getGet('site_id');
        $subcontractorId = $this->request->getGet('subcontractor_id');
        $startDate = trim((string) ($this->request->getGet('start_date') ?? ''));
        $endDate = trim((string) ($this->request->getGet('end_date') ?? ''));

        // Default to current week (Monday to Sunday)
        if ($startDate === '' || $endDate === '') {
            $startDate = date('Y-m-d', strtotime('monday this week'));
            $endDate = date('Y-m-d', strtotime('sunday this week'));
        }

        $b = db_connect()->table('daily_wage_registers r')
            ->select('r.id, r.site_id, r.subcontractor_id, r.wage_date, r.total_amount, r.status, s.site_name, s.site_code, sc.contractor_name, sc.contractor_code')
            ->join('project_sites s', 's.id=r.site_id')
            ->join('subcontractors sc', 'sc.id=r.subcontractor_id')
            ->where('r.company_id', $companyId)
            ->where('r.wage_date >=', $startDate)
            ->where('r.wage_date <=', $endDate)
            ->where('r.deleted_at', null);

        if (ctype_digit((string) ($siteId ?? '')) && (int)$siteId > 0) {
            $b->where('r.site_id', (int) $siteId);
        }
        if (ctype_digit((string) ($subcontractorId ?? '')) && (int)$subcontractorId > 0) {
            $b->where('r.subcontractor_id', (int) $subcontractorId);
        }

        $registers = $b->orderBy('r.wage_date', 'ASC')->get()->getResultArray();
        $registerIds = array_column($registers, 'id');

        $lines = [];
        if (!empty($registerIds)) {
            $lines = db_connect()->table('daily_wage_register_lines l')
                ->select('l.*, r.wage_date, r.site_id, r.subcontractor_id, sc.contractor_name')
                ->join('daily_wage_registers r', 'r.id=l.daily_wage_register_id')
                ->join('subcontractors sc', 'sc.id=r.subcontractor_id')
                ->whereIn('l.daily_wage_register_id', $registerIds)
                ->where('l.deleted_at', null)
                ->orderBy('l.display_order', 'ASC')
                ->get()->getResultArray();
        }

        $dates = [];
        $current = strtotime($startDate);
        $last = strtotime($endDate);
        while ($current <= $last) {
            $dates[] = date('Y-m-d', $current);
            $current = strtotime('+1 day', $current);
        }

        $tradeMatrix = [];
        $grandTotalShifts = 0.0;
        $grandTotalAmount = 0.0;

        foreach ($lines as $line) {
            $key = $line['subcontractor_id'] . '__' . $line['description'];
            if (!isset($tradeMatrix[$key])) {
                $tradeMatrix[$key] = [
                    'subcontractor_id' => $line['subcontractor_id'],
                    'contractor_name' => $line['contractor_name'],
                    'description' => $line['description'],
                    'classification' => $line['classification'],
                    'uom' => $line['uom'],
                    'rate' => (float) $line['rate'],
                    'daily_shifts' => array_fill_keys($dates, 0.0),
                    'total_shifts' => 0.0,
                    'total_amount' => 0.0,
                ];
            }

            $date = $line['wage_date'];
            $qty = (float) $line['quantity'];
            $amt = (float) $line['amount'];

            if (isset($tradeMatrix[$key]['daily_shifts'][$date])) {
                $tradeMatrix[$key]['daily_shifts'][$date] += $qty;
            }
            $tradeMatrix[$key]['total_shifts'] += $qty;
            $tradeMatrix[$key]['total_amount'] += $amt;

            $grandTotalShifts += $qty;
            $grandTotalAmount += $amt;
        }

        return $this->ok('Weekly wage report generated successfully.', 'report', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'dates' => $dates,
            'matrix' => array_values($tradeMatrix),
            'registers' => $registers,
            'grand_total_shifts' => round($grandTotalShifts, 2),
            'grand_total_amount' => round($grandTotalAmount, 2),
        ]);
    }

    private function saveTemplate(?int $id): ResponseInterface
    {
        $u = $this->user();
        if ($u === null) return $this->unauthorized();
        $companyId = $this->companyId($u);
        $in = $this->input();
        if ($in === null) return $this->invalid(['body'=>'A valid JSON request body is required.']);

        $old = $id ? $this->record('daily_wage_item_templates', $id, $companyId, true) : null;
        if ($id && $old === null) return $this->notFound();
        $m = array_merge($old ?? [], $in);
        $errors = $this->required($m, ['description','classification','uom','default_rate']);
        if (!empty($m['subcontractor_id']) && !$this->activeSubcontractor((int) $m['subcontractor_id'], $companyId)) {
            $errors['subcontractor_id'] = 'Select a valid active subcontractor.';
        }
        if (!in_array((string) ($m['classification'] ?? ''), self::CLASSIFICATIONS, true)) $errors['classification'] = 'Classification must be Manpower, Equipment or Expense.';
        if (!is_numeric($m['default_rate'] ?? null) || (float) $m['default_rate'] < 0) $errors['default_rate'] = 'Default rate must be zero or greater.';
        if ($errors) return $this->invalid($errors);

        $data = [
            'subcontractor_id' => !empty($m['subcontractor_id']) ? (int) $m['subcontractor_id'] : null,
            'subcontractor_type_id' => !empty($m['subcontractor_type_id']) ? (int) $m['subcontractor_type_id'] : null,
            'description' => trim((string) $m['description']),
            'classification' => (string) $m['classification'],
            'uom' => trim((string) $m['uom']),
            'default_rate' => round((float) $m['default_rate'], 2),
            'display_order' => (int) ($m['display_order'] ?? 0),
            'is_active' => isset($m['is_active']) ? (int) (bool) $m['is_active'] : 1,
            'updated_by' => (int) $u->id,
            'updated_at' => $this->now(),
        ];
        if (!$id) $data += ['company_id'=>$companyId,'created_by'=>(int)$u->id,'created_at'=>$this->now()];

        $b = db_connect()->table('daily_wage_item_templates');
        $id ? $b->where(['id'=>$id,'company_id'=>$companyId])->update($data) : $b->insert($data);
        $id ??= (int) db_connect()->insertID();
        return $this->ok('Daily wage template saved successfully.', 'template', $this->record('daily_wage_item_templates', $id, $companyId, true), $old ? 200 : 201);
    }

    private function validateHeaderAndLines(array &$in, object $u): array
    {
        $companyId = $this->companyId($u);

        // Auto-resolve project_id from site_id
        if (empty($in['project_id']) && !empty($in['site_id'])) {
            $siteRow = db_connect()->table('project_sites')->select('project_id')->where('id', (int) $in['site_id'])->get()->getRowArray();
            $in['project_id'] = $siteRow ? (int) $siteRow['project_id'] : 0;
        }

        $errors = $this->required($in, ['site_id','subcontractor_id','wage_date','lines']);

        if (!$this->activeSubcontractor((int) ($in['subcontractor_id'] ?? 0), $companyId)) {
            $errors['subcontractor_id'] = 'Select a valid active subcontractor.';
        }
        if (!$this->validDate((string) ($in['wage_date'] ?? ''))) $errors['wage_date'] = 'Use date format YYYY-MM-DD.';

        $lines = $in['lines'] ?? null;
        if (!is_array($lines) || count($lines) === 0) {
            $errors['lines'] = 'Enter at least one daily wage item.';
            return $errors;
        }

        $usable = 0;
        foreach ($lines as $i => $line) {
            if (!is_array($line)) { $errors['lines.' . $i] = 'Invalid line.'; continue; }
            $prefix = 'lines.' . $i . '.';
            if (trim((string) ($line['description'] ?? '')) === '') $errors[$prefix.'description'] = 'Item description is required.';
            if (!in_array((string) ($line['classification'] ?? ''), self::CLASSIFICATIONS, true)) $errors[$prefix.'classification'] = 'Use Manpower, Equipment or Expense.';
            if (trim((string) ($line['uom'] ?? '')) === '') $errors[$prefix.'uom'] = 'Unit is required.';
            if (!is_numeric($line['quantity'] ?? null) || (float) $line['quantity'] <= 0) $errors[$prefix.'quantity'] = 'Quantity must be greater than zero.';
            if (!is_numeric($line['rate'] ?? null) || (float) $line['rate'] < 0) $errors[$prefix.'rate'] = 'Rate must be zero or greater.';
            if (is_numeric($line['quantity'] ?? null) && (float) $line['quantity'] > 0 && is_numeric($line['rate'] ?? null) && (float) $line['rate'] >= 0) $usable++;
        }
        if ($usable === 0) $errors['lines'] = 'Enter at least one item with quantity greater than zero.';
        return $errors;
    }

    private function insertLines(object $db, int $registerId, int $companyId, array $lines, int $userId): float
    {
        $total = 0.0;
        $order = 1;
        foreach ($lines as $line) {
            if (!is_array($line)) continue;
            $qty = round((float) ($line['quantity'] ?? 0), 4);
            if ($qty <= 0) continue;
            $rate = round((float) ($line['rate'] ?? 0), 2);
            $amount = round($qty * $rate, 2);
            $db->table('daily_wage_register_lines')->insert([
                'company_id' => $companyId,
                'daily_wage_register_id' => $registerId,
                'template_id' => !empty($line['template_id']) ? (int) $line['template_id'] : null,
                'description' => trim((string) $line['description']),
                'classification' => (string) $line['classification'],
                'uom' => trim((string) $line['uom']),
                'quantity' => $qty,
                'rate' => $rate,
                'amount' => $amount,
                'remarks' => trim((string) ($line['remarks'] ?? '')) ?: null,
                'display_order' => (int) ($line['display_order'] ?? $order),
                'created_by' => $userId,
                'created_at' => $this->now(),
            ]);
            $total += $amount;
            $order++;
        }
        return round($total, 2);
    }

    private function activeSubcontractor(int $id, int $companyId): bool
    {
        if ($id <= 0) return false;
        $active = db_connect()->table('subcontractors_status_masters')
            ->select('id')->where('status_code', 'ACTIVE')->where('is_active', 1)->get()->getRowArray();
        $b = db_connect()->table('subcontractors')->where('id', $id)->where('company_id', $companyId)->where('deleted_at', null);
        if ($active) $b->where('status_id', (int) $active['id']);
        return $b->countAllResults() > 0;
    }

    private function validDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d !== false && $d->format('Y-m-d') === $date;
    }
}
