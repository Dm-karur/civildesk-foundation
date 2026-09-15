<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Shield\Config\Auth;

class IntegrateShieldWithExistingUsers extends Migration
{
    private array $tables;

    public function __construct()
    {
        parent::__construct();

        /** @var Auth $authConfig */
        $authConfig = config('Auth');

        if ($authConfig->DBGroup !== null) {
            $this->DBGroup = $authConfig->DBGroup;
        }

        $this->tables = $authConfig->tables;
    }

    public function up(): void
    {
        /*
         * Keep the existing business users table.
         * Add only the fields required by Shield.
         */
        $userFields = $this->db->getFieldNames($this->tables['users']);

        $newUserFields = [];

        if (! in_array('active', $userFields, true)) {
            $newUserFields['active'] = [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'null'       => false,
                'default'    => 1,
                'after'      => 'user_status_id',
            ];
        }

        if (! in_array('status_message', $userFields, true)) {
            $newUserFields['status_message'] = [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
                'after'      => 'active',
            ];
        }

        if (! in_array('last_active', $userFields, true)) {
            $newUserFields['last_active'] = [
                'type'  => 'DATETIME',
                'null'  => true,
                'after' => 'status_message',
            ];
        }

        if ($newUserFields !== []) {
            $this->forge->addColumn($this->tables['users'], $newUserFields);
        }

        /*
         * Shield authentication identities.
         * Passwords, email identities and access tokens are stored here.
         */
        if (! $this->db->tableExists($this->tables['identities'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                ],
                'type' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'name' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'secret' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'secret2' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'expires' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'extra' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
                'force_reset' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'null'       => false,
                    'default'    => 0,
                ],
                'last_used_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addUniqueKey(['type', 'secret']);
            $this->forge->addKey('user_id');
            $this->forge->addForeignKey(
                'user_id',
                $this->tables['users'],
                'id',
                '',
                'CASCADE',
                'fk_auth_identities_user'
            );

            $this->forge->createTable(
                $this->tables['identities'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }

        /*
         * Username/password login attempt history.
         * No foreign key is used because audit history must remain
         * even if a user is removed.
         */
        if (! $this->db->tableExists($this->tables['logins'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'ip_address' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'user_agent' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'id_type' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'identifier' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'date' => [
                    'type' => 'DATETIME',
                ],
                'success' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addKey(['id_type', 'identifier']);
            $this->forge->addKey('user_id');

            $this->forge->createTable(
                $this->tables['logins'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }

        /*
         * Bearer-token login attempt history.
         */
        if (! $this->db->tableExists($this->tables['token_logins'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'ip_address' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'user_agent' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'id_type' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'identifier' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'date' => [
                    'type' => 'DATETIME',
                ],
                'success' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addKey(['id_type', 'identifier']);
            $this->forge->addKey('user_id');

            $this->forge->createTable(
                $this->tables['token_logins'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }

        /*
         * Remember-me tokens.
         */
        if (! $this->db->tableExists($this->tables['remember_tokens'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'selector' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'hashedValidator' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                ],
                'expires' => [
                    'type' => 'DATETIME',
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addUniqueKey('selector');
            $this->forge->addKey('user_id');
            $this->forge->addForeignKey(
                'user_id',
                $this->tables['users'],
                'id',
                '',
                'CASCADE',
                'fk_auth_remember_user'
            );

            $this->forge->createTable(
                $this->tables['remember_tokens'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }

        /*
         * Shield group assignments.
         * We will not use this as a replacement for the existing
         * business roles and permissions.
         */
        if (! $this->db->tableExists($this->tables['groups_users'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                ],
                'group' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => false,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addUniqueKey(['user_id', 'group']);
            $this->forge->addKey('user_id');
            $this->forge->addForeignKey(
                'user_id',
                $this->tables['users'],
                'id',
                '',
                'CASCADE',
                'fk_auth_groups_user'
            );

            $this->forge->createTable(
                $this->tables['groups_users'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }

        /*
         * Shield user-specific permission assignments.
         */
        if (! $this->db->tableExists($this->tables['permissions_users'])) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'user_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                ],
                'permission' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => false,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
            ]);

            $this->forge->addPrimaryKey('id');
            $this->forge->addUniqueKey(['user_id', 'permission']);
            $this->forge->addKey('user_id');
            $this->forge->addForeignKey(
                'user_id',
                $this->tables['users'],
                'id',
                '',
                'CASCADE',
                'fk_auth_permissions_user'
            );

            $this->forge->createTable(
                $this->tables['permissions_users'],
                false,
                ['ENGINE' => 'InnoDB']
            );
        }
    }

    public function down(): void
    {
        $this->db->disableForeignKeyChecks();

        $this->forge->dropTable($this->tables['permissions_users'], true);
        $this->forge->dropTable($this->tables['groups_users'], true);
        $this->forge->dropTable($this->tables['remember_tokens'], true);
        $this->forge->dropTable($this->tables['token_logins'], true);
        $this->forge->dropTable($this->tables['logins'], true);
        $this->forge->dropTable($this->tables['identities'], true);

        $this->db->enableForeignKeyChecks();

        $existingFields = $this->db->getFieldNames($this->tables['users']);
        $columnsToDrop   = [];

        foreach (['active', 'status_message', 'last_active'] as $column) {
            if (in_array($column, $existingFields, true)) {
                $columnsToDrop[] = $column;
            }
        }

        if ($columnsToDrop !== []) {
            $this->forge->dropColumn(
                $this->tables['users'],
                $columnsToDrop
            );
        }
    }
}
