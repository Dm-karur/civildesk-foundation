<?php

declare(strict_types=1);

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

class UserManagementService
{
    private BaseConnection $db;

    public function __construct()
    {
        $this->db = db_connect();
    }

    /**
     * Create a user for the authenticated user's company.
     *
     * Creates:
     * - users record
     * - Shield email/password identity
     * - primary user role
     * - user branch access
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function createUser(
        array $payload,
        object $authenticatedUser
    ): array {
        $companyId = (int) ($authenticatedUser->company_id ?? 0);
        $creatorId = (int) ($authenticatedUser->id ?? 0);

        if ($creatorId <= 0) {
            throw new RuntimeException(
                'The authenticated user ID is invalid.'
            );
        }

        if ($companyId <= 0) {
            throw new RuntimeException(
                'The authenticated user does not have a valid company context.'
            );
        }

        $data = $this->validateCreatePayload($payload);

        $company = $this->getCompany($companyId);

        if ($company === null) {
            throw new RuntimeException(
                'The authenticated company could not be found.'
            );
        }

        if (! $this->isRecordActive($company)) {
            throw new RuntimeException(
                'The authenticated company is inactive.'
            );
        }

        $role = $this->getCompanyRole(
            $companyId,
            $data['role_id']
        );

        if ($role === null) {
            throw new RuntimeException(
                'The selected role was not found for this company.'
            );
        }

        if (! $this->isRecordActive($role)) {
            throw new RuntimeException(
                'The selected role is inactive.'
            );
        }

        $branches = $this->getCompanyBranches(
            $companyId,
            $data['branch_ids']
        );

        if (count($branches) !== count($data['branch_ids'])) {
            throw new RuntimeException(
                'One or more selected branches do not belong to this company.'
            );
        }

        foreach ($branches as $branch) {
            if (! $this->isRecordActive($branch)) {
                throw new RuntimeException(
                    'One or more selected branches are inactive.'
                );
            }
        }

        $this->ensureUsernameIsAvailable($data['username']);
        $this->ensureEmailIsAvailable($data['email']);

        if ($data['employee_code'] !== null) {
            $this->ensureEmployeeCodeIsAvailable(
                $companyId,
                $data['employee_code']
            );
        }

        $now   = date('Y-m-d H:i:s');
		$today = date('Y-m-d');

        $this->db->transBegin();

        try {
            /*
             * Recheck unique values inside the transaction.
             */
            $this->ensureUsernameIsAvailable($data['username']);
            $this->ensureEmailIsAvailable($data['email']);

            if ($data['employee_code'] !== null) {
                $this->ensureEmployeeCodeIsAvailable(
                    $companyId,
                    $data['employee_code']
                );
            }

            $passwordHash = service('passwords')->hash($data['password']);
			
		

            $userInserted = $this->db
                ->table('users')
                ->insert([
                    'company_id'            => $companyId,
                    'default_branch_id'     => $data['default_branch_id'],
                    'employee_code'         => $data['employee_code'],
                    'username'              => $data['username'],
                    'email'                 => $data['email'],
                    'phone'                 => $data['phone'],
                    'first_name'            => $data['first_name'],
                    'last_name'             => $data['last_name'],
                    'designation'           => $data['designation'],
                    'user_type_id'          => $data['user_type_id'],
                    'user_status_id'        => $this->getActiveUserStatusId(),
                    'password_hash'         => $passwordHash,
                    'active'                => 1,
                    'status_message'        => null,
                    'must_change_password'  => (
                        $data['must_change_password'] ? 1 : 0
                    ),
                    'failed_login_attempts' => 0,
                    'locked_until'          => null,
                    'is_super_admin'        => 0,
                    'is_active'             => 1,
                    'created_by'            => $creatorId,
                    'updated_by'            => $creatorId,
                    'created_at'            => $now,
                    'updated_at'            => $now,
                    'deleted_at'            => null,
                ]);

            if (! $userInserted) {
                throw new RuntimeException(
                    'The user record could not be created.'
                );
            }

            $userId = (int) $this->db->insertID();

            if ($userId <= 0) {
                throw new RuntimeException(
                    'The newly created user ID could not be determined.'
                );
            }

            /*
             * Create the Shield email/password identity.
             */
            $identityInserted = $this->db
                ->table('auth_identities')
                ->insert([
                    'user_id'      => $userId,
                    'type'         => 'email_password',
                    'name'         => null,
                    'secret'       => $data['email'],
                    'secret2'      => $passwordHash,
                    'expires'      => null,
                    'extra'        => null,
                    'force_reset'  => (
                        $data['must_change_password'] ? 1 : 0
                    ),
                    'last_used_at' => null,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]);

            if (! $identityInserted) {
                throw new RuntimeException(
                    'The authentication identity could not be created.'
                );
            }

            /*
             * Assign the primary company role.
             */
            $roleInserted = $this->db
                ->table('user_roles')
                ->insert([
                    'company_id'  => $companyId,
                    'user_id'     => $userId,
                    'role_id'     => $data['role_id'],
                    'assigned_by' => $creatorId,
                    'assigned_at' => $now,
                    'valid_from'  => $today,
                    'valid_until' => null,
                    'is_primary'  => 1,
                    'is_active'   => 1,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                    'deleted_at'  => null,
                ]);

            if (! $roleInserted) {
                throw new RuntimeException(
                    'The user role could not be assigned.'
                );
            }

            /*
             * Assign all selected branch-access records.
             */
            $branchAccessRows = [];

            foreach ($data['branch_ids'] as $branchId) {
                $branchAccessRows[] = [
                    'company_id'   => $companyId,
                    'user_id'      => $userId,
                    'branch_id'    => $branchId,
                    'access_level_id' => $data['access_level_id'],
                    'granted_by'   => $creatorId,
                    'granted_at'   => $now,
                    'valid_from'   => $today,
                    'valid_until'  => null,
                    'is_default'   => (
                        $branchId === $data['default_branch_id']
                    ) ? 1 : 0,
                    'is_active'    => 1,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                    'deleted_at'   => null,
                ];
            }

            $branchAccessInserted = $this->db
                ->table('user_branch_access')
                ->insertBatch($branchAccessRows);

            if (
                $branchAccessInserted === false
                || $branchAccessInserted !== count($branchAccessRows)
            ) {
                throw new RuntimeException(
                    'The user branch access could not be assigned.'
                );
            }

            if ($this->db->transStatus() === false) {
                throw new RuntimeException(
                    'The user transaction could not be completed.'
                );
            }

            $this->db->transCommit();

            return $this->getCreatedUser($userId, $companyId);
        } catch (Throwable $exception) {
            $this->db->transRollback();

            if ($exception instanceof RuntimeException) {
                throw $exception;
            }

            log_message(
                'error',
                'Unexpected user creation error: {message}',
                ['message' => $exception->getMessage()]
            );

            throw new RuntimeException(
                'The user could not be created.',
                0,
                $exception
            );
        }
    }

	/**
	 * Update a user belonging to the authenticated user's company.
	 *
	 * Password is not changed through this method.
	 *
	 * @param array<string, mixed> $payload
	 *
	 * @return array<string, mixed>
	 */
	public function updateUser(
		int $userId,
		array $payload,
		object $authenticatedUser
	): array {
		$companyId = (int) ($authenticatedUser->company_id ?? 0);
		$updatedBy = (int) ($authenticatedUser->id ?? 0);

		if ($userId <= 0) {
			throw new RuntimeException(
				'A valid user ID is required.'
			);
		}

		if ($updatedBy <= 0 || $companyId <= 0) {
			throw new RuntimeException(
				'The authenticated company context is invalid.'
			);
		}

		$existingUser = $this->db
			->table('users')
			->select([
				'id',
				'company_id',
				'is_super_admin',
				'deleted_at',
			])
			->where('id', $userId)
			->where('company_id', $companyId)
			->where('deleted_at', null)
			->get()
			->getRowArray();

		if ($existingUser === null) {
			throw new RuntimeException(
				'The selected user was not found for this company.'
			);
		}

		/*
		 * Reuse the proven create validation.
		 * Password is supplied only for validation and is never saved.
		 */
		$validationPayload = $payload;
		$validationPayload['password'] = 'UpdateOnly@12345';

		$data = $this->validateCreatePayload($validationPayload);

		unset($data['password']);

		$role = $this->getCompanyRole(
			$companyId,
			$data['role_id']
		);

		if ($role === null) {
			throw new RuntimeException(
				'The selected role was not found for this company.'
			);
		}

		if (! $this->isRecordActive($role)) {
			throw new RuntimeException(
				'The selected role is inactive.'
			);
		}

		$branches = $this->getCompanyBranches(
			$companyId,
			$data['branch_ids']
		);

		if (count($branches) !== count($data['branch_ids'])) {
			throw new RuntimeException(
				'One or more selected branches do not belong to this company.'
			);
		}

		foreach ($branches as $branch) {
			if (! $this->isRecordActive($branch)) {
				throw new RuntimeException(
					'One or more selected branches are inactive.'
				);
			}
		}

		$this->ensureUsernameIsAvailable(
			$data['username'],
			$userId
		);

		$this->ensureEmailIsAvailable(
			$data['email'],
			$userId
		);

		if ($data['employee_code'] !== null) {
			$this->ensureEmployeeCodeIsAvailable(
				$companyId,
				$data['employee_code'],
				$userId
			);
		}

		$now   = date('Y-m-d H:i:s');
		$today = date('Y-m-d');

		$this->db->transBegin();

		try {
			$this->ensureUsernameIsAvailable(
				$data['username'],
				$userId
			);

			$this->ensureEmailIsAvailable(
				$data['email'],
				$userId
			);

			if ($data['employee_code'] !== null) {
				$this->ensureEmployeeCodeIsAvailable(
					$companyId,
					$data['employee_code'],
					$userId
				);
			}

			$userUpdated = $this->db
				->table('users')
				->where('id', $userId)
				->where('company_id', $companyId)
				->where('deleted_at', null)
				->update([
					'default_branch_id'    => $data['default_branch_id'],
					'employee_code'        => $data['employee_code'],
					'username'             => $data['username'],
					'email'                => $data['email'],
					'phone'                => $data['phone'],
					'first_name'           => $data['first_name'],
					'last_name'            => $data['last_name'],
					'designation'          => $data['designation'],
					'user_type_id'         => $data['user_type_id'],
					'must_change_password' => (
						$data['must_change_password'] ? 1 : 0
					),
					'updated_by'           => $updatedBy,
					'updated_at'           => $now,
				]);

			if (! $userUpdated) {
				throw new RuntimeException(
					'The user record could not be updated.'
				);
			}

			/*
			 * Keep Shield login email synchronized.
			 */
			$identityUpdated = $this->db
				->table('auth_identities')
				->where('user_id', $userId)
				->where('type', 'email_password')
				->update([
					'secret'      => $data['email'],
					'force_reset' => (
						$data['must_change_password'] ? 1 : 0
					),
					'updated_at'  => $now,
				]);

			if (! $identityUpdated) {
				throw new RuntimeException(
					'The authentication identity could not be updated.'
				);
			}

			/*
			 * Deactivate the current active role.
			 */
			$this->db
				->table('user_roles')
				->where('company_id', $companyId)
				->where('user_id', $userId)
				->where('is_active', 1)
				->where('deleted_at', null)
				->update([
					'is_primary'  => 0,
					'is_active'   => 0,
					'valid_until' => $today,
					'updated_at'  => $now,
				]);

			/*
			 * Reuse an existing historical role row when available.
			 */
			$existingRoleAssignment = $this->db
				->table('user_roles')
				->select('id')
				->where('company_id', $companyId)
				->where('user_id', $userId)
				->where('role_id', $data['role_id'])
				->where('deleted_at', null)
				->orderBy('id', 'DESC')
				->get()
				->getRowArray();

			if ($existingRoleAssignment !== null) {
				$roleSaved = $this->db
					->table('user_roles')
					->where(
						'id',
						(int) $existingRoleAssignment['id']
					)
					->update([
						'assigned_by' => $updatedBy,
						'assigned_at' => $now,
						'valid_from'  => $today,
						'valid_until' => null,
						'is_primary'  => 1,
						'is_active'   => 1,
						'updated_at'  => $now,
					]);
			} else {
				$roleSaved = $this->db
					->table('user_roles')
					->insert([
						'company_id'  => $companyId,
						'user_id'     => $userId,
						'role_id'     => $data['role_id'],
						'assigned_by' => $updatedBy,
						'assigned_at' => $now,
						'valid_from'  => $today,
						'valid_until' => null,
						'is_primary'  => 1,
						'is_active'   => 1,
						'created_at'  => $now,
						'updated_at'  => $now,
						'deleted_at'  => null,
					]);
			}

			if (! $roleSaved) {
				throw new RuntimeException(
					'The user role could not be updated.'
				);
			}

			/*
			 * Deactivate current branch access.
			 */
			$this->db
				->table('user_branch_access')
				->where('company_id', $companyId)
				->where('user_id', $userId)
				->where('is_active', 1)
				->where('deleted_at', null)
				->update([
					'is_default'  => 0,
					'is_active'   => 0,
					'valid_until' => $today,
					'updated_at'  => $now,
				]);

			foreach ($data['branch_ids'] as $branchId) {
				$existingBranchAccess = $this->db
					->table('user_branch_access')
					->select('id')
					->where('company_id', $companyId)
					->where('user_id', $userId)
					->where('branch_id', $branchId)
					->where('deleted_at', null)
					->orderBy('id', 'DESC')
					->get()
					->getRowArray();

				$branchAccessData = [
					'access_level_id' => $data['access_level_id'],
					'granted_by'   => $updatedBy,
					'granted_at'   => $now,
					'valid_from'   => $today,
					'valid_until'  => null,
					'is_default'   => (
						$branchId === $data['default_branch_id']
					) ? 1 : 0,
					'is_active'    => 1,
					'updated_at'   => $now,
				];

				if ($existingBranchAccess !== null) {
					$branchSaved = $this->db
						->table('user_branch_access')
						->where(
							'id',
							(int) $existingBranchAccess['id']
						)
						->update($branchAccessData);
				} else {
					$branchAccessData['company_id'] = $companyId;
					$branchAccessData['user_id'] = $userId;
					$branchAccessData['branch_id'] = $branchId;
					$branchAccessData['created_at'] = $now;
					$branchAccessData['deleted_at'] = null;

					$branchSaved = $this->db
						->table('user_branch_access')
						->insert($branchAccessData);
				}

				if (! $branchSaved) {
					throw new RuntimeException(
						'The user branch access could not be updated.'
					);
				}
			}

			if ($this->db->transStatus() === false) {
				throw new RuntimeException(
					'The user update transaction could not be completed.'
				);
			}

			$this->db->transCommit();

			return $this->getCreatedUser(
				$userId,
				$companyId
			);
		} catch (Throwable $exception) {
			$this->db->transRollback();

			if ($exception instanceof RuntimeException) {
				throw $exception;
			}

			log_message(
				'error',
				'Unexpected user update error for user {userId}: {message}',
				[
					'userId' => $userId,
					'message' => $exception->getMessage(),
				]
			);

			throw new RuntimeException(
				'The user could not be updated.',
				0,
				$exception
			);
		}
	}
    /**
     * Validate and normalise the create-user request.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function validateCreatePayload(array $payload): array
    {
        $username = strtolower(
            trim((string) ($payload['username'] ?? ''))
        );

        $email = strtolower(
            trim((string) ($payload['email'] ?? ''))
        );

        $password = (string) ($payload['password'] ?? '');

        $firstName = trim(
            (string) ($payload['first_name'] ?? '')
        );

        $lastName = trim(
            (string) ($payload['last_name'] ?? '')
        );

        $employeeCode = $this->nullableString(
            $payload['employee_code'] ?? null
        );

        $phone = $this->nullableString(
            $payload['phone'] ?? null
        );

        $designation = $this->nullableString(
            $payload['designation'] ?? null
        );

        /*
         * Mandatory: no static default.
         */
        $userTypeId = filter_var(
            $payload['user_type_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        /*
         * Mandatory: no static default.
         */
        $accessLevelId = filter_var(
            $payload['access_level_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($username === '') {
            throw new RuntimeException(
                'The username field is required.'
            );
        }

        if (
            strlen($username) < 3
            || strlen($username) > 80
        ) {
            throw new RuntimeException(
                'The username must contain between 3 and 80 characters.'
            );
        }

        if (! preg_match('/^[a-z0-9._-]+$/', $username)) {
            throw new RuntimeException(
                'The username may contain only letters, numbers, dots, underscores and hyphens.'
            );
        }

        if ($email === '') {
            throw new RuntimeException(
                'The email field is required.'
            );
        }

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw new RuntimeException(
                'A valid email address is required.'
            );
        }

        if (strlen($email) > 150) {
            throw new RuntimeException(
                'The email address may not exceed 150 characters.'
            );
        }

        if ($password === '') {
            throw new RuntimeException(
                'The password field is required.'
            );
        }

        if (strlen($password) < 8) {
            throw new RuntimeException(
                'The password must contain at least 8 characters.'
            );
        }

        if ($firstName === '') {
            throw new RuntimeException(
                'The first_name field is required.'
            );
        }

        if (strlen($firstName) > 80) {
            throw new RuntimeException(
                'The first name may not exceed 80 characters.'
            );
        }

        if (strlen($lastName) > 80) {
            throw new RuntimeException(
                'The last name may not exceed 80 characters.'
            );
        }

        if (
            $employeeCode !== null
            && strlen($employeeCode) > 30
        ) {
            throw new RuntimeException(
                'The employee code may not exceed 30 characters.'
            );
        }

        if ($phone !== null && strlen($phone) > 25) {
            throw new RuntimeException(
                'The phone number may not exceed 25 characters.'
            );
        }

        if (
            $designation !== null
            && strlen($designation) > 100
        ) {
            throw new RuntimeException(
                'The designation may not exceed 100 characters.'
            );
        }

        if ($userTypeId === false) {
            throw new RuntimeException(
                'A valid user_type_id is required.'
            );
        }

        if (! $this->masterIdExists('users_user_type_masters', (int) $userTypeId)) {
            throw new RuntimeException(
                'The selected user_type_id is invalid or inactive.'
            );
        }

        if ($accessLevelId === false) {
            throw new RuntimeException(
                'A valid access_level_id is required.'
            );
        }

        if (! $this->masterIdExists('user_branch_access_access_level_masters', (int) $accessLevelId)) {
            throw new RuntimeException(
                'The selected access_level_id is invalid or inactive.'
            );
        }

        $roleId = filter_var(
            $payload['role_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($roleId === false) {
            throw new RuntimeException(
                'A valid role_id is required.'
            );
        }

        $defaultBranchId = filter_var(
            $payload['default_branch_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($defaultBranchId === false) {
            throw new RuntimeException(
                'A valid default_branch_id is required.'
            );
        }

        if (
            ! array_key_exists('branch_ids', $payload)
            || ! is_array($payload['branch_ids'])
            || $payload['branch_ids'] === []
        ) {
            throw new RuntimeException(
                'The branch_ids field must contain at least one branch ID.'
            );
        }

        $branchIds = [];

        foreach ($payload['branch_ids'] as $branchId) {
            $validatedBranchId = filter_var(
                $branchId,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]]
            );

            if ($validatedBranchId === false) {
                throw new RuntimeException(
                    'Every branch ID must be a positive integer.'
                );
            }

            $branchIds[] = (int) $validatedBranchId;
        }

        $branchIds = array_values(array_unique($branchIds));

        sort($branchIds);

        if (
            ! in_array(
                (int) $defaultBranchId,
                $branchIds,
                true
            )
        ) {
            throw new RuntimeException(
                'The default branch must be included in branch_ids.'
            );
        }

        $mustChangePassword = filter_var(
            $payload['must_change_password'] ?? true,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        if ($mustChangePassword === null) {
            throw new RuntimeException(
                'must_change_password must be true or false.'
            );
        }

        return [
            'employee_code'        => $employeeCode,
            'username'             => $username,
            'email'                => $email,
            'password'             => $password,
            'phone'                => $phone,
            'first_name'           => $firstName,
            'last_name'            => $lastName,
            'designation'          => $designation,
            'user_type_id'         => (int) $userTypeId,
            'role_id'              => (int) $roleId,
            'default_branch_id'    => (int) $defaultBranchId,
            'branch_ids'           => $branchIds,
            'access_level_id'      => (int) $accessLevelId,
            'must_change_password' => $mustChangePassword,
        ];
    }

    private function masterIdExists(string $table, int $id): bool
    {
        return $id > 0
            && $this->db->table($table)
                ->where('id', $id)
                ->where('is_active', 1)
                ->countAllResults() > 0;
    }

    private function getActiveUserStatusId(): int
    {
        $row = $this->db->table('user_statuses')
            ->select('id')
            ->where('status_code', 'ACTIVE')
            ->where('is_login_allowed', 1)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();

        if ($row === null) {
            throw new RuntimeException(
                'The ACTIVE user status master is missing or inactive.'
            );
        }

        return (int) $row['id'];
    }

    private function ensureUsernameIsAvailable(
        string $username,
        ?int $excludeUserId = null
    ): void {
        $builder = $this->db
            ->table('users')
            ->select('id')
            ->where('username', $username)
            ->where('deleted_at', null);

        if ($excludeUserId !== null) {
            $builder->where('id !=', $excludeUserId);
        }

        $existingUser = $builder->get()
            ->getRowArray();

        if ($existingUser !== null) {
            throw new RuntimeException(
                'The username is already in use.'
            );
        }
    }

    private function ensureEmailIsAvailable(
        string $email,
        ?int $excludeUserId = null
    ): void {
        $userBuilder = $this->db
            ->table('users')
            ->select('id')
            ->where('email', $email)
            ->where('deleted_at', null);

        if ($excludeUserId !== null) {
            $userBuilder->where('id !=', $excludeUserId);
        }

        $existingUser = $userBuilder->get()
            ->getRowArray();

        if ($existingUser !== null) {
            throw new RuntimeException(
                'The email address is already in use.'
            );
        }

        $identityBuilder = $this->db
            ->table('auth_identities')
            ->select('id')
            ->where('type', 'email_password')
            ->where('secret', $email);

        if ($excludeUserId !== null) {
            $identityBuilder->where('user_id !=', $excludeUserId);
        }

        $existingIdentity = $identityBuilder->get()
            ->getRowArray();

        if ($existingIdentity !== null) {
            throw new RuntimeException(
                'The email address is already registered for authentication.'
            );
        }
    }

    private function ensureEmployeeCodeIsAvailable(
        int $companyId,
        string $employeeCode,
        ?int $excludeUserId = null
    ): void {
        $builder = $this->db
            ->table('users')
            ->select('id')
            ->where('company_id', $companyId)
            ->where('employee_code', $employeeCode)
            ->where('deleted_at', null);

        if ($excludeUserId !== null) {
            $builder->where('id !=', $excludeUserId);
        }

        $existingUser = $builder->get()
            ->getRowArray();

        if ($existingUser !== null) {
            throw new RuntimeException(
                'The employee code is already in use for this company.'
            );
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function getCompany(int $companyId): ?array
    {
        return $this->db
            ->table('companies')
            ->select([
                'id',
                'company_name',
                'is_active',
                'deleted_at',
            ])
            ->where('id', $companyId)
            ->where('deleted_at', null)
            ->get()
            ->getRowArray();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function getCompanyRole(
        int $companyId,
        int $roleId
    ): ?array {
        return $this->db
            ->table('roles AS r')
            ->select([
                'r.id', 'r.company_id', 'r.role_code', 'r.role_name',
                'r.role_scope_id', 'rs.scope_code AS role_scope_code',
                'rs.scope_name AS role_scope_name', 'r.is_active',
                'r.deleted_at',
            ])
            ->join('role_scopes AS rs', 'rs.id = r.role_scope_id', 'inner')
            ->where('r.id', $roleId)
            ->where('r.company_id', $companyId)
            ->where('r.deleted_at', null)
            ->get()
            ->getRowArray();
    }

    /**
     * @param list<int> $branchIds
     *
     * @return list<array<string, mixed>>
     */
    private function getCompanyBranches(
        int $companyId,
        array $branchIds
    ): array {
        if ($branchIds === []) {
            return [];
        }

        return $this->db
            ->table('branches')
            ->select([
                'id',
                'company_id',
                'branch_code',
                'branch_name',
                'is_active',
                'deleted_at',
            ])
            ->where('company_id', $companyId)
            ->whereIn('id', $branchIds)
            ->where('deleted_at', null)
            ->get()
            ->getResultArray();
    }

    /**
     * Return the complete created-user response.
     *
     * @return array<string, mixed>
     */
    private function getCreatedUser(
        int $userId,
        int $companyId
    ): array {
        $user = $this->db
            ->table('users AS u')
            ->select([
                'u.id',
                'u.company_id',
                'u.default_branch_id',
                'u.employee_code',
                'u.username',
                'u.email',
                'u.phone',
                'u.first_name',
                'u.last_name',
                'u.designation',
                'u.user_type_id',
                'utm.user_type_code',
                'utm.user_type_name',
                'u.user_status_id',
                'us.status_code AS user_status_code',
                'us.status_name AS user_status_name',
                'u.active',
                'u.must_change_password',
                'u.is_super_admin',
                'u.is_active',
                'u.created_by',
                'u.updated_by',
                'u.created_at',
                'u.updated_at',
            ])
            ->join('users_user_type_masters AS utm', 'utm.id = u.user_type_id', 'inner')
            ->join('user_statuses AS us', 'us.id = u.user_status_id', 'inner')
            ->where('u.id', $userId)
            ->where('u.company_id', $companyId)
            ->where('u.deleted_at', null)
            ->get()
            ->getRowArray();

        if ($user === null) {
            throw new RuntimeException(
                'The created user could not be retrieved.'
            );
        }

        $role = $this->db
            ->table('user_roles AS ur')
            ->select([
                'r.id',
                'r.role_code',
                'r.role_name',
                'r.role_scope_id',
                'rs.scope_code AS role_scope_code',
                'rs.scope_name AS role_scope_name',
                'ur.is_primary',
                'ur.assigned_at',
            ])
            ->join(
                'roles AS r',
                'r.id = ur.role_id',
                'inner'
            )
            ->join('role_scopes AS rs', 'rs.id = r.role_scope_id', 'inner')
            ->where('ur.company_id', $companyId)
            ->where('ur.user_id', $userId)
            ->where('ur.is_active', 1)
            ->where('ur.deleted_at', null)
            ->where('r.is_active', 1)
            ->where('r.deleted_at', null)
            ->orderBy('ur.is_primary', 'DESC')
            ->get()
            ->getRowArray();

        $branches = $this->db
            ->table('user_branch_access AS uba')
            ->select([
                'b.id',
                'b.branch_code',
                'b.branch_name',
                'uba.access_level_id',
                'alm.access_level_code',
                'alm.access_level_name',
                'uba.is_default',
                'uba.granted_at',
            ])
            ->join(
                'branches AS b',
                'b.id = uba.branch_id',
                'inner'
            )
            ->join(
                'user_branch_access_access_level_masters AS alm',
                'alm.id = uba.access_level_id',
                'inner'
            )
            ->where('uba.company_id', $companyId)
            ->where('uba.user_id', $userId)
            ->where('uba.is_active', 1)
            ->where('uba.deleted_at', null)
            ->where('b.is_active', 1)
            ->where('b.deleted_at', null)
            ->orderBy('uba.is_default', 'DESC')
            ->orderBy('b.branch_name', 'ASC')
            ->get()
            ->getResultArray();

        $user['id'] = (int) $user['id'];
        $user['company_id'] = (int) $user['company_id'];
        $user['default_branch_id'] = (
            (int) $user['default_branch_id']
        );
        $user['active'] = (bool) $user['active'];
        $user['must_change_password'] = (
            (bool) $user['must_change_password']
        );
        $user['is_super_admin'] = (
            (bool) $user['is_super_admin']
        );
        $user['is_active'] = (bool) $user['is_active'];

        $user['created_by'] = $user['created_by'] !== null
            ? (int) $user['created_by']
            : null;

        $user['updated_by'] = $user['updated_by'] !== null
            ? (int) $user['updated_by']
            : null;

        if ($role !== null) {
            $role['id'] = (int) $role['id'];
            $role['is_primary'] = (
                (bool) $role['is_primary']
            );
        }

        foreach ($branches as &$branch) {
            $branch['id'] = (int) $branch['id'];
            $branch['is_default'] = (
                (bool) $branch['is_default']
            );
        }

        unset($branch);

        $user['role'] = $role;
        $user['branches'] = $branches;

        return $user;
    }

    /**
     * Check the common is_active column.
     *
     * @param array<string, mixed> $record
     */
    private function isRecordActive(array $record): bool
    {
        if (! array_key_exists('is_active', $record)) {
            return true;
        }

        return (int) $record['is_active'] === 1;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }
}
