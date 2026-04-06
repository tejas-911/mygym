-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Functions
-- ============================================================================

USE gym_db;

-- D1. fn_member_age — Calculates a member's current age from date_of_birth
DROP FUNCTION IF EXISTS fn_member_age;
DELIMITER //
CREATE FUNCTION fn_member_age(p_member_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_dob DATE;

    SELECT date_of_birth INTO v_dob
    FROM Member WHERE member_id = p_member_id;

    IF v_dob IS NULL THEN
        RETURN NULL;
    END IF;

    -- Accurate age considering whether birthday has occurred this year
    RETURN TIMESTAMPDIFF(YEAR, v_dob, CURDATE());
END //
DELIMITER ;


-- D2. fn_subscription_status_label — Returns a human-readable subscription
--     status with days remaining or days since expiry
DROP FUNCTION IF EXISTS fn_subscription_status_label;
DELIMITER //
CREATE FUNCTION fn_subscription_status_label(p_member_id INT)
RETURNS VARCHAR(100)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_end_date DATE;
    DECLARE v_status   VARCHAR(20);
    DECLARE v_diff     INT;

    SELECT end_date, status INTO v_end_date, v_status
    FROM Subscription
    WHERE member_id = p_member_id
    ORDER BY end_date DESC
    LIMIT 1;

    IF v_end_date IS NULL THEN
        RETURN 'No Subscription';
    END IF;

    SET v_diff = DATEDIFF(v_end_date, CURDATE());

    IF v_status = 'Cancelled' THEN
        RETURN 'Cancelled';
    ELSEIF v_diff < 0 THEN
        RETURN CONCAT('Expired ', ABS(v_diff), ' days ago');
    ELSEIF v_diff <= 7 THEN
        RETURN CONCAT('Expiring in ', v_diff, ' days - RENEW NOW');
    ELSE
        RETURN CONCAT('Active - ', v_diff, ' days remaining');
    END IF;
END //
DELIMITER ;


-- D3. fn_total_revenue_by_member — Returns lifetime revenue from a member
DROP FUNCTION IF EXISTS fn_total_revenue_by_member;
DELIMITER //
CREATE FUNCTION fn_total_revenue_by_member(p_member_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;

    SELECT IFNULL(SUM(p.amount), 0.00) INTO v_total
    FROM Payment p
    JOIN Subscription s ON p.subscription_id = s.subscription_id
    WHERE s.member_id = p_member_id;

    RETURN v_total;
END //
DELIMITER ;
