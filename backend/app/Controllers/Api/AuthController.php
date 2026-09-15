<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class AuthController extends BaseController
{
    /**
     * POST /api/auth/login
     */
    public function login(): ResponseInterface
    {
        try {
            if (auth('session')->loggedIn()) {
                return $this->respondWithUser(
                    'You are already logged in.'
                );
            }

            $input = $this->request->getJSON(true);

            if (! is_array($input)) {
                $input = $this->request->getPost();
            }

            $email    = strtolower(trim((string) ($input['email'] ?? '')));
            $password = (string) ($input['password'] ?? '');
            $remember = filter_var(
                $input['remember'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            if ($email === '' || $password === '') {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Email and password are required.',
                        'errors'  => [
                            'email'    => $email === ''
                                ? 'Email is required.'
                                : null,
                            'password' => $password === ''
                                ? 'Password is required.'
                                : null,
                        ],
                    ]);
            }

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Please enter a valid email address.',
                        'errors'  => [
                            'email' => 'Invalid email address.',
                        ],
                    ]);
            }

            $result = auth('session')->remember($remember)->attempt([
                'email'    => $email,
                'password' => $password,
            ]);

            if (! $result->isOK()) {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Invalid email address or password.',
                    ]);
            }

            $user = auth('session')->user();

            if (
                $user === null
                || (int) ($user->is_active ?? 0) !== 1
                || ! $this->isLoginAllowed($user)
            ) {
                auth('session')->logout();

                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Your account is inactive or locked.',
                    ]);
            }

            return $this->respondWithUser('Login successful.');
        } catch (Throwable $exception) {
            log_message('error', 'Authentication login error: {message}', [
                'message' => $exception->getMessage(),
            ]);

            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
                ->setJSON([
                    'success' => false,
                    'message' => 'Unable to complete login. Please try again.',
                ]);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): ResponseInterface
    {
        if (auth('session')->loggedIn()) {
            auth('session')->logout();
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Logout successful.',
        ]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(): ResponseInterface
    {
        if (! auth('session')->loggedIn()) {
            return $this->response
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON([
                    'success' => false,
                    'message' => 'Authentication required.',
                ]);
        }

        return $this->respondWithUser(
            'Authenticated user retrieved successfully.'
        );
    }

	private function respondWithUser(string $message): ResponseInterface
	{
		$user = auth('session')->user();

		if ($user === null) {
			return $this->response
				->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
				->setJSON([
					'success' => false,
					'message' => 'Authentication required.',
				]);
		}

		try {
			$authorization = new AuthorizationService();

			return $this->response->setJSON([
				'success' => true,
				'message' => $message,
				'data'    => [
					'user' => [
						'id'                   => (int) $user->id,
						'company_id'           => (int) $user->company_id,
						'default_branch_id'    => $user->default_branch_id !== null
							? (int) $user->default_branch_id
							: null,
						'username'             => (string) $user->username,
						'email'                => (string) $user->email,
						'first_name'           => (string) $user->first_name,
						'last_name'            => $user->last_name,
						'designation'          => $user->designation,
						'user_type_id'         => (int) $user->user_type_id,
						'user_type_code'       => $this->getUserTypeCode($user),
						'user_status_id'       => (int) $user->user_status_id,
						'user_status_code'     => $this->getUserStatusCode($user),
						'is_super_admin'       => (bool) $user->is_super_admin,
						'must_change_password' => (bool) $user->must_change_password,
					],
					'authorization' => [
						'roles' => $this->getUserRoleCodes($user),
						'permissions' =>
							$authorization->getPermissionCodes($user),
						'accessible_branch_ids' =>
							$authorization->getAccessibleBranchIds($user),
					],
				],
			]);
		} catch (Throwable $exception) {
			log_message(
				'error',
				'Authenticated user authorization retrieval error: {message}',
				['message' => $exception->getMessage()]
			);

			return $this->response
				->setStatusCode(
					ResponseInterface::HTTP_INTERNAL_SERVER_ERROR
				)
				->setJSON([
					'success' => false,
					'message' =>
						'Unable to retrieve the authenticated user details.',
				]);
		}
	}
	
	/**
	 * Return active role codes assigned to the authenticated user.
	 *
	 * @return list<string>
	 */
	private function getUserRoleCodes(object $user): array
	{
		if (
			(int) ($user->is_super_admin ?? 0) === 1
			&& (int) ($user->is_active ?? 0) === 1
			&& $this->isLoginAllowed($user)
		) {
			return ['SUPER_ADMIN'];
		}

		$today = date('Y-m-d');

		$rows = db_connect()
			->table('user_roles ur')
			->select('r.role_code')
			->distinct()
			->join(
				'roles r',
				'r.id = ur.role_id AND r.company_id = ur.company_id',
				'inner'
			)
			->where('ur.company_id', (int) $user->company_id)
			->where('ur.user_id', (int) $user->id)
			->where('ur.is_active', 1)
			->where('ur.deleted_at', null)
			->where('r.is_active', 1)
			->where('r.deleted_at', null)
			->groupStart()
				->where('ur.valid_from', null)
				->orWhere('ur.valid_from <=', $today)
			->groupEnd()
			->groupStart()
				->where('ur.valid_until', null)
				->orWhere('ur.valid_until >=', $today)
			->groupEnd()
			->orderBy('r.role_code', 'ASC')
			->get()
			->getResultArray();

		return array_values(array_map(
			static fn (array $row): string =>
				(string) $row['role_code'],
			$rows
		));
	}

    private function getUserStatusCode(object $user): string
    {
        $row = db_connect()->table('user_statuses')
            ->select('status_code')
            ->where('id', (int) ($user->user_status_id ?? 0))
            ->get()->getRowArray();

        return (string) ($row['status_code'] ?? '');
    }

    private function getUserTypeCode(object $user): string
    {
        $row = db_connect()->table('users_user_type_masters')
            ->select('user_type_code')
            ->where('id', (int) ($user->user_type_id ?? 0))
            ->get()->getRowArray();

        return (string) ($row['user_type_code'] ?? '');
    }

    private function isLoginAllowed(object $user): bool
    {
        $row = db_connect()->table('user_statuses')
            ->select('status_code, is_login_allowed, is_active')
            ->where('id', (int) ($user->user_status_id ?? 0))
            ->get()->getRowArray();

        return $row !== null
            && (int) $row['is_active'] === 1
            && (int) $row['is_login_allowed'] === 1
            && strtoupper((string) $row['status_code']) === 'ACTIVE';
    }
	
	/**
	 * POST /api/auth/change-password
	 */
	public function changePassword(): ResponseInterface
	{
		if (! auth('session')->loggedIn()) {
			return $this->response
				->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
				->setJSON([
					'success' => false,
					'message' => 'Authentication required.',
				]);
		}

		$input = $this->request->getJSON(true);

		if (! is_array($input)) {
			$input = $this->request->getPost();
		}

		$currentPassword = (string) ($input['current_password'] ?? '');
		$newPassword     = (string) ($input['new_password'] ?? '');
		$confirmation    = (string) ($input['confirm_password'] ?? '');

		$errors = [];

		if ($currentPassword === '') {
			$errors['current_password'] = 'Current password is required.';
		}

		if ($newPassword === '') {
			$errors['new_password'] = 'New password is required.';
		} elseif (strlen($newPassword) < 8) {
			$errors['new_password'] = 'New password must contain at least 8 characters.';
		} elseif (
			! preg_match('/[A-Z]/', $newPassword)
			|| ! preg_match('/[a-z]/', $newPassword)
			|| ! preg_match('/[0-9]/', $newPassword)
			|| ! preg_match('/[^A-Za-z0-9]/', $newPassword)
		) {
			$errors['new_password'] =
				'Password must include uppercase, lowercase, number and special character.';
		}

		if ($confirmation === '') {
			$errors['confirm_password'] = 'Password confirmation is required.';
		} elseif ($newPassword !== $confirmation) {
			$errors['confirm_password'] = 'Password confirmation does not match.';
		}

		if ($currentPassword !== '' && $currentPassword === $newPassword) {
			$errors['new_password'] =
				'New password must be different from the current password.';
		}

		if ($errors !== []) {
			return $this->response
				->setStatusCode(ResponseInterface::HTTP_UNPROCESSABLE_ENTITY)
				->setJSON([
					'success' => false,
					'message' => 'Please correct the password details.',
					'errors'  => $errors,
				]);
		}

		$user = auth('session')->user();

		if ($user === null) {
			return $this->response
				->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
				->setJSON([
					'success' => false,
					'message' => 'Authentication required.',
				]);
		}

		$db = db_connect();

		try {
			$identity = $db->table('auth_identities')
				->select('id, user_id, secret2')
				->where('user_id', (int) $user->id)
				->where('type', 'email_password')
				->get()
				->getRowArray();

			if (
				$identity === null
				|| empty($identity['secret2'])
				|| ! service('passwords')->verify(
					$currentPassword,
					(string) $identity['secret2']
				)
			) {
				return $this->response
					->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
					->setJSON([
						'success' => false,
						'message' => 'The current password is incorrect.',
						'errors'  => [
							'current_password' => 'Incorrect current password.',
						],
					]);
			}

			$newPasswordHash = service('passwords')->hash($newPassword);
			$now             = date('Y-m-d H:i:s');

			$db->transException(true);
			$db->transStart();

			$db->table('users')
				->where('id', (int) $user->id)
				->update([
					'password_hash'         => $newPasswordHash,
					'must_change_password'  => 0,
					'password_changed_at'   => $now,
					'failed_login_attempts' => 0,
					'locked_until'          => null,
					'updated_at'            => $now,
				]);

			$db->table('auth_identities')
				->where('id', (int) $identity['id'])
				->where('user_id', (int) $user->id)
				->update([
					'secret2'    => $newPasswordHash,
					'force_reset' => 0,
					'updated_at' => $now,
				]);

			$db->transComplete();

			return $this->response->setJSON([
				'success' => true,
				'message' => 'Password changed successfully.',
				'data'    => [
					'must_change_password' => false,
				],
			]);
		} catch (Throwable $exception) {
			if ($db->transStatus() === false) {
				$db->transRollback();
			}

			log_message('error', 'Password change error: {message}', [
				'message' => $exception->getMessage(),
			]);

			return $this->response
				->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
				->setJSON([
					'success' => false,
					'message' => 'Unable to change the password. Please try again.',
				]);
		}
	}
}
