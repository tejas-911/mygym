-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Full Test & Verification Suite
-- Run after seed.sql to verify ALL database features work correctly
-- ============================================================================

USE gym_db;

-- ============================================================================
-- SECTION 1 — VIEWS
-- ============================================================================

SELECT '═══ VIEW: vw_member_dashboard ═══' AS test_section;
SELECT member_id, member_name, plan_name, subscription_status,
       days_remaining, total_paid, total_visits
FROM vw_member_dashboard
ORDER BY member_id
LIMIT 8;

SELECT '═══ VIEW: vw_monthly_revenue (Paid only) ═══' AS test_section;
SELECT payment_month, plan_name, payment_method,
       transaction_count, total_revenue, avg_transaction
FROM vw_monthly_revenue
ORDER BY payment_month DESC
LIMIT 10;

SELECT '═══ VIEW: vw_daily_attendance (today + recent) ═══' AS test_section;
SELECT member_name, date, check_in_time, check_out_time,
       session_minutes, visit_status
FROM vw_daily_attendance
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
ORDER BY date DESC, check_in_time DESC;

SELECT '═══ VIEW: vw_equipment_health ═══' AS test_section;
SELECT equipment_name, condition_status, location,
       last_service_date, days_since_service, maintenance_flag
FROM vw_equipment_health
ORDER BY maintenance_flag DESC, days_since_service DESC;

-- ============================================================================
-- SECTION 2 — FUNCTIONS
-- ============================================================================

SELECT '═══ FUNCTION: fn_member_age ═══' AS test_section;
SELECT member_id, name, date_of_birth,
       fn_member_age(member_id) AS age_years
FROM Member
ORDER BY member_id
LIMIT 10;

SELECT '═══ FUNCTION: fn_subscription_status_label ═══' AS test_section;
SELECT m.member_id, m.name,
       fn_subscription_status_label(m.member_id) AS subscription_label
FROM Member m
ORDER BY m.member_id
LIMIT 10;

SELECT '═══ FUNCTION: fn_total_revenue_by_member ═══' AS test_section;
SELECT m.member_id, m.name,
       fn_total_revenue_by_member(m.member_id) AS lifetime_revenue
FROM Member m
ORDER BY lifetime_revenue DESC
LIMIT 10;

-- ============================================================================
-- SECTION 3 — STORED PROCEDURES
-- ============================================================================

SELECT '═══ PROCEDURE: sp_register_member (valid) ═══' AS test_section;
CALL sp_register_member(
    'Test Athlete', 'Male', '7001001000',
    'test.athlete@gym.test', '1995-06-15',
    @new_id, @new_msg
);
SELECT @new_id AS member_id, @new_msg AS message;

SELECT '═══ PROCEDURE: sp_register_member (duplicate email) ═══' AS test_section;
CALL sp_register_member(
    'Duplicate User', 'Female', '7001001001',
    'test.athlete@gym.test', '1998-01-01',
    @dup_id, @dup_msg
);
SELECT @dup_id AS member_id, @dup_msg AS message;

SELECT '═══ PROCEDURE: sp_register_member (invalid gender) ═══' AS test_section;
CALL sp_register_member(
    'Bad Gender', 'Robot', '7001001002',
    'bad.gender@gym.test', '1990-01-01',
    @bg_id, @bg_msg
);
SELECT @bg_id AS member_id, @bg_msg AS message;

SELECT '═══ PROCEDURE: sp_renew_subscription ═══' AS test_section;
-- Renew for member 3 (Mike Johnson) on Quarterly Pro plan via UPI
CALL sp_renew_subscription(3, 2, 'UPI', @sub_id, @sub_msg);
SELECT @sub_id AS subscription_id, @sub_msg AS message;

SELECT '═══ PROCEDURE: sp_gym_performance_report (Apr 2026) ═══' AS test_section;
CALL sp_gym_performance_report(4, 2026);

SELECT '═══ PROCEDURE: sp_gym_performance_report (Mar 2026) ═══' AS test_section;
CALL sp_gym_performance_report(3, 2026);

-- ============================================================================
-- SECTION 4 — TRIGGERS
-- ============================================================================

SELECT '═══ TRIGGER: trg_payment_audit_log (recent entries) ═══' AS test_section;
SELECT log_id, table_name, action_type, record_id,
       JSON_EXTRACT(new_values, '$.amount')          AS amount,
       JSON_EXTRACT(new_values, '$.payment_method')  AS method,
       JSON_EXTRACT(new_values, '$.status')           AS status,
       changed_at
FROM Audit_Log
WHERE table_name = 'Payment'
ORDER BY changed_at DESC
LIMIT 8;

SELECT '═══ TRIGGER: trg_member_status_audit ═══' AS test_section;
-- Simulate a status change
UPDATE Member SET status = 'Inactive' WHERE member_id = 13;
UPDATE Member SET status = 'Active'   WHERE member_id = 13;
-- Verify audit entries were created
SELECT log_id, action_type, record_id,
       JSON_EXTRACT(old_values, '$.status') AS old_status,
       JSON_EXTRACT(new_values, '$.status') AS new_status,
       changed_at
FROM Audit_Log
WHERE table_name = 'Member' AND record_id = 13
ORDER BY changed_at DESC
LIMIT 4;

SELECT '═══ TRIGGER: trg_attendance_validate_member (Inactive reject) ═══' AS test_section;
-- Temporarily set member 13 inactive then try to check in — should fail
UPDATE Member SET status = 'Inactive' WHERE member_id = 13;
BEGIN;
    INSERT INTO Attendance (member_id, check_in_time, date)
    VALUES (13, NOW(), CURDATE());
ROLLBACK;
-- Restore status
UPDATE Member SET status = 'Active' WHERE member_id = 13;
SELECT 'Expected: trigger blocked check-in for Inactive member' AS result;

SELECT '═══ TRIGGER: trg_supplement_stock_update ═══' AS test_section;
-- Check current stock levels
SELECT supplement_id, name, stock_quantity FROM Supplement ORDER BY supplement_id LIMIT 5;
-- A valid supplement sale should decrement stock
INSERT INTO Supplement_Sale (member_id, supplement_id, quantity, sale_date, total_amount)
VALUES (1, 1, 1, CURDATE(), (SELECT price FROM Supplement WHERE supplement_id = 1));
-- Verify stock decreased
SELECT supplement_id, name, stock_quantity AS stock_after_sale FROM Supplement
WHERE supplement_id = 1;

SELECT '═══ TRIGGER: trg_subscription_auto_expire ═══' AS test_section;
-- An INSERT with a past end_date should automatically get Expired status
INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status)
VALUES (1, 1, '2023-01-01', '2023-02-01', 'Active');
SELECT subscription_id, member_id, start_date, end_date, status
FROM Subscription
WHERE member_id = 1 AND start_date = '2023-01-01';
-- Cleanup test record
DELETE FROM Subscription WHERE member_id = 1 AND start_date = '2023-01-01';

-- ============================================================================
-- SECTION 5 — CHECK CONSTRAINTS
-- ============================================================================

SELECT '═══ CHECK CONSTRAINTS: Verification ═══' AS test_section;
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

SELECT '═══ CHECK CONSTRAINTS: Violation test (amount = 0 → should fail) ═══' AS test_section;
-- This INSERT should be rejected by chk_payment_amount_positive
BEGIN;
    INSERT INTO Payment (subscription_id, amount, payment_date, payment_method)
    VALUES (1, 0, CURDATE(), 'Cash');
ROLLBACK;
SELECT 'Expected: constraint violation for amount = 0' AS result;

SELECT '═══ CHECK CONSTRAINTS: Violation test (calories out of range) ═══' AS test_section;
BEGIN;
    INSERT INTO Diet_Plan (plan_name, goal, calories_per_day)
    VALUES ('Test Diet', 'Test', 50);
ROLLBACK;
SELECT 'Expected: constraint violation for calories_per_day = 50 (below 500)' AS result;

-- ============================================================================
-- SECTION 6 — INDEXES
-- ============================================================================

SELECT '═══ INDEXES: All custom indexes on gym_db ═══' AS test_section;
SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
    IF(NON_UNIQUE = 0, 'UNIQUE', 'INDEX') AS index_type
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME <> 'PRIMARY'
  AND INDEX_NAME NOT LIKE 'fk_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- SECTION 7 — ANALYTICS QUERIES (mirrors backend controllers)
-- ============================================================================

SELECT '═══ ANALYTICS: Monthly Revenue (12-month rolling) ═══' AS test_section;
SELECT payment_month,
       SUM(total_revenue)     AS total_revenue,
       SUM(transaction_count) AS transaction_count
FROM vw_monthly_revenue
GROUP BY payment_month
ORDER BY payment_month DESC
LIMIT 12;

SELECT '═══ ANALYTICS: Revenue by Membership Plan (2026) ═══' AS test_section;
SELECT mp.plan_name,
       IFNULL(SUM(p.amount), 0) AS total_revenue,
       COUNT(*)                 AS transactions
FROM Payment p
JOIN Subscription s     ON p.subscription_id = s.subscription_id
JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
WHERE YEAR(p.payment_date) = 2026
GROUP BY mp.plan_id, mp.plan_name
ORDER BY total_revenue DESC;

SELECT '═══ ANALYTICS: Revenue by Payment Method (2026) ═══' AS test_section;
SELECT payment_method,
       IFNULL(SUM(amount), 0) AS total,
       COUNT(*)               AS count
FROM Payment
WHERE YEAR(payment_date) = 2026
GROUP BY payment_method
ORDER BY total DESC;

SELECT '═══ ANALYTICS: Subscription Status Breakdown ═══' AS test_section;
SELECT
    IFNULL(SUM(CASE WHEN status = 'Active'    THEN 1 ELSE 0 END), 0) AS active_subs,
    IFNULL(SUM(CASE WHEN status = 'Expired'   THEN 1 ELSE 0 END), 0) AS expired_subs,
    IFNULL(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_subs,
    COUNT(*)                                                           AS total_subs
FROM Subscription;

SELECT '═══ ANALYTICS: This Month Revenue & Stats ═══' AS test_section;
SELECT
    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
             AND IFNULL(status,'Paid') = 'Paid' THEN amount ELSE 0 END) AS this_month_revenue,
    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),'%Y-%m')
             AND IFNULL(status,'Paid') = 'Paid' THEN amount ELSE 0 END) AS last_month_revenue,
    COUNT(CASE WHEN YEARWEEK(payment_date,1) = YEARWEEK(NOW(),1)
               AND IFNULL(status,'Paid') = 'Paid' THEN 1 END)          AS successful_this_week,
    COUNT(CASE WHEN IFNULL(status,'Paid') = 'Pending' THEN 1 END)      AS pending_count,
    COUNT(*)                                                             AS total_all
FROM Payment;

SELECT '═══ ANALYTICS: Absent Members (not visited in 7 days) ═══' AS test_section;
SELECT m.member_id, m.name,
       fn_subscription_status_label(m.member_id) AS subscription
FROM Member m
WHERE m.status = 'Active'
  AND m.member_id NOT IN (
      SELECT member_id FROM Attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  )
ORDER BY m.member_id;

-- ============================================================================
-- SECTION 8 — DATA INTEGRITY SUMMARY
-- ============================================================================

SELECT '═══ SUMMARY: Table Row Counts ═══' AS test_section;
SELECT 'Member'          AS tbl, COUNT(*) AS rows FROM Member
UNION ALL SELECT 'Trainer',        COUNT(*) FROM Trainer
UNION ALL SELECT 'Membership_Plan',COUNT(*) FROM Membership_Plan
UNION ALL SELECT 'Subscription',   COUNT(*) FROM Subscription
UNION ALL SELECT 'Payment',        COUNT(*) FROM Payment
UNION ALL SELECT 'Attendance',     COUNT(*) FROM Attendance
UNION ALL SELECT 'Workout_Plan',   COUNT(*) FROM Workout_Plan
UNION ALL SELECT 'Exercise',       COUNT(*) FROM Exercise
UNION ALL SELECT 'Workout_Exercise',COUNT(*) FROM Workout_Exercise
UNION ALL SELECT 'Member_Workout', COUNT(*) FROM Member_Workout
UNION ALL SELECT 'Diet_Plan',      COUNT(*) FROM Diet_Plan
UNION ALL SELECT 'Member_Diet',    COUNT(*) FROM Member_Diet
UNION ALL SELECT 'Equipment',      COUNT(*) FROM Equipment
UNION ALL SELECT 'Maintenance',    COUNT(*) FROM Maintenance
UNION ALL SELECT 'Supplement',     COUNT(*) FROM Supplement
UNION ALL SELECT 'Supplement_Sale',COUNT(*) FROM Supplement_Sale
UNION ALL SELECT 'Class_Schedule', COUNT(*) FROM Class_Schedule
UNION ALL SELECT 'Audit_Log',      COUNT(*) FROM Audit_Log;

-- Cleanup test member added by sp_register_member test above
DELETE FROM Member WHERE email = 'test.athlete@gym.test';

SELECT '✓ All tests completed.' AS status;
