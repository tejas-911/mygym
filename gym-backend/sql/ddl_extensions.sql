-- ============================================================================
-- GYM MANAGEMENT SYSTEM — DDL Extensions (Audit Logs, Indexes & Constraints)
-- ============================================================================

USE gym_db;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. AUDIT LOG TABLE
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Audit_Log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    table_name   VARCHAR(50)  NOT NULL,
    action_type  ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    record_id    INT          NOT NULL,
    old_values   JSON,
    new_values   JSON,
    changed_by   VARCHAR(100) DEFAULT 'SYSTEM',
    changed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. DYNAMIC COLUMN ADDITIONS (idempotent)
-- ────────────────────────────────────────────────────────────────────────────

-- Add status column to Payment (for Paid/Pending/Refunded/Failed tracking)
DROP PROCEDURE IF EXISTS _add_payment_status;
DELIMITER //
CREATE PROCEDURE _add_payment_status()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Payment' AND COLUMN_NAME = 'status'
    ) THEN
        ALTER TABLE Payment
            ADD COLUMN status ENUM('Paid','Pending','Refunded','Failed')
            DEFAULT 'Paid' AFTER payment_method;
    END IF;
END //
DELIMITER ;
CALL _add_payment_status();
DROP PROCEDURE IF EXISTS _add_payment_status;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. PERFORMANCE INDEXES (idempotent helper)
-- ────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS _create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE _create_index_if_not_exists(
    IN idx_name VARCHAR(64), IN tbl_name VARCHAR(64), IN col_def VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl_name
          AND INDEX_NAME   = idx_name
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl_name, '(', col_def, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ── Attendance ──────────────────────────────────────────────────────────────
-- Fast lookup by date (daily stats, today's log)
CALL _create_index_if_not_exists('idx_attendance_date',          'Attendance', 'date');
-- Composite: member history + daily queries
CALL _create_index_if_not_exists('idx_attendance_member_date',   'Attendance', 'member_id, date');
-- Find currently inside (check_out_time IS NULL)
CALL _create_index_if_not_exists('idx_attendance_checkout',      'Attendance', 'check_out_time');

-- ── Member ───────────────────────────────────────────────────────────────────
-- Filter active vs inactive members (most common query pattern)
CALL _create_index_if_not_exists('idx_member_status',            'Member', 'status');
-- Monthly new-member reports
CALL _create_index_if_not_exists('idx_member_join_date',         'Member', 'join_date');

-- ── Subscription ─────────────────────────────────────────────────────────────
-- Filter active subscriptions (very frequent in views + procedures)
CALL _create_index_if_not_exists('idx_subscription_status',      'Subscription', 'status');
-- Member's subscriptions lookup + renewal checks
CALL _create_index_if_not_exists('idx_subscription_member',      'Subscription', 'member_id');
-- Expiry-based queries (auto-expire procedure, status label function)
CALL _create_index_if_not_exists('idx_subscription_end_date',    'Subscription', 'end_date');
-- Composite: member's active sub in one scan
CALL _create_index_if_not_exists('idx_subscription_member_stat', 'Subscription', 'member_id, status');

-- ── Payment ──────────────────────────────────────────────────────────────────
-- Revenue by date range (monthly trend, stats)
CALL _create_index_if_not_exists('idx_payment_date',             'Payment', 'payment_date');
-- Filter by payment status (Paid/Pending/Refunded/Failed)
CALL _create_index_if_not_exists('idx_payment_status',           'Payment', 'status');
-- Payment method breakdown queries
CALL _create_index_if_not_exists('idx_payment_method',           'Payment', 'payment_method');
-- Composite: subscription payments by date (revenue controller joins)
CALL _create_index_if_not_exists('idx_payment_sub_date',         'Payment', 'subscription_id, payment_date');

-- ── Class_Schedule ────────────────────────────────────────────────────────────
-- Daily class lookups (stats, weekly view)
CALL _create_index_if_not_exists('idx_class_schedule_date',      'Class_Schedule', 'scheduled_date');
-- Trainer's classes
CALL _create_index_if_not_exists('idx_class_trainer',            'Class_Schedule', 'trainer_name');
-- Composite: date + time for ordered schedule display
CALL _create_index_if_not_exists('idx_class_date_time',          'Class_Schedule', 'scheduled_date, scheduled_time');

-- ── Supplement_Sale ───────────────────────────────────────────────────────────
-- Sales reports by date
CALL _create_index_if_not_exists('idx_sale_date',                'Supplement_Sale', 'sale_date');
-- Member purchase history
CALL _create_index_if_not_exists('idx_sale_member',              'Supplement_Sale', 'member_id');

-- ── Maintenance ───────────────────────────────────────────────────────────────
-- Equipment health view: latest maintenance per equipment
CALL _create_index_if_not_exists('idx_maintenance_equipment',    'Maintenance', 'equipment_id');
-- Service date queries
CALL _create_index_if_not_exists('idx_maintenance_date',         'Maintenance', 'maintenance_date');

-- ── Member_Workout ────────────────────────────────────────────────────────────
-- Trainer assignment queries (top trainer report)
CALL _create_index_if_not_exists('idx_member_workout_trainer',   'Member_Workout', 'trainer_id');

-- ── Audit_Log ─────────────────────────────────────────────────────────────────
-- Recent audit log queries
CALL _create_index_if_not_exists('idx_audit_log_changed_at',     'Audit_Log', 'changed_at');
-- Filter audit log by table
CALL _create_index_if_not_exists('idx_audit_log_table',          'Audit_Log', 'table_name, action_type');

DROP PROCEDURE IF EXISTS _create_index_if_not_exists;
