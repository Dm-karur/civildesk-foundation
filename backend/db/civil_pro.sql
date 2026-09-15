-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 20, 2026 at 11:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `civil_pro`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `module_code` varchar(60) NOT NULL,
  `action_code` varchar(60) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(1000) NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `request_method` varchar(10) DEFAULT NULL,
  `request_url` varchar(1000) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `error_message` text DEFAULT NULL,
  `occurred_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `company_id`, `branch_id`, `user_id`, `module_code`, `action_code`, `entity_type`, `entity_id`, `description`, `old_values`, `new_values`, `request_method`, `request_url`, `ip_address`, `user_agent`, `session_id`, `status_id`, `error_message`, `occurred_at`, `created_at`) VALUES
(1, 1, 1, 1, 'MODULE12', 'FINAL_TEST', 'SYSTEM_CHECK', NULL, 'Module 12 final test M12_20260804211807_737', NULL, '{\"verified\":true,\"test_token\":\"M12_20260804211807_737\"}', 'POST', 'http://localhost:8080/index.php/api/system-admin/audit-logs', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', '578540c7355c0770e823c211d06e2b5e', 1, NULL, '2026-08-04 15:48:07', '2026-08-04 21:18:07');

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs_status_masters`
--

CREATE TABLE `activity_logs_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs_status_masters`
--

INSERT INTO `activity_logs_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUCCESS', 'Success', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'FAILED', 'Failed', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'DENIED', 'Denied', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `address_types`
--

CREATE TABLE `address_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `address_types`
--

INSERT INTO `address_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'REGISTERED', 'Registered Address', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'BILLING', 'Billing Address', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'CORRESPONDENCE', 'Correspondence Address', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'SITE', 'Site Address', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `auth_groups_users`
--

CREATE TABLE `auth_groups_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `group` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_identities`
--

CREATE TABLE `auth_identities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `secret` varchar(255) NOT NULL,
  `secret2` varchar(255) DEFAULT NULL,
  `expires` datetime DEFAULT NULL,
  `extra` text DEFAULT NULL,
  `force_reset` tinyint(1) NOT NULL DEFAULT 0,
  `last_used_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_identities`
--

INSERT INTO `auth_identities` (`id`, `user_id`, `type`, `name`, `secret`, `secret2`, `expires`, `extra`, `force_reset`, `last_used_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'email_password', NULL, 'erp.dvn@gmail.com', '$2y$12$6auZLwlBi5Qzxetf1GyuLum5w9DtwTMVvNWTLwWuAuYuHRvWFlPTa', NULL, NULL, 0, '2026-08-20 08:02:47', '2026-07-23 17:15:53', '2026-08-20 08:02:47'),
(2, 3, 'email_password', NULL, 'siteengineer1@civilpro.com', '$2y$12$L.nzndZ0u5AGRPBpMV9hlO8tKGCn2y73meEyLLhyjsfZOq1grm9eW', NULL, NULL, 0, '2026-07-26 08:07:55', '2026-07-26 07:32:30', '2026-07-26 08:07:55'),
(3, 4, 'email_password', NULL, 'siteengineer2@civilpro.com', '$2y$12$iER0Iex9iNXxvXu46MarmORxv3xoHt5n35B0lj8i47hoRIoP9dVTG', NULL, NULL, 1, '2026-07-26 09:50:55', '2026-07-26 09:47:59', '2026-07-26 09:50:55'),
(4, 5, 'email_password', NULL, 'siteengineer12825@test.com', '$2y$12$qQ256bsyZczcq4fFMUm23OA0k4XkIm2OLwReos/DPm4HXrnS6yY2e', NULL, NULL, 0, NULL, '2026-07-26 13:36:49', '2026-07-26 13:36:49'),
(5, 6, 'email_password', NULL, 'marhesh@gmail.com', '$2y$12$2yh.Jaa5yYaMPh5YMxAlqe0eBXvTJF.RWzbUKp.Li5Xhdr2xZRQVG', NULL, NULL, 0, '2026-08-03 06:01:54', '2026-07-26 13:43:21', '2026-08-03 06:01:54');

-- --------------------------------------------------------

--
-- Table structure for table `auth_logins`
--

CREATE TABLE `auth_logins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(255) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `id_type` varchar(255) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` datetime NOT NULL,
  `success` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_logins`
--

INSERT INTO `auth_logins` (`id`, `ip_address`, `user_agent`, `id_type`, `identifier`, `user_id`, `date`, `success`) VALUES
(1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-23 17:36:47', 1),
(2, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-24 17:42:52', 1),
(3, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 03:53:02', 1),
(4, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 06:19:29', 1),
(5, '::1', 'curl/8.13.0', 'email_password', 'siteengineer1@civilpro.com', 3, '2026-07-26 07:36:36', 1),
(6, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 07:58:47', 1),
(7, '::1', 'curl/8.13.0', 'email_password', 'siteengineer1@civilpro.com', NULL, '2026-07-26 08:05:31', 0),
(8, '::1', 'curl/8.13.0', 'email_password', 'siteengineer1@civilpro.com', 3, '2026-07-26 08:07:55', 1),
(9, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 09:33:29', 1),
(10, '::1', 'curl/8.13.0', 'email_password', 'siteengineer2@civilpro.com', 4, '2026-07-26 09:50:56', 1),
(11, '::1', 'PostmanRuntime/7.53.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 13:22:49', 1),
(12, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 13:29:33', 1),
(13, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 13:31:53', 1),
(14, '::1', 'curl/8.13.0', 'email_password', 'siteengineer6930@test.com', 6, '2026-07-26 13:46:00', 1),
(15, '::1', 'curl/8.13.0', 'email_password', 'siteengineer6930@test.com', 6, '2026-07-26 13:48:55', 1),
(16, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', NULL, '2026-07-26 14:07:22', 0),
(17, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 14:08:33', 1),
(18, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-26 16:11:52', 1),
(19, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-27 02:43:14', 1),
(20, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-27 14:23:53', 1),
(21, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-29 10:18:15', 1),
(22, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-29 11:12:03', 1),
(23, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-29 11:17:37', 1),
(24, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-29 11:38:22', 1),
(25, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-07-29 11:49:56', 1),
(26, '::1', 'curl/8.13.0', 'email_password', 'superadmin@civilpro.com', 1, '2026-08-01 06:02:44', 1),
(27, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', NULL, '2026-08-01 07:38:24', 0),
(28, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', NULL, '2026-08-01 07:41:35', 0),
(29, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', NULL, '2026-08-01 07:45:16', 0),
(30, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', NULL, '2026-08-01 07:48:56', 0),
(31, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', 6, '2026-08-01 07:50:44', 1),
(32, '::1', 'curl/8.13.0', 'email_password', 'marhesh@gmail.com', 6, '2026-08-03 06:01:54', 1),
(33, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', NULL, '2026-08-03 06:17:15', 0),
(34, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-03 06:18:34', 1),
(35, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-03 09:26:26', 1),
(36, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-03 11:46:28', 1),
(37, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-03 12:25:06', 1),
(38, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-03 12:35:22', 1),
(39, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 07:29:59', 1),
(40, '::1', 'curl/8.13.0', 'email_password', 'dvn@gmail.com', NULL, '2026-08-04 07:55:14', 0),
(41, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 07:58:26', 1),
(42, '::1', 'curl/8.13.0', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 08:04:04', 1),
(43, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 08:44:58', 1),
(44, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 08:45:15', 1),
(45, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 08:49:26', 1),
(46, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 09:21:58', 1),
(47, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 09:25:54', 1),
(48, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 09:30:42', 1),
(49, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 09:39:42', 1),
(50, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 12:42:03', 1),
(51, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 13:13:01', 1),
(52, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 13:29:58', 1),
(53, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 13:34:29', 1),
(54, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 13:59:57', 1),
(55, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:03:11', 1),
(56, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:08:16', 1),
(57, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:13:02', 1),
(58, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:17:58', 1),
(59, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:20:21', 1),
(60, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:34:21', 1),
(61, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 14:41:53', 1),
(62, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 15:04:42', 1),
(63, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 15:11:54', 1),
(64, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 15:29:16', 1),
(65, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 15:33:59', 1),
(66, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-04 15:48:04', 1),
(67, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-SG) WindowsPowerShell/5.1.19041.6456', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-20 07:52:47', 1),
(68, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-20 07:58:28', 1),
(69, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-20 07:58:50', 1),
(70, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-20 08:00:19', 1),
(71, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'email_password', 'erp.dvn@gmail.com', 1, '2026-08-20 08:02:47', 1);

-- --------------------------------------------------------

--
-- Table structure for table `auth_permissions_users`
--

CREATE TABLE `auth_permissions_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `permission` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_remember_tokens`
--

CREATE TABLE `auth_remember_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `selector` varchar(255) NOT NULL,
  `hashedValidator` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `expires` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_token_logins`
--

CREATE TABLE `auth_token_logins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(255) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `id_type` varchar(255) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` datetime NOT NULL,
  `success` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_methods`
--

CREATE TABLE `billing_methods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `method_code` varchar(50) NOT NULL,
  `method_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `billing_methods`
--

INSERT INTO `billing_methods` (`id`, `method_code`, `method_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'FIXED_PRICE', 'Fixed Price', NULL, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'ITEM_RATE', 'Item Rate', NULL, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'COST_PLUS', 'Cost Plus', NULL, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'TIME_AND_MATERIAL', 'Time and Material', NULL, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(5, 'MILESTONE', 'Milestone', NULL, 5, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(6, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `boq_items`
--

CREATE TABLE `boq_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `boq_id` bigint(20) UNSIGNED NOT NULL,
  `section_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_category_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(220) NOT NULL,
  `specification` text DEFAULT NULL,
  `quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `wastage_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `progress_weightage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `is_provisional` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boq_items`
--

INSERT INTO `boq_items` (`id`, `company_id`, `project_id`, `boq_id`, `section_id`, `site_id`, `work_zone_id`, `work_category_id`, `uom_id`, `item_code`, `item_name`, `specification`, `quantity`, `rate`, `amount`, `wastage_percentage`, `progress_weightage`, `is_provisional`, `display_order`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 3, 4, 'CIV-001', 'RCC foundation concrete', 'M25 grade reinforced cement concrete including placing and curing.', 250.0000, 6850.0000, 1712500.00, 3.0000, 60.0000, 0, 10, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 1, 1, 1, 1, 1, 5, 3, 'CIV-002', 'Block masonry', '200 mm solid concrete block masonry including mortar.', 500.0000, 900.0000, 450000.00, 5.0000, 40.0000, 0, 20, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(3, 1, 1, 8, 3, NULL, NULL, 1, 1, 'ITEM-EXC-4347', 'Duplicate Item', NULL, 1.0000, 100.0000, 100.00, 0.0000, 0.0000, 0, 0, NULL, 1, 1, '2026-08-03 09:26:39', '2026-08-03 09:36:40', '2026-08-03 09:36:40'),
(4, 1, 1, 8, 3, NULL, NULL, 1, 1, 'ITEM-EXC-24046', 'Foundation Excavation and Disposal', 'Excavation and disposal of ordinary soil', 150.0000, 900.0000, 135000.00, 3.0000, 20.0000, 0, 15, 'Updated during complete API testing', 1, 1, '2026-08-03 09:36:53', '2026-08-03 09:36:55', NULL),
(5, 1, 1, 8, 3, NULL, NULL, 1, 1, 'ITEM-TEMP-24482', 'Temporary Test Item', 'Created for deletion testing', 10.0000, 500.0000, 5000.00, 0.0000, 1.0000, 1, 99, 'Delete after testing', 1, 1, '2026-08-03 09:36:54', '2026-08-03 09:36:57', '2026-08-03 09:36:57');

-- --------------------------------------------------------

--
-- Table structure for table `boq_item_rate_components`
--

CREATE TABLE `boq_item_rate_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `boq_item_id` bigint(20) UNSIGNED NOT NULL,
  `component_type_id` bigint(20) UNSIGNED NOT NULL,
  `component_name` varchar(160) NOT NULL,
  `quantity_factor` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `component_rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `component_amount` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `remarks` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boq_item_rate_components`
--

INSERT INTO `boq_item_rate_components` (`id`, `boq_item_id`, `component_type_id`, `component_name`, `quantity_factor`, `component_rate`, `component_amount`, `remarks`, `display_order`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'Concrete and reinforcement materials', 1.0000, 4700.0000, 4700.0000, NULL, 10, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 2, 'Concrete placing labour', 1.0000, 1100.0000, 1100.0000, NULL, 20, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(3, 1, 3, 'Mixer, vibrator and handling', 1.0000, 650.0000, 650.0000, NULL, 30, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(4, 1, 5, 'Site overhead and margin', 1.0000, 400.0000, 400.0000, NULL, 40, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(5, 4, 1, 'Material-7853', 1.5000, 420.0000, 630.0000, 'Updated main rate component', 15, 1, '2026-08-03 10:04:43', '2026-08-03 10:04:45', NULL),
(6, 4, 2, 'Labour-12418', 2.0000, 100.0000, 200.0000, 'Temporary component for deletion test', 99, 1, '2026-08-03 10:04:43', '2026-08-03 10:04:47', '2026-08-03 10:04:47');

-- --------------------------------------------------------

--
-- Table structure for table `boq_item_rate_components_component_type_masters`
--

CREATE TABLE `boq_item_rate_components_component_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `component_type_code` varchar(60) NOT NULL,
  `component_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boq_item_rate_components_component_type_masters`
--

INSERT INTO `boq_item_rate_components_component_type_masters` (`id`, `component_type_code`, `component_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MATERIAL', 'Material', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'LABOUR', 'Labour', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'EQUIPMENT', 'Equipment', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'SUBCONTRACT', 'Subcontract', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'OVERHEAD', 'Overhead', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'PROFIT', 'Profit', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(7, 'OTHER', 'Other', 7, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `boq_sections`
--

CREATE TABLE `boq_sections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `boq_id` bigint(20) UNSIGNED NOT NULL,
  `parent_section_id` bigint(20) UNSIGNED DEFAULT NULL,
  `section_code` varchar(40) NOT NULL,
  `section_name` varchar(180) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `section_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `boq_sections`
--

INSERT INTO `boq_sections` (`id`, `company_id`, `project_id`, `boq_id`, `parent_section_id`, `section_code`, `section_name`, `description`, `display_order`, `section_amount`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, NULL, 'CIVIL-01', 'Civil and Structural Works', 'Foundation and superstructure work items.', 10, 2162500.00, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 1, 8, NULL, 'SEC-CIVIL', 'Civil Works', 'Main civil works section', 10, 135000.00, 1, 1, '2026-08-03 06:53:01', '2026-08-03 15:06:57', NULL),
(3, 1, 1, 8, 2, 'SEC-EXC', 'Excavation and Earthworks', 'Updated during complete API testing', 25, 135000.00, 1, 1, '2026-08-03 06:53:12', '2026-08-03 15:06:57', NULL),
(4, 1, 1, 8, NULL, 'SEC-TEMP', 'Temporary Section', 'Section created for delete testing', 99, 0.00, 1, 1, '2026-08-03 06:53:24', '2026-08-03 06:53:51', '2026-08-03 06:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `branch_code` varchar(30) NOT NULL,
  `branch_name` varchar(150) NOT NULL,
  `branch_type_id` bigint(20) UNSIGNED NOT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'IN',
  `postal_code` varchar(12) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_head_office` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `company_id`, `branch_code`, `branch_name`, `branch_type_id`, `gstin`, `email`, `phone`, `address_line1`, `address_line2`, `city`, `district`, `state_name`, `state_code`, `country_code`, `postal_code`, `latitude`, `longitude`, `is_head_office`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'HO', 'Head Office', 1, NULL, 'headoffice@democivil.example', '+91-9000000000', NULL, NULL, 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641001', NULL, NULL, 1, 1, '2026-07-23 14:29:28', '2026-07-26 16:47:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `branch_types`
--

CREATE TABLE `branch_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branch_types`
--

INSERT INTO `branch_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'HEAD_OFFICE', 'Head Office', NULL, 1, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(2, 'REGIONAL_OFFICE', 'Regional Office', NULL, 2, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(3, 'SITE_OFFICE', 'Site Office', NULL, 3, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(4, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16');

-- --------------------------------------------------------

--
-- Table structure for table `budget_approvals`
--

CREATE TABLE `budget_approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `budget_id` bigint(20) UNSIGNED NOT NULL,
  `revision_id` bigint(20) UNSIGNED DEFAULT NULL,
  `approval_level` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `action_id` bigint(20) UNSIGNED NOT NULL,
  `action_by` bigint(20) UNSIGNED DEFAULT NULL,
  `action_at` datetime NOT NULL DEFAULT current_timestamp(),
  `comments` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_approvals`
--

INSERT INTO `budget_approvals` (`id`, `company_id`, `project_id`, `budget_id`, `revision_id`, `approval_level`, `action_id`, `action_by`, `action_at`, `comments`) VALUES
(1, 1, 1, 2, NULL, 1, 1, 1, '2026-08-03 11:19:22', 'Submitted through complete Budget workflow API test'),
(2, 1, 1, 2, NULL, 1, 2, 1, '2026-08-03 11:19:25', 'Approved through complete Budget workflow API test'),
(3, 1, 1, 4, NULL, 1, 1, 1, '2026-08-03 11:19:55', 'Submitted for rejection workflow test'),
(4, 1, 1, 4, NULL, 1, 3, 1, '2026-08-03 11:19:55', 'Rejected because the test budget requires correction'),
(5, 1, 1, 2, 1, 1, 1, 1, '2026-08-03 11:46:50', 'Submitted through complete revision workflow test'),
(6, 1, 1, 2, 1, 1, 2, 1, '2026-08-03 11:46:52', 'Approved and applied through complete revision test'),
(7, 1, 1, 2, 2, 1, 1, 1, '2026-08-03 11:47:03', 'Submitted for rejection testing'),
(8, 1, 1, 2, 2, 1, 3, 1, '2026-08-03 11:47:03', 'Rejected because revised values need correction');

-- --------------------------------------------------------

--
-- Table structure for table `budget_approvals_action_masters`
--

CREATE TABLE `budget_approvals_action_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_code` varchar(60) NOT NULL,
  `action_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_approvals_action_masters`
--

INSERT INTO `budget_approvals_action_masters` (`id`, `action_code`, `action_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUBMITTED', 'Submitted', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'APPROVED', 'Approved', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'REJECTED', 'Rejected', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'RETURNED', 'Returned', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `budget_revisions`
--

CREATE TABLE `budget_revisions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `budget_id` bigint(20) UNSIGNED NOT NULL,
  `revision_no` int(10) UNSIGNED NOT NULL,
  `revision_date` date NOT NULL,
  `reason` text NOT NULL,
  `previous_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `revised_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `variance_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `decided_by` bigint(20) UNSIGNED DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `decision_note` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_revisions`
--

INSERT INTO `budget_revisions` (`id`, `company_id`, `project_id`, `budget_id`, `revision_no`, `revision_date`, `reason`, `previous_total`, `revised_total`, `variance_amount`, `status_id`, `requested_by`, `submitted_at`, `decided_by`, `decided_at`, `decision_note`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 1, '2026-08-03', 'Updated approved budget revision reason', 14700.00, 20500.00, 5800.00, 3, 1, '2026-08-03 11:46:50', 1, '2026-08-03 11:46:52', 'Approved and applied through complete revision test', '2026-08-03 11:46:46', '2026-08-03 11:46:52'),
(2, 1, 1, 2, 2, '2026-08-03', 'Budget revision rejection workflow test', 20500.00, 33000.00, 12500.00, 4, 1, '2026-08-03 11:47:03', 1, '2026-08-03 11:47:03', 'Rejected because revised values need correction', '2026-08-03 11:47:02', '2026-08-03 11:47:03');

-- --------------------------------------------------------

--
-- Table structure for table `budget_revisions_status_masters`
--

CREATE TABLE `budget_revisions_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_revisions_status_masters`
--

INSERT INTO `budget_revisions_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `budget_revision_lines`
--

CREATE TABLE `budget_revision_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `revision_id` bigint(20) UNSIGNED NOT NULL,
  `budget_line_id` bigint(20) UNSIGNED NOT NULL,
  `change_type_id` bigint(20) UNSIGNED NOT NULL,
  `previous_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `revised_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `previous_rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `revised_rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `previous_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `revised_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `variance_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_revision_lines`
--

INSERT INTO `budget_revision_lines` (`id`, `revision_id`, `budget_line_id`, `change_type_id`, `previous_quantity`, `revised_quantity`, `previous_rate`, `revised_rate`, `previous_amount`, `revised_amount`, `variance_amount`, `reason`, `created_at`) VALUES
(1, 1, 4, 2, 12.0000, 16.0000, 1100.0000, 1250.0000, 13200.00, 20000.00, 6800.00, 'Final revised quantity and rate', '2026-08-03 11:46:48'),
(2, 1, 5, 3, 2.0000, 0.0000, 500.0000, 0.0000, 1000.00, 0.00, -1000.00, 'Remove this budget scope line', '2026-08-03 11:46:48'),
(3, 2, 4, 2, 16.0000, 25.0000, 1250.0000, 1300.0000, 20000.00, 32500.00, 12500.00, 'Rejected test adjustment', '2026-08-03 11:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `budget_revision_lines_change_type_masters`
--

CREATE TABLE `budget_revision_lines_change_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `change_type_code` varchar(60) NOT NULL,
  `change_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_revision_lines_change_type_masters`
--

INSERT INTO `budget_revision_lines_change_type_masters` (`id`, `change_type_code`, `change_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ADD', 'Add', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'MODIFY', 'Modify', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'REMOVE', 'Remove', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `budget_status_logs`
--

CREATE TABLE `budget_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `budget_id` bigint(20) UNSIGNED NOT NULL,
  `from_status_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_status_id` bigint(20) UNSIGNED NOT NULL,
  `change_reason` varchar(500) DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_status_logs`
--

INSERT INTO `budget_status_logs` (`id`, `company_id`, `project_id`, `budget_id`, `from_status_id`, `to_status_id`, `change_reason`, `changed_by`, `changed_at`) VALUES
(1, 1, 1, 1, 2, 3, 'Sample budget approved for expo workflow.', NULL, '2026-07-23 20:33:20'),
(2, 1, 1, 2, 1, 2, 'Submitted through complete Budget workflow API test', 1, '2026-08-03 11:19:22'),
(3, 1, 1, 2, 2, 3, 'Approved through complete Budget workflow API test', 1, '2026-08-03 11:19:25'),
(4, 1, 1, 4, 1, 2, 'Submitted for rejection workflow test', 1, '2026-08-03 11:19:55'),
(5, 1, 1, 4, 2, 4, 'Rejected because the test budget requires correction', 1, '2026-08-03 11:19:55');

-- --------------------------------------------------------

--
-- Table structure for table `budget_status_logs_from_status_masters`
--

CREATE TABLE `budget_status_logs_from_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `from_status_code` varchar(60) NOT NULL,
  `from_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_status_logs_from_status_masters`
--

INSERT INTO `budget_status_logs_from_status_masters` (`id`, `from_status_code`, `from_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'REVISED', 'Revised', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'CLOSED', 'Closed', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `budget_status_logs_to_status_masters`
--

CREATE TABLE `budget_status_logs_to_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `to_status_code` varchar(60) NOT NULL,
  `to_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budget_status_logs_to_status_masters`
--

INSERT INTO `budget_status_logs_to_status_masters` (`id`, `to_status_code`, `to_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'REVISED', 'Revised', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'CLOSED', 'Closed', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `client_code` varchar(30) NOT NULL,
  `client_name` varchar(180) NOT NULL,
  `legal_name` varchar(220) DEFAULT NULL,
  `client_type_id` bigint(20) UNSIGNED NOT NULL,
  `industry_type` varchar(120) DEFAULT NULL,
  `gst_registration_type_id` bigint(20) UNSIGNED NOT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `tan` varchar(10) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `billing_currency` char(3) NOT NULL DEFAULT 'INR',
  `payment_terms_days` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `credit_limit` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_deduction_applicable` tinyint(1) NOT NULL DEFAULT 0,
  `client_source_id` bigint(20) UNSIGNED NOT NULL,
  `client_status_id` bigint(20) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `company_id`, `branch_id`, `client_code`, `client_name`, `legal_name`, `client_type_id`, `industry_type`, `gst_registration_type_id`, `gstin`, `pan`, `tan`, `email`, `phone`, `website`, `billing_currency`, `payment_terms_days`, `credit_limit`, `tax_deduction_applicable`, `client_source_id`, `client_status_id`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'CLI-0001', 'Greenfield Properties', 'Greenfield Properties Private Limited', 4, 'Real Estate Development', 1, '33AABCG1234F1Z5', 'AABCG1234F', NULL, 'projects@greenfield.example', '+91-9876500001', NULL, 'INR', 30, 2500000.00, 0, 2, 2, 'Demonstration client for expo project flow.', NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 16:53:10', NULL),
(2, 1, 1, 'CLI-API-001', 'API Test Client Updated', 'API Test Client Private Limited', 4, 'Construction', 1, '33AABCT1234F1Z5', 'AABCT1234F', NULL, 'apitestclient@example.com', '9876500010', NULL, 'INR', 45, 750000.00, 0, 1, 2, 'Updated through Client Master API', 1, 1, '2026-07-26 14:10:08', '2026-07-26 14:13:27', '2026-07-26 14:13:27');

-- --------------------------------------------------------

--
-- Table structure for table `client_addresses`
--

CREATE TABLE `client_addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `address_type_id` bigint(20) UNSIGNED NOT NULL,
  `address_name` varchar(120) DEFAULT NULL,
  `attention_to` varchar(150) DEFAULT NULL,
  `address_line1` varchar(200) NOT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `landmark` varchar(150) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) NOT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'IN',
  `postal_code` varchar(12) NOT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_addresses`
--

INSERT INTO `client_addresses` (`id`, `company_id`, `client_id`, `address_type_id`, `address_name`, `attention_to`, `address_line1`, `address_line2`, `landmark`, `city`, `district`, `state_name`, `state_code`, `country_code`, `postal_code`, `gstin`, `latitude`, `longitude`, `is_primary`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'Registered Office', 'The Managing Director', '125 Avinashi Road', 'Peelamedu', NULL, 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641004', '33AABCG1234F1Z5', NULL, NULL, 0, 1, NULL, 1, '2026-07-23 14:41:53', '2026-07-26 19:54:47', NULL),
(2, 1, 1, 2, 'API Site Office Updated', 'Senior Project Manager', '100 Test Main Road', 'Test Nagar', 'Near Test Junction', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641004', '33AABCG1234F1Z5', 11.0168000, 76.9558000, 1, 1, 1, 1, '2026-07-26 14:24:47', '2026-07-26 14:26:33', '2026-07-26 14:26:33');

-- --------------------------------------------------------

--
-- Table structure for table `client_contacts`
--

CREATE TABLE `client_contacts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `contact_name` varchar(150) NOT NULL,
  `designation` varchar(120) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `alternate_phone` varchar(25) DEFAULT NULL,
  `communication_mode_id` bigint(20) UNSIGNED NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `receives_billing` tinyint(1) NOT NULL DEFAULT 0,
  `receives_site_updates` tinyint(1) NOT NULL DEFAULT 0,
  `notes` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_contacts`
--

INSERT INTO `client_contacts` (`id`, `company_id`, `client_id`, `contact_name`, `designation`, `department`, `email`, `phone`, `alternate_phone`, `communication_mode_id`, `is_primary`, `receives_billing`, `receives_site_updates`, `notes`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'Arun Kumar', 'Project Director', 'Projects', 'arun@greenfield.example', '+91-9876500002', NULL, 3, 0, 0, 1, NULL, 1, NULL, 1, '2026-07-23 14:41:53', '2026-07-26 20:30:09', NULL),
(2, 1, 1, 'Priya Raman', 'Accounts Manager', 'Finance', 'accounts@greenfield.example', '+91-9876500003', NULL, 1, 0, 1, 0, NULL, 1, NULL, 1, '2026-07-23 14:41:53', '2026-07-26 20:30:09', NULL),
(3, 1, 1, 'API Test Contact Updated', 'Senior Project Manager', 'Projects', 'apitestcontact@example.com', '9876500020', '9876500021', 1, 1, 1, 1, 'Updated through Contact API', 1, 1, 1, '2026-07-26 15:00:09', '2026-07-26 15:01:21', '2026-07-26 15:01:21');

-- --------------------------------------------------------

--
-- Table structure for table `client_documents`
--

CREATE TABLE `client_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `document_type_id` bigint(20) UNSIGNED NOT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `document_title` varchar(180) NOT NULL,
  `document_date` date DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `file_path` varchar(700) NOT NULL,
  `file_extension` varchar(20) NOT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `file_size_bytes` bigint(20) UNSIGNED NOT NULL,
  `file_hash_sha256` char(64) DEFAULT NULL,
  `version_number` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `client_document_status_id` bigint(20) UNSIGNED NOT NULL,
  `is_confidential` tinyint(1) NOT NULL DEFAULT 0,
  `remarks` varchar(500) DEFAULT NULL,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_documents`
--

INSERT INTO `client_documents` (`id`, `company_id`, `client_id`, `document_type_id`, `document_number`, `document_title`, `document_date`, `valid_from`, `valid_until`, `original_file_name`, `stored_file_name`, `file_path`, `file_extension`, `mime_type`, `file_size_bytes`, `file_hash_sha256`, `version_number`, `client_document_status_id`, `is_confidential`, `remarks`, `uploaded_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'GST-API-001-UPDATED', 'API Test GST Certificate Updated', '2026-07-26', '2026-07-26', '2027-07-25', 'client-document-test.pdf', '1785078640_6803032d3dfe88915cfd.csv', 'uploads/client_documents/1/1/1785078640_6803032d3dfe88915cfd.csv', 'pdf', 'text/plain', 26, 'b22aad186e6179a5eb79dc12561e91a848445f49155eb9fa67fe5943d0d2cfb5', 1, 2, 0, 'Updated through Document API', 1, '2026-07-26 15:10:40', '2026-07-26 15:12:22', '2026-07-26 15:12:22');

-- --------------------------------------------------------

--
-- Table structure for table `client_document_statuses`
--

CREATE TABLE `client_document_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_document_statuses`
--

INSERT INTO `client_document_statuses` (`id`, `status_code`, `status_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'VALID', 'Valid', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'EXPIRED', 'Expired', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'REPLACED', 'Replaced', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'ARCHIVED', 'Archived', NULL, 5, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `client_sources`
--

CREATE TABLE `client_sources` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_code` varchar(50) NOT NULL,
  `source_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_sources`
--

INSERT INTO `client_sources` (`id`, `source_code`, `source_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DIRECT', 'Direct', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'REFERRAL', 'Referral', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'TENDER', 'Tender', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'WEBSITE', 'Website', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'EXISTING_CLIENT', 'Existing Client', NULL, 5, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(6, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `client_statuses`
--

CREATE TABLE `client_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_statuses`
--

INSERT INTO `client_statuses` (`id`, `status_code`, `status_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROSPECT', 'Prospect', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'ACTIVE', 'Active', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'ON_HOLD', 'On Hold', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'INACTIVE', 'Inactive', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'BLACKLISTED', 'Blacklisted', NULL, 5, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `communication_modes`
--

CREATE TABLE `communication_modes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mode_code` varchar(50) NOT NULL,
  `mode_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `communication_modes`
--

INSERT INTO `communication_modes` (`id`, `mode_code`, `mode_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'EMAIL', 'Email', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'PHONE', 'Phone', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'WHATSAPP', 'WhatsApp', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'SMS', 'SMS', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_code` varchar(30) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `legal_name` varchar(200) DEFAULT NULL,
  `company_type_id` bigint(20) UNSIGNED NOT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `cin` varchar(21) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'IN',
  `postal_code` varchar(12) DEFAULT NULL,
  `logo_path` varchar(500) DEFAULT NULL,
  `date_format` varchar(20) NOT NULL DEFAULT 'd-m-Y',
  `currency_code` char(3) NOT NULL DEFAULT 'INR',
  `timezone` varchar(60) NOT NULL DEFAULT 'Asia/Kolkata',
  `subscription_status_id` bigint(20) UNSIGNED NOT NULL,
  `subscription_start` date DEFAULT NULL,
  `subscription_end` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `company_code`, `company_name`, `legal_name`, `company_type_id`, `gstin`, `pan`, `cin`, `email`, `phone`, `website`, `address_line1`, `address_line2`, `city`, `district`, `state_name`, `state_code`, `country_code`, `postal_code`, `logo_path`, `date_format`, `currency_code`, `timezone`, `subscription_status_id`, `subscription_start`, `subscription_end`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'DEMO-CIVIL', 'Demo Civil Constructions', 'Demo Civil Constructions Private Limited', 4, NULL, NULL, NULL, 'admin@democivil.example', '+91-9000000000', NULL, NULL, NULL, 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641001', NULL, 'd-m-Y', 'INR', 'Asia/Kolkata', 2, '2026-07-23', '2027-07-22', 1, '2026-07-23 14:29:28', '2026-07-26 16:47:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_navigation_items`
--

CREATE TABLE `company_navigation_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `navigation_item_id` bigint(20) UNSIGNED NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_types`
--

CREATE TABLE `company_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_types`
--

INSERT INTO `company_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROPRIETORSHIP', 'Proprietorship', NULL, 1, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(2, 'PARTNERSHIP', 'Partnership', NULL, 2, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(3, 'LLP', 'Limited Liability Partnership', NULL, 3, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(4, 'PRIVATE_LIMITED', 'Private Limited', NULL, 4, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(5, 'PUBLIC_LIMITED', 'Public Limited', NULL, 5, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(6, 'TRUST', 'Trust', NULL, 6, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(7, 'SOCIETY', 'Society', NULL, 7, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(8, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(9, 'INDIVIDUAL', 'Individual', 'Individual client or proprietor', 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(10, 'GOVERNMENT', 'Government', 'Government department or organisation', 8, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `daily_material_consumption`
--

CREATE TABLE `daily_material_consumption` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `work_progress_id` bigint(20) UNSIGNED DEFAULT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `stock_transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `issued_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `consumed_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `returned_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `wasted_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `consumption_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `source_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_material_consumption`
--

INSERT INTO `daily_material_consumption` (`id`, `company_id`, `project_id`, `daily_report_id`, `work_progress_id`, `material_id`, `uom_id`, `zone_id`, `stock_transaction_id`, `issued_qty`, `consumed_qty`, `returned_qty`, `wasted_qty`, `unit_rate`, `consumption_value`, `source_type_id`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 8, 1, 1, 50.0000, 48.0000, 2.0000, 0.0000, 390.00, 18720.00, 2, 'Consumption reconciled with issued and returned quantity.', NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, 3, 2, 3, 8, 1, NULL, 10.0000, 9.0000, 1.0000, 0.0000, 100.00, 900.00, 1, NULL, 1, 1, '2026-08-04 09:31:01', '2026-08-04 09:31:02', NULL),
(3, 1, 1, 4, 3, 3, 8, 1, NULL, 10.0000, 9.0000, 1.0000, 0.0000, 100.00, 900.00, 1, NULL, 1, 1, '2026-08-04 09:39:59', '2026-08-04 09:40:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_material_consumption_source_type_masters`
--

CREATE TABLE `daily_material_consumption_source_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_type_code` varchar(60) NOT NULL,
  `source_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_material_consumption_source_type_masters`
--

INSERT INTO `daily_material_consumption_source_type_masters` (`id`, `source_type_code`, `source_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MANUAL', 'Manual', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'STOCK_TRANSACTION', 'Stock Transaction', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'MEASUREMENT', 'Measurement', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `daily_report_approvals`
--

CREATE TABLE `daily_report_approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `action_type_id` bigint(20) UNSIGNED NOT NULL,
  `from_status_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_status_id` bigint(20) UNSIGNED NOT NULL,
  `action_by` bigint(20) UNSIGNED DEFAULT NULL,
  `action_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(1000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_report_approvals`
--

INSERT INTO `daily_report_approvals` (`id`, `company_id`, `daily_report_id`, `action_type_id`, `from_status_id`, `to_status_id`, `action_by`, `action_at`, `remarks`, `created_at`) VALUES
(1, 1, 1, 1, 1, 2, NULL, '2026-07-23 20:55:31', 'Submitted after site verification.', '2026-07-23 20:55:31'),
(2, 1, 1, 3, 2, 4, NULL, '2026-07-23 20:55:31', 'Approved for project progress reporting.', '2026-07-23 20:55:31'),
(3, 1, 4, 1, 1, 2, 1, '2026-08-04 09:40:02', 'Submitted by complete API test', '2026-08-04 09:40:02'),
(4, 1, 4, 2, 2, 3, 1, '2026-08-04 09:40:09', 'Reviewed by complete API test', '2026-08-04 09:40:09'),
(5, 1, 4, 3, 3, 4, 1, '2026-08-04 09:40:16', 'Approved by complete API test', '2026-08-04 09:40:16'),
(6, 1, 4, 5, 4, 6, 1, '2026-08-04 09:40:23', 'Reopened to test the complete workflow', '2026-08-04 09:40:23'),
(7, 1, 4, 1, 6, 2, 1, '2026-08-04 09:40:29', 'Resubmitted for rejection test', '2026-08-04 09:40:29'),
(8, 1, 4, 2, 2, 3, 1, '2026-08-04 09:40:37', 'Reviewed for rejection test', '2026-08-04 09:40:37'),
(9, 1, 4, 4, 3, 5, 1, '2026-08-04 09:40:43', 'Rejected by complete API workflow test', '2026-08-04 09:40:43'),
(10, 1, 4, 5, 5, 6, 1, '2026-08-04 09:40:49', 'Reopened for cancellation test', '2026-08-04 09:40:49'),
(11, 1, 4, 6, 6, 7, 1, '2026-08-04 09:40:54', 'Cancelled by complete API workflow test', '2026-08-04 09:40:54');

-- --------------------------------------------------------

--
-- Table structure for table `daily_report_approvals_action_type_masters`
--

CREATE TABLE `daily_report_approvals_action_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type_code` varchar(60) NOT NULL,
  `action_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_report_approvals_action_type_masters`
--

INSERT INTO `daily_report_approvals_action_type_masters` (`id`, `action_type_code`, `action_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUBMITTED', 'Submitted', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'REVIEWED', 'Reviewed', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'REOPENED', 'Reopened', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `daily_report_approvals_from_status_masters`
--

CREATE TABLE `daily_report_approvals_from_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `from_status_code` varchar(60) NOT NULL,
  `from_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_report_approvals_from_status_masters`
--

INSERT INTO `daily_report_approvals_from_status_masters` (`id`, `from_status_code`, `from_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'REVIEWED', 'Reviewed', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'REOPENED', 'Reopened', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `daily_report_approvals_to_status_masters`
--

CREATE TABLE `daily_report_approvals_to_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `to_status_code` varchar(60) NOT NULL,
  `to_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_report_approvals_to_status_masters`
--

INSERT INTO `daily_report_approvals_to_status_masters` (`id`, `to_status_code`, `to_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'REVIEWED', 'Reviewed', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(6, 'REOPENED', 'Reopened', 6, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_equipment`
--

CREATE TABLE `daily_site_equipment` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `equipment_code` varchar(40) DEFAULT NULL,
  `equipment_name` varchar(150) NOT NULL,
  `ownership_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `supplier_or_owner` varchar(150) DEFAULT NULL,
  `operator_name` varchar(120) DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `working_hours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `idle_hours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `breakdown_hours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `fuel_consumed` decimal(12,3) NOT NULL DEFAULT 0.000,
  `fuel_uom` varchar(20) DEFAULT NULL,
  `meter_opening` decimal(15,2) DEFAULT NULL,
  `meter_closing` decimal(15,2) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `work_description` varchar(500) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_equipment`
--

INSERT INTO `daily_site_equipment` (`id`, `company_id`, `daily_report_id`, `zone_id`, `equipment_code`, `equipment_name`, `ownership_type_id`, `supplier_or_owner`, `operator_name`, `quantity`, `start_time`, `end_time`, `working_hours`, `idle_hours`, `breakdown_hours`, `fuel_consumed`, `fuel_uom`, `meter_opening`, `meter_closing`, `status_id`, `work_description`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'EQ-VIB-001', 'Needle Vibrator', 1, NULL, 'Ravi', 1, '09:00:00', '16:30:00', 6.50, 1.00, 0.00, 3.500, 'LITRE', NULL, NULL, 1, 'Equipment readiness for concrete activity.', NULL, NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, 1, 'EQ-CUT-001', 'Bar Cutting Machine', 1, NULL, 'Mani', 1, '08:45:00', '17:00:00', 7.25, 1.00, 0.00, 0.000, NULL, NULL, NULL, 1, 'Reinforcement bar cutting.', NULL, NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(3, 1, 3, 1, 'EQ-1785835852', 'API Test Mixer', 1, NULL, NULL, 1, NULL, NULL, 7.00, 1.00, 0.00, 0.000, NULL, NULL, NULL, 1, NULL, NULL, 1, 1, '2026-08-04 09:30:57', '2026-08-04 09:30:58', NULL),
(4, 1, 4, 1, 'EQ-1785836390', 'API Test Mixer', 1, NULL, NULL, 1, NULL, NULL, 7.00, 1.00, 0.00, 0.000, NULL, NULL, NULL, 1, NULL, NULL, 1, 1, '2026-08-04 09:39:55', '2026-08-04 09:39:56', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_equipment_ownership_type_masters`
--

CREATE TABLE `daily_site_equipment_ownership_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ownership_type_code` varchar(60) NOT NULL,
  `ownership_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_equipment_ownership_type_masters`
--

INSERT INTO `daily_site_equipment_ownership_type_masters` (`id`, `ownership_type_code`, `ownership_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'OWNED', 'Owned', 1, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(2, 'HIRED', 'Hired', 2, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(3, 'CONTRACTOR', 'Contractor', 3, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(4, 'CLIENT', 'Client', 4, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42'),
(5, 'OTHER', 'Other', 5, 1, '2026-07-26 12:38:42', '2026-07-26 12:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_equipment_status_masters`
--

CREATE TABLE `daily_site_equipment_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_equipment_status_masters`
--

INSERT INTO `daily_site_equipment_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'WORKING', 'Working', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'IDLE', 'Idle', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'BREAKDOWN', 'Breakdown', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'MAINTENANCE', 'Maintenance', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'OFF_SITE', 'Off Site', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_issues`
--

CREATE TABLE `daily_site_issues` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `issue_no` varchar(40) NOT NULL,
  `issue_type_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text NOT NULL,
  `priority_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `work_impact_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `lost_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reported_by` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `target_resolution_date` date DEFAULT NULL,
  `resolved_date` date DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_issues`
--

INSERT INTO `daily_site_issues` (`id`, `company_id`, `daily_report_id`, `zone_id`, `issue_no`, `issue_type_id`, `title`, `description`, `priority_id`, `work_impact_id`, `lost_hours`, `reported_by`, `assigned_to`, `target_resolution_date`, `resolved_date`, `resolution`, `status_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'ISS-EXPO-0001', 7, 'Clarification required for sleeve location', 'MEP sleeve position requires consultant confirmation before concrete.', 3, 3, 1.00, NULL, NULL, '2026-07-24', NULL, NULL, 2, NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 3, 1, 'ISS-API-1785835852', 11, 'Updated API test issue', 'Daily operation issue test', 2, 1, 0.00, 1, NULL, NULL, NULL, NULL, 1, 1, 1, '2026-08-04 09:31:00', '2026-08-04 09:31:00', NULL),
(3, 1, 4, 1, 'ISS-API-1785836390', 11, 'Updated API test issue', 'Daily operation issue test', 2, 1, 0.00, 1, NULL, NULL, NULL, NULL, 1, 1, 1, '2026-08-04 09:39:57', '2026-08-04 09:39:58', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_issues_issue_type_masters`
--

CREATE TABLE `daily_site_issues_issue_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `issue_type_code` varchar(60) NOT NULL,
  `issue_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_issues_issue_type_masters`
--

INSERT INTO `daily_site_issues_issue_type_masters` (`id`, `issue_type_code`, `issue_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DELAY', 'Delay', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'SAFETY', 'Safety', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'QUALITY', 'Quality', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'MATERIAL', 'Material', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'LABOUR', 'Labour', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'EQUIPMENT', 'Equipment', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'DRAWING', 'Drawing', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'CLIENT_INSTRUCTION', 'Client Instruction', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(9, 'WEATHER', 'Weather', 9, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(10, 'ACCESS', 'Access', 10, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(11, 'OTHER', 'Other', 11, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_issues_priority_masters`
--

CREATE TABLE `daily_site_issues_priority_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `priority_code` varchar(60) NOT NULL,
  `priority_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_issues_priority_masters`
--

INSERT INTO `daily_site_issues_priority_masters` (`id`, `priority_code`, `priority_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'LOW', 'Low', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'MEDIUM', 'Medium', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'HIGH', 'High', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'CRITICAL', 'Critical', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_issues_status_masters`
--

CREATE TABLE `daily_site_issues_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_issues_status_masters`
--

INSERT INTO `daily_site_issues_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'OPEN', 'Open', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'IN_PROGRESS', 'In Progress', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'RESOLVED', 'Resolved', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'CLOSED', 'Closed', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_issues_work_impact_masters`
--

CREATE TABLE `daily_site_issues_work_impact_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `work_impact_code` varchar(60) NOT NULL,
  `work_impact_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_issues_work_impact_masters`
--

INSERT INTO `daily_site_issues_work_impact_masters` (`id`, `work_impact_code`, `work_impact_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NONE', 'None', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'MINOR', 'Minor', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'MODERATE', 'Moderate', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'MAJOR', 'Major', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'WORK_STOPPED', 'Work Stopped', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_manpower`
--

CREATE TABLE `daily_site_manpower` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `labour_category_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `planned_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `present_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `absent_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `overtime_workers` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_regular_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_overtime_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `source_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `work_description` varchar(500) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_manpower`
--

INSERT INTO `daily_site_manpower` (`id`, `company_id`, `daily_report_id`, `labour_category_id`, `contractor_id`, `zone_id`, `planned_count`, `present_count`, `absent_count`, `overtime_workers`, `total_regular_hours`, `total_overtime_hours`, `source_type_id`, `work_description`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 20, 18, 2, 4, 144.00, 8.00, 2, 'Reinforcement cutting, binding and shuttering support.', NULL, NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 3, 10, NULL, 1, 10, 8, 2, 0, 0.00, 0.00, 1, 'API manpower', NULL, 1, 1, '2026-08-04 09:30:57', '2026-08-04 09:30:57', NULL),
(3, 1, 4, 10, NULL, 1, 10, 8, 2, 0, 0.00, 0.00, 1, 'API manpower', NULL, 1, 1, '2026-08-04 09:39:54', '2026-08-04 09:39:55', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_manpower_source_type_masters`
--

CREATE TABLE `daily_site_manpower_source_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `source_type_code` varchar(60) NOT NULL,
  `source_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_manpower_source_type_masters`
--

INSERT INTO `daily_site_manpower_source_type_masters` (`id`, `source_type_code`, `source_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MANUAL', 'Manual', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'ATTENDANCE_SUMMARY', 'Attendance Summary', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'CONTRACTOR_REPORT', 'Contractor Report', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_photos`
--

CREATE TABLE `daily_site_photos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `work_progress_id` bigint(20) UNSIGNED DEFAULT NULL,
  `issue_id` bigint(20) UNSIGNED DEFAULT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `photo_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 9,
  `title` varchar(180) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size_bytes` bigint(20) UNSIGNED DEFAULT NULL,
  `captured_at` datetime DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `captured_by` bigint(20) UNSIGNED DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_client_visible` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_photos`
--

INSERT INTO `daily_site_photos` (`id`, `company_id`, `daily_report_id`, `work_progress_id`, `issue_id`, `zone_id`, `photo_type_id`, `title`, `description`, `file_name`, `file_path`, `mime_type`, `file_size_bytes`, `captured_at`, `latitude`, `longitude`, `captured_by`, `display_order`, `is_client_visible`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, NULL, 1, 2, 'Foundation reinforcement progress', 'Expo sample photo metadata; replace with actual uploaded image.', 'foundation-progress-expo.jpg', 'uploads/daily-reports/expo/foundation-progress-expo.jpg', 'image/jpeg', 0, '2026-07-23 20:55:31', 11.0168000, 76.9558000, NULL, 1, 1, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, NULL, 1, 1, 7, 'Sleeve location clarification', 'Expo sample issue photo metadata; replace with actual uploaded image.', 'sleeve-issue-expo.jpg', 'uploads/daily-reports/expo/sleeve-issue-expo.jpg', 'image/jpeg', 0, '2026-07-23 20:55:31', 11.0168000, 76.9558000, NULL, 2, 0, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(3, 1, 4, NULL, NULL, 1, 9, 'Updated Module 7 API Test Photo', NULL, 'module7-test.png', 'uploads/daily-reports/4/1785836401_df03b381b66ec950de16.png', 'image/png', 68, NULL, NULL, NULL, 1, 0, 0, 1, '2026-08-04 09:40:01', '2026-08-04 09:40:01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_photos_photo_type_masters`
--

CREATE TABLE `daily_site_photos_photo_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `photo_type_code` varchar(60) NOT NULL,
  `photo_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_photos_photo_type_masters`
--

INSERT INTO `daily_site_photos_photo_type_masters` (`id`, `photo_type_code`, `photo_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BEFORE_WORK', 'Before Work', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'WORK_IN_PROGRESS', 'Work In Progress', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'AFTER_WORK', 'After Work', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'QUALITY', 'Quality', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'SAFETY', 'Safety', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'MATERIAL', 'Material', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'ISSUE', 'Issue', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'VISITOR', 'Visitor', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(9, 'GENERAL', 'General', 9, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_reports`
--

CREATE TABLE `daily_site_reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `report_no` varchar(40) NOT NULL,
  `report_date` date NOT NULL,
  `shift_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `work_start_time` time DEFAULT NULL,
  `work_end_time` time DEFAULT NULL,
  `prepared_by` bigint(20) UNSIGNED DEFAULT NULL,
  `site_engineer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `supervisor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `safety_briefing_done` tinyint(1) NOT NULL DEFAULT 0,
  `safety_incident_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_manpower` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_equipment` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `planned_progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `actual_progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `overall_work_summary` text DEFAULT NULL,
  `next_day_plan` text DEFAULT NULL,
  `client_instructions` text DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `active_report` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_reports`
--

INSERT INTO `daily_site_reports` (`id`, `company_id`, `project_id`, `site_id`, `report_no`, `report_date`, `shift_type_id`, `work_start_time`, `work_end_time`, `prepared_by`, `site_engineer_id`, `supervisor_id`, `safety_briefing_done`, `safety_incident_count`, `total_manpower`, `total_equipment`, `planned_progress_percentage`, `actual_progress_percentage`, `overall_work_summary`, `next_day_plan`, `client_instructions`, `internal_notes`, `status_id`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `approval_remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'DSR-EXPO-0001', '2026-07-23', 1, '08:30:00', '17:30:00', NULL, NULL, NULL, 1, 0, 18, 2, 1.5000, 1.3500, 'Foundation reinforcement and shuttering work progressed as planned.', 'Complete reinforcement inspection and begin concrete preparation.', NULL, NULL, 4, NULL, '2026-07-23 20:55:31', NULL, '2026-07-23 20:55:31', 'Daily report reviewed and approved.', NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, 1, 'DSR-API-1785835562', '2026-08-05', 1, '08:30:00', '17:30:00', 1, NULL, NULL, 1, 0, 0, 0, 2.5000, 0.0000, 'Module 7 complete API test', 'Updated by Module 7 complete test', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-08-04 09:26:03', '2026-08-04 09:26:05', NULL),
(3, 1, 1, 1, 'DSR-API-1785835852', '2026-08-06', 1, '08:30:00', '17:30:00', 1, NULL, NULL, 1, 0, 8, 1, 2.5000, 0.0000, 'Module 7 complete API test', 'Updated by Module 7 complete test', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-08-04 09:30:53', '2026-08-04 15:00:57', NULL),
(4, 1, 1, 1, 'DSR-API-1785836390', '2026-08-07', 1, '08:30:00', '17:30:00', 1, NULL, NULL, 1, 0, 8, 1, 2.5000, 0.0000, 'Module 7 complete API test', 'Updated by Module 7 complete test', NULL, NULL, 7, 1, '2026-08-04 09:40:29', 1, '2026-08-04 09:40:16', 'Rejected by complete API workflow test', 1, 1, '2026-08-04 09:39:51', '2026-08-04 15:10:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_reports_shift_type_masters`
--

CREATE TABLE `daily_site_reports_shift_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shift_type_code` varchar(60) NOT NULL,
  `shift_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_reports_shift_type_masters`
--

INSERT INTO `daily_site_reports_shift_type_masters` (`id`, `shift_type_code`, `shift_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GENERAL', 'General', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'DAY', 'Day', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'NIGHT', 'Night', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'MULTIPLE', 'Multiple', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_reports_status_masters`
--

CREATE TABLE `daily_site_reports_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_reports_status_masters`
--

INSERT INTO `daily_site_reports_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'REVIEWED', 'Reviewed', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'REOPENED', 'Reopened', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_visitors`
--

CREATE TABLE `daily_site_visitors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `visitor_name` varchar(150) NOT NULL,
  `organisation` varchar(180) DEFAULT NULL,
  `designation` varchar(120) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `visit_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 9,
  `purpose` varchar(500) DEFAULT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `hosted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `instructions_or_observations` text DEFAULT NULL,
  `follow_up_required` tinyint(1) NOT NULL DEFAULT 0,
  `follow_up_owner` bigint(20) UNSIGNED DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_visitors`
--

INSERT INTO `daily_site_visitors` (`id`, `company_id`, `daily_report_id`, `visitor_name`, `organisation`, `designation`, `phone`, `visit_type_id`, `purpose`, `check_in_time`, `check_out_time`, `hosted_by`, `instructions_or_observations`, `follow_up_required`, `follow_up_owner`, `follow_up_date`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'Arun Kumar', 'Client Project Team', 'Project Coordinator', NULL, 1, 'Routine progress inspection', '11:00:00', '12:15:00', NULL, 'Requested updated two-week look-ahead programme.', 1, NULL, '2026-07-24', NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 3, 'API Test Visitor', 'Test Organisation', NULL, NULL, 9, 'Module 7 testing', '11:00:00', '12:00:00', 1, NULL, 1, 1, '2026-08-07', 1, 1, '2026-08-04 09:31:01', '2026-08-04 09:31:01', NULL),
(3, 1, 4, 'API Test Visitor', 'Test Organisation', NULL, NULL, 9, 'Module 7 testing', '11:00:00', '12:00:00', 1, NULL, 1, 1, '2026-08-08', 1, 1, '2026-08-04 09:39:58', '2026-08-04 09:39:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_visitors_visit_type_masters`
--

CREATE TABLE `daily_site_visitors_visit_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `visit_type_code` varchar(60) NOT NULL,
  `visit_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_visitors_visit_type_masters`
--

INSERT INTO `daily_site_visitors_visit_type_masters` (`id`, `visit_type_code`, `visit_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CLIENT', 'Client', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'CONSULTANT', 'Consultant', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'ARCHITECT', 'Architect', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'AUTHORITY', 'Authority', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'SUPPLIER', 'Supplier', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'CONTRACTOR', 'Contractor', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'AUDITOR', 'Auditor', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'MANAGEMENT', 'Management', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(9, 'OTHER', 'Other', 9, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_weather`
--

CREATE TABLE `daily_site_weather` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `observation_time` time DEFAULT NULL,
  `weather_period_id` bigint(20) UNSIGNED NOT NULL DEFAULT 4,
  `weather_condition_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `temperature_c` decimal(5,2) DEFAULT NULL,
  `humidity_percentage` decimal(6,2) DEFAULT NULL,
  `rainfall_mm` decimal(8,2) DEFAULT NULL,
  `work_impact_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `lost_hours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_weather`
--

INSERT INTO `daily_site_weather` (`id`, `company_id`, `daily_report_id`, `observation_time`, `weather_period_id`, `weather_condition_id`, `temperature_c`, `humidity_percentage`, `rainfall_mm`, `work_impact_id`, `lost_hours`, `remarks`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, '09:00:00', 1, 1, 29.50, 68.00, 0.00, 1, 0.00, 'Suitable working conditions.', NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, '14:00:00', 2, 7, 35.00, 55.00, 0.00, 2, 0.50, 'Additional hydration break provided.', NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(3, 1, 3, '09:00:00', 1, 1, 30.00, 65.00, 0.00, 1, 0.00, 'Updated weather', 1, '2026-08-04 09:30:59', '2026-08-04 09:30:59', NULL),
(4, 1, 4, '09:00:00', 1, 1, 30.00, 65.00, 0.00, 1, 0.00, 'Updated weather', 1, '2026-08-04 09:39:56', '2026-08-04 09:39:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_weather_weather_condition_masters`
--

CREATE TABLE `daily_site_weather_weather_condition_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `weather_condition_code` varchar(60) NOT NULL,
  `weather_condition_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_weather_weather_condition_masters`
--

INSERT INTO `daily_site_weather_weather_condition_masters` (`id`, `weather_condition_code`, `weather_condition_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CLEAR', 'Clear', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'CLOUDY', 'Cloudy', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'LIGHT_RAIN', 'Light Rain', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'HEAVY_RAIN', 'Heavy Rain', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'WINDY', 'Windy', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'STORM', 'Storm', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'HOT', 'Hot', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'HUMID', 'Humid', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(9, 'OTHER', 'Other', 9, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_weather_weather_period_masters`
--

CREATE TABLE `daily_site_weather_weather_period_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `weather_period_code` varchar(60) NOT NULL,
  `weather_period_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_weather_weather_period_masters`
--

INSERT INTO `daily_site_weather_weather_period_masters` (`id`, `weather_period_code`, `weather_period_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MORNING', 'Morning', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'AFTERNOON', 'Afternoon', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'EVENING', 'Evening', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'FULL_DAY', 'Full Day', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_site_weather_work_impact_masters`
--

CREATE TABLE `daily_site_weather_work_impact_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `work_impact_code` varchar(60) NOT NULL,
  `work_impact_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_site_weather_work_impact_masters`
--

INSERT INTO `daily_site_weather_work_impact_masters` (`id`, `work_impact_code`, `work_impact_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NONE', 'None', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'MINOR', 'Minor', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'MODERATE', 'Moderate', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'MAJOR', 'Major', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'WORK_STOPPED', 'Work Stopped', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_work_progress`
--

CREATE TABLE `daily_work_progress` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `daily_report_id` bigint(20) UNSIGNED NOT NULL,
  `boq_item_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `location_description` varchar(250) DEFAULT NULL,
  `planned_qty_for_day` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `completed_qty_for_day` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `cumulative_qty_before` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `cumulative_qty_after` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `completion_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `quality_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `inspected_by` bigint(20) UNSIGNED DEFAULT NULL,
  `inspected_at` datetime DEFAULT NULL,
  `measurement_reference` varchar(80) DEFAULT NULL,
  `work_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_work_progress`
--

INSERT INTO `daily_work_progress` (`id`, `company_id`, `project_id`, `daily_report_id`, `boq_item_id`, `site_id`, `zone_id`, `uom_id`, `location_description`, `planned_qty_for_day`, `completed_qty_for_day`, `cumulative_qty_before`, `cumulative_qty_after`, `completion_percentage`, `quality_status_id`, `inspected_by`, `inspected_at`, `measurement_reference`, `work_status_id`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 4, 'Foundation grid A1-A4', 25.0000, 22.5000, 100.0000, 122.5000, 49.0000, 2, NULL, '2026-07-23 20:55:31', 'MB-EXPO-001', 2, 'Measured jointly at site.', NULL, NULL, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(2, 1, 1, 3, 1, 1, 1, 4, NULL, 5.0000, 4.5000, 0.0000, 4.5000, 1.8000, 2, 1, '2026-08-04 09:30:56', NULL, 2, 'Passed API inspection', 1, 1, '2026-08-04 09:30:55', '2026-08-04 09:30:56', NULL),
(3, 1, 1, 4, 1, 1, 1, 4, NULL, 5.0000, 4.5000, 0.0000, 4.5000, 1.8000, 2, 1, '2026-08-04 09:39:54', NULL, 2, 'Passed API inspection', 1, 1, '2026-08-04 09:39:53', '2026-08-04 09:39:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_work_progress_quality_status_masters`
--

CREATE TABLE `daily_work_progress_quality_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `quality_status_code` varchar(60) NOT NULL,
  `quality_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_work_progress_quality_status_masters`
--

INSERT INTO `daily_work_progress_quality_status_masters` (`id`, `quality_status_code`, `quality_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NOT_INSPECTED', 'Not Inspected', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'PASSED', 'Passed', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'PARTIALLY_PASSED', 'Partially Passed', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'FAILED', 'Failed', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'REWORK_REQUIRED', 'Rework Required', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `daily_work_progress_work_status_masters`
--

CREATE TABLE `daily_work_progress_work_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `work_status_code` varchar(60) NOT NULL,
  `work_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_work_progress_work_status_masters`
--

INSERT INTO `daily_work_progress_work_status_masters` (`id`, `work_status_code`, `work_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'IN_PROGRESS', 'In Progress', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'COMPLETED', 'Completed', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'ON_HOLD', 'On Hold', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'REWORK', 'Rework', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alerts`
--

CREATE TABLE `dashboard_alerts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `alert_no` varchar(40) NOT NULL,
  `alert_type_id` bigint(20) UNSIGNED NOT NULL,
  `severity_id` bigint(20) UNSIGNED NOT NULL DEFAULT 3,
  `title` varchar(180) NOT NULL,
  `message` text NOT NULL,
  `source_module` varchar(60) DEFAULT NULL,
  `source_table` varchar(80) DEFAULT NULL,
  `source_record_id` bigint(20) UNSIGNED DEFAULT NULL,
  `alert_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `acknowledged_by` bigint(20) UNSIGNED DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  `resolved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolution` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alerts`
--

INSERT INTO `dashboard_alerts` (`id`, `company_id`, `project_id`, `site_id`, `alert_no`, `alert_type_id`, `severity_id`, `title`, `message`, `source_module`, `source_table`, `source_record_id`, `alert_date`, `due_date`, `assigned_to`, `status_id`, `acknowledged_by`, `acknowledged_at`, `resolved_by`, `resolved_at`, `resolution`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, 'ALT-000001-001', 1, 3, 'Progress is below plan', 'Actual physical progress is 2.50% below planned progress.', 'PROGRESS', NULL, NULL, '2026-07-23 21:20:48', '2026-07-26 21:20:48', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 21:20:48', '2026-07-23 21:20:48'),
(2, 1, 1, NULL, 'ALT-20260804153405-756', 1, 4, 'Module 11 Alert 1785857644', 'Module 11 complete API test alert', 'MODULE11_TEST', NULL, NULL, '2026-08-04 15:34:05', NULL, NULL, 4, 1, '2026-08-04 15:34:06', 1, '2026-08-04 15:34:06', 'Resolved by Module 11 complete test', 1, '2026-08-04 21:04:05', '2026-08-04 15:34:06');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alerts_alert_type_masters`
--

CREATE TABLE `dashboard_alerts_alert_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `alert_type_code` varchar(60) NOT NULL,
  `alert_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alerts_alert_type_masters`
--

INSERT INTO `dashboard_alerts_alert_type_masters` (`id`, `alert_type_code`, `alert_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SCHEDULE_DELAY', 'Schedule Delay', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'COST_OVERRUN', 'Cost Overrun', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'LOW_STOCK', 'Low Stock', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'PAYMENT_DUE', 'Payment Due', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'APPROVAL_PENDING', 'Approval Pending', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'SAFETY', 'Safety', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'QUALITY', 'Quality', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'DOCUMENT_EXPIRY', 'Document Expiry', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(9, 'CASHFLOW', 'Cashflow', 9, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(10, 'OTHER', 'Other', 10, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alerts_severity_masters`
--

CREATE TABLE `dashboard_alerts_severity_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `severity_code` varchar(60) NOT NULL,
  `severity_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alerts_severity_masters`
--

INSERT INTO `dashboard_alerts_severity_masters` (`id`, `severity_code`, `severity_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'INFO', 'Info', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'LOW', 'Low', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'MEDIUM', 'Medium', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'HIGH', 'High', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'CRITICAL', 'Critical', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alerts_status_masters`
--

CREATE TABLE `dashboard_alerts_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alerts_status_masters`
--

INSERT INTO `dashboard_alerts_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'OPEN', 'Open', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'ACKNOWLEDGED', 'Acknowledged', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'IN_PROGRESS', 'In Progress', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'RESOLVED', 'Resolved', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'DISMISSED', 'Dismissed', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alert_actions`
--

CREATE TABLE `dashboard_alert_actions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `alert_id` bigint(20) UNSIGNED NOT NULL,
  `action_type_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) DEFAULT NULL,
  `action_notes` varchar(1000) DEFAULT NULL,
  `action_by` bigint(20) UNSIGNED DEFAULT NULL,
  `action_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alert_actions`
--

INSERT INTO `dashboard_alert_actions` (`id`, `company_id`, `alert_id`, `action_type_id`, `old_status`, `new_status`, `action_notes`, `action_by`, `action_at`) VALUES
(1, 1, 1, 1, NULL, 'OPEN', 'Automatically created from progress variance.', NULL, '2026-07-23 21:20:48'),
(2, 1, 2, 6, 'OPEN', 'OPEN', 'Manual alert created.', 1, '2026-08-04 15:34:05'),
(3, 1, 2, 3, 'OPEN', 'ACKNOWLEDGED', 'Acknowledged by Module 11 test', 1, '2026-08-04 15:34:06'),
(4, 1, 2, 6, 'ACKNOWLEDGED', 'IN_PROGRESS', 'Work started by Module 11 test', 1, '2026-08-04 15:34:06'),
(5, 1, 2, 7, 'IN_PROGRESS', 'RESOLVED', NULL, 1, '2026-08-04 15:34:06');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_alert_actions_action_type_masters`
--

CREATE TABLE `dashboard_alert_actions_action_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type_code` varchar(60) NOT NULL,
  `action_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dashboard_alert_actions_action_type_masters`
--

INSERT INTO `dashboard_alert_actions_action_type_masters` (`id`, `action_type_code`, `action_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CREATED', 'Created', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'ASSIGNED', 'Assigned', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'ACKNOWLEDGED', 'Acknowledged', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'COMMENTED', 'Commented', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'ESCALATED', 'Escalated', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'STATUS_CHANGED', 'Status Changed', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'RESOLVED', 'Resolved', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'DISMISSED', 'Dismissed', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

CREATE TABLE `document_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `document_type_code` varchar(30) NOT NULL,
  `document_type_name` varchar(120) NOT NULL,
  `entity_scope_id` bigint(20) UNSIGNED NOT NULL DEFAULT 8,
  `allowed_extensions` varchar(255) DEFAULT NULL,
  `maximum_file_size_mb` decimal(8,2) NOT NULL DEFAULT 10.00,
  `expiry_tracking` tinyint(1) NOT NULL DEFAULT 0,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`id`, `company_id`, `document_type_code`, `document_type_name`, `entity_scope_id`, `allowed_extensions`, `maximum_file_size_mb`, `expiry_tracking`, `is_mandatory`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'CLIENT-GST', 'GST Registration Certificate', 1, 'pdf,jpg,jpeg,png', 10.00, 0, 0, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, 'CLIENT-PAN', 'PAN Card', 1, 'pdf,jpg,jpeg,png', 10.00, 0, 0, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, 'CLIENT-AGREEMENT', 'Client Agreement', 1, 'pdf,doc,docx', 25.00, 1, 0, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, 'PROJECT-CONTRACT', 'Project Contract', 2, 'pdf,doc,docx', 25.00, 1, 1, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, 'DRAWING', 'Approved Drawing', 2, 'pdf,dwg,dxf,jpg,jpeg,png', 50.00, 0, 0, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, 'SITE-PHOTO', 'Site Photograph', 3, 'jpg,jpeg,png,webp', 15.00, 0, 0, NULL, 60, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, 'INVOICE', 'Invoice or Bill', 7, 'pdf,jpg,jpeg,png', 15.00, 0, 0, NULL, 70, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_types_entity_scope_masters`
--

CREATE TABLE `document_types_entity_scope_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_scope_code` varchar(60) NOT NULL,
  `entity_scope_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_types_entity_scope_masters`
--

INSERT INTO `document_types_entity_scope_masters` (`id`, `entity_scope_code`, `entity_scope_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CLIENT', 'Client', 1, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(2, 'PROJECT', 'Project', 2, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(3, 'SITE', 'Site', 3, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(4, 'LABOUR', 'Labour', 4, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(5, 'CONTRACTOR', 'Contractor', 5, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(6, 'MATERIAL', 'Material', 6, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(7, 'EXPENSE', 'Expense', 7, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43'),
(8, 'COMMON', 'Common', 8, 1, '2026-07-26 12:38:43', '2026-07-26 12:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `expense_allocations`
--

CREATE TABLE `expense_allocations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `bill_id` bigint(20) UNSIGNED NOT NULL,
  `bill_item_id` bigint(20) UNSIGNED NOT NULL,
  `budget_id` bigint(20) UNSIGNED NOT NULL,
  `budget_line_id` bigint(20) UNSIGNED NOT NULL,
  `allocated_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `allocation_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_allocations`
--

INSERT INTO `expense_allocations` (`id`, `company_id`, `project_id`, `bill_id`, `bill_item_id`, `budget_id`, `budget_line_id`, `allocated_amount`, `allocation_type_id`, `remarks`, `created_by`, `created_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 11800.00, 1, 'Allocated to approved budget line.', NULL, '2026-07-23 21:02:41', NULL),
(2, 1, 1, 2, 2, 4, 8, 1000.00, 1, 'Module 9 API allocation', 1, '2026-08-04 19:43:12', NULL),
(3, 1, 1, 3, 3, 4, 8, 1000.00, 1, 'Module 9 API allocation', 1, '2026-08-04 19:48:10', NULL),
(4, 1, 1, 4, 4, 4, 8, 1000.00, 1, 'Module 9 API allocation', 1, '2026-08-04 19:50:30', NULL),
(5, 1, 1, 5, 5, 4, 8, 1000.00, 1, 'Module 9 API allocation', 1, '2026-08-04 20:04:32', NULL),
(6, 1, 1, 6, 6, 4, 8, 1000.00, 1, 'Module 9 API allocation', 1, '2026-08-04 20:12:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_allocations_allocation_type_masters`
--

CREATE TABLE `expense_allocations_allocation_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `allocation_type_code` varchar(60) NOT NULL,
  `allocation_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_allocations_allocation_type_masters`
--

INSERT INTO `expense_allocations_allocation_type_masters` (`id`, `allocation_type_code`, `allocation_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DIRECT', 'Direct', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SPLIT', 'Split', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'ADJUSTMENT', 'Adjustment', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_approvals`
--

CREATE TABLE `expense_approvals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_id` bigint(20) UNSIGNED NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `approval_level` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `action_type_id` bigint(20) UNSIGNED NOT NULL,
  `action_by` bigint(20) UNSIGNED DEFAULT NULL,
  `action_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_approvals`
--

INSERT INTO `expense_approvals` (`id`, `company_id`, `entity_type_id`, `entity_id`, `approval_level`, `action_type_id`, `action_by`, `action_at`, `remarks`, `created_at`) VALUES
(1, 1, 1, 1, 1, 2, NULL, '2026-07-23 21:02:41', 'Request approved.', '2026-07-23 21:02:41'),
(2, 1, 2, 1, 1, 2, NULL, '2026-07-23 21:02:41', 'Bill verified and approved.', '2026-07-23 21:02:41'),
(3, 1, 1, 2, 1, 1, 1, '2026-08-04 14:13:09', 'Submitted by Module 9 test', '2026-08-04 19:43:09'),
(4, 1, 1, 2, 1, 2, 1, '2026-08-04 14:13:10', 'Approved by Module 9 test', '2026-08-04 19:43:10'),
(5, 1, 2, 2, 1, 1, 1, '2026-08-04 14:13:13', 'Submitted by Module 9 test', '2026-08-04 19:43:13'),
(6, 1, 2, 2, 1, 2, 1, '2026-08-04 14:13:13', 'Approved by Module 9 test', '2026-08-04 19:43:13'),
(7, 1, 2, 2, 1, 2, 1, '2026-08-04 14:13:14', 'Posted by Module 9 test', '2026-08-04 19:43:14'),
(8, 1, 3, 2, 1, 1, 1, '2026-08-04 14:13:16', 'Submitted by Module 9 test', '2026-08-04 19:43:16'),
(9, 1, 3, 2, 1, 2, 1, '2026-08-04 14:13:16', 'Approved by Module 9 test', '2026-08-04 19:43:16'),
(10, 1, 3, 2, 1, 2, 1, '2026-08-04 14:13:17', 'Paid by Module 9 test', '2026-08-04 19:43:17'),
(11, 1, 1, 3, 1, 1, 1, '2026-08-04 14:18:07', 'Submitted by Module 9 test', '2026-08-04 19:48:07'),
(12, 1, 1, 3, 1, 2, 1, '2026-08-04 14:18:07', 'Approved by Module 9 test', '2026-08-04 19:48:07'),
(13, 1, 2, 3, 1, 1, 1, '2026-08-04 14:18:11', 'Submitted by Module 9 test', '2026-08-04 19:48:11'),
(14, 1, 2, 3, 1, 2, 1, '2026-08-04 14:18:12', 'Approved by Module 9 test', '2026-08-04 19:48:12'),
(15, 1, 2, 3, 1, 2, 1, '2026-08-04 14:18:12', 'Posted by Module 9 test', '2026-08-04 19:48:12'),
(16, 1, 3, 3, 1, 1, 1, '2026-08-04 14:18:14', 'Submitted by Module 9 test', '2026-08-04 19:48:14'),
(17, 1, 3, 3, 1, 2, 1, '2026-08-04 14:18:14', 'Approved by Module 9 test', '2026-08-04 19:48:14'),
(18, 1, 3, 3, 1, 2, 1, '2026-08-04 14:18:15', 'Paid by Module 9 test', '2026-08-04 19:48:15'),
(19, 1, 1, 4, 1, 1, 1, '2026-08-04 14:20:27', 'Submitted by Module 9 test', '2026-08-04 19:50:27'),
(20, 1, 1, 4, 1, 2, 1, '2026-08-04 14:20:28', 'Approved by Module 9 test', '2026-08-04 19:50:28'),
(21, 1, 2, 4, 1, 1, 1, '2026-08-04 14:20:31', 'Submitted by Module 9 test', '2026-08-04 19:50:31'),
(22, 1, 2, 4, 1, 2, 1, '2026-08-04 14:20:31', 'Approved by Module 9 test', '2026-08-04 19:50:31'),
(23, 1, 2, 4, 1, 2, 1, '2026-08-04 14:20:32', 'Posted by Module 9 test', '2026-08-04 19:50:32'),
(24, 1, 3, 4, 1, 1, 1, '2026-08-04 14:20:34', 'Submitted by Module 9 test', '2026-08-04 19:50:34'),
(25, 1, 3, 4, 1, 2, 1, '2026-08-04 14:20:34', 'Approved by Module 9 test', '2026-08-04 19:50:34'),
(26, 1, 3, 4, 1, 2, 1, '2026-08-04 14:20:34', 'Paid by Module 9 test', '2026-08-04 19:50:34'),
(27, 1, 1, 5, 1, 1, 1, '2026-08-04 14:34:29', 'Submitted by Module 9 test', '2026-08-04 20:04:29'),
(28, 1, 1, 5, 1, 2, 1, '2026-08-04 14:34:30', 'Approved by Module 9 test', '2026-08-04 20:04:30'),
(29, 1, 2, 5, 1, 1, 1, '2026-08-04 14:34:34', 'Submitted by Module 9 test', '2026-08-04 20:04:34'),
(30, 1, 2, 5, 1, 2, 1, '2026-08-04 14:34:34', 'Approved by Module 9 test', '2026-08-04 20:04:34'),
(31, 1, 2, 5, 1, 2, 1, '2026-08-04 14:34:34', 'Posted by Module 9 test', '2026-08-04 20:04:34'),
(32, 1, 3, 5, 1, 1, 1, '2026-08-04 14:34:37', 'Submitted by Module 9 test', '2026-08-04 20:04:37'),
(33, 1, 3, 5, 1, 2, 1, '2026-08-04 14:34:37', 'Approved by Module 9 test', '2026-08-04 20:04:37'),
(34, 1, 3, 5, 1, 2, 1, '2026-08-04 14:34:37', 'Paid by Module 9 test', '2026-08-04 20:04:37'),
(35, 1, 1, 6, 1, 1, 1, '2026-08-04 14:42:03', 'Submitted by Module 9 test', '2026-08-04 20:12:03'),
(36, 1, 1, 6, 1, 2, 1, '2026-08-04 14:42:13', 'Approved by Module 9 test', '2026-08-04 20:12:13'),
(37, 1, 2, 6, 1, 1, 1, '2026-08-04 14:42:22', 'Submitted by Module 9 test', '2026-08-04 20:12:22'),
(38, 1, 2, 6, 1, 2, 1, '2026-08-04 14:42:28', 'Approved by Module 9 test', '2026-08-04 20:12:28'),
(39, 1, 2, 6, 1, 2, 1, '2026-08-04 14:42:35', 'Posted by Module 9 test', '2026-08-04 20:12:35'),
(40, 1, 3, 6, 1, 1, 1, '2026-08-04 14:42:43', 'Submitted by Module 9 test', '2026-08-04 20:12:43'),
(41, 1, 3, 6, 1, 2, 1, '2026-08-04 14:42:50', 'Approved by Module 9 test', '2026-08-04 20:12:50'),
(42, 1, 3, 6, 1, 2, 1, '2026-08-04 14:42:57', 'Paid by Module 9 test', '2026-08-04 20:12:57'),
(43, 1, 1, 7, 1, 1, 1, '2026-08-04 15:04:47', 'Submitted for Module 10 test', '2026-08-04 20:34:47'),
(44, 1, 1, 8, 1, 1, 1, '2026-08-04 15:11:59', 'Submitted for Module 10 test', '2026-08-04 20:41:59'),
(45, 1, 1, 8, 1, 2, 1, '2026-08-04 15:12:06', 'Approved through Module 10 approval centre', '2026-08-04 20:42:06');

-- --------------------------------------------------------

--
-- Table structure for table `expense_approvals_action_type_masters`
--

CREATE TABLE `expense_approvals_action_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type_code` varchar(60) NOT NULL,
  `action_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_approvals_action_type_masters`
--

INSERT INTO `expense_approvals_action_type_masters` (`id`, `action_type_code`, `action_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUBMITTED', 'Submitted', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'APPROVED', 'Approved', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'REJECTED', 'Rejected', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'REWORK', 'Rework', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_approvals_entity_type_masters`
--

CREATE TABLE `expense_approvals_entity_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_code` varchar(60) NOT NULL,
  `entity_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_approvals_entity_type_masters`
--

INSERT INTO `expense_approvals_entity_type_masters` (`id`, `entity_type_code`, `entity_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'REQUEST', 'Request', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'BILL', 'Bill', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'PAYMENT', 'Payment', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_bills`
--

CREATE TABLE `expense_bills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `request_id` bigint(20) UNSIGNED DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purchase_order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `material_receipt_id` bigint(20) UNSIGNED DEFAULT NULL,
  `bill_no` varchar(60) NOT NULL,
  `internal_voucher_no` varchar(40) NOT NULL,
  `bill_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `payee_type_id` bigint(20) UNSIGNED NOT NULL,
  `payee_name` varchar(180) NOT NULL,
  `payee_gstin` varchar(20) DEFAULT NULL,
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(18,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(18,2) NOT NULL DEFAULT 0.00,
  `gross_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tds_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `net_payable` decimal(18,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `outstanding_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `payment_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `posted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_bills`
--

INSERT INTO `expense_bills` (`id`, `company_id`, `project_id`, `site_id`, `zone_id`, `request_id`, `supplier_id`, `purchase_order_id`, `material_receipt_id`, `bill_no`, `internal_voucher_no`, `bill_date`, `due_date`, `payee_type_id`, `payee_name`, `payee_gstin`, `subtotal`, `discount_amount`, `taxable_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`, `other_charges`, `round_off`, `gross_amount`, `tds_amount`, `net_payable`, `paid_amount`, `outstanding_amount`, `payment_status_id`, `status_id`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `posted_by`, `posted_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, NULL, NULL, NULL, 'INV-EXPO-101', 'EV-EXPO-0001', '2026-07-23', '2026-07-30', 4, 'Coimbatore Safety Stores', NULL, 10000.00, 0.00, 10000.00, 900.00, 900.00, 0.00, 0.00, 0.00, 11800.00, 0.00, 11800.00, 5000.00, 6800.00, 2, 4, NULL, '2026-07-23 21:02:41', NULL, '2026-07-23 21:02:41', NULL, '2026-07-23 21:02:41', 'Expo sample posted site expense.', NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(2, 1, 1, 1, NULL, 2, NULL, NULL, NULL, 'INV_API_1785852784', 'EV_API_1785852784', '2026-08-04', '2026-08-04', 1, 'Module 9 API Payee', NULL, 1000.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 1000.00, 0.00, 3, 4, 1, '2026-08-04 14:13:13', 1, '2026-08-04 14:13:13', 1, '2026-08-04 14:13:14', 'Module 9 API bill', 1, 1, '2026-08-04 19:43:10', '2026-08-04 19:43:17', NULL),
(3, 1, 1, 1, NULL, 3, NULL, NULL, NULL, 'INV_API_1785853080', 'EV_API_1785853080', '2026-08-04', '2026-08-04', 1, 'Module 9 API Payee', NULL, 1000.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 1000.00, 0.00, 3, 4, 1, '2026-08-04 14:18:11', 1, '2026-08-04 14:18:12', 1, '2026-08-04 14:18:12', 'Module 9 API bill', 1, 1, '2026-08-04 19:48:07', '2026-08-04 19:48:15', NULL),
(4, 1, 1, 1, NULL, 4, NULL, NULL, NULL, 'INV_API_1785853222', 'EV_API_1785853222', '2026-08-04', '2026-08-04', 1, 'Module 9 API Payee', NULL, 1000.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 1000.00, 0.00, 3, 4, 1, '2026-08-04 14:20:31', 1, '2026-08-04 14:20:31', 1, '2026-08-04 14:20:32', 'Module 9 API bill', 1, 1, '2026-08-04 19:50:28', '2026-08-04 19:50:34', NULL),
(5, 1, 1, 1, NULL, 5, NULL, NULL, NULL, 'INV_API_1785854063', 'EV_API_1785854063', '2026-08-04', '2026-08-04', 1, 'Module 9 API Payee', NULL, 1000.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 1000.00, 0.00, 3, 4, 1, '2026-08-04 14:34:34', 1, '2026-08-04 14:34:34', 1, '2026-08-04 14:34:34', 'Module 9 API bill', 1, 1, '2026-08-04 20:04:30', '2026-08-04 20:04:37', NULL),
(6, 1, 1, 1, NULL, 6, NULL, NULL, NULL, 'INV_API_1785854515', 'EV_API_1785854515', '2026-08-04', '2026-08-04', 1, 'Module 9 API Payee', NULL, 1000.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 1000.00, 0.00, 3, 4, 1, '2026-08-04 14:42:22', 1, '2026-08-04 14:42:28', 1, '2026-08-04 14:42:35', 'Module 9 API bill', 1, 1, '2026-08-04 20:12:19', '2026-08-04 20:12:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_bills_payee_type_masters`
--

CREATE TABLE `expense_bills_payee_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payee_type_code` varchar(60) NOT NULL,
  `payee_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_bills_payee_type_masters`
--

INSERT INTO `expense_bills_payee_type_masters` (`id`, `payee_type_code`, `payee_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SUPPLIER', 'Supplier', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'EMPLOYEE', 'Employee', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'CONTRACTOR', 'Contractor', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'OTHER', 'Other', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_bills_payment_status_masters`
--

CREATE TABLE `expense_bills_payment_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_status_code` varchar(60) NOT NULL,
  `payment_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_bills_payment_status_masters`
--

INSERT INTO `expense_bills_payment_status_masters` (`id`, `payment_status_code`, `payment_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UNPAID', 'Unpaid', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'PARTIALLY_PAID', 'Partially Paid', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'PAID', 'Paid', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_bills_status_masters`
--

CREATE TABLE `expense_bills_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_bills_status_masters`
--

INSERT INTO `expense_bills_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'POSTED', 'Posted', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_bill_items`
--

CREATE TABLE `expense_bill_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `bill_id` bigint(20) UNSIGNED NOT NULL,
  `request_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expense_category_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(500) NOT NULL,
  `quantity` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `taxable_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `tax_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_bill_items`
--

INSERT INTO `expense_bill_items` (`id`, `company_id`, `project_id`, `bill_id`, `request_item_id`, `expense_category_id`, `description`, `quantity`, `rate`, `taxable_amount`, `tax_rate`, `tax_amount`, `line_total`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'Safety consumables and minor site tools', 1.0000, 10000.0000, 10000.00, 18.0000, 1800.00, 11800.00, NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(2, 1, 1, 2, 2, 10, 'API test expense bill line', 2.0000, 500.0000, 1000.00, 0.0000, 0.00, 1000.00, 1, 1, '2026-08-04 19:43:11', '2026-08-04 19:43:11', NULL),
(3, 1, 1, 3, 3, 11, 'API test expense bill line', 2.0000, 500.0000, 1000.00, 0.0000, 0.00, 1000.00, 1, 1, '2026-08-04 19:48:09', '2026-08-04 19:48:09', NULL),
(4, 1, 1, 4, 4, 12, 'API test expense bill line', 2.0000, 500.0000, 1000.00, 0.0000, 0.00, 1000.00, 1, 1, '2026-08-04 19:50:29', '2026-08-04 19:50:29', NULL),
(5, 1, 1, 5, 5, 13, 'API test expense bill line', 2.0000, 500.0000, 1000.00, 0.0000, 0.00, 1000.00, 1, 1, '2026-08-04 20:04:31', '2026-08-04 20:04:31', NULL),
(6, 1, 1, 6, 6, 14, 'API test expense bill line', 2.0000, 500.0000, 1000.00, 0.0000, 0.00, 1000.00, 1, 1, '2026-08-04 20:12:20', '2026-08-04 20:12:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_code` varchar(30) NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `expense_scope_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `default_taxable` tinyint(1) NOT NULL DEFAULT 0,
  `requires_document` tinyint(1) NOT NULL DEFAULT 0,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `company_id`, `parent_id`, `category_code`, `category_name`, `expense_scope_id`, `default_taxable`, `requires_document`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'SITE-PETTY', 'Site Petty Cash', 2, 0, 0, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, NULL, 'TRANSPORT', 'Transport and Freight', 1, 1, 1, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, NULL, 'EQUIPMENT-HIRE', 'Equipment Hire', 1, 1, 1, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, NULL, 'FUEL', 'Fuel and Lubricants', 2, 1, 1, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, NULL, 'UTILITIES', 'Site Utilities', 2, 1, 1, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, NULL, 'PERMIT-FEE', 'Permit and Statutory Fees', 1, 0, 1, NULL, 60, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, NULL, 'TRAVEL', 'Travel and Conveyance', 4, 1, 1, NULL, 70, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(8, 1, NULL, 'OFFICE', 'Office Administration', 3, 1, 1, NULL, 80, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(9, 1, NULL, 'EXP_API_1785852503', 'API Site Expense Updated 1785852503', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 19:38:24', '2026-08-04 19:39:26', NULL),
(10, 1, NULL, 'EXP_API_1785852784', 'API Site Expense Updated 1785852784', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 19:43:04', '2026-08-04 19:43:04', NULL),
(11, 1, NULL, 'EXP_API_1785853080', 'API Site Expense Updated 1785853080', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 19:48:00', '2026-08-04 19:48:01', NULL),
(12, 1, NULL, 'EXP_API_1785853222', 'API Site Expense Updated 1785853222', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 19:50:23', '2026-08-04 19:50:23', NULL),
(13, 1, NULL, 'EXP_API_1785854063', 'API Site Expense Updated 1785854063', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 20:04:24', '2026-08-04 20:04:24', NULL),
(14, 1, NULL, 'EXP_API_1785854515', 'API Site Expense Updated 1785854515', 1, 1, 1, NULL, 999, 1, 1, 1, '2026-08-04 20:11:55', '2026-08-04 20:11:55', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories_expense_scope_masters`
--

CREATE TABLE `expense_categories_expense_scope_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `expense_scope_code` varchar(60) NOT NULL,
  `expense_scope_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories_expense_scope_masters`
--

INSERT INTO `expense_categories_expense_scope_masters` (`id`, `expense_scope_code`, `expense_scope_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT', 'Project', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SITE', 'Site', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'OFFICE', 'Office', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'COMMON', 'Common', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_documents`
--

CREATE TABLE `expense_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `bill_id` bigint(20) UNSIGNED NOT NULL,
  `document_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_name` varchar(180) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size_bytes` bigint(20) UNSIGNED DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_documents`
--

INSERT INTO `expense_documents` (`id`, `company_id`, `bill_id`, `document_type_id`, `document_name`, `file_name`, `file_path`, `mime_type`, `file_size_bytes`, `document_date`, `is_primary`, `uploaded_by`, `uploaded_at`, `deleted_at`) VALUES
(1, 1, 2, NULL, 'API Test Invoice', 'module9-api-invoice.pdf', 'uploads/expenses/module9-api-invoice.pdf', 'application/pdf', 1024, '2026-08-04', 1, 1, '2026-08-04 19:43:11', NULL),
(2, 1, 3, NULL, 'API Test Invoice', 'module9-api-invoice.pdf', 'uploads/expenses/module9-api-invoice.pdf', 'application/pdf', 1024, '2026-08-04', 1, 1, '2026-08-04 19:48:09', NULL),
(3, 1, 4, NULL, 'API Test Invoice', 'module9-api-invoice.pdf', 'uploads/expenses/module9-api-invoice.pdf', 'application/pdf', 1024, '2026-08-04', 1, 1, '2026-08-04 19:50:30', NULL),
(4, 1, 5, NULL, 'API Test Invoice', 'module9-api-invoice.pdf', 'uploads/expenses/module9-api-invoice.pdf', 'application/pdf', 1024, '2026-08-04', 1, 1, '2026-08-04 20:04:32', NULL),
(5, 1, 6, NULL, 'API Test Invoice', 'module9-api-invoice.pdf', 'uploads/expenses/module9-api-invoice.pdf', 'application/pdf', 1024, '2026-08-04', 1, 1, '2026-08-04 20:12:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_payments`
--

CREATE TABLE `expense_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `bill_id` bigint(20) UNSIGNED NOT NULL,
  `petty_cash_account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_no` varchar(40) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode_id` bigint(20) UNSIGNED NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tds_deducted` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `paid_by` bigint(20) UNSIGNED DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_payments`
--

INSERT INTO `expense_payments` (`id`, `company_id`, `project_id`, `bill_id`, `petty_cash_account_id`, `payment_no`, `payment_date`, `payment_mode_id`, `reference_no`, `amount`, `tds_deducted`, `status_id`, `submitted_by`, `approved_by`, `paid_by`, `paid_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'EP-EXPO-0001', '2026-07-23', 1, 'PC-VCH-001', 5000.00, 0.00, 4, NULL, NULL, NULL, '2026-07-23 21:02:41', 'Part payment from site petty cash.', NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(2, 1, 1, 2, NULL, 'EP_API_1785852784', '2026-08-04', 1, 'REF_1785852784', 1000.00, 0.00, 4, 1, 1, 1, '2026-08-04 14:13:17', 'Module 9 API payment updated', 1, 1, '2026-08-04 19:43:14', '2026-08-04 19:43:17', NULL),
(3, 1, 1, 3, NULL, 'EP_API_1785853080', '2026-08-04', 1, 'REF_1785853080', 1000.00, 0.00, 4, 1, 1, 1, '2026-08-04 14:18:15', 'Module 9 API payment updated', 1, 1, '2026-08-04 19:48:13', '2026-08-04 19:48:15', NULL),
(4, 1, 1, 4, NULL, 'EP_API_1785853222', '2026-08-04', 1, 'REF_1785853222', 1000.00, 0.00, 4, 1, 1, 1, '2026-08-04 14:20:34', 'Module 9 API payment updated', 1, 1, '2026-08-04 19:50:32', '2026-08-04 19:50:34', NULL),
(5, 1, 1, 5, NULL, 'EP_API_1785854063', '2026-08-04', 1, 'REF_1785854063', 1000.00, 0.00, 4, 1, 1, 1, '2026-08-04 14:34:37', 'Module 9 API payment updated', 1, 1, '2026-08-04 20:04:35', '2026-08-04 20:04:37', NULL),
(6, 1, 1, 6, NULL, 'EP_API_1785854515', '2026-08-04', 1, 'REF_1785854515', 1000.00, 0.00, 4, 1, 1, 1, '2026-08-04 14:42:57', 'Module 9 API payment updated', 1, 1, '2026-08-04 20:12:42', '2026-08-04 20:12:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_payments_payment_mode_masters`
--

CREATE TABLE `expense_payments_payment_mode_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_mode_code` varchar(60) NOT NULL,
  `payment_mode_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_payments_payment_mode_masters`
--

INSERT INTO `expense_payments_payment_mode_masters` (`id`, `payment_mode_code`, `payment_mode_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CASH', 'Cash', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'BANK_TRANSFER', 'Bank Transfer', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'CHEQUE', 'Cheque', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'UPI', 'Upi', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'CARD', 'Card', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(6, 'OTHER', 'Other', 6, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_payments_status_masters`
--

CREATE TABLE `expense_payments_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_payments_status_masters`
--

INSERT INTO `expense_payments_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'PAID', 'Paid', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_requests`
--

CREATE TABLE `expense_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `request_no` varchar(40) NOT NULL,
  `request_date` date NOT NULL,
  `required_date` date DEFAULT NULL,
  `purpose` varchar(500) NOT NULL,
  `estimated_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_requests`
--

INSERT INTO `expense_requests` (`id`, `company_id`, `project_id`, `site_id`, `zone_id`, `request_no`, `request_date`, `required_date`, `purpose`, `estimated_amount`, `status_id`, `requested_by`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `approval_remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'ER-EXPO-0001', '2026-07-23', '2026-07-23', 'Site safety consumables and minor tools', 11800.00, 3, NULL, NULL, '2026-07-23 21:02:41', NULL, '2026-07-23 21:02:41', 'Approved within site limit.', NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(2, 1, 1, 1, NULL, 'ER_API_1785852784', '2026-08-04', '2026-08-04', 'Module 9 API expense request', 1000.00, 3, 1, 1, '2026-08-04 14:13:09', 1, '2026-08-04 14:13:10', 'Approved by Module 9 test', 1, 1, '2026-08-04 19:43:07', '2026-08-04 19:43:10', NULL),
(3, 1, 1, 1, NULL, 'ER_API_1785853080', '2026-08-04', '2026-08-04', 'Module 9 API expense request', 1000.00, 3, 1, 1, '2026-08-04 14:18:07', 1, '2026-08-04 14:18:07', 'Approved by Module 9 test', 1, 1, '2026-08-04 19:48:04', '2026-08-04 19:48:07', NULL),
(4, 1, 1, 1, NULL, 'ER_API_1785853222', '2026-08-04', '2026-08-04', 'Module 9 API expense request', 1000.00, 3, 1, 1, '2026-08-04 14:20:27', 1, '2026-08-04 14:20:28', 'Approved by Module 9 test', 1, 1, '2026-08-04 19:50:25', '2026-08-04 19:50:28', NULL),
(5, 1, 1, 1, NULL, 'ER_API_1785854063', '2026-08-04', '2026-08-04', 'Module 9 API expense request', 1000.00, 3, 1, 1, '2026-08-04 14:34:29', 1, '2026-08-04 14:34:30', 'Approved by Module 9 test', 1, 1, '2026-08-04 20:04:27', '2026-08-04 20:04:30', NULL),
(6, 1, 1, 1, NULL, 'ER_API_1785854515', '2026-08-04', '2026-08-04', 'Module 9 API expense request', 1000.00, 3, 1, 1, '2026-08-04 14:42:03', 1, '2026-08-04 14:42:13', 'Approved by Module 9 test', 1, 1, '2026-08-04 20:12:00', '2026-08-04 20:12:13', NULL),
(7, 1, 1, 1, NULL, 'APR10_1785855886', '2026-08-04', '2026-08-04', 'Module 10 standalone approval test', 750.00, 2, 1, 1, '2026-08-04 15:04:47', NULL, NULL, NULL, 1, 1, '2026-08-04 20:34:46', '2026-08-04 20:34:47', NULL),
(8, 1, 1, 1, NULL, 'APR10_1785856318', '2026-08-04', '2026-08-04', 'Module 10 standalone approval test', 750.00, 3, 1, 1, '2026-08-04 15:11:59', 1, '2026-08-04 15:12:06', 'Approved through Module 10 approval centre', 1, 1, '2026-08-04 20:41:58', '2026-08-04 20:42:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_requests_status_masters`
--

CREATE TABLE `expense_requests_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_requests_status_masters`
--

INSERT INTO `expense_requests_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'PARTIALLY_USED', 'Partially Used', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'FULLY_USED', 'Fully Used', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(6, 'REJECTED', 'Rejected', 6, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `expense_request_items`
--

CREATE TABLE `expense_request_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `expense_category_id` bigint(20) UNSIGNED NOT NULL,
  `budget_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `quantity` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `estimated_rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `estimated_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `approved_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_request_items`
--

INSERT INTO `expense_request_items` (`id`, `company_id`, `project_id`, `request_id`, `expense_category_id`, `budget_line_id`, `description`, `quantity`, `estimated_rate`, `estimated_amount`, `approved_amount`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'Safety consumables and minor site tools', 1.0000, 11800.0000, 11800.00, 11800.00, NULL, NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(2, 1, 1, 2, 10, 8, 'API test site expense', 2.0000, 500.0000, 1000.00, 1000.00, 'Module 9 complete test', 1, 1, '2026-08-04 19:43:08', '2026-08-04 19:43:10', NULL),
(3, 1, 1, 3, 11, 8, 'API test site expense', 2.0000, 500.0000, 1000.00, 1000.00, 'Module 9 complete test', 1, 1, '2026-08-04 19:48:05', '2026-08-04 19:48:07', NULL),
(4, 1, 1, 4, 12, 8, 'API test site expense', 2.0000, 500.0000, 1000.00, 1000.00, 'Module 9 complete test', 1, 1, '2026-08-04 19:50:26', '2026-08-04 19:50:28', NULL),
(5, 1, 1, 5, 13, 8, 'API test site expense', 2.0000, 500.0000, 1000.00, 1000.00, 'Module 9 complete test', 1, 1, '2026-08-04 20:04:28', '2026-08-04 20:04:30', NULL),
(6, 1, 1, 6, 14, 8, 'API test site expense', 2.0000, 500.0000, 1000.00, 1000.00, 'Module 9 complete test', 1, 1, '2026-08-04 20:12:01', '2026-08-04 20:12:13', NULL),
(7, 1, 1, 7, 1, NULL, 'Module 10 approval line', 1.0000, 750.0000, 750.00, 0.00, 'Standalone approval test', 1, 1, '2026-08-04 20:34:47', '2026-08-04 20:34:47', NULL),
(8, 1, 1, 8, 1, NULL, 'Module 10 approval line', 1.0000, 750.0000, 750.00, 750.00, 'Standalone approval test', 1, 1, '2026-08-04 20:41:58', '2026-08-04 20:42:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expense_status_logs`
--

CREATE TABLE `expense_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_id` bigint(20) UNSIGNED NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) NOT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_status_logs`
--

INSERT INTO `expense_status_logs` (`id`, `company_id`, `entity_type_id`, `entity_id`, `old_status`, `new_status`, `changed_by`, `changed_at`, `remarks`) VALUES
(1, 1, 1, 1, 'SUBMITTED', 'APPROVED', NULL, '2026-07-23 21:02:42', 'Approved for purchase.'),
(2, 1, 2, 1, 'APPROVED', 'POSTED', NULL, '2026-07-23 21:02:42', 'Posted to project actual cost.'),
(3, 1, 1, 2, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:13:09', 'Submitted by Module 9 test'),
(4, 1, 1, 2, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:13:10', 'Approved by Module 9 test'),
(5, 1, 2, 2, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:13:13', 'Submitted by Module 9 test'),
(6, 1, 2, 2, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:13:13', 'Approved by Module 9 test'),
(7, 1, 2, 2, 'APPROVED', 'POSTED', 1, '2026-08-04 14:13:14', 'Posted by Module 9 test'),
(8, 1, 3, 2, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:13:16', 'Submitted by Module 9 test'),
(9, 1, 3, 2, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:13:16', 'Approved by Module 9 test'),
(10, 1, 3, 2, 'APPROVED', 'PAID', 1, '2026-08-04 14:13:17', 'Paid by Module 9 test'),
(11, 1, 1, 3, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:18:07', 'Submitted by Module 9 test'),
(12, 1, 1, 3, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:18:07', 'Approved by Module 9 test'),
(13, 1, 2, 3, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:18:11', 'Submitted by Module 9 test'),
(14, 1, 2, 3, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:18:12', 'Approved by Module 9 test'),
(15, 1, 2, 3, 'APPROVED', 'POSTED', 1, '2026-08-04 14:18:12', 'Posted by Module 9 test'),
(16, 1, 3, 3, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:18:14', 'Submitted by Module 9 test'),
(17, 1, 3, 3, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:18:14', 'Approved by Module 9 test'),
(18, 1, 3, 3, 'APPROVED', 'PAID', 1, '2026-08-04 14:18:15', 'Paid by Module 9 test'),
(19, 1, 1, 4, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:20:27', 'Submitted by Module 9 test'),
(20, 1, 1, 4, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:20:28', 'Approved by Module 9 test'),
(21, 1, 2, 4, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:20:31', 'Submitted by Module 9 test'),
(22, 1, 2, 4, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:20:31', 'Approved by Module 9 test'),
(23, 1, 2, 4, 'APPROVED', 'POSTED', 1, '2026-08-04 14:20:32', 'Posted by Module 9 test'),
(24, 1, 3, 4, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:20:34', 'Submitted by Module 9 test'),
(25, 1, 3, 4, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:20:34', 'Approved by Module 9 test'),
(26, 1, 3, 4, 'APPROVED', 'PAID', 1, '2026-08-04 14:20:34', 'Paid by Module 9 test'),
(27, 1, 1, 5, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:34:29', 'Submitted by Module 9 test'),
(28, 1, 1, 5, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:34:30', 'Approved by Module 9 test'),
(29, 1, 2, 5, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:34:34', 'Submitted by Module 9 test'),
(30, 1, 2, 5, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:34:34', 'Approved by Module 9 test'),
(31, 1, 2, 5, 'APPROVED', 'POSTED', 1, '2026-08-04 14:34:34', 'Posted by Module 9 test'),
(32, 1, 3, 5, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:34:37', 'Submitted by Module 9 test'),
(33, 1, 3, 5, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:34:37', 'Approved by Module 9 test'),
(34, 1, 3, 5, 'APPROVED', 'PAID', 1, '2026-08-04 14:34:37', 'Paid by Module 9 test'),
(35, 1, 1, 6, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:42:03', 'Submitted by Module 9 test'),
(36, 1, 1, 6, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:42:13', 'Approved by Module 9 test'),
(37, 1, 2, 6, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:42:22', 'Submitted by Module 9 test'),
(38, 1, 2, 6, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:42:28', 'Approved by Module 9 test'),
(39, 1, 2, 6, 'APPROVED', 'POSTED', 1, '2026-08-04 14:42:35', 'Posted by Module 9 test'),
(40, 1, 3, 6, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 14:42:43', 'Submitted by Module 9 test'),
(41, 1, 3, 6, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 14:42:50', 'Approved by Module 9 test'),
(42, 1, 3, 6, 'APPROVED', 'PAID', 1, '2026-08-04 14:42:57', 'Paid by Module 9 test'),
(43, 1, 1, 7, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 15:04:47', 'Submitted for Module 10 test'),
(44, 1, 1, 8, 'DRAFT', 'SUBMITTED', 1, '2026-08-04 15:11:59', 'Submitted for Module 10 test'),
(45, 1, 1, 8, 'SUBMITTED', 'APPROVED', 1, '2026-08-04 15:12:06', 'Approved through Module 10 approval centre');

-- --------------------------------------------------------

--
-- Table structure for table `expense_status_logs_entity_type_masters`
--

CREATE TABLE `expense_status_logs_entity_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_code` varchar(60) NOT NULL,
  `entity_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_status_logs_entity_type_masters`
--

INSERT INTO `expense_status_logs_entity_type_masters` (`id`, `entity_type_code`, `entity_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'REQUEST', 'Request', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'BILL', 'Bill', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'PAYMENT', 'Payment', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'PETTY_CASH', 'Petty Cash', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `financial_years`
--

CREATE TABLE `financial_years` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `year_code` varchar(20) NOT NULL,
  `year_name` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `closed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `active_year` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED,
  `current_year_marker` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null and `is_current` = 1,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `financial_years`
--

INSERT INTO `financial_years` (`id`, `company_id`, `year_code`, `year_name`, `start_date`, `end_date`, `status_id`, `is_current`, `closed_by`, `closed_at`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, '2026-27', 'Financial Year 2026-27', '2026-04-01', '2027-03-31', 2, 1, NULL, NULL, 1, NULL, 1, '2026-07-23 14:29:28', '2026-07-26 16:51:33', NULL),
(2, 1, '2027-28', 'Financial Year 2027-2028', '2027-04-01', '2028-03-31', 3, 0, 1, '2026-07-26 16:51:56', 1, 1, 1, '2026-07-26 16:48:10', '2026-07-26 16:52:48', '2026-07-26 16:52:48');

-- --------------------------------------------------------

--
-- Table structure for table `financial_years_status_masters`
--

CREATE TABLE `financial_years_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `financial_years_status_masters`
--

INSERT INTO `financial_years_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'OPEN', 'Open', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'CLOSED', 'Closed', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'LOCKED', 'Locked', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `gst_registration_types`
--

CREATE TABLE `gst_registration_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gst_registration_types`
--

INSERT INTO `gst_registration_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'REGULAR', 'Regular', NULL, 1, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(2, 'COMPOSITION', 'Composition', NULL, 2, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(3, 'UNREGISTERED', 'Unregistered', NULL, 3, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(4, 'CONSUMER', 'Consumer', NULL, 4, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(5, 'SEZ', 'Special Economic Zone', NULL, 5, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09'),
(6, 'OVERSEAS', 'Overseas', NULL, 6, 1, '2026-07-26 16:53:09', '2026-07-26 16:53:09');

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance_batches`
--

CREATE TABLE `labour_attendance_batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `attendance_date` date NOT NULL,
  `shift_code` varchar(30) NOT NULL DEFAULT 'GENERAL',
  `prepared_by` bigint(20) UNSIGNED DEFAULT NULL,
  `prepared_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `total_workers` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `present_workers` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `absent_workers` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_regular_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_overtime_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_attendance_batches`
--

INSERT INTO `labour_attendance_batches` (`id`, `company_id`, `project_id`, `site_id`, `attendance_date`, `shift_code`, `prepared_by`, `prepared_at`, `approved_by`, `approved_at`, `status_id`, `total_workers`, `present_workers`, `absent_workers`, `total_regular_hours`, `total_overtime_hours`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-07-23', 'GENERAL', NULL, '2026-07-23 20:40:09', NULL, '2026-07-23 20:40:09', 3, 3, 2, 1, 16.00, 3.00, 'Approved expo sample attendance.', NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09'),
(2, 1, 1, 1, '2026-08-02', 'TEST_1613023321', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0.00, 0.00, 'Module 5 API test', 1, 1, '2026-08-03 12:25:13', '2026-08-03 12:25:13'),
(3, 1, 1, 1, '2026-08-04', 'T1665132475', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0.00, 0.00, 'Module 5 attendance test', 1, 1, '2026-08-04 07:58:42', '2026-08-04 07:58:42'),
(4, 1, 1, 1, '2026-08-04', 'T1775528188', 1, '2026-08-04 08:04:40', 1, '2026-08-04 08:04:40', 5, 1, 1, 0, 8.00, 2.00, 'Corrected and resubmitted', 1, 1, '2026-08-04 08:04:34', '2026-08-04 08:04:41');

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance_batches_status_masters`
--

CREATE TABLE `labour_attendance_batches_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_attendance_batches_status_masters`
--

INSERT INTO `labour_attendance_batches_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'LOCKED', 'Locked', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance_entries`
--

CREATE TABLE `labour_attendance_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `worker_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `attendance_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `regular_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `work_description` varchar(500) DEFAULT NULL,
  `attendance_source_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `selfie_path` varchar(500) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_attendance_entries`
--

INSERT INTO `labour_attendance_entries` (`id`, `company_id`, `batch_id`, `assignment_id`, `worker_id`, `zone_id`, `attendance_status_id`, `check_in_time`, `check_out_time`, `regular_hours`, `overtime_hours`, `work_description`, `attendance_source_id`, `latitude`, `longitude`, `selfie_path`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, '08:00:00', '18:00:00', 8.00, 2.00, 'Block masonry work', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09'),
(2, 1, 1, 2, 2, 1, 1, '08:05:00', '17:00:00', 8.00, 1.00, 'Masonry material handling', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09'),
(3, 1, 1, 3, 3, 1, 2, NULL, NULL, 0.00, 0.00, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09'),
(4, 1, 4, 6, 6, NULL, 1, '08:00:00', '18:00:00', 8.00, 2.00, 'Module 5 API test work', 1, NULL, NULL, NULL, 'Attendance entry updated', 1, 1, '2026-08-04 08:04:36', '2026-08-04 08:04:37');

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance_entries_attendance_source_masters`
--

CREATE TABLE `labour_attendance_entries_attendance_source_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_source_code` varchar(60) NOT NULL,
  `attendance_source_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_attendance_entries_attendance_source_masters`
--

INSERT INTO `labour_attendance_entries_attendance_source_masters` (`id`, `attendance_source_code`, `attendance_source_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MANUAL', 'Manual', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'BIOMETRIC', 'Biometric', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'MOBILE', 'Mobile', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'IMPORT', 'Import', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_attendance_entries_attendance_status_masters`
--

CREATE TABLE `labour_attendance_entries_attendance_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `attendance_status_code` varchar(60) NOT NULL,
  `attendance_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_attendance_entries_attendance_status_masters`
--

INSERT INTO `labour_attendance_entries_attendance_status_masters` (`id`, `attendance_status_code`, `attendance_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PRESENT', 'Present', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'ABSENT', 'Absent', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'HALF_DAY', 'Half Day', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'PAID_LEAVE', 'Paid Leave', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'UNPAID_LEAVE', 'Unpaid Leave', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(6, 'WEEKLY_OFF', 'Weekly Off', 6, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(7, 'HOLIDAY', 'Holiday', 7, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_categories`
--

CREATE TABLE `labour_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `category_code` varchar(30) NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `skill_level_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `wage_basis_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `default_wage_rate` decimal(15,2) DEFAULT NULL,
  `overtime_multiplier` decimal(6,3) NOT NULL DEFAULT 1.500,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_categories`
--

INSERT INTO `labour_categories` (`id`, `company_id`, `category_code`, `category_name`, `skill_level_id`, `wage_basis_id`, `default_wage_rate`, `overtime_multiplier`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'HELPER', 'General Helper', 1, 1, 700.00, 1.500, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, 'MASON', 'Mason', 3, 1, 1200.00, 1.500, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, 'CARPENTER', 'Carpenter', 3, 1, 1300.00, 1.500, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, 'BAR-BENDER', 'Bar Bender', 3, 1, 1250.00, 1.500, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, 'ELECTRICIAN', 'Electrician', 3, 1, 1400.00, 1.500, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, 'PLUMBER', 'Plumber', 3, 1, 1350.00, 1.500, NULL, 60, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, 'PAINTER', 'Painter', 3, 1, 1100.00, 1.500, NULL, 70, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(8, 1, 'SUPERVISOR', 'Site Supervisor', 5, 3, 30000.00, 1.000, NULL, 80, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(9, 1, 'CAT_1613023321', 'API Test Skilled Labour', 3, 1, 1200.00, 1.500, NULL, 999, 1, 1, 1, '2026-08-03 12:25:07', '2026-08-03 12:25:07', NULL),
(10, 1, 'LCAT_1665132475', 'API Test Labour Updated 1665132475', 1, 1, 1250.00, 1.500, 'Module 5 test', 999, 1, 1, 1, '2026-08-04 07:58:36', '2026-08-04 07:58:37', NULL),
(11, 1, 'LCAT_1775528188', 'API Test Labour Updated 1775528188', 1, 1, 1250.00, 1.500, 'Module 5 test', 999, 1, 1, 1, '2026-08-04 08:04:21', '2026-08-04 08:04:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_categories_skill_level_masters`
--

CREATE TABLE `labour_categories_skill_level_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `skill_level_code` varchar(60) NOT NULL,
  `skill_level_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_categories_skill_level_masters`
--

INSERT INTO `labour_categories_skill_level_masters` (`id`, `skill_level_code`, `skill_level_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UNSKILLED', 'Unskilled', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'SEMI_SKILLED', 'Semi Skilled', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'SKILLED', 'Skilled', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'HIGHLY_SKILLED', 'Highly Skilled', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(5, 'SUPERVISORY', 'Supervisory', 5, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_categories_wage_basis_masters`
--

CREATE TABLE `labour_categories_wage_basis_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `wage_basis_code` varchar(60) NOT NULL,
  `wage_basis_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_categories_wage_basis_masters`
--

INSERT INTO `labour_categories_wage_basis_masters` (`id`, `wage_basis_code`, `wage_basis_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DAILY', 'Daily', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'HOURLY', 'Hourly', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'MONTHLY', 'Monthly', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(4, 'PIECE_RATE', 'Piece Rate', 4, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_contractors`
--

CREATE TABLE `labour_contractors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `subcontractor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `contractor_code` varchar(30) NOT NULL,
  `contractor_name` varchar(160) NOT NULL,
  `contact_person` varchar(120) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `alternate_phone` varchar(25) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(12) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `bank_account_name` varchar(150) DEFAULT NULL,
  `bank_account_no` varchar(40) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `payment_terms_days` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_contractors`
--

INSERT INTO `labour_contractors` (`id`, `company_id`, `subcontractor_id`, `contractor_code`, `contractor_name`, `contact_person`, `phone`, `alternate_phone`, `email`, `gstin`, `pan`, `address_line1`, `address_line2`, `city`, `district`, `state_name`, `postal_code`, `bank_name`, `bank_account_name`, `bank_account_no`, `bank_ifsc`, `payment_terms_days`, `status_id`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'LC-001', 'Sri Murugan Labour Services', 'R. Murugan', '9876543210', NULL, NULL, NULL, NULL, NULL, NULL, 'Coimbatore', NULL, 'Tamil Nadu', NULL, NULL, NULL, NULL, NULL, 7, 1, 'Sample contractor for expo demonstration.', NULL, NULL, '2026-07-23 20:40:09', '2026-08-04 17:57:35', NULL),
(2, 1, NULL, 'LC_1613023321', 'API Test Labour Contractor', 'Test Manager', '9876543210', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, 1, NULL, 1, 1, '2026-08-03 12:25:10', '2026-08-03 12:25:10', NULL),
(3, 1, NULL, 'LCTR_1665132475', 'API Contractor 1665132475', 'Test Manager', '9876543210', NULL, 'labour1665132475@test.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, 1, NULL, 1, 1, '2026-08-04 07:58:37', '2026-08-04 07:58:37', NULL),
(4, 1, NULL, 'LCTR_1775528188', 'API Contractor 1775528188', 'Test Manager', '9876543210', NULL, 'labour1775528188@test.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, 1, NULL, 1, 1, '2026-08-04 08:04:24', '2026-08-04 08:04:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_contractors_status_masters`
--

CREATE TABLE `labour_contractors_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_contractors_status_masters`
--

INSERT INTO `labour_contractors_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ACTIVE', 'Active', 1, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(2, 'INACTIVE', 'Inactive', 2, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44'),
(3, 'BLACKLISTED', 'Blacklisted', 3, 1, '2026-07-26 12:38:44', '2026-07-26 12:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `labour_payments`
--

CREATE TABLE `labour_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `wage_period_id` bigint(20) UNSIGNED NOT NULL,
  `wage_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `worker_id` bigint(20) UNSIGNED DEFAULT NULL,
  `contractor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_no` varchar(40) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `reference_no` varchar(100) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `recipient_name` varchar(150) NOT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `paid_by` bigint(20) UNSIGNED DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_payments`
--

INSERT INTO `labour_payments` (`id`, `company_id`, `wage_period_id`, `wage_line_id`, `worker_id`, `contractor_id`, `payment_no`, `payment_date`, `payment_mode_id`, `reference_no`, `amount`, `recipient_name`, `status_id`, `approved_by`, `approved_at`, `paid_by`, `paid_at`, `receipt_path`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 1, 6, NULL, 'PAY_1775528188', '2026-08-04', 1, NULL, 1700.00, 'API Worker 1775528188', 4, 1, '2026-08-04 08:04:49', 1, '2026-08-04 08:04:50', NULL, 'Module 5 payment test', 1, 1, '2026-08-04 08:04:47', '2026-08-04 08:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `labour_payments_payment_mode_masters`
--

CREATE TABLE `labour_payments_payment_mode_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_mode_code` varchar(60) NOT NULL,
  `payment_mode_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_payments_payment_mode_masters`
--

INSERT INTO `labour_payments_payment_mode_masters` (`id`, `payment_mode_code`, `payment_mode_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CASH', 'Cash', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'BANK_TRANSFER', 'Bank Transfer', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'UPI', 'Upi', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'CHEQUE', 'Cheque', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'OTHER', 'Other', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_payments_status_masters`
--

CREATE TABLE `labour_payments_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_payments_status_masters`
--

INSERT INTO `labour_payments_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PAID', 'Paid', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_project_assignments`
--

CREATE TABLE `labour_project_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `worker_id` bigint(20) UNSIGNED NOT NULL,
  `labour_category_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_from` date NOT NULL,
  `assigned_until` date DEFAULT NULL,
  `wage_basis_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `agreed_wage_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `overtime_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shift_name` varchar(60) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_project_assignments`
--

INSERT INTO `labour_project_assignments` (`id`, `company_id`, `project_id`, `site_id`, `zone_id`, `worker_id`, `labour_category_id`, `assigned_from`, `assigned_until`, `wage_basis_id`, `agreed_wage_rate`, `overtime_rate`, `shift_name`, `status_id`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 2, '2026-07-23', NULL, 1, 950.00, 150.00, 'General Shift', 2, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(2, 1, 1, 1, 1, 2, 1, '2026-07-23', NULL, 1, 700.00, 110.00, 'General Shift', 2, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(3, 1, 1, 1, 1, 3, 1, '2026-07-23', NULL, 1, 750.00, 120.00, 'General Shift', 2, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(4, 1, 1, 1, 1, 4, 9, '2026-08-01', NULL, 1, 1200.00, 200.00, 'GENERAL', 2, NULL, 1, 1, '2026-08-03 12:25:12', '2026-08-03 12:25:12', NULL),
(5, 1, 1, 1, NULL, 5, 10, '2026-08-04', NULL, 1, 1200.00, 200.00, 'GENERAL', 2, 'Module 5 test assignment', 1, 1, '2026-08-04 07:58:41', '2026-08-04 07:58:41', NULL),
(6, 1, 1, 1, NULL, 6, 11, '2026-08-04', NULL, 1, 1200.00, 200.00, 'GENERAL', 2, 'Module 5 test assignment', 1, 1, '2026-08-04 08:04:32', '2026-08-04 08:04:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_project_assignments_status_masters`
--

CREATE TABLE `labour_project_assignments_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_project_assignments_status_masters`
--

INSERT INTO `labour_project_assignments_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'ACTIVE', 'Active', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'COMPLETED', 'Completed', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'CANCELLED', 'Cancelled', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_project_assignments_wage_basis_masters`
--

CREATE TABLE `labour_project_assignments_wage_basis_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `wage_basis_code` varchar(60) NOT NULL,
  `wage_basis_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_project_assignments_wage_basis_masters`
--

INSERT INTO `labour_project_assignments_wage_basis_masters` (`id`, `wage_basis_code`, `wage_basis_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DAILY', 'Daily', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'HOURLY', 'Hourly', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'MONTHLY', 'Monthly', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PIECE_RATE', 'Piece Rate', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_status_logs`
--

CREATE TABLE `labour_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_id` bigint(20) UNSIGNED NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(40) DEFAULT NULL,
  `new_status` varchar(40) NOT NULL,
  `action_code` varchar(50) NOT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_status_logs`
--

INSERT INTO `labour_status_logs` (`id`, `company_id`, `entity_type_id`, `entity_id`, `old_status`, `new_status`, `action_code`, `remarks`, `changed_by`, `changed_at`) VALUES
(1, 1, 4, 1, 'SUBMITTED', 'APPROVED', 'ATTENDANCE_APPROVED', 'Sample attendance approved for expo.', NULL, '2026-07-23 20:40:09'),
(2, 1, 4, 4, 'DRAFT', 'SUBMITTED', 'SUBMIT', 'Submitted for test', 1, '2026-08-04 08:04:38'),
(3, 1, 4, 4, 'SUBMITTED', 'REJECTED', 'REJECT', 'Reject lifecycle test', 1, '2026-08-04 08:04:39'),
(4, 1, 4, 4, 'REJECTED', 'SUBMITTED', 'SUBMIT', 'Corrected and resubmitted', 1, '2026-08-04 08:04:40'),
(5, 1, 4, 4, 'SUBMITTED', 'APPROVED', 'APPROVE', NULL, 1, '2026-08-04 08:04:40'),
(6, 1, 4, 4, 'APPROVED', 'LOCKED', 'LOCK', NULL, 1, '2026-08-04 08:04:41'),
(7, 1, 5, 3, 'CALCULATED', 'SUBMITTED', 'SUBMIT', NULL, 1, '2026-08-04 08:04:46'),
(8, 1, 5, 3, 'SUBMITTED', 'APPROVED', 'APPROVE', NULL, 1, '2026-08-04 08:04:47'),
(9, 1, 6, 1, 'DRAFT', 'SUBMITTED', 'SUBMITTED', NULL, 1, '2026-08-04 08:04:49'),
(10, 1, 6, 1, 'SUBMITTED', 'APPROVED', 'APPROVED', NULL, 1, '2026-08-04 08:04:49'),
(11, 1, 6, 1, 'APPROVED', 'PAID', 'PAID', NULL, 1, '2026-08-04 08:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `labour_status_logs_entity_type_masters`
--

CREATE TABLE `labour_status_logs_entity_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_code` varchar(60) NOT NULL,
  `entity_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_status_logs_entity_type_masters`
--

INSERT INTO `labour_status_logs_entity_type_masters` (`id`, `entity_type_code`, `entity_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CONTRACTOR', 'Contractor', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'WORKER', 'Worker', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'ASSIGNMENT', 'Assignment', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'ATTENDANCE', 'Attendance', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'WAGE_PERIOD', 'Wage Period', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'PAYMENT', 'Payment', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_wage_lines`
--

CREATE TABLE `labour_wage_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `wage_period_id` bigint(20) UNSIGNED NOT NULL,
  `worker_id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `payable_days` decimal(8,2) NOT NULL DEFAULT 0.00,
  `regular_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `overtime_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `wage_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `regular_wage` decimal(18,2) NOT NULL DEFAULT 0.00,
  `overtime_wage` decimal(18,2) NOT NULL DEFAULT 0.00,
  `allowance_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `incentive_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `advance_deduction` decimal(18,2) NOT NULL DEFAULT 0.00,
  `other_deduction` decimal(18,2) NOT NULL DEFAULT 0.00,
  `gross_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `payment_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_wage_lines`
--

INSERT INTO `labour_wage_lines` (`id`, `company_id`, `wage_period_id`, `worker_id`, `assignment_id`, `payable_days`, `regular_hours`, `overtime_hours`, `wage_rate`, `regular_wage`, `overtime_wage`, `allowance_amount`, `incentive_amount`, `advance_deduction`, `other_deduction`, `gross_amount`, `net_amount`, `payment_status_id`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 6, 6, 1.00, 8.00, 2.00, 1200.00, 1200.00, 400.00, 100.00, 0.00, 0.00, 0.00, 1700.00, 1700.00, 3, 'API test allowance', 1, 1, '2026-08-04 13:34:44', '2026-08-04 13:34:50');

-- --------------------------------------------------------

--
-- Table structure for table `labour_wage_lines_payment_status_masters`
--

CREATE TABLE `labour_wage_lines_payment_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_status_code` varchar(60) NOT NULL,
  `payment_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_wage_lines_payment_status_masters`
--

INSERT INTO `labour_wage_lines_payment_status_masters` (`id`, `payment_status_code`, `payment_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UNPAID', 'Unpaid', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'PARTIALLY_PAID', 'Partially Paid', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'PAID', 'Paid', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'ON_HOLD', 'On Hold', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_wage_periods`
--

CREATE TABLE `labour_wage_periods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `period_code` varchar(40) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `contractor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `gross_wages` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_additions` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(18,2) NOT NULL DEFAULT 0.00,
  `net_payable` decimal(18,2) NOT NULL DEFAULT 0.00,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_wage_periods`
--

INSERT INTO `labour_wage_periods` (`id`, `company_id`, `project_id`, `site_id`, `period_code`, `period_start`, `period_end`, `contractor_id`, `status_id`, `gross_wages`, `total_additions`, `total_deductions`, `net_payable`, `approved_by`, `approved_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'WP_1613023321', '2026-08-02', '2026-08-02', 2, 1, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, 1, 1, '2026-08-03 12:25:15', '2026-08-03 12:25:15'),
(2, 1, 1, 1, 'WP_1665132475', '2026-08-04', '2026-08-04', 3, 1, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 'Module 5 wage test', 1, 1, '2026-08-04 07:58:46', '2026-08-04 07:58:46'),
(3, 1, 1, 1, 'WP_1775528188', '2026-08-04', '2026-08-04', 4, 6, 1600.00, 100.00, 0.00, 1700.00, 1, '2026-08-04 08:04:47', 'Module 5 wage test', 1, 1, '2026-08-04 08:04:42', '2026-08-04 13:34:50');

-- --------------------------------------------------------

--
-- Table structure for table `labour_wage_periods_status_masters`
--

CREATE TABLE `labour_wage_periods_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_wage_periods_status_masters`
--

INSERT INTO `labour_wage_periods_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'CALCULATED', 'Calculated', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'SUBMITTED', 'Submitted', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'PARTIALLY_PAID', 'Partially Paid', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'PAID', 'Paid', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers`
--

CREATE TABLE `labour_workers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `labour_category_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `worker_code` varchar(30) NOT NULL,
  `worker_name` varchar(150) NOT NULL,
  `employment_source_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `gender_id` bigint(20) UNSIGNED NOT NULL DEFAULT 4,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `emergency_contact_name` varchar(120) DEFAULT NULL,
  `emergency_contact_phone` varchar(25) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `native_place` varchar(150) DEFAULT NULL,
  `id_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 6,
  `id_number_masked` varchar(60) DEFAULT NULL,
  `date_joined` date NOT NULL,
  `date_left` date DEFAULT NULL,
  `wage_basis_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `base_wage_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `overtime_rate_per_hour` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bank_name` varchar(120) DEFAULT NULL,
  `bank_account_name` varchar(150) DEFAULT NULL,
  `bank_account_no_masked` varchar(40) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `safety_induction_date` date DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers`
--

INSERT INTO `labour_workers` (`id`, `company_id`, `labour_category_id`, `contractor_id`, `worker_code`, `worker_name`, `employment_source_id`, `gender_id`, `date_of_birth`, `phone`, `emergency_contact_name`, `emergency_contact_phone`, `blood_group`, `address`, `native_place`, `id_type_id`, `id_number_masked`, `date_joined`, `date_left`, `wage_basis_id`, `base_wage_rate`, `overtime_rate_per_hour`, `bank_name`, `bank_account_name`, `bank_account_no_masked`, `bank_ifsc`, `safety_induction_date`, `status_id`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 2, 1, 'LAB-0001', 'K. Selvam', 2, 1, NULL, '9000001001', 'K. Lakshmi', '9000001101', NULL, NULL, 'Erode', 6, NULL, '2026-07-23', NULL, 1, 950.00, 150.00, NULL, NULL, NULL, NULL, '2026-07-23', 1, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(2, 1, 1, 1, 'LAB-0002', 'P. Ravi', 2, 1, NULL, '9000001002', 'P. Meena', '9000001102', NULL, NULL, 'Tiruppur', 6, NULL, '2026-07-23', NULL, 1, 700.00, 110.00, NULL, NULL, NULL, NULL, '2026-07-23', 1, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(3, 1, 1, NULL, 'LAB-0003', 'S. Kavitha', 1, 2, NULL, '9000001003', 'S. Kumar', '9000001103', NULL, NULL, 'Coimbatore', 6, NULL, '2026-07-23', NULL, 1, 750.00, 120.00, NULL, NULL, NULL, NULL, '2026-07-23', 1, NULL, NULL, NULL, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(4, 1, 9, 2, 'LW_1613023321', 'API Test Worker', 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6, NULL, '2026-08-01', NULL, 1, 1200.00, 200.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, '2026-08-03 12:25:11', '2026-08-03 12:25:11', NULL),
(5, 1, 10, 3, 'LWRK_1665132475', 'API Worker 1665132475', 1, 1, NULL, '9000000000', NULL, NULL, NULL, NULL, NULL, 1, 'XXXX1665132475', '2026-08-04', NULL, 1, 1200.00, 200.00, NULL, NULL, NULL, NULL, NULL, 1, 'Updated by Module 5 test', 1, 1, '2026-08-04 07:58:38', '2026-08-04 07:58:39', NULL),
(6, 1, 11, 4, 'LWRK_1775528188', 'API Worker 1775528188', 1, 1, NULL, '9000000000', NULL, NULL, NULL, NULL, NULL, 1, 'XXXX1775528188', '2026-08-04', NULL, 1, 1200.00, 200.00, NULL, NULL, NULL, NULL, NULL, 1, 'Updated by Module 5 test', 1, 1, '2026-08-04 08:04:26', '2026-08-04 08:04:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers_employment_source_masters`
--

CREATE TABLE `labour_workers_employment_source_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employment_source_code` varchar(60) NOT NULL,
  `employment_source_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers_employment_source_masters`
--

INSERT INTO `labour_workers_employment_source_masters` (`id`, `employment_source_code`, `employment_source_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DIRECT', 'Direct', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'CONTRACTOR', 'Contractor', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers_gender_masters`
--

CREATE TABLE `labour_workers_gender_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gender_code` varchar(60) NOT NULL,
  `gender_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers_gender_masters`
--

INSERT INTO `labour_workers_gender_masters` (`id`, `gender_code`, `gender_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MALE', 'Male', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'FEMALE', 'Female', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'OTHER', 'Other', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'NOT_SPECIFIED', 'Not Specified', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers_id_type_masters`
--

CREATE TABLE `labour_workers_id_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_type_code` varchar(60) NOT NULL,
  `id_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers_id_type_masters`
--

INSERT INTO `labour_workers_id_type_masters` (`id`, `id_type_code`, `id_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'AADHAAR', 'Aadhaar', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'VOTER_ID', 'Voter Id', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'DRIVING_LICENCE', 'Driving Licence', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PASSPORT', 'Passport', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'OTHER', 'Other', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'NOT_PROVIDED', 'Not Provided', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers_status_masters`
--

CREATE TABLE `labour_workers_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers_status_masters`
--

INSERT INTO `labour_workers_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ACTIVE', 'Active', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'INACTIVE', 'Inactive', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'LEFT', 'Left', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'SUSPENDED', 'Suspended', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_workers_wage_basis_masters`
--

CREATE TABLE `labour_workers_wage_basis_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `wage_basis_code` varchar(60) NOT NULL,
  `wage_basis_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_workers_wage_basis_masters`
--

INSERT INTO `labour_workers_wage_basis_masters` (`id`, `wage_basis_code`, `wage_basis_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DAILY', 'Daily', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'HOURLY', 'Hourly', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'MONTHLY', 'Monthly', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PIECE_RATE', 'Piece Rate', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `labour_worker_documents`
--

CREATE TABLE `labour_worker_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `worker_id` bigint(20) UNSIGNED NOT NULL,
  `document_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_name` varchar(160) NOT NULL,
  `document_number` varchar(80) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(500) NOT NULL,
  `verification_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_worker_documents`
--

INSERT INTO `labour_worker_documents` (`id`, `company_id`, `worker_id`, `document_type_id`, `document_name`, `document_number`, `issue_date`, `expiry_date`, `file_path`, `verification_status_id`, `verified_by`, `verified_at`, `remarks`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 4, NULL, 'API Test Aadhaar', 'XXXX-XXXX-1234', NULL, NULL, 'uploads/labour/test-aadhaar.pdf', 2, 1, '2026-08-03 12:25:12', 'Verified by API test', 1, '2026-08-03 12:25:11', '2026-08-03 12:25:12', NULL),
(2, 1, 5, NULL, 'API Identity Document', 'DOC-1665132475', NULL, NULL, 'uploads/labour/test-document-1665132475.pdf', 1, 1, '2026-08-04 07:58:40', 'Verified by Module 5 test', 1, '2026-08-04 07:58:40', '2026-08-04 07:58:40', NULL),
(3, 1, 6, NULL, 'API Identity Document', 'DOC-1775528188', NULL, NULL, 'uploads/labour/test-document-1775528188.pdf', 1, 1, '2026-08-04 08:04:31', 'Verified by Module 5 test', 1, '2026-08-04 08:04:29', '2026-08-04 08:04:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `labour_worker_documents_verification_status_masters`
--

CREATE TABLE `labour_worker_documents_verification_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `verification_status_code` varchar(60) NOT NULL,
  `verification_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `labour_worker_documents_verification_status_masters`
--

INSERT INTO `labour_worker_documents_verification_status_masters` (`id`, `verification_status_code`, `verification_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PENDING', 'Pending', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'VERIFIED', 'Verified', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'REJECTED', 'Rejected', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'EXPIRED', 'Expired', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `management_review_notes`
--

CREATE TABLE `management_review_notes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `review_date` date NOT NULL,
  `review_type_id` bigint(20) UNSIGNED NOT NULL,
  `subject` varchar(180) NOT NULL,
  `observations` text NOT NULL,
  `decisions` text DEFAULT NULL,
  `action_required` text DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `priority_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `completed_at` datetime DEFAULT NULL,
  `completed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `management_review_notes`
--

INSERT INTO `management_review_notes` (`id`, `company_id`, `project_id`, `site_id`, `review_date`, `review_type_id`, `subject`, `observations`, `decisions`, `action_required`, `assigned_to`, `target_date`, `priority_id`, `status_id`, `completed_at`, `completed_by`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, NULL, '2026-08-04', 1, 'Module 11 Review 1785857644', 'Dashboard and report verification', 'Complete all Module 11 checks', 'Verify report results', NULL, '2026-08-04', 3, 3, '2026-08-04 15:34:08', 1, 1, 1, '2026-08-04 21:04:07', '2026-08-04 21:04:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `management_review_notes_priority_masters`
--

CREATE TABLE `management_review_notes_priority_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `priority_code` varchar(60) NOT NULL,
  `priority_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `management_review_notes_priority_masters`
--

INSERT INTO `management_review_notes_priority_masters` (`id`, `priority_code`, `priority_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'LOW', 'Low', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'MEDIUM', 'Medium', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'HIGH', 'High', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'CRITICAL', 'Critical', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `management_review_notes_review_type_masters`
--

CREATE TABLE `management_review_notes_review_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `review_type_code` varchar(60) NOT NULL,
  `review_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `management_review_notes_review_type_masters`
--

INSERT INTO `management_review_notes_review_type_masters` (`id`, `review_type_code`, `review_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'WEEKLY_REVIEW', 'Weekly Review', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'MONTHLY_REVIEW', 'Monthly Review', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'COST_REVIEW', 'Cost Review', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PROGRESS_REVIEW', 'Progress Review', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'CLIENT_REVIEW', 'Client Review', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'OTHER', 'Other', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `management_review_notes_status_masters`
--

CREATE TABLE `management_review_notes_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `management_review_notes_status_masters`
--

INSERT INTO `management_review_notes_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'OPEN', 'Open', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'IN_PROGRESS', 'In Progress', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'COMPLETED', 'Completed', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'CANCELLED', 'Cancelled', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `material_category_id` bigint(20) UNSIGNED NOT NULL,
  `base_uom_id` bigint(20) UNSIGNED NOT NULL,
  `material_code` varchar(40) NOT NULL,
  `material_name` varchar(180) NOT NULL,
  `specification` varchar(500) DEFAULT NULL,
  `brand_preference` varchar(150) DEFAULT NULL,
  `hsn_code` varchar(20) DEFAULT NULL,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `standard_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `reorder_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `storage_location_hint` varchar(150) DEFAULT NULL,
  `quality_check_required` tinyint(1) NOT NULL DEFAULT 0,
  `batch_tracking_required` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`id`, `company_id`, `material_category_id`, `base_uom_id`, `material_code`, `material_name`, `specification`, `brand_preference`, `hsn_code`, `gst_rate`, `standard_rate`, `minimum_stock_qty`, `reorder_qty`, `storage_location_hint`, `quality_check_required`, `batch_tracking_required`, `is_active`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 8, 'MAT-CEM-001', 'OPC 53 Grade Cement', '50 kg bag; IS 12269 compliant', 'Approved make', '25232930', 28.0000, 390.00, 100.0000, 300.0000, NULL, 1, 0, 1, NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 2, 5, 'MAT-STEEL-001', 'TMT Reinforcement Steel Fe500D', '12 mm Fe500D TMT bar', 'Approved make', '72142090', 18.0000, 62.00, 1000.0000, 3000.0000, NULL, 1, 0, 1, NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(3, 1, 10, 8, 'MAT1785833367', 'API Test Material 1785833367', NULL, NULL, NULL, 18.0000, 100.00, 5.0000, 20.0000, NULL, 1, 0, 1, 'Updated by complete API test', 1, 1, '2026-08-04 08:49:29', '2026-08-04 08:49:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_categories`
--

CREATE TABLE `material_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_code` varchar(30) NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `storage_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `quality_check_required` tinyint(1) NOT NULL DEFAULT 0,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_categories`
--

INSERT INTO `material_categories` (`id`, `company_id`, `parent_id`, `category_code`, `category_name`, `storage_type_id`, `quality_check_required`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'CEMENT', 'Cement and Binders', 2, 1, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, NULL, 'STEEL', 'Reinforcement Steel', 3, 1, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, NULL, 'AGGREGATE', 'Aggregates', 3, 1, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, NULL, 'SAND', 'Sand', 3, 1, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, NULL, 'BRICK-BLOCK', 'Bricks and Blocks', 3, 1, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, NULL, 'ELECTRICAL', 'Electrical Materials', 4, 1, NULL, 60, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, NULL, 'PLUMBING', 'Plumbing Materials', 2, 1, NULL, 70, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(8, 1, NULL, 'FINISHING', 'Finishing Materials', 2, 1, NULL, 80, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(9, 1, NULL, 'SAFETY', 'Safety Materials', 4, 0, NULL, 90, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(10, 1, NULL, 'CAT1785833367', 'API Test Category 1785833367', 1, 1, NULL, 900, 1, 1, 1, '2026-08-04 08:49:28', '2026-08-04 08:49:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_categories_storage_type_masters`
--

CREATE TABLE `material_categories_storage_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `storage_type_code` varchar(60) NOT NULL,
  `storage_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_categories_storage_type_masters`
--

INSERT INTO `material_categories_storage_type_masters` (`id`, `storage_type_code`, `storage_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GENERAL', 'General', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'COVERED', 'Covered', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'OPEN_YARD', 'Open Yard', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'SECURE', 'Secure', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'HAZARDOUS', 'Hazardous', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'TEMPERATURE_CONTROLLED', 'Temperature Controlled', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `material_purchase_orders`
--

CREATE TABLE `material_purchase_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `po_no` varchar(40) NOT NULL,
  `po_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `delivery_address` varchar(500) DEFAULT NULL,
  `payment_terms` varchar(500) DEFAULT NULL,
  `freight_terms` varchar(300) DEFAULT NULL,
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `freight_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_purchase_orders`
--

INSERT INTO `material_purchase_orders` (`id`, `company_id`, `project_id`, `site_id`, `supplier_id`, `po_no`, `po_date`, `expected_delivery_date`, `delivery_address`, `payment_terms`, `freight_terms`, `subtotal`, `discount_amount`, `taxable_amount`, `tax_amount`, `freight_amount`, `round_off`, `grand_total`, `status_id`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `approval_remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'PO-EXPO-0001', '2026-07-23', '2026-07-25', NULL, '30 days from receipt', NULL, 505000.00, 0.00, 505000.00, 110400.00, 0.00, 0.00, 615400.00, 5, NULL, '2026-07-23 20:47:37', NULL, '2026-07-23 20:47:37', NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 1, 2, 'PO1785833367', '2026-08-04', NULL, NULL, NULL, NULL, 1000.00, 0.00, 1000.00, 180.00, 50.00, 0.00, 1230.00, 6, 1, '2026-08-04 08:49:35', 1, '2026-08-04 08:49:35', 'Approved by API test', 1, 1, '2026-08-04 08:49:34', '2026-08-04 14:19:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_purchase_orders_status_masters`
--

CREATE TABLE `material_purchase_orders_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_purchase_orders_status_masters`
--

INSERT INTO `material_purchase_orders_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'SENT', 'Sent', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'PARTIALLY_RECEIVED', 'Partially Received', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'RECEIVED', 'Received', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(7, 'REJECTED', 'Rejected', 7, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(8, 'CANCELLED', 'Cancelled', 8, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(9, 'CLOSED', 'Closed', 9, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `material_purchase_order_items`
--

CREATE TABLE `material_purchase_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `request_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `ordered_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `received_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `accepted_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `taxable_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `tax_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `specification` varchar(500) DEFAULT NULL,
  `item_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_purchase_order_items`
--

INSERT INTO `material_purchase_order_items` (`id`, `company_id`, `purchase_order_id`, `project_id`, `request_item_id`, `material_id`, `uom_id`, `ordered_qty`, `received_qty`, `accepted_qty`, `unit_rate`, `discount_percentage`, `taxable_amount`, `gst_rate`, `tax_amount`, `line_total`, `specification`, `item_status_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 8, 500.0000, 200.0000, 200.0000, 390.00, 0.0000, 195000.00, 28.0000, 54600.00, 249600.00, NULL, 2, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 1, 2, 2, 5, 5000.0000, 0.0000, 0.0000, 62.00, 0.0000, 310000.00, 18.0000, 55800.00, 365800.00, NULL, 1, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(3, 1, 2, 1, 3, 3, 8, 10.0000, 10.0000, 10.0000, 100.00, 0.0000, 1000.00, 18.0000, 180.00, 1180.00, NULL, 3, 1, 1, '2026-08-04 08:49:34', '2026-08-04 14:19:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_purchase_order_items_item_status_masters`
--

CREATE TABLE `material_purchase_order_items_item_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `item_status_code` varchar(60) NOT NULL,
  `item_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_purchase_order_items_item_status_masters`
--

INSERT INTO `material_purchase_order_items_item_status_masters` (`id`, `item_status_code`, `item_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'OPEN', 'Open', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'PARTIALLY_RECEIVED', 'Partially Received', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'RECEIVED', 'Received', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'CANCELLED', 'Cancelled', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `material_receipts`
--

CREATE TABLE `material_receipts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `receipt_no` varchar(40) NOT NULL,
  `receipt_date` date NOT NULL,
  `supplier_challan_no` varchar(60) DEFAULT NULL,
  `supplier_challan_date` date DEFAULT NULL,
  `vehicle_no` varchar(30) DEFAULT NULL,
  `invoice_no` varchar(60) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `received_by` bigint(20) UNSIGNED DEFAULT NULL,
  `inspected_by` bigint(20) UNSIGNED DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `posted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_receipts`
--

INSERT INTO `material_receipts` (`id`, `company_id`, `project_id`, `site_id`, `purchase_order_id`, `supplier_id`, `receipt_no`, `receipt_date`, `supplier_challan_no`, `supplier_challan_date`, `vehicle_no`, `invoice_no`, `invoice_date`, `received_by`, `inspected_by`, `status_id`, `posted_by`, `posted_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'GRN-EXPO-0001', '2026-07-23', 'CH-1001', NULL, 'TN 37 AB 1234', NULL, NULL, NULL, NULL, 6, NULL, '2026-07-23 20:47:37', '200 cement bags received and accepted.', NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 1, 2, 2, 'GRN1785833367', '2026-08-04', 'CH1785833367', NULL, NULL, NULL, NULL, 1, 1, 6, 1, '2026-08-04 08:49:46', NULL, 1, 1, '2026-08-04 08:49:36', '2026-08-04 14:19:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_receipts_status_masters`
--

CREATE TABLE `material_receipts_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_receipts_status_masters`
--

INSERT INTO `material_receipts_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(2, 'INSPECTION_PENDING', 'Inspection Pending', 2, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(3, 'ACCEPTED', 'Accepted', 3, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(4, 'PARTIALLY_ACCEPTED', 'Partially Accepted', 4, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(6, 'POSTED', 'Posted', 6, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:45', '2026-07-26 12:38:45');

-- --------------------------------------------------------

--
-- Table structure for table `material_receipt_items`
--

CREATE TABLE `material_receipt_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `receipt_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `received_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `accepted_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `rejected_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `accepted_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(60) DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `quality_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `storage_location` varchar(150) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_receipt_items`
--

INSERT INTO `material_receipt_items` (`id`, `company_id`, `receipt_id`, `project_id`, `purchase_order_item_id`, `material_id`, `uom_id`, `received_qty`, `accepted_qty`, `rejected_qty`, `unit_rate`, `accepted_value`, `batch_no`, `manufacture_date`, `expiry_date`, `quality_status_id`, `rejection_reason`, `storage_location`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 8, 200.0000, 200.0000, 0.0000, 390.00, 78000.00, 'CEM-EXPO-01', NULL, NULL, 3, NULL, 'Site Store A', NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 2, 1, 3, 3, 8, 10.0000, 10.0000, 0.0000, 100.00, 1000.00, NULL, NULL, NULL, 3, NULL, NULL, 1, 1, '2026-08-04 08:49:37', '2026-08-04 14:19:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_receipt_items_quality_status_masters`
--

CREATE TABLE `material_receipt_items_quality_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `quality_status_code` varchar(60) NOT NULL,
  `quality_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_receipt_items_quality_status_masters`
--

INSERT INTO `material_receipt_items_quality_status_masters` (`id`, `quality_status_code`, `quality_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NOT_REQUIRED', 'Not Required', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'PENDING', 'Pending', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'PASSED', 'Passed', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'FAILED', 'Failed', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'PARTIALLY_PASSED', 'Partially Passed', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_requests`
--

CREATE TABLE `material_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `request_no` varchar(40) NOT NULL,
  `request_date` date NOT NULL,
  `required_by_date` date DEFAULT NULL,
  `priority_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `purpose` varchar(500) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_requests`
--

INSERT INTO `material_requests` (`id`, `company_id`, `project_id`, `site_id`, `zone_id`, `request_no`, `request_date`, `required_by_date`, `priority_id`, `purpose`, `status_id`, `requested_by`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `approval_remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'MR-EXPO-0001', '2026-07-23', '2026-07-26', 3, 'Foundation and ground-floor structural work', 3, NULL, NULL, '2026-07-23 20:47:37', NULL, '2026-07-23 20:47:37', 'Approved sample request.', NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 1, NULL, 'MR1785833367', '2026-08-04', NULL, 2, 'Complete API test', 5, 1, 1, '2026-08-04 08:49:33', 1, '2026-08-04 08:49:33', 'Approved by API test', 1, 1, '2026-08-04 08:49:31', '2026-08-04 14:19:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_requests_priority_masters`
--

CREATE TABLE `material_requests_priority_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `priority_code` varchar(60) NOT NULL,
  `priority_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_requests_priority_masters`
--

INSERT INTO `material_requests_priority_masters` (`id`, `priority_code`, `priority_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'LOW', 'Low', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'NORMAL', 'Normal', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'HIGH', 'High', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'URGENT', 'Urgent', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_requests_status_masters`
--

CREATE TABLE `material_requests_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_requests_status_masters`
--

INSERT INTO `material_requests_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'PARTIALLY_ORDERED', 'Partially Ordered', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'ORDERED', 'Ordered', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'REJECTED', 'Rejected', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(8, 'CLOSED', 'Closed', 8, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_request_items`
--

CREATE TABLE `material_request_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `requested_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `approved_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `ordered_qty` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `estimated_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `estimated_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `item_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `specification_note` varchar(500) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_request_items`
--

INSERT INTO `material_request_items` (`id`, `company_id`, `request_id`, `project_id`, `material_id`, `uom_id`, `requested_qty`, `approved_qty`, `ordered_qty`, `estimated_rate`, `estimated_amount`, `item_status_id`, `specification_note`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 8, 500.0000, 500.0000, 500.0000, 390.00, 195000.00, 4, NULL, NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 1, 2, 5, 5000.0000, 5000.0000, 5000.0000, 62.00, 310000.00, 4, NULL, NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(3, 1, 2, 1, 3, 8, 10.0000, 10.0000, 10.0000, 100.00, 1000.00, 4, NULL, NULL, 1, 1, '2026-08-04 08:49:31', '2026-08-04 14:19:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_request_items_item_status_masters`
--

CREATE TABLE `material_request_items_item_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `item_status_code` varchar(60) NOT NULL,
  `item_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_request_items_item_status_masters`
--

INSERT INTO `material_request_items_item_status_masters` (`id`, `item_status_code`, `item_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PENDING', 'Pending', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'APPROVED', 'Approved', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'PARTIALLY_ORDERED', 'Partially Ordered', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'ORDERED', 'Ordered', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_suppliers`
--

CREATE TABLE `material_suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_code` varchar(30) NOT NULL,
  `supplier_name` varchar(180) NOT NULL,
  `contact_person` varchar(120) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `alternate_phone` varchar(25) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(12) DEFAULT NULL,
  `payment_terms_days` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `credit_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bank_name` varchar(120) DEFAULT NULL,
  `bank_account_name` varchar(150) DEFAULT NULL,
  `bank_account_no` varchar(40) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `rating` decimal(4,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_suppliers`
--

INSERT INTO `material_suppliers` (`id`, `company_id`, `supplier_code`, `supplier_name`, `contact_person`, `phone`, `alternate_phone`, `email`, `gstin`, `pan`, `address_line1`, `address_line2`, `city`, `state_name`, `postal_code`, `payment_terms_days`, `credit_limit`, `bank_name`, `bank_account_name`, `bank_account_no`, `bank_ifsc`, `rating`, `status_id`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'SUP-001', 'Kovai Building Materials', 'S. Kumar', '9876500001', NULL, NULL, '33AAAAA0000A1Z5', NULL, NULL, NULL, 'Coimbatore', 'Tamil Nadu', NULL, 30, 0.00, NULL, NULL, NULL, NULL, 0.00, 1, NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 'SUP1785833367', 'API Test Supplier 1785833367', NULL, '9000000000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 0.00, NULL, NULL, NULL, NULL, 0.00, 1, NULL, 1, 1, '2026-08-04 08:49:30', '2026-08-04 08:49:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_suppliers_status_masters`
--

CREATE TABLE `material_suppliers_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_suppliers_status_masters`
--

INSERT INTO `material_suppliers_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ACTIVE', 'Active', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'INACTIVE', 'Inactive', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'BLACKLISTED', 'Blacklisted', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_transactions`
--

CREATE TABLE `material_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_no` varchar(40) NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type_id` bigint(20) UNSIGNED NOT NULL,
  `from_site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `from_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purpose` varchar(500) DEFAULT NULL,
  `reference_type` varchar(40) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `issued_by` bigint(20) UNSIGNED DEFAULT NULL,
  `received_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `posted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_transactions`
--

INSERT INTO `material_transactions` (`id`, `company_id`, `project_id`, `transaction_no`, `transaction_date`, `transaction_type_id`, `from_site_id`, `from_zone_id`, `to_site_id`, `to_zone_id`, `purpose`, `reference_type`, `reference_id`, `status_id`, `requested_by`, `issued_by`, `received_by`, `approved_by`, `approved_at`, `posted_by`, `posted_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'MI-EXPO-0001', '2026-07-23', 1, 1, NULL, 1, 1, 'Foundation concrete work', NULL, NULL, 4, NULL, NULL, NULL, NULL, '2026-07-23 20:47:37', NULL, '2026-07-23 20:47:37', NULL, NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 1, 'ISS1785833367', '2026-08-04', 1, 1, NULL, NULL, NULL, 'API test issue', NULL, NULL, 4, 1, NULL, NULL, 1, '2026-08-04 08:49:53', 1, '2026-08-04 08:49:54', NULL, 1, 1, '2026-08-04 08:49:52', '2026-08-04 14:19:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `material_transactions_status_masters`
--

CREATE TABLE `material_transactions_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_transactions_status_masters`
--

INSERT INTO `material_transactions_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'POSTED', 'Posted', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_transactions_transaction_type_masters`
--

CREATE TABLE `material_transactions_transaction_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_type_code` varchar(60) NOT NULL,
  `transaction_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_transactions_transaction_type_masters`
--

INSERT INTO `material_transactions_transaction_type_masters` (`id`, `transaction_type_code`, `transaction_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ISSUE', 'Issue', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'RETURN', 'Return', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'TRANSFER', 'Transfer', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'ADJUSTMENT_IN', 'Adjustment In', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'ADJUSTMENT_OUT', 'Adjustment Out', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `material_transaction_items`
--

CREATE TABLE `material_transaction_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `material_id` bigint(20) UNSIGNED NOT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `source_receipt_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `batch_no` varchar(60) DEFAULT NULL,
  `work_description` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material_transaction_items`
--

INSERT INTO `material_transaction_items` (`id`, `company_id`, `transaction_id`, `project_id`, `material_id`, `uom_id`, `quantity`, `unit_rate`, `line_value`, `source_receipt_item_id`, `batch_no`, `work_description`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 8, 50.0000, 390.00, 19500.00, 1, 'CEM-EXPO-01', 'Issued for foundation concrete.', NULL, NULL, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(2, 1, 2, 1, 3, 8, 2.0000, 100.00, 200.00, NULL, NULL, NULL, 1, 1, '2026-08-04 08:49:52', '2026-08-04 08:49:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL,
  `namespace` varchar(255) NOT NULL,
  `time` int(11) NOT NULL,
  `batch` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) VALUES
(1, '2026-07-23-163714', 'App\\Database\\Migrations\\IntegrateShieldWithExistingUsers', 'default', 'App', 1784824907, 1);

-- --------------------------------------------------------

--
-- Table structure for table `navigation_items`
--

CREATE TABLE `navigation_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `item_type_id` bigint(20) UNSIGNED NOT NULL,
  `item_code` varchar(80) NOT NULL,
  `item_name` varchar(120) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `icon_key` varchar(80) DEFAULT NULL,
  `required_permission_code` varchar(120) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `navigation_items`
--

INSERT INTO `navigation_items` (`id`, `parent_id`, `item_type_id`, `item_code`, `item_name`, `route_path`, `icon_key`, `required_permission_code`, `display_order`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1000, NULL, 2, 'DASHBOARD', 'Dashboard', NULL, 'layout-dashboard', 'dashboard.view', 10, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1001, 1000, 1, 'EXECUTIVE_DASHBOARD', 'Executive Dashboard', '/dashboard', NULL, 'dashboard.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1002, 1000, 1, 'PROJECT_DASHBOARD', 'Project Dashboard', '/dashboards/projects', NULL, 'dashboard.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1003, 1000, 1, 'SITE_DASHBOARD', 'Site Dashboard', '/dashboards/sites', NULL, 'dashboard.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1004, 1000, 1, 'FINANCIAL_DASHBOARD', 'Financial Dashboard', '/dashboards/finance', NULL, 'project_cost.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1005, 1000, 1, 'ALERTS_NOTIFICATIONS', 'Alerts & Notifications', '/alerts', NULL, 'alert.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1006, NULL, 2, 'PROJECTS', 'Projects', NULL, 'briefcase', NULL, 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1007, 1006, 1, 'PROJECT_REGISTER', 'Project Register', '/projects', NULL, 'project.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1008, 1006, 1, 'ADD_NEW_PROJECT', 'Add New Project', '/projects/new', NULL, 'project.create', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1009, 1006, 1, 'PROJECT_CLIENTS', 'Project Clients', '/projects/clients', NULL, 'project.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1010, 1006, 1, 'PROJECT_TEAM', 'Project Team', '/projects/team', NULL, 'project.manage_team', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1011, 1006, 1, 'PROJECT_OVERVIEW', 'Project Overview', '/projects/overview', NULL, 'project.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1012, 1006, 1, 'PROJECT_DOCUMENTS', 'Project Documents', '/projects/documents', NULL, 'project.manage_documents', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1013, 1006, 1, 'PROJECT_MILESTONES', 'Project Milestones', '/projects/milestones', NULL, 'project.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1014, 1006, 1, 'PROJECT_STATUS_HISTORY', 'Project Status History', '/projects/status-history', NULL, 'project.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1015, NULL, 2, 'SITES_LOCATIONS', 'Sites & Locations', NULL, 'map-pin', NULL, 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1016, 1015, 1, 'SITE_REGISTER', 'Site Register', '/sites', NULL, 'site.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1017, 1015, 1, 'LOCATIONS_ZONES', 'Locations / Zones', '/sites/zones', NULL, 'site.manage_structure', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1018, 1015, 1, 'WORK_LOCATIONS', 'Work Locations', '/sites/work-locations', NULL, 'site.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1019, 1015, 1, 'SITE_TEAM_ASSIGNMENT', 'Site Team Assignment', '/sites/team', NULL, 'site.manage_structure', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1020, 1015, 1, 'SITE_INSTRUCTIONS', 'Site Instructions', '/sites/instructions', NULL, 'site.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1021, 1015, 1, 'SITE_DOCUMENTS', 'Site Documents', '/sites/documents', NULL, 'site.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1022, NULL, 2, 'BOQ_BUDGET', 'BOQ & Project Budget', NULL, 'calculator', NULL, 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1023, 1022, 1, 'BOQ_REGISTER', 'BOQ Register', '/boq', NULL, 'boq.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1024, 1022, 1, 'BOQ_SECTIONS', 'BOQ Sections', '/boq/sections', NULL, 'boq.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1025, 1022, 1, 'BOQ_ITEMS', 'BOQ Items', '/boq/items', NULL, 'boq.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1026, 1022, 1, 'BUDGET_SUMMARY', 'Budget Summary', '/budgets', NULL, 'budget.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1027, 1022, 1, 'BUDGET_REVISIONS', 'Budget Revisions', '/budgets/revisions', NULL, 'budget.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1028, 1022, 1, 'VARIATION_ORDERS', 'Variation Orders', '/budgets/variations', NULL, 'budget.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1029, 1022, 1, 'CHANGE_APPROVAL', 'Change Approval', '/budgets/approvals', NULL, 'budget.approve', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1030, 1022, 1, 'DRAWING_QUANTITY_TAKEOFF', 'Drawing Quantity Takeoff', '/takeoff', NULL, 'boq.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1031, 1022, 1, 'TAKEOFF_REVIEW', 'Takeoff Review', '/takeoff/review', NULL, 'boq.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1032, 1022, 1, 'CONVERT_TAKEOFF_BOQ', 'Convert Takeoff to BOQ', '/takeoff/convert', NULL, 'boq.create', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1033, NULL, 2, 'PROJECT_PLANNING', 'Project Planning', NULL, 'calendar-range', NULL, 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1034, 1033, 1, 'PROJECT_ACTIVITIES', 'Project Activities', '/planning/activities', NULL, 'project.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1035, 1033, 1, 'WORK_PROGRAMME', 'Work Programme', '/planning/work-programme', NULL, 'project.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1036, 1033, 1, 'ACTIVITY_BOQ_MAPPING', 'Activity-BOQ Mapping', '/planning/boq-mapping', NULL, 'boq.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1037, 1033, 1, 'PLANNED_VS_COMPLETED', 'Planned vs Completed', '/planning/planned-vs-completed', NULL, 'work_progress.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1038, 1033, 1, 'LOOK_AHEAD_PLANNING', 'Look-Ahead Planning', '/planning/look-ahead', NULL, 'project.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1039, 1033, 1, 'MATERIAL_REQUIREMENTS', 'Material Requirements', '/planning/material-requirements', NULL, 'materials.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1040, 1033, 1, 'MATERIAL_FORECAST', 'Material Forecast', '/planning/material-forecast', NULL, 'materials.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1041, 1033, 1, 'SHORTAGE_PREDICTIONS', 'Shortage Predictions', '/planning/shortages', NULL, 'material_stock.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1042, 1033, 1, 'PLANNING_ALERTS', 'Planning Alerts', '/planning/alerts', NULL, 'alert.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1043, NULL, 2, 'LABOUR_ATTENDANCE', 'Labour & Attendance', NULL, 'users', NULL, 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1044, 1043, 1, 'LABOUR_REGISTER', 'Labour Register', '/labour', NULL, 'labour.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1045, 1043, 1, 'LABOUR_DEPLOYMENT', 'Labour Deployment', '/labour/deployment', NULL, 'labour.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1046, 1043, 1, 'DAILY_ATTENDANCE', 'Daily Attendance', '/labour/attendance', NULL, 'attendance.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1047, 1043, 1, 'ATTENDANCE_EXCEPTIONS', 'Attendance Exceptions', '/labour/attendance-exceptions', NULL, 'attendance.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1048, 1043, 1, 'TIMESHEETS', 'Timesheets', '/labour/timesheets', NULL, 'attendance.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1049, 1043, 1, 'OVERTIME', 'Overtime', '/labour/overtime', NULL, 'attendance.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1050, 1043, 1, 'LEAVE_MANAGEMENT', 'Leave Management', '/labour/leave', NULL, 'attendance.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1051, 1043, 1, 'DAILY_WAGES', 'Daily Wages', '/labour/wages', NULL, 'wages.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1052, 1043, 1, 'MANPOWER_COST', 'Manpower Cost', '/labour/manpower-cost', NULL, 'wages.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1053, 1043, 1, 'WAGE_APPROVAL', 'Wage Approval', '/labour/wage-approval', NULL, 'wages.approve', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1054, 1043, 1, 'LABOUR_REPORTS', 'Labour Reports', '/reports/labour', NULL, 'report.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1055, NULL, 2, 'MATERIALS_INVENTORY', 'Materials & Inventory', NULL, 'package', NULL, 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1056, 1055, 1, 'MATERIAL_CATALOGUE', 'Material Catalogue', '/materials/catalogue', NULL, 'materials.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1057, 1055, 1, 'STOCK_OVERVIEW', 'Stock Overview', '/materials/stock', NULL, 'material_stock.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1058, 1055, 1, 'PROJECT_STOCK', 'Project Stock', '/materials/project-stock', NULL, 'material_stock.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1059, 1055, 1, 'MATERIAL_REQUESTS', 'Material Requests', '/materials/requests', NULL, 'materials.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1060, 1055, 1, 'STOCK_RECEIPTS', 'Stock Receipts', '/materials/receipts', NULL, 'material_receipts.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1061, 1055, 1, 'STOCK_ISSUES', 'Stock Issues', '/materials/issues', NULL, 'material_stock.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1062, 1055, 1, 'STOCK_TRANSFERS', 'Stock Transfers', '/materials/transfers', NULL, 'material_stock.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1063, 1055, 1, 'MATERIAL_RETURNS', 'Material Returns', '/materials/returns', NULL, 'material_stock.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1064, 1055, 1, 'STOCK_ADJUSTMENTS', 'Stock Adjustments', '/materials/adjustments', NULL, 'material_stock.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1065, 1055, 1, 'DELIVERY_CHALLANS', 'Delivery Challans', '/materials/delivery-challans', NULL, 'material_stock.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1066, 1055, 1, 'MATERIAL_CONSUMPTION', 'Material Consumption', '/materials/consumption', NULL, 'materials.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1067, 1055, 1, 'STOCK_LEDGER', 'Stock Ledger', '/materials/ledger', NULL, 'material_stock.view', 130, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1068, NULL, 2, 'PROCUREMENT', 'Procurement', NULL, 'shopping-cart', NULL, 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1069, 1068, 1, 'PURCHASE_REQUISITIONS', 'Purchase Requisitions', '/procurement/requisitions', NULL, 'purchase_orders.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1070, 1068, 1, 'REQUISITION_APPROVAL', 'Requisition Approval', '/procurement/requisition-approval', NULL, 'purchase_orders.approve', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1071, 1068, 1, 'REQUEST_FOR_QUOTATION', 'Request for Quotation', '/procurement/rfq', NULL, 'purchase_orders.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1072, 1068, 1, 'VENDOR_QUOTATIONS', 'Vendor Quotations', '/procurement/quotations', NULL, 'purchase_orders.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1073, 1068, 1, 'QUOTATION_COMPARISON', 'Quotation Comparison', '/procurement/comparison', NULL, 'purchase_orders.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1074, 1068, 1, 'PURCHASE_ORDERS', 'Purchase Orders', '/procurement/purchase-orders', NULL, 'purchase_orders.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1075, 1068, 1, 'PURCHASE_ORDER_APPROVAL', 'Purchase Order Approval', '/procurement/purchase-order-approval', NULL, 'purchase_orders.approve', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1076, 1068, 1, 'GOODS_RECEIPT', 'Goods Receipt', '/procurement/goods-receipt', NULL, 'material_receipts.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1077, 1068, 1, 'VENDOR_INVOICES', 'Vendor Invoices', '/procurement/vendor-invoices', NULL, 'expenses.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1078, 1068, 1, 'PURCHASE_RETURNS', 'Purchase Returns', '/procurement/returns', NULL, 'purchase_orders.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1079, 1068, 1, 'PROCUREMENT_TRACKING', 'Procurement Tracking', '/procurement/tracking', NULL, 'purchase_orders.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1080, NULL, 2, 'DAILY_SITE_OPERATIONS', 'Daily Site Operations', NULL, 'clipboard-list', NULL, 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1081, 1080, 1, 'DAILY_WORK_REPORT', 'Daily Work Report', '/daily-operations/reports', NULL, 'daily_reports.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1082, 1080, 1, 'WORK_COMPLETION_ENTRY', 'Work Completion Entry', '/daily-operations/completion', NULL, 'work_progress.record', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1083, 1080, 1, 'PROGRESS_MEASUREMENTS', 'Progress Measurements', '/daily-operations/measurements', NULL, 'measurements.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1084, 1080, 1, 'MANPOWER_USAGE', 'Manpower Usage', '/daily-operations/manpower', NULL, 'daily_reports.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1085, 1080, 1, 'EQUIPMENT_USAGE', 'Equipment Usage', '/daily-operations/equipment', NULL, 'daily_reports.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1086, 1080, 1, 'MATERIAL_USAGE', 'Material Usage', '/daily-operations/materials', NULL, 'daily_reports.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1087, 1080, 1, 'DELAYS_ISSUES', 'Delays & Issues', '/daily-operations/issues', NULL, 'site_issues.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1088, 1080, 1, 'SITE_PHOTOS', 'Site Photos', '/daily-operations/photos', NULL, 'site_photos.manage', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1089, 1080, 1, 'DAILY_REPORT_APPROVAL', 'Daily Report Approval', '/daily-operations/approvals', NULL, 'daily_reports.approve', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1090, 1080, 1, 'DAILY_PROGRESS_HISTORY', 'Daily Progress History', '/daily-operations/history', NULL, 'daily_reports.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1091, NULL, 2, 'SUBCONTRACT_MANAGEMENT', 'Subcontract Management', NULL, 'hard-hat', NULL, 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1092, 1091, 1, 'SUBCONTRACTORS', 'Subcontractors', '/subcontracts/subcontractors', NULL, 'subcontractors.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1093, 1091, 1, 'WORK_ORDERS', 'Work Orders', '/subcontracts/work-orders', NULL, 'work_orders.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1094, 1091, 1, 'WORK_ORDER_APPROVAL', 'Work Order Approval', '/subcontracts/work-order-approval', NULL, 'work_orders.approve', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1095, 1091, 1, 'WORK_MEASUREMENTS', 'Work Measurements', '/subcontracts/measurements', NULL, 'measurements.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1096, 1091, 1, 'MEASUREMENT_CERTIFICATES', 'Measurement Certificates', '/subcontracts/certificates', NULL, 'measurements.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1097, 1091, 1, 'RA_BILLS', 'RA Bills', '/subcontracts/ra-bills', NULL, 'ra_bills.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1098, 1091, 1, 'BILL_APPROVAL', 'Bill Approval', '/subcontracts/bill-approval', NULL, 'ra_bills.certify', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1099, 1091, 1, 'SUBCONTRACTOR_PAYMENTS', 'Subcontractor Payments', '/subcontracts/payments', NULL, 'payments.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1100, 1091, 1, 'WORK_COMPLETION', 'Work Completion', '/subcontracts/completion', NULL, 'work_progress.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1101, 1091, 1, 'RETENTION_REGISTER', 'Retention Register', '/subcontracts/retention', NULL, 'ra_bills.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1102, 1091, 1, 'SUBCONTRACT_REPORTS', 'Subcontract Reports', '/reports/subcontracts', NULL, 'report.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1103, NULL, 2, 'CLIENT_BILLING', 'Client Billing & Receivables', NULL, 'receipt-indian-rupee', NULL, 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1104, 1103, 1, 'CLIENT_CONTRACTS', 'Client Contracts', '/receivables/contracts', NULL, 'client.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1105, 1103, 1, 'CONTRACT_VALUE_REGISTER', 'Contract Value Register', '/receivables/contract-values', NULL, 'client.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1106, 1103, 1, 'CLIENT_ADVANCES', 'Client Advances', '/receivables/advances', NULL, 'payments.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1107, 1103, 1, 'ADVANCE_APPROVAL', 'Advance Approval', '/receivables/advance-approval', NULL, 'payments.approve', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1108, 1103, 1, 'CLIENT_INVOICE_REGISTER', 'Client Invoice Register', '/receivables/invoices', NULL, 'payments.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1109, 1103, 1, 'PROGRESS_BILLING', 'Progress Billing', '/receivables/progress-billing', NULL, 'payments.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1110, 1103, 1, 'RECEIPT_REGISTER', 'Receipt Register', '/receivables/receipts', NULL, 'payments.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1111, 1103, 1, 'RECEIPT_ALLOCATION', 'Receipt Allocation', '/receivables/allocations', NULL, 'payments.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1112, 1103, 1, 'OUTSTANDING_RECEIVABLES', 'Outstanding Receivables', '/receivables/outstanding', NULL, 'cashflow.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1113, 1103, 1, 'RETENTION_RECEIVABLES', 'Retention Receivables', '/receivables/retention', NULL, 'cashflow.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1114, 1103, 1, 'CLIENT_STATEMENT', 'Client Statement', '/receivables/statements', NULL, 'report.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1115, NULL, 2, 'FINANCE_COST_CONTROL', 'Finance & Cost Control', NULL, 'landmark', NULL, 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1116, 1115, 1, 'PROJECT_COST_SUMMARY', 'Project Cost Summary', '/finance/project-cost', NULL, 'project_cost.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1117, 1115, 1, 'BUDGET_VS_ACTUAL', 'Budget vs Actual', '/finance/budget-vs-actual', NULL, 'budget.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1118, 1115, 1, 'MATERIAL_COSTS', 'Material Costs', '/finance/material-costs', NULL, 'project_cost.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1119, 1115, 1, 'LABOUR_COSTS', 'Labour Costs', '/finance/labour-costs', NULL, 'wages.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1120, 1115, 1, 'SUBCONTRACT_COSTS', 'Subcontract Costs', '/finance/subcontract-costs', NULL, 'project_cost.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1121, 1115, 1, 'EQUIPMENT_COSTS', 'Equipment Costs', '/finance/equipment-costs', NULL, 'project_cost.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1122, 1115, 1, 'OTHER_EXPENSES', 'Other Expenses', '/finance/other-expenses', NULL, 'expenses.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1123, 1115, 1, 'INCOME_REGISTER', 'Income Register', '/finance/income', NULL, 'cashflow.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1124, 1115, 1, 'EXPENSE_REGISTER', 'Expense Register', '/finance/expenses', NULL, 'expenses.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1125, 1115, 1, 'VENDOR_PAYABLES', 'Vendor Payables', '/finance/vendor-payables', NULL, 'expense_payments.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1126, 1115, 1, 'PAYMENT_REGISTER', 'Payment Register', '/finance/payments', NULL, 'expense_payments.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1127, 1115, 1, 'PROJECT_PROFITABILITY', 'Project Profitability', '/finance/profitability', NULL, 'project_cost.view', 130, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1128, 1115, 1, 'CASH_FLOW', 'Cash Flow', '/finance/cash-flow', NULL, 'cashflow.view', 140, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1129, NULL, 2, 'REPORTS_ANALYTICS', 'Reports & Analytics', NULL, 'bar-chart-3', NULL, 130, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1130, 1129, 1, 'PROJECT_PROGRESS_REPORT', 'Project Progress Report', '/reports/project-progress', NULL, 'report.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1131, 1129, 1, 'BOQ_PROGRESS_REPORT', 'BOQ Progress Report', '/reports/boq-progress', NULL, 'report.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1132, 1129, 1, 'BUDGET_ACTUAL_REPORT', 'Budget vs Actual Report', '/reports/budget-vs-actual', NULL, 'report.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1133, 1129, 1, 'MATERIAL_CONSUMPTION_REPORT', 'Material Consumption Report', '/reports/material-consumption', NULL, 'report.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1134, 1129, 1, 'MATERIAL_SHORTAGE_REPORT', 'Material Shortage Report', '/reports/material-shortage', NULL, 'report.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1135, 1129, 1, 'LABOUR_DEPLOYMENT_REPORT', 'Labour Deployment Report', '/reports/labour-deployment', NULL, 'report.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1136, 1129, 1, 'LABOUR_COST_REPORT', 'Labour Cost Report', '/reports/labour-cost', NULL, 'report.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1137, 1129, 1, 'SUBCONTRACTOR_REPORT', 'Subcontractor Report', '/reports/subcontractors', NULL, 'report.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1138, 1129, 1, 'CLIENT_RECEIVABLE_REPORT', 'Client Receivable Report', '/reports/client-receivables', NULL, 'report.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1139, 1129, 1, 'VENDOR_PAYABLE_REPORT', 'Vendor Payable Report', '/reports/vendor-payables', NULL, 'report.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1140, 1129, 1, 'PROJECT_PROFITABILITY_REPORT', 'Project Profitability Report', '/reports/project-profitability', NULL, 'report.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1141, 1129, 1, 'DAILY_SITE_REPORT', 'Daily Site Report', '/reports/daily-site', NULL, 'report.view', 130, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1142, 1129, 1, 'MANAGEMENT_SUMMARY', 'Management Summary', '/reports/management-summary', NULL, 'management_review.view', 140, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1143, NULL, 2, 'COMMUNICATION', 'Communication', NULL, 'message-square', NULL, 140, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1144, 1143, 1, 'PROJECT_MESSAGES', 'Project Messages', '/communication/project-messages', NULL, 'project.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1145, 1143, 1, 'CLIENT_UPDATES', 'Client Updates', '/communication/client-updates', NULL, 'client.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1146, 1143, 1, 'DOCUMENT_SHARING', 'Document Sharing', '/communication/documents', NULL, 'project.manage_documents', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1147, 1143, 1, 'APPROVAL_REQUESTS', 'Approval Requests', '/communication/approvals', NULL, 'approvals.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1148, 1143, 1, 'WHATSAPP_HISTORY', 'WhatsApp History', '/communication/whatsapp', NULL, 'setting.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1149, 1143, 1, 'EMAIL_HISTORY', 'Email History', '/communication/email', NULL, 'setting.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1150, NULL, 2, 'CLIENT_PORTAL', 'Client Portal', NULL, 'monitor-smartphone', NULL, 150, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1151, 1150, 1, 'CLIENT_USERS', 'Client Users', '/client-portal/users', NULL, 'user.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1152, 1150, 1, 'PORTAL_ACCESS', 'Portal Access', '/client-portal/access', NULL, 'user.manage_access', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1153, 1150, 1, 'SHARED_PROJECTS', 'Shared Projects', '/client-portal/projects', NULL, 'project.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1154, 1150, 1, 'SHARED_DOCUMENTS', 'Shared Documents', '/client-portal/documents', NULL, 'project.manage_documents', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1155, 1150, 1, 'CLIENT_APPROVALS', 'Client Approvals', '/client-portal/approvals', NULL, 'approvals.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1156, 1150, 1, 'CLIENT_COMMUNICATIONS', 'Client Communications', '/client-portal/communications', NULL, 'client.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1157, NULL, 2, 'MASTERS', 'Masters', NULL, 'folder-cog', NULL, 160, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1158, 1157, 2, 'PROJECT_MASTERS', 'Project Masters', NULL, 'project-masters', NULL, 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1159, 1158, 1, 'MASTER_CLIENTS', 'Clients', '/project-masters/clients', NULL, 'client.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1160, 1158, 1, 'MASTER_PROJECT_TYPES', 'Project Types', '/masters/project-types', NULL, 'master.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1161, 1158, 1, 'MASTER_PROJECT_STATUSES', 'Project Statuses', '/masters/project-statuses', NULL, 'master.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1162, 1158, 1, 'MASTER_FINANCIAL_YEARS', 'Financial Years', '/masters/financial-years', NULL, 'financial_year.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1163, 1158, 1, 'MASTER_WORK_CATEGORIES', 'Work Categories', '/masters/work-categories', NULL, 'master.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1164, 1158, 1, 'MASTER_UNITS', 'Units', '/masters/units', NULL, 'master.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1165, 1157, 2, 'LABOUR_MASTERS', 'Labour Masters', NULL, 'labour-masters', NULL, 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1166, 1165, 1, 'MASTER_LABOUR_TYPES', 'Labour Types', '/masters/labour-types', NULL, 'labour.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1167, 1165, 1, 'MASTER_LABOUR_CATEGORIES', 'Labour Categories', '/masters/labour-categories', NULL, 'labour.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1168, 1165, 1, 'MASTER_TRADES', 'Trades', '/masters/trades', NULL, 'labour.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1169, 1165, 1, 'MASTER_WAGE_RATES', 'Wage Rates', '/masters/wage-rates', NULL, 'wages.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1170, 1165, 1, 'MASTER_CREWS', 'Crews', '/masters/crews', NULL, 'labour.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1171, 1157, 2, 'MATERIAL_MASTERS', 'Material Masters', NULL, 'material-masters', NULL, 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1172, 1171, 1, 'MASTER_MATERIAL_CATEGORIES', 'Material Categories', '/masters/material-categories', NULL, 'materials.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1173, 1171, 1, 'MASTER_MATERIALS', 'Materials', '/masters/materials', NULL, 'materials.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1174, 1171, 1, 'MASTER_BRANDS', 'Brands', '/masters/brands', NULL, 'materials.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1175, 1171, 1, 'MASTER_MATERIAL_UNITS', 'Units', '/masters/material-units', NULL, 'materials.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1176, 1171, 1, 'MASTER_WAREHOUSES', 'Warehouses', '/masters/warehouses', NULL, 'material_stock.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1177, 1157, 2, 'PROCUREMENT_MASTERS', 'Procurement Masters', NULL, 'procurement-masters', NULL, 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1178, 1177, 1, 'MASTER_VENDORS', 'Vendors', '/masters/vendors', NULL, 'purchase_orders.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1179, 1177, 1, 'MASTER_PAYMENT_TERMS', 'Payment Terms', '/masters/payment-terms', NULL, 'master.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1180, 1177, 1, 'MASTER_TAX_RATES', 'Tax Rates', '/masters/tax-rates', NULL, 'master.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1181, 1157, 2, 'FINANCE_MASTERS', 'Finance Masters', NULL, 'finance-masters', NULL, 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1182, 1181, 1, 'MASTER_EXPENSE_CATEGORIES', 'Expense Categories', '/masters/expense-categories', NULL, 'expenses.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1183, 1181, 1, 'MASTER_INCOME_CATEGORIES', 'Income Categories', '/masters/income-categories', NULL, 'master.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1184, 1181, 1, 'MASTER_BANKS', 'Banks', '/masters/banks', NULL, 'master.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1185, 1181, 1, 'MASTER_ACCOUNTS', 'Accounts', '/masters/accounts', NULL, 'master.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1186, 1181, 1, 'MASTER_COST_HEADS', 'Cost Heads', '/masters/cost-heads', NULL, 'master.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1187, NULL, 2, 'ADMINISTRATION', 'Administration', NULL, 'settings', NULL, 170, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1188, 1187, 1, 'ADMIN_COMPANIES', 'Companies', '/administration/companies', NULL, 'company.view', 20, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1189, 1187, 1, 'ADMIN_BRANCHES', 'Branches', '/administration/branches', NULL, 'branch.view', 30, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1190, 1187, 1, 'ADMIN_USERS', 'Users', '/administration/users', NULL, 'user.view', 40, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1191, 1187, 1, 'ADMIN_ROLES_PERMISSIONS', 'Roles & Permissions', '/administration/roles-permissions', NULL, 'role.view', 50, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1192, 1187, 1, 'ADMIN_APPROVAL_WORKFLOWS', 'Approval Workflows', '/administration/approval-workflows', NULL, 'approvals.view', 60, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1193, 1187, 1, 'ADMIN_NUMBERING_SETTINGS', 'Numbering Settings', '/administration/numbering', NULL, 'setting.view', 70, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1194, 1187, 1, 'ADMIN_NOTIFICATION_SETTINGS', 'Notification Settings', '/administration/notifications', NULL, 'setting.view', 80, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1195, 1187, 1, 'ADMIN_EMAIL_SETTINGS', 'Email Settings', '/administration/email', NULL, 'setting.view', 90, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1196, 1187, 1, 'ADMIN_WHATSAPP_SETTINGS', 'WhatsApp Settings', '/administration/whatsapp', NULL, 'setting.view', 100, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1197, 1187, 1, 'ADMIN_AUDIT_LOGS', 'Audit Logs', '/administration/audit-logs', NULL, 'activity_log.view', 110, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL),
(1198, 1187, 1, 'ADMIN_SYSTEM_SETTINGS', 'System Settings', '/administration/system-settings', NULL, 'setting.view', 120, 1, '2026-08-20 13:58:30', '2026-08-20 13:58:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `navigation_item_types`
--

CREATE TABLE `navigation_item_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(30) NOT NULL,
  `type_name` varchar(80) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `navigation_item_types`
--

INSERT INTO `navigation_item_types` (`id`, `type_code`, `type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'LINK', 'Navigation Link', 10, 1, '2026-08-20 13:07:34', '2026-08-20 13:07:34'),
(2, 'GROUP', 'Navigation Group', 20, 1, '2026-08-20 13:07:34', '2026-08-20 13:07:34'),
(3, 'SECTION', 'Section Label', 30, 1, '2026-08-20 13:07:34', '2026-08-20 13:07:34'),
(4, 'DIVIDER', 'Divider', 40, 1, '2026-08-20 13:07:34', '2026-08-20 13:07:34');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `recipient_user_id` bigint(20) UNSIGNED NOT NULL,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `source_module` varchar(60) NOT NULL,
  `source_table` varchar(80) DEFAULT NULL,
  `source_record_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(180) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `email_sent` tinyint(1) NOT NULL DEFAULT 0,
  `email_sent_at` datetime DEFAULT NULL,
  `email_error` varchar(1000) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `company_id`, `recipient_user_id`, `event_id`, `project_id`, `source_module`, `source_table`, `source_record_id`, `title`, `message`, `action_url`, `is_read`, `read_at`, `email_sent`, `email_sent_at`, `email_error`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 6, 1, 1, 'BOQ', 'project_boqs', 3, 'Project BOQ awaiting approval', 'BOQ-API-002 - Greenfield Residency Notification Test BOQ has been submitted for approval.', '/project-boqs/3', 0, NULL, 0, NULL, '220 smtp.gmail.com ESMTP 5a478bee46e88-3153e18e107sm14853930eec.27 - gsmtp\r\nhello: 250-smtp.gmail.com at your service, [106.221.30.233]\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-STARTTLS\r\n250-ENHANCEDSTATUSCODES\r\n250-PIPELINING\r\n250-CHUNKING\r\n250 SMTPUTF8\r\nstarttls: 220 2.0.0 Ready to start TLS\r\nhello: 250-smtp.gmail.com at your service, [106.221.30.233]\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH\r\n250-ENHANCEDSTATUSCODES\r\n250-PIPELINING\r\n250-CHUNKING\r\n250 SMTPUTF8\r\nFailed to authenticate password. Error: 535-5.7.8 Username and Password not accepted. For more information, go to\r\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 5a478bee46e88-3153e18e107sm14853930eec.27 - gsmtp\r\nUnable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Sat, 1 Aug 2026 06:27:33 +0000\nTo: siteengineer6930@test.com\nSubject: =?UTF-8?Q?Project=20BOQ=20awaiting=20approval?=\nFrom: &quot;Civil Site Man', 1, '2026-08-01 06:27:33', '2026-08-01 06:27:37'),
(2, 1, 6, 1, 1, 'BOQ', 'project_boqs', 4, 'Project BOQ awaiting approval', 'BOQ-EMAIL-001 - BOQ Email Delivery Test has been submitted for approval.', '/project-boqs/4', 0, NULL, 0, NULL, '220 smtp.gmail.com ESMTP a92af1059eb24-13fab4cb50dsm16313022c88.10 - gsmtp\r\nhello: 250-smtp.gmail.com at your service, [106.221.30.233]\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-STARTTLS\r\n250-ENHANCEDSTATUSCODES\r\n250-PIPELINING\r\n250-CHUNKING\r\n250 SMTPUTF8\r\nstarttls: 220 2.0.0 Ready to start TLS\r\nhello: 250-smtp.gmail.com at your service, [106.221.30.233]\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH\r\n250-ENHANCEDSTATUSCODES\r\n250-PIPELINING\r\n250-CHUNKING\r\n250 SMTPUTF8\r\nfrom: 250 2.1.0 OK a92af1059eb24-13fab4cb50dsm16313022c88.10 - gsmtp\r\nto: 250 2.1.5 OK a92af1059eb24-13fab4cb50dsm16313022c88.10 - gsmtp\r\ndata: 354 Go ahead a92af1059eb24-13fab4cb50dsm16313022c88.10 - gsmtp\r\nquit: The following SMTP error was encountered: The following SMTP error was encountered: Unable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Sat, 1 Aug 2026 07:28:02 +0000\nTo: siteengineer6930@test.com\nSubject: =?U', 1, '2026-08-01 07:28:02', '2026-08-01 07:28:17'),
(3, 1, 6, 1, 1, 'BOQ', 'project_boqs', 5, 'Project BOQ awaiting approval', 'BOQ-EMAIL-002 - BOQ Email Delivery Retest has been submitted for approval.', '/project-boqs/5', 0, NULL, 1, '2026-08-01 07:34:32', NULL, 1, '2026-08-01 07:34:26', '2026-08-01 07:34:32'),
(4, 1, 1, 2, 1, 'BOQ', 'project_boqs', 5, 'Project BOQ approved', 'BOQ-EMAIL-002 - BOQ Email Delivery Retest has been approved.', '/project-boqs/5', 1, '2026-08-04 15:48:09', 0, NULL, 'Unable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Mon, 3 Aug 2026 06:02:58 +0000\r\nTo: superadmin@civilpro.com\r\nSubject: =?UTF-8?Q?Project=20BOQ=20approved?=\r\nFrom: &quot;Civil Site Management&quot; &lt;erp.dvn@gmail.com&gt;\r\nReturn-Path: &lt;erp.dvn@gmail.com&gt;\r\nReply-To: &lt;erp.dvn@gmail.com&gt;\r\nUser-Agent: CodeIgniter\r\nX-Sender: erp.dvn@gmail.com\r\nX-Mailer: CodeIgniter\r\nX-Priority: 3 (Normal)\r\nMessage-ID: &lt;6a702f1220f903.18726731@gmail.com&gt;\r\nMime-Version: 1.0\r\n\n', 6, '2026-08-03 06:02:58', '2026-08-04 21:18:09'),
(5, 1, 6, 1, 1, 'BOQ', 'project_boqs', 6, 'Project BOQ awaiting approval', 'BOQ-EMAIL-003 - Final BOQ Two-Way Email Test has been submitted for approval.', '/project-boqs/6', 0, NULL, 0, NULL, 'Unable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Mon, 3 Aug 2026 06:19:40 +0000\r\nTo: marhesh@gmail.com\r\nSubject: =?UTF-8?Q?Project=20BOQ=20awaiting=20approval?=\r\nFrom: &quot;Civil Site Management&quot; &lt;erp.dvn@gmail.com&gt;\r\nReturn-Path: &lt;erp.dvn@gmail.com&gt;\r\nReply-To: &lt;erp.dvn@gmail.com&gt;\r\nUser-Agent: CodeIgniter\r\nX-Sender: erp.dvn@gmail.com\r\nX-Mailer: CodeIgniter\r\nX-Priority: 3 (Normal)\r\nMessage-ID: &lt;6a7032fc8fc642.85714027@gmail.com&gt;\r\nMime-Version: 1.0\r\n\n', 1, '2026-08-03 06:19:40', '2026-08-03 06:19:45'),
(6, 1, 1, 2, 1, 'BOQ', 'project_boqs', 6, 'Project BOQ approved', 'BOQ-EMAIL-003 - Final BOQ Two-Way Email Test has been approved.', '/project-boqs/6', 1, '2026-08-04 15:48:09', 0, NULL, 'Unable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Mon, 3 Aug 2026 06:20:51 +0000\r\nTo: erp.dvn@gmail.com\r\nSubject: =?UTF-8?Q?Project=20BOQ=20approved?=\r\nFrom: &quot;Civil Site Management&quot; &lt;erp.dvn@gmail.com&gt;\r\nReturn-Path: &lt;erp.dvn@gmail.com&gt;\r\nReply-To: &lt;erp.dvn@gmail.com&gt;\r\nUser-Agent: CodeIgniter\r\nX-Sender: erp.dvn@gmail.com\r\nX-Mailer: CodeIgniter\r\nX-Priority: 3 (Normal)\r\nMessage-ID: &lt;6a703343699752.79246953@gmail.com&gt;\r\nMime-Version: 1.0\r\n\n', 6, '2026-08-03 06:20:51', '2026-08-04 21:18:09'),
(7, 1, 6, 1, 1, 'BOQ', 'project_boqs', 7, 'Project BOQ awaiting approval', 'BOQ-EMAIL-004 - Final SMTP Retest has been submitted for approval.', '/project-boqs/7', 0, NULL, 1, '2026-08-03 06:35:15', NULL, 1, '2026-08-03 06:35:08', '2026-08-03 06:35:15'),
(8, 1, 1, 2, 1, 'BOQ', 'project_boqs', 7, 'Project BOQ approved', 'BOQ-EMAIL-004 - Final SMTP Retest has been approved.', '/project-boqs/7', 1, '2026-08-04 15:48:09', 1, '2026-08-03 06:36:22', NULL, 6, '2026-08-03 06:36:16', '2026-08-04 21:18:09'),
(9, 1, 6, 1, 1, 'BOQ', 'project_boqs', 8, 'Project BOQ awaiting approval', 'BOQ-SEC-5951 - Complete BOQ Sections API Test has been submitted for approval.', '/project-boqs/8', 0, NULL, 1, '2026-08-03 10:43:55', NULL, 1, '2026-08-03 10:43:49', '2026-08-03 10:43:55'),
(10, 1, 1, 2, 1, 'BOQ', 'project_boqs', 8, 'Project BOQ approved', 'BOQ-SEC-5951 - Complete BOQ Sections API Test has been approved.', '/project-boqs/8', 1, '2026-08-04 15:48:09', 1, '2026-08-03 10:44:03', NULL, 1, '2026-08-03 10:43:57', '2026-08-04 21:18:09'),
(11, 1, 6, 1, 1, 'BOQ', 'project_boqs', 9, 'Project BOQ awaiting approval', 'BOQ-REJECT-10173 - BOQ Rejection Workflow Test has been submitted for approval.', '/project-boqs/9', 0, NULL, 1, '2026-08-03 10:44:10', NULL, 1, '2026-08-03 10:44:04', '2026-08-03 10:44:10'),
(12, 1, 1, 3, 1, 'BOQ', 'project_boqs', 9, 'Project BOQ rejected', 'BOQ-REJECT-10173 - BOQ Rejection Workflow Test has been rejected.', '/project-boqs/9', 1, '2026-08-04 15:48:09', 1, '2026-08-03 10:44:16', NULL, 1, '2026-08-03 10:44:10', '2026-08-04 21:18:09'),
(13, 1, 1, 5, 1, 'BUDGET', 'project_budgets', 2, 'Project budget approved', 'BUD-API-20376 - Updated Project Budget Core API Test has been approved.', '/project-budgets/2', 1, '2026-08-04 15:48:09', 1, '2026-08-03 11:19:53', NULL, 1, '2026-08-03 11:19:25', '2026-08-04 21:18:09'),
(14, 1, 1, 6, 1, 'BUDGET', 'project_budgets', 4, 'Project budget rejected', 'BUD-REJECT-7540 - Budget Rejection Workflow Test has been rejected.', '/project-budgets/4', 1, '2026-08-04 15:48:09', 1, '2026-08-03 11:20:23', NULL, 1, '2026-08-03 11:19:55', '2026-08-04 21:18:09'),
(15, 1, 1, 8, 1, 'BUDGET_REVISION', 'budget_revisions', 1, 'Budget revision approved', 'BUD-API-20376 revision 1 has been approved.', '/project-budgets/2/revisions/1', 1, '2026-08-04 15:48:09', 1, '2026-08-03 11:46:59', NULL, 1, '2026-08-03 11:46:52', '2026-08-04 21:18:09'),
(16, 1, 1, 9, 1, 'BUDGET_REVISION', 'budget_revisions', 2, 'Budget revision rejected', 'BUD-API-20376 revision 2 has been rejected.', '/project-budgets/2/revisions/2', 1, '2026-08-04 15:48:09', 1, '2026-08-03 11:47:10', NULL, 1, '2026-08-03 11:47:03', '2026-08-04 21:18:09'),
(17, 1, 1, 16, 1, 'MATERIAL_RECEIPT', 'material_receipts', 2, 'Material receipt inspected', 'GRN1785833367 has been inspected.', '/material-receipts/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 08:49:44', NULL, 1, '2026-08-04 08:49:38', '2026-08-04 21:18:09'),
(18, 1, 1, 17, 1, 'MATERIAL_RECEIPT', 'material_receipts', 2, 'Material receipt posted', 'GRN1785833367 has been posted.', '/material-receipts/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 08:49:51', NULL, 1, '2026-08-04 08:49:46', '2026-08-04 21:18:09'),
(19, 1, 1, 21, 1, 'MATERIAL_TRANSACTION', 'material_transactions', 2, 'Material stock transaction posted', 'ISS1785833367 has been posted.', '/material-transactions/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 08:50:00', NULL, 1, '2026-08-04 08:49:54', '2026-08-04 21:18:09'),
(20, 1, 1, 22, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report submitted', 'DSR-API-1785836390 has been submitted.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:08', NULL, 1, '2026-08-04 09:40:02', '2026-08-04 21:18:09'),
(21, 1, 1, 23, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report reviewed', 'DSR-API-1785836390 has been reviewed.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:16', NULL, 1, '2026-08-04 09:40:09', '2026-08-04 21:18:09'),
(22, 1, 1, 24, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report approved', 'DSR-API-1785836390 has been approved.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:22', NULL, 1, '2026-08-04 09:40:16', '2026-08-04 21:18:09'),
(23, 1, 1, 26, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report reopened', 'DSR-API-1785836390 has been reopened.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:29', NULL, 1, '2026-08-04 09:40:23', '2026-08-04 21:18:09'),
(24, 1, 1, 22, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report submitted', 'DSR-API-1785836390 has been submitted.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:37', NULL, 1, '2026-08-04 09:40:29', '2026-08-04 21:18:09'),
(25, 1, 1, 23, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report reviewed', 'DSR-API-1785836390 has been reviewed.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:42', NULL, 1, '2026-08-04 09:40:37', '2026-08-04 21:18:09'),
(26, 1, 1, 25, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report rejected', 'DSR-API-1785836390 has been rejected.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:48', NULL, 1, '2026-08-04 09:40:43', '2026-08-04 21:18:09'),
(27, 1, 1, 26, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report reopened', 'DSR-API-1785836390 has been reopened.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:54', NULL, 1, '2026-08-04 09:40:49', '2026-08-04 21:18:09'),
(28, 1, 1, 27, 1, 'DAILY_REPORT', 'daily_site_reports', 4, 'Daily site report cancelled', 'DSR-API-1785836390 has been cancelled.', '/daily-site-reports/4', 1, '2026-08-04 15:48:09', 1, '2026-08-04 09:40:59', NULL, 1, '2026-08-04 09:40:54', '2026-08-04 21:18:09'),
(29, 1, 1, 29, 1, 'SUBCONTRACT_WORK_ORDER', 'subcontract_work_orders', 2, 'Subcontract Work Order approve', 'SWO_1785850475 has been approve.', '/subcontract-work-orders/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:34:57', NULL, 1, '2026-08-04 13:34:40', '2026-08-04 21:18:09'),
(30, 1, 1, 31, 1, 'SUBCONTRACT_WORK_ORDER', 'subcontract_work_orders', 2, 'Subcontract Work Order activate', 'SWO_1785850475 has been activate.', '/subcontract-work-orders/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:04', NULL, 1, '2026-08-04 13:34:58', '2026-08-04 21:18:09'),
(31, 1, 1, 37, 1, 'SUBCONTRACT_MEASUREMENT', 'subcontract_measurements', 2, 'Subcontract Measurement approve', 'MB_1785850475 has been approve.', '/subcontract-measurements/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:16', NULL, 1, '2026-08-04 13:35:08', '2026-08-04 21:18:09'),
(32, 1, 1, 42, 1, 'SUBCONTRACT_RA_BILL', 'subcontract_ra_bills', 2, 'Subcontract Ra Bill approve', 'RA_1785850475 has been approve.', '/subcontract-ra-bills/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:25', NULL, 1, '2026-08-04 13:35:19', '2026-08-04 21:18:09'),
(33, 1, 1, 43, 1, 'SUBCONTRACT_RA_BILL', 'subcontract_ra_bills', 2, 'Subcontract Ra Bill certify', 'RA_1785850475 has been certify.', '/subcontract-ra-bills/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:34', NULL, 1, '2026-08-04 13:35:26', '2026-08-04 21:18:09'),
(34, 1, 1, 47, 1, 'SUBCONTRACT_PAYMENT', 'subcontract_payments', 2, 'Subcontract Payment approve', 'PAY_1785850475 has been approve.', '/subcontract-payments/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:41', NULL, 1, '2026-08-04 13:35:35', '2026-08-04 21:18:09'),
(35, 1, 1, 48, 1, 'SUBCONTRACT_PAYMENT', 'subcontract_payments', 2, 'Subcontract Payment mark paid', 'PAY_1785850475 has been mark paid.', '/subcontract-payments/2', 1, '2026-08-04 15:48:09', 1, '2026-08-04 13:35:49', NULL, 1, '2026-08-04 13:35:42', '2026-08-04 21:18:09'),
(36, 1, 1, 59, 1, 'EXPENSE', 'expense_requests', 6, 'Expense request submitted for approval', 'ER_API_1785854515 has been submitted for approval.', '/expense-requests/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:12', NULL, 1, '2026-08-04 14:42:03', '2026-08-04 21:18:09'),
(37, 1, 1, 60, 1, 'EXPENSE', 'expense_requests', 6, 'Expense request approved', 'ER_API_1785854515 has been approved.', '/expense-requests/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:19', NULL, 1, '2026-08-04 14:42:13', '2026-08-04 21:18:09'),
(38, 1, 1, 62, 1, 'EXPENSE', 'expense_bills', 6, 'Expense bill submitted for approval', 'EV_API_1785854515 has been submitted for approval.', '/expense-bills/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:28', NULL, 1, '2026-08-04 14:42:22', '2026-08-04 21:18:09'),
(39, 1, 1, 63, 1, 'EXPENSE', 'expense_bills', 6, 'Expense bill approved', 'EV_API_1785854515 has been approved.', '/expense-bills/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:34', NULL, 1, '2026-08-04 14:42:28', '2026-08-04 21:18:09'),
(40, 1, 1, 65, 1, 'EXPENSE', 'expense_bills', 6, 'Expense bill posted', 'EV_API_1785854515 has been posted.', '/expense-bills/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:41', NULL, 1, '2026-08-04 14:42:35', '2026-08-04 21:18:09'),
(41, 1, 1, 66, 1, 'EXPENSE', 'expense_payments', 6, 'Expense payment submitted for approval', 'EP_API_1785854515 has been submitted for approval.', '/expense-payments/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:49', NULL, 1, '2026-08-04 14:42:43', '2026-08-04 21:18:09'),
(42, 1, 1, 67, 1, 'EXPENSE', 'expense_payments', 6, 'Expense payment approved', 'EP_API_1785854515 has been approved.', '/expense-payments/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:42:57', NULL, 1, '2026-08-04 14:42:50', '2026-08-04 21:18:09'),
(43, 1, 1, 69, 1, 'EXPENSE', 'expense_payments', 6, 'Expense payment marked paid', 'EP_API_1785854515 has been marked paid.', '/expense-payments/6', 1, '2026-08-04 15:48:09', 1, '2026-08-04 14:43:03', NULL, 1, '2026-08-04 14:42:57', '2026-08-04 21:18:09'),
(44, 1, 1, 59, 1, 'EXPENSE', 'expense_requests', 7, 'Expense request submitted for approval', 'APR10_1785855886 has been submitted for approval.', '/expense-requests/7', 1, '2026-08-04 15:48:09', 0, NULL, 'Unable to send email using SMTP. Your server might not be configured to send mail using this method.Date: Tue, 4 Aug 2026 15:04:47 +0000\r\nTo: erp.dvn@gmail.com\r\nSubject: =?UTF-8?Q?Expense=20request=20submitted=20for=20approval?=\r\nFrom: &quot;Civil Site Management&quot; &lt;erp.dvn@gmail.com&gt;\r\nReturn-Path: &lt;erp.dvn@gmail.com&gt;\r\nReply-To: &lt;erp.dvn@gmail.com&gt;\r\nUser-Agent: CodeIgniter\r\nX-Sender: erp.dvn@gmail.com\r\nX-Mailer: CodeIgniter\r\nX-Priority: 3 (Normal)\r\nMessage-ID: &lt;6a71ff8fbd36a1.16056380@gmail.com&gt;\r\nMime-Version: 1.0\r\n\n', 1, '2026-08-04 15:04:47', '2026-08-04 21:18:09'),
(45, 1, 1, 59, 1, 'EXPENSE', 'expense_requests', 8, 'Expense request submitted for approval', 'APR10_1785856318 has been submitted for approval.', '/expense-requests/8', 1, '2026-08-04 15:48:09', 1, '2026-08-04 15:12:05', NULL, 1, '2026-08-04 15:11:59', '2026-08-04 21:18:09'),
(46, 1, 1, 60, 1, 'EXPENSE', 'expense_requests', 8, 'Expense request approved', 'APR10_1785856318 has been approved.', '/expense-requests/8', 1, '2026-08-04 15:48:09', 1, '2026-08-04 15:12:12', NULL, 1, '2026-08-04 15:12:06', '2026-08-04 15:48:09');

-- --------------------------------------------------------

--
-- Table structure for table `notification_event_masters`
--

CREATE TABLE `notification_event_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_code` varchar(60) NOT NULL,
  `event_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_event_masters`
--

INSERT INTO `notification_event_masters` (`id`, `event_code`, `event_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BOQ_SUBMITTED', 'BOQ Submitted', 10, 1, '2026-08-01 11:19:49', '2026-08-01 11:19:49'),
(2, 'BOQ_APPROVED', 'BOQ Approved', 20, 1, '2026-08-01 11:19:49', '2026-08-01 11:19:49'),
(3, 'BOQ_REJECTED', 'BOQ Rejected', 30, 1, '2026-08-01 11:19:49', '2026-08-01 11:19:49'),
(4, 'BUDGET_SUBMITTED', 'Budget Submitted', 40, 1, '2026-08-03 16:42:59', '2026-08-03 16:42:59'),
(5, 'BUDGET_APPROVED', 'Budget Approved', 50, 1, '2026-08-03 16:42:59', '2026-08-03 16:42:59'),
(6, 'BUDGET_REJECTED', 'Budget Rejected', 60, 1, '2026-08-03 16:42:59', '2026-08-03 16:42:59'),
(7, 'BUDGET_REVISION_SUBMITTED', 'Budget Revision Submitted', 70, 1, '2026-08-03 17:06:16', '2026-08-03 17:06:16'),
(8, 'BUDGET_REVISION_APPROVED', 'Budget Revision Approved', 80, 1, '2026-08-03 17:06:16', '2026-08-03 17:06:16'),
(9, 'BUDGET_REVISION_REJECTED', 'Budget Revision Rejected', 90, 1, '2026-08-03 17:06:16', '2026-08-03 17:06:16'),
(10, 'MATERIAL_REQUEST_SUBMITTED', 'Material Request Submitted', 100, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(11, 'MATERIAL_REQUEST_APPROVED', 'Material Request Approved', 110, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(12, 'MATERIAL_REQUEST_REJECTED', 'Material Request Rejected', 120, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(13, 'MATERIAL_PO_SUBMITTED', 'Material Purchase Order Submitted', 130, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(14, 'MATERIAL_PO_APPROVED', 'Material Purchase Order Approved', 140, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(15, 'MATERIAL_PO_REJECTED', 'Material Purchase Order Rejected', 150, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(16, 'MATERIAL_RECEIPT_INSPECTED', 'Material Receipt Inspected', 160, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(17, 'MATERIAL_RECEIPT_POSTED', 'Material Receipt Posted', 170, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(18, 'MATERIAL_TRANSACTION_SUBMITTED', 'Material Stock Transaction Submitted', 180, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(19, 'MATERIAL_TRANSACTION_APPROVED', 'Material Stock Transaction Approved', 190, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(20, 'MATERIAL_TRANSACTION_REJECTED', 'Material Stock Transaction Rejected', 200, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(21, 'MATERIAL_TRANSACTION_POSTED', 'Material Stock Transaction Posted', 210, 1, '2026-08-04 14:09:56', '2026-08-04 14:09:56'),
(22, 'DAILY_REPORT_SUBMITTED', 'Daily Site Report Submitted', 220, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(23, 'DAILY_REPORT_REVIEWED', 'Daily Site Report Reviewed', 230, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(24, 'DAILY_REPORT_APPROVED', 'Daily Site Report Approved', 240, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(25, 'DAILY_REPORT_REJECTED', 'Daily Site Report Rejected', 250, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(26, 'DAILY_REPORT_REOPENED', 'Daily Site Report Reopened', 260, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(27, 'DAILY_REPORT_CANCELLED', 'Daily Site Report Cancelled', 270, 1, '2026-08-04 14:50:45', '2026-08-04 14:50:45'),
(28, 'SUBCONTRACT_WORK_ORDER_SUBMIT', 'Subcontract Work Order Submitted', 300, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(29, 'SUBCONTRACT_WORK_ORDER_APPROVE', 'Subcontract Work Order Approved', 301, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(30, 'SUBCONTRACT_WORK_ORDER_REJECT', 'Subcontract Work Order Rejected', 302, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(31, 'SUBCONTRACT_WORK_ORDER_ACTIVATE', 'Subcontract Work Order Activated', 303, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(32, 'SUBCONTRACT_WORK_ORDER_COMPLETE', 'Subcontract Work Order Completed', 304, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(33, 'SUBCONTRACT_WORK_ORDER_CLOSE', 'Subcontract Work Order Closed', 305, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(34, 'SUBCONTRACT_WORK_ORDER_CANCEL', 'Subcontract Work Order Cancelled', 306, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(35, 'SUBCONTRACT_MEASUREMENT_SUBMIT', 'Subcontract Measurement Submitted', 310, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(36, 'SUBCONTRACT_MEASUREMENT_VERIFY', 'Subcontract Measurement Verified', 311, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(37, 'SUBCONTRACT_MEASUREMENT_APPROVE', 'Subcontract Measurement Approved', 312, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(38, 'SUBCONTRACT_MEASUREMENT_REJECT', 'Subcontract Measurement Rejected', 313, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(39, 'SUBCONTRACT_MEASUREMENT_CANCEL', 'Subcontract Measurement Cancelled', 314, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(40, 'SUBCONTRACT_RA_BILL_SUBMIT', 'Subcontract RA Bill Submitted', 320, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(41, 'SUBCONTRACT_RA_BILL_VERIFY', 'Subcontract RA Bill Verified', 321, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(42, 'SUBCONTRACT_RA_BILL_APPROVE', 'Subcontract RA Bill Approved', 322, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(43, 'SUBCONTRACT_RA_BILL_CERTIFY', 'Subcontract RA Bill Certified', 323, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(44, 'SUBCONTRACT_RA_BILL_REJECT', 'Subcontract RA Bill Rejected', 324, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(45, 'SUBCONTRACT_RA_BILL_CANCEL', 'Subcontract RA Bill Cancelled', 325, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(46, 'SUBCONTRACT_PAYMENT_SUBMIT', 'Subcontract Payment Submitted', 330, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(47, 'SUBCONTRACT_PAYMENT_APPROVE', 'Subcontract Payment Approved', 331, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(48, 'SUBCONTRACT_PAYMENT_MARK_PAID', 'Subcontract Payment Paid', 332, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(49, 'SUBCONTRACT_PAYMENT_REJECT', 'Subcontract Payment Rejected', 333, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(50, 'SUBCONTRACT_PAYMENT_CANCEL', 'Subcontract Payment Cancelled', 334, 1, '2026-08-04 18:31:31', '2026-08-04 18:31:31'),
(59, 'EXPENSE_REQUEST_SUBMITTED', 'Expense Request Submitted', 400, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(60, 'EXPENSE_REQUEST_APPROVE', 'Expense Request Approved', 401, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(61, 'EXPENSE_REQUEST_REJECT', 'Expense Request Rejected', 402, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(62, 'EXPENSE_BILL_SUBMITTED', 'Expense Bill Submitted', 410, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(63, 'EXPENSE_BILL_APPROVE', 'Expense Bill Approved', 411, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(64, 'EXPENSE_BILL_REJECT', 'Expense Bill Rejected', 412, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(65, 'EXPENSE_BILL_POST', 'Expense Bill Posted', 413, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(66, 'EXPENSE_PAYMENT_SUBMITTED', 'Expense Payment Submitted', 420, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(67, 'EXPENSE_PAYMENT_APPROVE', 'Expense Payment Approved', 421, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(68, 'EXPENSE_PAYMENT_REJECT', 'Expense Payment Rejected', 422, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27'),
(69, 'EXPENSE_PAYMENT_MARK_PAID', 'Expense Payment Paid', 423, 1, '2026-08-04 20:11:27', '2026-08-04 20:11:27');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `module_code` varchar(60) NOT NULL,
  `permission_code` varchar(120) NOT NULL,
  `permission_name` varchar(150) NOT NULL,
  `action_type_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `module_code`, `permission_code`, `permission_name`, `action_type_id`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'COMPANY', 'company.view', 'View Company', 1, 'View company profile and configuration.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(2, 'COMPANY', 'company.update', 'Update Company', 3, 'Update company profile and configuration.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(3, 'BRANCH', 'branch.view', 'View Branches', 1, 'View company branches.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(4, 'BRANCH', 'branch.create', 'Create Branch', 2, 'Create a company branch.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(5, 'BRANCH', 'branch.update', 'Update Branch', 3, 'Update a company branch.', 30, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(6, 'BRANCH', 'branch.delete', 'Delete Branch', 4, 'Soft-delete a company branch.', 40, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(7, 'USER', 'user.view', 'View Users', 1, 'View company users.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(8, 'USER', 'user.create', 'Create User', 2, 'Create or invite a company user.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(9, 'USER', 'user.update', 'Update User', 3, 'Update company user details.', 30, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(10, 'USER', 'user.delete', 'Delete User', 4, 'Soft-delete a company user.', 40, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(11, 'USER', 'user.manage_access', 'Manage User Access', 9, 'Assign user roles and branch access.', 50, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(12, 'ROLE', 'role.view', 'View Roles', 1, 'View roles and permission mappings.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(13, 'ROLE', 'role.create', 'Create Role', 2, 'Create a company role.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(14, 'ROLE', 'role.update', 'Update Role', 3, 'Update a company role.', 30, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(15, 'ROLE', 'role.delete', 'Delete Role', 4, 'Soft-delete a company role.', 40, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(16, 'ROLE', 'role.manage_permissions', 'Manage Role Permissions', 9, 'Grant and revoke permissions for a role.', 50, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(17, 'FINANCIAL_YEAR', 'financial_year.view', 'View Financial Years', 1, 'View company financial years.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(18, 'FINANCIAL_YEAR', 'financial_year.manage', 'Manage Financial Years', 9, 'Create, open, close and lock financial years.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(19, 'SETTING', 'setting.view', 'View System Settings', 1, 'View permitted system settings.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(20, 'SETTING', 'setting.manage', 'Manage System Settings', 9, 'Create and update system settings.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(21, 'ACTIVITY_LOG', 'activity_log.view', 'View Activity Logs', 1, 'View company audit and activity history.', 10, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(22, 'ACTIVITY_LOG', 'activity_log.export', 'Export Activity Logs', 8, 'Export company audit and activity history.', 20, 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(23, 'MASTER', 'master.view', 'View Common Masters', 1, 'View units, categories, project types and document types.', 10, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(24, 'MASTER', 'master.create', 'Create Common Master', 2, 'Create common master records.', 20, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(25, 'MASTER', 'master.update', 'Update Common Master', 3, 'Update common master records.', 30, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(26, 'MASTER', 'master.delete', 'Delete Common Master', 4, 'Soft-delete common master records.', 40, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(27, 'CLIENT', 'client.view', 'View Clients', 1, 'View clients, contacts, addresses and documents.', 10, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(28, 'CLIENT', 'client.create', 'Create Client', 2, 'Create clients and related details.', 20, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(29, 'CLIENT', 'client.update', 'Update Client', 3, 'Update clients and related details.', 30, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(30, 'CLIENT', 'client.delete', 'Delete Client', 4, 'Soft-delete a client.', 40, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(31, 'CLIENT', 'client.manage_documents', 'Manage Client Documents', 9, 'Upload, replace, archive and download client documents.', 50, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(32, 'CLIENT', 'client.export', 'Export Clients', 8, 'Export permitted client information.', 60, 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(33, 'PROJECT', 'project.view', 'View Projects', 1, 'View projects, commercial summaries, teams and project history.', 10, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(34, 'PROJECT', 'project.create', 'Create Project', 2, 'Create a construction project.', 20, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(35, 'PROJECT', 'project.update', 'Update Project', 3, 'Update project details and assignments.', 30, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(36, 'PROJECT', 'project.delete', 'Delete Project', 4, 'Soft-delete a project.', 40, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(37, 'PROJECT', 'project.change_status', 'Change Project Status', 6, 'Move a project through controlled status transitions.', 50, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(38, 'PROJECT', 'project.manage_team', 'Manage Project Team', 9, 'Assign and remove project team members.', 60, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(39, 'PROJECT', 'project.manage_documents', 'Manage Project Documents', 9, 'Upload, revise, approve and archive project documents.', 70, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(40, 'PROJECT', 'project.export', 'Export Projects', 8, 'Export permitted project information.', 80, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(41, 'SITE', 'site.view', 'View Sites', 1, 'View sites, zones, blocks, floors and units.', 10, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(42, 'SITE', 'site.create', 'Create Site', 2, 'Create project sites and their execution hierarchy.', 20, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(43, 'SITE', 'site.update', 'Update Site', 3, 'Update site, zone, block, floor and unit details.', 30, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(44, 'SITE', 'site.delete', 'Delete Site', 4, 'Soft-delete a site or site hierarchy record.', 40, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(45, 'SITE', 'site.change_status', 'Change Site Status', 6, 'Move a site through controlled status transitions.', 50, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(46, 'SITE', 'site.manage_structure', 'Manage Site Structure', 9, 'Manage work zones, blocks, floors and units.', 60, 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(75, 'BOQ', 'boq.view', 'View BOQ', 1, 'View project BOQ headers, sections and items.', 400, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(76, 'BOQ', 'boq.create', 'Create BOQ', 2, 'Create project BOQ versions and items.', 401, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(77, 'BOQ', 'boq.update', 'Update BOQ', 3, 'Update draft BOQ versions and rate analysis.', 402, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(78, 'BOQ', 'boq.submit', 'Submit BOQ', 5, 'Submit a BOQ for review.', 403, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(79, 'BOQ', 'boq.approve', 'Approve BOQ', 6, 'Approve or reject submitted BOQ versions.', 404, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(80, 'BOQ', 'boq.delete', 'Delete Draft BOQ', 4, 'Soft-delete eligible draft BOQ records.', 405, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(81, 'BUDGET', 'budget.view', 'View Project Budget', 1, 'View project budgets, lines and revisions.', 410, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(82, 'BUDGET', 'budget.create', 'Create Project Budget', 2, 'Create a project cost budget.', 411, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(83, 'BUDGET', 'budget.update', 'Update Project Budget', 3, 'Update draft project budget lines.', 412, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(84, 'BUDGET', 'budget.submit', 'Submit Project Budget', 5, 'Submit a project budget or revision.', 413, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(85, 'BUDGET', 'budget.approve', 'Approve Project Budget', 6, 'Approve or reject project budgets and revisions.', 414, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(86, 'BUDGET', 'budget.revise', 'Revise Project Budget', 3, 'Create controlled revisions for approved budgets.', 415, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(87, 'BUDGET', 'budget.export', 'Export Project Budget', 8, 'Export BOQ and project budget reports.', 416, 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(88, 'LABOUR', 'labour.view', 'View Labour', 1, 'View workers, contractors and project labour deployment.', 500, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(89, 'LABOUR', 'labour.create', 'Create Labour', 2, 'Create workers, contractors and project assignments.', 501, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(90, 'LABOUR', 'labour.update', 'Update Labour', 3, 'Update worker, contractor and assignment records.', 502, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(91, 'LABOUR', 'labour.documents', 'Manage Labour Documents', 9, 'Upload and verify worker identity and compliance documents.', 503, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(92, 'LABOUR', 'labour.assign', 'Assign Labour to Site', 9, 'Deploy workers to projects, sites and work zones.', 504, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(93, 'ATTENDANCE', 'attendance.view', 'View Labour Attendance', 1, 'View daily labour attendance and summaries.', 510, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(94, 'ATTENDANCE', 'attendance.create', 'Record Labour Attendance', 2, 'Prepare daily labour attendance entries.', 511, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(95, 'ATTENDANCE', 'attendance.submit', 'Submit Labour Attendance', 5, 'Submit daily labour attendance for approval.', 512, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(96, 'ATTENDANCE', 'attendance.approve', 'Approve Labour Attendance', 6, 'Approve, reject and lock labour attendance.', 513, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(97, 'WAGES', 'wages.view', 'View Labour Wages', 1, 'View wage periods, wage lines and payment status.', 520, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(98, 'WAGES', 'wages.calculate', 'Calculate Labour Wages', 2, 'Calculate wages from approved attendance.', 521, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(99, 'WAGES', 'wages.approve', 'Approve Labour Wages', 6, 'Approve or reject calculated wage periods.', 522, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(100, 'WAGES', 'wages.pay', 'Process Labour Payment', 9, 'Create, approve and record labour wage payments.', 523, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(101, 'WAGES', 'wages.export', 'Export Labour Reports', 8, 'Export muster roll, wage sheet and payment reports.', 524, 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(102, 'MATERIALS', 'materials.view', 'View Materials', 1, 'View material catalogue, requests, procurement and stock.', 600, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(103, 'MATERIALS', 'materials.manage_master', 'Manage Material Master', 9, 'Create and maintain material catalogue and suppliers.', 601, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(104, 'MATERIALS', 'materials.request', 'Create Material Request', 2, 'Create and submit site material requests.', 602, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(105, 'MATERIALS', 'materials.approve_request', 'Approve Material Request', 6, 'Approve or reject site material requests.', 603, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(106, 'PROCUREMENT', 'purchase_orders.view', 'View Purchase Orders', 1, 'View material purchase orders and delivery status.', 610, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(107, 'PROCUREMENT', 'purchase_orders.create', 'Create Purchase Order', 2, 'Create and submit material purchase orders.', 611, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(108, 'PROCUREMENT', 'purchase_orders.approve', 'Approve Purchase Order', 6, 'Approve, reject or cancel material purchase orders.', 612, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(109, 'MATERIAL_RECEIPT', 'material_receipts.view', 'View Material Receipts', 1, 'View site goods receipts and quality results.', 620, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(110, 'MATERIAL_RECEIPT', 'material_receipts.create', 'Record Material Receipt', 2, 'Record supplier challans and received quantities.', 621, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(111, 'MATERIAL_RECEIPT', 'material_receipts.inspect', 'Inspect Material Receipt', 9, 'Accept or reject materials after quality inspection.', 622, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(112, 'MATERIAL_RECEIPT', 'material_receipts.post', 'Post Material Receipt', 6, 'Post accepted material quantities into site stock.', 623, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(113, 'MATERIAL_STOCK', 'material_stock.view', 'View Material Stock', 1, 'View site stock ledger and material availability.', 630, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(114, 'MATERIAL_STOCK', 'material_stock.transact', 'Issue Return or Transfer Material', 9, 'Create material issue, return, transfer and adjustment transactions.', 631, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(115, 'MATERIAL_STOCK', 'material_stock.approve', 'Approve Stock Transaction', 6, 'Approve and post material stock transactions.', 632, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(116, 'MATERIAL_STOCK', 'material_stock.export', 'Export Material Reports', 8, 'Export material request, purchase, receipt and stock reports.', 633, 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(117, 'DAILY_REPORT', 'daily_reports.view', 'View Daily Site Reports', 1, 'View daily site reports, progress, manpower, equipment and attachments.', 700, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(118, 'DAILY_REPORT', 'daily_reports.create', 'Create Daily Site Report', 2, 'Create and edit draft daily site reports.', 701, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(119, 'DAILY_REPORT', 'daily_reports.submit', 'Submit Daily Site Report', 5, 'Submit a completed daily report for review.', 702, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(120, 'DAILY_REPORT', 'daily_reports.review', 'Review Daily Site Report', 9, 'Review submitted reports and record review observations.', 703, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(121, 'DAILY_REPORT', 'daily_reports.approve', 'Approve Daily Site Report', 6, 'Approve or reject submitted daily site reports.', 704, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(122, 'DAILY_REPORT', 'daily_reports.reopen', 'Reopen Daily Site Report', 9, 'Reopen an approved or rejected report for authorised correction.', 705, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(123, 'DAILY_REPORT', 'daily_reports.export', 'Export Daily Site Reports', 8, 'Export or print daily site reports and summaries.', 706, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(124, 'WORK_PROGRESS', 'work_progress.view', 'View Work Progress', 1, 'View BOQ-wise daily and cumulative project progress.', 710, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(125, 'WORK_PROGRESS', 'work_progress.record', 'Record Work Progress', 2, 'Record BOQ measurements and daily completed quantities.', 711, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(126, 'WORK_PROGRESS', 'work_progress.inspect', 'Inspect Work Progress', 9, 'Record quality inspection results against completed work.', 712, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(127, 'SITE_ISSUES', 'site_issues.view', 'View Site Issues', 1, 'View delays, safety, quality and other site issues.', 720, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(128, 'SITE_ISSUES', 'site_issues.manage', 'Manage Site Issues', 9, 'Create, assign, resolve and close site issues.', 721, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(129, 'SITE_PHOTOS', 'site_photos.manage', 'Manage Site Photos', 9, 'Upload and maintain geo-tagged site progress photos.', 730, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(130, 'SITE_VISITORS', 'site_visitors.manage', 'Manage Site Visitors', 9, 'Record site visitors, instructions and follow-up actions.', 731, 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(131, 'EXPENSE', 'expenses.view', 'View Expenses', 1, 'View requests, bills and cost allocations.', 800, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(132, 'EXPENSE', 'expenses.request', 'Create Expense Request', 2, 'Create and edit expense requests.', 801, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(133, 'EXPENSE', 'expenses.submit', 'Submit Expense', 5, 'Submit expense requests and bills.', 802, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(134, 'EXPENSE', 'expenses.approve_request', 'Approve Expense Request', 6, 'Approve or reject expense requests.', 803, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(135, 'EXPENSE', 'expenses.create_bill', 'Create Expense Bill', 2, 'Create supplier or site expense bills.', 804, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(136, 'EXPENSE', 'expenses.approve_bill', 'Approve Expense Bill', 6, 'Approve or reject expense bills.', 805, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(137, 'EXPENSE', 'expenses.post_bill', 'Post Expense Bill', 9, 'Post approved bills as actual project cost.', 806, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(138, 'EXPENSE', 'expenses.cancel', 'Cancel Expense', 9, 'Cancel authorised requests, bills or payments.', 807, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(139, 'EXPENSE', 'expenses.export', 'Export Expense Reports', 8, 'Export expense and outstanding reports.', 808, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(140, 'PAYMENT', 'expense_payments.view', 'View Expense Payments', 1, 'View project expense payments.', 810, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(141, 'PAYMENT', 'expense_payments.create', 'Create Expense Payment', 2, 'Prepare payment entries against bills.', 811, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(142, 'PAYMENT', 'expense_payments.approve', 'Approve Expense Payment', 6, 'Approve or reject expense payments.', 812, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(143, 'PAYMENT', 'expense_payments.pay', 'Release Expense Payment', 9, 'Mark approved payments as paid.', 813, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(144, 'PETTY_CASH', 'petty_cash.manage', 'Manage Petty Cash', 9, 'Maintain project petty cash accounts.', 820, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(145, 'COST_CONTROL', 'project_cost.view', 'View Project Cost Control', 1, 'View budget, commitment, actual and paid cost.', 830, 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(146, 'SUBCONTRACT', 'subcontractors.view', 'View Subcontractors', 1, 'View subcontractor master and documents.', 900, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(147, 'SUBCONTRACT', 'subcontractors.manage', 'Manage Subcontractors', 9, 'Create, update and verify subcontractors.', 901, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(148, 'SUBCONTRACT', 'work_orders.view', 'View Subcontract Work Orders', 1, 'View subcontract work orders and items.', 902, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(149, 'SUBCONTRACT', 'work_orders.create', 'Create Subcontract Work Order', 2, 'Create and edit subcontract work orders.', 903, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(150, 'SUBCONTRACT', 'work_orders.submit', 'Submit Subcontract Work Order', 5, 'Submit work orders for approval.', 904, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(151, 'SUBCONTRACT', 'work_orders.approve', 'Approve Subcontract Work Order', 6, 'Approve or reject subcontract work orders.', 905, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(152, 'SUBCONTRACT', 'measurements.view', 'View Subcontract Measurements', 1, 'View measurement books and lines.', 906, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(153, 'SUBCONTRACT', 'measurements.create', 'Create Subcontract Measurement', 2, 'Record measured subcontract work.', 907, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(154, 'SUBCONTRACT', 'measurements.approve', 'Approve Subcontract Measurement', 6, 'Verify and approve measurement records.', 908, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(155, 'SUBCONTRACT', 'ra_bills.view', 'View RA Bills', 1, 'View subcontractor running-account bills.', 909, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(156, 'SUBCONTRACT', 'ra_bills.create', 'Create RA Bill', 2, 'Prepare RA bills from approved measurements.', 910, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(157, 'SUBCONTRACT', 'ra_bills.certify', 'Certify RA Bill', 6, 'Verify, approve and certify RA bills.', 911, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(158, 'SUBCONTRACT', 'payments.view', 'View Subcontract Payments', 1, 'View contractor payment records.', 912, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(159, 'SUBCONTRACT', 'payments.create', 'Create Subcontract Payment', 2, 'Prepare payment against certified RA bills.', 913, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(160, 'SUBCONTRACT', 'payments.approve', 'Approve Subcontract Payment', 6, 'Approve and release subcontract payments.', 914, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(161, 'SUBCONTRACT', 'reports.export', 'Export Subcontract Reports', 8, 'Export work order, measurement, bill and payment reports.', 915, 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(162, 'DASHBOARD', 'dashboard.view', 'View Management Dashboard', 1, 'View project progress, cost and KPI dashboards.', 10, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(163, 'DASHBOARD', 'dashboard.refresh', 'Refresh Dashboard Snapshots', 9, 'Generate current progress, cost and KPI snapshots.', 20, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(164, 'DASHBOARD', 'dashboard.export', 'Export Dashboard', 8, 'Export dashboard information.', 30, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(165, 'ALERT', 'alert.view', 'View Dashboard Alerts', 1, 'View operational and management alerts.', 10, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(166, 'ALERT', 'alert.create', 'Create Dashboard Alerts', 2, 'Create manual dashboard alerts.', 20, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(167, 'ALERT', 'alert.manage', 'Manage Dashboard Alerts', 9, 'Assign, acknowledge, escalate and resolve alerts.', 30, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(168, 'CASHFLOW', 'cashflow.view', 'View Project Cash Flow', 1, 'View project cash-flow forecasts and actuals.', 10, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(169, 'CASHFLOW', 'cashflow.manage', 'Manage Project Cash Flow', 9, 'Create and revise project cash-flow forecasts.', 20, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(170, 'CASHFLOW', 'cashflow.approve', 'Approve Project Cash Flow', 6, 'Approve and lock project cash-flow forecasts.', 30, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(171, 'REPORT', 'report.view', 'View Management Reports', 1, 'View report catalogue and completed reports.', 10, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(172, 'REPORT', 'report.create', 'Run Management Reports', 2, 'Run reports with selected parameters.', 20, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(173, 'REPORT', 'report.export', 'Export Management Reports', 8, 'Download reports in approved formats.', 30, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(174, 'REPORT', 'report.manage', 'Manage Report Definitions', 9, 'Manage report definitions and schedules.', 40, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(175, 'MANAGEMENT_REVIEW', 'management_review.view', 'View Management Reviews', 1, 'View management review notes and actions.', 10, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(176, 'MANAGEMENT_REVIEW', 'management_review.manage', 'Manage Management Reviews', 9, 'Record decisions, assign actions and close reviews.', 20, 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(177, 'APPROVALS', 'approvals.view', 'View Approval Centre', 1, 'View the consolidated pending approval inbox, summary and history.', 1000, 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(178, 'APPROVALS', 'approvals.action', 'Process Approval Centre Actions', 6, 'Process permitted approve, reject, review, verify and certify actions from the approval centre.', 1001, 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(179, 'SYSTEM_ADMIN', 'system_admin.view', 'View System Administration', 1, 'View notification health, audit trail, login history and integrity checks.', 10, 1, '2026-08-04 21:16:00', '2026-08-04 21:16:00', NULL),
(180, 'SYSTEM_ADMIN', 'audit.create', 'Create Audit Event', 2, 'Create controlled application audit events.', 20, 1, '2026-08-04 21:16:00', '2026-08-04 21:16:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `permissions_action_type_masters`
--

CREATE TABLE `permissions_action_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type_code` varchar(60) NOT NULL,
  `action_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions_action_type_masters`
--

INSERT INTO `permissions_action_type_masters` (`id`, `action_type_code`, `action_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'VIEW', 'View', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'CREATE', 'Create', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'UPDATE', 'Update', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'DELETE', 'Delete', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'SUBMIT', 'Submit', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'APPROVE', 'Approve', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(7, 'REJECT', 'Reject', 7, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(8, 'EXPORT', 'Export', 8, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(9, 'MANAGE', 'Manage', 9, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_accounts`
--

CREATE TABLE `petty_cash_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `account_code` varchar(30) NOT NULL,
  `account_name` varchar(120) NOT NULL,
  `custodian_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `opening_balance` decimal(18,2) NOT NULL DEFAULT 0.00,
  `current_balance` decimal(18,2) NOT NULL DEFAULT 0.00,
  `maximum_balance` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `petty_cash_accounts`
--

INSERT INTO `petty_cash_accounts` (`id`, `company_id`, `project_id`, `site_id`, `account_code`, `account_name`, `custodian_user_id`, `opening_balance`, `current_balance`, `maximum_balance`, `status_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 'PC-EXPO-01', 'Main Site Petty Cash', NULL, 25000.00, 20000.00, 50000.00, 1, NULL, NULL, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_accounts_status_masters`
--

CREATE TABLE `petty_cash_accounts_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `petty_cash_accounts_status_masters`
--

INSERT INTO `petty_cash_accounts_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ACTIVE', 'Active', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'SUSPENDED', 'Suspended', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'CLOSED', 'Closed', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `priorities`
--

CREATE TABLE `priorities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `priority_code` varchar(50) NOT NULL,
  `priority_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `priorities`
--

INSERT INTO `priorities` (`id`, `priority_code`, `priority_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'LOW', 'Low', NULL, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'NORMAL', 'Normal', NULL, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'HIGH', 'High', NULL, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'CRITICAL', 'Critical', NULL, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `project_type_id` bigint(20) UNSIGNED NOT NULL,
  `financial_year_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_code` varchar(30) NOT NULL,
  `project_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `client_reference_no` varchar(80) DEFAULT NULL,
  `work_order_no` varchar(80) DEFAULT NULL,
  `work_order_date` date DEFAULT NULL,
  `contract_date` date DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `expected_completion_date` date DEFAULT NULL,
  `actual_completion_date` date DEFAULT NULL,
  `defect_liability_end_date` date DEFAULT NULL,
  `contract_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `approved_budget` decimal(18,2) NOT NULL DEFAULT 0.00,
  `billing_method_id` bigint(20) UNSIGNED NOT NULL,
  `retention_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `tax_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `currency_code` char(3) NOT NULL DEFAULT 'INR',
  `project_manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `site_engineer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `priority_id` bigint(20) UNSIGNED NOT NULL,
  `project_status_id` bigint(20) UNSIGNED NOT NULL,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `company_id`, `branch_id`, `client_id`, `project_type_id`, `financial_year_id`, `project_code`, `project_name`, `description`, `client_reference_no`, `work_order_no`, `work_order_date`, `contract_date`, `planned_start_date`, `actual_start_date`, `expected_completion_date`, `actual_completion_date`, `defect_liability_end_date`, `contract_value`, `approved_budget`, `billing_method_id`, `retention_percentage`, `tax_percentage`, `currency_code`, `project_manager_id`, `site_engineer_id`, `priority_id`, `project_status_id`, `progress_percentage`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'PRJ-2026-001', 'Greenfield Residency - Phase 1', 'Demonstration residential construction project for the expo workflow.', 'GF/DEV/2026/014', 'GF-WO-2026-001', '2026-07-15', '2026-07-18', '2026-08-01', NULL, '2027-07-31', NULL, NULL, 48500000.00, 2000000.00, 2, 5.0000, 18.0000, 'INR', NULL, NULL, 3, 3, 0.0000, 'Sample project. BOQ and budget details will be added in Phase 4.', NULL, 1, '2026-07-23 20:21:04', '2026-07-26 21:36:32', NULL),
(2, 1, 1, 1, 1, 1, 'PRJ-API-001', 'API Test Construction Project Updated', 'Project Master API test', 'CLIENT-REF-API-001-UPDATED', 'WO-API-001', '2026-07-26', '2026-07-26', '2026-08-05', NULL, '2027-04-30', NULL, NULL, 15000000.00, 12500000.00, 2, 7.5000, 18.0000, 'INR', 3, 4, 3, 1, 10.0000, 'Updated through Project Master API', 1, 1, '2026-07-26 15:36:56', '2026-07-26 15:38:27', '2026-07-26 15:38:27');

-- --------------------------------------------------------

--
-- Table structure for table `project_boqs`
--

CREATE TABLE `project_boqs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `boq_code` varchar(40) NOT NULL,
  `boq_name` varchar(180) NOT NULL,
  `version_no` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `revision_no` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `boq_date` date NOT NULL,
  `valid_from` date DEFAULT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'INR',
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `total_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_boqs`
--

INSERT INTO `project_boqs` (`id`, `company_id`, `project_id`, `boq_code`, `boq_name`, `version_no`, `revision_no`, `boq_date`, `valid_from`, `currency_code`, `status_id`, `total_amount`, `notes`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'BOQ-001', 'Greenfield Residency Approved BOQ', 1, 0, '2026-07-23', '2026-08-01', 'INR', 3, 2162500.00, 'Sample BOQ for expo demonstration.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 1, 'BOQ-API-001', 'Greenfield Residency Main BOQ - Revised', 1, 0, '2026-08-01', '2026-08-01', 'INR', 2, 1000000.00, 'Draft BOQ updated through API test', 1, '2026-08-01 06:11:07', NULL, NULL, 1, 1, '2026-08-01 06:07:26', '2026-08-01 11:41:07', NULL),
(3, 1, 1, 'BOQ-API-002', 'Greenfield Residency Notification Test BOQ', 1, 0, '2026-08-01', '2026-08-01', 'INR', 2, 1500000.00, 'Testing access-controlled BOQ notification and email', 1, '2026-08-01 06:27:33', NULL, NULL, 1, 1, '2026-08-01 06:26:37', '2026-08-01 11:57:33', NULL),
(4, 1, 1, 'BOQ-EMAIL-001', 'BOQ Email Delivery Test', 1, 0, '2026-08-01', '2026-08-01', 'INR', 2, 2000000.00, 'Testing corrected Gmail SMTP configuration', 1, '2026-08-01 07:28:02', NULL, NULL, 1, 1, '2026-08-01 07:27:12', '2026-08-01 12:58:02', NULL),
(5, 1, 1, 'BOQ-EMAIL-002', 'BOQ Email Delivery Retest', 1, 0, '2026-08-01', '2026-08-01', 'INR', 3, 2500000.00, 'Email retest after correcting SMTP newline settings', 1, '2026-08-01 07:34:26', 6, '2026-08-03 06:02:57', 1, 6, '2026-08-01 07:33:44', '2026-08-03 11:32:57', NULL),
(6, 1, 1, 'BOQ-EMAIL-003', 'Final BOQ Two-Way Email Test', 1, 0, '2026-08-03', '2026-08-03', 'INR', 3, 3000000.00, 'Final submission and approval email test', 1, '2026-08-03 06:19:40', 6, '2026-08-03 06:20:51', 1, 6, '2026-08-03 06:18:42', '2026-08-03 11:50:51', NULL),
(7, 1, 1, 'BOQ-EMAIL-004', 'Final SMTP Retest', 1, 0, '2026-08-03', '2026-08-03', 'INR', 3, 3500000.00, 'Retest after SMTP connectivity verification', 1, '2026-08-03 06:35:08', 6, '2026-08-03 06:36:16', 1, 6, '2026-08-03 06:33:42', '2026-08-03 12:06:16', NULL),
(8, 1, 1, 'BOQ-SEC-5951', 'Complete BOQ Sections API Test', 1, 0, '2026-08-03', '2026-08-03', 'INR', 3, 135000.00, 'Complete BOQ Sections testing', 1, '2026-08-03 10:43:49', 1, '2026-08-03 10:43:57', 1, 1, '2026-08-03 06:52:46', '2026-08-03 16:13:57', NULL),
(9, 1, 1, 'BOQ-REJECT-10173', 'BOQ Rejection Workflow Test', 1, 0, '2026-08-03', '2026-08-03', 'INR', 4, 0.00, 'Created only for rejection workflow API testing', 1, '2026-08-03 10:44:04', NULL, NULL, 1, 1, '2026-08-03 10:44:04', '2026-08-03 16:14:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_boqs_status_masters`
--

CREATE TABLE `project_boqs_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_boqs_status_masters`
--

INSERT INTO `project_boqs_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'UNDER_REVIEW', 'Under Review', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'SUPERSEDED', 'Superseded', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `project_budgets`
--

CREATE TABLE `project_budgets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `financial_year_id` bigint(20) UNSIGNED DEFAULT NULL,
  `source_boq_id` bigint(20) UNSIGNED DEFAULT NULL,
  `budget_code` varchar(40) NOT NULL,
  `budget_name` varchar(180) NOT NULL,
  `version_no` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `budget_date` date NOT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'INR',
  `direct_cost` decimal(18,2) NOT NULL DEFAULT 0.00,
  `overhead_cost` decimal(18,2) NOT NULL DEFAULT 0.00,
  `contingency_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_budget` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_budgets`
--

INSERT INTO `project_budgets` (`id`, `company_id`, `project_id`, `financial_year_id`, `source_boq_id`, `budget_code`, `budget_name`, `version_no`, `budget_date`, `currency_code`, `direct_cost`, `overhead_cost`, `contingency_amount`, `total_budget`, `status_id`, `notes`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'BUD-001', 'Greenfield Residency Initial Cost Budget', 1, '2026-07-23', 'INR', 1775000.00, 125000.00, 100000.00, 2000000.00, 3, 'Sample internal budget linked to the approved BOQ.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 1, NULL, 8, 'BUD-API-20376', 'Updated Project Budget Core API Test', 1, '2026-08-03', 'INR', 20000.00, 0.00, 500.00, 20500.00, 3, 'Header update verified', 1, '2026-08-03 11:19:22', 1, '2026-08-03 11:19:25', 1, 1, '2026-08-03 11:06:13', '2026-08-03 17:16:52', NULL),
(3, 1, 1, NULL, 8, 'BUD-DEL-31774', 'Temporary Budget Delete Test', 1, '2026-08-03', 'INR', 0.00, 0.00, 0.00, 0.00, 1, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-08-03 11:06:21', '2026-08-03 11:06:21', '2026-08-03 11:06:21'),
(4, 1, 1, NULL, 8, 'BUD-REJECT-7540', 'Budget Rejection Workflow Test', 1, '2026-08-03', 'INR', 5000.00, 0.00, 0.00, 5000.00, 4, 'Created for rejection workflow testing', 1, '2026-08-03 11:19:55', NULL, NULL, 1, 1, '2026-08-03 11:19:54', '2026-08-03 16:49:55', NULL),
(5, 1, 1, NULL, 8, 'BUD-EMPTY-26698', 'Empty Budget Submission Test', 1, '2026-08-03', 'INR', 0.00, 0.00, 0.00, 0.00, 1, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-08-03 11:20:24', '2026-08-03 11:20:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_budgets_status_masters`
--

CREATE TABLE `project_budgets_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_budgets_status_masters`
--

INSERT INTO `project_budgets_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'REVISED', 'Revised', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'CLOSED', 'Closed', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `project_budget_lines`
--

CREATE TABLE `project_budget_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `budget_id` bigint(20) UNSIGNED NOT NULL,
  `boq_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_category_id` bigint(20) UNSIGNED NOT NULL,
  `cost_type_id` bigint(20) UNSIGNED NOT NULL,
  `line_code` varchar(50) NOT NULL,
  `line_description` varchar(250) NOT NULL,
  `planned_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `uom_id` bigint(20) UNSIGNED DEFAULT NULL,
  `planned_rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `planned_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `committed_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `actual_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_budget_lines`
--

INSERT INTO `project_budget_lines` (`id`, `company_id`, `project_id`, `budget_id`, `boq_item_id`, `site_id`, `work_zone_id`, `work_category_id`, `cost_type_id`, `line_code`, `line_description`, `planned_quantity`, `uom_id`, `planned_rate`, `planned_amount`, `committed_amount`, `actual_amount`, `display_order`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 3, 1, 'BUD-MAT-001', 'Foundation concrete and reinforcement material', 250.0000, 4, 4700.0000, 1175000.00, 0.00, 0.00, 10, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(2, 1, 1, 1, 1, 1, 1, 3, 2, 'BUD-LAB-001', 'Foundation concrete labour', 250.0000, 4, 1100.0000, 275000.00, 0.00, 0.00, 20, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(3, 1, 1, 1, 2, 1, 1, 5, 1, 'BUD-MAT-002', 'Block masonry material and labour provision', 500.0000, 3, 650.0000, 325000.00, 0.00, 0.00, 30, NULL, NULL, NULL, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(4, 1, 1, 2, 4, NULL, NULL, 1, 1, 'MAT-13117', 'Updated foundation excavation material budget', 16.0000, 1, 1250.0000, 20000.00, 0.00, 0.00, 15, 'Material line API test', 1, 1, '2026-08-03 11:06:16', '2026-08-03 11:46:52', NULL),
(5, 1, 1, 2, NULL, NULL, NULL, 1, 5, 'OVH-7424', 'Project supervision overhead', 2.0000, 1, 500.0000, 1000.00, 0.00, 0.00, 20, 'Overhead line API test', 1, 1, '2026-08-03 11:06:16', '2026-08-03 11:46:52', '2026-08-03 11:46:52'),
(6, 1, 1, 2, NULL, NULL, NULL, 1, 6, 'CON-8898', 'Budget contingency provision', 1.0000, 1, 500.0000, 500.00, 0.00, 0.00, 30, 'Contingency line API test', 1, 1, '2026-08-03 11:06:16', '2026-08-03 11:06:16', NULL),
(7, 1, 1, 2, NULL, NULL, NULL, 1, 7, 'TMP-14090', 'Temporary line for deletion', 1.0000, 1, 250.0000, 250.00, 0.00, 0.00, 99, 'Delete after testing', 1, 1, '2026-08-03 11:06:17', '2026-08-03 11:06:20', '2026-08-03 11:06:20'),
(8, 1, 1, 4, NULL, NULL, NULL, 1, 1, 'REJ-LINE-26564', 'Rejection workflow material line', 5.0000, 1, 1000.0000, 5000.00, 0.00, 5000.00, 10, NULL, 1, 1, '2026-08-03 11:19:54', '2026-08-04 20:12:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_budget_lines_cost_type_masters`
--

CREATE TABLE `project_budget_lines_cost_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cost_type_code` varchar(60) NOT NULL,
  `cost_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_budget_lines_cost_type_masters`
--

INSERT INTO `project_budget_lines_cost_type_masters` (`id`, `cost_type_code`, `cost_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MATERIAL', 'Material', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'LABOUR', 'Labour', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'EQUIPMENT', 'Equipment', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'SUBCONTRACT', 'Subcontract', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(5, 'OVERHEAD', 'Overhead', 5, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(6, 'CONTINGENCY', 'Contingency', 6, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(7, 'OTHER', 'Other', 7, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `project_cashflow_forecasts`
--

CREATE TABLE `project_cashflow_forecasts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `financial_year_id` bigint(20) UNSIGNED DEFAULT NULL,
  `forecast_month` date NOT NULL,
  `version_no` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `expected_client_inflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `planned_material_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `planned_labour_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `planned_subcontract_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `planned_expense_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_planned_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `forecast_net_cashflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `actual_inflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `actual_outflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `actual_net_cashflow` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_cashflow_forecasts_status_masters`
--

CREATE TABLE `project_cashflow_forecasts_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_cashflow_forecasts_status_masters`
--

INSERT INTO `project_cashflow_forecasts_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'APPROVED', 'Approved', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(3, 'LOCKED', 'Locked', 3, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(4, 'SUPERSEDED', 'Superseded', 4, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `project_cost_snapshots`
--

CREATE TABLE `project_cost_snapshots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `snapshot_date` date NOT NULL,
  `snapshot_level_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `approved_budget` decimal(18,2) NOT NULL DEFAULT 0.00,
  `revised_budget` decimal(18,2) NOT NULL DEFAULT 0.00,
  `material_commitment` decimal(18,2) NOT NULL DEFAULT 0.00,
  `subcontract_commitment` decimal(18,2) NOT NULL DEFAULT 0.00,
  `expense_commitment` decimal(18,2) NOT NULL DEFAULT 0.00,
  `material_actual` decimal(18,2) NOT NULL DEFAULT 0.00,
  `labour_actual` decimal(18,2) NOT NULL DEFAULT 0.00,
  `subcontract_actual` decimal(18,2) NOT NULL DEFAULT 0.00,
  `site_expense_actual` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_actual_cost` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_paid` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_outstanding` decimal(18,2) NOT NULL DEFAULT 0.00,
  `forecast_cost_at_completion` decimal(18,2) NOT NULL DEFAULT 0.00,
  `budget_variance` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cost_consumed_percent` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `data_upto` datetime DEFAULT NULL,
  `generated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_cost_snapshots`
--

INSERT INTO `project_cost_snapshots` (`id`, `company_id`, `project_id`, `site_id`, `snapshot_date`, `snapshot_level_id`, `approved_budget`, `revised_budget`, `material_commitment`, `subcontract_commitment`, `expense_commitment`, `material_actual`, `labour_actual`, `subcontract_actual`, `site_expense_actual`, `total_actual_cost`, `total_paid`, `total_outstanding`, `forecast_cost_at_completion`, `budget_variance`, `cost_consumed_percent`, `data_upto`, `generated_by`, `generated_at`, `created_at`) VALUES
(1, 1, 1, NULL, '2026-07-23', 1, 2000000.00, 2000000.00, 0.00, 236000.00, 11800.00, 0.00, 0.00, 53050.00, 11800.00, 64850.00, 35000.00, 29850.00, 0.00, 0.00, 0.0000, '2026-07-23 21:20:48', NULL, '2026-07-23 21:20:48', '2026-07-23 21:20:48'),
(2, 1, 1, NULL, '2026-08-04', 1, 2020500.00, 2020500.00, 0.00, 247800.00, 12800.00, 0.00, 0.00, 55050.00, 12800.00, 67850.00, 37000.00, 30850.00, 2020500.00, 0.00, 3.3581, '2026-08-04 14:13:18', 1, '2026-08-04 14:13:18', '2026-08-04 19:43:18'),
(3, 1, 1, NULL, '2026-08-04', 1, 2020500.00, 2020500.00, 0.00, 247800.00, 13800.00, 0.00, 0.00, 55050.00, 13800.00, 68850.00, 38000.00, 30850.00, 2020500.00, 0.00, 3.4076, '2026-08-04 14:18:16', 1, '2026-08-04 14:18:16', '2026-08-04 19:48:16'),
(4, 1, 1, NULL, '2026-08-04', 1, 2020500.00, 2020500.00, 0.00, 247800.00, 14800.00, 0.00, 0.00, 55050.00, 14800.00, 69850.00, 39000.00, 30850.00, 2020500.00, 0.00, 3.4571, '2026-08-04 14:20:36', 1, '2026-08-04 14:20:36', '2026-08-04 19:50:36'),
(5, 1, 1, NULL, '2026-08-04', 1, 2020500.00, 2020500.00, 0.00, 247800.00, 15800.00, 0.00, 0.00, 55050.00, 15800.00, 70850.00, 40000.00, 30850.00, 2020500.00, 0.00, 3.5066, '2026-08-04 14:34:39', 1, '2026-08-04 14:34:39', '2026-08-04 20:04:39'),
(6, 1, 1, NULL, '2026-08-04', 1, 2020500.00, 2020500.00, 0.00, 247800.00, 16800.00, 0.00, 0.00, 55050.00, 16800.00, 71850.00, 41000.00, 30850.00, 2020500.00, 0.00, 3.5561, '2026-08-04 14:43:05', 1, '2026-08-04 14:43:05', '2026-08-04 20:13:05');

-- --------------------------------------------------------

--
-- Table structure for table `project_cost_snapshots_snapshot_level_masters`
--

CREATE TABLE `project_cost_snapshots_snapshot_level_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `snapshot_level_code` varchar(60) NOT NULL,
  `snapshot_level_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_cost_snapshots_snapshot_level_masters`
--

INSERT INTO `project_cost_snapshots_snapshot_level_masters` (`id`, `snapshot_level_code`, `snapshot_level_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT', 'Project', 1, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46'),
(2, 'SITE', 'Site', 2, 1, '2026-07-26 12:38:46', '2026-07-26 12:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `project_documents`
--

CREATE TABLE `project_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_type_id` bigint(20) UNSIGNED NOT NULL,
  `document_code` varchar(50) DEFAULT NULL,
  `document_title` varchar(200) NOT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `revision_number` varchar(30) DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `storage_path` varchar(700) NOT NULL,
  `file_extension` varchar(20) DEFAULT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `file_size_bytes` bigint(20) UNSIGNED DEFAULT NULL,
  `file_hash_sha256` char(64) DEFAULT NULL,
  `version_number` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `remarks` varchar(500) DEFAULT NULL,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_documents_status_masters`
--

CREATE TABLE `project_documents_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_documents_status_masters`
--

INSERT INTO `project_documents_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'REJECTED', 'Rejected', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'SUPERSEDED', 'Superseded', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(6, 'ARCHIVED', 'Archived', 6, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_kpi_snapshots`
--

CREATE TABLE `project_kpi_snapshots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `snapshot_date` date NOT NULL,
  `kpi_code` varchar(60) NOT NULL,
  `kpi_name` varchar(150) NOT NULL,
  `kpi_group_id` bigint(20) UNSIGNED NOT NULL,
  `numeric_value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `target_value` decimal(20,4) DEFAULT NULL,
  `unit_label` varchar(30) DEFAULT NULL,
  `trend_direction_id` bigint(20) UNSIGNED NOT NULL DEFAULT 4,
  `health_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 5,
  `source_reference` varchar(250) DEFAULT NULL,
  `generated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_kpi_snapshots`
--

INSERT INTO `project_kpi_snapshots` (`id`, `company_id`, `project_id`, `site_id`, `snapshot_date`, `kpi_code`, `kpi_name`, `kpi_group_id`, `numeric_value`, `target_value`, `unit_label`, `trend_direction_id`, `health_status_id`, `source_reference`, `generated_by`, `generated_at`) VALUES
(1, 1, 1, NULL, '2026-07-23', 'PHYSICAL_PROGRESS', 'Physical Progress', 1, 22.5000, 25.0000, '%', 1, 2, 'project_progress_snapshots', NULL, '2026-07-23 21:20:48');

-- --------------------------------------------------------

--
-- Table structure for table `project_kpi_snapshots_health_status_masters`
--

CREATE TABLE `project_kpi_snapshots_health_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `health_status_code` varchar(60) NOT NULL,
  `health_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_kpi_snapshots_health_status_masters`
--

INSERT INTO `project_kpi_snapshots_health_status_masters` (`id`, `health_status_code`, `health_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GOOD', 'Good', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'WATCH', 'Watch', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'WARNING', 'Warning', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'CRITICAL', 'Critical', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'NOT_AVAILABLE', 'Not Available', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_kpi_snapshots_kpi_group_masters`
--

CREATE TABLE `project_kpi_snapshots_kpi_group_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kpi_group_code` varchar(60) NOT NULL,
  `kpi_group_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_kpi_snapshots_kpi_group_masters`
--

INSERT INTO `project_kpi_snapshots_kpi_group_masters` (`id`, `kpi_group_code`, `kpi_group_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROGRESS', 'Progress', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'COST', 'Cost', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'TIME', 'Time', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'LABOUR', 'Labour', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'MATERIAL', 'Material', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(6, 'QUALITY', 'Quality', 6, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(7, 'SAFETY', 'Safety', 7, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(8, 'CASHFLOW', 'Cashflow', 8, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_kpi_snapshots_trend_direction_masters`
--

CREATE TABLE `project_kpi_snapshots_trend_direction_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `trend_direction_code` varchar(60) NOT NULL,
  `trend_direction_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_kpi_snapshots_trend_direction_masters`
--

INSERT INTO `project_kpi_snapshots_trend_direction_masters` (`id`, `trend_direction_code`, `trend_direction_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UP', 'Up', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'DOWN', 'Down', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'FLAT', 'Flat', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'NOT_AVAILABLE', 'Not Available', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_progress_snapshots`
--

CREATE TABLE `project_progress_snapshots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `snapshot_date` date NOT NULL,
  `snapshot_level_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `planned_progress_percent` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `actual_progress_percent` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `variance_percent` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `boq_total_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `completed_work_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_boq_items` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `completed_boq_items` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `open_issue_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `critical_issue_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `lost_hours` decimal(12,2) NOT NULL DEFAULT 0.00,
  `data_upto` datetime DEFAULT NULL,
  `generation_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `generated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_progress_snapshots`
--

INSERT INTO `project_progress_snapshots` (`id`, `company_id`, `project_id`, `site_id`, `snapshot_date`, `snapshot_level_id`, `planned_progress_percent`, `actual_progress_percent`, `variance_percent`, `boq_total_amount`, `completed_work_value`, `total_boq_items`, `completed_boq_items`, `open_issue_count`, `critical_issue_count`, `lost_hours`, `data_upto`, `generation_status_id`, `generated_by`, `generated_at`, `remarks`, `created_at`) VALUES
(1, 1, 1, NULL, '2026-07-23', 1, 25.0000, 22.5000, -2.5000, 2162500.00, 53100.00, 2, 0, 1, 0, 2.00, '2026-07-23 21:20:48', 2, NULL, '2026-07-23 21:20:48', 'Expo dashboard sample snapshot', '2026-07-23 21:20:48');

-- --------------------------------------------------------

--
-- Table structure for table `project_progress_snapshots_generation_status_masters`
--

CREATE TABLE `project_progress_snapshots_generation_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `generation_status_code` varchar(60) NOT NULL,
  `generation_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_progress_snapshots_generation_status_masters`
--

INSERT INTO `project_progress_snapshots_generation_status_masters` (`id`, `generation_status_code`, `generation_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GENERATING', 'Generating', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'READY', 'Ready', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'FAILED', 'Failed', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_progress_snapshots_snapshot_level_masters`
--

CREATE TABLE `project_progress_snapshots_snapshot_level_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `snapshot_level_code` varchar(60) NOT NULL,
  `snapshot_level_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_progress_snapshots_snapshot_level_masters`
--

INSERT INTO `project_progress_snapshots_snapshot_level_masters` (`id`, `snapshot_level_code`, `snapshot_level_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT', 'Project', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'SITE', 'Site', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `project_sites`
--

CREATE TABLE `project_sites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_code` varchar(30) NOT NULL,
  `site_name` varchar(180) NOT NULL,
  `site_type_id` bigint(20) UNSIGNED NOT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `landmark` varchar(150) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'IN',
  `postal_code` varchar(12) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `geofence_radius_m` int(10) UNSIGNED DEFAULT NULL,
  `contact_name` varchar(120) DEFAULT NULL,
  `contact_phone` varchar(25) DEFAULT NULL,
  `site_engineer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `supervisor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `expected_end_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `site_status_id` bigint(20) UNSIGNED NOT NULL,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_sites`
--

INSERT INTO `project_sites` (`id`, `company_id`, `project_id`, `site_code`, `site_name`, `site_type_id`, `address_line1`, `address_line2`, `landmark`, `city`, `district`, `state_name`, `state_code`, `country_code`, `postal_code`, `latitude`, `longitude`, `geofence_radius_m`, `contact_name`, `contact_phone`, `site_engineer_id`, `supervisor_id`, `planned_start_date`, `actual_start_date`, `expected_end_date`, `actual_end_date`, `site_status_id`, `progress_percentage`, `is_primary`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'SITE-01', 'Greenfield Residency Main Site', 1, 'Survey No. 214/3, Avinashi Road', 'Peelamedu', 'Near CODISSIA Trade Fair Complex', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641014', 11.0308000, 77.0399000, 250, 'Site Office', '+91-9876500010', NULL, NULL, '2026-08-01', NULL, '2027-07-31', NULL, 2, 0.0000, 1, 'Primary demonstration site.', NULL, NULL, '2026-07-23 20:21:04', '2026-07-26 17:14:48', NULL),
(2, 1, 1, 'SITE_API_29874', 'API Test Construction Site Updated', 2, '250 Updated API Road', 'Updated Test Layout', 'Near Updated Junction', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '33', 'IN', '641004', 11.0250000, 76.9660000, 250, 'Updated Site Contact', '9111111111', NULL, NULL, '2026-08-05', NULL, '2027-08-15', NULL, 3, 5.5000, 0, 'Updated through Site Register API', 1, 1, '2026-07-27 14:28:29', '2026-07-27 14:39:02', '2026-07-27 14:39:02');

-- --------------------------------------------------------

--
-- Table structure for table `project_statuses`
--

CREATE TABLE `project_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_final` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_statuses`
--

INSERT INTO `project_statuses` (`id`, `status_code`, `status_name`, `description`, `is_final`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', NULL, 0, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'PLANNED', 'Planned', NULL, 0, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'ACTIVE', 'Active', NULL, 0, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'ON_HOLD', 'On Hold', NULL, 0, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(5, 'COMPLETED', 'Completed', NULL, 1, 5, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(6, 'CANCELLED', 'Cancelled', NULL, 1, 6, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `project_status_logs`
--

CREATE TABLE `project_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `from_status_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_status_id` bigint(20) UNSIGNED NOT NULL,
  `change_reason` varchar(500) DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_status_logs`
--

INSERT INTO `project_status_logs` (`id`, `company_id`, `project_id`, `from_status_id`, `to_status_id`, `change_reason`, `changed_by`, `changed_at`) VALUES
(1, 1, 1, NULL, 2, 'Project created using Phase 3 demonstration data.', NULL, '2026-07-23 20:21:04'),
(2, 1, 2, NULL, 1, 'Project created.', 1, '2026-07-26 21:06:56'),
(3, 1, 1, 2, 3, 'Project activated through controlled status API test.', 1, '2026-07-26 21:36:32');

-- --------------------------------------------------------

--
-- Table structure for table `project_team_members`
--

CREATE TABLE `project_team_members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `team_role_id` bigint(20) UNSIGNED DEFAULT NULL,
  `responsibility` varchar(500) DEFAULT NULL,
  `assignment_start` date DEFAULT NULL,
  `assignment_end` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `can_approve` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_team_members`
--

INSERT INTO `project_team_members` (`id`, `company_id`, `project_id`, `user_id`, `team_role_id`, `responsibility`, `assignment_start`, `assignment_end`, `is_primary`, `can_approve`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 3, 1, 'Overall project planning, execution and approval', '2026-07-26', '2027-04-30', 1, 1, 0, 1, 1, '2026-07-26 16:25:07', '2026-07-26 16:26:57', '2026-07-26 16:26:57');

-- --------------------------------------------------------

--
-- Table structure for table `project_team_roles`
--

CREATE TABLE `project_team_roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_team_roles`
--

INSERT INTO `project_team_roles` (`id`, `role_code`, `role_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT_MANAGER', 'Project Manager', NULL, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'SITE_ENGINEER', 'Site Engineer', NULL, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'SUPERVISOR', 'Supervisor', NULL, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'PLANNING_ENGINEER', 'Planning Engineer', NULL, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(5, 'QUANTITY_SURVEYOR', 'Quantity Surveyor', NULL, 5, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(6, 'SAFETY_OFFICER', 'Safety Officer', NULL, 6, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(7, 'STORE_KEEPER', 'Store Keeper', NULL, 7, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(8, 'ACCOUNTS', 'Accounts', NULL, 8, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(9, 'VIEWER', 'Viewer', NULL, 9, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(10, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `project_types`
--

CREATE TABLE `project_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_type_code` varchar(30) NOT NULL,
  `project_type_name` varchar(120) NOT NULL,
  `billing_method_id` bigint(20) UNSIGNED NOT NULL,
  `default_duration_days` int(10) UNSIGNED DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_types`
--

INSERT INTO `project_types` (`id`, `company_id`, `project_type_code`, `project_type_name`, `billing_method_id`, `default_duration_days`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'RESIDENTIAL', 'Residential Building', 2, 365, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 17:14:48', NULL),
(2, 1, 'COMMERCIAL', 'Commercial Building', 2, 540, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 17:14:48', NULL),
(3, 1, 'INDUSTRIAL', 'Industrial Building', 5, 365, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 17:14:48', NULL),
(4, 1, 'RENOVATION', 'Renovation and Interior', 1, 120, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 17:14:48', NULL),
(5, 1, 'INFRASTRUCTURE', 'Infrastructure Works', 2, 730, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-26 17:14:48', NULL),
(6, 1, 'API_TEST_WORKS', 'API Test Civil Works', 5, 240, 'Updated through Project Type API', 95, 1, 1, 1, '2026-07-26 15:23:45', '2026-07-26 15:25:42', '2026-07-26 15:25:42');

-- --------------------------------------------------------

--
-- Table structure for table `report_definitions`
--

CREATE TABLE `report_definitions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `report_code` varchar(60) NOT NULL,
  `report_name` varchar(180) NOT NULL,
  `report_group_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `output_formats` varchar(100) NOT NULL DEFAULT 'PDF,XLSX',
  `parameter_schema` longtext DEFAULT NULL,
  `template_key` varchar(120) DEFAULT NULL,
  `is_system_report` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_definitions`
--

INSERT INTO `report_definitions` (`id`, `company_id`, `report_code`, `report_name`, `report_group_id`, `description`, `output_formats`, `parameter_schema`, `template_key`, `is_system_report`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'PROJECT_HEALTH', 'Project Health Report', 8, 'One-page progress, cost, issues, cash-flow and risk summary.', 'PDF,XLSX', NULL, 'project_health', 1, 1, NULL, NULL, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(2, 1, 'BUDGET_VS_ACTUAL', 'Budget versus Actual', 3, 'Budget, commitment, actual, paid and outstanding comparison.', 'PDF,XLSX', NULL, 'budget_vs_actual', 1, 1, NULL, NULL, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `report_definitions_report_group_masters`
--

CREATE TABLE `report_definitions_report_group_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `report_group_code` varchar(60) NOT NULL,
  `report_group_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_definitions_report_group_masters`
--

INSERT INTO `report_definitions_report_group_masters` (`id`, `report_group_code`, `report_group_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT', 'Project', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'PROGRESS', 'Progress', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'COST', 'Cost', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'LABOUR', 'Labour', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'MATERIAL', 'Material', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(6, 'EXPENSE', 'Expense', 6, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(7, 'CONTRACTOR', 'Contractor', 7, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(8, 'MANAGEMENT', 'Management', 8, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `report_runs`
--

CREATE TABLE `report_runs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `report_definition_id` bigint(20) UNSIGNED NOT NULL,
  `report_schedule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `run_no` varchar(50) NOT NULL,
  `run_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `requested_parameters` longtext DEFAULT NULL,
  `output_format_id` bigint(20) UNSIGNED NOT NULL DEFAULT 4,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size_bytes` bigint(20) UNSIGNED DEFAULT NULL,
  `row_count` int(10) UNSIGNED DEFAULT NULL,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_runs_output_format_masters`
--

CREATE TABLE `report_runs_output_format_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `output_format_code` varchar(60) NOT NULL,
  `output_format_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_runs_output_format_masters`
--

INSERT INTO `report_runs_output_format_masters` (`id`, `output_format_code`, `output_format_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PDF', 'Pdf', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'XLSX', 'Xlsx', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'CSV', 'Csv', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'SCREEN', 'Screen', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `report_runs_run_type_masters`
--

CREATE TABLE `report_runs_run_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `run_type_code` varchar(60) NOT NULL,
  `run_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_runs_run_type_masters`
--

INSERT INTO `report_runs_run_type_masters` (`id`, `run_type_code`, `run_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MANUAL', 'Manual', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'SCHEDULED', 'Scheduled', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'API', 'Api', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `report_runs_status_masters`
--

CREATE TABLE `report_runs_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_runs_status_masters`
--

INSERT INTO `report_runs_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'QUEUED', 'Queued', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'RUNNING', 'Running', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'COMPLETED', 'Completed', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'FAILED', 'Failed', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `report_schedules`
--

CREATE TABLE `report_schedules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `report_definition_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `schedule_name` varchar(180) NOT NULL,
  `frequency_id` bigint(20) UNSIGNED NOT NULL,
  `run_time` time NOT NULL DEFAULT '08:00:00',
  `day_of_week` tinyint(3) UNSIGNED DEFAULT NULL,
  `day_of_month` tinyint(3) UNSIGNED DEFAULT NULL,
  `parameter_values` longtext DEFAULT NULL,
  `output_format_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `recipient_emails` text DEFAULT NULL,
  `next_run_at` datetime DEFAULT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_schedules_frequency_masters`
--

CREATE TABLE `report_schedules_frequency_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `frequency_code` varchar(60) NOT NULL,
  `frequency_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_schedules_frequency_masters`
--

INSERT INTO `report_schedules_frequency_masters` (`id`, `frequency_code`, `frequency_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DAILY', 'Daily', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'WEEKLY', 'Weekly', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'MONTHLY', 'Monthly', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'QUARTERLY', 'Quarterly', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `report_schedules_output_format_masters`
--

CREATE TABLE `report_schedules_output_format_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `output_format_code` varchar(60) NOT NULL,
  `output_format_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_schedules_output_format_masters`
--

INSERT INTO `report_schedules_output_format_masters` (`id`, `output_format_code`, `output_format_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PDF', 'Pdf', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'XLSX', 'Xlsx', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'CSV', 'Csv', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `role_code` varchar(60) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `role_scope_id` bigint(20) UNSIGNED NOT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `company_id`, `role_code`, `role_name`, `description`, `role_scope_id`, `is_system_role`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'COMPANY_ADMIN', 'Company Administrator', 'Full company configuration and access-control authority.', 1, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(2, 1, 'PROJECT_MANAGER', 'Project Manager', 'Manages assigned projects, approvals, progress and project cost.', 3, 1, 1, NULL, 1, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(3, 1, 'SITE_ENGINEER', 'Site Engineer', 'Records and manages day-to-day site execution information.', 4, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(4, 1, 'SUPERVISOR', 'Site Supervisor', 'Verifies labour, material and daily site execution entries.', 4, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(5, 1, 'ACCOUNTS', 'Accounts User', 'Verifies expenses, billing, receipts and project financial information.', 1, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(6, 1, 'VIEWER', 'Management Viewer', 'Read-only dashboard and report access.', 1, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-26 16:26:09', NULL),
(7, 1, 'BOQ_APPROVER', 'BOQ Approver', 'Can view and approve project BOQs', 3, 0, 1, 1, 1, '2026-08-01 11:55:09', '2026-08-01 11:55:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `granted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `granted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `active_grant` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `company_id`, `role_id`, `permission_id`, `granted_by`, `granted_at`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(2, 1, 1, 2, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(3, 1, 1, 3, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(4, 1, 1, 4, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(5, 1, 1, 5, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(6, 1, 1, 6, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(7, 1, 1, 7, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(8, 1, 1, 8, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(9, 1, 1, 9, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(10, 1, 1, 10, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(11, 1, 1, 11, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(12, 1, 1, 12, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(13, 1, 1, 13, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(14, 1, 1, 14, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(15, 1, 1, 15, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(16, 1, 1, 16, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(17, 1, 1, 17, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(18, 1, 1, 18, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(19, 1, 1, 19, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(20, 1, 1, 20, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(21, 1, 1, 21, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(22, 1, 1, 22, NULL, '2026-07-23 14:29:28', 1, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(32, 1, 1, 23, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(33, 1, 1, 24, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(34, 1, 1, 25, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(35, 1, 1, 26, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(36, 1, 1, 27, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(37, 1, 1, 28, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(38, 1, 1, 29, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(39, 1, 1, 30, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(40, 1, 1, 31, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(41, 1, 1, 32, NULL, '2026-07-23 14:41:53', 1, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(47, 1, 1, 33, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(48, 1, 1, 34, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(49, 1, 1, 35, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(50, 1, 1, 36, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(51, 1, 1, 37, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(52, 1, 1, 38, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(53, 1, 1, 39, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(54, 1, 1, 40, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(55, 1, 1, 41, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(56, 1, 1, 42, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(57, 1, 1, 43, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(58, 1, 1, 44, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(59, 1, 1, 45, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(60, 1, 1, 46, NULL, '2026-07-23 20:20:10', 1, '2026-07-23 20:20:10', '2026-07-23 20:20:10', NULL),
(64, 1, 1, 75, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(65, 1, 1, 76, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(66, 1, 1, 77, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(67, 1, 1, 78, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(68, 1, 1, 79, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(69, 1, 1, 80, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(70, 1, 1, 81, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(71, 1, 1, 82, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(72, 1, 1, 83, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(73, 1, 1, 84, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(74, 1, 1, 85, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(75, 1, 1, 86, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(76, 1, 1, 87, NULL, '2026-07-23 20:33:20', 1, '2026-07-23 20:33:20', '2026-07-23 20:33:20', NULL),
(79, 1, 1, 88, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(80, 1, 1, 89, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(81, 1, 1, 90, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(82, 1, 1, 91, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(83, 1, 1, 92, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(84, 1, 1, 93, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(85, 1, 1, 94, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(86, 1, 1, 95, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(87, 1, 1, 96, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(88, 1, 1, 97, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(89, 1, 1, 98, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(90, 1, 1, 99, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(91, 1, 1, 100, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(92, 1, 1, 101, NULL, '2026-07-23 20:40:09', 1, '2026-07-23 20:40:09', '2026-07-23 20:40:09', NULL),
(94, 1, 1, 102, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(95, 1, 1, 103, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(96, 1, 1, 104, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(97, 1, 1, 105, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(98, 1, 1, 106, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(99, 1, 1, 107, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(100, 1, 1, 108, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(101, 1, 1, 109, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(102, 1, 1, 110, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(103, 1, 1, 111, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(104, 1, 1, 112, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(105, 1, 1, 113, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(106, 1, 1, 114, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(107, 1, 1, 115, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(108, 1, 1, 116, NULL, '2026-07-23 20:47:37', 1, '2026-07-23 20:47:37', '2026-07-23 20:47:37', NULL),
(109, 1, 1, 117, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(110, 1, 1, 118, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(111, 1, 1, 119, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(112, 1, 1, 120, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(113, 1, 1, 121, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(114, 1, 1, 122, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(115, 1, 1, 123, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(116, 1, 1, 124, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(117, 1, 1, 125, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(118, 1, 1, 126, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(119, 1, 1, 127, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(120, 1, 1, 128, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(121, 1, 1, 129, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(122, 1, 1, 130, NULL, '2026-07-23 20:55:31', 1, '2026-07-23 20:55:31', '2026-07-23 20:55:31', NULL),
(124, 1, 1, 131, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(125, 1, 1, 132, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(126, 1, 1, 133, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(127, 1, 1, 134, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(128, 1, 1, 135, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(129, 1, 1, 136, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(130, 1, 1, 137, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(131, 1, 1, 138, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(132, 1, 1, 139, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(133, 1, 1, 140, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(134, 1, 1, 141, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(135, 1, 1, 142, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(136, 1, 1, 143, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(137, 1, 1, 144, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(138, 1, 1, 145, NULL, '2026-07-23 21:02:41', 1, '2026-07-23 21:02:41', '2026-07-23 21:02:41', NULL),
(139, 1, 1, 146, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(140, 1, 1, 147, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(141, 1, 1, 148, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(142, 1, 1, 149, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(143, 1, 1, 150, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(144, 1, 1, 151, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(145, 1, 1, 152, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(146, 1, 1, 153, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(147, 1, 1, 154, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(148, 1, 1, 155, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(149, 1, 1, 156, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(150, 1, 1, 157, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(151, 1, 1, 158, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(152, 1, 1, 159, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(153, 1, 1, 160, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(154, 1, 1, 161, NULL, '2026-07-23 21:08:58', 1, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(170, 1, 1, 162, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(171, 1, 1, 163, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(172, 1, 1, 164, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(173, 1, 1, 165, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(174, 1, 1, 166, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(175, 1, 1, 167, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(176, 1, 1, 168, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(177, 1, 1, 169, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(178, 1, 1, 170, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(179, 1, 1, 171, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(180, 1, 1, 172, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(181, 1, 1, 173, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(182, 1, 1, 174, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(183, 1, 1, 175, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(184, 1, 1, 176, NULL, '2026-07-23 21:20:48', 1, '2026-07-23 21:20:48', '2026-07-23 21:20:48', NULL),
(185, 1, 2, 7, 1, '2026-07-26 08:03:23', 1, '2026-07-26 08:03:23', '2026-07-26 08:03:23', NULL),
(186, 1, 7, 79, 1, '2026-08-01 11:55:09', 1, '2026-08-01 11:55:09', '2026-08-01 11:55:09', NULL),
(187, 1, 7, 75, 1, '2026-08-01 11:55:09', 1, '2026-08-01 11:55:09', '2026-08-01 11:55:09', NULL),
(188, 1, 1, 177, NULL, '2026-08-04 20:26:42', 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(189, 1, 7, 177, NULL, '2026-08-04 20:26:42', 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(191, 1, 1, 178, NULL, '2026-08-04 20:26:42', 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(192, 1, 7, 178, NULL, '2026-08-04 20:26:42', 1, '2026-08-04 20:26:42', '2026-08-04 20:26:42', NULL),
(194, 1, 1, 180, 1, '2026-08-04 21:16:00', 1, '2026-08-04 21:16:00', '2026-08-04 21:16:00', NULL),
(195, 1, 1, 179, 1, '2026-08-04 21:16:00', 1, '2026-08-04 21:16:00', '2026-08-04 21:16:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_scopes`
--

CREATE TABLE `role_scopes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `scope_code` varchar(50) NOT NULL,
  `scope_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_scopes`
--

INSERT INTO `role_scopes` (`id`, `scope_code`, `scope_name`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'COMPANY', 'Company', 'Access across the company', 1, 1, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(2, 'BRANCH', 'Branch', 'Access limited to assigned branches', 1, 2, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(3, 'PROJECT', 'Project', 'Access limited to assigned projects', 1, 3, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(4, 'SITE', 'Site', 'Access limited to assigned sites', 1, 4, '2026-07-26 16:26:09', '2026-07-26 16:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `class` varchar(255) NOT NULL,
  `key` varchar(255) NOT NULL,
  `context` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `type` varchar(31) NOT NULL DEFAULT 'string',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_blocks`
--

CREATE TABLE `site_blocks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `block_code` varchar(30) NOT NULL,
  `block_name` varchar(150) NOT NULL,
  `block_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `total_floors` smallint(5) UNSIGNED DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_blocks`
--

INSERT INTO `site_blocks` (`id`, `company_id`, `project_id`, `site_id`, `work_zone_id`, `block_code`, `block_name`, `block_type_id`, `total_floors`, `description`, `status_id`, `progress_percentage`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'BLOCK-A', 'Residential Tower A', 2, 6, 'Ground plus five-floor residential tower.', 1, 0.0000, 10, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `site_blocks_block_type_masters`
--

CREATE TABLE `site_blocks_block_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `block_type_code` varchar(60) NOT NULL,
  `block_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_blocks_block_type_masters`
--

INSERT INTO `site_blocks_block_type_masters` (`id`, `block_type_code`, `block_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BUILDING', 'Building', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'TOWER', 'Tower', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'WING', 'Wing', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'VILLA', 'Villa', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'WAREHOUSE', 'Warehouse', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(6, 'UTILITY', 'Utility', 6, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(7, 'OTHER', 'Other', 7, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `site_blocks_status_masters`
--

CREATE TABLE `site_blocks_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_blocks_status_masters`
--

INSERT INTO `site_blocks_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'ACTIVE', 'Active', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'ON_HOLD', 'On Hold', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'COMPLETED', 'Completed', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `site_floors`
--

CREATE TABLE `site_floors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `block_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `floor_code` varchar(30) NOT NULL,
  `floor_name` varchar(120) NOT NULL,
  `floor_number` smallint(6) DEFAULT NULL,
  `level_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 4,
  `description` varchar(500) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_floors`
--

INSERT INTO `site_floors` (`id`, `company_id`, `project_id`, `site_id`, `block_id`, `work_zone_id`, `floor_code`, `floor_name`, `floor_number`, `level_type_id`, `description`, `status_id`, `progress_percentage`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'GF', 'Ground Floor', 0, 2, NULL, 1, 0.0000, 10, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL),
(2, 1, 1, 1, 1, 1, 'F01', 'First Floor', 1, 4, NULL, 1, 0.0000, 20, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `site_floors_level_type_masters`
--

CREATE TABLE `site_floors_level_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `level_type_code` varchar(60) NOT NULL,
  `level_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_floors_level_type_masters`
--

INSERT INTO `site_floors_level_type_masters` (`id`, `level_type_code`, `level_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BASEMENT', 'Basement', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'GROUND', 'Ground', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'PODIUM', 'Podium', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'TYPICAL', 'Typical', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'TERRACE', 'Terrace', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(6, 'ROOF', 'Roof', 6, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(7, 'MEZZANINE', 'Mezzanine', 7, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(8, 'OTHER', 'Other', 8, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `site_floors_status_masters`
--

CREATE TABLE `site_floors_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_floors_status_masters`
--

INSERT INTO `site_floors_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(2, 'ACTIVE', 'Active', 2, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(3, 'ON_HOLD', 'On Hold', 3, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(4, 'COMPLETED', 'Completed', 4, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:47', '2026-07-26 12:38:47');

-- --------------------------------------------------------

--
-- Table structure for table `site_statuses`
--

CREATE TABLE `site_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_final` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_statuses`
--

INSERT INTO `site_statuses` (`id`, `status_code`, `status_name`, `description`, `is_final`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', NULL, 0, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'PLANNED', 'Planned', NULL, 0, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'ACTIVE', 'Active', NULL, 0, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'ON_HOLD', 'On Hold', NULL, 0, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(5, 'COMPLETED', 'Completed', NULL, 0, 5, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(6, 'CLOSED', 'Closed', NULL, 1, 6, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(7, 'CANCELLED', 'Cancelled', NULL, 1, 7, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `site_status_logs`
--

CREATE TABLE `site_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `from_status_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_status_id` bigint(20) UNSIGNED DEFAULT NULL,
  `change_reason` varchar(500) DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_status_logs`
--

INSERT INTO `site_status_logs` (`id`, `company_id`, `project_id`, `site_id`, `from_status_id`, `to_status_id`, `change_reason`, `changed_by`, `changed_at`) VALUES
(1, 1, 1, 1, NULL, NULL, 'Primary site created using Phase 3 demonstration data.', NULL, '2026-07-23 20:21:04'),
(2, 1, 1, 2, NULL, 2, 'Site created.', 1, '2026-07-27 19:58:29'),
(3, 1, 1, 2, 2, 3, 'Site activated through API test', 1, '2026-07-27 20:06:43');

-- --------------------------------------------------------

--
-- Table structure for table `site_team_members`
--

CREATE TABLE `site_team_members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `team_role_id` bigint(20) UNSIGNED NOT NULL,
  `responsibility` varchar(500) DEFAULT NULL,
  `assignment_start` date DEFAULT NULL,
  `assignment_end` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `can_approve` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_team_members`
--

INSERT INTO `site_team_members` (`id`, `company_id`, `project_id`, `site_id`, `user_id`, `team_role_id`, `responsibility`, `assignment_start`, `assignment_end`, `is_primary`, `can_approve`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 3, 2, 'Lead daily execution, quality coordination and reporting', '2026-07-29', '2027-04-30', 1, 0, 0, 1, 1, '2026-07-29 11:19:29', '2026-07-29 11:26:08', '2026-07-29 11:26:08');

-- --------------------------------------------------------

--
-- Table structure for table `site_types`
--

CREATE TABLE `site_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_types`
--

INSERT INTO `site_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MAIN_SITE', 'Main Site', NULL, 1, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(2, 'PHASE_SITE', 'Phase Site', NULL, 2, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(3, 'REMOTE_SITE', 'Remote Site', NULL, 3, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(4, 'STORAGE_YARD', 'Storage Yard', NULL, 4, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(5, 'SITE_OFFICE', 'Site Office', NULL, 5, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48'),
(6, 'OTHER', 'Other', NULL, 99, 1, '2026-07-26 17:14:48', '2026-07-26 17:14:48');

-- --------------------------------------------------------

--
-- Table structure for table `site_units`
--

CREATE TABLE `site_units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `floor_id` bigint(20) UNSIGNED NOT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `unit_code` varchar(30) NOT NULL,
  `unit_name` varchar(120) NOT NULL,
  `unit_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 9,
  `carpet_area` decimal(14,3) DEFAULT NULL,
  `built_up_area` decimal(14,3) DEFAULT NULL,
  `area_uom_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_units`
--

INSERT INTO `site_units` (`id`, `company_id`, `project_id`, `site_id`, `floor_id`, `work_zone_id`, `unit_code`, `unit_name`, `unit_type_id`, `carpet_area`, `built_up_area`, `area_uom_id`, `description`, `status_id`, `progress_percentage`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'A-G01', 'Apartment A-G01', 1, 92.500, 118.000, 3, NULL, 1, 0.0000, 10, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL),
(2, 1, 1, 1, 1, 1, 'A-G02', 'Apartment A-G02', 1, 92.500, 118.000, 3, NULL, 1, 0.0000, 20, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `site_units_status_masters`
--

CREATE TABLE `site_units_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_units_status_masters`
--

INSERT INTO `site_units_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'ACTIVE', 'Active', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'ON_HOLD', 'On Hold', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'COMPLETED', 'Completed', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'HANDED_OVER', 'Handed Over', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `site_units_unit_type_masters`
--

CREATE TABLE `site_units_unit_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `unit_type_code` varchar(60) NOT NULL,
  `unit_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_units_unit_type_masters`
--

INSERT INTO `site_units_unit_type_masters` (`id`, `unit_type_code`, `unit_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'APARTMENT', 'Apartment', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'VILLA', 'Villa', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'ROOM', 'Room', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'SHOP', 'Shop', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'OFFICE', 'Office', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'PARKING', 'Parking', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'UTILITY', 'Utility', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(8, 'COMMON_AREA', 'Common Area', 8, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(9, 'OTHER', 'Other', 9, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `site_work_zones`
--

CREATE TABLE `site_work_zones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `parent_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `zone_code` varchar(30) NOT NULL,
  `zone_name` varchar(150) NOT NULL,
  `zone_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `description` varchar(500) DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_work_zones`
--

INSERT INTO `site_work_zones` (`id`, `company_id`, `project_id`, `site_id`, `parent_zone_id`, `zone_code`, `zone_name`, `zone_type_id`, `description`, `planned_start_date`, `planned_end_date`, `status_id`, `progress_percentage`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, NULL, 'ZONE-A', 'Tower A Work Zone', 2, 'Execution zone covering Tower A and its immediate surroundings.', '2026-08-01', '2027-05-31', 1, 0.0000, 10, 1, NULL, NULL, '2026-07-23 20:21:04', '2026-07-23 20:21:04', NULL),
(2, 1, 1, 1, NULL, 'ZONE_API_21662', 'API Test Main Zone Updated', 4, 'Updated through Site Zone API', '2026-08-05', '2027-04-15', 2, 10.5000, 210, 1, 1, 1, '2026-07-29 10:27:17', '2026-07-29 10:51:16', '2026-07-29 10:51:16'),
(3, 1, 1, 1, 2, 'ZONE_CHILD_21662', 'API Test Child Zone', 5, 'Child zone created through API test', '2026-08-10', '2027-02-28', 1, 0.0000, 220, 1, 1, 1, '2026-07-29 10:39:40', '2026-07-29 10:50:42', '2026-07-29 10:50:42');

-- --------------------------------------------------------

--
-- Table structure for table `site_work_zones_status_masters`
--

CREATE TABLE `site_work_zones_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_work_zones_status_masters`
--

INSERT INTO `site_work_zones_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'ACTIVE', 'Active', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'ON_HOLD', 'On Hold', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'COMPLETED', 'Completed', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'CANCELLED', 'Cancelled', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `site_work_zones_zone_type_masters`
--

CREATE TABLE `site_work_zones_zone_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `zone_type_code` varchar(60) NOT NULL,
  `zone_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_work_zones_zone_type_masters`
--

INSERT INTO `site_work_zones_zone_type_masters` (`id`, `zone_type_code`, `zone_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GENERAL', 'General', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'TOWER', 'Tower', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'WING', 'Wing', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'SECTION', 'Section', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'AREA', 'Area', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'YARD', 'Yard', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'ROAD', 'Road', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(8, 'UTILITY', 'Utility', 8, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(9, 'OTHER', 'Other', 9, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontractors`
--

CREATE TABLE `subcontractors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_code` varchar(30) NOT NULL,
  `contractor_name` varchar(180) NOT NULL,
  `contractor_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `contact_person` varchar(120) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `alternate_phone` varchar(25) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `pan` varchar(15) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(12) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `bank_account_name` varchar(150) DEFAULT NULL,
  `bank_account_no` varchar(40) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `default_retention_percent` decimal(7,4) NOT NULL DEFAULT 5.0000,
  `default_tds_percent` decimal(7,4) NOT NULL DEFAULT 1.0000,
  `payment_terms_days` smallint(5) UNSIGNED NOT NULL DEFAULT 15,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontractors`
--

INSERT INTO `subcontractors` (`id`, `company_id`, `contractor_code`, `contractor_name`, `contractor_type_id`, `contact_person`, `phone`, `alternate_phone`, `email`, `gstin`, `pan`, `address_line1`, `address_line2`, `city`, `district`, `state_name`, `postal_code`, `bank_name`, `bank_account_name`, `bank_account_no`, `bank_ifsc`, `default_retention_percent`, `default_tds_percent`, `payment_terms_days`, `status_id`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'SC-EXPO-001', 'Kovai Civil Works', 2, 'R. Kumar', '9876501234', NULL, 'accounts@kovaicivil.example', '33ABCDE1234F1Z5', 'ABCDE1234F', NULL, NULL, 'Coimbatore', NULL, 'Tamil Nadu', NULL, NULL, NULL, NULL, NULL, 5.0000, 1.0000, 15, 1, NULL, NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 'SC_1785850475', 'Module 8 Contractor 1785850475', 1, NULL, NULL, NULL, 'erp.dvn@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5.0000, 1.0000, 15, 1, 'Module 8 complete test', 1, 1, '2026-08-04 13:34:35', '2026-08-04 13:34:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontractors_contractor_type_masters`
--

CREATE TABLE `subcontractors_contractor_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `contractor_type_code` varchar(60) NOT NULL,
  `contractor_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontractors_contractor_type_masters`
--

INSERT INTO `subcontractors_contractor_type_masters` (`id`, `contractor_type_code`, `contractor_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'INDIVIDUAL', 'Individual', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'PROPRIETORSHIP', 'Proprietorship', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'PARTNERSHIP', 'Partnership', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'PRIVATE_LIMITED', 'Private Limited', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'PUBLIC_LIMITED', 'Public Limited', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'OTHER', 'Other', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontractors_status_masters`
--

CREATE TABLE `subcontractors_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontractors_status_masters`
--

INSERT INTO `subcontractors_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ACTIVE', 'Active', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'INACTIVE', 'Inactive', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'BLACKLISTED', 'Blacklisted', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontractor_documents`
--

CREATE TABLE `subcontractor_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_id` bigint(20) UNSIGNED NOT NULL,
  `document_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_name` varchar(180) NOT NULL,
  `document_number` varchar(80) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `verification_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontractor_documents`
--

INSERT INTO `subcontractor_documents` (`id`, `company_id`, `contractor_id`, `document_type_id`, `document_name`, `document_number`, `issue_date`, `expiry_date`, `file_name`, `file_path`, `verification_status_id`, `verified_by`, `verified_at`, `remarks`, `created_by`, `created_at`, `deleted_at`) VALUES
(1, 1, 2, NULL, 'Test compliance document', NULL, NULL, NULL, 'test.pdf', 'uploads/test.pdf', 2, 1, '2026-08-04 13:34:37', NULL, 1, '2026-08-04 13:34:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontractor_documents_verification_status_masters`
--

CREATE TABLE `subcontractor_documents_verification_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `verification_status_code` varchar(60) NOT NULL,
  `verification_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontractor_documents_verification_status_masters`
--

INSERT INTO `subcontractor_documents_verification_status_masters` (`id`, `verification_status_code`, `verification_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PENDING', 'Pending', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'VERIFIED', 'Verified', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'REJECTED', 'Rejected', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'EXPIRED', 'Expired', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_measurements`
--

CREATE TABLE `subcontract_measurements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `measurement_no` varchar(40) NOT NULL,
  `measurement_date` date NOT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `measured_by` bigint(20) UNSIGNED DEFAULT NULL,
  `contractor_representative` varchar(150) DEFAULT NULL,
  `total_measured_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_measurements`
--

INSERT INTO `subcontract_measurements` (`id`, `company_id`, `project_id`, `work_order_id`, `site_id`, `work_zone_id`, `measurement_no`, `measurement_date`, `period_from`, `period_to`, `measured_by`, `contractor_representative`, `total_measured_amount`, `status_id`, `verified_by`, `verified_at`, `approved_by`, `approved_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'MB-EXPO-0001', '2026-07-23', '2026-07-16', '2026-07-23', NULL, 'R. Kumar', 50000.00, 4, NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', 'Joint measurement verified at site.', NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 1, 1, 'MB_1785850475', '2026-08-04', NULL, NULL, NULL, NULL, 2000.00, 4, 1, '2026-08-04 13:35:08', 1, '2026-08-04 13:35:08', NULL, 1, 1, '2026-08-04 13:35:04', '2026-08-04 13:35:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_measurements_status_masters`
--

CREATE TABLE `subcontract_measurements_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_measurements_status_masters`
--

INSERT INTO `subcontract_measurements_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'VERIFIED', 'Verified', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_measurement_lines`
--

CREATE TABLE `subcontract_measurement_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `measurement_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_item_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `location_reference` varchar(250) DEFAULT NULL,
  `length_value` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `breadth_value` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `height_value` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `number_count` decimal(18,4) NOT NULL DEFAULT 1.0000,
  `measured_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `previous_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `cumulative_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `accepted_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `measured_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_measurement_lines`
--

INSERT INTO `subcontract_measurement_lines` (`id`, `company_id`, `project_id`, `measurement_id`, `work_order_item_id`, `description`, `location_reference`, `length_value`, `breadth_value`, `height_value`, `number_count`, `measured_quantity`, `previous_quantity`, `cumulative_quantity`, `accepted_quantity`, `rate`, `measured_amount`, `remarks`, `created_by`, `created_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'Foundation masonry completed', 'Block A - Foundation Zone', 0.0000, 0.0000, 0.0000, 1.0000, 25.0000, 0.0000, 25.0000, 25.0000, 2000.0000, 50000.00, NULL, NULL, '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 2, 'Measured work', NULL, 0.0000, 0.0000, 0.0000, 1.0000, 2.0000, 0.0000, 2.0000, 2.0000, 1000.0000, 2000.00, NULL, 1, '2026-08-04 13:35:05', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_payments`
--

CREATE TABLE `subcontract_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `ra_bill_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_id` bigint(20) UNSIGNED NOT NULL,
  `payment_no` varchar(40) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `reference_no` varchar(100) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `paid_by` bigint(20) UNSIGNED DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_payments`
--

INSERT INTO `subcontract_payments` (`id`, `company_id`, `project_id`, `ra_bill_id`, `contractor_id`, `payment_no`, `payment_date`, `payment_mode_id`, `reference_no`, `amount`, `status_id`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `paid_by`, `paid_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'SCP-EXPO-0001', '2026-07-23', 5, 'NEFT-EXPO-001', 30000.00, 4, NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', 'Part payment against certified RA bill.', NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 2, 'PAY_1785850475', '2026-08-04', 1, NULL, 1000.00, 4, 1, '2026-08-04 13:35:35', 1, '2026-08-04 13:35:35', 1, '2026-08-04 13:35:42', NULL, 1, 1, '2026-08-04 13:35:34', '2026-08-04 13:35:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_payments_payment_mode_masters`
--

CREATE TABLE `subcontract_payments_payment_mode_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_mode_code` varchar(60) NOT NULL,
  `payment_mode_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_payments_payment_mode_masters`
--

INSERT INTO `subcontract_payments_payment_mode_masters` (`id`, `payment_mode_code`, `payment_mode_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CASH', 'Cash', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'BANK_TRANSFER', 'Bank Transfer', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'CHEQUE', 'Cheque', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'UPI', 'Upi', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'NEFT', 'Neft', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'RTGS', 'Rtgs', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'OTHER', 'Other', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_payments_status_masters`
--

CREATE TABLE `subcontract_payments_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_payments_status_masters`
--

INSERT INTO `subcontract_payments_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'PAID', 'Paid', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'REJECTED', 'Rejected', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'CANCELLED', 'Cancelled', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_ra_bills`
--

CREATE TABLE `subcontract_ra_bills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_id` bigint(20) UNSIGNED NOT NULL,
  `contractor_id` bigint(20) UNSIGNED NOT NULL,
  `ra_bill_no` varchar(40) NOT NULL,
  `contractor_bill_no` varchar(60) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `gross_work_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `variation_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `material_recovery` decimal(18,2) NOT NULL DEFAULT 0.00,
  `advance_recovery` decimal(18,2) NOT NULL DEFAULT 0.00,
  `retention_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `other_recovery` decimal(18,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `gross_bill_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tds_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `net_certified_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `outstanding_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `payment_status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `certified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `certified_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_ra_bills`
--

INSERT INTO `subcontract_ra_bills` (`id`, `company_id`, `project_id`, `work_order_id`, `contractor_id`, `ra_bill_no`, `contractor_bill_no`, `bill_date`, `period_from`, `period_to`, `due_date`, `gross_work_value`, `variation_value`, `material_recovery`, `advance_recovery`, `retention_amount`, `other_recovery`, `taxable_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`, `gross_bill_amount`, `tds_amount`, `net_certified_amount`, `paid_amount`, `outstanding_amount`, `payment_status_id`, `status_id`, `submitted_by`, `submitted_at`, `verified_by`, `verified_at`, `certified_by`, `certified_at`, `remarks`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 'RA-EXPO-0001', 'KCW-RA-001', '2026-07-23', '2026-07-16', '2026-07-23', '2026-08-07', 50000.00, 0.00, 0.00, 0.00, 2500.00, 0.00, 47500.00, 4275.00, 4275.00, 0.00, 56050.00, 500.00, 53050.00, 30000.00, 23050.00, 2, 5, NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', 'First RA bill certified after measurement approval.', NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 2, 'RA_1785850475', NULL, '2026-08-04', NULL, NULL, NULL, 2000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2000.00, 0.00, 0.00, 0.00, 2000.00, 0.00, 2000.00, 1000.00, 1000.00, 2, 5, 1, '2026-08-04 13:35:18', 1, '2026-08-04 13:35:18', 1, '2026-08-04 13:35:26', NULL, 1, 1, '2026-08-04 13:35:17', '2026-08-04 19:05:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_ra_bills_payment_status_masters`
--

CREATE TABLE `subcontract_ra_bills_payment_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_status_code` varchar(60) NOT NULL,
  `payment_status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_ra_bills_payment_status_masters`
--

INSERT INTO `subcontract_ra_bills_payment_status_masters` (`id`, `payment_status_code`, `payment_status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UNPAID', 'Unpaid', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'PARTIALLY_PAID', 'Partially Paid', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'PAID', 'Paid', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_ra_bills_status_masters`
--

CREATE TABLE `subcontract_ra_bills_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_ra_bills_status_masters`
--

INSERT INTO `subcontract_ra_bills_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'VERIFIED', 'Verified', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'CERTIFIED', 'Certified', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'REJECTED', 'Rejected', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'CANCELLED', 'Cancelled', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_ra_bill_items`
--

CREATE TABLE `subcontract_ra_bill_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `ra_bill_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_item_id` bigint(20) UNSIGNED NOT NULL,
  `measurement_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `budget_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `previous_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `current_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `cumulative_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `current_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `certified_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `remarks` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_ra_bill_items`
--

INSERT INTO `subcontract_ra_bill_items` (`id`, `company_id`, `project_id`, `ra_bill_id`, `work_order_item_id`, `measurement_line_id`, `budget_line_id`, `description`, `previous_quantity`, `current_quantity`, `cumulative_quantity`, `rate`, `current_amount`, `certified_amount`, `remarks`, `created_by`, `created_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 'Foundation masonry work', 0.0000, 25.0000, 25.0000, 2000.0000, 50000.00, 50000.00, NULL, NULL, '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 2, NULL, NULL, 'Certified work', 0.0000, 2.0000, 2.0000, 1000.0000, 2000.00, 2000.00, NULL, 1, '2026-08-04 13:35:17', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_status_logs`
--

CREATE TABLE `subcontract_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_id` bigint(20) UNSIGNED NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) NOT NULL,
  `action_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 9,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_status_logs`
--

INSERT INTO `subcontract_status_logs` (`id`, `company_id`, `entity_type_id`, `entity_id`, `old_status`, `new_status`, `action_type_id`, `changed_by`, `changed_at`, `remarks`) VALUES
(1, 1, 2, 1, 'APPROVED', 'ACTIVE', 4, NULL, '2026-07-23 21:08:58', 'Work order released to contractor.'),
(2, 1, 3, 1, 'VERIFIED', 'APPROVED', 4, NULL, '2026-07-23 21:08:58', 'Joint measurement approved.'),
(3, 1, 4, 1, 'APPROVED', 'CERTIFIED', 5, NULL, '2026-07-23 21:08:58', 'RA bill certified with retention and TDS.'),
(4, 1, 5, 1, 'APPROVED', 'PAID', 7, NULL, '2026-07-23 21:08:58', 'Part payment released through NEFT.'),
(5, 1, 1, 2, NULL, 'ACTIVE', 1, 1, '2026-08-04 13:34:35', NULL),
(6, 1, 2, 2, NULL, 'DRAFT', 1, 1, '2026-08-04 13:34:38', NULL),
(7, 1, 2, 2, 'DRAFT', 'SUBMITTED', 9, 1, '2026-08-04 13:34:39', NULL),
(8, 1, 2, 2, 'SUBMITTED', 'APPROVED', 9, 1, '2026-08-04 13:34:40', NULL),
(9, 1, 2, 2, 'APPROVED', 'ACTIVE', 9, 1, '2026-08-04 13:34:58', NULL),
(10, 1, 3, 2, NULL, 'DRAFT', 1, 1, '2026-08-04 13:35:04', NULL),
(11, 1, 3, 2, 'DRAFT', 'SUBMITTED', 9, 1, '2026-08-04 13:35:06', NULL),
(12, 1, 3, 2, 'SUBMITTED', 'VERIFIED', 9, 1, '2026-08-04 13:35:08', NULL),
(13, 1, 3, 2, 'VERIFIED', 'APPROVED', 9, 1, '2026-08-04 13:35:08', NULL),
(14, 1, 4, 2, NULL, 'DRAFT', 1, 1, '2026-08-04 13:35:17', NULL),
(15, 1, 4, 2, 'DRAFT', 'SUBMITTED', 9, 1, '2026-08-04 13:35:18', NULL),
(16, 1, 4, 2, 'SUBMITTED', 'VERIFIED', 9, 1, '2026-08-04 13:35:18', NULL),
(17, 1, 4, 2, 'VERIFIED', 'APPROVED', 9, 1, '2026-08-04 13:35:19', NULL),
(18, 1, 4, 2, 'APPROVED', 'CERTIFIED', 9, 1, '2026-08-04 13:35:26', NULL),
(19, 1, 5, 2, NULL, 'DRAFT', 1, 1, '2026-08-04 13:35:34', NULL),
(20, 1, 5, 2, 'DRAFT', 'SUBMITTED', 9, 1, '2026-08-04 13:35:35', NULL),
(21, 1, 5, 2, 'SUBMITTED', 'APPROVED', 9, 1, '2026-08-04 13:35:35', NULL),
(22, 1, 5, 2, 'APPROVED', 'PAID', 9, 1, '2026-08-04 13:35:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_status_logs_action_type_masters`
--

CREATE TABLE `subcontract_status_logs_action_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type_code` varchar(60) NOT NULL,
  `action_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_status_logs_action_type_masters`
--

INSERT INTO `subcontract_status_logs_action_type_masters` (`id`, `action_type_code`, `action_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CREATED', 'Created', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'VERIFIED', 'Verified', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'APPROVED', 'Approved', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'CERTIFIED', 'Certified', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'REJECTED', 'Rejected', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'PAID', 'Paid', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(8, 'CANCELLED', 'Cancelled', 8, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(9, 'STATUS_CHANGED', 'Status Changed', 9, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_status_logs_entity_type_masters`
--

CREATE TABLE `subcontract_status_logs_entity_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_type_code` varchar(60) NOT NULL,
  `entity_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_status_logs_entity_type_masters`
--

INSERT INTO `subcontract_status_logs_entity_type_masters` (`id`, `entity_type_code`, `entity_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CONTRACTOR', 'Contractor', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'WORK_ORDER', 'Work Order', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'MEASUREMENT', 'Measurement', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'RA_BILL', 'Ra Bill', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'PAYMENT', 'Payment', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_work_orders`
--

CREATE TABLE `subcontract_work_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED DEFAULT NULL,
  `work_zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `contractor_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_no` varchar(40) NOT NULL,
  `work_order_date` date NOT NULL,
  `start_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `scope_of_work` text NOT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'INR',
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_order_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `variation_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `revised_order_value` decimal(18,2) NOT NULL DEFAULT 0.00,
  `retention_percent` decimal(7,4) NOT NULL DEFAULT 5.0000,
  `advance_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `advance_recovered` decimal(18,2) NOT NULL DEFAULT 0.00,
  `certified_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `payment_terms` varchar(500) DEFAULT NULL,
  `terms_and_conditions` text DEFAULT NULL,
  `submitted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_work_orders`
--

INSERT INTO `subcontract_work_orders` (`id`, `company_id`, `project_id`, `site_id`, `work_zone_id`, `contractor_id`, `work_order_no`, `work_order_date`, `start_date`, `completion_date`, `scope_of_work`, `currency_code`, `subtotal`, `tax_amount`, `total_order_value`, `variation_amount`, `revised_order_value`, `retention_percent`, `advance_amount`, `advance_recovered`, `certified_amount`, `paid_amount`, `status_id`, `payment_terms`, `terms_and_conditions`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 'SWO-EXPO-0001', '2026-07-23', '2026-07-23', '2026-09-06', 'Foundation masonry and related civil work as per approved BOQ.', 'INR', 200000.00, 36000.00, 236000.00, 0.00, 236000.00, 5.0000, 0.00, 0.00, 0.00, 0.00, 4, 'RA bill every 15 days; payment within 15 days after certification.', NULL, NULL, '2026-07-23 21:08:58', NULL, '2026-07-23 21:08:58', NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 1, 1, 1, 2, 'SWO_1785850475', '2026-08-04', NULL, NULL, 'Module 8 API test work', 'INR', 10000.00, 1800.00, 11800.00, 0.00, 11800.00, 5.0000, 0.00, 0.00, 2000.00, 1000.00, 4, NULL, NULL, 1, '2026-08-04 13:34:39', 1, '2026-08-04 13:34:40', 1, 1, '2026-08-04 13:34:38', '2026-08-04 19:05:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_work_orders_status_masters`
--

CREATE TABLE `subcontract_work_orders_status_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_work_orders_status_masters`
--

INSERT INTO `subcontract_work_orders_status_masters` (`id`, `status_code`, `status_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Draft', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'SUBMITTED', 'Submitted', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'APPROVED', 'Approved', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'ACTIVE', 'Active', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'ON_HOLD', 'On Hold', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'COMPLETED', 'Completed', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(7, 'CLOSED', 'Closed', 7, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(8, 'REJECTED', 'Rejected', 8, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(9, 'CANCELLED', 'Cancelled', 9, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `subcontract_work_order_items`
--

CREATE TABLE `subcontract_work_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `work_order_id` bigint(20) UNSIGNED NOT NULL,
  `boq_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `budget_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `uom_id` bigint(20) UNSIGNED NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `description` varchar(500) NOT NULL,
  `ordered_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `rate` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_percent` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `completed_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `certified_quantity` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subcontract_work_order_items`
--

INSERT INTO `subcontract_work_order_items` (`id`, `company_id`, `project_id`, `work_order_id`, `boq_item_id`, `budget_line_id`, `uom_id`, `item_code`, `description`, `ordered_quantity`, `rate`, `amount`, `tax_percent`, `completed_quantity`, `certified_quantity`, `display_order`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, 1, 4, 'SWO-ITEM-001', 'Foundation masonry work', 100.0000, 2000.0000, 200000.00, 18.0000, 25.0000, 25.0000, 0, NULL, NULL, NULL, '2026-07-23 21:08:58', '2026-07-23 21:08:58', NULL),
(2, 1, 1, 2, 1, NULL, 4, 'ITEM_1785850475', 'API test BOQ work', 10.0000, 1000.0000, 10000.00, 18.0000, 2.0000, 2.0000, 0, NULL, 1, NULL, '2026-08-04 13:34:38', '2026-08-04 19:05:26', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_statuses`
--

CREATE TABLE `subscription_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_statuses`
--

INSERT INTO `subscription_statuses` (`id`, `status_code`, `status_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'TRIAL', 'Trial', NULL, 1, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(2, 'ACTIVE', 'Active', NULL, 2, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(3, 'SUSPENDED', 'Suspended', NULL, 3, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(4, 'EXPIRED', 'Expired', NULL, 4, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16'),
(5, 'CANCELLED', 'Cancelled', NULL, 5, 1, '2026-07-26 16:47:16', '2026-07-26 16:47:16');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `setting_group` varchar(60) NOT NULL,
  `setting_key` varchar(120) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `value_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `description` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `is_encrypted` tinyint(1) NOT NULL DEFAULT 0,
  `is_editable` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `branch_scope_id` bigint(20) UNSIGNED GENERATED ALWAYS AS (coalesce(`branch_id`,0)) STORED,
  `active_setting` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `company_id`, `branch_id`, `setting_group`, `setting_key`, `setting_value`, `value_type_id`, `description`, `is_public`, `is_encrypted`, `is_editable`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'GENERAL', 'application_name', 'Civil Site Management', 1, 'Application display name.', 1, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(2, 1, NULL, 'GENERAL', 'default_currency', 'INR', 1, 'Default transaction currency.', 1, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(3, 1, NULL, 'GENERAL', 'default_timezone', 'Asia/Kolkata', 1, 'Default application timezone.', 1, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(4, 1, NULL, 'GENERAL', 'date_format', 'd-m-Y', 1, 'User-facing date format.', 1, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(5, 1, NULL, 'SECURITY', 'max_failed_login_attempts', '5', 2, 'Failed attempts allowed before temporary lock.', 0, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(6, 1, NULL, 'SECURITY', 'session_timeout_minutes', '60', 2, 'Inactive session timeout in minutes.', 0, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL),
(7, 1, 1, 'BRANCH', 'document_number_prefix', 'HO', 1, 'Document numbering prefix for Head Office.', 0, 0, 1, 1, NULL, NULL, '2026-07-23 14:29:28', '2026-07-23 14:29:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings_value_type_masters`
--

CREATE TABLE `system_settings_value_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `value_type_code` varchar(60) NOT NULL,
  `value_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings_value_type_masters`
--

INSERT INTO `system_settings_value_type_masters` (`id`, `value_type_code`, `value_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'STRING', 'String', 1, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(2, 'INTEGER', 'Integer', 2, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(3, 'DECIMAL', 'Decimal', 3, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(4, 'BOOLEAN', 'Boolean', 4, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(5, 'DATE', 'Date', 5, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48'),
(6, 'JSON', 'Json', 6, 1, '2026-07-26 12:38:48', '2026-07-26 12:38:48');

-- --------------------------------------------------------

--
-- Table structure for table `units_of_measurement`
--

CREATE TABLE `units_of_measurement` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `unit_code` varchar(20) NOT NULL,
  `unit_name` varchar(80) NOT NULL,
  `unit_symbol` varchar(20) NOT NULL,
  `unit_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 8,
  `decimal_places` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_system_defined` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units_of_measurement`
--

INSERT INTO `units_of_measurement` (`id`, `company_id`, `unit_code`, `unit_name`, `unit_symbol`, `unit_type_id`, `decimal_places`, `description`, `display_order`, `is_system_defined`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'NOS', 'Numbers', 'Nos', 1, 0, NULL, 10, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, 'M', 'Metre', 'm', 2, 3, NULL, 20, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, 'SQM', 'Square Metre', 'm2', 3, 3, NULL, 30, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, 'CUM', 'Cubic Metre', 'm3', 4, 3, NULL, 40, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, 'KG', 'Kilogram', 'kg', 5, 3, NULL, 50, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, 'MT', 'Metric Tonne', 'MT', 5, 3, NULL, 60, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, 'LTR', 'Litre', 'L', 4, 3, NULL, 70, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(8, 1, 'BAG', 'Bag', 'Bag', 7, 0, NULL, 80, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(9, 1, 'DAY', 'Day', 'Day', 6, 2, NULL, 90, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(10, 1, 'HR', 'Hour', 'Hr', 6, 2, NULL, 100, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(11, 1, 'LS', 'Lump Sum', 'LS', 8, 2, NULL, 110, 1, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(12, 1, 'FT_API', 'API Test Foot', 'ft', 2, 2, 'Updated through Unit Master API', 210, 0, 1, 1, 1, '2026-07-26 17:04:45', '2026-07-26 17:06:19', '2026-07-26 17:06:19');

-- --------------------------------------------------------

--
-- Table structure for table `units_of_measurement_unit_type_masters`
--

CREATE TABLE `units_of_measurement_unit_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `unit_type_code` varchar(60) NOT NULL,
  `unit_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units_of_measurement_unit_type_masters`
--

INSERT INTO `units_of_measurement_unit_type_masters` (`id`, `unit_type_code`, `unit_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'COUNT', 'Count', 1, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(2, 'LENGTH', 'Length', 2, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(3, 'AREA', 'Area', 3, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(4, 'VOLUME', 'Volume', 4, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(5, 'WEIGHT', 'Weight', 5, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(6, 'TIME', 'Time', 6, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(7, 'PACKAGE', 'Package', 7, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(8, 'OTHER', 'Other', 8, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `default_branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_code` varchar(30) DEFAULT NULL,
  `username` varchar(80) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `user_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `user_status_id` bigint(20) UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `status_message` varchar(255) DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 1,
  `failed_login_attempts` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `default_branch_id`, `employee_code`, `username`, `email`, `phone`, `password_hash`, `first_name`, `last_name`, `designation`, `user_type_id`, `user_status_id`, `active`, `status_message`, `last_active`, `must_change_password`, `failed_login_attempts`, `locked_until`, `last_login_at`, `last_login_ip`, `password_changed_at`, `email_verified_at`, `remember_token`, `is_super_admin`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, NULL, 'superadmin', 'erp.dvn@gmail.com', NULL, '$2y$12$6auZLwlBi5Qzxetf1GyuLum5w9DtwTMVvNWTLwWuAuYuHRvWFlPTa', 'Admin', 'Civilpro', 'System Administrator', 1, 2, 1, NULL, NULL, 0, 0, NULL, NULL, NULL, '2026-07-24 17:59:14', '2026-07-23 17:15:53', NULL, 1, 1, NULL, 1, '2026-07-23 17:15:53', '2026-08-03 11:43:10', NULL),
(3, 1, 1, 'EMP001', 'siteengineer1', 'siteengineer1@civilpro.com', '9876543210', '$2y$12$L.nzndZ0u5AGRPBpMV9hlO8tKGCn2y73meEyLLhyjsfZOq1grm9eW', 'Site', 'Engineer', 'Site Engineer', 4, 2, 1, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 1, 1, '2026-07-26 07:32:30', '2026-07-26 16:26:09', NULL),
(4, 1, 1, 'SE002', 'siteengineer2', 'siteengineer2@civilpro.com', '9876543210', '$2y$12$iER0Iex9iNXxvXu46MarmORxv3xoHt5n35B0lj8i47hoRIoP9dVTG', 'Site', 'Engineer 2', 'Site Engineer', 4, 2, 1, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 1, 1, '2026-07-26 09:47:59', '2026-07-26 16:26:09', NULL),
(5, 1, 1, 'TEST12825', 'siteengineer12825', 'siteengineer12825@test.com', '9000000000', '$2y$12$qQ256bsyZczcq4fFMUm23OA0k4XkIm2OLwReos/DPm4HXrnS6yY2e', 'API Test', 'User', 'Site Engineer', 4, 2, 1, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 1, 1, '2026-07-26 13:36:49', '2026-07-26 13:36:49', NULL),
(6, 1, 1, 'TEST6930', 'siteengineer6930', 'marhesh@gmail.com', '9000000000', '$2y$10$Z/JsuR8XtnDaX2iXTK6dqOfiDpgHym2szQPEdMH0SGE7TF1WI/7W2', 'API Test Updated', 'User', 'Senior Site Engineer', 4, 2, 1, NULL, NULL, 0, 0, NULL, NULL, NULL, '2026-08-01 13:20:35', NULL, NULL, 0, 1, 1, 1, '2026-07-26 13:43:21', '2026-08-01 13:20:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users_user_type_masters`
--

CREATE TABLE `users_user_type_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_type_code` varchar(60) NOT NULL,
  `user_type_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users_user_type_masters`
--

INSERT INTO `users_user_type_masters` (`id`, `user_type_code`, `user_type_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'COMPANY_ADMIN', 'Company Admin', 1, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(2, 'OFFICE_USER', 'Office User', 2, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(3, 'PROJECT_MANAGER', 'Project Manager', 3, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(4, 'SITE_ENGINEER', 'Site Engineer', 4, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(5, 'SUPERVISOR', 'Supervisor', 5, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(6, 'ACCOUNTS', 'Accounts', 6, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(7, 'VIEWER', 'Viewer', 7, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49');

-- --------------------------------------------------------

--
-- Table structure for table `user_branch_access`
--

CREATE TABLE `user_branch_access` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `access_level_id` bigint(20) UNSIGNED NOT NULL DEFAULT 2,
  `granted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `granted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `active_access` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_branch_access`
--

INSERT INTO `user_branch_access` (`id`, `company_id`, `user_id`, `branch_id`, `access_level_id`, `granted_by`, `granted_at`, `valid_from`, `valid_until`, `is_default`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 3, 1, 2, 1, '2026-07-26 14:11:33', '2026-07-26', NULL, 1, 1, '2026-07-26 07:32:30', '2026-07-26 14:11:33', NULL),
(2, 1, 4, 1, 2, 1, '2026-07-26 09:47:59', '2026-07-26', NULL, 1, 1, '2026-07-26 09:47:59', '2026-07-26 09:47:59', NULL),
(3, 1, 5, 1, 2, 1, '2026-07-26 13:36:49', '2026-07-26', NULL, 1, 1, '2026-07-26 13:36:49', '2026-07-26 13:36:49', NULL),
(4, 1, 6, 1, 2, 1, '2026-07-26 13:43:22', '2026-07-26', NULL, 1, 1, '2026-07-26 13:43:21', '2026-07-26 13:43:22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_branch_access_access_level_masters`
--

CREATE TABLE `user_branch_access_access_level_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `access_level_code` varchar(60) NOT NULL,
  `access_level_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_branch_access_access_level_masters`
--

INSERT INTO `user_branch_access_access_level_masters` (`id`, `access_level_code`, `access_level_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'VIEW', 'View', 1, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(2, 'OPERATE', 'Operate', 2, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(3, 'MANAGE', 'Manage', 3, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp(),
  `valid_from` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `active_assignment` tinyint(4) GENERATED ALWAYS AS (if(`deleted_at` is null,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `company_id`, `user_id`, `role_id`, `assigned_by`, `assigned_at`, `valid_from`, `valid_until`, `is_primary`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 3, 3, 1, '2026-07-26 14:11:33', '2026-07-26', NULL, 1, 1, '2026-07-26 07:32:30', '2026-07-26 14:11:33', NULL),
(2, 1, 4, 3, 1, '2026-07-26 09:47:59', '2026-07-26', NULL, 1, 1, '2026-07-26 09:47:59', '2026-07-26 09:47:59', NULL),
(3, 1, 5, 3, 1, '2026-07-26 13:36:49', '2026-07-26', NULL, 1, 1, '2026-07-26 13:36:49', '2026-07-26 13:36:49', NULL),
(4, 1, 6, 3, 1, '2026-07-26 13:43:22', '2026-07-26', NULL, 1, 1, '2026-07-26 13:43:21', '2026-07-26 13:43:22', NULL),
(5, 1, 6, 7, 1, '2026-08-01 11:55:09', '2026-08-01', NULL, 0, 1, '2026-08-01 11:55:09', '2026-08-01 11:55:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_statuses`
--

CREATE TABLE `user_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_login_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_statuses`
--

INSERT INTO `user_statuses` (`id`, `status_code`, `status_name`, `description`, `is_login_allowed`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'INVITED', 'Invited', 'User invitation created', 0, 1, 1, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(2, 'ACTIVE', 'Active', 'User can access the application', 1, 1, 2, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(3, 'INACTIVE', 'Inactive', 'User access is disabled', 0, 1, 3, '2026-07-26 16:26:09', '2026-07-26 16:26:09'),
(4, 'LOCKED', 'Locked', 'User access is temporarily locked', 0, 1, 4, '2026-07-26 16:26:09', '2026-07-26 16:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `work_categories`
--

CREATE TABLE `work_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_code` varchar(30) NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `work_stage_id` bigint(20) UNSIGNED NOT NULL DEFAULT 8,
  `progress_method_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `description` varchar(500) DEFAULT NULL,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_categories`
--

INSERT INTO `work_categories` (`id`, `company_id`, `parent_id`, `category_code`, `category_name`, `work_stage_id`, `progress_method_id`, `description`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'PRELIMINARY', 'Preliminary Works', 1, 3, NULL, 10, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(2, 1, NULL, 'EARTHWORK', 'Earthwork and Excavation', 2, 1, NULL, 20, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(3, 1, NULL, 'FOUNDATION', 'Foundation Works', 2, 1, NULL, 30, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(4, 1, NULL, 'RCC', 'Reinforced Cement Concrete', 3, 1, NULL, 40, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(5, 1, NULL, 'MASONRY', 'Masonry Works', 3, 1, NULL, 50, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(6, 1, NULL, 'PLASTERING', 'Plastering Works', 4, 1, NULL, 60, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(7, 1, NULL, 'FLOORING', 'Flooring and Tiling', 4, 1, NULL, 70, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(8, 1, NULL, 'PAINTING', 'Painting Works', 4, 1, NULL, 80, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(9, 1, NULL, 'MEP', 'MEP Works', 5, 2, NULL, 90, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(10, 1, NULL, 'EXTERNAL', 'External Development', 6, 1, NULL, 100, 1, NULL, NULL, '2026-07-23 14:41:53', '2026-07-23 14:41:53', NULL),
(11, 1, 3, 'WC_API_001', 'API Test Excavation Works Updated', 2, 2, 'Updated through Work Category API', 210, 1, 1, 1, '2026-07-26 17:22:09', '2026-07-26 17:24:50', '2026-07-26 17:24:50');

-- --------------------------------------------------------

--
-- Table structure for table `work_categories_progress_method_masters`
--

CREATE TABLE `work_categories_progress_method_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `progress_method_code` varchar(60) NOT NULL,
  `progress_method_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_categories_progress_method_masters`
--

INSERT INTO `work_categories_progress_method_masters` (`id`, `progress_method_code`, `progress_method_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'QUANTITY', 'Quantity', 1, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(2, 'PERCENTAGE', 'Percentage', 2, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(3, 'MILESTONE', 'Milestone', 3, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49');

-- --------------------------------------------------------

--
-- Table structure for table `work_categories_work_stage_masters`
--

CREATE TABLE `work_categories_work_stage_masters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `work_stage_code` varchar(60) NOT NULL,
  `work_stage_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_categories_work_stage_masters`
--

INSERT INTO `work_categories_work_stage_masters` (`id`, `work_stage_code`, `work_stage_name`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PRE_CONSTRUCTION', 'Pre Construction', 1, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(2, 'SUBSTRUCTURE', 'Substructure', 2, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(3, 'SUPERSTRUCTURE', 'Superstructure', 3, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(4, 'FINISHING', 'Finishing', 4, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(5, 'MEP', 'Mep', 5, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(6, 'EXTERNAL', 'External', 6, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(7, 'HANDOVER', 'Handover', 7, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49'),
(8, 'OTHER', 'Other', 8, 1, '2026-07-26 12:38:49', '2026-07-26 12:38:49');

-- --------------------------------------------------------

--
-- Table structure for table `work_locations`
--

CREATE TABLE `work_locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `zone_id` bigint(20) UNSIGNED DEFAULT NULL,
  `parent_location_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location_code` varchar(30) NOT NULL,
  `location_name` varchar(150) NOT NULL,
  `location_type_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `description` varchar(500) DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `status_id` bigint(20) UNSIGNED NOT NULL DEFAULT 1,
  `progress_percentage` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `display_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_locations`
--

INSERT INTO `work_locations` (`id`, `company_id`, `project_id`, `site_id`, `zone_id`, `parent_location_id`, `location_code`, `location_name`, `location_type_id`, `description`, `planned_start_date`, `planned_end_date`, `status_id`, `progress_percentage`, `display_order`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, NULL, 'WL_API_001', 'API Test Work Area Updated', 5, 'Updated through Work Location API', '2026-08-05', '2027-04-15', 2, 15.5000, 210, 1, 1, 1, '2026-07-29 11:40:55', '2026-07-29 11:55:01', '2026-07-29 11:55:01'),
(2, 1, 1, 1, 1, 1, 'WL_CHILD_001', 'API Test Child Work Area', 2, 'Child work location created through API test', '2026-08-10', '2027-02-28', 1, 0.0000, 220, 1, 1, 1, '2026-07-29 11:51:51', '2026-07-29 11:54:18', '2026-07-29 11:54:18');

-- --------------------------------------------------------

--
-- Table structure for table `work_location_statuses`
--

CREATE TABLE `work_location_statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `status_code` varchar(60) NOT NULL,
  `status_name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_location_statuses`
--

INSERT INTO `work_location_statuses` (`id`, `status_code`, `status_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PLANNED', 'Planned', NULL, 1, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(2, 'ACTIVE', 'Active', NULL, 2, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(3, 'ON_HOLD', 'On Hold', NULL, 3, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(4, 'COMPLETED', 'Completed', NULL, 4, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(5, 'CANCELLED', 'Cancelled', NULL, 5, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13');

-- --------------------------------------------------------

--
-- Table structure for table `work_location_types`
--

CREATE TABLE `work_location_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type_code` varchar(60) NOT NULL,
  `type_name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_location_types`
--

INSERT INTO `work_location_types` (`id`, `type_code`, `type_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GENERAL', 'General', NULL, 1, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(2, 'WORK_AREA', 'Work Area', NULL, 2, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(3, 'ACCESS', 'Access', NULL, 3, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(4, 'STORAGE', 'Storage', NULL, 4, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(5, 'UTILITY', 'Utility', NULL, 5, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13'),
(6, 'OTHER', 'Other', NULL, 99, 1, '2026-07-29 11:35:13', '2026-07-29 11:35:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_company_date` (`company_id`,`occurred_at`),
  ADD KEY `idx_activity_branch_date` (`branch_id`,`occurred_at`),
  ADD KEY `idx_activity_user_date` (`user_id`,`occurred_at`),
  ADD KEY `idx_activity_module_action` (`company_id`,`module_code`,`action_code`,`occurred_at`),
  ADD KEY `idx_activity_entity` (`company_id`,`entity_type`,`entity_id`,`occurred_at`),
  ADD KEY `idx_activity_status` (`company_id`,`status_id`,`occurred_at`),
  ADD KEY `idx_activity_logs_status_id` (`status_id`);

--
-- Indexes for table `activity_logs_status_masters`
--
ALTER TABLE `activity_logs_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_activity_logs_status_masters_code` (`status_code`);

--
-- Indexes for table `address_types`
--
ALTER TABLE `address_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_address_types_code` (`type_code`);

--
-- Indexes for table `auth_groups_users`
--
ALTER TABLE `auth_groups_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id_group` (`user_id`,`group`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_identities`
--
ALTER TABLE `auth_identities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `type_secret` (`type`,`secret`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_logins`
--
ALTER TABLE `auth_logins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_type_identifier` (`id_type`,`identifier`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_permissions_users`
--
ALTER TABLE `auth_permissions_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id_permission` (`user_id`,`permission`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_remember_tokens`
--
ALTER TABLE `auth_remember_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `selector` (`selector`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_token_logins`
--
ALTER TABLE `auth_token_logins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_type_identifier` (`id_type`,`identifier`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `billing_methods`
--
ALTER TABLE `billing_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_billing_methods_code` (`method_code`);

--
-- Indexes for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_boq_item_boq_id` (`boq_id`,`id`),
  ADD UNIQUE KEY `uq_boq_item_code` (`boq_id`,`item_code`),
  ADD KEY `idx_boq_item_section` (`section_id`,`display_order`),
  ADD KEY `idx_boq_item_site` (`site_id`),
  ADD KEY `idx_boq_item_zone` (`work_zone_id`),
  ADD KEY `idx_boq_item_category` (`work_category_id`),
  ADD KEY `idx_boq_item_uom` (`uom_id`),
  ADD KEY `idx_boq_item_deleted` (`deleted_at`),
  ADD KEY `fk_boq_item_boq` (`company_id`,`boq_id`),
  ADD KEY `fk_boq_item_project` (`project_id`,`boq_id`),
  ADD KEY `fk_boq_item_section` (`boq_id`,`section_id`),
  ADD KEY `fk_boq_item_site` (`project_id`,`site_id`),
  ADD KEY `fk_boq_item_zone` (`site_id`,`work_zone_id`),
  ADD KEY `fk_boq_item_created_by` (`created_by`),
  ADD KEY `fk_boq_item_updated_by` (`updated_by`);

--
-- Indexes for table `boq_item_rate_components`
--
ALTER TABLE `boq_item_rate_components`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_boq_rate_component` (`boq_item_id`,`component_type_id`,`component_name`),
  ADD KEY `idx_boq_rate_component_type` (`boq_item_id`,`component_type_id`),
  ADD KEY `idx_boq_rate_component_deleted` (`deleted_at`),
  ADD KEY `fk_boq_rate_component_created_by` (`created_by`),
  ADD KEY `idx_boq_item_rate_components_component_type_id` (`component_type_id`);

--
-- Indexes for table `boq_item_rate_components_component_type_masters`
--
ALTER TABLE `boq_item_rate_components_component_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_boq_item_rate_components_component_type_masters_code` (`component_type_code`);

--
-- Indexes for table `boq_sections`
--
ALTER TABLE `boq_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_boq_section_boq_id` (`boq_id`,`id`),
  ADD UNIQUE KEY `uq_boq_section_code` (`boq_id`,`section_code`),
  ADD KEY `idx_boq_section_parent` (`parent_section_id`),
  ADD KEY `idx_boq_section_order` (`boq_id`,`display_order`),
  ADD KEY `idx_boq_section_deleted` (`deleted_at`),
  ADD KEY `fk_boq_section_boq` (`company_id`,`boq_id`),
  ADD KEY `fk_boq_section_project` (`project_id`,`boq_id`),
  ADD KEY `fk_boq_section_created_by` (`created_by`),
  ADD KEY `fk_boq_section_updated_by` (`updated_by`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_branches_company_code` (`company_id`,`branch_code`),
  ADD KEY `idx_branches_company_name` (`company_id`,`branch_name`),
  ADD KEY `idx_branches_company_active` (`company_id`,`is_active`),
  ADD KEY `idx_branches_deleted` (`deleted_at`),
  ADD KEY `idx_branches_branch_type_id` (`branch_type_id`);

--
-- Indexes for table `branch_types`
--
ALTER TABLE `branch_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_branch_types_code` (`type_code`);

--
-- Indexes for table `budget_approvals`
--
ALTER TABLE `budget_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_budget_approval_budget` (`company_id`,`project_id`,`budget_id`,`action_at`),
  ADD KEY `idx_budget_approval_revision` (`revision_id`),
  ADD KEY `idx_budget_approval_action_by` (`action_by`),
  ADD KEY `fk_budget_approval_budget` (`company_id`,`budget_id`),
  ADD KEY `fk_budget_approval_project` (`project_id`,`budget_id`),
  ADD KEY `fk_budget_approval_revision` (`budget_id`,`revision_id`),
  ADD KEY `idx_budget_approvals_action_id` (`action_id`);

--
-- Indexes for table `budget_approvals_action_masters`
--
ALTER TABLE `budget_approvals_action_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_approvals_action_masters_code` (`action_code`);

--
-- Indexes for table `budget_revisions`
--
ALTER TABLE `budget_revisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_revision_budget_id` (`budget_id`,`id`),
  ADD UNIQUE KEY `uq_budget_revision_no` (`budget_id`,`revision_no`),
  ADD KEY `idx_budget_revision_status` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_budget_revision_requested_by` (`requested_by`),
  ADD KEY `idx_budget_revision_decided_by` (`decided_by`),
  ADD KEY `fk_budget_revision_budget` (`company_id`,`budget_id`),
  ADD KEY `fk_budget_revision_project` (`project_id`,`budget_id`),
  ADD KEY `idx_budget_revisions_status_id` (`status_id`);

--
-- Indexes for table `budget_revisions_status_masters`
--
ALTER TABLE `budget_revisions_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_revisions_status_masters_code` (`status_code`);

--
-- Indexes for table `budget_revision_lines`
--
ALTER TABLE `budget_revision_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_revision_line` (`revision_id`,`budget_line_id`),
  ADD KEY `idx_budget_revision_line_budget` (`budget_line_id`),
  ADD KEY `idx_budget_revision_lines_change_type_id` (`change_type_id`);

--
-- Indexes for table `budget_revision_lines_change_type_masters`
--
ALTER TABLE `budget_revision_lines_change_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_revision_lines_change_type_masters_code` (`change_type_code`);

--
-- Indexes for table `budget_status_logs`
--
ALTER TABLE `budget_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_budget_status_log_budget` (`company_id`,`project_id`,`budget_id`,`changed_at`),
  ADD KEY `idx_budget_status_log_status` (`company_id`,`to_status_id`,`changed_at`),
  ADD KEY `idx_budget_status_log_user` (`changed_by`),
  ADD KEY `fk_budget_status_log_budget` (`company_id`,`budget_id`),
  ADD KEY `fk_budget_status_log_project` (`project_id`,`budget_id`),
  ADD KEY `idx_budget_status_logs_from_status_id` (`from_status_id`),
  ADD KEY `idx_budget_status_logs_to_status_id` (`to_status_id`);

--
-- Indexes for table `budget_status_logs_from_status_masters`
--
ALTER TABLE `budget_status_logs_from_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_status_logs_from_status_masters_code` (`from_status_code`);

--
-- Indexes for table `budget_status_logs_to_status_masters`
--
ALTER TABLE `budget_status_logs_to_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_status_logs_to_status_masters_code` (`to_status_code`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clients_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_clients_company_code` (`company_id`,`client_code`),
  ADD UNIQUE KEY `uq_clients_company_gstin` (`company_id`,`gstin`),
  ADD KEY `idx_clients_company_name` (`company_id`,`client_name`),
  ADD KEY `idx_clients_company_status` (`company_id`,`client_status_id`),
  ADD KEY `idx_clients_branch` (`branch_id`),
  ADD KEY `idx_clients_phone` (`company_id`,`phone`),
  ADD KEY `idx_clients_email` (`company_id`,`email`),
  ADD KEY `idx_clients_created_by` (`created_by`),
  ADD KEY `idx_clients_updated_by` (`updated_by`),
  ADD KEY `idx_clients_deleted` (`deleted_at`),
  ADD KEY `idx_clients_client_type_id` (`client_type_id`),
  ADD KEY `idx_clients_gst_registration_type_id` (`gst_registration_type_id`),
  ADD KEY `idx_clients_client_source_id` (`client_source_id`),
  ADD KEY `idx_clients_client_status_id` (`client_status_id`);

--
-- Indexes for table `client_addresses`
--
ALTER TABLE `client_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_addresses_client` (`company_id`,`client_id`,`address_type_id`,`is_active`),
  ADD KEY `idx_client_addresses_location` (`company_id`,`city`,`state_name`),
  ADD KEY `idx_client_addresses_primary` (`client_id`,`is_primary`),
  ADD KEY `idx_client_addresses_created_by` (`created_by`),
  ADD KEY `idx_client_addresses_updated_by` (`updated_by`),
  ADD KEY `idx_client_addresses_deleted` (`deleted_at`),
  ADD KEY `idx_client_addresses_address_type_id` (`address_type_id`);

--
-- Indexes for table `client_contacts`
--
ALTER TABLE `client_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_contacts_client` (`company_id`,`client_id`,`is_active`),
  ADD KEY `idx_client_contacts_name` (`company_id`,`contact_name`),
  ADD KEY `idx_client_contacts_email` (`company_id`,`email`),
  ADD KEY `idx_client_contacts_phone` (`company_id`,`phone`),
  ADD KEY `idx_client_contacts_primary` (`client_id`,`is_primary`),
  ADD KEY `idx_client_contacts_created_by` (`created_by`),
  ADD KEY `idx_client_contacts_updated_by` (`updated_by`),
  ADD KEY `idx_client_contacts_deleted` (`deleted_at`),
  ADD KEY `idx_client_contacts_communication_mode_id` (`communication_mode_id`);

--
-- Indexes for table `client_documents`
--
ALTER TABLE `client_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_documents_storage` (`company_id`,`stored_file_name`),
  ADD KEY `idx_client_documents_client` (`company_id`,`client_id`,`client_document_status_id`),
  ADD KEY `idx_client_documents_type` (`document_type_id`),
  ADD KEY `idx_client_documents_number` (`company_id`,`document_number`),
  ADD KEY `idx_client_documents_expiry` (`company_id`,`valid_until`,`client_document_status_id`),
  ADD KEY `idx_client_documents_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_client_documents_hash` (`file_hash_sha256`),
  ADD KEY `idx_client_documents_deleted` (`deleted_at`),
  ADD KEY `fk_client_documents_type` (`company_id`,`document_type_id`),
  ADD KEY `idx_client_documents_status_id` (`client_document_status_id`);

--
-- Indexes for table `client_document_statuses`
--
ALTER TABLE `client_document_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_client_document_statuses_code` (`status_code`);

--
-- Indexes for table `client_sources`
--
ALTER TABLE `client_sources`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_client_sources_code` (`source_code`);

--
-- Indexes for table `client_statuses`
--
ALTER TABLE `client_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_client_statuses_code` (`status_code`);

--
-- Indexes for table `communication_modes`
--
ALTER TABLE `communication_modes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_communication_modes_code` (`mode_code`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_companies_code` (`company_code`),
  ADD UNIQUE KEY `uq_companies_gstin` (`gstin`),
  ADD KEY `idx_companies_name` (`company_name`),
  ADD KEY `idx_companies_status` (`subscription_status_id`,`is_active`),
  ADD KEY `idx_companies_deleted` (`deleted_at`),
  ADD KEY `idx_companies_company_type_id` (`company_type_id`),
  ADD KEY `idx_companies_subscription_status_id` (`subscription_status_id`);

--
-- Indexes for table `company_navigation_items`
--
ALTER TABLE `company_navigation_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_company_navigation_item` (`company_id`,`navigation_item_id`),
  ADD KEY `fk_company_navigation_item` (`navigation_item_id`);

--
-- Indexes for table `company_types`
--
ALTER TABLE `company_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_company_types_code` (`type_code`);

--
-- Indexes for table `daily_material_consumption`
--
ALTER TABLE `daily_material_consumption`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_material_consumption_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_daily_material_consumption_line` (`daily_report_id`,`material_id`,`zone_id`,`work_progress_id`),
  ADD KEY `idx_daily_material_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_material_project` (`company_id`,`project_id`),
  ADD KEY `idx_daily_material_progress` (`work_progress_id`),
  ADD KEY `idx_daily_material_material` (`company_id`,`material_id`),
  ADD KEY `idx_daily_material_uom` (`uom_id`),
  ADD KEY `idx_daily_material_zone` (`zone_id`),
  ADD KEY `idx_daily_material_transaction` (`project_id`,`stock_transaction_id`),
  ADD KEY `idx_daily_material_created_by` (`created_by`),
  ADD KEY `idx_daily_material_updated_by` (`updated_by`),
  ADD KEY `idx_daily_material_deleted` (`deleted_at`),
  ADD KEY `fk_daily_material_report` (`project_id`,`daily_report_id`),
  ADD KEY `fk_daily_material_progress` (`company_id`,`work_progress_id`),
  ADD KEY `idx_daily_material_consumption_source_type_id` (`source_type_id`);

--
-- Indexes for table `daily_material_consumption_source_type_masters`
--
ALTER TABLE `daily_material_consumption_source_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_material_consumption_source_type_masters_code` (`source_type_code`);

--
-- Indexes for table `daily_report_approvals`
--
ALTER TABLE `daily_report_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_daily_report_approvals_report` (`company_id`,`daily_report_id`,`action_at`),
  ADD KEY `idx_daily_report_approvals_action` (`action_type_id`,`action_at`),
  ADD KEY `idx_daily_report_approvals_action_by` (`action_by`),
  ADD KEY `idx_daily_report_approvals_action_type_id` (`action_type_id`),
  ADD KEY `idx_daily_report_approvals_from_status_id` (`from_status_id`),
  ADD KEY `idx_daily_report_approvals_to_status_id` (`to_status_id`);

--
-- Indexes for table `daily_report_approvals_action_type_masters`
--
ALTER TABLE `daily_report_approvals_action_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_report_approvals_action_type_masters_code` (`action_type_code`);

--
-- Indexes for table `daily_report_approvals_from_status_masters`
--
ALTER TABLE `daily_report_approvals_from_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_report_approvals_from_status_masters_code` (`from_status_code`);

--
-- Indexes for table `daily_report_approvals_to_status_masters`
--
ALTER TABLE `daily_report_approvals_to_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_report_approvals_to_status_masters_code` (`to_status_code`);

--
-- Indexes for table `daily_site_equipment`
--
ALTER TABLE `daily_site_equipment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_equipment_line` (`daily_report_id`,`equipment_code`,`equipment_name`),
  ADD KEY `idx_daily_equipment_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_equipment_zone` (`zone_id`),
  ADD KEY `idx_daily_equipment_status` (`status_id`),
  ADD KEY `idx_daily_equipment_created_by` (`created_by`),
  ADD KEY `idx_daily_equipment_updated_by` (`updated_by`),
  ADD KEY `idx_daily_equipment_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_equipment_ownership_type_id` (`ownership_type_id`),
  ADD KEY `idx_daily_site_equipment_status_id` (`status_id`);

--
-- Indexes for table `daily_site_equipment_ownership_type_masters`
--
ALTER TABLE `daily_site_equipment_ownership_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_equipment_ownership_type_masters_code` (`ownership_type_code`);

--
-- Indexes for table `daily_site_equipment_status_masters`
--
ALTER TABLE `daily_site_equipment_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_equipment_status_masters_code` (`status_code`);

--
-- Indexes for table `daily_site_issues`
--
ALTER TABLE `daily_site_issues`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_no` (`company_id`,`issue_no`),
  ADD KEY `idx_daily_site_issues_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_site_issues_zone` (`zone_id`),
  ADD KEY `idx_daily_site_issues_open` (`company_id`,`status_id`,`priority_id`),
  ADD KEY `idx_daily_site_issues_type` (`company_id`,`issue_type_id`),
  ADD KEY `idx_daily_site_issues_target` (`target_resolution_date`),
  ADD KEY `idx_daily_site_issues_reported_by` (`reported_by`),
  ADD KEY `idx_daily_site_issues_assigned_to` (`assigned_to`),
  ADD KEY `idx_daily_site_issues_created_by` (`created_by`),
  ADD KEY `idx_daily_site_issues_updated_by` (`updated_by`),
  ADD KEY `idx_daily_site_issues_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_issues_issue_type_id` (`issue_type_id`),
  ADD KEY `idx_daily_site_issues_priority_id` (`priority_id`),
  ADD KEY `idx_daily_site_issues_work_impact_id` (`work_impact_id`),
  ADD KEY `idx_daily_site_issues_status_id` (`status_id`);

--
-- Indexes for table `daily_site_issues_issue_type_masters`
--
ALTER TABLE `daily_site_issues_issue_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_issue_type_masters_code` (`issue_type_code`);

--
-- Indexes for table `daily_site_issues_priority_masters`
--
ALTER TABLE `daily_site_issues_priority_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_priority_masters_code` (`priority_code`);

--
-- Indexes for table `daily_site_issues_status_masters`
--
ALTER TABLE `daily_site_issues_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_status_masters_code` (`status_code`);

--
-- Indexes for table `daily_site_issues_work_impact_masters`
--
ALTER TABLE `daily_site_issues_work_impact_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_issues_work_impact_masters_code` (`work_impact_code`);

--
-- Indexes for table `daily_site_manpower`
--
ALTER TABLE `daily_site_manpower`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_manpower_line` (`daily_report_id`,`labour_category_id`,`contractor_id`,`zone_id`),
  ADD KEY `idx_daily_manpower_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_manpower_category` (`labour_category_id`),
  ADD KEY `idx_daily_manpower_contractor` (`company_id`,`contractor_id`),
  ADD KEY `idx_daily_manpower_zone` (`zone_id`),
  ADD KEY `idx_daily_manpower_created_by` (`created_by`),
  ADD KEY `idx_daily_manpower_updated_by` (`updated_by`),
  ADD KEY `idx_daily_manpower_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_manpower_source_type_id` (`source_type_id`);

--
-- Indexes for table `daily_site_manpower_source_type_masters`
--
ALTER TABLE `daily_site_manpower_source_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_manpower_source_type_masters_code` (`source_type_code`);

--
-- Indexes for table `daily_site_photos`
--
ALTER TABLE `daily_site_photos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_photos_company_id` (`company_id`,`id`),
  ADD KEY `idx_daily_site_photos_report` (`company_id`,`daily_report_id`,`display_order`),
  ADD KEY `idx_daily_site_photos_progress` (`company_id`,`work_progress_id`),
  ADD KEY `idx_daily_site_photos_issue` (`company_id`,`issue_id`),
  ADD KEY `idx_daily_site_photos_zone` (`zone_id`),
  ADD KEY `idx_daily_site_photos_type` (`photo_type_id`),
  ADD KEY `idx_daily_site_photos_captured` (`captured_at`),
  ADD KEY `idx_daily_site_photos_captured_by` (`captured_by`),
  ADD KEY `idx_daily_site_photos_created_by` (`created_by`),
  ADD KEY `idx_daily_site_photos_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_photos_photo_type_id` (`photo_type_id`);

--
-- Indexes for table `daily_site_photos_photo_type_masters`
--
ALTER TABLE `daily_site_photos_photo_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_photos_photo_type_masters_code` (`photo_type_code`);

--
-- Indexes for table `daily_site_reports`
--
ALTER TABLE `daily_site_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_site_id` (`site_id`,`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_no` (`company_id`,`report_no`),
  ADD UNIQUE KEY `uq_daily_site_reports_date` (`company_id`,`project_id`,`site_id`,`report_date`,`active_report`),
  ADD KEY `idx_daily_site_reports_status` (`company_id`,`status_id`,`report_date`),
  ADD KEY `idx_daily_site_reports_project_date` (`company_id`,`project_id`,`report_date`),
  ADD KEY `idx_daily_site_reports_site_date` (`site_id`,`report_date`),
  ADD KEY `idx_daily_site_reports_prepared_by` (`prepared_by`),
  ADD KEY `idx_daily_site_reports_engineer` (`site_engineer_id`),
  ADD KEY `idx_daily_site_reports_supervisor` (`supervisor_id`),
  ADD KEY `idx_daily_site_reports_submitted_by` (`submitted_by`),
  ADD KEY `idx_daily_site_reports_approved_by` (`approved_by`),
  ADD KEY `idx_daily_site_reports_created_by` (`created_by`),
  ADD KEY `idx_daily_site_reports_updated_by` (`updated_by`),
  ADD KEY `idx_daily_site_reports_deleted` (`deleted_at`),
  ADD KEY `fk_daily_site_reports_site` (`project_id`,`site_id`),
  ADD KEY `idx_daily_site_reports_shift_type_id` (`shift_type_id`),
  ADD KEY `idx_daily_site_reports_status_id` (`status_id`);

--
-- Indexes for table `daily_site_reports_shift_type_masters`
--
ALTER TABLE `daily_site_reports_shift_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_shift_type_masters_code` (`shift_type_code`);

--
-- Indexes for table `daily_site_reports_status_masters`
--
ALTER TABLE `daily_site_reports_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_reports_status_masters_code` (`status_code`);

--
-- Indexes for table `daily_site_visitors`
--
ALTER TABLE `daily_site_visitors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_daily_site_visitors_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_site_visitors_type` (`visit_type_id`),
  ADD KEY `idx_daily_site_visitors_hosted_by` (`hosted_by`),
  ADD KEY `idx_daily_site_visitors_follow_up` (`follow_up_required`,`follow_up_date`),
  ADD KEY `idx_daily_site_visitors_follow_owner` (`follow_up_owner`),
  ADD KEY `idx_daily_site_visitors_created_by` (`created_by`),
  ADD KEY `idx_daily_site_visitors_updated_by` (`updated_by`),
  ADD KEY `idx_daily_site_visitors_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_visitors_visit_type_id` (`visit_type_id`);

--
-- Indexes for table `daily_site_visitors_visit_type_masters`
--
ALTER TABLE `daily_site_visitors_visit_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_visitors_visit_type_masters_code` (`visit_type_code`);

--
-- Indexes for table `daily_site_weather`
--
ALTER TABLE `daily_site_weather`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_weather_period` (`daily_report_id`,`weather_period_id`,`observation_time`),
  ADD KEY `idx_daily_site_weather_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_site_weather_impact` (`work_impact_id`),
  ADD KEY `idx_daily_site_weather_created_by` (`created_by`),
  ADD KEY `idx_daily_site_weather_deleted` (`deleted_at`),
  ADD KEY `idx_daily_site_weather_weather_period_id` (`weather_period_id`),
  ADD KEY `idx_daily_site_weather_weather_condition_id` (`weather_condition_id`),
  ADD KEY `idx_daily_site_weather_work_impact_id` (`work_impact_id`);

--
-- Indexes for table `daily_site_weather_weather_condition_masters`
--
ALTER TABLE `daily_site_weather_weather_condition_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_weather_weather_condition_masters_code` (`weather_condition_code`);

--
-- Indexes for table `daily_site_weather_weather_period_masters`
--
ALTER TABLE `daily_site_weather_weather_period_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_weather_weather_period_masters_code` (`weather_period_code`);

--
-- Indexes for table `daily_site_weather_work_impact_masters`
--
ALTER TABLE `daily_site_weather_work_impact_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_site_weather_work_impact_masters_code` (`work_impact_code`);

--
-- Indexes for table `daily_work_progress`
--
ALTER TABLE `daily_work_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_work_progress_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_daily_work_progress_line` (`daily_report_id`,`boq_item_id`,`zone_id`,`location_description`),
  ADD KEY `idx_daily_work_progress_report` (`company_id`,`daily_report_id`),
  ADD KEY `idx_daily_work_progress_project` (`company_id`,`project_id`),
  ADD KEY `idx_daily_work_progress_boq_item` (`boq_item_id`),
  ADD KEY `idx_daily_work_progress_site` (`project_id`,`site_id`),
  ADD KEY `idx_daily_work_progress_zone` (`site_id`,`zone_id`),
  ADD KEY `idx_daily_work_progress_uom` (`uom_id`),
  ADD KEY `idx_daily_work_progress_quality` (`quality_status_id`),
  ADD KEY `idx_daily_work_progress_inspected_by` (`inspected_by`),
  ADD KEY `idx_daily_work_progress_created_by` (`created_by`),
  ADD KEY `idx_daily_work_progress_updated_by` (`updated_by`),
  ADD KEY `idx_daily_work_progress_deleted` (`deleted_at`),
  ADD KEY `fk_daily_work_progress_report` (`project_id`,`daily_report_id`),
  ADD KEY `idx_daily_work_progress_quality_status_id` (`quality_status_id`),
  ADD KEY `idx_daily_work_progress_work_status_id` (`work_status_id`);

--
-- Indexes for table `daily_work_progress_quality_status_masters`
--
ALTER TABLE `daily_work_progress_quality_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_work_progress_quality_status_masters_code` (`quality_status_code`);

--
-- Indexes for table `daily_work_progress_work_status_masters`
--
ALTER TABLE `daily_work_progress_work_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_daily_work_progress_work_status_masters_code` (`work_status_code`);

--
-- Indexes for table `dashboard_alerts`
--
ALTER TABLE `dashboard_alerts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dashboard_alerts_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_dashboard_alert_no` (`company_id`,`alert_no`),
  ADD KEY `idx_dashboard_alert_queue` (`company_id`,`status_id`,`severity_id`,`due_date`),
  ADD KEY `idx_dashboard_alert_project` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_dashboard_alert_assignee` (`assigned_to`,`status_id`),
  ADD KEY `fk_dashboard_alert_site` (`project_id`,`site_id`),
  ADD KEY `fk_dashboard_alert_ack_by` (`acknowledged_by`),
  ADD KEY `fk_dashboard_alert_resolved_by` (`resolved_by`),
  ADD KEY `fk_dashboard_alert_created_by` (`created_by`),
  ADD KEY `idx_dashboard_alerts_alert_type_id` (`alert_type_id`),
  ADD KEY `idx_dashboard_alerts_severity_id` (`severity_id`),
  ADD KEY `idx_dashboard_alerts_status_id` (`status_id`);

--
-- Indexes for table `dashboard_alerts_alert_type_masters`
--
ALTER TABLE `dashboard_alerts_alert_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dashboard_alerts_alert_type_masters_code` (`alert_type_code`);

--
-- Indexes for table `dashboard_alerts_severity_masters`
--
ALTER TABLE `dashboard_alerts_severity_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dashboard_alerts_severity_masters_code` (`severity_code`);

--
-- Indexes for table `dashboard_alerts_status_masters`
--
ALTER TABLE `dashboard_alerts_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dashboard_alerts_status_masters_code` (`status_code`);

--
-- Indexes for table `dashboard_alert_actions`
--
ALTER TABLE `dashboard_alert_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alert_actions_alert` (`company_id`,`alert_id`,`action_at`),
  ADD KEY `idx_alert_actions_user` (`action_by`,`action_at`),
  ADD KEY `idx_dashboard_alert_actions_action_type_id` (`action_type_id`);

--
-- Indexes for table `dashboard_alert_actions_action_type_masters`
--
ALTER TABLE `dashboard_alert_actions_action_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dashboard_alert_actions_action_type_masters_code` (`action_type_code`);

--
-- Indexes for table `document_types`
--
ALTER TABLE `document_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_document_type_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_document_type_company_code` (`company_id`,`document_type_code`),
  ADD KEY `idx_document_type_company_name` (`company_id`,`document_type_name`),
  ADD KEY `idx_document_type_scope` (`company_id`,`entity_scope_id`,`is_active`),
  ADD KEY `idx_document_type_created_by` (`created_by`),
  ADD KEY `idx_document_type_updated_by` (`updated_by`),
  ADD KEY `idx_document_type_deleted` (`deleted_at`),
  ADD KEY `idx_document_types_entity_scope_id` (`entity_scope_id`);

--
-- Indexes for table `document_types_entity_scope_masters`
--
ALTER TABLE `document_types_entity_scope_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_document_types_entity_scope_masters_code` (`entity_scope_code`);

--
-- Indexes for table `expense_allocations`
--
ALTER TABLE `expense_allocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_allocation_line` (`bill_item_id`,`budget_line_id`),
  ADD KEY `idx_expense_allocations_bill` (`company_id`,`bill_id`),
  ADD KEY `idx_expense_allocations_budget` (`budget_id`,`budget_line_id`),
  ADD KEY `fk_expense_allocations_item` (`company_id`,`bill_item_id`),
  ADD KEY `fk_expense_allocations_budget` (`company_id`,`budget_id`),
  ADD KEY `fk_expense_allocations_created_by` (`created_by`),
  ADD KEY `idx_expense_allocations_allocation_type_id` (`allocation_type_id`);

--
-- Indexes for table `expense_allocations_allocation_type_masters`
--
ALTER TABLE `expense_allocations_allocation_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_allocations_allocation_type_masters_code` (`allocation_type_code`);

--
-- Indexes for table `expense_approvals`
--
ALTER TABLE `expense_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_approvals_entity` (`company_id`,`entity_type_id`,`entity_id`,`action_at`),
  ADD KEY `idx_expense_approvals_user` (`action_by`),
  ADD KEY `idx_expense_approvals_entity_type_id` (`entity_type_id`),
  ADD KEY `idx_expense_approvals_action_type_id` (`action_type_id`);

--
-- Indexes for table `expense_approvals_action_type_masters`
--
ALTER TABLE `expense_approvals_action_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_approvals_action_type_masters_code` (`action_type_code`);

--
-- Indexes for table `expense_approvals_entity_type_masters`
--
ALTER TABLE `expense_approvals_entity_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_approvals_entity_type_masters_code` (`entity_type_code`);

--
-- Indexes for table `expense_bills`
--
ALTER TABLE `expense_bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_bills_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_expense_bills_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_expense_bills_voucher` (`company_id`,`internal_voucher_no`),
  ADD KEY `idx_expense_bills_bill` (`company_id`,`payee_name`,`bill_no`),
  ADD KEY `idx_expense_bills_status` (`company_id`,`project_id`,`status_id`,`payment_status_id`),
  ADD KEY `idx_expense_bills_due` (`company_id`,`payment_status_id`,`due_date`),
  ADD KEY `idx_expense_bills_site` (`project_id`,`site_id`),
  ADD KEY `idx_expense_bills_zone` (`site_id`,`zone_id`),
  ADD KEY `idx_expense_bills_request` (`request_id`),
  ADD KEY `idx_expense_bills_supplier` (`company_id`,`supplier_id`),
  ADD KEY `idx_expense_bills_po` (`purchase_order_id`),
  ADD KEY `idx_expense_bills_receipt` (`material_receipt_id`),
  ADD KEY `fk_expense_bills_request` (`company_id`,`request_id`),
  ADD KEY `fk_expense_bills_po` (`company_id`,`purchase_order_id`),
  ADD KEY `fk_expense_bills_receipt` (`company_id`,`material_receipt_id`),
  ADD KEY `fk_expense_bills_submitted_by` (`submitted_by`),
  ADD KEY `fk_expense_bills_approved_by` (`approved_by`),
  ADD KEY `fk_expense_bills_posted_by` (`posted_by`),
  ADD KEY `fk_expense_bills_created_by` (`created_by`),
  ADD KEY `fk_expense_bills_updated_by` (`updated_by`),
  ADD KEY `idx_expense_bills_payee_type_id` (`payee_type_id`),
  ADD KEY `idx_expense_bills_payment_status_id` (`payment_status_id`),
  ADD KEY `idx_expense_bills_status_id` (`status_id`);

--
-- Indexes for table `expense_bills_payee_type_masters`
--
ALTER TABLE `expense_bills_payee_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_bills_payee_type_masters_code` (`payee_type_code`);

--
-- Indexes for table `expense_bills_payment_status_masters`
--
ALTER TABLE `expense_bills_payment_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_bills_payment_status_masters_code` (`payment_status_code`);

--
-- Indexes for table `expense_bills_status_masters`
--
ALTER TABLE `expense_bills_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_bills_status_masters_code` (`status_code`);

--
-- Indexes for table `expense_bill_items`
--
ALTER TABLE `expense_bill_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_bill_items_company_id` (`company_id`,`id`),
  ADD KEY `idx_expense_bill_items_bill` (`company_id`,`bill_id`),
  ADD KEY `idx_expense_bill_items_category` (`expense_category_id`),
  ADD KEY `idx_expense_bill_items_request` (`request_item_id`),
  ADD KEY `fk_expense_bill_items_project` (`project_id`,`bill_id`),
  ADD KEY `fk_expense_bill_items_request` (`company_id`,`request_item_id`),
  ADD KEY `fk_expense_bill_items_created_by` (`created_by`),
  ADD KEY `fk_expense_bill_items_updated_by` (`updated_by`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_category_company_code` (`company_id`,`category_code`),
  ADD KEY `idx_expense_category_parent` (`parent_id`),
  ADD KEY `idx_expense_category_company_name` (`company_id`,`category_name`),
  ADD KEY `idx_expense_category_scope` (`company_id`,`expense_scope_id`,`is_active`),
  ADD KEY `idx_expense_category_created_by` (`created_by`),
  ADD KEY `idx_expense_category_updated_by` (`updated_by`),
  ADD KEY `idx_expense_category_deleted` (`deleted_at`),
  ADD KEY `idx_expense_categories_expense_scope_id` (`expense_scope_id`);

--
-- Indexes for table `expense_categories_expense_scope_masters`
--
ALTER TABLE `expense_categories_expense_scope_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_categories_expense_scope_masters_code` (`expense_scope_code`);

--
-- Indexes for table `expense_documents`
--
ALTER TABLE `expense_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_documents_bill` (`company_id`,`bill_id`),
  ADD KEY `idx_expense_documents_type` (`document_type_id`),
  ADD KEY `fk_expense_documents_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `expense_payments`
--
ALTER TABLE `expense_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_payments_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_expense_payments_no` (`company_id`,`payment_no`),
  ADD KEY `idx_expense_payments_bill` (`company_id`,`bill_id`,`status_id`),
  ADD KEY `idx_expense_payments_project` (`company_id`,`project_id`,`payment_date`),
  ADD KEY `idx_expense_payments_cash` (`company_id`,`petty_cash_account_id`),
  ADD KEY `fk_expense_payments_project` (`project_id`,`bill_id`),
  ADD KEY `fk_expense_payments_submitted_by` (`submitted_by`),
  ADD KEY `fk_expense_payments_approved_by` (`approved_by`),
  ADD KEY `fk_expense_payments_paid_by` (`paid_by`),
  ADD KEY `fk_expense_payments_created_by` (`created_by`),
  ADD KEY `fk_expense_payments_updated_by` (`updated_by`),
  ADD KEY `idx_expense_payments_payment_mode_id` (`payment_mode_id`),
  ADD KEY `idx_expense_payments_status_id` (`status_id`);

--
-- Indexes for table `expense_payments_payment_mode_masters`
--
ALTER TABLE `expense_payments_payment_mode_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_payments_payment_mode_masters_code` (`payment_mode_code`);

--
-- Indexes for table `expense_payments_status_masters`
--
ALTER TABLE `expense_payments_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_payments_status_masters_code` (`status_code`);

--
-- Indexes for table `expense_requests`
--
ALTER TABLE `expense_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_requests_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_expense_requests_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_expense_requests_no` (`company_id`,`request_no`),
  ADD KEY `idx_expense_requests_status` (`company_id`,`project_id`,`status_id`,`request_date`),
  ADD KEY `idx_expense_requests_site` (`project_id`,`site_id`),
  ADD KEY `idx_expense_requests_zone` (`site_id`,`zone_id`),
  ADD KEY `fk_expense_requests_requested_by` (`requested_by`),
  ADD KEY `fk_expense_requests_submitted_by` (`submitted_by`),
  ADD KEY `fk_expense_requests_approved_by` (`approved_by`),
  ADD KEY `fk_expense_requests_created_by` (`created_by`),
  ADD KEY `fk_expense_requests_updated_by` (`updated_by`),
  ADD KEY `idx_expense_requests_status_id` (`status_id`);

--
-- Indexes for table `expense_requests_status_masters`
--
ALTER TABLE `expense_requests_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_requests_status_masters_code` (`status_code`);

--
-- Indexes for table `expense_request_items`
--
ALTER TABLE `expense_request_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_request_items_company_id` (`company_id`,`id`),
  ADD KEY `idx_expense_request_items_request` (`company_id`,`request_id`),
  ADD KEY `idx_expense_request_items_category` (`expense_category_id`),
  ADD KEY `idx_expense_request_items_budget` (`budget_line_id`),
  ADD KEY `fk_expense_request_items_project` (`project_id`,`request_id`),
  ADD KEY `fk_expense_request_items_created_by` (`created_by`),
  ADD KEY `fk_expense_request_items_updated_by` (`updated_by`);

--
-- Indexes for table `expense_status_logs`
--
ALTER TABLE `expense_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_status_entity` (`company_id`,`entity_type_id`,`entity_id`,`changed_at`),
  ADD KEY `fk_expense_status_user` (`changed_by`),
  ADD KEY `idx_expense_status_logs_entity_type_id` (`entity_type_id`);

--
-- Indexes for table `expense_status_logs_entity_type_masters`
--
ALTER TABLE `expense_status_logs_entity_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_expense_status_logs_entity_type_masters_code` (`entity_type_code`);

--
-- Indexes for table `financial_years`
--
ALTER TABLE `financial_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_financial_year_code` (`company_id`,`year_code`,`active_year`),
  ADD UNIQUE KEY `uq_financial_year_dates` (`company_id`,`start_date`,`end_date`,`active_year`),
  ADD UNIQUE KEY `uq_financial_year_current` (`company_id`,`current_year_marker`),
  ADD KEY `idx_financial_year_status` (`company_id`,`status_id`,`is_active`),
  ADD KEY `idx_financial_year_dates` (`company_id`,`start_date`,`end_date`),
  ADD KEY `idx_financial_year_created_by` (`created_by`),
  ADD KEY `idx_financial_year_updated_by` (`updated_by`),
  ADD KEY `fk_financial_year_closed_by` (`closed_by`),
  ADD KEY `idx_financial_years_status_id` (`status_id`);

--
-- Indexes for table `financial_years_status_masters`
--
ALTER TABLE `financial_years_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_financial_years_status_masters_code` (`status_code`);

--
-- Indexes for table `gst_registration_types`
--
ALTER TABLE `gst_registration_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_gst_registration_types_code` (`type_code`);

--
-- Indexes for table `labour_attendance_batches`
--
ALTER TABLE `labour_attendance_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_attendance_batches_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_attendance_batch_day` (`project_id`,`site_id`,`attendance_date`,`shift_code`),
  ADD KEY `idx_labour_attendance_batch_status` (`company_id`,`attendance_date`,`status_id`),
  ADD KEY `idx_labour_attendance_batch_site` (`company_id`,`project_id`,`site_id`,`attendance_date`),
  ADD KEY `idx_labour_attendance_batch_prepared_by` (`prepared_by`),
  ADD KEY `idx_labour_attendance_batch_approved_by` (`approved_by`),
  ADD KEY `fk_labour_attendance_batch_created_by` (`created_by`),
  ADD KEY `fk_labour_attendance_batch_updated_by` (`updated_by`),
  ADD KEY `idx_labour_attendance_batches_status_id` (`status_id`);

--
-- Indexes for table `labour_attendance_batches_status_masters`
--
ALTER TABLE `labour_attendance_batches_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_attendance_batches_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_attendance_entries`
--
ALTER TABLE `labour_attendance_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_attendance_entries_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_attendance_worker` (`batch_id`,`worker_id`),
  ADD KEY `idx_labour_attendance_entry_assignment` (`assignment_id`),
  ADD KEY `idx_labour_attendance_entry_worker` (`company_id`,`worker_id`,`attendance_status_id`),
  ADD KEY `idx_labour_attendance_entry_zone` (`zone_id`),
  ADD KEY `idx_labour_attendance_entry_created_by` (`created_by`),
  ADD KEY `idx_labour_attendance_entry_updated_by` (`updated_by`),
  ADD KEY `fk_labour_attendance_entry_batch` (`company_id`,`batch_id`),
  ADD KEY `fk_labour_attendance_entry_assignment` (`company_id`,`assignment_id`),
  ADD KEY `idx_labour_attendance_entries_attendance_status_id` (`attendance_status_id`),
  ADD KEY `idx_labour_attendance_entries_attendance_source_id` (`attendance_source_id`);

--
-- Indexes for table `labour_attendance_entries_attendance_source_masters`
--
ALTER TABLE `labour_attendance_entries_attendance_source_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_attendance_entries_attendance_source_ma_5dc5068f` (`attendance_source_code`);

--
-- Indexes for table `labour_attendance_entries_attendance_status_masters`
--
ALTER TABLE `labour_attendance_entries_attendance_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_attendance_entries_attendance_status_ma_829d41a1` (`attendance_status_code`);

--
-- Indexes for table `labour_categories`
--
ALTER TABLE `labour_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_category_company_code` (`company_id`,`category_code`),
  ADD KEY `idx_labour_category_company_name` (`company_id`,`category_name`),
  ADD KEY `idx_labour_category_skill` (`company_id`,`skill_level_id`,`is_active`),
  ADD KEY `idx_labour_category_created_by` (`created_by`),
  ADD KEY `idx_labour_category_updated_by` (`updated_by`),
  ADD KEY `idx_labour_category_deleted` (`deleted_at`),
  ADD KEY `idx_labour_categories_skill_level_id` (`skill_level_id`),
  ADD KEY `idx_labour_categories_wage_basis_id` (`wage_basis_id`);

--
-- Indexes for table `labour_categories_skill_level_masters`
--
ALTER TABLE `labour_categories_skill_level_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_categories_skill_level_masters_code` (`skill_level_code`);

--
-- Indexes for table `labour_categories_wage_basis_masters`
--
ALTER TABLE `labour_categories_wage_basis_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_categories_wage_basis_masters_code` (`wage_basis_code`);

--
-- Indexes for table `labour_contractors`
--
ALTER TABLE `labour_contractors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_contractors_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_contractors_code` (`company_id`,`contractor_code`),
  ADD UNIQUE KEY `uq_labour_contractors_subcontractor` (`company_id`,`subcontractor_id`),
  ADD KEY `idx_labour_contractors_name` (`company_id`,`contractor_name`),
  ADD KEY `idx_labour_contractors_status` (`company_id`,`status_id`),
  ADD KEY `idx_labour_contractors_created_by` (`created_by`),
  ADD KEY `idx_labour_contractors_updated_by` (`updated_by`),
  ADD KEY `idx_labour_contractors_deleted` (`deleted_at`),
  ADD KEY `idx_labour_contractors_status_id` (`status_id`);

--
-- Indexes for table `labour_contractors_status_masters`
--
ALTER TABLE `labour_contractors_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_contractors_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_payments`
--
ALTER TABLE `labour_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_payments_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_payment_no` (`company_id`,`payment_no`),
  ADD KEY `idx_labour_payment_period` (`company_id`,`wage_period_id`,`status_id`),
  ADD KEY `idx_labour_payment_worker` (`company_id`,`worker_id`,`payment_date`),
  ADD KEY `idx_labour_payment_contractor` (`company_id`,`contractor_id`,`payment_date`),
  ADD KEY `idx_labour_payment_line` (`wage_line_id`),
  ADD KEY `idx_labour_payment_approved_by` (`approved_by`),
  ADD KEY `idx_labour_payment_paid_by` (`paid_by`),
  ADD KEY `fk_labour_payment_line` (`company_id`,`wage_line_id`),
  ADD KEY `fk_labour_payment_created_by` (`created_by`),
  ADD KEY `fk_labour_payment_updated_by` (`updated_by`),
  ADD KEY `idx_labour_payments_payment_mode_id` (`payment_mode_id`),
  ADD KEY `idx_labour_payments_status_id` (`status_id`);

--
-- Indexes for table `labour_payments_payment_mode_masters`
--
ALTER TABLE `labour_payments_payment_mode_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_payments_payment_mode_masters_code` (`payment_mode_code`);

--
-- Indexes for table `labour_payments_status_masters`
--
ALTER TABLE `labour_payments_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_payments_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_project_assignments`
--
ALTER TABLE `labour_project_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_project_assignments_company_id` (`company_id`,`id`),
  ADD KEY `idx_labour_assignment_worker` (`company_id`,`worker_id`,`status_id`,`assigned_from`),
  ADD KEY `idx_labour_assignment_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_labour_assignment_zone` (`site_id`,`zone_id`),
  ADD KEY `idx_labour_assignment_category` (`labour_category_id`),
  ADD KEY `idx_labour_assignment_created_by` (`created_by`),
  ADD KEY `idx_labour_assignment_updated_by` (`updated_by`),
  ADD KEY `idx_labour_assignment_deleted` (`deleted_at`),
  ADD KEY `fk_labour_assignment_site` (`project_id`,`site_id`),
  ADD KEY `idx_labour_project_assignments_wage_basis_id` (`wage_basis_id`),
  ADD KEY `idx_labour_project_assignments_status_id` (`status_id`);

--
-- Indexes for table `labour_project_assignments_status_masters`
--
ALTER TABLE `labour_project_assignments_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_project_assignments_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_project_assignments_wage_basis_masters`
--
ALTER TABLE `labour_project_assignments_wage_basis_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_project_assignments_wage_basis_masters_code` (`wage_basis_code`);

--
-- Indexes for table `labour_status_logs`
--
ALTER TABLE `labour_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_labour_status_log_entity` (`company_id`,`entity_type_id`,`entity_id`,`changed_at`),
  ADD KEY `idx_labour_status_log_action` (`company_id`,`action_code`,`changed_at`),
  ADD KEY `idx_labour_status_log_user` (`changed_by`),
  ADD KEY `idx_labour_status_logs_entity_type_id` (`entity_type_id`);

--
-- Indexes for table `labour_status_logs_entity_type_masters`
--
ALTER TABLE `labour_status_logs_entity_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_status_logs_entity_type_masters_code` (`entity_type_code`);

--
-- Indexes for table `labour_wage_lines`
--
ALTER TABLE `labour_wage_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_wage_lines_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_wage_line_worker` (`wage_period_id`,`worker_id`),
  ADD KEY `idx_labour_wage_line_worker` (`company_id`,`worker_id`,`payment_status_id`),
  ADD KEY `idx_labour_wage_line_assignment` (`assignment_id`),
  ADD KEY `idx_labour_wage_line_created_by` (`created_by`),
  ADD KEY `idx_labour_wage_line_updated_by` (`updated_by`),
  ADD KEY `fk_labour_wage_line_period` (`company_id`,`wage_period_id`),
  ADD KEY `fk_labour_wage_line_assignment` (`company_id`,`assignment_id`),
  ADD KEY `idx_labour_wage_lines_payment_status_id` (`payment_status_id`);

--
-- Indexes for table `labour_wage_lines_payment_status_masters`
--
ALTER TABLE `labour_wage_lines_payment_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_wage_lines_payment_status_masters_code` (`payment_status_code`);

--
-- Indexes for table `labour_wage_periods`
--
ALTER TABLE `labour_wage_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_wage_periods_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_wage_period_code` (`company_id`,`project_id`,`site_id`,`period_code`),
  ADD KEY `idx_labour_wage_period_dates` (`company_id`,`period_start`,`period_end`,`status_id`),
  ADD KEY `idx_labour_wage_period_contractor` (`company_id`,`contractor_id`,`status_id`),
  ADD KEY `idx_labour_wage_period_approved_by` (`approved_by`),
  ADD KEY `idx_labour_wage_period_created_by` (`created_by`),
  ADD KEY `idx_labour_wage_period_updated_by` (`updated_by`),
  ADD KEY `fk_labour_wage_period_site` (`project_id`,`site_id`),
  ADD KEY `idx_labour_wage_periods_status_id` (`status_id`);

--
-- Indexes for table `labour_wage_periods_status_masters`
--
ALTER TABLE `labour_wage_periods_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_wage_periods_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_workers`
--
ALTER TABLE `labour_workers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_labour_workers_code` (`company_id`,`worker_code`),
  ADD KEY `idx_labour_workers_category` (`company_id`,`labour_category_id`,`status_id`),
  ADD KEY `idx_labour_workers_contractor` (`company_id`,`contractor_id`,`status_id`),
  ADD KEY `idx_labour_workers_name` (`company_id`,`worker_name`),
  ADD KEY `idx_labour_workers_phone` (`company_id`,`phone`),
  ADD KEY `idx_labour_workers_created_by` (`created_by`),
  ADD KEY `idx_labour_workers_updated_by` (`updated_by`),
  ADD KEY `idx_labour_workers_deleted` (`deleted_at`),
  ADD KEY `fk_labour_workers_category` (`labour_category_id`),
  ADD KEY `idx_labour_workers_employment_source_id` (`employment_source_id`),
  ADD KEY `idx_labour_workers_gender_id` (`gender_id`),
  ADD KEY `idx_labour_workers_id_type_id` (`id_type_id`),
  ADD KEY `idx_labour_workers_wage_basis_id` (`wage_basis_id`),
  ADD KEY `idx_labour_workers_status_id` (`status_id`);

--
-- Indexes for table `labour_workers_employment_source_masters`
--
ALTER TABLE `labour_workers_employment_source_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_employment_source_masters_code` (`employment_source_code`);

--
-- Indexes for table `labour_workers_gender_masters`
--
ALTER TABLE `labour_workers_gender_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_gender_masters_code` (`gender_code`);

--
-- Indexes for table `labour_workers_id_type_masters`
--
ALTER TABLE `labour_workers_id_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_id_type_masters_code` (`id_type_code`);

--
-- Indexes for table `labour_workers_status_masters`
--
ALTER TABLE `labour_workers_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_status_masters_code` (`status_code`);

--
-- Indexes for table `labour_workers_wage_basis_masters`
--
ALTER TABLE `labour_workers_wage_basis_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_workers_wage_basis_masters_code` (`wage_basis_code`);

--
-- Indexes for table `labour_worker_documents`
--
ALTER TABLE `labour_worker_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_worker_documents_company_id` (`company_id`,`id`),
  ADD KEY `idx_labour_worker_documents_worker` (`company_id`,`worker_id`,`verification_status_id`),
  ADD KEY `idx_labour_worker_documents_expiry` (`company_id`,`expiry_date`),
  ADD KEY `idx_labour_worker_documents_type` (`document_type_id`),
  ADD KEY `idx_labour_worker_documents_verified_by` (`verified_by`),
  ADD KEY `idx_labour_worker_documents_created_by` (`created_by`),
  ADD KEY `idx_labour_worker_documents_deleted` (`deleted_at`),
  ADD KEY `idx_labour_worker_documents_verification_status_id` (`verification_status_id`);

--
-- Indexes for table `labour_worker_documents_verification_status_masters`
--
ALTER TABLE `labour_worker_documents_verification_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_labour_worker_documents_verification_status_ma_7418f7e8` (`verification_status_code`);

--
-- Indexes for table `management_review_notes`
--
ALTER TABLE `management_review_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_management_note_company_id` (`company_id`,`id`),
  ADD KEY `idx_management_note_queue` (`company_id`,`project_id`,`status_id`,`target_date`),
  ADD KEY `idx_management_note_site` (`project_id`,`site_id`,`review_date`),
  ADD KEY `idx_management_note_assignee` (`assigned_to`,`status_id`),
  ADD KEY `fk_management_note_completed_by` (`completed_by`),
  ADD KEY `fk_management_note_created_by` (`created_by`),
  ADD KEY `fk_management_note_updated_by` (`updated_by`),
  ADD KEY `idx_management_review_notes_review_type_id` (`review_type_id`),
  ADD KEY `idx_management_review_notes_priority_id` (`priority_id`),
  ADD KEY `idx_management_review_notes_status_id` (`status_id`);

--
-- Indexes for table `management_review_notes_priority_masters`
--
ALTER TABLE `management_review_notes_priority_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_management_review_notes_priority_masters_code` (`priority_code`);

--
-- Indexes for table `management_review_notes_review_type_masters`
--
ALTER TABLE `management_review_notes_review_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_management_review_notes_review_type_masters_code` (`review_type_code`);

--
-- Indexes for table `management_review_notes_status_masters`
--
ALTER TABLE `management_review_notes_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_management_review_notes_status_masters_code` (`status_code`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_materials_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_materials_code` (`company_id`,`material_code`),
  ADD KEY `idx_materials_name` (`company_id`,`material_name`),
  ADD KEY `idx_materials_category` (`company_id`,`material_category_id`,`is_active`),
  ADD KEY `idx_materials_uom` (`base_uom_id`),
  ADD KEY `idx_materials_created_by` (`created_by`),
  ADD KEY `idx_materials_updated_by` (`updated_by`),
  ADD KEY `idx_materials_deleted` (`deleted_at`),
  ADD KEY `fk_materials_category` (`material_category_id`);

--
-- Indexes for table `material_categories`
--
ALTER TABLE `material_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_category_company_code` (`company_id`,`category_code`),
  ADD KEY `idx_material_category_parent` (`parent_id`),
  ADD KEY `idx_material_category_company_name` (`company_id`,`category_name`),
  ADD KEY `idx_material_category_storage` (`company_id`,`storage_type_id`,`is_active`),
  ADD KEY `idx_material_category_created_by` (`created_by`),
  ADD KEY `idx_material_category_updated_by` (`updated_by`),
  ADD KEY `idx_material_category_deleted` (`deleted_at`),
  ADD KEY `idx_material_categories_storage_type_id` (`storage_type_id`);

--
-- Indexes for table `material_categories_storage_type_masters`
--
ALTER TABLE `material_categories_storage_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_categories_storage_type_masters_code` (`storage_type_code`);

--
-- Indexes for table `material_purchase_orders`
--
ALTER TABLE `material_purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_pos_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_pos_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_material_pos_no` (`company_id`,`po_no`),
  ADD KEY `idx_material_pos_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_material_pos_supplier` (`company_id`,`supplier_id`,`po_date`),
  ADD KEY `idx_material_pos_delivery` (`expected_delivery_date`,`status_id`),
  ADD KEY `idx_material_pos_submitted_by` (`submitted_by`),
  ADD KEY `idx_material_pos_approved_by` (`approved_by`),
  ADD KEY `idx_material_pos_created_by` (`created_by`),
  ADD KEY `idx_material_pos_updated_by` (`updated_by`),
  ADD KEY `idx_material_pos_deleted` (`deleted_at`),
  ADD KEY `fk_material_pos_site` (`project_id`,`site_id`),
  ADD KEY `idx_material_purchase_orders_status_id` (`status_id`);

--
-- Indexes for table `material_purchase_orders_status_masters`
--
ALTER TABLE `material_purchase_orders_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_purchase_orders_status_masters_code` (`status_code`);

--
-- Indexes for table `material_purchase_order_items`
--
ALTER TABLE `material_purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_po_items_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_po_items_po_material` (`purchase_order_id`,`material_id`),
  ADD KEY `idx_material_po_items_po` (`company_id`,`purchase_order_id`,`item_status_id`),
  ADD KEY `idx_material_po_items_project` (`project_id`,`purchase_order_id`),
  ADD KEY `idx_material_po_items_request` (`request_item_id`),
  ADD KEY `idx_material_po_items_material` (`company_id`,`material_id`),
  ADD KEY `idx_material_po_items_uom` (`uom_id`),
  ADD KEY `idx_material_po_items_created_by` (`created_by`),
  ADD KEY `idx_material_po_items_updated_by` (`updated_by`),
  ADD KEY `idx_material_po_items_deleted` (`deleted_at`),
  ADD KEY `idx_material_purchase_order_items_item_status_id` (`item_status_id`);

--
-- Indexes for table `material_purchase_order_items_item_status_masters`
--
ALTER TABLE `material_purchase_order_items_item_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_purchase_order_items_item_status_masters_code` (`item_status_code`);

--
-- Indexes for table `material_receipts`
--
ALTER TABLE `material_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_receipts_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_receipts_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_material_receipts_no` (`company_id`,`receipt_no`),
  ADD KEY `idx_material_receipts_site` (`company_id`,`project_id`,`site_id`,`receipt_date`),
  ADD KEY `idx_material_receipts_po` (`company_id`,`purchase_order_id`),
  ADD KEY `idx_material_receipts_supplier` (`company_id`,`supplier_id`,`receipt_date`),
  ADD KEY `idx_material_receipts_status` (`company_id`,`status_id`,`receipt_date`),
  ADD KEY `idx_material_receipts_received_by` (`received_by`),
  ADD KEY `idx_material_receipts_inspected_by` (`inspected_by`),
  ADD KEY `idx_material_receipts_posted_by` (`posted_by`),
  ADD KEY `idx_material_receipts_created_by` (`created_by`),
  ADD KEY `idx_material_receipts_updated_by` (`updated_by`),
  ADD KEY `idx_material_receipts_deleted` (`deleted_at`),
  ADD KEY `fk_material_receipts_site` (`project_id`,`site_id`),
  ADD KEY `idx_material_receipts_status_id` (`status_id`);

--
-- Indexes for table `material_receipts_status_masters`
--
ALTER TABLE `material_receipts_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_receipts_status_masters_code` (`status_code`);

--
-- Indexes for table `material_receipt_items`
--
ALTER TABLE `material_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_receipt_items_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_receipt_items_receipt_material_batch` (`receipt_id`,`material_id`,`batch_no`),
  ADD KEY `idx_material_receipt_items_receipt` (`company_id`,`receipt_id`),
  ADD KEY `idx_material_receipt_items_project` (`project_id`,`receipt_id`),
  ADD KEY `idx_material_receipt_items_po_item` (`purchase_order_item_id`),
  ADD KEY `idx_material_receipt_items_material` (`company_id`,`material_id`),
  ADD KEY `idx_material_receipt_items_quality` (`company_id`,`quality_status_id`),
  ADD KEY `idx_material_receipt_items_uom` (`uom_id`),
  ADD KEY `idx_material_receipt_items_created_by` (`created_by`),
  ADD KEY `idx_material_receipt_items_updated_by` (`updated_by`),
  ADD KEY `idx_material_receipt_items_deleted` (`deleted_at`),
  ADD KEY `idx_material_receipt_items_quality_status_id` (`quality_status_id`);

--
-- Indexes for table `material_receipt_items_quality_status_masters`
--
ALTER TABLE `material_receipt_items_quality_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_receipt_items_quality_status_masters_code` (`quality_status_code`);

--
-- Indexes for table `material_requests`
--
ALTER TABLE `material_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_requests_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_requests_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_material_requests_no` (`company_id`,`request_no`),
  ADD KEY `idx_material_requests_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_material_requests_dates` (`company_id`,`request_date`,`required_by_date`),
  ADD KEY `idx_material_requests_zone` (`site_id`,`zone_id`),
  ADD KEY `idx_material_requests_requested_by` (`requested_by`),
  ADD KEY `idx_material_requests_submitted_by` (`submitted_by`),
  ADD KEY `idx_material_requests_approved_by` (`approved_by`),
  ADD KEY `idx_material_requests_created_by` (`created_by`),
  ADD KEY `idx_material_requests_updated_by` (`updated_by`),
  ADD KEY `idx_material_requests_deleted` (`deleted_at`),
  ADD KEY `fk_material_requests_site` (`project_id`,`site_id`),
  ADD KEY `idx_material_requests_priority_id` (`priority_id`),
  ADD KEY `idx_material_requests_status_id` (`status_id`);

--
-- Indexes for table `material_requests_priority_masters`
--
ALTER TABLE `material_requests_priority_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_requests_priority_masters_code` (`priority_code`);

--
-- Indexes for table `material_requests_status_masters`
--
ALTER TABLE `material_requests_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_requests_status_masters_code` (`status_code`);

--
-- Indexes for table `material_request_items`
--
ALTER TABLE `material_request_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_request_items_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_request_items_request_material` (`request_id`,`material_id`),
  ADD KEY `idx_material_request_items_request` (`company_id`,`request_id`,`item_status_id`),
  ADD KEY `idx_material_request_items_project` (`project_id`,`request_id`),
  ADD KEY `idx_material_request_items_material` (`company_id`,`material_id`),
  ADD KEY `idx_material_request_items_uom` (`uom_id`),
  ADD KEY `idx_material_request_items_created_by` (`created_by`),
  ADD KEY `idx_material_request_items_updated_by` (`updated_by`),
  ADD KEY `idx_material_request_items_deleted` (`deleted_at`),
  ADD KEY `idx_material_request_items_item_status_id` (`item_status_id`);

--
-- Indexes for table `material_request_items_item_status_masters`
--
ALTER TABLE `material_request_items_item_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_request_items_item_status_masters_code` (`item_status_code`);

--
-- Indexes for table `material_suppliers`
--
ALTER TABLE `material_suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_suppliers_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_suppliers_code` (`company_id`,`supplier_code`),
  ADD KEY `idx_material_suppliers_name` (`company_id`,`supplier_name`),
  ADD KEY `idx_material_suppliers_status` (`company_id`,`status_id`),
  ADD KEY `idx_material_suppliers_gstin` (`company_id`,`gstin`),
  ADD KEY `idx_material_suppliers_created_by` (`created_by`),
  ADD KEY `idx_material_suppliers_updated_by` (`updated_by`),
  ADD KEY `idx_material_suppliers_deleted` (`deleted_at`),
  ADD KEY `idx_material_suppliers_status_id` (`status_id`);

--
-- Indexes for table `material_suppliers_status_masters`
--
ALTER TABLE `material_suppliers_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_suppliers_status_masters_code` (`status_code`);

--
-- Indexes for table `material_transactions`
--
ALTER TABLE `material_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_transactions_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_transactions_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_material_transactions_no` (`company_id`,`transaction_no`),
  ADD KEY `idx_material_transactions_project` (`company_id`,`project_id`,`transaction_date`,`transaction_type_id`),
  ADD KEY `idx_material_transactions_from_site` (`project_id`,`from_site_id`),
  ADD KEY `idx_material_transactions_from_zone` (`from_site_id`,`from_zone_id`),
  ADD KEY `idx_material_transactions_to_site` (`project_id`,`to_site_id`),
  ADD KEY `idx_material_transactions_to_zone` (`to_site_id`,`to_zone_id`),
  ADD KEY `idx_material_transactions_status` (`company_id`,`status_id`,`transaction_date`),
  ADD KEY `idx_material_transactions_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_material_transactions_requested_by` (`requested_by`),
  ADD KEY `idx_material_transactions_issued_by` (`issued_by`),
  ADD KEY `idx_material_transactions_received_by` (`received_by`),
  ADD KEY `idx_material_transactions_approved_by` (`approved_by`),
  ADD KEY `idx_material_transactions_posted_by` (`posted_by`),
  ADD KEY `idx_material_transactions_created_by` (`created_by`),
  ADD KEY `idx_material_transactions_updated_by` (`updated_by`),
  ADD KEY `idx_material_transactions_deleted` (`deleted_at`),
  ADD KEY `idx_material_transactions_transaction_type_id` (`transaction_type_id`),
  ADD KEY `idx_material_transactions_status_id` (`status_id`);

--
-- Indexes for table `material_transactions_status_masters`
--
ALTER TABLE `material_transactions_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_transactions_status_masters_code` (`status_code`);

--
-- Indexes for table `material_transactions_transaction_type_masters`
--
ALTER TABLE `material_transactions_transaction_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_transactions_transaction_type_masters_code` (`transaction_type_code`);

--
-- Indexes for table `material_transaction_items`
--
ALTER TABLE `material_transaction_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_material_transaction_items_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_material_transaction_items_tx_material_batch` (`transaction_id`,`material_id`,`batch_no`),
  ADD KEY `idx_material_transaction_items_tx` (`company_id`,`transaction_id`),
  ADD KEY `idx_material_transaction_items_project` (`project_id`,`transaction_id`),
  ADD KEY `idx_material_transaction_items_material` (`company_id`,`material_id`),
  ADD KEY `idx_material_transaction_items_receipt` (`source_receipt_item_id`),
  ADD KEY `idx_material_transaction_items_uom` (`uom_id`),
  ADD KEY `idx_material_transaction_items_created_by` (`created_by`),
  ADD KEY `idx_material_transaction_items_updated_by` (`updated_by`),
  ADD KEY `idx_material_transaction_items_deleted` (`deleted_at`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navigation_items`
--
ALTER TABLE `navigation_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_navigation_items_code` (`item_code`),
  ADD KEY `idx_navigation_items_parent` (`parent_id`),
  ADD KEY `idx_navigation_items_permission` (`required_permission_code`),
  ADD KEY `fk_navigation_items_type` (`item_type_id`);

--
-- Indexes for table `navigation_item_types`
--
ALTER TABLE `navigation_item_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_navigation_item_types_code` (`type_code`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_recipient_unread` (`company_id`,`recipient_user_id`,`is_read`,`created_at`),
  ADD KEY `idx_notifications_source` (`source_module`,`source_record_id`),
  ADD KEY `fk_notifications_event` (`event_id`),
  ADD KEY `fk_notifications_project` (`project_id`),
  ADD KEY `fk_notifications_created_by` (`created_by`),
  ADD KEY `fk_notifications_recipient` (`recipient_user_id`);

--
-- Indexes for table `notification_event_masters`
--
ALTER TABLE `notification_event_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_notification_event_code` (`event_code`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissions_code` (`permission_code`),
  ADD UNIQUE KEY `uq_permissions_module_name` (`module_code`,`permission_name`),
  ADD KEY `idx_permissions_module_active` (`module_code`,`is_active`,`display_order`),
  ADD KEY `idx_permissions_deleted` (`deleted_at`),
  ADD KEY `idx_permissions_action_type_id` (`action_type_id`);

--
-- Indexes for table `permissions_action_type_masters`
--
ALTER TABLE `permissions_action_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissions_action_type_masters_code` (`action_type_code`);

--
-- Indexes for table `petty_cash_accounts`
--
ALTER TABLE `petty_cash_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_petty_cash_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_petty_cash_code` (`company_id`,`account_code`),
  ADD KEY `idx_petty_cash_project` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_petty_cash_site` (`project_id`,`site_id`),
  ADD KEY `fk_petty_cash_custodian` (`custodian_user_id`),
  ADD KEY `fk_petty_cash_created_by` (`created_by`),
  ADD KEY `fk_petty_cash_updated_by` (`updated_by`),
  ADD KEY `idx_petty_cash_accounts_status_id` (`status_id`);

--
-- Indexes for table `petty_cash_accounts_status_masters`
--
ALTER TABLE `petty_cash_accounts_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_petty_cash_accounts_status_masters_code` (`status_code`);

--
-- Indexes for table `priorities`
--
ALTER TABLE `priorities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_priorities_code` (`priority_code`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_projects_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_projects_company_code` (`company_id`,`project_code`),
  ADD KEY `idx_projects_client` (`company_id`,`client_id`,`project_status_id`),
  ADD KEY `idx_projects_type` (`project_type_id`),
  ADD KEY `idx_projects_branch` (`branch_id`),
  ADD KEY `idx_projects_financial_year` (`financial_year_id`),
  ADD KEY `idx_projects_manager` (`project_manager_id`),
  ADD KEY `idx_projects_engineer` (`site_engineer_id`),
  ADD KEY `idx_projects_dates` (`company_id`,`planned_start_date`,`expected_completion_date`),
  ADD KEY `idx_projects_status` (`company_id`,`project_status_id`,`priority_id`),
  ADD KEY `idx_projects_name` (`company_id`,`project_name`),
  ADD KEY `idx_projects_created_by` (`created_by`),
  ADD KEY `idx_projects_updated_by` (`updated_by`),
  ADD KEY `idx_projects_deleted` (`deleted_at`),
  ADD KEY `idx_projects_billing_method_id` (`billing_method_id`),
  ADD KEY `idx_projects_priority_id` (`priority_id`),
  ADD KEY `idx_projects_project_status_id` (`project_status_id`);

--
-- Indexes for table `project_boqs`
--
ALTER TABLE `project_boqs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_boq_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_project_boq_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_project_boq_code_version` (`company_id`,`project_id`,`boq_code`,`version_no`,`revision_no`),
  ADD KEY `idx_project_boq_status` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_project_boq_date` (`company_id`,`boq_date`),
  ADD KEY `idx_project_boq_submitted_by` (`submitted_by`),
  ADD KEY `idx_project_boq_approved_by` (`approved_by`),
  ADD KEY `idx_project_boq_deleted` (`deleted_at`),
  ADD KEY `fk_project_boq_created_by` (`created_by`),
  ADD KEY `fk_project_boq_updated_by` (`updated_by`),
  ADD KEY `idx_project_boqs_status_id` (`status_id`);

--
-- Indexes for table `project_boqs_status_masters`
--
ALTER TABLE `project_boqs_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_boqs_status_masters_code` (`status_code`);

--
-- Indexes for table `project_budgets`
--
ALTER TABLE `project_budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_budget_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_project_budget_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_project_budget_code_version` (`company_id`,`project_id`,`budget_code`,`version_no`),
  ADD KEY `idx_project_budget_status` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_project_budget_fy` (`financial_year_id`),
  ADD KEY `idx_project_budget_boq` (`source_boq_id`),
  ADD KEY `idx_project_budget_deleted` (`deleted_at`),
  ADD KEY `fk_project_budget_boq` (`project_id`,`source_boq_id`),
  ADD KEY `fk_project_budget_submitted_by` (`submitted_by`),
  ADD KEY `fk_project_budget_approved_by` (`approved_by`),
  ADD KEY `fk_project_budget_created_by` (`created_by`),
  ADD KEY `fk_project_budget_updated_by` (`updated_by`),
  ADD KEY `idx_project_budgets_status_id` (`status_id`);

--
-- Indexes for table `project_budgets_status_masters`
--
ALTER TABLE `project_budgets_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_budgets_status_masters_code` (`status_code`);

--
-- Indexes for table `project_budget_lines`
--
ALTER TABLE `project_budget_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_budget_line_budget_id` (`budget_id`,`id`),
  ADD UNIQUE KEY `uq_budget_line_code` (`budget_id`,`line_code`),
  ADD KEY `idx_budget_line_category` (`budget_id`,`work_category_id`,`cost_type_id`),
  ADD KEY `idx_budget_line_site` (`site_id`),
  ADD KEY `idx_budget_line_zone` (`work_zone_id`),
  ADD KEY `idx_budget_line_boq_item` (`boq_item_id`),
  ADD KEY `idx_budget_line_deleted` (`deleted_at`),
  ADD KEY `fk_budget_line_budget` (`company_id`,`budget_id`),
  ADD KEY `fk_budget_line_project` (`project_id`,`budget_id`),
  ADD KEY `fk_budget_line_site` (`project_id`,`site_id`),
  ADD KEY `fk_budget_line_zone` (`site_id`,`work_zone_id`),
  ADD KEY `fk_budget_line_category` (`work_category_id`),
  ADD KEY `fk_budget_line_uom` (`uom_id`),
  ADD KEY `fk_budget_line_created_by` (`created_by`),
  ADD KEY `fk_budget_line_updated_by` (`updated_by`),
  ADD KEY `idx_project_budget_lines_cost_type_id` (`cost_type_id`);

--
-- Indexes for table `project_budget_lines_cost_type_masters`
--
ALTER TABLE `project_budget_lines_cost_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_budget_lines_cost_type_masters_code` (`cost_type_code`);

--
-- Indexes for table `project_cashflow_forecasts`
--
ALTER TABLE `project_cashflow_forecasts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cashflow_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_cashflow_month_version` (`company_id`,`project_id`,`forecast_month`,`version_no`),
  ADD KEY `idx_cashflow_dashboard` (`company_id`,`project_id`,`forecast_month`,`status_id`),
  ADD KEY `fk_cashflow_financial_year` (`financial_year_id`),
  ADD KEY `fk_cashflow_approved_by` (`approved_by`),
  ADD KEY `fk_cashflow_created_by` (`created_by`),
  ADD KEY `fk_cashflow_updated_by` (`updated_by`),
  ADD KEY `idx_project_cashflow_forecasts_status_id` (`status_id`);

--
-- Indexes for table `project_cashflow_forecasts_status_masters`
--
ALTER TABLE `project_cashflow_forecasts_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_cashflow_forecasts_status_masters_code` (`status_code`);

--
-- Indexes for table `project_cost_snapshots`
--
ALTER TABLE `project_cost_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cost_snapshot_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_cost_snapshot_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_cost_snapshot_day` (`company_id`,`project_id`,`site_id`,`snapshot_date`,`snapshot_level_id`),
  ADD KEY `idx_cost_snapshot_dashboard` (`company_id`,`project_id`,`snapshot_date`),
  ADD KEY `idx_cost_snapshot_variance` (`company_id`,`budget_variance`),
  ADD KEY `fk_cost_snapshot_site` (`project_id`,`site_id`),
  ADD KEY `fk_cost_snapshot_generated_by` (`generated_by`),
  ADD KEY `idx_project_cost_snapshots_snapshot_level_id` (`snapshot_level_id`);

--
-- Indexes for table `project_cost_snapshots_snapshot_level_masters`
--
ALTER TABLE `project_cost_snapshots_snapshot_level_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_cost_snapshots_snapshot_level_masters_code` (`snapshot_level_code`);

--
-- Indexes for table `project_documents`
--
ALTER TABLE `project_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_documents_storage` (`company_id`,`storage_path`),
  ADD KEY `idx_project_documents_project` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_project_documents_site` (`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_project_documents_type` (`document_type_id`),
  ADD KEY `idx_project_documents_number` (`project_id`,`document_number`,`revision_number`),
  ADD KEY `idx_project_documents_expiry` (`company_id`,`expiry_date`,`status_id`),
  ADD KEY `idx_project_documents_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_project_documents_approved_by` (`approved_by`),
  ADD KEY `idx_project_documents_hash` (`file_hash_sha256`),
  ADD KEY `idx_project_documents_deleted` (`deleted_at`),
  ADD KEY `fk_project_documents_type` (`company_id`,`document_type_id`),
  ADD KEY `idx_project_documents_status_id` (`status_id`);

--
-- Indexes for table `project_documents_status_masters`
--
ALTER TABLE `project_documents_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_documents_status_masters_code` (`status_code`);

--
-- Indexes for table `project_kpi_snapshots`
--
ALTER TABLE `project_kpi_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kpi_snapshot_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_kpi_snapshot_day` (`company_id`,`project_id`,`site_id`,`snapshot_date`,`kpi_code`),
  ADD KEY `idx_kpi_snapshot_dashboard` (`company_id`,`project_id`,`kpi_group_id`,`snapshot_date`),
  ADD KEY `idx_kpi_snapshot_health` (`company_id`,`health_status_id`,`snapshot_date`),
  ADD KEY `fk_kpi_snapshot_site` (`project_id`,`site_id`),
  ADD KEY `fk_kpi_snapshot_generated_by` (`generated_by`),
  ADD KEY `idx_project_kpi_snapshots_kpi_group_id` (`kpi_group_id`),
  ADD KEY `idx_project_kpi_snapshots_trend_direction_id` (`trend_direction_id`),
  ADD KEY `idx_project_kpi_snapshots_health_status_id` (`health_status_id`);

--
-- Indexes for table `project_kpi_snapshots_health_status_masters`
--
ALTER TABLE `project_kpi_snapshots_health_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_kpi_snapshots_health_status_masters_code` (`health_status_code`);

--
-- Indexes for table `project_kpi_snapshots_kpi_group_masters`
--
ALTER TABLE `project_kpi_snapshots_kpi_group_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_kpi_snapshots_kpi_group_masters_code` (`kpi_group_code`);

--
-- Indexes for table `project_kpi_snapshots_trend_direction_masters`
--
ALTER TABLE `project_kpi_snapshots_trend_direction_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_kpi_snapshots_trend_direction_masters_code` (`trend_direction_code`);

--
-- Indexes for table `project_progress_snapshots`
--
ALTER TABLE `project_progress_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_progress_snapshot_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_progress_snapshot_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_progress_snapshot_day` (`company_id`,`project_id`,`site_id`,`snapshot_date`,`snapshot_level_id`),
  ADD KEY `idx_progress_snapshot_dashboard` (`company_id`,`project_id`,`snapshot_date`,`generation_status_id`),
  ADD KEY `idx_progress_snapshot_site` (`project_id`,`site_id`,`snapshot_date`),
  ADD KEY `fk_progress_snapshot_generated_by` (`generated_by`),
  ADD KEY `idx_project_progress_snapshots_snapshot_level_id` (`snapshot_level_id`),
  ADD KEY `idx_project_progress_snapshots_generation_status_id` (`generation_status_id`);

--
-- Indexes for table `project_progress_snapshots_generation_status_masters`
--
ALTER TABLE `project_progress_snapshots_generation_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_progress_snapshots_generation_status_m_f7731b69` (`generation_status_code`);

--
-- Indexes for table `project_progress_snapshots_snapshot_level_masters`
--
ALTER TABLE `project_progress_snapshots_snapshot_level_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_progress_snapshots_snapshot_level_masters_code` (`snapshot_level_code`);

--
-- Indexes for table `project_sites`
--
ALTER TABLE `project_sites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_sites_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_project_sites_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_project_sites_project_code` (`project_id`,`site_code`),
  ADD KEY `idx_project_sites_project` (`company_id`,`project_id`,`site_status_id`),
  ADD KEY `idx_project_sites_location` (`company_id`,`city`,`district`),
  ADD KEY `idx_project_sites_engineer` (`site_engineer_id`),
  ADD KEY `idx_project_sites_supervisor` (`supervisor_id`),
  ADD KEY `idx_project_sites_dates` (`project_id`,`planned_start_date`,`expected_end_date`),
  ADD KEY `idx_project_sites_primary` (`project_id`,`is_primary`),
  ADD KEY `idx_project_sites_created_by` (`created_by`),
  ADD KEY `idx_project_sites_updated_by` (`updated_by`),
  ADD KEY `idx_project_sites_deleted` (`deleted_at`),
  ADD KEY `idx_project_sites_site_type_id` (`site_type_id`),
  ADD KEY `idx_project_sites_site_status_id` (`site_status_id`);

--
-- Indexes for table `project_statuses`
--
ALTER TABLE `project_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_project_statuses_code` (`status_code`);

--
-- Indexes for table `project_status_logs`
--
ALTER TABLE `project_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_status_logs_project` (`company_id`,`project_id`,`changed_at`),
  ADD KEY `idx_project_status_logs_status` (`company_id`,`to_status_id`,`changed_at`),
  ADD KEY `idx_project_status_logs_changed_by` (`changed_by`),
  ADD KEY `idx_project_status_logs_from_status_id` (`from_status_id`),
  ADD KEY `idx_project_status_logs_to_status_id` (`to_status_id`);

--
-- Indexes for table `project_team_members`
--
ALTER TABLE `project_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_team_active_role` (`project_id`,`user_id`,`team_role_id`),
  ADD KEY `idx_project_team_project` (`company_id`,`project_id`,`is_active`),
  ADD KEY `idx_project_team_user` (`company_id`,`user_id`,`is_active`),
  ADD KEY `idx_project_team_role` (`project_id`,`team_role_id`,`is_primary`),
  ADD KEY `idx_project_team_created_by` (`created_by`),
  ADD KEY `idx_project_team_updated_by` (`updated_by`),
  ADD KEY `idx_project_team_deleted` (`deleted_at`),
  ADD KEY `fk_project_team_user` (`user_id`),
  ADD KEY `idx_project_team_members_team_role_id` (`team_role_id`);

--
-- Indexes for table `project_team_roles`
--
ALTER TABLE `project_team_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_project_team_roles_code` (`role_code`);

--
-- Indexes for table `project_types`
--
ALTER TABLE `project_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_type_company_code` (`company_id`,`project_type_code`),
  ADD KEY `idx_project_type_company_name` (`company_id`,`project_type_name`),
  ADD KEY `idx_project_type_billing` (`company_id`,`billing_method_id`,`is_active`),
  ADD KEY `idx_project_type_created_by` (`created_by`),
  ADD KEY `idx_project_type_updated_by` (`updated_by`),
  ADD KEY `idx_project_type_deleted` (`deleted_at`),
  ADD KEY `idx_project_types_billing_method_id` (`billing_method_id`);

--
-- Indexes for table `report_definitions`
--
ALTER TABLE `report_definitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_definition_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_report_definition_code` (`company_id`,`report_code`),
  ADD KEY `idx_report_definition_group` (`company_id`,`report_group_id`,`is_active`),
  ADD KEY `fk_report_definition_created_by` (`created_by`),
  ADD KEY `fk_report_definition_updated_by` (`updated_by`),
  ADD KEY `idx_report_definitions_report_group_id` (`report_group_id`);

--
-- Indexes for table `report_definitions_report_group_masters`
--
ALTER TABLE `report_definitions_report_group_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_definitions_report_group_masters_code` (`report_group_code`);

--
-- Indexes for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_runs_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_report_run_no` (`company_id`,`run_no`),
  ADD KEY `idx_report_run_history` (`company_id`,`report_definition_id`,`requested_at`,`status_id`),
  ADD KEY `idx_report_run_project` (`company_id`,`project_id`,`requested_at`),
  ADD KEY `fk_report_run_schedule` (`company_id`,`report_schedule_id`),
  ADD KEY `fk_report_run_requested_by` (`requested_by`),
  ADD KEY `idx_report_runs_run_type_id` (`run_type_id`),
  ADD KEY `idx_report_runs_output_format_id` (`output_format_id`),
  ADD KEY `idx_report_runs_status_id` (`status_id`);

--
-- Indexes for table `report_runs_output_format_masters`
--
ALTER TABLE `report_runs_output_format_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_runs_output_format_masters_code` (`output_format_code`);

--
-- Indexes for table `report_runs_run_type_masters`
--
ALTER TABLE `report_runs_run_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_runs_run_type_masters_code` (`run_type_code`);

--
-- Indexes for table `report_runs_status_masters`
--
ALTER TABLE `report_runs_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_runs_status_masters_code` (`status_code`);

--
-- Indexes for table `report_schedules`
--
ALTER TABLE `report_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_schedule_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_report_schedule_name` (`company_id`,`schedule_name`),
  ADD KEY `idx_report_schedule_due` (`company_id`,`is_active`,`next_run_at`),
  ADD KEY `idx_report_schedule_report` (`company_id`,`report_definition_id`),
  ADD KEY `fk_report_schedule_project` (`company_id`,`project_id`),
  ADD KEY `fk_report_schedule_created_by` (`created_by`),
  ADD KEY `fk_report_schedule_updated_by` (`updated_by`),
  ADD KEY `idx_report_schedules_frequency_id` (`frequency_id`),
  ADD KEY `idx_report_schedules_output_format_id` (`output_format_id`);

--
-- Indexes for table `report_schedules_frequency_masters`
--
ALTER TABLE `report_schedules_frequency_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_schedules_frequency_masters_code` (`frequency_code`);

--
-- Indexes for table `report_schedules_output_format_masters`
--
ALTER TABLE `report_schedules_output_format_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_report_schedules_output_format_masters_code` (`output_format_code`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roles_company_code` (`company_id`,`role_code`),
  ADD UNIQUE KEY `uq_roles_company_name` (`company_id`,`role_name`),
  ADD KEY `idx_roles_company_active` (`company_id`,`is_active`),
  ADD KEY `idx_roles_created_by` (`created_by`),
  ADD KEY `idx_roles_updated_by` (`updated_by`),
  ADD KEY `idx_roles_deleted` (`deleted_at`),
  ADD KEY `idx_roles_role_scope_id` (`role_scope_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_role_permissions_active` (`company_id`,`role_id`,`permission_id`,`active_grant`),
  ADD KEY `idx_role_permissions_role` (`company_id`,`role_id`,`is_active`),
  ADD KEY `idx_role_permissions_permission` (`permission_id`,`is_active`),
  ADD KEY `idx_role_permissions_granted_by` (`granted_by`),
  ADD KEY `fk_role_permissions_role` (`role_id`);

--
-- Indexes for table `role_scopes`
--
ALTER TABLE `role_scopes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_role_scopes_code` (`scope_code`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting` (`class`,`key`,`context`);

--
-- Indexes for table `site_blocks`
--
ALTER TABLE `site_blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_blocks_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_site_blocks_site_id` (`site_id`,`id`),
  ADD UNIQUE KEY `uq_site_blocks_code` (`site_id`,`block_code`),
  ADD KEY `idx_site_blocks_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_site_blocks_zone` (`site_id`,`work_zone_id`),
  ADD KEY `idx_site_blocks_order` (`site_id`,`display_order`),
  ADD KEY `idx_site_blocks_created_by` (`created_by`),
  ADD KEY `idx_site_blocks_updated_by` (`updated_by`),
  ADD KEY `idx_site_blocks_deleted` (`deleted_at`),
  ADD KEY `fk_site_blocks_site` (`project_id`,`site_id`),
  ADD KEY `idx_site_blocks_block_type_id` (`block_type_id`),
  ADD KEY `idx_site_blocks_status_id` (`status_id`);

--
-- Indexes for table `site_blocks_block_type_masters`
--
ALTER TABLE `site_blocks_block_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_blocks_block_type_masters_code` (`block_type_code`);

--
-- Indexes for table `site_blocks_status_masters`
--
ALTER TABLE `site_blocks_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_blocks_status_masters_code` (`status_code`);

--
-- Indexes for table `site_floors`
--
ALTER TABLE `site_floors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_floors_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_site_floors_site_id` (`site_id`,`id`),
  ADD UNIQUE KEY `uq_site_floors_code` (`site_id`,`floor_code`),
  ADD KEY `idx_site_floors_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_site_floors_block` (`site_id`,`block_id`),
  ADD KEY `idx_site_floors_zone` (`site_id`,`work_zone_id`),
  ADD KEY `idx_site_floors_order` (`site_id`,`block_id`,`display_order`),
  ADD KEY `idx_site_floors_created_by` (`created_by`),
  ADD KEY `idx_site_floors_updated_by` (`updated_by`),
  ADD KEY `idx_site_floors_deleted` (`deleted_at`),
  ADD KEY `fk_site_floors_site` (`project_id`,`site_id`),
  ADD KEY `idx_site_floors_level_type_id` (`level_type_id`),
  ADD KEY `idx_site_floors_status_id` (`status_id`);

--
-- Indexes for table `site_floors_level_type_masters`
--
ALTER TABLE `site_floors_level_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_floors_level_type_masters_code` (`level_type_code`);

--
-- Indexes for table `site_floors_status_masters`
--
ALTER TABLE `site_floors_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_floors_status_masters_code` (`status_code`);

--
-- Indexes for table `site_statuses`
--
ALTER TABLE `site_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_site_statuses_code` (`status_code`);

--
-- Indexes for table `site_status_logs`
--
ALTER TABLE `site_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_site_status_logs_site` (`company_id`,`project_id`,`site_id`,`changed_at`),
  ADD KEY `idx_site_status_logs_status` (`company_id`,`to_status_id`,`changed_at`),
  ADD KEY `idx_site_status_logs_changed_by` (`changed_by`),
  ADD KEY `fk_site_status_logs_site` (`project_id`,`site_id`),
  ADD KEY `idx_site_status_logs_from_status_id` (`from_status_id`),
  ADD KEY `idx_site_status_logs_to_status_id` (`to_status_id`);

--
-- Indexes for table `site_team_members`
--
ALTER TABLE `site_team_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_site_team_company` (`company_id`),
  ADD KEY `idx_site_team_project` (`project_id`),
  ADD KEY `idx_site_team_site` (`site_id`),
  ADD KEY `idx_site_team_user` (`user_id`),
  ADD KEY `idx_site_team_role` (`team_role_id`),
  ADD KEY `idx_site_team_created_by` (`created_by`),
  ADD KEY `idx_site_team_updated_by` (`updated_by`);

--
-- Indexes for table `site_types`
--
ALTER TABLE `site_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_site_types_code` (`type_code`);

--
-- Indexes for table `site_units`
--
ALTER TABLE `site_units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_units_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_site_units_floor_code` (`floor_id`,`unit_code`),
  ADD KEY `idx_site_units_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_site_units_floor` (`site_id`,`floor_id`,`status_id`),
  ADD KEY `idx_site_units_zone` (`site_id`,`work_zone_id`),
  ADD KEY `idx_site_units_area_uom` (`area_uom_id`),
  ADD KEY `idx_site_units_order` (`floor_id`,`display_order`),
  ADD KEY `idx_site_units_created_by` (`created_by`),
  ADD KEY `idx_site_units_updated_by` (`updated_by`),
  ADD KEY `idx_site_units_deleted` (`deleted_at`),
  ADD KEY `fk_site_units_site` (`project_id`,`site_id`),
  ADD KEY `idx_site_units_unit_type_id` (`unit_type_id`),
  ADD KEY `idx_site_units_status_id` (`status_id`);

--
-- Indexes for table `site_units_status_masters`
--
ALTER TABLE `site_units_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_units_status_masters_code` (`status_code`);

--
-- Indexes for table `site_units_unit_type_masters`
--
ALTER TABLE `site_units_unit_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_units_unit_type_masters_code` (`unit_type_code`);

--
-- Indexes for table `site_work_zones`
--
ALTER TABLE `site_work_zones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_work_zones_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_site_work_zones_site_id` (`site_id`,`id`),
  ADD UNIQUE KEY `uq_site_work_zones_code` (`site_id`,`zone_code`),
  ADD KEY `idx_site_work_zones_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_site_work_zones_parent` (`parent_zone_id`),
  ADD KEY `idx_site_work_zones_order` (`site_id`,`display_order`),
  ADD KEY `idx_site_work_zones_created_by` (`created_by`),
  ADD KEY `idx_site_work_zones_updated_by` (`updated_by`),
  ADD KEY `idx_site_work_zones_deleted` (`deleted_at`),
  ADD KEY `fk_site_work_zones_site` (`project_id`,`site_id`),
  ADD KEY `fk_site_work_zones_parent` (`site_id`,`parent_zone_id`),
  ADD KEY `idx_site_work_zones_zone_type_id` (`zone_type_id`),
  ADD KEY `idx_site_work_zones_status_id` (`status_id`);

--
-- Indexes for table `site_work_zones_status_masters`
--
ALTER TABLE `site_work_zones_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_work_zones_status_masters_code` (`status_code`);

--
-- Indexes for table `site_work_zones_zone_type_masters`
--
ALTER TABLE `site_work_zones_zone_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_work_zones_zone_type_masters_code` (`zone_type_code`);

--
-- Indexes for table `subcontractors`
--
ALTER TABLE `subcontractors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontractors_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_subcontractors_code` (`company_id`,`contractor_code`),
  ADD KEY `idx_subcontractors_name` (`company_id`,`contractor_name`),
  ADD KEY `idx_subcontractors_status` (`company_id`,`status_id`),
  ADD KEY `fk_subcontractors_created_by` (`created_by`),
  ADD KEY `fk_subcontractors_updated_by` (`updated_by`),
  ADD KEY `idx_subcontractors_contractor_type_id` (`contractor_type_id`),
  ADD KEY `idx_subcontractors_status_id` (`status_id`);

--
-- Indexes for table `subcontractors_contractor_type_masters`
--
ALTER TABLE `subcontractors_contractor_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontractors_contractor_type_masters_code` (`contractor_type_code`);

--
-- Indexes for table `subcontractors_status_masters`
--
ALTER TABLE `subcontractors_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontractors_status_masters_code` (`status_code`);

--
-- Indexes for table `subcontractor_documents`
--
ALTER TABLE `subcontractor_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subcontractor_documents_contractor` (`company_id`,`contractor_id`,`verification_status_id`),
  ADD KEY `idx_subcontractor_documents_expiry` (`company_id`,`expiry_date`),
  ADD KEY `fk_subcontractor_documents_type` (`document_type_id`),
  ADD KEY `fk_subcontractor_documents_verified_by` (`verified_by`),
  ADD KEY `fk_subcontractor_documents_created_by` (`created_by`),
  ADD KEY `idx_subcontractor_documents_verification_status_id` (`verification_status_id`);

--
-- Indexes for table `subcontractor_documents_verification_status_masters`
--
ALTER TABLE `subcontractor_documents_verification_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontractor_documents_verification_status_ma_3577e22a` (`verification_status_code`);

--
-- Indexes for table `subcontract_measurements`
--
ALTER TABLE `subcontract_measurements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_measure_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_measure_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_measure_wo_id` (`work_order_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_measure_no` (`company_id`,`measurement_no`),
  ADD KEY `idx_subcontract_measure_status` (`company_id`,`project_id`,`work_order_id`,`status_id`,`measurement_date`),
  ADD KEY `fk_subcontract_measure_wo_company` (`company_id`,`work_order_id`),
  ADD KEY `fk_subcontract_measure_wo_project` (`project_id`,`work_order_id`),
  ADD KEY `fk_subcontract_measure_site` (`project_id`,`site_id`),
  ADD KEY `fk_subcontract_measure_zone` (`site_id`,`work_zone_id`),
  ADD KEY `fk_subcontract_measure_measured_by` (`measured_by`),
  ADD KEY `fk_subcontract_measure_verified_by` (`verified_by`),
  ADD KEY `fk_subcontract_measure_approved_by` (`approved_by`),
  ADD KEY `fk_subcontract_measure_created_by` (`created_by`),
  ADD KEY `fk_subcontract_measure_updated_by` (`updated_by`),
  ADD KEY `idx_subcontract_measurements_status_id` (`status_id`);

--
-- Indexes for table `subcontract_measurements_status_masters`
--
ALTER TABLE `subcontract_measurements_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_measurements_status_masters_code` (`status_code`);

--
-- Indexes for table `subcontract_measurement_lines`
--
ALTER TABLE `subcontract_measurement_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_measure_line_measure` (`measurement_id`,`id`),
  ADD KEY `idx_subcontract_measure_line_item` (`work_order_item_id`,`measurement_id`),
  ADD KEY `fk_subcontract_measure_line_measure_company` (`company_id`,`measurement_id`),
  ADD KEY `fk_subcontract_measure_line_measure_project` (`project_id`,`measurement_id`),
  ADD KEY `fk_subcontract_measure_line_created_by` (`created_by`);

--
-- Indexes for table `subcontract_payments`
--
ALTER TABLE `subcontract_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_payment_no` (`company_id`,`payment_no`),
  ADD KEY `idx_subcontract_payment_bill` (`company_id`,`ra_bill_id`,`status_id`),
  ADD KEY `idx_subcontract_payment_contractor` (`company_id`,`contractor_id`,`payment_date`),
  ADD KEY `fk_subcontract_payment_bill_project` (`project_id`,`ra_bill_id`),
  ADD KEY `fk_subcontract_payment_submitted_by` (`submitted_by`),
  ADD KEY `fk_subcontract_payment_approved_by` (`approved_by`),
  ADD KEY `fk_subcontract_payment_paid_by` (`paid_by`),
  ADD KEY `fk_subcontract_payment_created_by` (`created_by`),
  ADD KEY `fk_subcontract_payment_updated_by` (`updated_by`),
  ADD KEY `idx_subcontract_payments_payment_mode_id` (`payment_mode_id`),
  ADD KEY `idx_subcontract_payments_status_id` (`status_id`);

--
-- Indexes for table `subcontract_payments_payment_mode_masters`
--
ALTER TABLE `subcontract_payments_payment_mode_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_payments_payment_mode_masters_code` (`payment_mode_code`);

--
-- Indexes for table `subcontract_payments_status_masters`
--
ALTER TABLE `subcontract_payments_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_payments_status_masters_code` (`status_code`);

--
-- Indexes for table `subcontract_ra_bills`
--
ALTER TABLE `subcontract_ra_bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_bill_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_bill_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_bill_no` (`company_id`,`ra_bill_no`),
  ADD KEY `idx_subcontract_ra_bill_status` (`company_id`,`project_id`,`status_id`,`payment_status_id`,`bill_date`),
  ADD KEY `idx_subcontract_ra_bill_wo` (`company_id`,`work_order_id`),
  ADD KEY `idx_subcontract_ra_bill_contractor` (`company_id`,`contractor_id`),
  ADD KEY `fk_subcontract_ra_bill_wo_project` (`project_id`,`work_order_id`),
  ADD KEY `fk_subcontract_ra_bill_submitted_by` (`submitted_by`),
  ADD KEY `fk_subcontract_ra_bill_verified_by` (`verified_by`),
  ADD KEY `fk_subcontract_ra_bill_certified_by` (`certified_by`),
  ADD KEY `fk_subcontract_ra_bill_created_by` (`created_by`),
  ADD KEY `fk_subcontract_ra_bill_updated_by` (`updated_by`),
  ADD KEY `idx_subcontract_ra_bills_payment_status_id` (`payment_status_id`),
  ADD KEY `idx_subcontract_ra_bills_status_id` (`status_id`);

--
-- Indexes for table `subcontract_ra_bills_payment_status_masters`
--
ALTER TABLE `subcontract_ra_bills_payment_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_bills_payment_status_masters_code` (`payment_status_code`);

--
-- Indexes for table `subcontract_ra_bills_status_masters`
--
ALTER TABLE `subcontract_ra_bills_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_bills_status_masters_code` (`status_code`);

--
-- Indexes for table `subcontract_ra_bill_items`
--
ALTER TABLE `subcontract_ra_bill_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_ra_item_bill` (`ra_bill_id`,`id`),
  ADD KEY `idx_subcontract_ra_item_wo` (`work_order_item_id`),
  ADD KEY `idx_subcontract_ra_item_measurement` (`measurement_line_id`),
  ADD KEY `idx_subcontract_ra_item_budget` (`budget_line_id`),
  ADD KEY `fk_subcontract_ra_item_bill_company` (`company_id`,`ra_bill_id`),
  ADD KEY `fk_subcontract_ra_item_bill_project` (`project_id`,`ra_bill_id`),
  ADD KEY `fk_subcontract_ra_item_created_by` (`created_by`);

--
-- Indexes for table `subcontract_status_logs`
--
ALTER TABLE `subcontract_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subcontract_status_entity` (`company_id`,`entity_type_id`,`entity_id`,`changed_at`),
  ADD KEY `fk_subcontract_status_user` (`changed_by`),
  ADD KEY `idx_subcontract_status_logs_entity_type_id` (`entity_type_id`),
  ADD KEY `idx_subcontract_status_logs_action_type_id` (`action_type_id`);

--
-- Indexes for table `subcontract_status_logs_action_type_masters`
--
ALTER TABLE `subcontract_status_logs_action_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_status_logs_action_type_masters_code` (`action_type_code`);

--
-- Indexes for table `subcontract_status_logs_entity_type_masters`
--
ALTER TABLE `subcontract_status_logs_entity_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_status_logs_entity_type_masters_code` (`entity_type_code`);

--
-- Indexes for table `subcontract_work_orders`
--
ALTER TABLE `subcontract_work_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_wo_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_wo_project_id` (`project_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_wo_no` (`company_id`,`work_order_no`),
  ADD KEY `idx_subcontract_wo_status` (`company_id`,`project_id`,`status_id`),
  ADD KEY `idx_subcontract_wo_contractor` (`company_id`,`contractor_id`,`status_id`),
  ADD KEY `idx_subcontract_wo_site` (`project_id`,`site_id`),
  ADD KEY `idx_subcontract_wo_zone` (`site_id`,`work_zone_id`),
  ADD KEY `fk_subcontract_wo_submitted_by` (`submitted_by`),
  ADD KEY `fk_subcontract_wo_approved_by` (`approved_by`),
  ADD KEY `fk_subcontract_wo_created_by` (`created_by`),
  ADD KEY `fk_subcontract_wo_updated_by` (`updated_by`),
  ADD KEY `idx_subcontract_work_orders_status_id` (`status_id`);

--
-- Indexes for table `subcontract_work_orders_status_masters`
--
ALTER TABLE `subcontract_work_orders_status_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_work_orders_status_masters_code` (`status_code`);

--
-- Indexes for table `subcontract_work_order_items`
--
ALTER TABLE `subcontract_work_order_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subcontract_wo_item_wo_id` (`work_order_id`,`id`),
  ADD UNIQUE KEY `uq_subcontract_wo_item_code` (`work_order_id`,`item_code`),
  ADD KEY `idx_subcontract_wo_item_boq` (`boq_item_id`),
  ADD KEY `idx_subcontract_wo_item_budget` (`budget_line_id`),
  ADD KEY `fk_subcontract_wo_item_wo_company` (`company_id`,`work_order_id`),
  ADD KEY `fk_subcontract_wo_item_wo_project` (`project_id`,`work_order_id`),
  ADD KEY `fk_subcontract_wo_item_uom` (`uom_id`),
  ADD KEY `fk_subcontract_wo_item_created_by` (`created_by`),
  ADD KEY `fk_subcontract_wo_item_updated_by` (`updated_by`);

--
-- Indexes for table `subscription_statuses`
--
ALTER TABLE `subscription_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_subscription_statuses_code` (`status_code`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_system_settings_scope` (`company_id`,`branch_scope_id`,`setting_key`,`active_setting`),
  ADD KEY `idx_system_settings_group` (`company_id`,`branch_id`,`setting_group`,`is_active`),
  ADD KEY `idx_system_settings_created_by` (`created_by`),
  ADD KEY `idx_system_settings_updated_by` (`updated_by`),
  ADD KEY `fk_system_settings_branch` (`branch_id`),
  ADD KEY `idx_system_settings_value_type_id` (`value_type_id`);

--
-- Indexes for table `system_settings_value_type_masters`
--
ALTER TABLE `system_settings_value_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_system_settings_value_type_masters_code` (`value_type_code`);

--
-- Indexes for table `units_of_measurement`
--
ALTER TABLE `units_of_measurement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_uom_company_code` (`company_id`,`unit_code`),
  ADD KEY `idx_uom_company_name` (`company_id`,`unit_name`),
  ADD KEY `idx_uom_company_type` (`company_id`,`unit_type_id`,`is_active`),
  ADD KEY `idx_uom_created_by` (`created_by`),
  ADD KEY `idx_uom_updated_by` (`updated_by`),
  ADD KEY `idx_uom_deleted` (`deleted_at`),
  ADD KEY `idx_units_of_measurement_unit_type_id` (`unit_type_id`);

--
-- Indexes for table `units_of_measurement_unit_type_masters`
--
ALTER TABLE `units_of_measurement_unit_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_units_of_measurement_unit_type_masters_code` (`unit_type_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_company_username` (`company_id`,`username`),
  ADD UNIQUE KEY `uq_users_company_email` (`company_id`,`email`),
  ADD UNIQUE KEY `uq_users_company_employee` (`company_id`,`employee_code`),
  ADD KEY `idx_users_company_status` (`company_id`,`user_status_id`,`is_active`),
  ADD KEY `idx_users_default_branch` (`default_branch_id`),
  ADD KEY `idx_users_name` (`company_id`,`first_name`,`last_name`),
  ADD KEY `idx_users_created_by` (`created_by`),
  ADD KEY `idx_users_updated_by` (`updated_by`),
  ADD KEY `idx_users_deleted` (`deleted_at`),
  ADD KEY `idx_users_user_status_id` (`user_status_id`),
  ADD KEY `idx_users_user_type_id` (`user_type_id`);

--
-- Indexes for table `users_user_type_masters`
--
ALTER TABLE `users_user_type_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_user_type_masters_code` (`user_type_code`);

--
-- Indexes for table `user_branch_access`
--
ALTER TABLE `user_branch_access`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_branch_access_active` (`company_id`,`user_id`,`branch_id`,`active_access`),
  ADD KEY `idx_user_branch_user` (`company_id`,`user_id`,`is_active`),
  ADD KEY `idx_user_branch_branch` (`company_id`,`branch_id`,`is_active`),
  ADD KEY `idx_user_branch_validity` (`valid_from`,`valid_until`),
  ADD KEY `idx_user_branch_granted_by` (`granted_by`),
  ADD KEY `fk_user_branch_user` (`user_id`),
  ADD KEY `fk_user_branch_branch` (`branch_id`),
  ADD KEY `idx_user_branch_access_access_level_id` (`access_level_id`);

--
-- Indexes for table `user_branch_access_access_level_masters`
--
ALTER TABLE `user_branch_access_access_level_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_branch_access_access_level_masters_code` (`access_level_code`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_roles_active` (`company_id`,`user_id`,`role_id`,`active_assignment`),
  ADD KEY `idx_user_roles_user` (`company_id`,`user_id`,`is_active`),
  ADD KEY `idx_user_roles_role` (`company_id`,`role_id`,`is_active`),
  ADD KEY `idx_user_roles_validity` (`valid_from`,`valid_until`),
  ADD KEY `idx_user_roles_assigned_by` (`assigned_by`),
  ADD KEY `fk_user_roles_user` (`user_id`),
  ADD KEY `fk_user_roles_role` (`role_id`);

--
-- Indexes for table `user_statuses`
--
ALTER TABLE `user_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_statuses_code` (`status_code`);

--
-- Indexes for table `work_categories`
--
ALTER TABLE `work_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_category_company_code` (`company_id`,`category_code`),
  ADD KEY `idx_work_category_parent` (`parent_id`),
  ADD KEY `idx_work_category_company_name` (`company_id`,`category_name`),
  ADD KEY `idx_work_category_stage` (`company_id`,`work_stage_id`,`is_active`),
  ADD KEY `idx_work_category_created_by` (`created_by`),
  ADD KEY `idx_work_category_updated_by` (`updated_by`),
  ADD KEY `idx_work_category_deleted` (`deleted_at`),
  ADD KEY `idx_work_categories_work_stage_id` (`work_stage_id`),
  ADD KEY `idx_work_categories_progress_method_id` (`progress_method_id`);

--
-- Indexes for table `work_categories_progress_method_masters`
--
ALTER TABLE `work_categories_progress_method_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_categories_progress_method_masters_code` (`progress_method_code`);

--
-- Indexes for table `work_categories_work_stage_masters`
--
ALTER TABLE `work_categories_work_stage_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_categories_work_stage_masters_code` (`work_stage_code`);

--
-- Indexes for table `work_locations`
--
ALTER TABLE `work_locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_locations_company_id` (`company_id`,`id`),
  ADD UNIQUE KEY `uq_work_locations_site_id` (`site_id`,`id`),
  ADD UNIQUE KEY `uq_work_locations_code` (`site_id`,`location_code`),
  ADD KEY `idx_work_locations_site` (`company_id`,`project_id`,`site_id`,`status_id`),
  ADD KEY `idx_work_locations_zone` (`zone_id`),
  ADD KEY `idx_work_locations_parent` (`parent_location_id`),
  ADD KEY `idx_work_locations_order` (`site_id`,`display_order`),
  ADD KEY `idx_work_locations_type` (`location_type_id`),
  ADD KEY `idx_work_locations_status` (`status_id`),
  ADD KEY `idx_work_locations_deleted` (`deleted_at`),
  ADD KEY `idx_work_locations_created_by` (`created_by`),
  ADD KEY `idx_work_locations_updated_by` (`updated_by`),
  ADD KEY `fk_work_locations_project` (`project_id`);

--
-- Indexes for table `work_location_statuses`
--
ALTER TABLE `work_location_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_location_statuses_code` (`status_code`);

--
-- Indexes for table `work_location_types`
--
ALTER TABLE `work_location_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_work_location_types_code` (`type_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `activity_logs_status_masters`
--
ALTER TABLE `activity_logs_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `address_types`
--
ALTER TABLE `address_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `auth_groups_users`
--
ALTER TABLE `auth_groups_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_identities`
--
ALTER TABLE `auth_identities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `auth_logins`
--
ALTER TABLE `auth_logins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `auth_permissions_users`
--
ALTER TABLE `auth_permissions_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_remember_tokens`
--
ALTER TABLE `auth_remember_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_token_logins`
--
ALTER TABLE `auth_token_logins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_methods`
--
ALTER TABLE `billing_methods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `boq_items`
--
ALTER TABLE `boq_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `boq_item_rate_components`
--
ALTER TABLE `boq_item_rate_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `boq_item_rate_components_component_type_masters`
--
ALTER TABLE `boq_item_rate_components_component_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `boq_sections`
--
ALTER TABLE `boq_sections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `branch_types`
--
ALTER TABLE `branch_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `budget_approvals`
--
ALTER TABLE `budget_approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `budget_approvals_action_masters`
--
ALTER TABLE `budget_approvals_action_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `budget_revisions`
--
ALTER TABLE `budget_revisions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `budget_revisions_status_masters`
--
ALTER TABLE `budget_revisions_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `budget_revision_lines`
--
ALTER TABLE `budget_revision_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `budget_revision_lines_change_type_masters`
--
ALTER TABLE `budget_revision_lines_change_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `budget_status_logs`
--
ALTER TABLE `budget_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `budget_status_logs_from_status_masters`
--
ALTER TABLE `budget_status_logs_from_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `budget_status_logs_to_status_masters`
--
ALTER TABLE `budget_status_logs_to_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `client_addresses`
--
ALTER TABLE `client_addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `client_contacts`
--
ALTER TABLE `client_contacts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `client_documents`
--
ALTER TABLE `client_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `client_document_statuses`
--
ALTER TABLE `client_document_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `client_sources`
--
ALTER TABLE `client_sources`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `client_statuses`
--
ALTER TABLE `client_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `communication_modes`
--
ALTER TABLE `communication_modes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `company_navigation_items`
--
ALTER TABLE `company_navigation_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_types`
--
ALTER TABLE `company_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `daily_material_consumption`
--
ALTER TABLE `daily_material_consumption`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_material_consumption_source_type_masters`
--
ALTER TABLE `daily_material_consumption_source_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_report_approvals`
--
ALTER TABLE `daily_report_approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `daily_report_approvals_action_type_masters`
--
ALTER TABLE `daily_report_approvals_action_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `daily_report_approvals_from_status_masters`
--
ALTER TABLE `daily_report_approvals_from_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `daily_report_approvals_to_status_masters`
--
ALTER TABLE `daily_report_approvals_to_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `daily_site_equipment`
--
ALTER TABLE `daily_site_equipment`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_equipment_ownership_type_masters`
--
ALTER TABLE `daily_site_equipment_ownership_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_site_equipment_status_masters`
--
ALTER TABLE `daily_site_equipment_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_site_issues`
--
ALTER TABLE `daily_site_issues`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_site_issues_issue_type_masters`
--
ALTER TABLE `daily_site_issues_issue_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `daily_site_issues_priority_masters`
--
ALTER TABLE `daily_site_issues_priority_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_issues_status_masters`
--
ALTER TABLE `daily_site_issues_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_site_issues_work_impact_masters`
--
ALTER TABLE `daily_site_issues_work_impact_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_site_manpower`
--
ALTER TABLE `daily_site_manpower`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_site_manpower_source_type_masters`
--
ALTER TABLE `daily_site_manpower_source_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_site_photos`
--
ALTER TABLE `daily_site_photos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_site_photos_photo_type_masters`
--
ALTER TABLE `daily_site_photos_photo_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `daily_site_reports`
--
ALTER TABLE `daily_site_reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_reports_shift_type_masters`
--
ALTER TABLE `daily_site_reports_shift_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_reports_status_masters`
--
ALTER TABLE `daily_site_reports_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `daily_site_visitors`
--
ALTER TABLE `daily_site_visitors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_site_visitors_visit_type_masters`
--
ALTER TABLE `daily_site_visitors_visit_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `daily_site_weather`
--
ALTER TABLE `daily_site_weather`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_weather_weather_condition_masters`
--
ALTER TABLE `daily_site_weather_weather_condition_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `daily_site_weather_weather_period_masters`
--
ALTER TABLE `daily_site_weather_weather_period_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `daily_site_weather_work_impact_masters`
--
ALTER TABLE `daily_site_weather_work_impact_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_work_progress`
--
ALTER TABLE `daily_work_progress`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_work_progress_quality_status_masters`
--
ALTER TABLE `daily_work_progress_quality_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `daily_work_progress_work_status_masters`
--
ALTER TABLE `daily_work_progress_work_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dashboard_alerts`
--
ALTER TABLE `dashboard_alerts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dashboard_alerts_alert_type_masters`
--
ALTER TABLE `dashboard_alerts_alert_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `dashboard_alerts_severity_masters`
--
ALTER TABLE `dashboard_alerts_severity_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dashboard_alerts_status_masters`
--
ALTER TABLE `dashboard_alerts_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dashboard_alert_actions`
--
ALTER TABLE `dashboard_alert_actions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dashboard_alert_actions_action_type_masters`
--
ALTER TABLE `dashboard_alert_actions_action_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `document_types`
--
ALTER TABLE `document_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `document_types_entity_scope_masters`
--
ALTER TABLE `document_types_entity_scope_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expense_allocations`
--
ALTER TABLE `expense_allocations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_allocations_allocation_type_masters`
--
ALTER TABLE `expense_allocations_allocation_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `expense_approvals`
--
ALTER TABLE `expense_approvals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `expense_approvals_action_type_masters`
--
ALTER TABLE `expense_approvals_action_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `expense_approvals_entity_type_masters`
--
ALTER TABLE `expense_approvals_entity_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `expense_bills`
--
ALTER TABLE `expense_bills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_bills_payee_type_masters`
--
ALTER TABLE `expense_bills_payee_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `expense_bills_payment_status_masters`
--
ALTER TABLE `expense_bills_payment_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `expense_bills_status_masters`
--
ALTER TABLE `expense_bills_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_bill_items`
--
ALTER TABLE `expense_bill_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `expense_categories_expense_scope_masters`
--
ALTER TABLE `expense_categories_expense_scope_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `expense_documents`
--
ALTER TABLE `expense_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `expense_payments`
--
ALTER TABLE `expense_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_payments_payment_mode_masters`
--
ALTER TABLE `expense_payments_payment_mode_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_payments_status_masters`
--
ALTER TABLE `expense_payments_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `expense_requests`
--
ALTER TABLE `expense_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expense_requests_status_masters`
--
ALTER TABLE `expense_requests_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `expense_request_items`
--
ALTER TABLE `expense_request_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expense_status_logs`
--
ALTER TABLE `expense_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `expense_status_logs_entity_type_masters`
--
ALTER TABLE `expense_status_logs_entity_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `financial_years`
--
ALTER TABLE `financial_years`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `financial_years_status_masters`
--
ALTER TABLE `financial_years_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gst_registration_types`
--
ALTER TABLE `gst_registration_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `labour_attendance_batches`
--
ALTER TABLE `labour_attendance_batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_attendance_batches_status_masters`
--
ALTER TABLE `labour_attendance_batches_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `labour_attendance_entries`
--
ALTER TABLE `labour_attendance_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_attendance_entries_attendance_source_masters`
--
ALTER TABLE `labour_attendance_entries_attendance_source_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_attendance_entries_attendance_status_masters`
--
ALTER TABLE `labour_attendance_entries_attendance_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `labour_categories`
--
ALTER TABLE `labour_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `labour_categories_skill_level_masters`
--
ALTER TABLE `labour_categories_skill_level_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `labour_categories_wage_basis_masters`
--
ALTER TABLE `labour_categories_wage_basis_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_contractors`
--
ALTER TABLE `labour_contractors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_contractors_status_masters`
--
ALTER TABLE `labour_contractors_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `labour_payments`
--
ALTER TABLE `labour_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `labour_payments_payment_mode_masters`
--
ALTER TABLE `labour_payments_payment_mode_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `labour_payments_status_masters`
--
ALTER TABLE `labour_payments_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `labour_project_assignments`
--
ALTER TABLE `labour_project_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `labour_project_assignments_status_masters`
--
ALTER TABLE `labour_project_assignments_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_project_assignments_wage_basis_masters`
--
ALTER TABLE `labour_project_assignments_wage_basis_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_status_logs`
--
ALTER TABLE `labour_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `labour_status_logs_entity_type_masters`
--
ALTER TABLE `labour_status_logs_entity_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `labour_wage_lines`
--
ALTER TABLE `labour_wage_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `labour_wage_lines_payment_status_masters`
--
ALTER TABLE `labour_wage_lines_payment_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_wage_periods`
--
ALTER TABLE `labour_wage_periods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `labour_wage_periods_status_masters`
--
ALTER TABLE `labour_wage_periods_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `labour_workers`
--
ALTER TABLE `labour_workers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `labour_workers_employment_source_masters`
--
ALTER TABLE `labour_workers_employment_source_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `labour_workers_gender_masters`
--
ALTER TABLE `labour_workers_gender_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_workers_id_type_masters`
--
ALTER TABLE `labour_workers_id_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `labour_workers_status_masters`
--
ALTER TABLE `labour_workers_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_workers_wage_basis_masters`
--
ALTER TABLE `labour_workers_wage_basis_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `labour_worker_documents`
--
ALTER TABLE `labour_worker_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `labour_worker_documents_verification_status_masters`
--
ALTER TABLE `labour_worker_documents_verification_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `management_review_notes`
--
ALTER TABLE `management_review_notes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `management_review_notes_priority_masters`
--
ALTER TABLE `management_review_notes_priority_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `management_review_notes_review_type_masters`
--
ALTER TABLE `management_review_notes_review_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `management_review_notes_status_masters`
--
ALTER TABLE `management_review_notes_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `material_categories`
--
ALTER TABLE `material_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `material_categories_storage_type_masters`
--
ALTER TABLE `material_categories_storage_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `material_purchase_orders`
--
ALTER TABLE `material_purchase_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_purchase_orders_status_masters`
--
ALTER TABLE `material_purchase_orders_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `material_purchase_order_items`
--
ALTER TABLE `material_purchase_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `material_purchase_order_items_item_status_masters`
--
ALTER TABLE `material_purchase_order_items_item_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `material_receipts`
--
ALTER TABLE `material_receipts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_receipts_status_masters`
--
ALTER TABLE `material_receipts_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `material_receipt_items`
--
ALTER TABLE `material_receipt_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_receipt_items_quality_status_masters`
--
ALTER TABLE `material_receipt_items_quality_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `material_requests`
--
ALTER TABLE `material_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_requests_priority_masters`
--
ALTER TABLE `material_requests_priority_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `material_requests_status_masters`
--
ALTER TABLE `material_requests_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `material_request_items`
--
ALTER TABLE `material_request_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `material_request_items_item_status_masters`
--
ALTER TABLE `material_request_items_item_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `material_suppliers`
--
ALTER TABLE `material_suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_suppliers_status_masters`
--
ALTER TABLE `material_suppliers_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `material_transactions`
--
ALTER TABLE `material_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `material_transactions_status_masters`
--
ALTER TABLE `material_transactions_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `material_transactions_transaction_type_masters`
--
ALTER TABLE `material_transactions_transaction_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `material_transaction_items`
--
ALTER TABLE `material_transaction_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `navigation_items`
--
ALTER TABLE `navigation_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1199;

--
-- AUTO_INCREMENT for table `navigation_item_types`
--
ALTER TABLE `navigation_item_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `notification_event_masters`
--
ALTER TABLE `notification_event_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=181;

--
-- AUTO_INCREMENT for table `permissions_action_type_masters`
--
ALTER TABLE `permissions_action_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `petty_cash_accounts`
--
ALTER TABLE `petty_cash_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `petty_cash_accounts_status_masters`
--
ALTER TABLE `petty_cash_accounts_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `priorities`
--
ALTER TABLE `priorities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_boqs`
--
ALTER TABLE `project_boqs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `project_boqs_status_masters`
--
ALTER TABLE `project_boqs_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_budgets`
--
ALTER TABLE `project_budgets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project_budgets_status_masters`
--
ALTER TABLE `project_budgets_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `project_budget_lines`
--
ALTER TABLE `project_budget_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_budget_lines_cost_type_masters`
--
ALTER TABLE `project_budget_lines_cost_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `project_cashflow_forecasts`
--
ALTER TABLE `project_cashflow_forecasts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_cashflow_forecasts_status_masters`
--
ALTER TABLE `project_cashflow_forecasts_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_cost_snapshots`
--
ALTER TABLE `project_cost_snapshots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_cost_snapshots_snapshot_level_masters`
--
ALTER TABLE `project_cost_snapshots_snapshot_level_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_documents`
--
ALTER TABLE `project_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_documents_status_masters`
--
ALTER TABLE `project_documents_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_kpi_snapshots`
--
ALTER TABLE `project_kpi_snapshots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_kpi_snapshots_health_status_masters`
--
ALTER TABLE `project_kpi_snapshots_health_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project_kpi_snapshots_kpi_group_masters`
--
ALTER TABLE `project_kpi_snapshots_kpi_group_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_kpi_snapshots_trend_direction_masters`
--
ALTER TABLE `project_kpi_snapshots_trend_direction_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_progress_snapshots`
--
ALTER TABLE `project_progress_snapshots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_progress_snapshots_generation_status_masters`
--
ALTER TABLE `project_progress_snapshots_generation_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_progress_snapshots_snapshot_level_masters`
--
ALTER TABLE `project_progress_snapshots_snapshot_level_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_sites`
--
ALTER TABLE `project_sites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_statuses`
--
ALTER TABLE `project_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_status_logs`
--
ALTER TABLE `project_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_team_members`
--
ALTER TABLE `project_team_members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_team_roles`
--
ALTER TABLE `project_team_roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `project_types`
--
ALTER TABLE `project_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `report_definitions`
--
ALTER TABLE `report_definitions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `report_definitions_report_group_masters`
--
ALTER TABLE `report_definitions_report_group_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `report_runs`
--
ALTER TABLE `report_runs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_runs_output_format_masters`
--
ALTER TABLE `report_runs_output_format_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `report_runs_run_type_masters`
--
ALTER TABLE `report_runs_run_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `report_runs_status_masters`
--
ALTER TABLE `report_runs_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `report_schedules`
--
ALTER TABLE `report_schedules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_schedules_frequency_masters`
--
ALTER TABLE `report_schedules_frequency_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `report_schedules_output_format_masters`
--
ALTER TABLE `report_schedules_output_format_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT for table `role_scopes`
--
ALTER TABLE `role_scopes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `site_blocks`
--
ALTER TABLE `site_blocks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `site_blocks_block_type_masters`
--
ALTER TABLE `site_blocks_block_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `site_blocks_status_masters`
--
ALTER TABLE `site_blocks_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `site_floors`
--
ALTER TABLE `site_floors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `site_floors_level_type_masters`
--
ALTER TABLE `site_floors_level_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `site_floors_status_masters`
--
ALTER TABLE `site_floors_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `site_statuses`
--
ALTER TABLE `site_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `site_status_logs`
--
ALTER TABLE `site_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `site_team_members`
--
ALTER TABLE `site_team_members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `site_types`
--
ALTER TABLE `site_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `site_units`
--
ALTER TABLE `site_units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `site_units_status_masters`
--
ALTER TABLE `site_units_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `site_units_unit_type_masters`
--
ALTER TABLE `site_units_unit_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `site_work_zones`
--
ALTER TABLE `site_work_zones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `site_work_zones_status_masters`
--
ALTER TABLE `site_work_zones_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `site_work_zones_zone_type_masters`
--
ALTER TABLE `site_work_zones_zone_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `subcontractors`
--
ALTER TABLE `subcontractors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontractors_contractor_type_masters`
--
ALTER TABLE `subcontractors_contractor_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `subcontractors_status_masters`
--
ALTER TABLE `subcontractors_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subcontractor_documents`
--
ALTER TABLE `subcontractor_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subcontractor_documents_verification_status_masters`
--
ALTER TABLE `subcontractor_documents_verification_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subcontract_measurements`
--
ALTER TABLE `subcontract_measurements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_measurements_status_masters`
--
ALTER TABLE `subcontract_measurements_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `subcontract_measurement_lines`
--
ALTER TABLE `subcontract_measurement_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_payments`
--
ALTER TABLE `subcontract_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_payments_payment_mode_masters`
--
ALTER TABLE `subcontract_payments_payment_mode_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `subcontract_payments_status_masters`
--
ALTER TABLE `subcontract_payments_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `subcontract_ra_bills`
--
ALTER TABLE `subcontract_ra_bills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_ra_bills_payment_status_masters`
--
ALTER TABLE `subcontract_ra_bills_payment_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subcontract_ra_bills_status_masters`
--
ALTER TABLE `subcontract_ra_bills_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `subcontract_ra_bill_items`
--
ALTER TABLE `subcontract_ra_bill_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_status_logs`
--
ALTER TABLE `subcontract_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `subcontract_status_logs_action_type_masters`
--
ALTER TABLE `subcontract_status_logs_action_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `subcontract_status_logs_entity_type_masters`
--
ALTER TABLE `subcontract_status_logs_entity_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `subcontract_work_orders`
--
ALTER TABLE `subcontract_work_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subcontract_work_orders_status_masters`
--
ALTER TABLE `subcontract_work_orders_status_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `subcontract_work_order_items`
--
ALTER TABLE `subcontract_work_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subscription_statuses`
--
ALTER TABLE `subscription_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `system_settings_value_type_masters`
--
ALTER TABLE `system_settings_value_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `units_of_measurement`
--
ALTER TABLE `units_of_measurement`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `units_of_measurement_unit_type_masters`
--
ALTER TABLE `units_of_measurement_unit_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users_user_type_masters`
--
ALTER TABLE `users_user_type_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_branch_access`
--
ALTER TABLE `user_branch_access`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_branch_access_access_level_masters`
--
ALTER TABLE `user_branch_access_access_level_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_statuses`
--
ALTER TABLE `user_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `work_categories`
--
ALTER TABLE `work_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `work_categories_progress_method_masters`
--
ALTER TABLE `work_categories_progress_method_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `work_categories_work_stage_masters`
--
ALTER TABLE `work_categories_work_stage_masters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `work_locations`
--
ALTER TABLE `work_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `work_location_statuses`
--
ALTER TABLE `work_location_statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `work_location_types`
--
ALTER TABLE `work_location_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_activity_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_activity_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_activity_logs_status_id` FOREIGN KEY (`status_id`) REFERENCES `activity_logs_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `auth_groups_users`
--
ALTER TABLE `auth_groups_users`
  ADD CONSTRAINT `fk_auth_groups_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_identities`
--
ALTER TABLE `auth_identities`
  ADD CONSTRAINT `fk_auth_identities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_permissions_users`
--
ALTER TABLE `auth_permissions_users`
  ADD CONSTRAINT `fk_auth_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_remember_tokens`
--
ALTER TABLE `auth_remember_tokens`
  ADD CONSTRAINT `fk_auth_remember_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD CONSTRAINT `fk_boq_item_boq` FOREIGN KEY (`company_id`,`boq_id`) REFERENCES `project_boqs` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_project` FOREIGN KEY (`project_id`,`boq_id`) REFERENCES `project_boqs` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_section` FOREIGN KEY (`boq_id`,`section_id`) REFERENCES `boq_sections` (`boq_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_work_category` FOREIGN KEY (`work_category_id`) REFERENCES `work_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_item_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `boq_item_rate_components`
--
ALTER TABLE `boq_item_rate_components`
  ADD CONSTRAINT `fk_boq_item_rate_components_component_type_id` FOREIGN KEY (`component_type_id`) REFERENCES `boq_item_rate_components_component_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_rate_component_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_rate_component_item` FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `boq_sections`
--
ALTER TABLE `boq_sections`
  ADD CONSTRAINT `fk_boq_section_boq` FOREIGN KEY (`company_id`,`boq_id`) REFERENCES `project_boqs` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_section_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_section_parent` FOREIGN KEY (`parent_section_id`) REFERENCES `boq_sections` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_section_project` FOREIGN KEY (`project_id`,`boq_id`) REFERENCES `project_boqs` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_boq_section_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `fk_branches_branch_type` FOREIGN KEY (`branch_type_id`) REFERENCES `branch_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_branches_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `budget_approvals`
--
ALTER TABLE `budget_approvals`
  ADD CONSTRAINT `fk_budget_approval_action_by` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_approval_budget` FOREIGN KEY (`company_id`,`budget_id`) REFERENCES `project_budgets` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_approval_project` FOREIGN KEY (`project_id`,`budget_id`) REFERENCES `project_budgets` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_approval_revision` FOREIGN KEY (`budget_id`,`revision_id`) REFERENCES `budget_revisions` (`budget_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_approvals_action_id` FOREIGN KEY (`action_id`) REFERENCES `budget_approvals_action_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `budget_revisions`
--
ALTER TABLE `budget_revisions`
  ADD CONSTRAINT `fk_budget_revision_budget` FOREIGN KEY (`company_id`,`budget_id`) REFERENCES `project_budgets` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revision_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revision_project` FOREIGN KEY (`project_id`,`budget_id`) REFERENCES `project_budgets` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revision_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revisions_status_id` FOREIGN KEY (`status_id`) REFERENCES `budget_revisions_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `budget_revision_lines`
--
ALTER TABLE `budget_revision_lines`
  ADD CONSTRAINT `fk_budget_revision_line_budget_line` FOREIGN KEY (`budget_line_id`) REFERENCES `project_budget_lines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revision_line_revision` FOREIGN KEY (`revision_id`) REFERENCES `budget_revisions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_revision_lines_change_type_id` FOREIGN KEY (`change_type_id`) REFERENCES `budget_revision_lines_change_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `budget_status_logs`
--
ALTER TABLE `budget_status_logs`
  ADD CONSTRAINT `fk_budget_status_log_budget` FOREIGN KEY (`company_id`,`budget_id`) REFERENCES `project_budgets` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_status_log_project` FOREIGN KEY (`project_id`,`budget_id`) REFERENCES `project_budgets` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_status_log_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_status_logs_from_status_id` FOREIGN KEY (`from_status_id`) REFERENCES `budget_status_logs_from_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_status_logs_to_status_id` FOREIGN KEY (`to_status_id`) REFERENCES `budget_status_logs_to_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_client_source` FOREIGN KEY (`client_source_id`) REFERENCES `client_sources` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_client_status` FOREIGN KEY (`client_status_id`) REFERENCES `client_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_client_type` FOREIGN KEY (`client_type_id`) REFERENCES `company_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_gst_registration_type` FOREIGN KEY (`gst_registration_type_id`) REFERENCES `gst_registration_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_clients_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `client_addresses`
--
ALTER TABLE `client_addresses`
  ADD CONSTRAINT `fk_client_addresses_address_type` FOREIGN KEY (`address_type_id`) REFERENCES `address_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_addresses_client` FOREIGN KEY (`company_id`,`client_id`) REFERENCES `clients` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_addresses_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_addresses_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_addresses_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `client_contacts`
--
ALTER TABLE `client_contacts`
  ADD CONSTRAINT `fk_client_contacts_client` FOREIGN KEY (`company_id`,`client_id`) REFERENCES `clients` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_contacts_communication_mode` FOREIGN KEY (`communication_mode_id`) REFERENCES `communication_modes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_contacts_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_contacts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_contacts_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `client_documents`
--
ALTER TABLE `client_documents`
  ADD CONSTRAINT `fk_client_documents_client` FOREIGN KEY (`company_id`,`client_id`) REFERENCES `clients` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_documents_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_documents_status` FOREIGN KEY (`client_document_status_id`) REFERENCES `client_document_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_documents_type` FOREIGN KEY (`company_id`,`document_type_id`) REFERENCES `document_types` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_client_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `fk_companies_company_type` FOREIGN KEY (`company_type_id`) REFERENCES `company_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_companies_subscription_status` FOREIGN KEY (`subscription_status_id`) REFERENCES `subscription_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `company_navigation_items`
--
ALTER TABLE `company_navigation_items`
  ADD CONSTRAINT `fk_company_navigation_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_company_navigation_item` FOREIGN KEY (`navigation_item_id`) REFERENCES `navigation_items` (`id`);

--
-- Constraints for table `daily_material_consumption`
--
ALTER TABLE `daily_material_consumption`
  ADD CONSTRAINT `fk_daily_material_company_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_consumption_source_type_id` FOREIGN KEY (`source_type_id`) REFERENCES `daily_material_consumption_source_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_material` FOREIGN KEY (`company_id`,`material_id`) REFERENCES `materials` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_progress` FOREIGN KEY (`company_id`,`work_progress_id`) REFERENCES `daily_work_progress` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_report` FOREIGN KEY (`project_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_transaction` FOREIGN KEY (`project_id`,`stock_transaction_id`) REFERENCES `material_transactions` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_material_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_report_approvals`
--
ALTER TABLE `daily_report_approvals`
  ADD CONSTRAINT `fk_daily_report_approvals_action_by` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_report_approvals_action_type_id` FOREIGN KEY (`action_type_id`) REFERENCES `daily_report_approvals_action_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_report_approvals_from_status_id` FOREIGN KEY (`from_status_id`) REFERENCES `daily_report_approvals_from_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_report_approvals_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_report_approvals_to_status_id` FOREIGN KEY (`to_status_id`) REFERENCES `daily_report_approvals_to_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_equipment`
--
ALTER TABLE `daily_site_equipment`
  ADD CONSTRAINT `fk_daily_equipment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_equipment_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_equipment_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_equipment_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_equipment_ownership_type_id` FOREIGN KEY (`ownership_type_id`) REFERENCES `daily_site_equipment_ownership_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_equipment_status_id` FOREIGN KEY (`status_id`) REFERENCES `daily_site_equipment_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_issues`
--
ALTER TABLE `daily_site_issues`
  ADD CONSTRAINT `fk_daily_site_issues_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_issue_type_id` FOREIGN KEY (`issue_type_id`) REFERENCES `daily_site_issues_issue_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_priority_id` FOREIGN KEY (`priority_id`) REFERENCES `daily_site_issues_priority_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_reported_by` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_status_id` FOREIGN KEY (`status_id`) REFERENCES `daily_site_issues_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_work_impact_id` FOREIGN KEY (`work_impact_id`) REFERENCES `daily_site_issues_work_impact_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_issues_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_manpower`
--
ALTER TABLE `daily_site_manpower`
  ADD CONSTRAINT `fk_daily_manpower_category` FOREIGN KEY (`labour_category_id`) REFERENCES `labour_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_manpower_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `labour_contractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_manpower_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_manpower_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_manpower_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_manpower_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_manpower_source_type_id` FOREIGN KEY (`source_type_id`) REFERENCES `daily_site_manpower_source_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_photos`
--
ALTER TABLE `daily_site_photos`
  ADD CONSTRAINT `fk_daily_site_photos_captured_by` FOREIGN KEY (`captured_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_issue` FOREIGN KEY (`company_id`,`issue_id`) REFERENCES `daily_site_issues` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_photo_type_id` FOREIGN KEY (`photo_type_id`) REFERENCES `daily_site_photos_photo_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_progress` FOREIGN KEY (`company_id`,`work_progress_id`) REFERENCES `daily_work_progress` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_photos_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_reports`
--
ALTER TABLE `daily_site_reports`
  ADD CONSTRAINT `fk_daily_site_reports_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_engineer` FOREIGN KEY (`site_engineer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_prepared_by` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_shift_type_id` FOREIGN KEY (`shift_type_id`) REFERENCES `daily_site_reports_shift_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_status_id` FOREIGN KEY (`status_id`) REFERENCES `daily_site_reports_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_reports_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_visitors`
--
ALTER TABLE `daily_site_visitors`
  ADD CONSTRAINT `fk_daily_site_visitors_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_visitors_follow_owner` FOREIGN KEY (`follow_up_owner`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_visitors_hosted_by` FOREIGN KEY (`hosted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_visitors_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_visitors_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_visitors_visit_type_id` FOREIGN KEY (`visit_type_id`) REFERENCES `daily_site_visitors_visit_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_site_weather`
--
ALTER TABLE `daily_site_weather`
  ADD CONSTRAINT `fk_daily_site_weather_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_weather_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_weather_weather_condition_id` FOREIGN KEY (`weather_condition_id`) REFERENCES `daily_site_weather_weather_condition_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_weather_weather_period_id` FOREIGN KEY (`weather_period_id`) REFERENCES `daily_site_weather_weather_period_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_site_weather_work_impact_id` FOREIGN KEY (`work_impact_id`) REFERENCES `daily_site_weather_work_impact_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `daily_work_progress`
--
ALTER TABLE `daily_work_progress`
  ADD CONSTRAINT `fk_daily_work_progress_boq_item` FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_company_report` FOREIGN KEY (`company_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_inspected_by` FOREIGN KEY (`inspected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_quality_status_id` FOREIGN KEY (`quality_status_id`) REFERENCES `daily_work_progress_quality_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_report` FOREIGN KEY (`project_id`,`daily_report_id`) REFERENCES `daily_site_reports` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_work_status_id` FOREIGN KEY (`work_status_id`) REFERENCES `daily_work_progress_work_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_daily_work_progress_zone` FOREIGN KEY (`site_id`,`zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `dashboard_alerts`
--
ALTER TABLE `dashboard_alerts`
  ADD CONSTRAINT `fk_dashboard_alert_ack_by` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alerts_alert_type_id` FOREIGN KEY (`alert_type_id`) REFERENCES `dashboard_alerts_alert_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alerts_severity_id` FOREIGN KEY (`severity_id`) REFERENCES `dashboard_alerts_severity_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alerts_status_id` FOREIGN KEY (`status_id`) REFERENCES `dashboard_alerts_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `dashboard_alert_actions`
--
ALTER TABLE `dashboard_alert_actions`
  ADD CONSTRAINT `fk_alert_actions_alert` FOREIGN KEY (`company_id`,`alert_id`) REFERENCES `dashboard_alerts` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_alert_actions_user` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dashboard_alert_actions_action_type_id` FOREIGN KEY (`action_type_id`) REFERENCES `dashboard_alert_actions_action_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `document_types`
--
ALTER TABLE `document_types`
  ADD CONSTRAINT `fk_document_type_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_document_type_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_document_type_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_document_types_entity_scope_id` FOREIGN KEY (`entity_scope_id`) REFERENCES `document_types_entity_scope_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `expense_allocations`
--
ALTER TABLE `expense_allocations`
  ADD CONSTRAINT `fk_expense_allocations_allocation_type_id` FOREIGN KEY (`allocation_type_id`) REFERENCES `expense_allocations_allocation_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_bill` FOREIGN KEY (`company_id`,`bill_id`) REFERENCES `expense_bills` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_budget` FOREIGN KEY (`company_id`,`budget_id`) REFERENCES `project_budgets` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_budget_line` FOREIGN KEY (`budget_id`,`budget_line_id`) REFERENCES `project_budget_lines` (`budget_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_item` FOREIGN KEY (`company_id`,`bill_item_id`) REFERENCES `expense_bill_items` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expense_approvals`
--
ALTER TABLE `expense_approvals`
  ADD CONSTRAINT `fk_expense_approvals_action_type_id` FOREIGN KEY (`action_type_id`) REFERENCES `expense_approvals_action_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_approvals_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_approvals_entity_type_id` FOREIGN KEY (`entity_type_id`) REFERENCES `expense_approvals_entity_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_approvals_user` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_bills`
--
ALTER TABLE `expense_bills`
  ADD CONSTRAINT `fk_expense_bills_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_payee_type_id` FOREIGN KEY (`payee_type_id`) REFERENCES `expense_bills_payee_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_payment_status_id` FOREIGN KEY (`payment_status_id`) REFERENCES `expense_bills_payment_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_po` FOREIGN KEY (`company_id`,`purchase_order_id`) REFERENCES `material_purchase_orders` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_posted_by` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_receipt` FOREIGN KEY (`company_id`,`material_receipt_id`) REFERENCES `material_receipts` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_request` FOREIGN KEY (`company_id`,`request_id`) REFERENCES `expense_requests` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_status_id` FOREIGN KEY (`status_id`) REFERENCES `expense_bills_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_supplier` FOREIGN KEY (`company_id`,`supplier_id`) REFERENCES `material_suppliers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bills_zone` FOREIGN KEY (`site_id`,`zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `expense_bill_items`
--
ALTER TABLE `expense_bill_items`
  ADD CONSTRAINT `fk_expense_bill_items_bill` FOREIGN KEY (`company_id`,`bill_id`) REFERENCES `expense_bills` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bill_items_category` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bill_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bill_items_project` FOREIGN KEY (`project_id`,`bill_id`) REFERENCES `expense_bills` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bill_items_request` FOREIGN KEY (`company_id`,`request_item_id`) REFERENCES `expense_request_items` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_bill_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `fk_expense_categories_expense_scope_id` FOREIGN KEY (`expense_scope_id`) REFERENCES `expense_categories_expense_scope_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_category_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_category_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_category_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_documents`
--
ALTER TABLE `expense_documents`
  ADD CONSTRAINT `fk_expense_documents_bill` FOREIGN KEY (`company_id`,`bill_id`) REFERENCES `expense_bills` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_documents_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_payments`
--
ALTER TABLE `expense_payments`
  ADD CONSTRAINT `fk_expense_payments_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_bill` FOREIGN KEY (`company_id`,`bill_id`) REFERENCES `expense_bills` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_cash` FOREIGN KEY (`company_id`,`petty_cash_account_id`) REFERENCES `petty_cash_accounts` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_paid_by` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_payment_mode_id` FOREIGN KEY (`payment_mode_id`) REFERENCES `expense_payments_payment_mode_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_project` FOREIGN KEY (`project_id`,`bill_id`) REFERENCES `expense_bills` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_status_id` FOREIGN KEY (`status_id`) REFERENCES `expense_payments_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_payments_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_requests`
--
ALTER TABLE `expense_requests`
  ADD CONSTRAINT `fk_expense_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_status_id` FOREIGN KEY (`status_id`) REFERENCES `expense_requests_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_requests_zone` FOREIGN KEY (`site_id`,`zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `expense_request_items`
--
ALTER TABLE `expense_request_items`
  ADD CONSTRAINT `fk_expense_request_items_budget` FOREIGN KEY (`budget_line_id`) REFERENCES `project_budget_lines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_request_items_category` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_request_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_request_items_project` FOREIGN KEY (`project_id`,`request_id`) REFERENCES `expense_requests` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_request_items_request` FOREIGN KEY (`company_id`,`request_id`) REFERENCES `expense_requests` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_request_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_status_logs`
--
ALTER TABLE `expense_status_logs`
  ADD CONSTRAINT `fk_expense_status_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_status_logs_entity_type_id` FOREIGN KEY (`entity_type_id`) REFERENCES `expense_status_logs_entity_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_status_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `financial_years`
--
ALTER TABLE `financial_years`
  ADD CONSTRAINT `fk_financial_year_closed_by` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_financial_year_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_financial_year_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_financial_year_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_financial_years_status_id` FOREIGN KEY (`status_id`) REFERENCES `financial_years_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_attendance_batches`
--
ALTER TABLE `labour_attendance_batches`
  ADD CONSTRAINT `fk_labour_attendance_batch_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_prepared_by` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batch_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_batches_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_attendance_batches_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_attendance_entries`
--
ALTER TABLE `labour_attendance_entries`
  ADD CONSTRAINT `fk_labour_attendance_entries_attendance_source_id` FOREIGN KEY (`attendance_source_id`) REFERENCES `labour_attendance_entries_attendance_source_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entries_attendance_status_id` FOREIGN KEY (`attendance_status_id`) REFERENCES `labour_attendance_entries_attendance_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_assignment` FOREIGN KEY (`company_id`,`assignment_id`) REFERENCES `labour_project_assignments` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_batch` FOREIGN KEY (`company_id`,`batch_id`) REFERENCES `labour_attendance_batches` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_worker` FOREIGN KEY (`company_id`,`worker_id`) REFERENCES `labour_workers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_attendance_entry_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `labour_categories`
--
ALTER TABLE `labour_categories`
  ADD CONSTRAINT `fk_labour_categories_skill_level_id` FOREIGN KEY (`skill_level_id`) REFERENCES `labour_categories_skill_level_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_categories_wage_basis_id` FOREIGN KEY (`wage_basis_id`) REFERENCES `labour_categories_wage_basis_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_category_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_category_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_category_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `labour_contractors`
--
ALTER TABLE `labour_contractors`
  ADD CONSTRAINT `fk_labour_contractors_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_contractors_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_contractors_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_contractors_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_contractors_subcontractor` FOREIGN KEY (`company_id`,`subcontractor_id`) REFERENCES `subcontractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_contractors_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `labour_payments`
--
ALTER TABLE `labour_payments`
  ADD CONSTRAINT `fk_labour_payment_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `labour_contractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_line` FOREIGN KEY (`company_id`,`wage_line_id`) REFERENCES `labour_wage_lines` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_paid_by` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_period` FOREIGN KEY (`company_id`,`wage_period_id`) REFERENCES `labour_wage_periods` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payment_worker` FOREIGN KEY (`company_id`,`worker_id`) REFERENCES `labour_workers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payments_payment_mode_id` FOREIGN KEY (`payment_mode_id`) REFERENCES `labour_payments_payment_mode_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_payments_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_payments_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_project_assignments`
--
ALTER TABLE `labour_project_assignments`
  ADD CONSTRAINT `fk_labour_assignment_category` FOREIGN KEY (`labour_category_id`) REFERENCES `labour_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_worker` FOREIGN KEY (`company_id`,`worker_id`) REFERENCES `labour_workers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_assignment_zone` FOREIGN KEY (`site_id`,`zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_project_assignments_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_project_assignments_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_project_assignments_wage_basis_id` FOREIGN KEY (`wage_basis_id`) REFERENCES `labour_project_assignments_wage_basis_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_status_logs`
--
ALTER TABLE `labour_status_logs`
  ADD CONSTRAINT `fk_labour_status_log_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_status_log_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_status_logs_entity_type_id` FOREIGN KEY (`entity_type_id`) REFERENCES `labour_status_logs_entity_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_wage_lines`
--
ALTER TABLE `labour_wage_lines`
  ADD CONSTRAINT `fk_labour_wage_line_assignment` FOREIGN KEY (`company_id`,`assignment_id`) REFERENCES `labour_project_assignments` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_line_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_line_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_line_period` FOREIGN KEY (`company_id`,`wage_period_id`) REFERENCES `labour_wage_periods` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_line_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_line_worker` FOREIGN KEY (`company_id`,`worker_id`) REFERENCES `labour_workers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_lines_payment_status_id` FOREIGN KEY (`payment_status_id`) REFERENCES `labour_wage_lines_payment_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_wage_periods`
--
ALTER TABLE `labour_wage_periods`
  ADD CONSTRAINT `fk_labour_wage_period_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `labour_contractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_period_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_wage_periods_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_wage_periods_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_workers`
--
ALTER TABLE `labour_workers`
  ADD CONSTRAINT `fk_labour_workers_category` FOREIGN KEY (`labour_category_id`) REFERENCES `labour_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `labour_contractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_employment_source_id` FOREIGN KEY (`employment_source_id`) REFERENCES `labour_workers_employment_source_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_gender_id` FOREIGN KEY (`gender_id`) REFERENCES `labour_workers_gender_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_id_type_id` FOREIGN KEY (`id_type_id`) REFERENCES `labour_workers_id_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_status_id` FOREIGN KEY (`status_id`) REFERENCES `labour_workers_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_workers_wage_basis_id` FOREIGN KEY (`wage_basis_id`) REFERENCES `labour_workers_wage_basis_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `labour_worker_documents`
--
ALTER TABLE `labour_worker_documents`
  ADD CONSTRAINT `fk_labour_worker_documents_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_worker_documents_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_worker_documents_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_worker_documents_verification_status_id` FOREIGN KEY (`verification_status_id`) REFERENCES `labour_worker_documents_verification_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_worker_documents_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_labour_worker_documents_worker` FOREIGN KEY (`company_id`,`worker_id`) REFERENCES `labour_workers` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `management_review_notes`
--
ALTER TABLE `management_review_notes`
  ADD CONSTRAINT `fk_management_note_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_completed_by` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_note_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_review_notes_priority_id` FOREIGN KEY (`priority_id`) REFERENCES `management_review_notes_priority_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_review_notes_review_type_id` FOREIGN KEY (`review_type_id`) REFERENCES `management_review_notes_review_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_management_review_notes_status_id` FOREIGN KEY (`status_id`) REFERENCES `management_review_notes_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `materials`
--
ALTER TABLE `materials`
  ADD CONSTRAINT `fk_materials_category` FOREIGN KEY (`material_category_id`) REFERENCES `material_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_materials_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_materials_uom` FOREIGN KEY (`base_uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_categories`
--
ALTER TABLE `material_categories`
  ADD CONSTRAINT `fk_material_categories_storage_type_id` FOREIGN KEY (`storage_type_id`) REFERENCES `material_categories_storage_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_category_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_category_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `material_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_category_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_purchase_orders`
--
ALTER TABLE `material_purchase_orders`
  ADD CONSTRAINT `fk_material_pos_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_supplier` FOREIGN KEY (`company_id`,`supplier_id`) REFERENCES `material_suppliers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_pos_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_purchase_orders_status_id` FOREIGN KEY (`status_id`) REFERENCES `material_purchase_orders_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `material_purchase_order_items`
--
ALTER TABLE `material_purchase_order_items`
  ADD CONSTRAINT `fk_material_po_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_material` FOREIGN KEY (`company_id`,`material_id`) REFERENCES `materials` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_po` FOREIGN KEY (`company_id`,`purchase_order_id`) REFERENCES `material_purchase_orders` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_project` FOREIGN KEY (`project_id`,`purchase_order_id`) REFERENCES `material_purchase_orders` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_request` FOREIGN KEY (`request_item_id`) REFERENCES `material_request_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_po_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_purchase_order_items_item_status_id` FOREIGN KEY (`item_status_id`) REFERENCES `material_purchase_order_items_item_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `material_receipts`
--
ALTER TABLE `material_receipts`
  ADD CONSTRAINT `fk_material_receipts_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_inspected_by` FOREIGN KEY (`inspected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_po` FOREIGN KEY (`company_id`,`purchase_order_id`) REFERENCES `material_purchase_orders` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_posted_by` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_status_id` FOREIGN KEY (`status_id`) REFERENCES `material_receipts_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_supplier` FOREIGN KEY (`company_id`,`supplier_id`) REFERENCES `material_suppliers` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipts_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_receipt_items`
--
ALTER TABLE `material_receipt_items`
  ADD CONSTRAINT `fk_material_receipt_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_material` FOREIGN KEY (`company_id`,`material_id`) REFERENCES `materials` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_po_item` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `material_purchase_order_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_project` FOREIGN KEY (`project_id`,`receipt_id`) REFERENCES `material_receipts` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_quality_status_id` FOREIGN KEY (`quality_status_id`) REFERENCES `material_receipt_items_quality_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_receipt` FOREIGN KEY (`company_id`,`receipt_id`) REFERENCES `material_receipts` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_receipt_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_requests`
--
ALTER TABLE `material_requests`
  ADD CONSTRAINT `fk_material_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_priority_id` FOREIGN KEY (`priority_id`) REFERENCES `material_requests_priority_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_status_id` FOREIGN KEY (`status_id`) REFERENCES `material_requests_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_requests_zone` FOREIGN KEY (`site_id`,`zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `material_request_items`
--
ALTER TABLE `material_request_items`
  ADD CONSTRAINT `fk_material_request_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_item_status_id` FOREIGN KEY (`item_status_id`) REFERENCES `material_request_items_item_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_material` FOREIGN KEY (`company_id`,`material_id`) REFERENCES `materials` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_project` FOREIGN KEY (`project_id`,`request_id`) REFERENCES `material_requests` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_request` FOREIGN KEY (`company_id`,`request_id`) REFERENCES `material_requests` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_request_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_suppliers`
--
ALTER TABLE `material_suppliers`
  ADD CONSTRAINT `fk_material_suppliers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_suppliers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_suppliers_status_id` FOREIGN KEY (`status_id`) REFERENCES `material_suppliers_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_suppliers_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_transactions`
--
ALTER TABLE `material_transactions`
  ADD CONSTRAINT `fk_material_transactions_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_from_site` FOREIGN KEY (`project_id`,`from_site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_from_zone` FOREIGN KEY (`from_site_id`,`from_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_posted_by` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_status_id` FOREIGN KEY (`status_id`) REFERENCES `material_transactions_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_to_site` FOREIGN KEY (`project_id`,`to_site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_to_zone` FOREIGN KEY (`to_site_id`,`to_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_transaction_type_id` FOREIGN KEY (`transaction_type_id`) REFERENCES `material_transactions_transaction_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transactions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `material_transaction_items`
--
ALTER TABLE `material_transaction_items`
  ADD CONSTRAINT `fk_material_transaction_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_material` FOREIGN KEY (`company_id`,`material_id`) REFERENCES `materials` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_project` FOREIGN KEY (`project_id`,`transaction_id`) REFERENCES `material_transactions` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_receipt` FOREIGN KEY (`source_receipt_item_id`) REFERENCES `material_receipt_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_tx` FOREIGN KEY (`company_id`,`transaction_id`) REFERENCES `material_transactions` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_material_transaction_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `navigation_items`
--
ALTER TABLE `navigation_items`
  ADD CONSTRAINT `fk_navigation_items_parent` FOREIGN KEY (`parent_id`) REFERENCES `navigation_items` (`id`),
  ADD CONSTRAINT `fk_navigation_items_type` FOREIGN KEY (`item_type_id`) REFERENCES `navigation_item_types` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_event` FOREIGN KEY (`event_id`) REFERENCES `notification_event_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `fk_permissions_action_type_id` FOREIGN KEY (`action_type_id`) REFERENCES `permissions_action_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `petty_cash_accounts`
--
ALTER TABLE `petty_cash_accounts`
  ADD CONSTRAINT `fk_petty_cash_accounts_status_id` FOREIGN KEY (`status_id`) REFERENCES `petty_cash_accounts_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_custodian` FOREIGN KEY (`custodian_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_petty_cash_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_billing_method` FOREIGN KEY (`billing_method_id`) REFERENCES `billing_methods` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_client` FOREIGN KEY (`company_id`,`client_id`) REFERENCES `clients` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_engineer` FOREIGN KEY (`site_engineer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_financial_year` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_manager` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_priority` FOREIGN KEY (`priority_id`) REFERENCES `priorities` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_project_status` FOREIGN KEY (`project_status_id`) REFERENCES `project_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projects_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `project_boqs`
--
ALTER TABLE `project_boqs`
  ADD CONSTRAINT `fk_project_boq_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boq_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boq_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boq_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boq_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boq_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_boqs_status_id` FOREIGN KEY (`status_id`) REFERENCES `project_boqs_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_budgets`
--
ALTER TABLE `project_budgets`
  ADD CONSTRAINT `fk_project_budget_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_boq` FOREIGN KEY (`project_id`,`source_boq_id`) REFERENCES `project_boqs` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_fy` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budgets_status_id` FOREIGN KEY (`status_id`) REFERENCES `project_budgets_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_budget_lines`
--
ALTER TABLE `project_budget_lines`
  ADD CONSTRAINT `fk_budget_line_boq_item` FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_budget` FOREIGN KEY (`company_id`,`budget_id`) REFERENCES `project_budgets` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_category` FOREIGN KEY (`work_category_id`) REFERENCES `work_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_project` FOREIGN KEY (`project_id`,`budget_id`) REFERENCES `project_budgets` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_budget_line_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_budget_lines_cost_type_id` FOREIGN KEY (`cost_type_id`) REFERENCES `project_budget_lines_cost_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_cashflow_forecasts`
--
ALTER TABLE `project_cashflow_forecasts`
  ADD CONSTRAINT `fk_cashflow_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cashflow_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cashflow_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cashflow_financial_year` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cashflow_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cashflow_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_cashflow_forecasts_status_id` FOREIGN KEY (`status_id`) REFERENCES `project_cashflow_forecasts_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_cost_snapshots`
--
ALTER TABLE `project_cost_snapshots`
  ADD CONSTRAINT `fk_cost_snapshot_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_snapshot_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_snapshot_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_snapshot_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_cost_snapshots_snapshot_level_id` FOREIGN KEY (`snapshot_level_id`) REFERENCES `project_cost_snapshots_snapshot_level_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_documents`
--
ALTER TABLE `project_documents`
  ADD CONSTRAINT `fk_project_documents_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_status_id` FOREIGN KEY (`status_id`) REFERENCES `project_documents_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_type` FOREIGN KEY (`company_id`,`document_type_id`) REFERENCES `document_types` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `project_kpi_snapshots`
--
ALTER TABLE `project_kpi_snapshots`
  ADD CONSTRAINT `fk_kpi_snapshot_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kpi_snapshot_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kpi_snapshot_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kpi_snapshot_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_kpi_snapshots_health_status_id` FOREIGN KEY (`health_status_id`) REFERENCES `project_kpi_snapshots_health_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_kpi_snapshots_kpi_group_id` FOREIGN KEY (`kpi_group_id`) REFERENCES `project_kpi_snapshots_kpi_group_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_kpi_snapshots_trend_direction_id` FOREIGN KEY (`trend_direction_id`) REFERENCES `project_kpi_snapshots_trend_direction_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_progress_snapshots`
--
ALTER TABLE `project_progress_snapshots`
  ADD CONSTRAINT `fk_progress_snapshot_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_progress_snapshot_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_progress_snapshot_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_progress_snapshot_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_progress_snapshots_generation_status_id` FOREIGN KEY (`generation_status_id`) REFERENCES `project_progress_snapshots_generation_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_progress_snapshots_snapshot_level_id` FOREIGN KEY (`snapshot_level_id`) REFERENCES `project_progress_snapshots_snapshot_level_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_sites`
--
ALTER TABLE `project_sites`
  ADD CONSTRAINT `fk_project_sites_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_engineer` FOREIGN KEY (`site_engineer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_site_status` FOREIGN KEY (`site_status_id`) REFERENCES `site_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_site_type` FOREIGN KEY (`site_type_id`) REFERENCES `site_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_sites_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `project_status_logs`
--
ALTER TABLE `project_status_logs`
  ADD CONSTRAINT `fk_project_status_logs_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_status_logs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_status_logs_from_status` FOREIGN KEY (`from_status_id`) REFERENCES `project_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_status_logs_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_status_logs_to_status` FOREIGN KEY (`to_status_id`) REFERENCES `project_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_team_members`
--
ALTER TABLE `project_team_members`
  ADD CONSTRAINT `fk_project_team_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_team_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_team_members_team_role` FOREIGN KEY (`team_role_id`) REFERENCES `project_team_roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_team_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_team_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_team_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `project_types`
--
ALTER TABLE `project_types`
  ADD CONSTRAINT `fk_project_type_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_type_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_type_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_project_types_billing_method` FOREIGN KEY (`billing_method_id`) REFERENCES `billing_methods` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `report_definitions`
--
ALTER TABLE `report_definitions`
  ADD CONSTRAINT `fk_report_definition_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_definition_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_definition_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_definitions_report_group_id` FOREIGN KEY (`report_group_id`) REFERENCES `report_definitions_report_group_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD CONSTRAINT `fk_report_run_definition` FOREIGN KEY (`company_id`,`report_definition_id`) REFERENCES `report_definitions` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_run_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_run_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_run_schedule` FOREIGN KEY (`company_id`,`report_schedule_id`) REFERENCES `report_schedules` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_runs_output_format_id` FOREIGN KEY (`output_format_id`) REFERENCES `report_runs_output_format_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_runs_run_type_id` FOREIGN KEY (`run_type_id`) REFERENCES `report_runs_run_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_runs_status_id` FOREIGN KEY (`status_id`) REFERENCES `report_runs_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `report_schedules`
--
ALTER TABLE `report_schedules`
  ADD CONSTRAINT `fk_report_schedule_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_schedule_definition` FOREIGN KEY (`company_id`,`report_definition_id`) REFERENCES `report_definitions` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_schedule_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_schedule_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_schedules_frequency_id` FOREIGN KEY (`frequency_id`) REFERENCES `report_schedules_frequency_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_schedules_output_format_id` FOREIGN KEY (`output_format_id`) REFERENCES `report_schedules_output_format_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `fk_roles_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_roles_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_roles_role_scope` FOREIGN KEY (`role_scope_id`) REFERENCES `role_scopes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_roles_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_blocks`
--
ALTER TABLE `site_blocks`
  ADD CONSTRAINT `fk_site_blocks_block_type_id` FOREIGN KEY (`block_type_id`) REFERENCES `site_blocks_block_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_status_id` FOREIGN KEY (`status_id`) REFERENCES `site_blocks_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_blocks_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_floors`
--
ALTER TABLE `site_floors`
  ADD CONSTRAINT `fk_site_floors_block` FOREIGN KEY (`site_id`,`block_id`) REFERENCES `site_blocks` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_level_type_id` FOREIGN KEY (`level_type_id`) REFERENCES `site_floors_level_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_status_id` FOREIGN KEY (`status_id`) REFERENCES `site_floors_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_floors_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_status_logs`
--
ALTER TABLE `site_status_logs`
  ADD CONSTRAINT `fk_site_status_logs_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_status_logs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_status_logs_from_status` FOREIGN KEY (`from_status_id`) REFERENCES `site_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_status_logs_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_status_logs_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_status_logs_to_status` FOREIGN KEY (`to_status_id`) REFERENCES `site_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_team_members`
--
ALTER TABLE `site_team_members`
  ADD CONSTRAINT `fk_site_team_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_role` FOREIGN KEY (`team_role_id`) REFERENCES `project_team_roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_site` FOREIGN KEY (`site_id`) REFERENCES `project_sites` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_team_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_units`
--
ALTER TABLE `site_units`
  ADD CONSTRAINT `fk_site_units_area_uom` FOREIGN KEY (`area_uom_id`) REFERENCES `units_of_measurement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_floor` FOREIGN KEY (`site_id`,`floor_id`) REFERENCES `site_floors` (`site_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_status_id` FOREIGN KEY (`status_id`) REFERENCES `site_units_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_unit_type_id` FOREIGN KEY (`unit_type_id`) REFERENCES `site_units_unit_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_units_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE;

--
-- Constraints for table `site_work_zones`
--
ALTER TABLE `site_work_zones`
  ADD CONSTRAINT `fk_site_work_zones_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_parent` FOREIGN KEY (`site_id`,`parent_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_status_id` FOREIGN KEY (`status_id`) REFERENCES `site_work_zones_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_site_work_zones_zone_type_id` FOREIGN KEY (`zone_type_id`) REFERENCES `site_work_zones_zone_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontractors`
--
ALTER TABLE `subcontractors`
  ADD CONSTRAINT `fk_subcontractors_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractors_contractor_type_id` FOREIGN KEY (`contractor_type_id`) REFERENCES `subcontractors_contractor_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractors_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractors_status_id` FOREIGN KEY (`status_id`) REFERENCES `subcontractors_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractors_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `subcontractor_documents`
--
ALTER TABLE `subcontractor_documents`
  ADD CONSTRAINT `fk_subcontractor_documents_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `subcontractors` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractor_documents_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractor_documents_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractor_documents_verification_status_id` FOREIGN KEY (`verification_status_id`) REFERENCES `subcontractor_documents_verification_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontractor_documents_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_measurements`
--
ALTER TABLE `subcontract_measurements`
  ADD CONSTRAINT `fk_subcontract_measure_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_measured_by` FOREIGN KEY (`measured_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_wo_company` FOREIGN KEY (`company_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_wo_project` FOREIGN KEY (`project_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measurements_status_id` FOREIGN KEY (`status_id`) REFERENCES `subcontract_measurements_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_measurement_lines`
--
ALTER TABLE `subcontract_measurement_lines`
  ADD CONSTRAINT `fk_subcontract_measure_line_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_line_measure_company` FOREIGN KEY (`company_id`,`measurement_id`) REFERENCES `subcontract_measurements` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_line_measure_project` FOREIGN KEY (`project_id`,`measurement_id`) REFERENCES `subcontract_measurements` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_measure_line_wo_item` FOREIGN KEY (`work_order_item_id`) REFERENCES `subcontract_work_order_items` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_payments`
--
ALTER TABLE `subcontract_payments`
  ADD CONSTRAINT `fk_subcontract_payment_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_bill_company` FOREIGN KEY (`company_id`,`ra_bill_id`) REFERENCES `subcontract_ra_bills` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_bill_project` FOREIGN KEY (`project_id`,`ra_bill_id`) REFERENCES `subcontract_ra_bills` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `subcontractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_paid_by` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payment_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payments_payment_mode_id` FOREIGN KEY (`payment_mode_id`) REFERENCES `subcontract_payments_payment_mode_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_payments_status_id` FOREIGN KEY (`status_id`) REFERENCES `subcontract_payments_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_ra_bills`
--
ALTER TABLE `subcontract_ra_bills`
  ADD CONSTRAINT `fk_subcontract_ra_bill_certified_by` FOREIGN KEY (`certified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `subcontractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_wo_company` FOREIGN KEY (`company_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bill_wo_project` FOREIGN KEY (`project_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bills_payment_status_id` FOREIGN KEY (`payment_status_id`) REFERENCES `subcontract_ra_bills_payment_status_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_bills_status_id` FOREIGN KEY (`status_id`) REFERENCES `subcontract_ra_bills_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_ra_bill_items`
--
ALTER TABLE `subcontract_ra_bill_items`
  ADD CONSTRAINT `fk_subcontract_ra_item_bill_company` FOREIGN KEY (`company_id`,`ra_bill_id`) REFERENCES `subcontract_ra_bills` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_item_bill_project` FOREIGN KEY (`project_id`,`ra_bill_id`) REFERENCES `subcontract_ra_bills` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_item_budget` FOREIGN KEY (`budget_line_id`) REFERENCES `project_budget_lines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_item_measurement` FOREIGN KEY (`measurement_line_id`) REFERENCES `subcontract_measurement_lines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_ra_item_wo` FOREIGN KEY (`work_order_item_id`) REFERENCES `subcontract_work_order_items` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_status_logs`
--
ALTER TABLE `subcontract_status_logs`
  ADD CONSTRAINT `fk_subcontract_status_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_status_logs_action_type_id` FOREIGN KEY (`action_type_id`) REFERENCES `subcontract_status_logs_action_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_status_logs_entity_type_id` FOREIGN KEY (`entity_type_id`) REFERENCES `subcontract_status_logs_entity_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_status_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_work_orders`
--
ALTER TABLE `subcontract_work_orders`
  ADD CONSTRAINT `fk_subcontract_wo_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_contractor` FOREIGN KEY (`company_id`,`contractor_id`) REFERENCES `subcontractors` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_project` FOREIGN KEY (`company_id`,`project_id`) REFERENCES `projects` (`company_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_site` FOREIGN KEY (`project_id`,`site_id`) REFERENCES `project_sites` (`project_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_zone` FOREIGN KEY (`site_id`,`work_zone_id`) REFERENCES `site_work_zones` (`site_id`, `id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_work_orders_status_id` FOREIGN KEY (`status_id`) REFERENCES `subcontract_work_orders_status_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `subcontract_work_order_items`
--
ALTER TABLE `subcontract_work_order_items`
  ADD CONSTRAINT `fk_subcontract_wo_item_boq` FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_budget` FOREIGN KEY (`budget_line_id`) REFERENCES `project_budget_lines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_uom` FOREIGN KEY (`uom_id`) REFERENCES `units_of_measurement` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_wo_company` FOREIGN KEY (`company_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`company_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcontract_wo_item_wo_project` FOREIGN KEY (`project_id`,`work_order_id`) REFERENCES `subcontract_work_orders` (`project_id`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `fk_system_settings_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `fk_system_settings_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_system_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_system_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_system_settings_value_type_id` FOREIGN KEY (`value_type_id`) REFERENCES `system_settings_value_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `units_of_measurement`
--
ALTER TABLE `units_of_measurement`
  ADD CONSTRAINT `fk_units_of_measurement_unit_type_id` FOREIGN KEY (`unit_type_id`) REFERENCES `units_of_measurement_unit_type_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uom_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uom_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uom_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_default_branch` FOREIGN KEY (`default_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_user_status` FOREIGN KEY (`user_status_id`) REFERENCES `user_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_user_type_id` FOREIGN KEY (`user_type_id`) REFERENCES `users_user_type_masters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_branch_access`
--
ALTER TABLE `user_branch_access`
  ADD CONSTRAINT `fk_user_branch_access_access_level_id` FOREIGN KEY (`access_level_id`) REFERENCES `user_branch_access_access_level_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_branch_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_branch_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_branch_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_roles_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `work_categories`
--
ALTER TABLE `work_categories`
  ADD CONSTRAINT `fk_work_categories_progress_method_id` FOREIGN KEY (`progress_method_id`) REFERENCES `work_categories_progress_method_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_categories_work_stage_id` FOREIGN KEY (`work_stage_id`) REFERENCES `work_categories_work_stage_masters` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_category_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_category_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `work_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_category_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `work_locations`
--
ALTER TABLE `work_locations`
  ADD CONSTRAINT `fk_work_locations_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_parent` FOREIGN KEY (`parent_location_id`) REFERENCES `work_locations` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_site` FOREIGN KEY (`site_id`) REFERENCES `project_sites` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_status` FOREIGN KEY (`status_id`) REFERENCES `work_location_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_type` FOREIGN KEY (`location_type_id`) REFERENCES `work_location_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_work_locations_zone` FOREIGN KEY (`zone_id`) REFERENCES `site_work_zones` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
