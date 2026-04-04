USE gym_db;

-- Add password to Member (idempotent)
DROP PROCEDURE IF EXISTS _update_schema_member;
DELIMITER //
CREATE PROCEDURE _update_schema_member()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Member' AND COLUMN_NAME = 'password'
    ) THEN
        ALTER TABLE Member ADD COLUMN password VARCHAR(255)
            DEFAULT '$2a$10$tZ2yN7M7d32K0o0dF.ZlO.P936kHjQpX8qO8mH2g6E.E7oHtzN1Ua';
    END IF;
END //
DELIMITER ;
CALL _update_schema_member();
DROP PROCEDURE IF EXISTS _update_schema_member;

-- Add email to Trainer (idempotent)
DROP PROCEDURE IF EXISTS _update_schema_trainer_email;
DELIMITER //
CREATE PROCEDURE _update_schema_trainer_email()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Trainer' AND COLUMN_NAME = 'email'
    ) THEN
        ALTER TABLE Trainer ADD COLUMN email VARCHAR(100) DEFAULT 'trainer@example.com';
    END IF;
END //
DELIMITER ;
CALL _update_schema_trainer_email();
DROP PROCEDURE IF EXISTS _update_schema_trainer_email;

-- Add password to Trainer (idempotent)
DROP PROCEDURE IF EXISTS _update_schema_trainer_pwd;
DELIMITER //
CREATE PROCEDURE _update_schema_trainer_pwd()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Trainer' AND COLUMN_NAME = 'password'
    ) THEN
        ALTER TABLE Trainer ADD COLUMN password VARCHAR(255)
            DEFAULT '$2a$10$tZ2yN7M7d32K0o0dF.ZlO.P936kHjQpX8qO8mH2g6E.E7oHtzN1Ua';
    END IF;
END //
DELIMITER ;
CALL _update_schema_trainer_pwd();
DROP PROCEDURE IF EXISTS _update_schema_trainer_pwd;
