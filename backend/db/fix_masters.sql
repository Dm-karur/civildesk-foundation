CREATE TABLE IF NOT EXISTS `project_milestone_status_masters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `project_milestone_status_masters` (`id`, `status_code`, `status_name`, `sort_order`) VALUES
(1, 'PLANNED', 'Planned', 1),
(2, 'IN_PROGRESS', 'In Progress', 2),
(3, 'ACHIEVED', 'Achieved', 3),
(4, 'DELAYED', 'Delayed', 4),
(5, 'CANCELLED', 'Cancelled', 5);

CREATE TABLE IF NOT EXISTS `labour_attendance_exception_category_masters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_code` varchar(50) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_code` (`category_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `labour_attendance_exception_category_masters` (`id`, `category_code`, `category_name`, `sort_order`) VALUES
(1, 'LATE_ENTRY', 'Late Entry', 1),
(2, 'EARLY_EXIT', 'Early Exit', 2),
(3, 'MISSED_PUNCH', 'Missed Biometric Punch', 3),
(4, 'OVERTIME_DISPUTE', 'Overtime Discrepancy', 4),
(5, 'UNAUTHORIZED_ABSENCE', 'Unauthorized Absence', 5);

CREATE TABLE IF NOT EXISTS `labour_attendance_exception_status_masters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `labour_attendance_exception_status_masters` (`id`, `status_code`, `status_name`, `sort_order`) VALUES
(1, 'PENDING', 'Pending Review', 1),
(2, 'APPROVED', 'Approved', 2),
(3, 'REJECTED', 'Rejected', 3);
