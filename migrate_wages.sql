-- Migration: Create daily wages tables and initial trade templates

CREATE TABLE IF NOT EXISTS `daily_wage_registers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `project_id` BIGINT UNSIGNED NULL DEFAULT 0,
    `site_id` BIGINT UNSIGNED NOT NULL,
    `subcontractor_id` BIGINT UNSIGNED NOT NULL,
    `wage_date` DATE NOT NULL,
    `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `global_remarks` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_dwr_company_site` (`company_id`, `site_id`),
    INDEX `idx_dwr_subcontractor` (`subcontractor_id`),
    INDEX `idx_dwr_wage_date` (`wage_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daily_wage_register_lines` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `daily_wage_register_id` BIGINT UNSIGNED NOT NULL,
    `template_id` BIGINT UNSIGNED NULL,
    `classification` VARCHAR(50) NOT NULL DEFAULT 'Manpower',
    `description` VARCHAR(255) NOT NULL,
    `uom` VARCHAR(30) NOT NULL DEFAULT 'shift',
    `quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `rate` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `remarks` TEXT NULL,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_dwrl_register` (`daily_wage_register_id`),
    INDEX `idx_dwrl_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daily_wage_item_templates` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `company_id` BIGINT UNSIGNED NOT NULL,
    `subcontractor_id` BIGINT UNSIGNED NULL,
    `subcontractor_type_id` BIGINT UNSIGNED NULL,
    `classification` VARCHAR(50) NOT NULL DEFAULT 'Manpower',
    `description` VARCHAR(255) NOT NULL,
    `uom` VARCHAR(30) NOT NULL DEFAULT 'shift',
    `default_rate` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    INDEX `idx_dwit_subcontractor` (`subcontractor_id`),
    INDEX `idx_dwit_type` (`subcontractor_type_id`),
    INDEX `idx_dwit_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default standard trade templates for existing company (company_id = 1)
INSERT INTO `daily_wage_item_templates` (`company_id`, `subcontractor_id`, `subcontractor_type_id`, `classification`, `description`, `uom`, `default_rate`, `display_order`, `is_active`)
VALUES
(1, NULL, 1, 'Manpower', 'Mason / Mistri', 'shift', 950.00, 1, 1),
(1, NULL, 1, 'Manpower', 'Barbender / Steel Fixer', 'shift', 900.00, 2, 1),
(1, NULL, 1, 'Manpower', 'Shuttering Carpenter', 'shift', 900.00, 3, 1),
(1, NULL, 1, 'Manpower', 'Male Helper / Mazdoor', 'shift', 550.00, 4, 1),
(1, NULL, 1, 'Manpower', 'Female Helper / Chitti', 'shift', 500.00, 5, 1),
(1, NULL, 1, 'Manpower', 'Electrician / Plumber', 'shift', 850.00, 6, 1),
(1, NULL, 2, 'Equipment', 'JCB / Excavator with Operator', 'day', 9500.00, 7, 1),
(1, NULL, 2, 'Equipment', 'Concrete Mixer Machine', 'day', 2200.00, 8, 1),
(1, NULL, 2, 'Equipment', 'Vibrator & Needle Set', 'day', 600.00, 9, 1),
(1, NULL, 1, 'Expense', 'Food / Tea Allowance (Daily)', 'shift', 50.00, 10, 1),
(1, NULL, 1, 'Expense', 'Site Travel Allowance', 'trip', 150.00, 11, 1);

-- Also populate for subcontractor 1 (Kovai Civil Works) if exists
INSERT INTO `daily_wage_item_templates` (`company_id`, `subcontractor_id`, `subcontractor_type_id`, `classification`, `description`, `uom`, `default_rate`, `display_order`, `is_active`)
SELECT 1, 1, contractor_type_id, 'Manpower', 'Mason / Mistri', 'shift', 950.00, 1, 1 FROM `subcontractors` WHERE id = 1
UNION ALL
SELECT 1, 1, contractor_type_id, 'Manpower', 'Barbender', 'shift', 900.00, 2, 1 FROM `subcontractors` WHERE id = 1
UNION ALL
SELECT 1, 1, contractor_type_id, 'Manpower', 'Carpenter', 'shift', 900.00, 3, 1 FROM `subcontractors` WHERE id = 1
UNION ALL
SELECT 1, 1, contractor_type_id, 'Manpower', 'Helper / Mazdoor', 'shift', 550.00, 4, 1 FROM `subcontractors` WHERE id = 1
UNION ALL
SELECT 1, 1, contractor_type_id, 'Expense', 'Food / Tea Allowance', 'shift', 50.00, 5, 1 FROM `subcontractors` WHERE id = 1;
