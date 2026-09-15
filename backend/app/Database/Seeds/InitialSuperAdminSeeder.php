<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use RuntimeException;
use Throwable;

class InitialSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = 'superadmin@civilpro.com';
        $username = 'superadmin';
        $password = 'Admin@12345';
        $now      = date('Y-m-d H:i:s');

        $this->db->transException(true);
        $this->db->transStart();

        try {
            $company = $this->db->table('companies')
                ->select('id')
                ->where('id', 1)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->get()->getRowArray();
            $branch = $this->db->table('branches')
                ->select('id')
                ->where('id', 1)
                ->where('company_id', 1)
                ->where('is_active', 1)
                ->where('deleted_at', null)
                ->get()->getRowArray();
            $userType = $this->db->table('users_user_type_masters')
                ->select('id')
                ->where('user_type_code', 'COMPANY_ADMIN')
                ->where('is_active', 1)
                ->get()->getRowArray();
            $userStatus = $this->db->table('user_statuses')
                ->select('id')
                ->where('status_code', 'ACTIVE')
                ->where('is_login_allowed', 1)
                ->where('is_active', 1)
                ->get()->getRowArray();

            if ($company === null || $branch === null || $userType === null || $userStatus === null) {
                throw new RuntimeException(
                    'Company 1, branch 1, COMPANY_ADMIN user type and ACTIVE user status must exist before running this seeder.'
                );
            }

            $existingUser = $this->db
                ->table('users')
                ->where('company_id', 1)
                ->groupStart()
                    ->where('username', $username)
                    ->orWhere('email', $email)
                ->groupEnd()
                ->get()
                ->getRowArray();

            if ($existingUser !== null) {
                throw new RuntimeException(
                    'Super administrator already exists. Seeder stopped without creating duplicates.'
                );
            }

            $existingIdentity = $this->db
                ->table('auth_identities')
                ->where('type', 'email_password')
                ->where('secret', $email)
                ->get()
                ->getRowArray();

            if ($existingIdentity !== null) {
                throw new RuntimeException(
                    'An authentication identity already exists for ' . $email . '.'
                );
            }

            /*
             * Generate one secure password hash and store the same hash in:
             *
             * 1. users.password_hash for the existing business schema
             * 2. auth_identities.secret2 for Shield authentication
             */
            $passwordHash = service('passwords')->hash($password);

            $userData = [
                'company_id'             => 1,
                'default_branch_id'      => 1,
                'employee_code'          => null,
                'username'               => $username,
                'email'                  => $email,
                'phone'                  => null,
                'password_hash'          => $passwordHash,
                'first_name'             => 'Admin',
                'last_name'              => 'Civilpro',
                'designation'            => 'System Administrator',
                'user_type_id'           => (int) $userType['id'],
                'user_status_id'         => (int) $userStatus['id'],
                'active'                 => 1,
                'status_message'         => null,
                'last_active'            => null,
                'must_change_password'   => 1,
                'failed_login_attempts'  => 0,
                'locked_until'           => null,
                'last_login_at'          => null,
                'last_login_ip'          => null,
                'password_changed_at'    => $now,
                'email_verified_at'      => $now,
                'remember_token'         => null,
                'is_super_admin'         => 1,
                'is_active'              => 1,
                'created_by'             => null,
                'updated_by'             => null,
                'created_at'             => $now,
                'updated_at'             => $now,
                'deleted_at'             => null,
            ];

            $this->db->table('users')->insert($userData);

            $userId = (int) $this->db->insertID();

            if ($userId <= 0) {
                throw new RuntimeException(
                    'Unable to obtain the newly created administrator ID.'
                );
            }

            $identityData = [
                'user_id'      => $userId,
                'type'         => 'email_password',
                'name'         => null,
                'secret'       => $email,
                'secret2'      => $passwordHash,
                'expires'      => null,
                'extra'        => null,
                'force_reset'  => 0,
                'last_used_at' => null,
                'created_at'   => $now,
                'updated_at'   => $now,
            ];

            $this->db->table('auth_identities')->insert($identityData);

            $this->db->transComplete();

            echo PHP_EOL;
            echo 'Initial super administrator created successfully.' . PHP_EOL;
            echo 'User ID: ' . $userId . PHP_EOL;
            echo 'Username: ' . $username . PHP_EOL;
            echo 'Email: ' . $email . PHP_EOL;
            echo 'Temporary password change required: Yes' . PHP_EOL;
        } catch (Throwable $exception) {
            $this->db->transRollback();

            throw $exception;
        }
    }
}
