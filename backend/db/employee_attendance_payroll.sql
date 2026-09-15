-- =============================================================================
-- CivilDesk Foundation — Employee Attendance & Payroll Module
-- Database Migration Script
-- =============================================================================
-- Run this script against the existing database.
-- It only ADDS new tables and does NOT modify existing tables.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 1. SITE ATTENDANCE SETTINGS (per-site shift & attendance configuration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_attendance_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `site_id` INT UNSIGNED NOT NULL,

  -- Shift timings
  `shift_start_time` TIME NOT NULL DEFAULT '09:00:00',
  `shift_end_time` TIME NOT NULL DEFAULT '18:00:00',
  `break_duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 60,

  -- Grace & thresholds
  `grace_period_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  `half_day_min_hours` DECIMAL(4,2) NOT NULL DEFAULT 4.00,
  `full_day_min_hours` DECIMAL(4,2) NOT NULL DEFAULT 7.50,
  `absent_threshold_hours` DECIMAL(4,2) NOT NULL DEFAULT 2.00,

  -- Overtime
  `overtime_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `overtime_after_hours` DECIMAL(4,2) NOT NULL DEFAULT 8.50,
  `overtime_rate_multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.50,

  -- Weekly off
  `week_off_days` VARCHAR(50) DEFAULT 'SUNDAY' COMMENT 'Comma-separated: SUNDAY,SATURDAY',

  -- LOP divisor
  `lop_calculation_method` ENUM('CALENDAR','WORKING','FIXED') NOT NULL DEFAULT 'CALENDAR',
  `lop_fixed_divisor` SMALLINT UNSIGNED DEFAULT 30,

  -- Geofence override (if different from project_sites)
  `geofence_radius_override_m` INT UNSIGNED DEFAULT NULL,

  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_site_settings` (`company_id`, `site_id`),
  KEY `idx_site_id` (`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 2. COMPANY HOLIDAYS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_holidays` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `holiday_name` VARCHAR(150) NOT NULL,
  `holiday_date` DATE NOT NULL,
  `site_id` INT UNSIGNED DEFAULT NULL COMMENT 'NULL = all sites',
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_company_date` (`company_id`, `holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 3. EMPLOYEE SITE ASSIGNMENTS (which employee is assigned to which site)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_site_assignments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'FK to users.id (the employee)',
  `site_id` INT UNSIGNED NOT NULL COMMENT 'FK to project_sites.id',
  `assigned_from` DATE NOT NULL,
  `assigned_to` DATE DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_site` (`company_id`, `user_id`, `site_id`),
  KEY `idx_site_active` (`site_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 4. EMPLOYEE ATTENDANCES (GPS check-in/check-out records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_attendances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `site_id` INT UNSIGNED NOT NULL,
  `attendance_date` DATE NOT NULL,

  -- Check-in
  `check_in_time` DATETIME DEFAULT NULL,
  `check_in_latitude` DECIMAL(10,7) DEFAULT NULL,
  `check_in_longitude` DECIMAL(10,7) DEFAULT NULL,
  `check_in_distance_m` INT UNSIGNED DEFAULT NULL,
  `check_in_accuracy_m` INT UNSIGNED DEFAULT NULL,

  -- Check-out
  `check_out_time` DATETIME DEFAULT NULL,
  `check_out_latitude` DECIMAL(10,7) DEFAULT NULL,
  `check_out_longitude` DECIMAL(10,7) DEFAULT NULL,
  `check_out_distance_m` INT UNSIGNED DEFAULT NULL,
  `check_out_accuracy_m` INT UNSIGNED DEFAULT NULL,

  -- Calculated fields
  `working_hours` DECIMAL(5,2) DEFAULT NULL,
  `late_minutes` SMALLINT UNSIGNED DEFAULT 0,
  `early_exit_minutes` SMALLINT UNSIGNED DEFAULT 0,
  `overtime_hours` DECIMAL(5,2) DEFAULT 0.00,
  `break_deducted_minutes` SMALLINT UNSIGNED DEFAULT 0,

  -- Status: PRESENT, ABSENT, HALF_DAY, LEAVE, PERMISSION, WEEK_OFF, HOLIDAY, LATE, EARLY_EXIT, OVERTIME
  `status` VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
  `remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance` (`company_id`, `user_id`, `attendance_date`),
  KEY `idx_site_date` (`site_id`, `attendance_date`),
  KEY `idx_user_month` (`user_id`, `attendance_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 5. ATTENDANCE CORRECTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_corrections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `attendance_id` BIGINT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,

  `requested_check_in` DATETIME DEFAULT NULL,
  `requested_check_out` DATETIME DEFAULT NULL,
  `reason` TEXT NOT NULL,

  -- PENDING, APPROVED, REJECTED
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT UNSIGNED DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `review_remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance` (`attendance_id`),
  KEY `idx_user_status` (`company_id`, `user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 6. LEAVE TYPES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_types` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `leave_type_name` VARCHAR(100) NOT NULL,
  `leave_type_code` VARCHAR(30) NOT NULL,
  `max_days_per_year` SMALLINT UNSIGNED DEFAULT 0,
  `is_paid` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` SMALLINT UNSIGNED DEFAULT 0,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_code` (`company_id`, `leave_type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 7. EMPLOYEE LEAVE BALANCES (per year)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_leave_balances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `leave_type_id` INT UNSIGNED NOT NULL,
  `year` YEAR NOT NULL,
  `allocated` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `used` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `balance` DECIMAL(5,1) GENERATED ALWAYS AS (`allocated` - `used`) STORED,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_bal` (`company_id`, `user_id`, `leave_type_id`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 8. EMPLOYEE LEAVE REQUESTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_leave_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `leave_type_id` INT UNSIGNED NOT NULL,
  `from_date` DATE NOT NULL,
  `to_date` DATE NOT NULL,
  `total_days` DECIMAL(4,1) NOT NULL DEFAULT 1.0,
  `reason` TEXT DEFAULT NULL,

  -- PENDING, APPROVED, REJECTED, CANCELLED
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT UNSIGNED DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `review_remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_dates` (`company_id`, `user_id`, `from_date`, `to_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 9. EMPLOYEE PERMISSION REQUESTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_permission_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `permission_date` DATE NOT NULL,
  `from_time` TIME NOT NULL,
  `to_time` TIME NOT NULL,
  `duration_hours` DECIMAL(4,2) NOT NULL,
  `reason` TEXT DEFAULT NULL,

  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT UNSIGNED DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `review_remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`company_id`, `user_id`, `permission_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 10. EMPLOYEE OVERTIME RECORDS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_overtime` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `attendance_id` BIGINT UNSIGNED DEFAULT NULL,
  `site_id` INT UNSIGNED NOT NULL,
  `overtime_date` DATE NOT NULL,
  `regular_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `overtime_rate_multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.50,
  `overtime_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  -- PENDING, APPROVED, REJECTED
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`company_id`, `user_id`, `overtime_date`),
  KEY `idx_attendance` (`attendance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 11. EMPLOYEE SALARY STRUCTURES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_salary_structures` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `effective_from` DATE NOT NULL,

  -- Earnings
  `basic_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `hra` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `conveyance_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `special_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `other_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `site_allowance_per_day` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `overtime_hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  -- Deductions
  `epf_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `esi_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `professional_tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `other_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_effective` (`company_id`, `user_id`, `effective_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 12. EMPLOYEE ADVANCES / LOANS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_advances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `advance_type` ENUM('ADVANCE','LOAN') NOT NULL DEFAULT 'ADVANCE',
  `amount` DECIMAL(12,2) NOT NULL,
  `disbursed_date` DATE NOT NULL,
  `monthly_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_recovered` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `balance_remaining` DECIMAL(12,2) GENERATED ALWAYS AS (`amount` - `total_recovered`) STORED,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `remarks` TEXT DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`company_id`, `user_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 13. EMPLOYEE PAYROLLS (monthly payroll batch)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_payrolls` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `payroll_month` CHAR(7) NOT NULL COMMENT 'YYYY-MM',
  `site_id` INT UNSIGNED DEFAULT NULL,

  -- Attendance summary
  `total_days` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `working_days` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `present_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `absent_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `leave_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `half_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `week_off_days` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `holiday_days` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `lop_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `overtime_hours` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `late_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `payable_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0,

  -- Earnings
  `basic_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `hra` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `conveyance_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `special_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `other_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `site_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `overtime_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `incentive` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gross_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  -- Deductions
  `lop_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `epf_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `esi_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `professional_tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `advance_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `loan_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `other_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  `net_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  -- Workflow: DRAFT, REVIEW, APPROVED, LOCKED
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `generated_by` INT UNSIGNED DEFAULT NULL,
  `generated_at` DATETIME DEFAULT NULL,
  `approved_by` INT UNSIGNED DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `locked_by` INT UNSIGNED DEFAULT NULL,
  `locked_at` DATETIME DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,

  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll` (`company_id`, `user_id`, `payroll_month`),
  KEY `idx_month_status` (`company_id`, `payroll_month`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 14. ATTENDANCE AUDIT LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'ATTENDANCE, CORRECTION, LEAVE, PERMISSION, OVERTIME, PAYROLL',
  `entity_id` BIGINT UNSIGNED NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `old_value` JSON DEFAULT NULL,
  `new_value` JSON DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `performed_by` INT UNSIGNED NOT NULL,
  `performed_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_company` (`company_id`, `performed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 15. DEFAULT LEAVE TYPES (seed data)
-- ---------------------------------------------------------------------------
-- Note: Run this INSERT only once. Uses company_id=0 as template.
-- Your application should copy these to each company on creation.
INSERT IGNORE INTO `leave_types` (`company_id`, `leave_type_name`, `leave_type_code`, `max_days_per_year`, `is_paid`, `sort_order`)
VALUES
  (0, 'Casual Leave', 'CL', 12, 1, 1),
  (0, 'Sick Leave', 'SL', 12, 1, 2),
  (0, 'Earned Leave', 'EL', 15, 1, 3),
  (0, 'Compensatory Off', 'CO', 0, 1, 4),
  (0, 'Leave Without Pay', 'LWP', 0, 0, 5);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
