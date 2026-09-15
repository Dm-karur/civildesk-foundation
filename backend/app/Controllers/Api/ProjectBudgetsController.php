<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectBudgetLineModel;
use App\Models\ProjectBudgetModel;
use App\Services\BudgetNotificationService;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectBudgetsController extends BaseController
{
    private ProjectBudgetModel $budgets;
    private ProjectBudgetLineModel $lines;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->budgets = new ProjectBudgetModel();
        $this->lines = new ProjectBudgetLineModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        try {
            $query = $this->budgetQuery()->where('project_budgets.company_id', (int) $user->company_id);
            $projectId = $this->positiveGet('project_id');
            if ($projectId !== null) {
                if ($this->accessibleProject($projectId, $user) === null) return $this->notFound();
                $query->where('project_budgets.project_id', $projectId);
            } else {
                $branchIds = $this->authorization->getAccessibleBranchIds($user);
                if ($branchIds === []) return $this->okList([]);
                $query->groupStart()->whereIn('projects.branch_id', $branchIds)->orWhere('projects.branch_id', null)->groupEnd();
            }
            foreach (['status_id', 'financial_year_id', 'source_boq_id'] as $field) {
                $value = $this->positiveGet($field);
                if ($value !== null) $query->where('project_budgets.' . $field, $value);
            }
            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') $query->groupStart()->like('project_budgets.budget_code', $search)
                ->orLike('project_budgets.budget_name', $search)->orLike('projects.project_name', $search)->groupEnd();
            return $this->okList($query->orderBy('project_budgets.id', 'DESC')->findAll());
        } catch (Throwable $e) { return $this->serverError('Project budget list retrieval failed.', $e); }
    }

    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($id, $user);
        if ($budget === null) return $this->notFound();
        return $this->response->setJSON(['success' => true, 'message' => 'Project budget retrieved successfully.',
            'data' => ['project_budget' => $this->budgetQuery()->find($id), 'summary' => $this->summary($id)]]);
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $input = $this->request->getJSON(true);
        if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $status = $this->master('project_budgets_status_masters', 'status_code', 'DRAFT');
        if ($status === null) return $this->configurationError('The active DRAFT budget status is not configured.');
        $data = array_intersect_key($input, array_flip(['project_id', 'financial_year_id', 'source_boq_id', 'budget_code',
            'budget_name', 'version_no', 'budget_date', 'currency_code', 'notes']));
        $data += ['financial_year_id' => null, 'source_boq_id' => null, 'version_no' => 1, 'currency_code' => 'INR', 'notes' => null];
        $project = $this->accessibleProject((int) ($data['project_id'] ?? 0), $user, true);
        if ($project === null) return $this->invalid(['project_id' => 'Select a project you are permitted to operate.']);
        $data += ['direct_cost' => 0, 'overhead_cost' => 0, 'contingency_amount' => 0, 'total_budget' => 0];
        $data['company_id'] = (int) $user->company_id; $data['status_id'] = (int) $status['id'];
        $data['created_by'] = (int) $user->id; $data['updated_by'] = (int) $user->id;
        $errors = $this->validateHeaderReferences($data);
        if ($errors !== []) return $this->invalid($errors);
        if ($this->duplicateBudget($data)) return $this->invalid(['budget_code' => 'This budget code and version already exist for the project.']);
        try {
            if (! $this->budgets->insert($data)) return $this->invalid($this->budgets->errors());
            $id = (int) $this->budgets->getInsertID();
            return $this->response->setStatusCode(201)->setJSON(['success' => true, 'message' => 'Project budget created successfully.',
                'data' => ['project_budget' => $this->budgetQuery()->find($id), 'summary' => $this->summary($id)]]);
        } catch (DatabaseException $e) { return $this->databaseConflict($e); }
        catch (Throwable $e) { return $this->serverError('Project budget creation failed.', $e); }
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $existing = $this->accessibleBudget($id, $user, true); if ($existing === null) return $this->notFound();
        if ((string) $existing['status_code'] !== 'DRAFT') return $this->conflict('Only a draft project budget can be updated.');
        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        $data = array_intersect_key($input, array_flip(['financial_year_id', 'source_boq_id', 'budget_code', 'budget_name',
            'version_no', 'budget_date', 'currency_code', 'notes']));
        if ($data === []) return $this->invalid(['body' => 'No writable project budget fields were supplied.']);
        $merged = array_merge($existing, $data); $errors = $this->validateHeaderReferences($merged);
        if ($errors !== []) return $this->invalid($errors);
        if ($this->duplicateBudget($merged, $id)) return $this->invalid(['budget_code' => 'This budget code and version already exist for the project.']);
        $data['updated_by'] = (int) $user->id;
        try {
            if (! $this->budgets->update($id, $data)) return $this->invalid($this->budgets->errors());
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget updated successfully.',
                'data' => ['project_budget' => $this->budgetQuery()->find($id), 'summary' => $this->summary($id)]]);
        } catch (DatabaseException $e) { return $this->databaseConflict($e); }
        catch (Throwable $e) { return $this->serverError('Project budget update failed.', $e); }
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($id, $user, true); if ($budget === null) return $this->notFound();
        if ((string) $budget['status_code'] !== 'DRAFT') return $this->conflict('Only a draft project budget can be deleted.');
        if ($this->lines->where('budget_id', $id)->countAllResults() > 0) return $this->conflict('Delete all active budget lines before deleting this budget.');
        try {
            $this->budgets->update($id, ['updated_by' => (int) $user->id]);
            if (! $this->budgets->delete($id)) throw new DatabaseException('Unable to delete project budget.');
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget deleted successfully.']);
        } catch (DatabaseException $e) { return $this->databaseConflict($e); }
        catch (Throwable $e) { return $this->serverError('Project budget deletion failed.', $e); }
    }

    public function submit(int $id): ResponseInterface
    {
        return $this->transition($id, 'DRAFT', 'SUBMITTED', 'SUBMITTED');
    }

    public function approve(int $id): ResponseInterface
    {
        return $this->transition($id, 'SUBMITTED', 'APPROVED', 'APPROVED');
    }

    public function reject(int $id): ResponseInterface
    {
        return $this->transition($id, 'SUBMITTED', 'REJECTED', 'REJECTED');
    }

    public function approvalHistory(int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($id, $user) === null) return $this->notFound();
        $db = db_connect();
        $approvals = $db->table('budget_approvals ba')->select('ba.*, am.action_code, am.action_name, u.employee_code, u.first_name, u.last_name')
            ->join('budget_approvals_action_masters am', 'am.id=ba.action_id')
            ->join('users u', 'u.id=ba.action_by', 'left')->where('ba.company_id', (int) $user->company_id)
            ->where('ba.budget_id', $id)->where('ba.revision_id', null)->orderBy('ba.id', 'ASC')->get()->getResultArray();
        $logs = $db->table('budget_status_logs bsl')->select('bsl.*, fs.from_status_code, fs.from_status_name, ts.to_status_code, ts.to_status_name, u.employee_code, u.first_name, u.last_name')
            ->join('budget_status_logs_from_status_masters fs', 'fs.id=bsl.from_status_id', 'left')
            ->join('budget_status_logs_to_status_masters ts', 'ts.id=bsl.to_status_id')
            ->join('users u', 'u.id=bsl.changed_by', 'left')->where('bsl.company_id', (int) $user->company_id)
            ->where('bsl.budget_id', $id)->orderBy('bsl.id', 'ASC')->get()->getResultArray();
        return $this->response->setJSON(['success' => true, 'message' => 'Budget approval history retrieved successfully.',
            'data' => ['approvals' => $approvals, 'status_logs' => $logs]]);
    }

    public function revisions(int $budgetId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user) === null) return $this->notFound();
        $rows = $this->revisionQuery()->where('br.company_id', (int) $user->company_id)->where('br.budget_id', $budgetId)
            ->orderBy('br.revision_no', 'DESC')->get()->getResultArray();
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revisions retrieved successfully.', 'data' => ['budget_revisions' => $rows]]);
    }

    public function showRevision(int $budgetId, int $revisionId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user) === null) return $this->notFound();
        $revision = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id);
        if ($revision === null) return $this->revisionNotFound();
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revision retrieved successfully.',
            'data' => ['budget_revision' => $revision, 'revision_lines' => $this->revisionLines($revisionId)]]);
    }

    public function createRevision(int $budgetId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($budgetId, $user, true); if ($budget === null) return $this->notFound();
        if ((string) $budget['status_code'] !== 'APPROVED') return $this->conflict('Only an approved project budget can be revised.');
        $input = $this->request->getJSON(true); if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $date = trim((string) ($input['revision_date'] ?? '')); $reason = trim((string) ($input['reason'] ?? ''));
        $errors = []; if ($date === '' || date_create_from_format('Y-m-d', $date) === false) $errors['revision_date'] = 'A valid revision date in Y-m-d format is required.';
        if ($reason === '') $errors['reason'] = 'The revision reason is required.'; if ($errors !== []) return $this->invalid($errors);
        $status = $this->master('budget_revisions_status_masters', 'status_code', 'DRAFT');
        if ($status === null) return $this->configurationError('The active DRAFT revision status is not configured.');
        $db = db_connect();
        try {
            $db->transBegin();
            $locked = $db->query('SELECT id,total_budget FROM project_budgets WHERE id=? AND company_id=? AND deleted_at IS NULL FOR UPDATE', [$budgetId, (int) $user->company_id])->getRowArray();
            if ($locked === null) { $db->transRollback(); return $this->notFound(); }
            $open = $db->table('budget_revisions br')->join('budget_revisions_status_masters sm', 'sm.id=br.status_id')
                ->where('br.budget_id', $budgetId)->whereIn('sm.status_code', ['DRAFT','SUBMITTED'])->countAllResults();
            if ($open > 0) { $db->transRollback(); return $this->conflict('Complete or delete the existing open revision before creating another revision.'); }
            $max = $db->table('budget_revisions')->selectMax('revision_no', 'max_no')->where('budget_id', $budgetId)->get()->getRowArray();
            $total = round((float) $locked['total_budget'], 2); $data = ['company_id' => (int) $budget['company_id'], 'project_id' => (int) $budget['project_id'],
                'budget_id' => $budgetId, 'revision_no' => (int) ($max['max_no'] ?? 0) + 1, 'revision_date' => $date, 'reason' => $reason,
                'previous_total' => $total, 'revised_total' => $total, 'variance_amount' => 0, 'status_id' => (int) $status['id'],
                'requested_by' => (int) $user->id, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')];
            if (! $db->table('budget_revisions')->insert($data)) throw new DatabaseException('Unable to create budget revision.');
            $revisionId = (int) $db->insertID(); if ($db->transStatus() === false) throw new DatabaseException('Unable to create budget revision.');
            $db->transCommit();
            return $this->response->setStatusCode(201)->setJSON(['success' => true, 'message' => 'Budget revision created successfully.',
                'data' => ['budget_revision' => $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Budget revision creation failed.', $e); }
    }

    public function updateRevision(int $budgetId, int $revisionId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user, true) === null) return $this->notFound();
        $revision = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id); if ($revision === null) return $this->revisionNotFound();
        if ((string) $revision['status_code'] !== 'DRAFT') return $this->conflict('Only a draft budget revision can be updated.');
        $input = $this->request->getJSON(true); if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        $data = array_intersect_key($input, array_flip(['revision_date','reason'])); if ($data === []) return $this->invalid(['body' => 'No writable revision fields were supplied.']);
        $errors = []; if (isset($data['revision_date']) && date_create_from_format('Y-m-d', trim((string) $data['revision_date'])) === false) $errors['revision_date'] = 'A valid revision date in Y-m-d format is required.';
        if (isset($data['reason']) && trim((string) $data['reason']) === '') $errors['reason'] = 'The revision reason is required.'; if ($errors !== []) return $this->invalid($errors);
        $data['updated_at'] = date('Y-m-d H:i:s'); db_connect()->table('budget_revisions')->where('id', $revisionId)->update($data);
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revision updated successfully.', 'data' => ['budget_revision' => $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id)]]);
    }

    public function deleteRevision(int $budgetId, int $revisionId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user, true) === null) return $this->notFound();
        $revision = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id); if ($revision === null) return $this->revisionNotFound();
        if ((string) $revision['status_code'] !== 'DRAFT') return $this->conflict('Only a draft budget revision can be deleted.');
        db_connect()->table('budget_revisions')->where('id', $revisionId)->delete();
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revision deleted successfully.']);
    }

    public function createRevisionLine(int $budgetId, int $revisionId): ResponseInterface { return $this->saveRevisionLine($budgetId, $revisionId, null); }
    public function updateRevisionLine(int $budgetId, int $revisionId, int $lineId): ResponseInterface { return $this->saveRevisionLine($budgetId, $revisionId, $lineId); }

    public function deleteRevisionLine(int $budgetId, int $revisionId, int $lineId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user, true) === null) return $this->notFound();
        $revision = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id); if ($revision === null) return $this->revisionNotFound();
        if ((string) $revision['status_code'] !== 'DRAFT') return $this->conflict('Revision lines can be deleted only from a draft revision.');
        $db = db_connect(); if ($db->table('budget_revision_lines')->where('id', $lineId)->where('revision_id', $revisionId)->countAllResults() === 0) return $this->revisionLineNotFound();
        $db->table('budget_revision_lines')->where('id', $lineId)->delete(); $this->recalculateRevision($revisionId);
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revision line deleted successfully.', 'data' => ['budget_revision' => $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id)]]);
    }

    private function saveRevisionLine(int $budgetId, int $revisionId, ?int $lineId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user, true) === null) return $this->notFound();
        $revision = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id); if ($revision === null) return $this->revisionNotFound();
        if ((string) $revision['status_code'] !== 'DRAFT') return $this->conflict('Revision lines can be changed only in a draft revision.');
        $input = $this->request->getJSON(true); if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $db = db_connect(); $existing = null;
        if ($lineId !== null) { $existing = $db->table('budget_revision_lines')->where('id', $lineId)->where('revision_id', $revisionId)->get()->getRowArray(); if ($existing === null) return $this->revisionLineNotFound(); }
        $budgetLineId = (int) ($input['budget_line_id'] ?? $existing['budget_line_id'] ?? 0);
        $budgetLine = $db->table('project_budget_lines')->where('id', $budgetLineId)->where('budget_id', $budgetId)->where('company_id', (int) $user->company_id)->where('deleted_at', null)->get()->getRowArray();
        if ($budgetLine === null) return $this->invalid(['budget_line_id' => 'Select an active line from this approved budget.']);
        $changeTypeId = (int) ($input['change_type_id'] ?? $existing['change_type_id'] ?? 0);
        $change = $this->master('budget_revision_lines_change_type_masters', 'id', (string) $changeTypeId, true);
        if ($change === null) return $this->invalid(['change_type_id' => 'Select an active revision change type.']);
        $duplicate = $db->table('budget_revision_lines')->where('revision_id', $revisionId)->where('budget_line_id', $budgetLineId); if ($lineId !== null) $duplicate->where('id !=', $lineId);
        if ($duplicate->countAllResults() > 0) return $this->invalid(['budget_line_id' => 'This budget line is already included in the revision.']);
        $quantity = (float) ($input['revised_quantity'] ?? $existing['revised_quantity'] ?? $budgetLine['planned_quantity']);
        $rate = (float) ($input['revised_rate'] ?? $existing['revised_rate'] ?? $budgetLine['planned_rate']);
        if ($quantity < 0 || $rate < 0) return $this->invalid(['values' => 'Revised quantity and rate must be zero or greater.']);
        if ((string) $change['change_type_code'] === 'REMOVE') { $quantity = 0; $rate = 0; }
        $previousAmount = round((float) $budgetLine['planned_amount'], 2); $revisedAmount = round($quantity * $rate, 2);
        $data = ['revision_id' => $revisionId, 'budget_line_id' => $budgetLineId, 'change_type_id' => $changeTypeId,
            'previous_quantity' => (float) $budgetLine['planned_quantity'], 'revised_quantity' => $quantity,
            'previous_rate' => (float) $budgetLine['planned_rate'], 'revised_rate' => $rate, 'previous_amount' => $previousAmount,
            'revised_amount' => $revisedAmount, 'variance_amount' => round($revisedAmount - $previousAmount, 2),
            'reason' => trim((string) ($input['reason'] ?? $existing['reason'] ?? '')) ?: null];
        if ($lineId === null) { $data['created_at'] = date('Y-m-d H:i:s'); $db->table('budget_revision_lines')->insert($data); $lineId = (int) $db->insertID(); $code = 201; }
        else { $db->table('budget_revision_lines')->where('id', $lineId)->update($data); $code = 200; }
        $this->recalculateRevision($revisionId);
        return $this->response->setStatusCode($code)->setJSON(['success' => true, 'message' => 'Budget revision line ' . ($code === 201 ? 'created' : 'updated') . ' successfully.',
            'data' => ['revision_line' => $db->table('budget_revision_lines')->where('id', $lineId)->get()->getRowArray(), 'budget_revision' => $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id)]]);
    }

    public function submitRevision(int $budgetId, int $revisionId): ResponseInterface { return $this->transitionRevision($budgetId, $revisionId, 'DRAFT', 'SUBMITTED', 'SUBMITTED'); }
    public function approveRevision(int $budgetId, int $revisionId): ResponseInterface { return $this->transitionRevision($budgetId, $revisionId, 'SUBMITTED', 'APPROVED', 'APPROVED'); }
    public function rejectRevision(int $budgetId, int $revisionId): ResponseInterface { return $this->transitionRevision($budgetId, $revisionId, 'SUBMITTED', 'REJECTED', 'REJECTED'); }

    public function revisionHistory(int $budgetId, int $revisionId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user) === null) return $this->notFound();
        if ($this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id) === null) return $this->revisionNotFound();
        $rows = db_connect()->table('budget_approvals ba')->select('ba.*,am.action_code,am.action_name,u.employee_code,u.first_name,u.last_name')
            ->join('budget_approvals_action_masters am', 'am.id=ba.action_id')->join('users u', 'u.id=ba.action_by', 'left')
            ->where('ba.company_id', (int) $user->company_id)->where('ba.budget_id', $budgetId)->where('ba.revision_id', $revisionId)->orderBy('ba.id', 'ASC')->get()->getResultArray();
        return $this->response->setJSON(['success' => true, 'message' => 'Budget revision history retrieved successfully.', 'data' => ['approvals' => $rows]]);
    }

    private function transitionRevision(int $budgetId, int $revisionId, string $required, string $targetCode, string $actionCode): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($budgetId, $user, true); if ($budget === null) return $this->notFound();
        $input = $this->request->getJSON(true); $comments = is_array($input) ? trim((string) ($input['comments'] ?? '')) : '';
        if (mb_strlen($comments) > 500) return $this->invalid(['comments' => 'Comments cannot exceed 500 characters.']);
        $target = $this->master('budget_revisions_status_masters', 'status_code', $targetCode); $action = $this->master('budget_approvals_action_masters', 'action_code', $actionCode);
        if ($target === null || $action === null) return $this->configurationError('The budget revision workflow master data is incomplete.');
        $db = db_connect();
        try {
            $db->transBegin();
            $revision = $db->query('SELECT br.*,sm.status_code FROM budget_revisions br INNER JOIN budget_revisions_status_masters sm ON sm.id=br.status_id WHERE br.id=? AND br.budget_id=? AND br.company_id=? FOR UPDATE', [$revisionId,$budgetId,(int) $user->company_id])->getRowArray();
            if ($revision === null) { $db->transRollback(); return $this->revisionNotFound(); }
            if ((string) $revision['status_code'] !== $required) { $db->transRollback(); return $this->conflict('Only a ' . strtolower($required) . ' budget revision can be ' . strtolower($actionCode) . '.'); }
            $lineCount = $db->table('budget_revision_lines')->where('revision_id', $revisionId)->countAllResults();
            if ($actionCode === 'SUBMITTED' && $lineCount === 0) { $db->transRollback(); return $this->conflict('Add at least one revision line before submission.'); }
            if ($actionCode === 'APPROVED' && (string) $budget['status_code'] !== 'APPROVED') { $db->transRollback(); return $this->conflict('The source budget must remain approved before applying a revision.'); }
            $now = date('Y-m-d H:i:s'); $update = ['status_id' => (int) $target['id'], 'updated_at' => $now];
            if ($actionCode === 'SUBMITTED') $update += ['submitted_at' => $now, 'decided_by' => null, 'decided_at' => null, 'decision_note' => null];
            else $update += ['decided_by' => (int) $user->id, 'decided_at' => $now, 'decision_note' => $comments === '' ? null : $comments];
            if (! $db->table('budget_revisions')->where('id', $revisionId)->where('status_id', (int) $revision['status_id'])->update($update) || $db->affectedRows() !== 1) throw new DatabaseException('Unable to change revision status.');
            if ($actionCode === 'APPROVED') {
                foreach ($db->table('budget_revision_lines rl')->select('rl.*,ct.change_type_code')->join('budget_revision_lines_change_type_masters ct', 'ct.id=rl.change_type_id')->where('rl.revision_id', $revisionId)->get()->getResultArray() as $line) {
                    $base = $db->table('project_budget_lines')->where('id', (int) $line['budget_line_id'])->where('budget_id', $budgetId)->where('deleted_at', null)->get()->getRowArray();
                    if ($base === null || round((float) $base['planned_quantity'],4) !== round((float) $line['previous_quantity'],4) || round((float) $base['planned_rate'],4) !== round((float) $line['previous_rate'],4)) throw new DatabaseException('A source budget line changed after the revision was prepared.');
                    if ((string) $line['change_type_code'] === 'REMOVE') $db->table('project_budget_lines')->where('id', (int) $line['budget_line_id'])->update(['deleted_at' => $now, 'updated_by' => (int) $user->id, 'updated_at' => $now]);
                    else $db->table('project_budget_lines')->where('id', (int) $line['budget_line_id'])->update(['planned_quantity' => $line['revised_quantity'], 'planned_rate' => $line['revised_rate'], 'planned_amount' => $line['revised_amount'], 'updated_by' => (int) $user->id, 'updated_at' => $now]);
                }
                $this->recalculate($budgetId);
            }
            if (! $db->table('budget_approvals')->insert(['company_id' => (int) $budget['company_id'], 'project_id' => (int) $budget['project_id'], 'budget_id' => $budgetId,
                'revision_id' => $revisionId, 'approval_level' => 1, 'action_id' => (int) $action['id'], 'action_by' => (int) $user->id, 'action_at' => $now, 'comments' => $comments === '' ? null : $comments])) throw new DatabaseException('Unable to record revision approval history.');
            if ($db->transStatus() === false) throw new DatabaseException('Unable to complete revision workflow.'); $db->transCommit();
            $fresh = $this->accessibleRevision($budgetId, $revisionId, (int) $user->company_id) ?? array_merge($revision, $update);
            try { (new BudgetNotificationService())->notifyRevision($budget, $fresh, 'BUDGET_REVISION_' . $actionCode, (int) $user->id); }
            catch (Throwable $e) { log_message('error', 'Budget revision notification failed: {error}', ['error' => $e->getMessage()]); }
            return $this->response->setJSON(['success' => true, 'message' => 'Budget revision ' . strtolower($actionCode) . ' successfully.',
                'data' => ['budget_revision' => $fresh, 'project_budget' => $this->budgetQuery()->find($budgetId), 'summary' => $this->summary($budgetId)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Budget revision status change failed.', $e); }
    }

    private function revisionQuery()
    {
        return db_connect()->table('budget_revisions br')->select('br.*,sm.status_code,sm.status_name,ru.employee_code requested_by_code,ru.first_name requested_by_first_name,ru.last_name requested_by_last_name,du.employee_code decided_by_code,du.first_name decided_by_first_name,du.last_name decided_by_last_name')
            ->join('budget_revisions_status_masters sm', 'sm.id=br.status_id')->join('users ru', 'ru.id=br.requested_by', 'left')->join('users du', 'du.id=br.decided_by', 'left');
    }

    private function accessibleRevision(int $budgetId, int $revisionId, int $companyId): ?array
    {
        return $this->revisionQuery()->where('br.id', $revisionId)->where('br.budget_id', $budgetId)->where('br.company_id', $companyId)->get()->getRowArray();
    }

    private function revisionLines(int $revisionId): array
    {
        return db_connect()->table('budget_revision_lines rl')->select('rl.*,ct.change_type_code,ct.change_type_name,bl.line_code,bl.line_description')
            ->join('budget_revision_lines_change_type_masters ct', 'ct.id=rl.change_type_id')->join('project_budget_lines bl', 'bl.id=rl.budget_line_id')
            ->where('rl.revision_id', $revisionId)->orderBy('rl.id', 'ASC')->get()->getResultArray();
    }

    private function recalculateRevision(int $revisionId): void
    {
        $db = db_connect(); $revision = $db->table('budget_revisions')->select('previous_total')->where('id', $revisionId)->get()->getRowArray();
        if ($revision === null) return; $variance = (float) (($db->table('budget_revision_lines')->selectSum('variance_amount', 'total')->where('revision_id', $revisionId)->get()->getRowArray())['total'] ?? 0);
        $previous = (float) $revision['previous_total']; $db->table('budget_revisions')->where('id', $revisionId)->update(['variance_amount' => round($variance,2), 'revised_total' => round($previous + $variance,2), 'updated_at' => date('Y-m-d H:i:s')]);
    }

    private function transition(int $id, string $requiredCode, string $targetCode, string $actionCode): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $input = $this->request->getJSON(true); $comments = is_array($input) ? trim((string) ($input['comments'] ?? '')) : '';
        if (mb_strlen($comments) > 1000) return $this->invalid(['comments' => 'Comments cannot exceed 1000 characters.']);
        $target = $this->master('project_budgets_status_masters', 'status_code', $targetCode);
        $action = $this->master('budget_approvals_action_masters', 'action_code', $actionCode);
        $fromLog = $this->master('budget_status_logs_from_status_masters', 'from_status_code', $requiredCode);
        $toLog = $this->master('budget_status_logs_to_status_masters', 'to_status_code', $targetCode);
        if ($target === null || $action === null || $fromLog === null || $toLog === null)
            return $this->configurationError('The budget workflow master data is incomplete.');
        $db = db_connect();
        try {
            $db->transBegin();
            $budget = $db->query('SELECT pb.*, p.branch_id, p.project_name, sm.status_code FROM project_budgets pb INNER JOIN projects p ON p.id=pb.project_id AND p.company_id=pb.company_id INNER JOIN project_budgets_status_masters sm ON sm.id=pb.status_id WHERE pb.id=? AND pb.company_id=? AND pb.deleted_at IS NULL AND p.deleted_at IS NULL FOR UPDATE', [$id, (int) $user->company_id])->getRowArray();
            if ($budget === null || $this->accessibleProject((int) $budget['project_id'], $user, true) === null) { $db->transRollback(); return $this->notFound(); }
            if ((string) $budget['status_code'] !== $requiredCode) { $db->transRollback(); return $this->conflict('Only a ' . strtolower($requiredCode) . ' project budget can be ' . strtolower($actionCode) . '.'); }
            if ($actionCode === 'SUBMITTED' && $this->lines->where('budget_id', $id)->countAllResults() === 0) { $db->transRollback(); return $this->conflict('Add at least one active budget line before submission.'); }
            $now = date('Y-m-d H:i:s'); $update = ['status_id' => (int) $target['id'], 'updated_by' => (int) $user->id];
            if ($actionCode === 'SUBMITTED') $update += ['submitted_by' => (int) $user->id, 'submitted_at' => $now, 'approved_by' => null, 'approved_at' => null];
            elseif ($actionCode === 'APPROVED') $update += ['approved_by' => (int) $user->id, 'approved_at' => $now];
            else $update += ['approved_by' => null, 'approved_at' => null];
            if (! $db->table('project_budgets')->where('id', $id)->where('status_id', (int) $budget['status_id'])->update($update) || $db->affectedRows() !== 1)
                throw new DatabaseException('Unable to change the project budget status.');
            $common = ['company_id' => (int) $budget['company_id'], 'project_id' => (int) $budget['project_id'], 'budget_id' => $id];
            if (! $db->table('budget_approvals')->insert($common + ['revision_id' => null, 'approval_level' => 1, 'action_id' => (int) $action['id'], 'action_by' => (int) $user->id, 'action_at' => $now, 'comments' => $comments === '' ? null : $comments]))
                throw new DatabaseException('Unable to record budget approval history.');
            if (! $db->table('budget_status_logs')->insert($common + ['from_status_id' => (int) $fromLog['id'], 'to_status_id' => (int) $toLog['id'], 'change_reason' => $comments === '' ? null : $comments, 'changed_by' => (int) $user->id, 'changed_at' => $now]))
                throw new DatabaseException('Unable to record budget status history.');
            if ($db->transStatus() === false) throw new DatabaseException('Unable to complete budget workflow.');
            $db->transCommit();
            try { (new BudgetNotificationService())->notify(array_merge($budget, $update), 'BUDGET_' . $actionCode, (int) $user->id); }
            catch (Throwable $e) { log_message('error', 'Budget notification processing failed: {error}', ['error' => $e->getMessage()]); }
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget ' . strtolower($actionCode) . ' successfully.',
                'data' => ['project_budget' => $this->budgetQuery()->find($id), 'summary' => $this->summary($id)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Project budget status change failed.', $e); }
    }

    public function lines(int $budgetId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user) === null) return $this->notFound();
        try {
            $query = $this->lineQuery()->where('project_budget_lines.company_id', (int) $user->company_id)
                ->where('project_budget_lines.budget_id', $budgetId);
            foreach (['cost_type_id', 'work_category_id', 'site_id', 'work_zone_id', 'boq_item_id'] as $field) {
                $value = $this->positiveGet($field); if ($value !== null) $query->where('project_budget_lines.' . $field, $value);
            }
            $search = trim((string) ($this->request->getGet('search') ?? ''));
            if ($search !== '') $query->groupStart()->like('project_budget_lines.line_code', $search)
                ->orLike('project_budget_lines.line_description', $search)->orLike('project_budget_lines.notes', $search)->groupEnd();
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget lines retrieved successfully.',
                'data' => ['budget_lines' => $query->orderBy('project_budget_lines.display_order', 'ASC')->orderBy('project_budget_lines.id', 'ASC')->findAll(),
                    'summary' => $this->summary($budgetId)]]);
        } catch (Throwable $e) { return $this->serverError('Project budget line list retrieval failed.', $e); }
    }

    public function showLine(int $budgetId, int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        if ($this->accessibleBudget($budgetId, $user) === null) return $this->notFound();
        $line = $this->lineQuery()->where('project_budget_lines.budget_id', $budgetId)->find($id);
        if ($line === null) return $this->lineNotFound();
        return $this->response->setJSON(['success' => true, 'message' => 'Project budget line retrieved successfully.', 'data' => ['budget_line' => $line]]);
    }

    public function createLine(int $budgetId): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($budgetId, $user, true); if ($budget === null) return $this->notFound();
        if ((string) $budget['status_code'] !== 'DRAFT') return $this->conflict('Lines can be added only to a draft project budget.');
        $input = $this->request->getJSON(true); if (! is_array($input)) return $this->invalid(['body' => 'A valid JSON request body is required.']);
        $data = $this->lineWritable($input) + ['boq_item_id' => null, 'site_id' => null, 'work_zone_id' => null,
            'planned_quantity' => 0, 'uom_id' => null, 'planned_rate' => 0, 'display_order' => 0, 'notes' => null];
        $data['company_id'] = (int) $budget['company_id']; $data['project_id'] = (int) $budget['project_id']; $data['budget_id'] = $budgetId;
        $data['planned_amount'] = $this->plannedAmount($data); $data['committed_amount'] = 0; $data['actual_amount'] = 0;
        $data['created_by'] = (int) $user->id; $data['updated_by'] = (int) $user->id;
        $errors = $this->validateLineReferences($data); if ($errors !== []) return $this->invalid($errors);
        $db = db_connect();
        try {
            $db->transBegin();
            if (! $this->lines->insert($data)) { $db->transRollback(); return $this->invalid($this->lines->errors()); }
            $id = (int) $this->lines->getInsertID(); $this->recalculate($budgetId);
            if ($db->transStatus() === false) throw new DatabaseException('Unable to create budget line.'); $db->transCommit();
            return $this->response->setStatusCode(201)->setJSON(['success' => true, 'message' => 'Project budget line created successfully.',
                'data' => ['budget_line' => $this->lineQuery()->find($id), 'summary' => $this->summary($budgetId)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Project budget line creation failed.', $e); }
    }

    public function updateLine(int $budgetId, int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($budgetId, $user, true); if ($budget === null) return $this->notFound();
        if ((string) $budget['status_code'] !== 'DRAFT') return $this->conflict('Lines can be updated only in a draft project budget.');
        $existing = $this->lines->where('company_id', (int) $user->company_id)->where('budget_id', $budgetId)->find($id);
        if ($existing === null) return $this->lineNotFound();
        $input = $this->request->getJSON(true); if (! is_array($input) || $input === []) return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        $data = $this->lineWritable($input); if ($data === []) return $this->invalid(['body' => 'No writable budget line fields were supplied.']);
        $merged = array_merge($existing, $data); $data['planned_amount'] = $this->plannedAmount($merged); $data['updated_by'] = (int) $user->id;
        $merged = array_merge($existing, $data); $errors = $this->validateLineReferences($merged, $id); if ($errors !== []) return $this->invalid($errors);
        $db = db_connect();
        try {
            $db->transBegin(); if (! $this->lines->update($id, $data)) { $db->transRollback(); return $this->invalid($this->lines->errors()); }
            $this->recalculate($budgetId); if ($db->transStatus() === false) throw new DatabaseException('Unable to update budget line.'); $db->transCommit();
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget line updated successfully.',
                'data' => ['budget_line' => $this->lineQuery()->find($id), 'summary' => $this->summary($budgetId)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Project budget line update failed.', $e); }
    }

    public function deleteLine(int $budgetId, int $id): ResponseInterface
    {
        $user = auth('session')->user(); if ($user === null) return $this->unauthorized();
        $budget = $this->accessibleBudget($budgetId, $user, true); if ($budget === null) return $this->notFound();
        if ((string) $budget['status_code'] !== 'DRAFT') return $this->conflict('Lines can be deleted only from a draft project budget.');
        $line = $this->lines->where('company_id', (int) $user->company_id)->where('budget_id', $budgetId)->find($id);
        if ($line === null) return $this->lineNotFound();
        if ((float) $line['committed_amount'] > 0 || (float) $line['actual_amount'] > 0) return $this->conflict('A budget line with committed or actual cost cannot be deleted.');
        $db = db_connect();
        try {
            $db->transBegin(); $this->lines->update($id, ['updated_by' => (int) $user->id]);
            if (! $this->lines->delete($id)) throw new DatabaseException('Unable to delete budget line.');
            $this->recalculate($budgetId); if ($db->transStatus() === false) throw new DatabaseException('Unable to delete budget line.'); $db->transCommit();
            return $this->response->setJSON(['success' => true, 'message' => 'Project budget line deleted successfully.', 'data' => ['summary' => $this->summary($budgetId)]]);
        } catch (DatabaseException $e) { $db->transRollback(); return $this->databaseConflict($e); }
        catch (Throwable $e) { $db->transRollback(); return $this->serverError('Project budget line deletion failed.', $e); }
    }

    private function validateHeaderReferences(array $data): array
    {
        $db = db_connect(); $errors = []; $company = (int) $data['company_id']; $project = (int) $data['project_id'];
        $fy = (int) ($data['financial_year_id'] ?? 0);
        if ($fy > 0 && $db->table('financial_years')->where('id', $fy)->where('company_id', $company)->where('deleted_at', null)->countAllResults() === 0)
            $errors['financial_year_id'] = 'Select a valid financial year from this company.';
        $boq = (int) ($data['source_boq_id'] ?? 0);
        if ($boq > 0 && $db->table('project_boqs pb')->join('project_boqs_status_masters sm', 'sm.id=pb.status_id')
            ->where('pb.id', $boq)->where('pb.company_id', $company)->where('pb.project_id', $project)
            ->where('pb.deleted_at', null)->where('sm.status_code', 'APPROVED')->countAllResults() === 0)
            $errors['source_boq_id'] = 'Select an approved BOQ from this project.';
        return $errors;
    }

    private function validateLineReferences(array $data, ?int $exclude = null): array
    {
        $db = db_connect(); $errors = []; $company = (int) $data['company_id']; $project = (int) $data['project_id']; $budget = (int) $data['budget_id'];
        $type = $this->master('project_budget_lines_cost_type_masters', 'id', (string) ((int) ($data['cost_type_id'] ?? 0)), true);
        if ($type === null) $errors['cost_type_id'] = 'Select an active budget cost type.';
        if ($db->table('work_categories')->where('id', (int) ($data['work_category_id'] ?? 0))->where('company_id', $company)->where('is_active', 1)->where('deleted_at', null)->countAllResults() === 0)
            $errors['work_category_id'] = 'Select an active work category from this company.';
        $site = (int) ($data['site_id'] ?? 0); $zone = (int) ($data['work_zone_id'] ?? 0);
        if ($site > 0 && $db->table('project_sites')->where('id', $site)->where('company_id', $company)->where('project_id', $project)->where('deleted_at', null)->countAllResults() === 0)
            $errors['site_id'] = 'Select a valid site from this project.';
        if ($zone > 0 && $site <= 0) $errors['work_zone_id'] = 'A site is required when a work zone is selected.';
        elseif ($zone > 0 && $db->table('site_work_zones')->where('id', $zone)->where('site_id', $site)->where('company_id', $company)->where('project_id', $project)->where('is_active', 1)->where('deleted_at', null)->countAllResults() === 0)
            $errors['work_zone_id'] = 'Select an active work zone from the selected site.';
        $uom = (int) ($data['uom_id'] ?? 0);
        if ($uom > 0 && $db->table('units_of_measurement')->where('id', $uom)->where('company_id', $company)->where('is_active', 1)->where('deleted_at', null)->countAllResults() === 0)
            $errors['uom_id'] = 'Select an active unit of measurement from this company.';
        $item = (int) ($data['boq_item_id'] ?? 0);
        if ($item > 0 && $db->table('boq_items bi')->join('project_budgets pb', 'pb.id=' . $budget)
            ->where('bi.id', $item)->where('bi.company_id', $company)->where('bi.project_id', $project)->where('bi.boq_id = pb.source_boq_id', null, false)->where('bi.deleted_at', null)->countAllResults() === 0)
            $errors['boq_item_id'] = 'Select an item from this budget\'s source BOQ.';
        $code = strtoupper(trim((string) ($data['line_code'] ?? ''))); $duplicate = $this->lines->where('budget_id', $budget)->where('line_code', $code);
        if ($exclude !== null) $duplicate->where('id !=', $exclude); if ($code !== '' && $duplicate->countAllResults() > 0) $errors['line_code'] = 'The line code already exists in this budget.';
        foreach (['planned_quantity', 'planned_rate'] as $field) if (! is_numeric($data[$field] ?? null) || (float) $data[$field] < 0) $errors[$field] = 'The ' . str_replace('_', ' ', $field) . ' must be zero or greater.';
        return $errors;
    }

    private function recalculate(int $budgetId): void
    {
        $rows = db_connect()->table('project_budget_lines l')->select('ct.cost_type_code, SUM(l.planned_amount) amount')
            ->join('project_budget_lines_cost_type_masters ct', 'ct.id=l.cost_type_id')->where('l.budget_id', $budgetId)
            ->where('l.deleted_at', null)->groupBy('ct.cost_type_code')->get()->getResultArray();
        $direct = $overhead = $contingency = 0.0;
        foreach ($rows as $row) {
            $amount = (float) $row['amount']; $code = (string) $row['cost_type_code'];
            if ($code === 'OVERHEAD') $overhead += $amount; elseif ($code === 'CONTINGENCY') $contingency += $amount; else $direct += $amount;
        }
        db_connect()->table('project_budgets')->where('id', $budgetId)->update(['direct_cost' => round($direct, 2),
            'overhead_cost' => round($overhead, 2), 'contingency_amount' => round($contingency, 2),
            'total_budget' => round($direct + $overhead + $contingency, 2)]);
    }

    private function summary(int $budgetId): array
    {
        $budget = db_connect()->table('project_budgets')->select('direct_cost, overhead_cost, contingency_amount, total_budget')->where('id', $budgetId)->get()->getRowArray() ?? [];
        $budget['line_count'] = $this->lines->where('budget_id', $budgetId)->countAllResults();
        $budget['by_cost_type'] = db_connect()->table('project_budget_lines l')->select('ct.id cost_type_id, ct.cost_type_code, ct.cost_type_name, COUNT(l.id) line_count, SUM(l.planned_amount) planned_amount')
            ->join('project_budget_lines_cost_type_masters ct', 'ct.id=l.cost_type_id')->where('l.budget_id', $budgetId)->where('l.deleted_at', null)
            ->groupBy('ct.id, ct.cost_type_code, ct.cost_type_name')->orderBy('ct.sort_order', 'ASC')->get()->getResultArray();
        return $budget;
    }

    private function accessibleProject(int $id, object $user, bool $operate = false): ?array
    {
        if ($id <= 0) return null; $project = db_connect()->table('projects')->select('id, company_id, branch_id')->where('id', $id)
            ->where('company_id', (int) $user->company_id)->where('deleted_at', null)->get()->getRowArray();
        if ($project === null) return null; $branch = (int) ($project['branch_id'] ?? 0);
        if ($branch > 0 && ! $this->authorization->canAccessBranch($branch, $operate ? 'OPERATE' : 'VIEW', $user)) return null;
        return $project;
    }

    private function accessibleBudget(int $id, object $user, bool $operate = false): ?array
    {
        if ($id <= 0) return null; $row = $this->budgetQuery()->where('project_budgets.company_id', (int) $user->company_id)->find($id);
        if ($row === null || $this->accessibleProject((int) $row['project_id'], $user, $operate) === null) return null; return $row;
    }

    private function budgetQuery(): ProjectBudgetModel
    {
        return $this->budgets->select(['project_budgets.*', 'projects.project_code', 'projects.project_name', 'projects.branch_id',
            'financial_years.year_code financial_year_code', 'project_boqs.boq_code source_boq_code', 'project_boqs.boq_name source_boq_name',
            'project_budgets_status_masters.status_code', 'project_budgets_status_masters.status_name'])
            ->join('projects', 'projects.id=project_budgets.project_id AND projects.company_id=project_budgets.company_id AND projects.deleted_at IS NULL')
            ->join('financial_years', 'financial_years.id=project_budgets.financial_year_id AND financial_years.deleted_at IS NULL', 'left')
            ->join('project_boqs', 'project_boqs.id=project_budgets.source_boq_id AND project_boqs.deleted_at IS NULL', 'left')
            ->join('project_budgets_status_masters', 'project_budgets_status_masters.id=project_budgets.status_id', 'left');
    }

    private function lineQuery(): ProjectBudgetLineModel
    {
        return $this->lines->select(['project_budget_lines.*', 'project_budget_lines_cost_type_masters.cost_type_code',
            'project_budget_lines_cost_type_masters.cost_type_name', 'work_categories.category_code', 'work_categories.category_name',
            'units_of_measurement.unit_code', 'units_of_measurement.unit_name', 'units_of_measurement.unit_symbol',
            'project_sites.site_code', 'project_sites.site_name', 'site_work_zones.zone_code', 'site_work_zones.zone_name',
            'boq_items.item_code boq_item_code', 'boq_items.item_name boq_item_name'])
            ->join('project_budget_lines_cost_type_masters', 'project_budget_lines_cost_type_masters.id=project_budget_lines.cost_type_id')
            ->join('work_categories', 'work_categories.id=project_budget_lines.work_category_id AND work_categories.deleted_at IS NULL')
            ->join('units_of_measurement', 'units_of_measurement.id=project_budget_lines.uom_id AND units_of_measurement.deleted_at IS NULL', 'left')
            ->join('project_sites', 'project_sites.id=project_budget_lines.site_id AND project_sites.deleted_at IS NULL', 'left')
            ->join('site_work_zones', 'site_work_zones.id=project_budget_lines.work_zone_id AND site_work_zones.deleted_at IS NULL', 'left')
            ->join('boq_items', 'boq_items.id=project_budget_lines.boq_item_id AND boq_items.deleted_at IS NULL', 'left');
    }

    private function duplicateBudget(array $data, ?int $exclude = null): bool
    {
        $q = $this->budgets->where('company_id', (int) $data['company_id'])->where('project_id', (int) $data['project_id'])
            ->where('budget_code', strtoupper(trim((string) ($data['budget_code'] ?? ''))))->where('version_no', (int) ($data['version_no'] ?? 1));
        if ($exclude !== null) $q->where('id !=', $exclude); return $q->countAllResults() > 0;
    }

    private function master(string $table, string $field, string $value, bool $numeric = false): ?array
    {
        $q = db_connect()->table($table)->where('is_active', 1);
        $q->where($field, $numeric ? (int) $value : $value); return $q->get()->getRowArray();
    }
    private function lineWritable(array $input): array { return array_intersect_key($input, array_flip(['boq_item_id', 'site_id', 'work_zone_id', 'work_category_id', 'cost_type_id', 'line_code', 'line_description', 'planned_quantity', 'uom_id', 'planned_rate', 'display_order', 'notes'])); }
    private function plannedAmount(array $data): float { return round((float) ($data['planned_quantity'] ?? 0) * (float) ($data['planned_rate'] ?? 0), 2); }
    private function positiveGet(string $field): ?int { $v = $this->request->getGet($field); return $v !== null && ctype_digit((string) $v) && (int) $v > 0 ? (int) $v : null; }
    private function okList(array $rows): ResponseInterface { return $this->response->setJSON(['success' => true, 'message' => 'Project budgets retrieved successfully.', 'data' => ['project_budgets' => $rows]]); }
    private function unauthorized(): ResponseInterface { return $this->response->setStatusCode(401)->setJSON(['success' => false, 'message' => 'Authentication required.']); }
    private function notFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Project budget not found.']); }
    private function lineNotFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Project budget line not found.']); }
    private function revisionNotFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Budget revision not found.']); }
    private function revisionLineNotFound(): ResponseInterface { return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Budget revision line not found.']); }
    private function invalid(array $errors): ResponseInterface { return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]); }
    private function conflict(string $message): ResponseInterface { return $this->response->setStatusCode(409)->setJSON(['success' => false, 'message' => $message]); }
    private function configurationError(string $message): ResponseInterface { return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => $message]); }
    private function databaseConflict(DatabaseException $e): ResponseInterface { log_message('warning', 'Project budget database conflict: {message}', ['message' => $e->getMessage()]); return $this->conflict('The project budget conflicts with existing data.'); }
    private function serverError(string $message, Throwable $e): ResponseInterface { log_message('error', $message . ' {message}', ['message' => $e->getMessage()]); return $this->response->setStatusCode(500)->setJSON(['success' => false, 'message' => 'Unable to process the project budget request.']); }
}
