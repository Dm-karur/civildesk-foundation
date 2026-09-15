<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Services\UserManagementService;
use CodeIgniter\HTTP\ResponseInterface;
use RuntimeException;
use Throwable;

class UsersController extends BaseController
{
    private UserModel $userModel;
    private UserManagementService $userManagementService;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->userManagementService = new UserManagementService();
    }

    /**
     * Return users belonging to the authenticated user's company.
     */
    public function index(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $users = $this->userModel
                ->select([
                    'users.id', 'users.company_id', 'users.default_branch_id',
                    'users.employee_code', 'users.username', 'users.email',
                    'users.phone', 'users.first_name', 'users.last_name',
                    'users.designation', 'users.user_type_id',
                    'users_user_type_masters.user_type_code',
                    'users_user_type_masters.user_type_name',
                    'users.user_status_id',
                    'user_statuses.status_code AS user_status_code',
                    'user_statuses.status_name AS user_status_name',
                    'users.active', 'users.status_message', 'users.last_active',
                    'users.must_change_password', 'users.failed_login_attempts',
                    'users.locked_until', 'users.last_login_at',
                    'users.email_verified_at', 'users.is_super_admin',
                    'users.is_active', 'users.created_at', 'users.updated_at',
                ])
                ->join('users_user_type_masters', 'users_user_type_masters.id = users.user_type_id')
                ->join('user_statuses', 'user_statuses.id = users.user_status_id')
                ->where('users.company_id', (int) $user->company_id)
                ->orderBy('first_name', 'ASC')
                ->orderBy('last_name', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Users retrieved successfully.',
                'data' => [
                    'users' => $users,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'User list retrieval failed.',
                $exception
            );
        }
    }

    /**
     * Create a user within the authenticated user's company.
     */
    public function create(): ResponseInterface
    {
        $authenticatedUser = auth('session')->user();

        if ($authenticatedUser === null) {
            return $this->unauthorized();
        }

        $payload = $this->request->getJSON(true);

        if (! is_array($payload)) {
            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_BAD_REQUEST)
                ->setJSON([
                    'success' => false,
                    'message' => 'A valid JSON request body is required.',
                ]);
        }

        try {
            $createdUser = $this->userManagementService->createUser(
                $payload,
                $authenticatedUser
            );

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_CREATED)
                ->setJSON([
                    'success' => true,
                    'message' => 'User created successfully.',
                    'data' => [
                        'user' => $createdUser,
                    ],
                ]);
        } catch (RuntimeException $exception) {
            return $this->response
                ->setStatusCode(
                    ResponseInterface::HTTP_UNPROCESSABLE_ENTITY
                )
                ->setJSON([
                    'success' => false,
                    'message' => $exception->getMessage(),
                ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'User creation failed.',
                $exception
            );
        }
    }

    /**
     * Return one user belonging to the authenticated user's company.
     */
    public function show(int $id): ResponseInterface
    {
        $authenticatedUser = auth('session')->user();

        if ($authenticatedUser === null) {
            return $this->unauthorized();
        }

        if ($id <= 0) {
            return $this->notFound();
        }

        try {
            $selectedUser = $this->userModel
                ->select([
                    'users.*',
                    'users_user_type_masters.user_type_code',
                    'users_user_type_masters.user_type_name',
                    'user_statuses.status_code AS user_status_code',
                    'user_statuses.status_name AS user_status_name',
                ])
                ->join('users_user_type_masters', 'users_user_type_masters.id = users.user_type_id')
                ->join('user_statuses', 'user_statuses.id = users.user_status_id')
                ->where(
                    'users.company_id',
                    (int) $authenticatedUser->company_id
                )
                ->find($id);

            if ($selectedUser === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'User retrieved successfully.',
                'data' => [
                    'user' => $selectedUser,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'User retrieval failed.',
                $exception
            );
        }
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

    private function notFound(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON([
                'success' => false,
                'message' => 'User not found.',
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
                'message' => 'Unable to process the user request.',
            ]);
    }
}
