-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Stored Procedures
-- ============================================================================

USE gym_db;

-- C1. sp_register_member — Inserts a new member with validation
-- Validates: name not empty, email unique, valid gender
DROP PROCEDURE IF EXISTS sp_register_member;
DELIMITER //
CREATE PROCEDURE sp_register_member(
    IN  p_name          VARCHAR(100),
    IN  p_gender        VARCHAR(10),
    IN  p_phone         VARCHAR(15),
    IN  p_email         VARCHAR(100),
    IN  p_date_of_birth DATE,
    OUT p_new_id        INT,
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_email_count INT DEFAULT 0;

    -- Validate: Name must not be empty
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SET p_new_id  = -1;
        SET p_message = 'ERROR: Member name cannot be empty.';
    -- Validate: Gender must be valid ENUM value
    ELSEIF p_gender NOT IN ('Male', 'Female', 'Other') THEN
        SET p_new_id  = -1;
        SET p_message = 'ERROR: Gender must be Male, Female, or Other.';
    ELSE
        -- Validate: Email must be unique
        SELECT COUNT(*) INTO v_email_count
        FROM Member WHERE email = p_email;

        IF v_email_count > 0 THEN
            SET p_new_id  = -1;
            SET p_message = 'ERROR: A member with this email already exists.';
        ELSE
            INSERT INTO Member (name, gender, phone, email, date_of_birth, join_date, status)
            VALUES (p_name, p_gender, p_phone, p_email, p_date_of_birth, CURDATE(), 'Active');

            SET p_new_id  = LAST_INSERT_ID();
            SET p_message = CONCAT('SUCCESS: Member "', p_name, '" registered with ID ', p_new_id);
        END IF;
    END IF;
END //
DELIMITER ;


-- C2. sp_renew_subscription — Renews or creates a subscription + payment
DROP PROCEDURE IF EXISTS sp_renew_subscription;
DELIMITER //
CREATE PROCEDURE sp_renew_subscription(
    IN  p_member_id      INT,
    IN  p_plan_id        INT,
    IN  p_payment_method VARCHAR(20),
    OUT p_sub_id         INT,
    OUT p_message        VARCHAR(255)
)
BEGIN
    DECLARE v_plan_price    DECIMAL(10,2);
    DECLARE v_plan_months   INT;
    DECLARE v_start         DATE;
    DECLARE v_end           DATE;
    DECLARE v_member_exists INT DEFAULT 0;
    DECLARE v_plan_exists   INT DEFAULT 0;

    -- Validate member exists
    SELECT COUNT(*) INTO v_member_exists FROM Member WHERE member_id = p_member_id;
    IF v_member_exists = 0 THEN
        SET p_sub_id = -1;
        SET p_message = 'ERROR: Member not found.';
    ELSE
        -- Validate plan exists
        SELECT COUNT(*) INTO v_plan_exists FROM Membership_Plan WHERE plan_id = p_plan_id;
        IF v_plan_exists = 0 THEN
            SET p_sub_id = -1;
            SET p_message = 'ERROR: Membership plan not found.';
        ELSE
            -- Expire any currently active subscription for this member
            UPDATE Subscription SET status = 'Expired'
            WHERE member_id = p_member_id AND status = 'Active';

            -- Get plan details
            SELECT price, duration_months INTO v_plan_price, v_plan_months
            FROM Membership_Plan WHERE plan_id = p_plan_id;

            SET v_start = CURDATE();
            SET v_end   = DATE_ADD(v_start, INTERVAL v_plan_months MONTH);

            -- Create new subscription
            INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status)
            VALUES (p_member_id, p_plan_id, v_start, v_end, 'Active');

            SET p_sub_id = LAST_INSERT_ID();

            -- Record payment
            INSERT INTO Payment (subscription_id, amount, payment_date, payment_method)
            VALUES (p_sub_id, v_plan_price, CURDATE(), p_payment_method);

            -- Reactivate member if inactive
            UPDATE Member SET status = 'Active' WHERE member_id = p_member_id;

            SET p_message = CONCAT('SUCCESS: Subscription renewed until ', v_end,
                                   '. Payment of ₹', v_plan_price, ' recorded.');
        END IF;
    END IF;
END //
DELIMITER ;


-- C3. sp_gym_performance_report — Generates a multi-metric report
DROP PROCEDURE IF EXISTS sp_gym_performance_report;
DELIMITER //
CREATE PROCEDURE sp_gym_performance_report(
    IN p_report_month INT,    -- month number (1–12)
    IN p_report_year  INT     -- e.g. 2023
)
BEGIN
    -- 1. Membership summary
    SELECT 'MEMBERSHIP SUMMARY' AS report_section;
    SELECT
        COUNT(*)                                                        AS total_members,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END)             AS active_members,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END)           AS inactive_members,
        SUM(CASE WHEN MONTH(join_date) = p_report_month
                  AND YEAR(join_date) = p_report_year THEN 1 ELSE 0 END) AS new_this_month
    FROM Member;

    -- 2. Revenue summary
    SELECT 'REVENUE SUMMARY' AS report_section;
    SELECT
        COUNT(*)              AS total_transactions,
        SUM(amount)           AS total_revenue,
        AVG(amount)           AS avg_transaction,
        MAX(amount)           AS highest_payment,
        payment_method,
        COUNT(*) AS count_by_method
    FROM Payment
    WHERE MONTH(payment_date) = p_report_month
      AND YEAR(payment_date) = p_report_year
    GROUP BY payment_method;

    -- 3. Attendance summary
    SELECT 'ATTENDANCE SUMMARY' AS report_section;
    SELECT
        COUNT(DISTINCT member_id)       AS unique_visitors,
        COUNT(*)                        AS total_check_ins,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, check_in_time,
            IFNULL(check_out_time, check_in_time))), 0) AS avg_session_minutes
    FROM Attendance
    WHERE MONTH(date) = p_report_month
      AND YEAR(date) = p_report_year;

    -- 4. Top 5 most active members
    SELECT 'TOP 5 ACTIVE MEMBERS' AS report_section;
    SELECT m.member_id, m.name, COUNT(*) AS visits
    FROM Attendance a
    JOIN Member m ON a.member_id = m.member_id
    WHERE MONTH(a.date) = p_report_month
      AND YEAR(a.date) = p_report_year
    GROUP BY m.member_id, m.name
    ORDER BY visits DESC
    LIMIT 5;

    -- 5. Equipment needing attention
    SELECT 'EQUIPMENT ALERTS' AS report_section;
    SELECT equipment_id, equipment_name, condition_status, location
    FROM Equipment
    WHERE condition_status IN ('Needs Repair', 'Out of Order');
END //
DELIMITER ;
