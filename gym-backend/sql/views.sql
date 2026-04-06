-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Views
-- ============================================================================

USE gym_db;

-- B1. Member Dashboard Summary View
-- Shows every member with their active plan, remaining days, and payment total
DROP VIEW IF EXISTS vw_member_dashboard;
CREATE VIEW vw_member_dashboard AS
SELECT
    m.member_id,
    m.name           AS member_name,
    m.gender,
    m.phone,
    m.email,
    m.status         AS member_status,
    m.join_date,
    -- Active subscription info (most recent)
    sub.subscription_id,
    mp.plan_name,
    mp.price         AS plan_price,
    sub.start_date   AS subscription_start,
    sub.end_date     AS subscription_end,
    sub.status       AS subscription_status,
    DATEDIFF(sub.end_date, CURDATE()) AS days_remaining,
    -- Lifetime payment total
    IFNULL(pay.total_paid, 0) AS total_paid,
    -- Total visits
    IFNULL(att.visit_count, 0) AS total_visits
FROM Member m
LEFT JOIN Subscription sub
    ON sub.subscription_id = (
        SELECT s2.subscription_id
        FROM Subscription s2
        WHERE s2.member_id = m.member_id
        ORDER BY s2.end_date DESC
        LIMIT 1
    )
LEFT JOIN Membership_Plan mp  ON sub.plan_id = mp.plan_id
LEFT JOIN (
    SELECT s.member_id, SUM(p.amount) AS total_paid
    FROM Subscription s
    JOIN Payment p ON p.subscription_id = s.subscription_id
    GROUP BY s.member_id
) pay ON pay.member_id = m.member_id
LEFT JOIN (
    SELECT member_id, COUNT(*) AS visit_count
    FROM Attendance
    GROUP BY member_id
) att ON att.member_id = m.member_id;

-- B2. Revenue Report View (Monthly)
-- Aggregates revenue by month, plan, and payment method
DROP VIEW IF EXISTS vw_monthly_revenue;
CREATE VIEW vw_monthly_revenue AS
SELECT
    DATE_FORMAT(p.payment_date, '%Y-%m')  AS payment_month,
    mp.plan_name,
    p.payment_method,
    COUNT(*)                              AS transaction_count,
    SUM(p.amount)                         AS total_revenue,
    AVG(p.amount)                         AS avg_transaction
FROM Payment p
JOIN Subscription s   ON p.subscription_id = s.subscription_id
JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
WHERE IFNULL(p.status, 'Paid') = 'Paid'
GROUP BY payment_month, mp.plan_name, p.payment_method;

-- B3. Daily Attendance Report View
-- Shows today's gym traffic with session durations
DROP VIEW IF EXISTS vw_daily_attendance;
CREATE VIEW vw_daily_attendance AS
SELECT
    a.attendance_id,
    m.member_id,
    m.name          AS member_name,
    m.status        AS member_status,
    a.check_in_time,
    a.check_out_time,
    a.date,
    TIMESTAMPDIFF(MINUTE, a.check_in_time,
        IFNULL(a.check_out_time, NOW()))    AS session_minutes,
    CASE
        WHEN a.check_out_time IS NULL THEN 'Inside Now'
        ELSE 'Completed'
    END AS visit_status
FROM Attendance a
JOIN Member m ON a.member_id = m.member_id;

-- B4. Equipment Maintenance Overview
-- Joins equipment with its latest maintenance and flags overdue items
DROP VIEW IF EXISTS vw_equipment_health;
CREATE VIEW vw_equipment_health AS
SELECT
    e.equipment_id,
    e.equipment_name,
    e.condition_status,
    e.location,
    e.purchase_date,
    latest.last_service_date,
    latest.last_service_cost,
    DATEDIFF(CURDATE(), latest.last_service_date) AS days_since_service,
    CASE
        WHEN DATEDIFF(CURDATE(), latest.last_service_date) > 180 THEN 'Overdue'
        WHEN DATEDIFF(CURDATE(), latest.last_service_date) > 90  THEN 'Due Soon'
        ELSE 'OK'
    END AS maintenance_flag
FROM Equipment e
LEFT JOIN (
    SELECT
        equipment_id,
        MAX(maintenance_date) AS last_service_date,
        (SELECT cost FROM Maintenance m2
         WHERE m2.equipment_id = m1.equipment_id
         ORDER BY maintenance_id DESC LIMIT 1) AS last_service_cost
    FROM Maintenance m1
    GROUP BY equipment_id
) latest ON latest.equipment_id = e.equipment_id;
