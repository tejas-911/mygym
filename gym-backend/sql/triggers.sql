-- ============================================================================
-- GYM MANAGEMENT SYSTEM — Triggers
-- ============================================================================

USE gym_db;

-- E1. BEFORE INSERT on Attendance — Validates member is Active before check-in
DROP TRIGGER IF EXISTS trg_attendance_validate_member;
DELIMITER //
CREATE TRIGGER trg_attendance_validate_member
BEFORE INSERT ON Attendance
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(10);

    SELECT status INTO v_status
    FROM Member WHERE member_id = NEW.member_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot check in: Member does not exist.';
    ELSEIF v_status = 'Inactive' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot check in: Member is Inactive. Renew subscription first.';
    END IF;
END //
DELIMITER ;


-- E2. AFTER INSERT on Payment — Audit log trigger
DROP TRIGGER IF EXISTS trg_payment_audit_log;
DELIMITER //
CREATE TRIGGER trg_payment_audit_log
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, action_type, record_id, new_values)
    VALUES (
        'Payment',
        'INSERT',
        NEW.payment_id,
        JSON_OBJECT(
            'subscription_id', NEW.subscription_id,
            'amount',          NEW.amount,
            'payment_date',    NEW.payment_date,
            'payment_method',  NEW.payment_method,
            'status',          IFNULL(NEW.status, 'Paid')
        )
    );
END //
DELIMITER ;


-- E3. AFTER INSERT on Supplement_Sale — Auto-decrement stock
--     Raises error if stock is insufficient
DROP TRIGGER IF EXISTS trg_supplement_stock_update;
DELIMITER //
CREATE TRIGGER trg_supplement_stock_update
AFTER INSERT ON Supplement_Sale
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;

    SELECT stock_quantity INTO v_stock
    FROM Supplement WHERE supplement_id = NEW.supplement_id;

    IF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock for this supplement.';
    ELSE
        UPDATE Supplement
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE supplement_id = NEW.supplement_id;
    END IF;
END //
DELIMITER ;


-- E4. BEFORE INSERT on Subscription — Auto-expire overlapping subscriptions
DROP TRIGGER IF EXISTS trg_subscription_auto_expire;
DELIMITER //
CREATE TRIGGER trg_subscription_auto_expire
BEFORE INSERT ON Subscription
FOR EACH ROW
BEGIN
    -- Auto-set status to Expired if end_date is already in the past
    IF NEW.end_date < CURDATE() THEN
        SET NEW.status = 'Expired';
    END IF;
END //
DELIMITER ;


-- E5. AFTER UPDATE on Member — Audit log for member status changes
DROP TRIGGER IF EXISTS trg_member_status_audit;
DELIMITER //
CREATE TRIGGER trg_member_status_audit
AFTER UPDATE ON Member
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO Audit_Log (table_name, action_type, record_id, old_values, new_values)
        VALUES (
            'Member',
            'UPDATE',
            NEW.member_id,
            JSON_OBJECT('status', OLD.status, 'name', OLD.name),
            JSON_OBJECT('status', NEW.status, 'name', NEW.name)
        );
    END IF;
END //
DELIMITER ;
