-- ============================================================================
-- GYM MANAGEMENT SYSTEM — DDL Extensions (Audit Logs & Indexes)
-- ============================================================================

USE gym_db;

-- Audit log table — captures inserts, updates, deletes across critical tables
CREATE TABLE IF NOT EXISTS Audit_Log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    table_name   VARCHAR(50)  NOT NULL,
    action_type  ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    record_id    INT          NOT NULL,          -- PK of the affected row
    old_values   JSON,                           -- snapshot before change
    new_values   JSON,                           -- snapshot after change
    changed_by   VARCHAR(100) DEFAULT 'SYSTEM',
    changed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Add a status column to Payment for tracking refunds / pending states
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
DROP PROCEDURE _add_payment_status;

-- Add indexes on frequently filtered columns for performance
DROP PROCEDURE IF EXISTS _create_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE _create_index_if_not_exists(
    IN idx_name VARCHAR(64), IN tbl_name VARCHAR(64), IN col_def VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl_name AND INDEX_NAME = idx_name
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl_name, '(', col_def, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL _create_index_if_not_exists('idx_attendance_date',     'Attendance',     'date');
CALL _create_index_if_not_exists('idx_attendance_member',   'Attendance',     'member_id, date');
CALL _create_index_if_not_exists('idx_subscription_status', 'Subscription',   'status');
CALL _create_index_if_not_exists('idx_payment_date',        'Payment',        'payment_date');
CALL _create_index_if_not_exists('idx_class_schedule_date', 'Class_Schedule', 'scheduled_date');

DROP PROCEDURE _create_index_if_not_exists;
