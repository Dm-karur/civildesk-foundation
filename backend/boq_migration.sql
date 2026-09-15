-- Add site_id to project_boqs
ALTER TABLE project_boqs ADD COLUMN IF NOT EXISTS site_id BIGINT UNSIGNED NULL AFTER project_id;
CREATE INDEX IF NOT EXISTS idx_project_boqs_site_id ON project_boqs (site_id);

-- Add execution columns to boq_items
ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS executed_quantity DECIMAL(18,4) NOT NULL DEFAULT 0.0000 AFTER amount;
ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS balance_quantity DECIMAL(18,4) NOT NULL DEFAULT 0.0000 AFTER executed_quantity;
ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS execution_progress DECIMAL(7,4) NOT NULL DEFAULT 0.0000 AFTER balance_quantity;

-- Link existing project_boqs to their project's site
UPDATE project_boqs pb
JOIN (
    SELECT project_id, MIN(id) AS default_site_id
    FROM project_sites
    WHERE deleted_at IS NULL
    GROUP BY project_id
) ps ON ps.project_id = pb.project_id
SET pb.site_id = ps.default_site_id
WHERE pb.site_id IS NULL;

-- Also update boq_items with site_id from project_boqs if null
UPDATE boq_items bi
JOIN project_boqs pb ON pb.id = bi.boq_id
SET bi.site_id = pb.site_id
WHERE bi.site_id IS NULL AND pb.site_id IS NOT NULL;

-- Synchronize balance_quantity = quantity - executed_quantity
UPDATE boq_items
SET balance_quantity = GREATEST(0, quantity - executed_quantity),
    execution_progress = CASE WHEN quantity > 0 THEN ROUND((executed_quantity / quantity) * 100, 2) ELSE 0 END;

-- Table for BOQ Variations
CREATE TABLE IF NOT EXISTS boq_variations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    site_id BIGINT UNSIGNED NOT NULL,
    boq_id BIGINT UNSIGNED NOT NULL,
    boq_item_id BIGINT UNSIGNED NULL,
    variation_code VARCHAR(40) NOT NULL,
    variation_title VARCHAR(200) NOT NULL,
    variation_type VARCHAR(30) NOT NULL DEFAULT 'ADDITION',
    original_quantity DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    variation_quantity DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    revised_quantity DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    unit_rate DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    original_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    variation_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    revised_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    reason TEXT NULL,
    requested_by VARCHAR(150) NULL,
    variation_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_boq_variations_boq (boq_id),
    INDEX idx_boq_variations_site (site_id),
    INDEX idx_boq_variations_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for BOQ Revisions
CREATE TABLE IF NOT EXISTS boq_revisions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    site_id BIGINT UNSIGNED NOT NULL,
    boq_id BIGINT UNSIGNED NOT NULL,
    revision_number INT UNSIGNED NOT NULL DEFAULT 1,
    revision_code VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    old_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    new_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    variation_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    changes_summary TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_boq_revisions_boq (boq_id),
    INDEX idx_boq_revisions_site (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
