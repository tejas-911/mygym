USE gym_db;

-- 0. Clear Existing Data and Reset Auto-Increments
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Supplement_Sale;
TRUNCATE TABLE Supplement;
TRUNCATE TABLE Maintenance;
TRUNCATE TABLE Equipment;
TRUNCATE TABLE Member_Diet;
TRUNCATE TABLE Diet_Plan;
TRUNCATE TABLE Member_Workout;
DROP TABLE IF EXISTS Workout_Exercise;
TRUNCATE TABLE Exercise;
TRUNCATE TABLE Workout_Plan;
TRUNCATE TABLE Attendance;
TRUNCATE TABLE Payment;
TRUNCATE TABLE Subscription;
TRUNCATE TABLE Membership_Plan;
TRUNCATE TABLE Trainer;
TRUNCATE TABLE Member;
TRUNCATE TABLE Class_Schedule;
TRUNCATE TABLE Audit_Log;

-- Recreate Workout_Exercise (dropped above because it may not exist)
CREATE TABLE IF NOT EXISTS Workout_Exercise (
    workout_id INT,
    exercise_id INT,
    `sets` INT NOT NULL,
    `reps` INT NOT NULL,
    rest_time INT,
    PRIMARY KEY (workout_id, exercise_id),
    FOREIGN KEY (workout_id) REFERENCES Workout_Plan(workout_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(exercise_id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Member (20 Members)
INSERT INTO Member (name, gender, phone, email, date_of_birth, join_date, status) VALUES
('John Doe', 'Male', '1234567890', 'john@example.com', '1990-05-15', '2024-01-10', 'Active'),
('Jane Smith', 'Female', '0987654321', 'jane@example.com', '1995-08-22', '2024-02-15', 'Active'),
('Mike Johnson', 'Male', '1112223333', 'mike@example.com', '1988-11-30', '2024-03-20', 'Active'),
('Emily Davis', 'Female', '4445556666', 'emily@example.com', '1992-04-10', '2024-04-05', 'Active'),
('Chris Wilson', 'Male', '7778889999', 'chris@example.com', '1985-07-25', '2024-05-12', 'Active'),
('Sarah Brown', 'Female', '2223334444', 'sarah.b@example.com', '1998-02-14', '2025-01-05', 'Active'),
('David Miller', 'Male', '3334445555', 'david.m@example.com', '1980-09-20', '2025-02-10', 'Active'),
('Lisa Rodriguez', 'Female', '5556667777', 'lisa.r@example.com', '1993-11-05', '2025-12-01', 'Active'),
('Kevin Taylor', 'Male', '9998887777', 'kevin.t@example.com', '1987-03-12', '2025-12-15', 'Active'),
('Anna White', 'Female', '1113335555', 'anna.w@example.com', '1996-06-30', '2026-01-10', 'Active'),
('Robert Black', 'Male', '2224446666', 'robert.b@example.com', '1991-12-25', '2026-01-20', 'Active'),
('Jessica Green', 'Female', '3335557777', 'jessica.g@example.com', '1994-08-15', '2026-02-05', 'Active'),
('Matthew Hall', 'Male', '4446668888', 'matthew.h@example.com', '1983-10-10', '2026-02-15', 'Inactive'),
('Linda Adams', 'Female', '5557779999', 'linda.a@example.com', '1999-01-20', '2026-03-01', 'Active'),
('George King', 'Male', '6668880000', 'george.k@example.com', '1989-05-05', '2026-03-10', 'Active'),
('Michelle Scott', 'Female', '7779991111', 'michelle.s@example.com', '1997-03-18', '2026-03-15', 'Active'),
('Brian Baker', 'Male', '8880002222', 'brian.b@example.com', '1986-11-12', '2026-03-20', 'Active'),
('Karen Wright', 'Female', '9991113333', 'karen.w@example.com', '1992-07-08', '2026-03-25', 'Active'),
('Steven Lopez', 'Male', '0002224444', 'steven.l@example.com', '1984-04-30', '2026-04-01', 'Active'),
('Ashley Perez', 'Female', '1112223334', 'ashley.p@example.com', '1995-12-12', '2026-04-02', 'Active');

-- 2. Trainer
INSERT INTO Trainer (name, specialization, phone, salary, hire_date) VALUES
('Tom Hanks', 'Weightlifting', '5551112222', 35000.00, '2022-01-15'),
('Emma Stone', 'Yoga', '5553334444', 30000.00, '2022-03-10'),
('Dwayne Johnson', 'Bodybuilding', '5555556666', 45000.00, '2021-11-01'),
('Scarlett Johansson', 'Cardio', '5557778888', 35000.00, '2022-05-20'),
('Chris Hemsworth', 'Crossfit', '5559990000', 40000.00, '2022-08-15');

-- 3. Membership_Plan
INSERT INTO Membership_Plan (plan_name, duration_months, price, description) VALUES
('Monthly Basic', 1, 1000.00, 'Access to basic equipment'),
('Quarterly Pro', 3, 2500.00, 'Access to all equipment and classes'),
('Half-Yearly Elite', 6, 5000.00, 'All access + personal trainer'),
('Annual Super', 12, 9000.00, 'All access + personal trainer + diet'),
('Weekend Warrior', 1, 800.00, 'Weekend access only');

-- 4. Subscription (Mixed dates to create analytics history)
INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status) VALUES
(1, 4, '2025-01-10', '2026-01-10', 'Expired'),
(1, 4, '2026-01-10', '2027-01-10', 'Active'),
(2, 3, '2025-08-15', '2026-02-15', 'Expired'),
(2, 2, '2026-02-15', '2026-05-15', 'Active'),
(3, 1, '2026-03-20', '2026-04-20', 'Active'),
(4, 4, '2025-04-05', '2026-04-05', 'Active'),
(5, 3, '2025-11-12', '2026-05-12', 'Active'),
(6, 2, '2026-01-05', '2026-04-05', 'Active'),
(7, 3, '2026-02-10', '2026-08-10', 'Active'),
(8, 2, '2025-12-01', '2026-03-01', 'Expired'),
(9, 1, '2025-12-15', '2026-01-15', 'Expired'),
(10, 3, '2026-01-10', '2026-07-10', 'Active'),
(11, 4, '2026-01-20', '2027-01-20', 'Active'),
(12, 1, '2026-02-05', '2026-03-05', 'Expired'),
(13, 2, '2026-02-15', '2026-05-15', 'Cancelled'),
(14, 3, '2026-03-01', '2026-09-01', 'Active'),
(15, 1, '2026-03-10', '2026-04-10', 'Active'),
(16, 2, '2026-03-15', '2026-06-15', 'Active'),
(17, 3, '2026-03-20', '2026-09-20', 'Active'),
(18, 1, '2026-03-25', '2026-04-25', 'Active'),
(19, 4, '2026-01-15', '2027-01-15', 'Active'),
(20, 2, '2026-02-20', '2026-05-20', 'Active');

-- 5. Payment (Revenue across Nov 2025 — Apr 2026, with varied statuses)
INSERT INTO Payment (subscription_id, amount, payment_date, payment_method, status) VALUES
-- Nov 2025
(7, 5000.00, '2025-11-12', 'UPI', 'Paid'),
-- Jan 2026
(1, 9000.00, '2025-01-10', 'Card', 'Paid'),
(2, 9000.00, '2026-01-10', 'Card', 'Paid'),
(10, 5000.00, '2026-01-10', 'Bank Transfer', 'Paid'),
(11, 9000.00, '2026-01-20', 'Card', 'Paid'),
(8, 2500.00, '2026-01-05', 'Cash', 'Paid'),
(19, 9000.00, '2026-01-15', 'Card', 'Paid'),
(6, 5000.00, '2026-01-05', 'Bank Transfer', 'Paid'),
-- Feb 2026
(4, 2500.00, '2026-02-15', 'UPI', 'Paid'),
(9, 5000.00, '2026-02-10', 'Card', 'Paid'),
(20, 2500.00, '2026-02-20', 'UPI', 'Paid'),
(2, 9000.00, '2026-02-15', 'Card', 'Pending'),
(12, 1000.00, '2026-02-05', 'Card', 'Paid'),
(13, 2500.00, '2026-02-15', 'UPI', 'Refunded'),
-- Mar 2026
(5, 1000.00, '2026-03-20', 'Cash', 'Paid'),
(14, 5000.00, '2026-03-01', 'UPI', 'Paid'),
(15, 1000.00, '2026-03-10', 'Card', 'Paid'),
(16, 2500.00, '2026-03-15', 'Bank Transfer', 'Paid'),
(17, 5000.00, '2026-03-20', 'UPI', 'Paid'),
(18, 1000.00, '2026-03-25', 'Cash', 'Paid'),
(3, 1000.00, '2026-03-20', 'Cash', 'Failed'),
-- Apr 2026 (current month — ensures "this month revenue" is populated)
(2, 9000.00, '2026-04-01', 'Card', 'Paid'),
(5, 1000.00, '2026-04-01', 'Cash', 'Paid'),
(14, 5000.00, '2026-04-02', 'UPI', 'Paid'),
(17, 5000.00, '2026-04-02', 'Bank Transfer', 'Paid'),
(19, 9000.00, '2026-04-03', 'Card', 'Pending'),
(11, 9000.00, '2026-04-03', 'UPI', 'Paid');

-- 6. Attendance (March and April — with CURDATE() for today)
INSERT INTO Attendance (member_id, check_in_time, check_out_time, date) VALUES
-- March 2026
(1, '2026-03-01 08:00:00', '2026-03-01 09:30:00', '2026-03-01'),
(1, '2026-03-03 08:15:00', '2026-03-03 10:00:00', '2026-03-03'),
(1, '2026-03-05 07:50:00', '2026-03-05 09:15:00', '2026-03-05'),
(1, '2026-03-07 08:05:00', '2026-03-07 09:45:00', '2026-03-07'),
(2, '2026-03-01 18:00:00', '2026-03-01 19:00:00', '2026-03-01'),
(2, '2026-03-02 18:10:00', '2026-03-02 19:15:00', '2026-03-02'),
(2, '2026-03-04 18:05:00', '2026-03-04 19:30:00', '2026-03-04'),
(4, '2026-03-10 17:00:00', '2026-03-10 18:30:00', '2026-03-10'),
(4, '2026-03-12 17:15:00', '2026-03-12 18:45:00', '2026-03-12'),
(4, '2026-03-14 17:00:00', '2026-03-14 18:30:00', '2026-03-14'),
(5, '2026-03-10 07:30:00', '2026-03-10 09:00:00', '2026-03-10'),
(5, '2026-03-15 07:30:00', '2026-03-15 09:00:00', '2026-03-15'),
(6, '2026-03-15 07:00:00', '2026-03-15 08:30:00', '2026-03-15'),
(6, '2026-03-17 07:15:00', '2026-03-17 08:45:00', '2026-03-17'),
(6, '2026-03-19 07:00:00', '2026-03-19 08:30:00', '2026-03-19'),
(7, '2026-03-20 10:00:00', '2026-03-20 11:30:00', '2026-03-20'),
(10, '2026-03-20 19:00:00', '2026-03-20 20:30:00', '2026-03-20'),
(10, '2026-03-22 19:15:00', '2026-03-22 20:45:00', '2026-03-22'),
(11, '2026-03-22 08:00:00', '2026-03-22 09:30:00', '2026-03-22'),
(14, '2026-03-25 08:00:00', '2026-03-25 09:30:00', '2026-03-25'),
(15, '2026-03-26 10:00:00', '2026-03-26 11:30:00', '2026-03-26'),
(16, '2026-03-27 17:00:00', '2026-03-27 18:30:00', '2026-03-27'),
(17, '2026-03-28 07:30:00', '2026-03-28 09:00:00', '2026-03-28'),
(19, '2026-03-30 09:00:00', '2026-03-30 10:30:00', '2026-03-30'),
-- April 2026
(1, '2026-04-01 08:00:00', '2026-04-01 09:30:00', '2026-04-01'),
(2, '2026-04-01 18:00:00', '2026-04-01 19:30:00', '2026-04-01'),
(4, '2026-04-02 17:00:00', '2026-04-02 18:30:00', '2026-04-02'),
(5, '2026-04-02 07:30:00', '2026-04-02 09:00:00', '2026-04-02'),
(3, '2026-04-02 18:00:00', '2026-04-02 19:30:00', '2026-04-02'),
(6, '2026-04-02 07:00:00', '2026-04-02 08:30:00', '2026-04-02'),
(10, '2026-04-02 19:00:00', '2026-04-02 20:30:00', '2026-04-02'),
(11, '2026-04-02 08:15:00', '2026-04-02 09:45:00', '2026-04-02'),
(14, '2026-04-02 08:00:00', '2026-04-02 09:30:00', '2026-04-02'),
(15, '2026-04-02 10:00:00', '2026-04-02 11:30:00', '2026-04-02'),
(19, '2026-04-02 07:00:00', '2026-04-02 08:30:00', '2026-04-02'),
(20, '2026-04-02 18:30:00', '2026-04-02 20:00:00', '2026-04-02'),
-- Today's records (dynamic via CURDATE)
(1, CONCAT(CURDATE(), ' 07:30:00'), CONCAT(CURDATE(), ' 09:00:00'), CURDATE()),
(2, CONCAT(CURDATE(), ' 08:00:00'), CONCAT(CURDATE(), ' 09:15:00'), CURDATE()),
(3, CONCAT(CURDATE(), ' 09:00:00'), CONCAT(CURDATE(), ' 10:30:00'), CURDATE()),
(5, CONCAT(CURDATE(), ' 07:00:00'), CONCAT(CURDATE(), ' 08:30:00'), CURDATE()),
(6, CONCAT(CURDATE(), ' 07:30:00'), CONCAT(CURDATE(), ' 09:00:00'), CURDATE()),
(10, CONCAT(CURDATE(), ' 10:00:00'), NULL, CURDATE()),
(4, CONCAT(CURDATE(), ' 16:30:00'), NULL, CURDATE()),
(14, CONCAT(CURDATE(), ' 11:00:00'), NULL, CURDATE());

-- 7. Workout_Plan
INSERT INTO Workout_Plan (plan_name, goal, difficulty_level, duration_weeks) VALUES
('Weight Loss Starter', 'Weight Loss', 'Beginner', 4),
('Muscle Mass Builder', 'Muscle Gain', 'Advanced', 8),
('General Fitness', 'Fitness', 'Intermediate', 6),
('Strength Fundamentals', 'Strength', 'Beginner', 4),
('HIIT Burn', 'Weight Loss', 'Advanced', 4),
('Lean Body Blueprint', 'Fitness', 'Intermediate', 12),
('Powerlifting Prep', 'Strength', 'Advanced', 10),
('Core Stability', 'Fitness', 'Beginner', 6),
('Agility & Speed', 'Performance', 'Intermediate', 8),
('Hypertrophy Max', 'Muscle Gain', 'Advanced', 12);

-- 8. Exercise
INSERT INTO Exercise (exercise_name, muscle_group, equipment_required) VALUES
('Bench Press', 'Chest', 'Barbell, Bench'),
('Squats', 'Legs', 'Barbell, Squat Rack'),
('Deadlifts', 'Back', 'Barbell'),
('Pull-ups', 'Back', 'Pull-up Bar'),
('Push-ups', 'Chest', 'None'),
('Military Press', 'Shoulders', 'Barbell'),
('Dumbbell Rows', 'Back', 'Dumbbells'),
('Leg Press', 'Legs', 'Leg Press Machine'),
('Bicep Curls', 'Arms', 'Dumbbells'),
('Tricep Extensions', 'Arms', 'Cables'),
('Plank', 'Core', 'None'),
('Burpees', 'Full Body', 'None'),
('Box Jumps', 'Legs', 'Plyo Box'),
('Kettlebell Swings', 'Full Body', 'Kettlebell'),
('Lat Pulldowns', 'Back', 'Lat Pulldown Machine');

-- 9. Workout_Exercise (links exercises to workout plans)
INSERT INTO Workout_Exercise (workout_id, exercise_id, `sets`, `reps`, rest_time) VALUES
(1, 12, 3, 15, 30),
(1, 14, 3, 20, 30),
(1, 11, 3, 60, 30),
(2, 1, 4, 10, 90),
(2, 2, 4, 10, 90),
(2, 3, 4, 8, 120),
(3, 5, 3, 15, 45),
(3, 4, 3, 10, 60),
(3, 11, 3, 60, 30),
(4, 1, 3, 12, 60),
(4, 2, 3, 12, 60),
(5, 12, 4, 20, 20),
(5, 13, 4, 15, 20),
(5, 14, 4, 25, 20),
(6, 5, 3, 15, 45),
(6, 11, 3, 60, 30),
(7, 2, 5, 5, 180),
(7, 1, 5, 5, 180),
(7, 3, 5, 5, 180),
(8, 11, 4, 60, 30),
(8, 5, 3, 20, 30),
(9, 13, 4, 12, 45),
(9, 12, 4, 15, 30),
(10, 1, 4, 12, 90),
(10, 2, 4, 12, 90),
(10, 8, 4, 12, 90),
(10, 9, 3, 15, 60),
(10, 10, 3, 15, 60);

-- 10. Member_Workout
INSERT INTO Member_Workout (member_id, workout_id, trainer_id, start_date, end_date) VALUES
(1, 2, 3, '2026-01-15', '2026-03-15'),
(2, 1, 4, '2026-02-20', '2026-03-20'),
(4, 3, 2, '2026-04-10', '2026-05-22'),
(5, 5, 4, '2026-03-01', '2026-03-28'),
(6, 10, 3, '2026-01-10', '2026-04-10'),
(10, 8, 2, '2026-03-01', '2026-04-12'),
(11, 7, 5, '2026-02-01', '2026-04-01'),
(14, 6, 1, '2026-03-10', '2026-06-10');

-- 11. Diet_Plan
INSERT INTO Diet_Plan (plan_name, goal, calories_per_day) VALUES
('Fat Loss Basic', 'Weight Loss', 1800),
('Bulking Pro', 'Muscle Gain', 3200),
('Maintenance', 'Fitness', 2400),
('Keto Burn', 'Weight Loss', 1600),
('High Protein', 'Muscle Gain', 3000);

-- 12. Member_Diet
INSERT INTO Member_Diet (member_id, diet_id, trainer_id, start_date, end_date) VALUES
(1, 2, 3, '2026-01-15', '2026-03-15'),
(2, 1, 4, '2026-02-20', '2026-03-20'),
(4, 3, 2, '2026-04-10', '2026-05-22'),
(6, 5, 3, '2026-01-10', '2026-04-10'),
(10, 4, 2, '2026-03-01', '2026-04-12');

-- 13. Equipment
INSERT INTO Equipment (equipment_name, purchase_date, condition_status, location) VALUES
('Treadmill 1', '2024-01-10', 'Good', 'Cardio Zone'),
('Treadmill 2', '2024-01-10', 'Needs Repair', 'Cardio Zone'),
('Bench Press Station', '2024-02-15', 'Good', 'Weight Room'),
('Squat Rack', '2024-03-20', 'Good', 'Weight Room'),
('Dumbbell Set 5-50lbs', '2024-04-05', 'New', 'Free Weights'),
('Leg Press Machine', '2024-06-10', 'Good', 'Weight Room'),
('Spin Bike 1', '2025-01-15', 'Good', 'Cardio Zone'),
('Spin Bike 2', '2025-01-15', 'Out of Order', 'Cardio Zone'),
('Cable Crossover Machine', '2024-08-20', 'Good', 'Weight Room'),
('Rowing Machine', '2025-03-10', 'Good', 'Cardio Zone');

-- 14. Maintenance (overdue, due soon, and recent)
INSERT INTO Maintenance (equipment_id, maintenance_date, description, cost) VALUES
(2, '2025-05-10', 'Belt alignment and motor check', 150.00),
(1, '2025-06-15', 'Routine oiling and inspection', 50.00),
(4, '2025-01-20', 'Tightened bolts, replaced J-cups', 75.00),
(3, '2026-02-10', 'Re-upholstered bench pad', 100.00),
(2, '2025-10-05', 'Motor replacement needed', 300.00),
(7, '2026-03-15', 'Chain lubrication', 40.00),
(5, '2025-08-20', 'Inspected grips, replaced worn pads', 60.00),
(9, '2026-01-25', 'Cable tension adjustment', 120.00);

-- 15. Supplement
INSERT INTO Supplement (name, brand, price, stock_quantity) VALUES
('Whey Protein Isolate', 'Optimum Nutrition', 2500.00, 50),
('Creatine Monohydrate', 'MuscleTech', 1500.00, 100),
('Pre-Workout Explode', 'Cellucor', 2000.00, 40),
('BCAA Recovery', 'Scivation', 1800.00, 60),
('Multivitamin Core', 'GNC', 800.00, 80);

-- 16. Supplement_Sale
INSERT INTO Supplement_Sale (member_id, supplement_id, quantity, sale_date, total_amount) VALUES
(1, 1, 2, '2026-01-15', 5000.00),
(2, 3, 1, '2026-02-20', 2000.00),
(4, 2, 1, '2026-03-10', 1500.00),
(6, 1, 1, '2026-01-15', 2500.00),
(10, 4, 1, '2026-02-25', 1800.00),
(1, 5, 2, '2026-03-05', 1600.00),
(11, 2, 2, '2026-03-15', 3000.00),
(5, 1, 1, '2026-04-01', 2500.00),
(14, 3, 1, '2026-04-02', 2000.00);

-- 17. Class_Schedule (spread across the full week)
INSERT INTO Class_Schedule (class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, registered, color) VALUES
-- Today
('Morning Yoga', 'Emma Stone', CURDATE(), '07:00:00', 60, 20, 12, 'purple'),
('Heavy Weightlifting', 'Tom Hanks', CURDATE(), '10:00:00', 90, 15, 15, 'orange'),
('Cardio Blast', 'Scarlett Johansson', CURDATE(), '17:30:00', 45, 25, 20, 'blue'),
('Evening Crossfit', 'Chris Hemsworth', CURDATE(), '19:00:00', 60, 20, 15, 'lime'),
-- Tomorrow
('Power Yoga', 'Emma Stone', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', 60, 15, 5, 'purple'),
('Strength Circuit', 'Dwayne Johnson', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 75, 20, 8, 'orange'),
('Zumba Dance', 'Scarlett Johansson', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', 60, 30, 25, 'pink'),
-- Day +2
('HIIT Bootcamp', 'Chris Hemsworth', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '07:00:00', 45, 20, 14, 'lime'),
('Pilates Flow', 'Emma Stone', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:30:00', 60, 18, 10, 'purple'),
('Bodybuilding 101', 'Dwayne Johnson', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:00:00', 90, 15, 12, 'orange'),
-- Day +3
('Morning Stretch', 'Emma Stone', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '07:30:00', 30, 25, 6, 'purple'),
('Spin Class', 'Scarlett Johansson', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 45, 20, 18, 'blue'),
('Power Lifting', 'Tom Hanks', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '18:30:00', 90, 12, 12, 'orange'),
-- Day +4
('Cardio Kickboxing', 'Chris Hemsworth', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '08:00:00', 60, 22, 16, 'lime'),
('Yoga Relaxation', 'Emma Stone', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '17:00:00', 60, 20, 9, 'purple'),
-- Day +5
('Weekend Warrior HIIT', 'Dwayne Johnson', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00:00', 60, 25, 20, 'orange'),
('Family Fitness', 'Scarlett Johansson', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 45, 30, 12, 'pink'),
-- Day +6
('Sunday Yoga', 'Emma Stone', DATE_ADD(CURDATE(), INTERVAL 6 DAY), '08:00:00', 75, 20, 7, 'purple'),
('Open Gym Crossfit', 'Chris Hemsworth', DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 90, 15, 4, 'lime');
