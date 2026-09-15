ALTER TABLE `branches` ADD COLUMN IF NOT EXISTS `geofence_radius_m` INT UNSIGNED DEFAULT NULL AFTER `longitude`;

UPDATE `branches` SET 
  `latitude` = 11.0168440,
  `longitude` = 76.9558320,
  `geofence_radius_m` = 500,
  `address_line1` = 'CivilDesk Tower, Avinashi Road',
  `city` = 'Coimbatore',
  `state_name` = 'Tamil Nadu',
  `phone` = '+91-9876500010'
WHERE `id` = 1;

INSERT INTO `branches` (
  `id`, `company_id`, `branch_code`, `branch_name`, `branch_type_id`, 
  `phone`, `address_line1`, `city`, `district`, `state_name`, 
  `country_code`, `postal_code`, `latitude`, `longitude`, 
  `geofence_radius_m`, `is_head_office`, `is_active`, `created_at`, `updated_at`
) VALUES (
  2, 1, 'BR-002', 'Karur Regional Branch', 2,
  '+91-9876500020', '74 Kovai Road, Sengunthapuram', 'Karur', 'Karur', 'Tamil Nadu',
  'IN', '639002', 10.9601000, 78.0766000,
  300, 0, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
  `branch_name` = VALUES(`branch_name`),
  `latitude` = VALUES(`latitude`),
  `longitude` = VALUES(`longitude`),
  `geofence_radius_m` = VALUES(`geofence_radius_m`),
  `phone` = VALUES(`phone`);
