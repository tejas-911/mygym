-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Verification & Testing Queries
-- ============================================================================

USE gym_db;

-- Test View: Member Dashboard
SELECT * FROM vw_member_dashboard LIMIT 5;

-- Test View: Monthly Revenue
SELECT * FROM vw_monthly_revenue ORDER BY payment_month DESC;

-- Test Function: Age Calculation
SELECT name, fn_member_age(member_id) AS age FROM Member LIMIT 5;

-- Test Function: Subscription Status Label
SELECT name, fn_subscription_status_label(member_id) AS status FROM Member LIMIT 5;

-- Test Stored Procedure: Register Member
CALL sp_register_member('Test User', 'Male', '1111111111', 'test@gym.com', '2000-01-01', @id, @msg);
SELECT @id AS new_id, @msg AS result_message;

-- Test Stored Procedure: Gym Performance Report
CALL sp_gym_performance_report(1, 2023);
