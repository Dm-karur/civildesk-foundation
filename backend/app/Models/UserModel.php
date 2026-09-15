<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Shield\Models\UserModel as ShieldUserModel;

/**
 * Shield authentication model integrated with the existing users table.
 *
 * Authentication identities and passwords remain managed by Shield through
 * auth_identities. Business profile fields are stored in users.
 */
class UserModel extends ShieldUserModel
{
    protected $table      = 'users';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        // Shield fields
        'username',
        'status_message',
        'active',
        'last_active',

        // Company and branch
        'company_id',
        'default_branch_id',

        // Employee profile
        'employee_code',
        'email',
        'phone',
        'first_name',
        'last_name',
        'designation',
        'user_type_id',
        'user_status_id',

        // Account controls
        'must_change_password',
        'failed_login_attempts',
        'locked_until',
        'last_login_at',
        'last_login_ip',
        'password_changed_at',
        'email_verified_at',
        'is_super_admin',
        'is_active',

        // Audit ownership
        'created_by',
        'updated_by',
    ];
}
