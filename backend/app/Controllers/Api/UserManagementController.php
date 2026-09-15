<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Services\UserManagementService;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use RuntimeException;
use Throwable;

class UserManagementController extends ResourceController
{
    protected $format = 'json';

    private UserManagementService $userManagementService;

    public function __construct()
    {
        $this->userManagementService = new UserManagementService();
    }

    /**
     * POST /api/users
     */
    public function create(): ResponseInterface
    {
        $authenticatedUser = auth()->user();

        if ($authenticatedUser === null) {
            return $this->failUnauthorizedResponse();
        }

        $userId    = (int) ($authenticatedUser->id ?? 0);
        $companyId = (int) ($authenticatedUser->company_id ?? 0);

        if ($userId < 1 || $companyId < 1) {
            return $this->failUnauthorizedResponse();
        }

        $payload = $this->request->getJSON(true);

        if (! is_array($payload)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'The request body must contain valid JSON.',
                'errors'  => [
                    'body' => 'A valid JSON request body is required.',
                ],
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->userManagementService->createUser(
                $payload,
                $authenticatedUser
            );

            return $this->respondCreated([
                'status'  => 'success',
                'message' => 'User created successfully.',
                'data'    => [
                    'user' => $user,
                ],
            ]);
        } catch (RuntimeException $exception) {
            return $this->respond([
                'status'  => 'error',
                'message' => $exception->getMessage(),
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $exception) {
            log_message(
                'error',
                'User creation API failed for company {companyId}: {message}',
                [
                    'companyId' => $companyId,
                    'message'   => $exception->getMessage(),
                ]
            );

            return $this->respond([
                'status'  => 'error',
                'message' => 'The user could not be created.',
            ], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT/PATCH /api/users/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $authenticatedUser = auth()->user();

        if ($authenticatedUser === null) {
            return $this->failUnauthorizedResponse();
        }

        $authenticatedUserId = (int) ($authenticatedUser->id ?? 0);
        $companyId           = (int) ($authenticatedUser->company_id ?? 0);
        $userId              = filter_var($id, FILTER_VALIDATE_INT);

        if ($authenticatedUserId < 1 || $companyId < 1) {
            return $this->failUnauthorizedResponse();
        }

        if ($userId === false || $userId < 1) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'A valid user ID is required.',
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $payload = $this->request->getJSON(true);

        if (! is_array($payload)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'The request body must contain valid JSON.',
                'errors'  => [
                    'body' => 'A valid JSON request body is required.',
                ],
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->userManagementService->updateUser(
                (int) $userId,
                $payload,
                $authenticatedUser
            );

            return $this->respond([
                'status'  => 'success',
                'message' => 'User updated successfully.',
                'data'    => [
                    'user' => $user,
                ],
            ], ResponseInterface::HTTP_OK);
        } catch (RuntimeException $exception) {
            return $this->respond([
                'status'  => 'error',
                'message' => $exception->getMessage(),
            ], ResponseInterface::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Throwable $exception) {
            log_message(
                'error',
                'User update API failed for user {userId}: {message}',
                [
                    'userId'  => (int) $userId,
                    'message' => $exception->getMessage(),
                ]
            );

            return $this->respond([
                'status'  => 'error',
                'message' => 'The user could not be updated.',
            ], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function failUnauthorizedResponse(): ResponseInterface
    {
        return $this->respond([
            'status'  => 'error',
            'message' => 'Authentication is required.',
        ], ResponseInterface::HTTP_UNAUTHORIZED);
    }
}