CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- 1. Member
CREATE TABLE IF NOT EXISTS Member (
    member_id    INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    gender       ENUM('Male', 'Female', 'Other'),
    phone        VARCHAR(15),
    email        VARCHAR(100) UNIQUE,
    date_of_birth DATE,
    join_date    DATE,
    status       ENUM('Active', 'Inactive') DEFAULT 'Active',
    CONSTRAINT chk_member_phone_length CHECK (phone IS NULL OR LENGTH(TRIM(phone)) >= 7)
);

-- 2. Trainer
CREATE TABLE IF NOT EXISTS Trainer (
    trainer_id     INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone          VARCHAR(15),
    salary         DECIMAL(10,2),
    hire_date      DATE,
    CONSTRAINT chk_trainer_salary_positive CHECK (salary IS NULL OR salary > 0)
);

-- 3. Membership_Plan
CREATE TABLE IF NOT EXISTS Membership_Plan (
    plan_id         INT AUTO_INCREMENT PRIMARY KEY,
    plan_name       VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    description     TEXT,
    CONSTRAINT chk_plan_price_positive    CHECK (price > 0),
    CONSTRAINT chk_plan_duration_positive CHECK (duration_months >= 1)
);

-- 4. Subscription
CREATE TABLE IF NOT EXISTS Subscription (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id       INT,
    plan_id         INT,
    start_date      DATE,
    end_date        DATE,
    status          ENUM('Active', 'Expired', 'Cancelled') DEFAULT 'Active',
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id)   REFERENCES Membership_Plan(plan_id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_dates_valid CHECK (end_date > start_date)
);

-- 5. Payment
CREATE TABLE IF NOT EXISTS Payment (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT,
    amount          DECIMAL(10,2) NOT NULL,
    payment_date    DATE NOT NULL,
    payment_method  ENUM('Cash', 'Card', 'UPI', 'Bank Transfer') NOT NULL,
    status          ENUM('Paid', 'Pending', 'Refunded', 'Failed') DEFAULT 'Paid',
    FOREIGN KEY (subscription_id) REFERENCES Subscription(subscription_id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

-- 6. Attendance
CREATE TABLE IF NOT EXISTS Attendance (
    attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
    member_id       INT,
    check_in_time   DATETIME NOT NULL,
    check_out_time  DATETIME,
    date            DATE NOT NULL,
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
    CONSTRAINT chk_attendance_checkout_after_checkin CHECK (check_out_time IS NULL OR check_out_time > check_in_time),
    CONSTRAINT chk_attendance_max_session            CHECK (check_out_time IS NULL OR TIMESTAMPDIFF(HOUR, check_in_time, check_out_time) <= 24)
);

-- 7. Workout_Plan
CREATE TABLE IF NOT EXISTS Workout_Plan (
    workout_id       INT AUTO_INCREMENT PRIMARY KEY,
    plan_name        VARCHAR(100) NOT NULL,
    goal             VARCHAR(100),
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced'),
    duration_weeks   INT,
    CONSTRAINT chk_workout_duration_positive CHECK (duration_weeks IS NULL OR duration_weeks >= 1)
);

-- 8. Exercise
CREATE TABLE IF NOT EXISTS Exercise (
    exercise_id        INT AUTO_INCREMENT PRIMARY KEY,
    exercise_name      VARCHAR(100) NOT NULL,
    muscle_group       VARCHAR(100),
    equipment_required VARCHAR(100)
);

-- 9. Workout_Exercise
CREATE TABLE IF NOT EXISTS Workout_Exercise (
    workout_id  INT,
    exercise_id INT,
    `sets`      INT NOT NULL,
    `reps`      INT NOT NULL,
    rest_time   INT,
    PRIMARY KEY (workout_id, exercise_id),
    FOREIGN KEY (workout_id)  REFERENCES Workout_Plan(workout_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(exercise_id)    ON DELETE CASCADE,
    CONSTRAINT chk_we_sets_positive CHECK (`sets` >= 1),
    CONSTRAINT chk_we_reps_positive CHECK (`reps` >= 1),
    CONSTRAINT chk_we_rest_nonneg   CHECK (rest_time IS NULL OR rest_time >= 0)
);

-- 10. Member_Workout
CREATE TABLE IF NOT EXISTS Member_Workout (
    member_id  INT,
    workout_id INT,
    trainer_id INT,
    start_date DATE,
    end_date   DATE,
    PRIMARY KEY (member_id, workout_id),
    FOREIGN KEY (member_id)  REFERENCES Member(member_id)        ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES Workout_Plan(workout_id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES Trainer(trainer_id)      ON DELETE SET NULL
);

-- 11. Diet_Plan
CREATE TABLE IF NOT EXISTS Diet_Plan (
    diet_id          INT AUTO_INCREMENT PRIMARY KEY,
    plan_name        VARCHAR(100) NOT NULL,
    goal             VARCHAR(100),
    calories_per_day INT NOT NULL,
    CONSTRAINT chk_diet_calories_range CHECK (calories_per_day BETWEEN 500 AND 10000)
);

-- 12. Member_Diet
CREATE TABLE IF NOT EXISTS Member_Diet (
    member_id  INT,
    diet_id    INT,
    trainer_id INT,
    start_date DATE,
    end_date   DATE,
    PRIMARY KEY (member_id, diet_id),
    FOREIGN KEY (member_id)  REFERENCES Member(member_id)   ON DELETE CASCADE,
    FOREIGN KEY (diet_id)    REFERENCES Diet_Plan(diet_id)  ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES Trainer(trainer_id) ON DELETE SET NULL
);

-- 13. Equipment
CREATE TABLE IF NOT EXISTS Equipment (
    equipment_id     INT AUTO_INCREMENT PRIMARY KEY,
    equipment_name   VARCHAR(100) NOT NULL,
    purchase_date    DATE,
    condition_status ENUM('New', 'Good', 'Needs Repair', 'Out of Order') DEFAULT 'Good',
    location         VARCHAR(100)
);

-- 14. Maintenance
CREATE TABLE IF NOT EXISTS Maintenance (
    maintenance_id   INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id     INT,
    maintenance_date DATE NOT NULL,
    description      TEXT,
    cost             DECIMAL(10,2),
    FOREIGN KEY (equipment_id) REFERENCES Equipment(equipment_id) ON DELETE CASCADE,
    CONSTRAINT chk_maintenance_cost_nonneg CHECK (cost IS NULL OR cost >= 0)
);

-- 15. Supplement
CREATE TABLE IF NOT EXISTS Supplement (
    supplement_id  INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    brand          VARCHAR(100),
    price          DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    CONSTRAINT chk_supplement_price_positive CHECK (price > 0),
    CONSTRAINT chk_supplement_stock_nonneg   CHECK (stock_quantity >= 0)
);

-- 16. Supplement_Sale
CREATE TABLE IF NOT EXISTS Supplement_Sale (
    sale_id       INT AUTO_INCREMENT PRIMARY KEY,
    member_id     INT,
    supplement_id INT,
    quantity      INT NOT NULL,
    sale_date     DATE NOT NULL,
    total_amount  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (member_id)     REFERENCES Member(member_id)         ON DELETE CASCADE,
    FOREIGN KEY (supplement_id) REFERENCES Supplement(supplement_id) ON DELETE CASCADE,
    CONSTRAINT chk_sale_quantity_positive CHECK (quantity >= 1),
    CONSTRAINT chk_sale_amount_positive   CHECK (total_amount > 0)
);

-- 17. Class_Schedule
CREATE TABLE IF NOT EXISTS Class_Schedule (
    class_id         INT AUTO_INCREMENT PRIMARY KEY,
    class_name       VARCHAR(100) NOT NULL,
    trainer_name     VARCHAR(100) DEFAULT 'Unassigned',
    scheduled_date   DATE NOT NULL,
    scheduled_time   TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    capacity         INT DEFAULT 20,
    registered       INT DEFAULT 0,
    color            VARCHAR(30) DEFAULT 'lime',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_class_capacity_positive       CHECK (capacity >= 1),
    CONSTRAINT chk_class_duration_min            CHECK (duration_minutes >= 15),
    CONSTRAINT chk_class_registered_lte_capacity CHECK (registered <= capacity),
    CONSTRAINT chk_class_registered_nonneg       CHECK (registered >= 0)
);
