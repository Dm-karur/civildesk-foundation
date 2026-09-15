<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;

class SubcontractMastersController extends SubcontractApiController
{
    public function index(): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $db = db_connect();
        $map = [
            'contractor_types'      => ['subcontractors_contractor_type_masters', 'sort_order'],
            'contractor_statuses'   => ['subcontractors_status_masters', 'sort_order'],
            'document_statuses'     => ['subcontractor_documents_verification_status_masters', 'sort_order'],
            'work_order_statuses'   => ['subcontract_work_orders_status_masters', 'sort_order'],
            'measurement_statuses'  => ['subcontract_measurements_status_masters', 'sort_order'],
            'bill_statuses'         => ['subcontract_ra_bills_status_masters', 'sort_order'],
            'bill_payment_statuses' => ['subcontract_ra_bills_payment_status_masters', 'sort_order'],
            'payment_modes'         => ['subcontract_payments_payment_mode_masters', 'sort_order'],
            'payment_statuses'      => ['subcontract_payments_status_masters', 'sort_order'],
        ];
        $out = [];
        foreach ($map as $k => [$t, $o]) {
            $out[$k] = $db->table($t)->where('is_active', 1)->orderBy($o)->get()->getResultArray();
        }
        $out['document_types'] = $db->table('document_types')
            ->where(['company_id' => $this->company($u), 'is_active' => 1])
            ->where('deleted_at', null)
            ->orderBy('display_order')
            ->get()
            ->getResultArray();

        return $this->ok('Subcontract masters retrieved successfully.', 'masters', $out);
    }

    public function contractors(): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $b = db_connect()->table('subcontractors c')
            ->select('c.*, t.contractor_type_code, t.contractor_type_name, s.status_code, s.status_name')
            ->join('subcontractors_contractor_type_masters t', 't.id = c.contractor_type_id', 'left')
            ->join('subcontractors_status_masters s', 's.id = c.status_id', 'left')
            ->where('c.company_id', $this->company($u))
            ->where('c.deleted_at', null);

        $q = trim((string) $this->request->getGet('search'));
        if ($q !== '') {
            $b->groupStart()
                ->like('c.contractor_code', $q)
                ->orLike('c.contractor_name', $q)
                ->orLike('c.phone', $q)
                ->groupEnd();
        }

        $typeId = $this->request->getGet('contractor_type_id');
        if ($typeId !== null && $typeId !== '' && $typeId !== 'all') {
            $b->where('c.contractor_type_id', (int) $typeId);
        }

        $status = $this->request->getGet('status');
        if ($status !== null && $status !== '' && $status !== 'all') {
            if (is_numeric($status)) {
                $b->where('c.status_id', (int) $status);
            } else {
                $b->where('s.status_code', strtoupper((string) $status));
            }
        }

        return $this->ok(
            'Subcontractors retrieved successfully.',
            'subcontractors',
            $b->orderBy('c.id', 'DESC')->get()->getResultArray()
        );
    }

    public function contractor(int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $r = $this->row('subcontractors', $id, $this->company($u));
        if (!$r) return $this->missing();

        $t = db_connect()->table('subcontractors_contractor_type_masters')->where('id', (int)$r['contractor_type_id'])->get()->getRowArray();
        $s = db_connect()->table('subcontractors_status_masters')->where('id', (int)$r['status_id'])->get()->getRowArray();
        $r['contractor_type_code'] = $t['contractor_type_code'] ?? null;
        $r['contractor_type_name'] = $t['contractor_type_name'] ?? null;
        $r['status_code'] = $s['status_code'] ?? null;
        $r['status_name'] = $s['status_name'] ?? null;

        $r['documents'] = db_connect()->table('subcontractor_documents')
            ->where(['company_id' => $this->company($u), 'contractor_id' => $id])
            ->where('deleted_at', null)
            ->orderBy('id', 'DESC')
            ->get()
            ->getResultArray();

        return $this->ok('Subcontractor retrieved successfully.', 'subcontractor', $r);
    }

    public function create(): ResponseInterface
    {
        return $this->save(null);
    }

    public function update(int $id): ResponseInterface
    {
        return $this->save($id);
    }

    public function delete(int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $c = $this->company($u);
        $old = $this->row('subcontractors', $id, $c);
        if (!$old) return $this->missing();

        $now = $this->now();
        db_connect()->table('subcontractors')
            ->where('id', $id)
            ->where('company_id', $c)
            ->update([
                'deleted_at' => $now,
                'updated_by' => (int) $u->id,
                'updated_at' => $now,
            ]);

        $this->logStatus(
            'CONTRACTOR',
            $id,
            $this->code('subcontractors_status_masters', 'status_code', (int) $old['status_id']),
            'DELETED',
            'DELETED',
            $c,
            (int) $u->id,
            'Subcontractor deleted'
        );

        return $this->ok('Subcontractor deleted successfully.', 'id', $id);
    }

    public function toggleStatus(int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $c = $this->company($u);
        $old = $this->row('subcontractors', $id, $c);
        if (!$old) return $this->missing();

        $currentStatusId = (int) ($old['status_id'] ?? 1);
        $newStatusId = ($currentStatusId === 1) ? 2 : 1;
        $newStatusCode = ($newStatusId === 1) ? 'ACTIVE' : 'INACTIVE';
        $oldStatusCode = $this->code('subcontractors_status_masters', 'status_code', $currentStatusId);

        $now = $this->now();
        db_connect()->table('subcontractors')
            ->where('id', $id)
            ->where('company_id', $c)
            ->update([
                'status_id'  => $newStatusId,
                'updated_by' => (int) $u->id,
                'updated_at' => $now,
            ]);

        $this->logStatus(
            'CONTRACTOR',
            $id,
            $oldStatusCode,
            $newStatusCode,
            'STATUS_CHANGED',
            $c,
            (int) $u->id,
            'Status changed to ' . $newStatusCode
        );

        return $this->contractor($id);
    }

    private function save(?int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $in = $this->input();
        if ($in === null) return $this->invalid(['body' => 'A valid JSON body is required.']);
        $c = $this->company($u);
        $old = $id ? $this->row('subcontractors', $id, $c) : null;
        if ($id && !$old) return $this->missing();

        // Support flexible subcontractor_type_id mapping
        if (!isset($in['contractor_type_id']) && isset($in['subcontractor_type_id'])) {
            $in['contractor_type_id'] = (int) $in['subcontractor_type_id'];
        }

        // Support flexible active/inactive status mapping
        if (isset($in['is_active'])) {
            $in['status_id'] = !empty($in['is_active']) ? 1 : 2;
        } elseif (isset($in['status'])) {
            $s = strtolower(trim((string) $in['status']));
            if ($s === 'inactive' || $s === '2') $in['status_id'] = 2;
            elseif ($s === 'active' || $s === '1') $in['status_id'] = 1;
        }

        if (!isset($in['status_id']) && $id === null) {
            $in['status_id'] = 1; // Default Active
        }

        // Auto-generate code if empty on create
        if ($id === null && empty($in['contractor_code'])) {
            $nextNum = db_connect()->table('subcontractors')->where('company_id', $c)->countAllResults() + 1;
            $in['contractor_code'] = 'SC-' . date('Y') . '-' . str_pad((string) $nextNum, 3, '0', STR_PAD_LEFT);
        }

        // Support bank details and contact person shortcuts
        if (!isset($in['bank_account_no']) && isset($in['account_no'])) {
            $in['bank_account_no'] = $in['account_no'];
        }
        if (!isset($in['bank_ifsc']) && isset($in['ifsc'])) {
            $in['bank_ifsc'] = $in['ifsc'];
        }
        if (empty($in['contact_person']) && !empty($in['contractor_name'])) {
            $in['contact_person'] = $in['contractor_name'];
        }

        $fs = [
            'contractor_code', 'contractor_name', 'contractor_type_id', 'contact_person',
            'phone', 'alternate_phone', 'email', 'gstin', 'pan', 'address_line1', 'address_line2',
            'city', 'district', 'state_name', 'postal_code', 'bank_name', 'bank_account_name',
            'bank_account_no', 'bank_ifsc', 'default_retention_percent', 'default_tds_percent',
            'payment_terms_days', 'status_id', 'notes'
        ];
        $d = array_intersect_key($in, array_flip($fs));
        $m = array_merge($old ?? [], $d);
        $e = $this->required($m, ['contractor_code', 'contractor_name', 'contractor_type_id', 'status_id']);

        foreach ([
            ['subcontractors_contractor_type_masters', 'contractor_type_id'],
            ['subcontractors_status_masters', 'status_id']
        ] as [$t, $f]) {
            if (!$this->masterId($t, $f === 'contractor_type_id' ? 'contractor_type_code' : 'status_code', $this->code($t, $f === 'contractor_type_id' ? 'contractor_type_code' : 'status_code', (int) ($m[$f] ?? 0)))) {
                $e[$f] = 'Select a valid active master value.';
            }
        }

        $dup = db_connect()->table('subcontractors')->where(['company_id' => $c, 'contractor_code' => $m['contractor_code'] ?? ''])->where('deleted_at', null);
        if ($id) $dup->where('id !=', $id);
        if ($dup->countAllResults()) $e['contractor_code'] = 'Contractor code already exists.';

        if ($e) return $this->invalid($e);

        $d['updated_by'] = (int) $u->id;
        $d['updated_at'] = $this->now();
        $db = db_connect();

        if ($id) {
            $db->table('subcontractors')->where('id', $id)->update($d);
            if (isset($d['status_id']) && (int)$d['status_id'] !== (int)($old['status_id'] ?? 0)) {
                $oldCode = $this->code('subcontractors_status_masters', 'status_code', (int)($old['status_id'] ?? 1));
                $newCode = $this->code('subcontractors_status_masters', 'status_code', (int)$d['status_id']);
                $this->logStatus('CONTRACTOR', $id, $oldCode, $newCode, 'STATUS_CHANGED', $c, (int)$u->id, null);
            }
        } else {
            $d += ['company_id' => $c, 'created_by' => (int) $u->id, 'created_at' => $this->now()];
            $db->table('subcontractors')->insert($d);
            $id = (int) $db->insertID();
            $this->logStatus('CONTRACTOR', $id, null, $this->code('subcontractors_status_masters', 'status_code', (int) $d['status_id']), 'CREATED', $c, (int) $u->id, null);
        }

        return $this->contractor($id);
    }

    public function addDocument(int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $c = $this->company($u);
        if (!$this->row('subcontractors', $id, $c)) return $this->missing();
        $in = $this->input() ?? [];
        $e = $this->required($in, ['document_name', 'file_name', 'file_path']);
        if ($e) return $this->invalid($e);

        $d = array_intersect_key($in, array_flip(['document_type_id', 'document_name', 'document_number', 'issue_date', 'expiry_date', 'file_name', 'file_path', 'remarks']));
        $d += [
            'company_id'             => $c,
            'contractor_id'          => $id,
            'verification_status_id' => $this->masterId('subcontractor_documents_verification_status_masters', 'verification_status_code', 'PENDING'),
            'created_by'             => (int) $u->id,
            'created_at'             => $this->now(),
        ];
        db_connect()->table('subcontractor_documents')->insert($d);

        return $this->ok('Subcontractor document created successfully.', 'document', $this->row('subcontractor_documents', (int) db_connect()->insertID(), $c), 201);
    }

    public function verifyDocument(int $id, int $doc): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $c = $this->company($u);
        $r = $this->row('subcontractor_documents', $doc, $c);
        if (!$r || (int) $r['contractor_id'] !== $id) return $this->missing();

        $in = $this->input() ?? [];
        $code = strtoupper((string) ($in['status_code'] ?? 'VERIFIED'));
        if (!in_array($code, ['VERIFIED', 'REJECTED', 'EXPIRED'], true)) return $this->invalid(['status_code' => 'Use VERIFIED, REJECTED or EXPIRED.']);

        $sid = $this->masterId('subcontractor_documents_verification_status_masters', 'verification_status_code', $code);
        db_connect()->table('subcontractor_documents')->where('id', $doc)->update([
            'verification_status_id' => $sid,
            'verified_by'            => (int) $u->id,
            'verified_at'            => $this->now(),
            'remarks'                => $in['remarks'] ?? $r['remarks'],
        ]);

        return $this->ok('Document status updated successfully.', 'document', $this->row('subcontractor_documents', $doc, $c));
    }

    private function ensureTemplateTable(): void
    {
        $db = db_connect();
        $db->query("
            CREATE TABLE IF NOT EXISTS `subcontractor_type_template_items` (
                `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `company_id` BIGINT UNSIGNED NULL,
                `subcontractor_type_id` BIGINT UNSIGNED NOT NULL,
                `sort_order` INT NOT NULL DEFAULT 1,
                `item_description` VARCHAR(255) NOT NULL,
                `classification` VARCHAR(50) NOT NULL DEFAULT 'manpower',
                `unit` VARCHAR(50) NOT NULL DEFAULT 'Nos',
                `default_rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                `maistry_scope` TINYINT(1) NOT NULL DEFAULT 0,
                `status` TINYINT(1) NOT NULL DEFAULT 1,
                `created_by` BIGINT UNSIGNED NULL,
                `updated_by` BIGINT UNSIGNED NULL,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                `deleted_at` DATETIME NULL,
                INDEX `idx_sc_tmpl_type` (`subcontractor_type_id`),
                INDEX `idx_sc_tmpl_company` (`company_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    }

    public function types(): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $this->ensureTemplateTable();
        $db = db_connect();

        $types = $db->table('subcontractors_contractor_type_masters')
            ->orderBy('sort_order', 'ASC')
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        // Seed default types if empty
        if (empty($types)) {
            $defaults = [
                ['contractor_type_code' => 'SUB-MAIS', 'contractor_type_name' => 'Maistry', 'sort_order' => 1, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-CARP', 'contractor_type_name' => 'Carpenter', 'sort_order' => 2, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-CENT', 'contractor_type_name' => 'Centering', 'sort_order' => 3, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-BAR',  'contractor_type_name' => 'Bar Bender', 'sort_order' => 4, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-MASN', 'contractor_type_name' => 'Mason', 'sort_order' => 5, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-ELEC', 'contractor_type_name' => 'Electrician', 'sort_order' => 6, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-PLMB', 'contractor_type_name' => 'Plumber', 'sort_order' => 7, 'is_active' => 1],
                ['contractor_type_code' => 'SUB-PNT',  'contractor_type_name' => 'Painter', 'sort_order' => 8, 'is_active' => 1],
            ];
            foreach ($defaults as $d) {
                $db->table('subcontractors_contractor_type_masters')->insert($d);
            }
            $types = $db->table('subcontractors_contractor_type_masters')
                ->orderBy('sort_order', 'ASC')
                ->get()
                ->getResultArray();
        }

        // Attach template items count
        foreach ($types as &$t) {
            $t['type_code'] = $t['contractor_type_code'] ?? '';
            $t['type_name'] = $t['contractor_type_name'] ?? '';
            $t['template_count'] = (int) $db->table('subcontractor_type_template_items')
                ->where('subcontractor_type_id', (int) $t['id'])
                ->where('deleted_at', null)
                ->countAllResults();
        }
        unset($t);

        return $this->ok('Subcontractor types retrieved successfully.', 'types', $types);
    }

    public function saveType(?int $id = null): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $in = $this->input() ?? [];

        $name = trim((string) ($in['type_name'] ?? $in['contractor_type_name'] ?? ''));
        if ($name === '') return $this->invalid(['type_name' => 'Type name is required.']);

        $db = db_connect();
        $code = trim((string) ($in['type_code'] ?? $in['contractor_type_code'] ?? ''));
        if ($code === '') {
            $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 4));
            $code = 'SUB-' . ($prefix ?: 'TYPE') . '-' . rand(100, 999);
        }

        $data = [
            'contractor_type_code' => $code,
            'contractor_type_name' => $name,
            'is_active'            => isset($in['is_active']) ? (int) $in['is_active'] : 1,
            'sort_order'           => isset($in['sort_order']) ? (int) $in['sort_order'] : 1,
        ];

        if ($id) {
            $db->table('subcontractors_contractor_type_masters')->where('id', $id)->update($data);
        } else {
            $db->table('subcontractors_contractor_type_masters')->insert($data);
            $id = (int) $db->insertID();
        }

        $row = $db->table('subcontractors_contractor_type_masters')->where('id', $id)->get()->getRowArray();
        if ($row) {
            $row['type_code'] = $row['contractor_type_code'];
            $row['type_name'] = $row['contractor_type_name'];
        }

        return $this->ok('Subcontractor type saved successfully.', 'type', $row);
    }

    public function deleteType(int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        db_connect()->table('subcontractors_contractor_type_masters')->where('id', $id)->delete();
        return $this->ok('Subcontractor type deleted successfully.', 'id', $id);
    }

    public function typeTemplates(int $typeId): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $this->ensureTemplateTable();
        $db = db_connect();

        $items = $db->table('subcontractor_type_template_items')
            ->where('subcontractor_type_id', $typeId)
            ->where('deleted_at', null)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        return $this->ok('Template items retrieved successfully.', 'templates', $items);
    }

    public function createTypeTemplate(int $typeId): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();
        $c = $this->company($u);

        $this->ensureTemplateTable();
        $in = $this->input() ?? [];

        $desc = trim((string) ($in['item_description'] ?? $in['description'] ?? ''));
        if ($desc === '') return $this->invalid(['item_description' => 'Item description is required.']);

        $classification = strtolower(trim((string) ($in['classification'] ?? 'manpower')));
        if (!in_array($classification, ['manpower', 'equipment', 'expense', 'others'], true)) {
            $classification = 'manpower';
        }

        $db = db_connect();
        $sortOrder = isset($in['sort_order']) && is_numeric($in['sort_order']) ? (int) $in['sort_order'] : null;
        if ($sortOrder === null || $sortOrder <= 0) {
            $maxOrder = $db->table('subcontractor_type_template_items')
                ->selectMax('sort_order')
                ->where('subcontractor_type_id', $typeId)
                ->where('deleted_at', null)
                ->get()
                ->getRowArray();
            $sortOrder = ((int) ($maxOrder['sort_order'] ?? 0)) + 1;
        }

        $maistryScope = !empty($in['maistry_scope']) || !empty($in['calculate_maistry']) ? 1 : 0;
        $status = isset($in['status']) ? (int) $in['status'] : (isset($in['is_active']) ? (!empty($in['is_active']) ? 1 : 0) : 1);
        $rate = isset($in['default_rate']) ? (float) $in['default_rate'] : 0.00;
        $unit = trim((string) ($in['unit'] ?? $in['uom'] ?? 'Nos')) ?: 'Nos';

        $data = [
            'company_id'            => $c,
            'subcontractor_type_id' => $typeId,
            'sort_order'            => $sortOrder,
            'item_description'      => $desc,
            'classification'        => $classification,
            'unit'                  => $unit,
            'default_rate'          => $rate,
            'maistry_scope'         => $maistryScope,
            'status'                => $status,
            'created_by'            => (int) $u->id,
            'created_at'            => $this->now(),
        ];

        $db->table('subcontractor_type_template_items')->insert($data);
        $newId = (int) $db->insertID();
        $row = $db->table('subcontractor_type_template_items')->where('id', $newId)->get()->getRowArray();

        return $this->ok('Template item created successfully.', 'template', $row, 201);
    }

    public function updateTypeTemplate(int $typeId, int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $this->ensureTemplateTable();
        $db = db_connect();

        $existing = $db->table('subcontractor_type_template_items')
            ->where('id', $id)
            ->where('subcontractor_type_id', $typeId)
            ->where('deleted_at', null)
            ->get()
            ->getRowArray();

        if (!$existing) return $this->missing('Template item not found.');

        $in = $this->input() ?? [];
        $update = [
            'updated_by' => (int) $u->id,
            'updated_at' => $this->now(),
        ];

        if (isset($in['item_description']) || isset($in['description'])) {
            $desc = trim((string) ($in['item_description'] ?? $in['description']));
            if ($desc !== '') $update['item_description'] = $desc;
        }

        if (isset($in['classification'])) {
            $classification = strtolower(trim((string) $in['classification']));
            if (in_array($classification, ['manpower', 'equipment', 'expense', 'others'], true)) {
                $update['classification'] = $classification;
            }
        }

        if (isset($in['unit']) || isset($in['uom'])) {
            $update['unit'] = trim((string) ($in['unit'] ?? $in['uom'])) ?: 'Nos';
        }

        if (isset($in['default_rate'])) {
            $update['default_rate'] = (float) $in['default_rate'];
        }

        if (isset($in['maistry_scope']) || isset($in['calculate_maistry'])) {
            $update['maistry_scope'] = (!empty($in['maistry_scope']) || !empty($in['calculate_maistry'])) ? 1 : 0;
        }

        if (isset($in['status'])) {
            $update['status'] = (int) $in['status'];
        } elseif (isset($in['is_active'])) {
            $update['status'] = !empty($in['is_active']) ? 1 : 0;
        }

        if (isset($in['sort_order']) && is_numeric($in['sort_order'])) {
            $update['sort_order'] = (int) $in['sort_order'];
        }

        $db->table('subcontractor_type_template_items')->where('id', $id)->update($update);
        $row = $db->table('subcontractor_type_template_items')->where('id', $id)->get()->getRowArray();

        return $this->ok('Template item updated successfully.', 'template', $row);
    }

    public function deleteTypeTemplate(int $typeId, int $id): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $this->ensureTemplateTable();
        $db = db_connect();

        $existing = $db->table('subcontractor_type_template_items')
            ->where('id', $id)
            ->where('subcontractor_type_id', $typeId)
            ->where('deleted_at', null)
            ->get()
            ->getRowArray();

        if (!$existing) return $this->missing('Template item not found.');

        $db->table('subcontractor_type_template_items')->where('id', $id)->update([
            'deleted_at' => $this->now(),
            'updated_by' => (int) $u->id,
            'updated_at' => $this->now(),
        ]);

        return $this->ok('Template item deleted successfully.', 'id', $id);
    }

    public function reorderTypeTemplates(int $typeId): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $this->ensureTemplateTable();
        $db = db_connect();
        $in = $this->input() ?? [];

        $itemIds = $in['item_ids'] ?? [];
        if (is_array($itemIds)) {
            $order = 1;
            foreach ($itemIds as $itemId) {
                $db->table('subcontractor_type_template_items')
                    ->where('id', (int) $itemId)
                    ->where('subcontractor_type_id', $typeId)
                    ->update(['sort_order' => $order++]);
            }
        }

        $items = $db->table('subcontractor_type_template_items')
            ->where('subcontractor_type_id', $typeId)
            ->where('deleted_at', null)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        return $this->ok('Template items reordered successfully.', 'templates', $items);
    }

    public function contractorTemplates(int $contractorId): ResponseInterface
    {
        $u = $this->user();
        if (!$u) return $this->unauthorized();

        $c = $this->company($u);
        $con = db_connect()->table('subcontractors')
            ->where('id', $contractorId)
            ->where('company_id', $c)
            ->where('deleted_at', null)
            ->get()
            ->getRowArray();

        if (!$con) return $this->missing('Subcontractor not found.');

        $typeId = (int) ($con['contractor_type_id'] ?? 0);
        $this->ensureTemplateTable();
        $db = db_connect();

        $items = [];
        if ($typeId > 0) {
            $items = $db->table('subcontractor_type_template_items')
                ->where('subcontractor_type_id', $typeId)
                ->where('deleted_at', null)
                ->orderBy('sort_order', 'ASC')
                ->orderBy('id', 'ASC')
                ->get()
                ->getResultArray();
        }

        if (empty($items)) {
            $items = $db->table('subcontractor_type_template_items')
                ->whereIn('subcontractor_type_id', [8, 1])
                ->where('deleted_at', null)
                ->orderBy('sort_order', 'ASC')
                ->orderBy('id', 'ASC')
                ->get()
                ->getResultArray();
        }

        return $this->ok('Contractor template items retrieved successfully.', 'templates', $items);
    }
}


