-- ============================================================================
-- GYM MANAGEMENT SYSTEM — CHECK Constraints (Idempotent)
-- Run this after schema.sql / on an existing database to add all 21 constraints
-- NOTE: MySQL 8.0+ CHECK constraints — CURDATE()/NOW() are NOT allowed
-- ============================================================================

USE gym_db;

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: add a CHECK constraint only if it doesn't already exist
-- ────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS _add_check_constraint;
DELIMITER //
CREATE PROCEDURE _add_check_constraint(
    IN tbl_name  VARCHAR(64),
    IN con_name  VARCHAR(64),
    IN con_expr  TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE  TABLE_SCHEMA    = DATABASE()
          AND  TABLE_NAME      = tbl_name
          AND  CONSTRAINT_NAME = con_name
          AND  CONSTRAINT_TYPE = 'CHECK'
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE ', tbl_name,
            ' ADD CONSTRAINT ', con_name,
            ' CHECK (', con_expr, ')'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- 1. Member
-- ============================================================================

-- Phone must be at least 7 characters (if provided)
CALL _add_check_constraint('Member', 'chk_member_phone_length',
    'phone IS NULL OR LENGTH(TRIM(phone)) >= 7');

-- ============================================================================
-- 2. Trainer
-- ============================================================================

-- Salary must be positive (if provided)
CALL _add_check_constraint('Trainer', 'chk_trainer_salary_positive',
    'salary IS NULL OR salary > 0');

-- ============================================================================
-- 3. Membership_Plan
-- ============================================================================

-- Price must be greater than zero
CALL _add_check_constraint('Membership_Plan', 'chk_plan_price_positive',
    'price > 0');

-- Duration must be at least 1 month
CALL _add_check_constraint('Membership_Plan', 'chk_plan_duration_positive',
    'duration_months >= 1');

-- ============================================================================
-- 4. Subscription
-- ============================================================================

-- End date must be after start date
CALL _add_check_constraint('Subscription', 'chk_sub_dates_valid',
    'end_date > start_date');

-- ============================================================================
-- 5. Payment
-- ============================================================================

-- Amount must be greater than zero
CALL _add_check_constraint('Payment', 'chk_payment_amount_positive',
    'amount > 0');

-- ============================================================================
-- 6. Attendance
-- ============================================================================

-- Check-out must be after check-in (if provided)
CALL _add_check_constraint('Attendance', 'chk_attendance_checkout_after_checkin',
    'check_out_time IS NULL OR check_out_time > check_in_time');

-- Session duration cannot exceed 24 hours
CALL _add_check_constraint('Attendance', 'chk_attendance_max_session',
    'check_out_time IS NULL OR TIMESTAMPDIFF(HOUR, check_in_time, check_out_time) <= 24');

-- ============================================================================
-- 7. Workout_Plan
-- ============================================================================

-- Duration must be at least 1 week (if provided)
CALL _add_check_constraint('Workout_Plan', 'chk_workout_duration_positive',
    'duration_weeks IS NULL OR duration_weeks >= 1');

-- ============================================================================
-- 9. Workout_Exercise
-- ============================================================================

-- Sets must be at least 1
CALL _add_check_constraint('Workout_Exercise', 'chk_we_sets_positive',
    '`sets` >= 1');

-- Reps must be at least 1
CALL _add_check_constraint('Workout_Exercise', 'chk_we_reps_positive',
    '`reps` >= 1');

-- Rest time must be non-negative (if provided)
CALL _add_check_constraint('Workout_Exercise', 'chk_we_rest_nonneg',
    'rest_time IS NULL OR rest_time >= 0');

-- ============================================================================
-- 11. Diet_Plan
-- ============================================================================

-- Daily calories must be in a realistic range (500 – 10,000 kcal)
CALL _add_check_constraint('Diet_Plan', 'chk_diet_calories_range',
    'calories_per_day BETWEEN 500 AND 10000');

-- ============================================================================
-- 14. Maintenance
-- ============================================================================

-- Maintenance cost must be non-negative (if provided)
CALL _add_check_constraint('Maintenance', 'chk_maintenance_cost_nonneg',
    'cost IS NULL OR cost >= 0');

-- ============================================================================
-- 15. Supplement
-- ============================================================================

-- Price must be greater than zero
CALL _add_check_constraint('Supplement', 'chk_supplement_price_positive',
    'price > 0');

-- Stock cannot be negative
CALL _add_check_constraint('Supplement', 'chk_supplement_stock_nonneg',
    'stock_quantity >= 0');

-- ============================================================================
-- 16. Supplement_Sale
-- ============================================================================

-- Quantity sold must be at least 1
CALL _add_check_constraint('Supplement_Sale', 'chk_sale_quantity_positive',
    'quantity >= 1');

-- Total sale amount must be positive
CALL _add_check_constraint('Supplement_Sale', 'chk_sale_amount_positive',
    'total_amount > 0');

-- ============================================================================
-- 17. Class_Schedule
-- ============================================================================

-- Capacity must be at least 1
CALL _add_check_constraint('Class_Schedule', 'chk_class_capacity_positive',
    'capacity >= 1');

-- Session must be at least 15 minutes
CALL _add_check_constraint('Class_Schedule', 'chk_class_duration_min',
    'duration_minutes >= 15');

-- Registered count cannot exceed capacity
CALL _add_check_constraint('Class_Schedule', 'chk_class_registered_lte_capacity',
    'registered <= capacity');

-- Registered count cannot be negative
CALL _add_check_constraint('Class_Schedule', 'chk_class_registered_nonneg',
    'registered >= 0');

-- ── Cleanup ──────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS _add_check_constraint;

SELECT CONCAT(
    COUNT(*), ' CHECK constraints active on gym_db'
) AS constraint_summary
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_TYPE = 'CHECK';
