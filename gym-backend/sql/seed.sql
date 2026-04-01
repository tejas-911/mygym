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
TRUNCATE TABLE Workout_Exercise;
TRUNCATE TABLE Exercise;
TRUNCATE TABLE Workout_Plan;
TRUNCATE TABLE Attendance;
TRUNCATE TABLE Payment;
TRUNCATE TABLE Subscription;
TRUNCATE TABLE Membership_Plan;
TRUNCATE TABLE Trainer;
TRUNCATE TABLE Member;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Member
INSERT INTO Member (name, gender, phone, email, date_of_birth, join_date, status) VALUES
('John Doe', 'Male', '1234567890', 'john@example.com', '1990-05-15', '2023-01-10', 'Active'),
('Jane Smith', 'Female', '0987654321', 'jane@example.com', '1995-08-22', '2023-02-15', 'Active'),
('Mike Johnson', 'Male', '1112223333', 'mike@example.com', '1988-11-30', '2023-03-20', 'Inactive'),
('Emily Davis', 'Female', '4445556666', 'emily@example.com', '1992-04-10', '2023-04-05', 'Active'),
('Chris Wilson', 'Male', '7778889999', 'chris@example.com', '1985-07-25', '2023-05-12', 'Active');

-- 2. Trainer
INSERT INTO Trainer (name, specialization, phone, salary, hire_date) VALUES
('Tom Hanks', 'Weightlifting', '5551112222', 35000.00, '2022-01-15'),
('Emma Stone', 'Yoga', '5553334444', 30000.00, '2022-03-10'),
('Dwayne Johnson', 'Bodybuilding', '5555556666', 45000.00, '2021-11-01'),
('Scarlett Johansson', 'Cardio', '5557778888', 35000.00, '2022-05-20'),
('Chris Hemsworth', 'Crossfit', '5559990000', 40000.00, '2022-08-15');

-- 3. Membership_Plan
INSERT INTO Membership_Plan (plan_name, duration_months, price, description) VALUES
('Basic', 1, 1000.00, 'Access to basic equipment'),
('Pro', 6, 5000.00, 'Access to all equipment and classes'),
('Elite', 12, 9000.00, 'All access + personal trainer'),
('Student', 3, 2000.00, 'Discounted plan for students'),
('Weekend Warrior', 1, 800.00, 'Weekend access only');

-- 4. Subscription
INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status) VALUES
(1, 3, '2023-01-10', '2024-01-10', 'Active'),
(2, 2, '2023-02-15', '2023-08-15', 'Expired'),
(3, 1, '2023-03-20', '2023-04-20', 'Expired'),
(4, 3, '2023-04-05', '2024-04-05', 'Active'),
(5, 2, '2023-05-12', '2023-11-12', 'Active');

-- 5. Payment
INSERT INTO Payment (subscription_id, amount, payment_date, payment_method) VALUES
(1, 9000.00, '2023-01-10', 'Card'),
(2, 5000.00, '2023-02-15', 'UPI'),
(3, 1000.00, '2023-03-20', 'Cash'),
(4, 9000.00, '2023-04-05', 'Bank Transfer'),
(5, 5000.00, '2023-05-12', 'Card');

-- 6. Attendance
INSERT INTO Attendance (member_id, check_in_time, check_out_time, date) VALUES
(1, CONCAT(CURDATE(), ' 08:00:00'), CONCAT(CURDATE(), ' 09:30:00'), CURDATE()),
(2, CONCAT(CURDATE(), ' 09:00:00'), CONCAT(CURDATE(), ' 10:00:00'), CURDATE()),
(4, CONCAT(CURDATE(), ' 17:00:00'), CONCAT(CURDATE(), ' 18:30:00'), CURDATE()),
(5, CONCAT(CURDATE(), ' 07:30:00'), NULL, CURDATE()),
(1, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 19:30:00'), DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- 7. Workout_Plan
INSERT INTO Workout_Plan (plan_name, goal, difficulty_level, duration_weeks) VALUES
('Weight Loss Starter', 'Weight Loss', 'Beginner', 4),
('Muscle Mass Builder', 'Muscle Gain', 'Advanced', 8),
('General Fitness', 'Fitness', 'Intermediate', 6),
('Strength Fundamentals', 'Strength', 'Beginner', 4),
('HIIT Burn', 'Weight Loss', 'Advanced', 4);

-- 8. Exercise
INSERT INTO Exercise (exercise_name, muscle_group, equipment_required) VALUES
('Bench Press', 'Chest', 'Barbell, Bench'),
('Squats', 'Legs', 'Barbell, Squat Rack'),
('Deadlifts', 'Back', 'Barbell'),
('Pull-ups', 'Back', 'Pull-up Bar'),
('Push-ups', 'Chest', 'None');

-- 9. Workout_Exercise
INSERT INTO Workout_Exercise (workout_id, exercise_id, sets, reps, rest_time) VALUES
(2, 1, 4, 10, 90),
(2, 2, 4, 10, 90),
(2, 3, 4, 8, 120),
(4, 1, 3, 12, 60),
(4, 2, 3, 12, 60);

-- 10. Member_Workout
INSERT INTO Member_Workout (member_id, workout_id, trainer_id, start_date, end_date) VALUES
(1, 2, 3, '2023-01-15', '2023-03-15'),
(2, 1, 4, '2023-02-20', '2023-03-20'),
(4, 3, 2, '2023-04-10', '2023-05-22'),
(5, 2, 3, '2023-05-15', '2023-07-10'),
(1, 5, 5, '2023-04-01', '2023-04-29');

-- 11. Diet_Plan
INSERT INTO Diet_Plan (plan_name, goal, calories_per_day) VALUES
('Fat Loss Basic', 'Weight Loss', 1800),
('Bulking Pro', 'Muscle Gain', 3200),
('Maintenance', 'Fitness', 2400),
('Keto Burn', 'Weight Loss', 1600),
('High Protein', 'Muscle Gain', 3000);

-- 12. Member_Diet
INSERT INTO Member_Diet (member_id, diet_id, trainer_id, start_date, end_date) VALUES
(1, 2, 3, '2023-01-15', '2023-03-15'),
(2, 1, 4, '2023-02-20', '2023-03-20'),
(4, 3, 2, '2023-04-10', '2023-05-22'),
(5, 2, 3, '2023-05-15', '2023-07-10'),
(1, 4, 5, '2023-04-01', '2023-04-29');

-- 13. Equipment
INSERT INTO Equipment (equipment_name, purchase_date, condition_status, location) VALUES
('Treadmill 1', '2021-01-10', 'Good', 'Cardio Zone'),
('Treadmill 2', '2021-01-10', 'Needs Repair', 'Cardio Zone'),
('Bench Press Station', '2021-02-15', 'Good', 'Weight Room'),
('Squat Rack', '2021-03-20', 'Good', 'Weight Room'),
('Dumbbell Set 5-50lbs', '2021-04-05', 'New', 'Free Weights');

-- 14. Maintenance
INSERT INTO Maintenance (equipment_id, maintenance_date, description, cost) VALUES
(2, '2022-05-10', 'Belt alignment and motor check', 150.00),
(1, '2022-06-15', 'Routine oiling and inspection', 50.00),
(4, '2023-01-20', 'Tightened bolts, replaced J-cups', 75.00),
(3, '2023-02-10', 'Re-upholstered bench pad', 100.00),
(2, '2023-06-05', 'Motor replacement needed', 300.00);

-- 15. Supplement
INSERT INTO Supplement (name, brand, price, stock_quantity) VALUES
('Whey Protein Isolate', 'Optimum Nutrition', 2500.00, 50),
('Creatine Monohydrate', 'MuscleTech', 1500.00, 100),
('Pre-Workout Explode', 'Cellucor', 2000.00, 40),
('BCAA Recovery', 'Scivation', 1800.00, 60),
('Multivitamin Core', 'GNC', 800.00, 80);

-- 16. Supplement_Sale
INSERT INTO Supplement_Sale (member_id, supplement_id, quantity, sale_date, total_amount) VALUES
(1, 1, 2, '2023-01-15', 5000.00),
(2, 3, 1, '2023-02-20', 2000.00),
(4, 2, 1, '2023-04-10', 1500.00),
(5, 1, 1, '2023-05-15', 2500.00),
(1, 4, 2, '2023-06-01', 3600.00);

-- 17. Class_Schedule
CREATE TABLE IF NOT EXISTS Class_Schedule (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    trainer_name VARCHAR(100) DEFAULT 'Unassigned',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    capacity INT DEFAULT 20,
    registered INT DEFAULT 0,
    color VARCHAR(30) DEFAULT 'lime',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Class_Schedule (class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, registered, color) VALUES
('Morning Yoga', 'Emma Stone', CURDATE(), '07:00:00', 60, 20, 12, 'purple'),
('Heavy Weightlifting', 'Tom Hanks', CURDATE(), '10:00:00', 90, 15, 10, 'orange'),
('Cardio Blast', 'Scarlett Johansson', CURDATE(), '17:30:00', 45, 25, 20, 'blue'),
('Evening Crossfit', 'Chris Hemsworth', CURDATE(), '19:00:00', 60, 20, 15, 'lime');
