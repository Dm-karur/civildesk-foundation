<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\ProjectModel;
use App\Models\ProjectTeamMemberModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class ProjectTeamMembersController extends BaseController
{
    private ProjectTeamMemberModel $members;
    private ProjectModel $projects;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->members = new ProjectTeamMemberModel();
        $this->projects = new ProjectModel();
        $this->authorization = new AuthorizationService();
    }

    public function index(int $projectId): ResponseInterface
    {
        $context = $this->projectContext($projectId);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        try {
            $builder = $this->baseQuery()
                ->where('project_team_members.company_id', $context['company_id'])
                ->where('project_team_members.project_id', $projectId);

            $roleId = (int) ($this->request->getGet('team_role_id') ?? 0);
            if ($roleId > 0) {
                $builder->where('project_team_members.team_role_id', $roleId);
            }

            $isActive = $this->request->getGet('is_active');
            if ($isActive !== null && in_array((string) $isActive, ['0', '1'], true)) {
                $builder->where('project_team_members.is_active', (int) $isActive);
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project team members retrieved successfully.',
                'data' => [
                    'team_members' => $builder
                        ->orderBy('project_team_members.is_primary', 'DESC')
                        ->orderBy('project_team_roles.sort_order', 'ASC')
                        ->orderBy('users.first_name', 'ASC')
                        ->findAll(),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    public function show(int $projectId, int $id): ResponseInterface
    {
        $context = $this->projectContext($projectId);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $member = $this->findMember($context['company_id'], $projectId, $id);
        if ($member === null) {
            return $this->notFound();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Project team member retrieved successfully.',
            'data' => ['team_member' => $member],
        ]);
    }

    public function create(int $projectId): ResponseInterface
    {
        $context = $this->projectContext($projectId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input)) {
            return $this->invalid(['body' => 'A valid JSON request body is required.']);
        }

        $data = $this->writableData($input);
        $data['company_id'] = $context['company_id'];
        $data['project_id'] = $projectId;
        $data['created_by'] = $context['user_id'];
        $data['updated_by'] = $context['user_id'];
        $data += [
            'team_role_id' => null,
            'is_primary' => 0,
            'can_approve' => 0,
            'is_active' => 1,
        ];

        $validation = $this->validateAssignment($data, $context['company_id']);
        if ($validation !== null) {
            return $validation;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            $archivedId = $this->archivedAssignmentId(
                $projectId,
                (int) $data['user_id'],
                $data['team_role_id']
            );

            if ($archivedId !== null) {
                if ((int) $data['is_primary'] === 1) {
                    $this->clearPrimary(
                        $context['company_id'],
                        $projectId,
                        $data['team_role_id'],
                        $context['user_id'],
                        $archivedId
                    );
                }

                $db->table('project_team_members')
                    ->where('id', $archivedId)
                    ->where('company_id', $context['company_id'])
                    ->update(array_merge($data, ['deleted_at' => null]));

                if ($db->transStatus() === false) {
                    $db->transRollback();
                    throw new DatabaseException('Unable to restore the project team assignment.');
                }

                $db->transCommit();

                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_CREATED)
                    ->setJSON([
                        'success' => true,
                        'message' => 'Project team member reassigned successfully.',
                        'data' => [
                            'team_member' => $this->findMember(
                                $context['company_id'],
                                $projectId,
                                $archivedId
                            ),
                        ],
                    ]);
            }

            if ($this->duplicateExists($projectId, (int) $data['user_id'], $data['team_role_id'])) {
                $db->transRollback();
                return $this->conflict('This user is already assigned to the project in the selected role.');
            }

            if ((int) $data['is_primary'] === 1) {
                $this->clearPrimary($context['company_id'], $projectId, $data['team_role_id'], $context['user_id']);
            }

            if (! $this->members->insert($data)) {
                $db->transRollback();
                return $this->invalid($this->members->errors());
            }

            $id = (int) $this->members->getInsertID();
            $db->transCommit();

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'Project team member assigned successfully.',
                    'data' => ['team_member' => $this->findMember($context['company_id'], $projectId, $id)],
                ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->conflict('This project team assignment already exists or conflicts with existing data.');
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError($exception);
        }
    }

    public function update(int $projectId, int $id): ResponseInterface
    {
        $context = $this->projectContext($projectId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $existing = $this->members
            ->where('company_id', $context['company_id'])
            ->where('project_id', $projectId)
            ->find($id);
        if ($existing === null) {
            return $this->notFound();
        }

        $input = $this->request->getJSON(true);
        if (! is_array($input) || $input === []) {
            return $this->invalid(['body' => 'A non-empty JSON request body is required.']);
        }

        $data = $this->writableData($input);
        unset($data['user_id']);
        $data['updated_by'] = $context['user_id'];
        $merged = array_merge($existing, $data);

        $validation = $this->validateAssignment($merged, $context['company_id']);
        if ($validation !== null) {
            return $validation;
        }

        $db = db_connect();
        $db->transBegin();

        try {
            if ($this->duplicateExists(
                $projectId,
                (int) $existing['user_id'],
                $merged['team_role_id'],
                $id
            )) {
                $db->transRollback();
                return $this->conflict('This user is already assigned to the project in the selected role.');
            }

            if ((int) ($merged['is_primary'] ?? 0) === 1) {
                $this->clearPrimary(
                    $context['company_id'],
                    $projectId,
                    $merged['team_role_id'],
                    $context['user_id'],
                    $id
                );
            }

            if (! $this->members->update($id, $data)) {
                $db->transRollback();
                return $this->invalid($this->members->errors());
            }

            $db->transCommit();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project team member updated successfully.',
                'data' => ['team_member' => $this->findMember($context['company_id'], $projectId, $id)],
            ]);
        } catch (DatabaseException $exception) {
            $db->transRollback();
            return $this->conflict('This project team assignment already exists or conflicts with existing data.');
        } catch (Throwable $exception) {
            $db->transRollback();
            return $this->serverError($exception);
        }
    }

    public function delete(int $projectId, int $id): ResponseInterface
    {
        $context = $this->projectContext($projectId, true);
        if ($context instanceof ResponseInterface) {
            return $context;
        }

        $member = $this->members
            ->where('company_id', $context['company_id'])
            ->where('project_id', $projectId)
            ->find($id);
        if ($member === null) {
            return $this->notFound();
        }

        try {
            $this->members->update($id, [
                'is_active' => 0,
                'updated_by' => $context['user_id'],
            ]);
            $this->members->delete($id);

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Project team member removed successfully.',
            ]);
        } catch (Throwable $exception) {
            return $this->serverError($exception);
        }
    }

    private function projectContext(int $projectId, bool $operate = false): array|ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON(['success' => false, 'message' => 'Authentication required.']);
        }

        $project = $this->projects
            ->where('company_id', (int) $user->company_id)
            ->find($projectId);
        if ($project === null) {
            return $this->projectNotFound();
        }

        $branchId = (int) ($project['branch_id'] ?? 0);
        if (! $this->authorization->isSuperAdmin($user) && $branchId > 0) {
            $level = $operate ? 'OPERATE' : 'VIEW';
            if (! $this->authorization->canAccessBranch($branchId, $level, $user)) {
                return $this->projectNotFound();
            }
        }

        return [
            'company_id' => (int) $user->company_id,
            'user_id' => (int) $user->id,
        ];
    }

    private function baseQuery(): ProjectTeamMemberModel
    {
        return $this->members
            ->select([
                'project_team_members.*',
                'users.employee_code',
                'users.username',
                'users.first_name',
                'users.last_name',
                'users.email',
                'users.designation',
                'project_team_roles.role_code AS team_role_code',
                'project_team_roles.role_name AS team_role_name',
            ])
            ->join('users', 'users.id = project_team_members.user_id')
            ->join('project_team_roles', 'project_team_roles.id = project_team_members.team_role_id', 'left');
    }

    private function findMember(int $companyId, int $projectId, int $id): ?array
    {
        return $this->baseQuery()
            ->where('project_team_members.company_id', $companyId)
            ->where('project_team_members.project_id', $projectId)
            ->find($id);
    }

    private function writableData(array $input): array
    {
        return array_intersect_key($input, array_flip([
            'user_id', 'team_role_id', 'responsibility', 'assignment_start',
            'assignment_end', 'is_primary', 'can_approve', 'is_active',
        ]));
    }

    private function validateAssignment(array $data, int $companyId): ?ResponseInterface
    {
        $errors = [];
        $db = db_connect();
        $userId = (int) ($data['user_id'] ?? 0);
        $teamRoleId = (int) ($data['team_role_id'] ?? 0);

        if ($userId <= 0 || $db->table('users')
            ->where('id', $userId)
            ->where('company_id', $companyId)
            ->where('is_active', 1)
            ->where('deleted_at', null)
            ->countAllResults() !== 1) {
            $errors['user_id'] = 'Select a valid active user for this company.';
        }

        if ($teamRoleId > 0 && $db->table('project_team_roles')
            ->where('id', $teamRoleId)
            ->where('is_active', 1)
            ->countAllResults() !== 1) {
            $errors['team_role_id'] = 'Select a valid active project team role.';
        }

        if (
            ! empty($data['assignment_start'])
            && ! empty($data['assignment_end'])
            && $data['assignment_end'] < $data['assignment_start']
        ) {
            $errors['assignment_end'] = 'Assignment end date cannot be before the start date.';
        }

        return $errors === [] ? null : $this->invalid($errors);
    }

    private function duplicateExists(
        int $projectId,
        int $userId,
        mixed $teamRoleId,
        ?int $exceptId = null
    ): bool {
        $builder = db_connect()->table('project_team_members')
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->where('deleted_at', null);

        if ($teamRoleId === null || $teamRoleId === '') {
            $builder->where('team_role_id', null);
        } else {
            $builder->where('team_role_id', (int) $teamRoleId);
        }

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        return $builder->countAllResults() > 0;
    }

    private function archivedAssignmentId(int $projectId, int $userId, mixed $teamRoleId): ?int
    {
        $builder = db_connect()->table('project_team_members')
            ->select('id')
            ->where('project_id', $projectId)
            ->where('user_id', $userId)
            ->where('deleted_at IS NOT NULL', null, false);

        if ($teamRoleId === null || $teamRoleId === '') {
            $builder->where('team_role_id', null);
        } else {
            $builder->where('team_role_id', (int) $teamRoleId);
        }

        $row = $builder->orderBy('id', 'DESC')->get()->getRowArray();

        return $row === null ? null : (int) $row['id'];
    }

    private function clearPrimary(
        int $companyId,
        int $projectId,
        mixed $teamRoleId,
        int $userId,
        ?int $exceptId = null
    ): void {
        $builder = db_connect()->table('project_team_members')
            ->where('company_id', $companyId)
            ->where('project_id', $projectId)
            ->where('deleted_at', null);

        if ($teamRoleId === null || $teamRoleId === '') {
            $builder->where('team_role_id', null);
        } else {
            $builder->where('team_role_id', (int) $teamRoleId);
        }

        if ($exceptId !== null) {
            $builder->where('id !=', $exceptId);
        }

        $builder->update(['is_primary' => 0, 'updated_by' => $userId]);
    }

    private function invalid(array $errors): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
            ->setJSON(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    }

    private function conflict(string $message): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_CONFLICT)
            ->setJSON(['success' => false, 'message' => $message]);
    }

    private function projectNotFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Project not found.']);
    }

    private function notFound(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON(['success' => false, 'message' => 'Project team member not found.']);
    }

    private function serverError(Throwable $exception): ResponseInterface
    {
        log_message('error', 'Project team operation failed: {message}', [
            'message' => $exception->getMessage(),
        ]);

        return $this->response->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
            ->setJSON(['success' => false, 'message' => 'Unable to process the project team request.']);
    }
}
