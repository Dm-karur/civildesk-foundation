-- ====================================================================
-- CivilDesk Foundation ERP - Sub Work (Subcontractor Daily Work) Schema
-- ====================================================================
-- This SQL script sets up all database tables required for the
-- Sub Work Module (Subcontractor Daily Wages & Work Registers, Trade Templates).
-- Run this script in phpMyAdmin or your MySQL console.
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Sub Work Daily Registers (Subcontractor Daily Wage & Work Slips)
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
    INDEX `idx_subwork_reg_company_site` (`company_id`, `site_id`),
    INDEX `idx_subwork_reg_subcontractor` (`subcontractor_id`),
    INDEX `idx_subwork_reg_wage_date` (`wage_date`),
    INDEX `idx_subwork_reg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Sub Work Daily Register Lines (Trade items, shifts, equipment, expenses)
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
    INDEX `idx_subwork_line_register` (`daily_wage_register_id`),
    INDEX `idx_subwork_line_company` (`company_id`),
    INDEX `idx_subwork_line_classification` (`classification`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Sub Work Item & Trade Templates (Default trades/rates per subcontractor or contractor type)
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
    INDEX `idx_subwork_template_subcontractor` (`subcontractor_id`),
    INDEX `idx_subwork_template_type` (`subcontractor_type_id`),
    INDEX `idx_subwork_template_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed Standard Trade Templates (if not already seeded)
INSERT IGNORE INTO `daily_wage_item_templates` 
    (`id`, `company_id`, `subcontractor_id`, `subcontractor_type_id`, `classification`, `description`, `uom`, `default_rate`, `display_order`, `is_active`)
VALUES
    (1, 1, NULL, 1, 'Manpower', 'Head Mason / Mistri', 'shift', 950.00, 1, 1),
    (2, 1, NULL, 1, 'Manpower', 'Barbender / Steel Fixer', 'shift', 900.00, 2, 1),
    (3, 1, NULL, 1, 'Manpower', 'Shuttering Carpenter', 'shift', 900.00, 3, 1),
    (4, 1, NULL, 1, 'Manpower', 'Male Helper / Mazdoor', 'shift', 550.00, 4, 1),
    (5, 1, NULL, 1, 'Manpower', 'Female Helper / Chitti', 'shift', 500.00, 5, 1),
    (6, 1, NULL, 1, 'Manpower', 'Electrician / Plumber', 'shift', 850.00, 6, 1),
    (7, 1, NULL, 2, 'Equipment', 'JCB / Excavator with Operator', 'day', 9500.00, 7, 1),
    (8, 1, NULL, 2, 'Equipment', 'Concrete Mixer Machine', 'day', 2200.00, 8, 1),
    (9, 1, NULL, 2, 'Equipment', 'Vibrator & Needle Set', 'day', 600.00, 9, 1),
    (10, 1, NULL, 1, 'Expense', 'Food / Tea Allowance (Daily)', 'shift', 50.00, 10, 1),
    (11, 1, NULL, 1, 'Expense', 'Site Travel Allowance', 'trip', 150.00, 11, 1)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

SET FOREIGN_KEY_CHECKS = 1;
