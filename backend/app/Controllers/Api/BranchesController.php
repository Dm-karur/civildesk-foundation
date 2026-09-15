<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\BranchModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class BranchesController extends BaseController
{
    private BranchModel $branchModel;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->branchModel = new BranchModel();
        $this->authorization = new AuthorizationService();
    }

    /**
     * Return branches accessible to the authenticated user.
     */
    public function index(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->branchModel
                ->select([
                    'branches.id',
                    'branches.company_id',
                    'branches.branch_code',
                    'branches.branch_name',
                    'branches.branch_type_id',
                    'branch_types.type_code AS branch_type_code',
                    'branch_types.type_name AS branch_type_name',
                    'branches.gstin',
                    'branches.email',
                    'branches.phone',
                    'branches.city',
                    'branches.district',
                    'branches.state_name',
                    'branches.state_code',
                    'branches.country_code',
                    'branches.postal_code',
                    'branches.latitude',
                    'branches.longitude',
                    'branches.is_head_office',
                    'branches.is_active',
                    'branches.created_at',
                    'branches.updated_at',
                ])
                ->join('branch_types', 'branch_types.id = branches.branch_type_id')
                ->where(
                    'branches.company_id',
                    (int) $user->company_id
                );

            if (! $this->authorization->isSuperAdmin($user)) {
                $accessibleBranchIds =
                    $this->authorization->getAccessibleBranchIds($user);

                if ($accessibleBranchIds === []) {
                    return $this->response->setJSON([
                        'success' => true,
                        'message' => 'Branches retrieved successfully.',
                        'data' => [
                            'branches' => [],
                        ],
                    ]);
                }

                $builder->whereIn('branches.id', $accessibleBranchIds);
            }

            $branches = $builder
                ->orderBy('is_head_office', 'DESC')
                ->orderBy('branch_name', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Branches retrieved successfully.',
                'data' => [
                    'branches' => $branches,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'Branch list retrieval failed.',
                $exception
            );
        }
    }

    /**
     * Return one accessible branch.
     */
    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        if ($id <= 0) {
            return $this->notFound();
        }

        try {
            $branch = $this->branchModel
                ->select('branches.*, branch_types.type_code AS branch_type_code, branch_types.type_name AS branch_type_name')
                ->join('branch_types', 'branch_types.id = branches.branch_type_id')
                ->where('branches.company_id', (int) $user->company_id)
                ->find($id);

            if ($branch === null) {
                return $this->notFound();
            }

            if (! $this->authorization->isSuperAdmin($user)) {
                $accessibleBranchIds =
                    $this->authorization->getAccessibleBranchIds($user);

                if (! in_array($id, $accessibleBranchIds, true)) {
                    return $this->notFound();
                }
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Branch retrieved successfully.',
                'data' => [
                    'branch' => $branch,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'Branch retrieval failed.',
                $exception
            );
        }
    }

    public function create(): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();

        $payload = $this->request->getJSON(true);
        if (! is_array($payload)) {
            return $this->response->setStatusCode(400)->setJSON([
                'success' => false,
                'message' => 'A valid JSON request body is required.',
            ]);
        }

        $payload['company_id'] = (int) $user->company_id;
        if ($this->branchCodeExists((string) ($payload['branch_code'] ?? ''))) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'message' => 'Branch code already exists for this company.',
            ]);
        }

        if (! $this->branchModel->insert($payload)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'message' => 'Branch validation failed.',
                'errors' => $this->branchModel->errors(),
            ]);
        }

        return $this->response->setStatusCode(201)->setJSON([
            'success' => true,
            'message' => 'Branch created successfully.',
            'data' => ['branch' => $this->branchModel->find((int) $this->branchModel->getInsertID())],
        ]);
    }

    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();

        $branch = $this->branchModel->where('company_id', (int) $user->company_id)->find($id);
        if ($branch === null) return $this->notFound();

        $payload = $this->request->getJSON(true);
        if (! is_array($payload)) {
            return $this->response->setStatusCode(400)->setJSON(['success' => false, 'message' => 'A valid JSON request body is required.']);
        }
        unset($payload['id'], $payload['company_id'], $payload['created_at'], $payload['updated_at'], $payload['deleted_at']);
        $payload['company_id'] = (int) $user->company_id;

        if (isset($payload['branch_code']) && $this->branchCodeExists((string) $payload['branch_code'], $id)) {
            return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'Branch code already exists for this company.']);
        }

        if (! $this->branchModel->update($id, $payload)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'message' => 'Branch validation failed.',
                'errors' => $this->branchModel->errors(),
            ]);
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Branch updated successfully.',
            'data' => ['branch' => $this->branchModel->find($id)],
        ]);
    }

    public function delete(int $id): ResponseInterface
    {
        $user = auth('session')->user();
        if ($user === null) return $this->unauthorized();
        $branch = $this->branchModel->where('company_id', (int) $user->company_id)->find($id);
        if ($branch === null) return $this->notFound();
        if ((bool) $branch['is_head_office']) {
            return $this->response->setStatusCode(422)->setJSON(['success' => false, 'message' => 'The head-office branch cannot be deleted.']);
        }
        $this->branchModel->delete($id);
        return $this->response->setJSON(['success' => true, 'message' => 'Branch deleted successfully.']);
    }

    private function branchCodeExists(string $code, ?int $exceptId = null): bool
    {
        $builder = db_connect()->table('branches')
            ->where('company_id', (int) auth('session')->user()->company_id)
            ->where('branch_code', strtoupper(trim($code)))
            ->where('deleted_at', null);
        if ($exceptId !== null) $builder->where('id !=', $exceptId);
        return $builder->countAllResults() > 0;
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
    }

    /**
     * Return 404 for missing or inaccessible branches so another
     * company's branch information is never exposed.
     */
    private function notFound(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON([
                'success' => false,
                'message' => 'Branch not found.',
            ]);
    }

    private function serverError(
        string $logMessage,
        Throwable $exception
    ): ResponseInterface {
        log_message(
            'error',
            $logMessage . ' {message}',
            ['message' => $exception->getMessage()]
        );

        return $this->response
            ->setStatusCode(
                ResponseInterface::HTTP_INTERNAL_SERVER_ERROR
            )
            ->setJSON([
                'success' => false,
                'message' => 'Unable to process the branch request.',
            ]);
    }
}
