# Advanced Database Features — Gym Management System

**Course:** CSS 2212 — Database Systems Lab
**Database:** MySQL 8.x
**SQL File:** `gym-backend/advanced_db_features.sql`

---

## Table of Contents

1. [DDL Improvements](#1-ddl-improvements)
2. [Views](#2-views)
3. [Stored Procedures](#3-stored-procedures)
4. [Functions](#4-functions)
5. [Triggers](#5-triggers)
6. [Integration Map](#6-integration-map)

---

## 1. DDL Improvements

### 1.1 Audit Log Table

A new table that captures every critical database change automatically via triggers.

```sql
CREATE TABLE Audit_Log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    table_name   VARCHAR(50)  NOT NULL,
    action_type  ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    record_id    INT          NOT NULL,
    old_values   JSON,
    new_values   JSON,
    changed_by   VARCHAR(100) DEFAULT 'SYSTEM',
    changed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

**Where it appears:** Reports page → Audit Log section at the bottom.

### 1.2 Payment Status Column

Adds a `status` column to the existing `Payment` table for tracking refunds and pending states.

```sql
ALTER TABLE Payment
    ADD COLUMN status ENUM('Paid','Pending','Refunded','Failed') DEFAULT 'Paid';
```

### 1.3 Performance Indexes

Five indexes on frequently queried columns to speed up dashboard queries.

| Index Name | Table | Column(s) |
|---|---|---|
| `idx_attendance_date` | Attendance | `date` |
| `idx_attendance_member` | Attendance | `member_id, date` |
| `idx_subscription_status` | Subscription | `status` |
| `idx_payment_date` | Payment | `payment_date` |
| `idx_class_schedule_date` | Class_Schedule | `scheduled_date` |

---

## 2. Views

### 2.1 `vw_member_dashboard`

**Purpose:** Shows every member with their active plan, remaining days, lifetime payment total, and visit count — all in a single query.

**Tables joined:** `Member`, `Subscription`, `Membership_Plan`, `Payment`, `Attendance`

```sql
SELECT * FROM vw_member_dashboard;
```

| Column | Source |
|---|---|
| `member_name`, `gender`, `phone`, `email`, `member_status` | Member |
| `plan_name`, `plan_price`, `subscription_start/end`, `days_remaining` | Subscription + Membership_Plan |
| `total_paid` | SUM(Payment.amount) |
| `total_visits` | COUNT(Attendance) |

**Where it appears:** Members page — the members table displays plan name, days remaining, total visits, and total paid columns.

---

### 2.2 `vw_monthly_revenue`

**Purpose:** Aggregates revenue by month, plan, and payment method for financial reporting.

```sql
SELECT * FROM vw_monthly_revenue ORDER BY payment_month DESC;
```

| Column | Description |
|---|---|
| `payment_month` | YYYY-MM format |
| `plan_name` | Which membership plan generated the revenue |
| `payment_method` | Cash / Card / UPI / Bank Transfer |
| `transaction_count` | Number of transactions |
| `total_revenue` | Sum of payments |
| `avg_transaction` | Average payment amount |

**Where it appears:** Reports page → Revenue chart uses this view as its data source.

---

### 2.3 `vw_daily_attendance`

**Purpose:** Shows today's gym traffic with session durations and live/completed status.

```sql
SELECT * FROM vw_daily_attendance WHERE date = CURDATE();
```

| Column | Description |
|---|---|
| `member_name`, `member_status` | Joined from Member table |
| `check_in_time`, `check_out_time` | Raw timestamps |
| `session_minutes` | Calculated via `TIMESTAMPDIFF(MINUTE, check_in, IFNULL(check_out, NOW()))` |
| `visit_status` | `'Inside Now'` if check_out is NULL, else `'Completed'` |

**Where it appears:** Used internally by the Attendance page's backend logic.

---

### 2.4 `vw_equipment_health`

**Purpose:** Joins equipment with its latest maintenance record and flags overdue items.

```sql
SELECT * FROM vw_equipment_health WHERE maintenance_flag = 'Overdue';
```

| Column | Description |
|---|---|
| `equipment_name`, `condition_status`, `location` | From Equipment table |
| `last_service_date`, `last_service_cost` | Latest entry from Maintenance table |
| `days_since_service` | `DATEDIFF(CURDATE(), last_service_date)` |
| `maintenance_flag` | `'Overdue'` (>180 days), `'Due Soon'` (>90 days), or `'OK'` |

**Where it appears:** Reports page → Equipment Health table with color-coded Overdue/Due Soon/OK badges.

---

## 3. Stored Procedures

### 3.1 `sp_register_member`

**Purpose:** Inserts a new member with server-side validation.

**Validations performed:**
1. Name must not be empty
2. Gender must be a valid ENUM value (`Male`, `Female`, `Other`)
3. Email must be unique (checked against existing records)

```sql
CALL sp_register_member(
    'Rahul Sharma', 'Male', '9876543210',
    'rahul@gym.com', '1998-03-15',
    @new_id, @msg
);
SELECT @new_id AS member_id, @msg AS result;
```

**Output examples:**
- Success: `member_id = 6`, `message = 'SUCCESS: Member "Rahul Sharma" registered with ID 6'`
- Duplicate email: `member_id = -1`, `message = 'ERROR: A member with this email already exists.'`
- Empty name: `member_id = -1`, `message = 'ERROR: Member name cannot be empty.'`

**Where it appears:** Members page → "Register Member" modal. Validation errors from the procedure are displayed in the form.

---

### 3.2 `sp_renew_subscription`

**Purpose:** Handles the complete subscription renewal flow in a single call.

**Steps performed:**
1. Validates member exists
2. Validates plan exists
3. Expires any currently active subscription for the member
4. Creates new subscription with calculated end date
5. Records payment
6. Reactivates member if inactive

```sql
CALL sp_renew_subscription(2, 3, 'UPI', @sub_id, @msg);
SELECT @sub_id AS subscription_id, @msg AS result;
```

**Where it appears:** Available via `/api/reports/renew-subscription` API endpoint.

---

### 3.3 `sp_gym_performance_report`

**Purpose:** Generates a comprehensive multi-section report for a given month/year. Returns 5 result sets in a single call.

```sql
CALL sp_gym_performance_report(1, 2023);
```

**Result sets returned:**

| # | Section | Data |
|---|---|---|
| 1 | Membership Summary | total_members, active, inactive, new_this_month |
| 2 | Revenue Summary | total_transactions, total_revenue, avg_transaction, grouped by payment_method |
| 3 | Attendance Summary | unique_visitors, total_check_ins, avg_session_minutes |
| 4 | Top 5 Active Members | member name + visit count, sorted by visits |
| 5 | Equipment Alerts | equipment needing repair or out of order |

**Where it appears:** Reports page → all stats cards, top members list, and equipment alerts are populated from this single procedure call.

---

## 4. Functions

### 4.1 `fn_member_age(member_id)`

**Returns:** `INT` — the member's current age calculated from `date_of_birth`.

```sql
SELECT fn_member_age(1) AS age;
-- Returns: 35

SELECT name, fn_member_age(member_id) AS age FROM Member;
```

Uses `TIMESTAMPDIFF(YEAR, dob, CURDATE())` for accuracy (accounts for whether birthday has occurred this year).

**Where it appears:** Members page → "Age" column showing each member's age with "yrs" suffix.

---

### 4.2 `fn_subscription_status_label(member_id)`

**Returns:** `VARCHAR(100)` — a human-readable subscription status string.

```sql
SELECT fn_subscription_status_label(1) AS status;
```

**Possible return values:**

| Condition | Output |
|---|---|
| No subscription exists | `'No Subscription'` |
| Expired 12 days ago | `'Expired 12 days ago'` |
| Expiring within 7 days | `'Expiring in 3 days — RENEW NOW'` |
| Active with time remaining | `'Active — 145 days remaining'` |
| Cancelled | `'Cancelled'` |

**Where it appears:** Members page → "Plan & Status" column. Color-coded: green for active, amber for expiring soon, red for expired.

---

### 4.3 `fn_total_revenue_by_member(member_id)`

**Returns:** `DECIMAL(10,2)` — the total amount this member has ever paid.

```sql
SELECT fn_total_revenue_by_member(1) AS lifetime_revenue;
-- Returns: 250.00
```

Joins `Payment` → `Subscription` to sum all payments linked to the member.

**Where it appears:** Members page → "Revenue" column with a green dollar icon showing lifetime revenue.

---

## 5. Triggers

### 5.1 `trg_attendance_validate_member` — BEFORE INSERT on Attendance

**Purpose:** Prevents check-in if the member is `Inactive`.

```sql
-- This will raise an error because member 3 has status = 'Inactive'
INSERT INTO Attendance (member_id, check_in_time, date) VALUES (3, NOW(), CURDATE());
-- Error: 'Cannot check in: Member is Inactive. Renew subscription first.'
```

**Where it appears:** Attendance page → if you try to check in an inactive member, the error message from this trigger is displayed in the feedback alert.

---

### 5.2 `trg_payment_audit_log` — AFTER INSERT on Payment

**Purpose:** Automatically logs every new payment to the `Audit_Log` table with a JSON snapshot.

```sql
-- When this runs:
INSERT INTO Payment (subscription_id, amount, payment_date, payment_method) VALUES (1, 250, CURDATE(), 'Card');

-- The trigger automatically creates:
-- Audit_Log entry with action_type='INSERT', table_name='Payment',
-- new_values = {"subscription_id": 1, "amount": 250, "payment_date": "2024-01-15", "payment_method": "Card"}
```

**Where it appears:** Reports page → Audit Log table shows all trigger-generated entries.

---

### 5.3 `trg_supplement_stock_update` — AFTER INSERT on Supplement_Sale

**Purpose:** Automatically decrements supplement stock when a sale is recorded. Blocks the sale if stock is insufficient.

```sql
-- If Whey Protein has stock_quantity = 50:
INSERT INTO Supplement_Sale (member_id, supplement_id, quantity, sale_date, total_amount)
VALUES (1, 1, 2, CURDATE(), 119.98);
-- stock_quantity is now 48

-- If you try to sell 100 units:
-- Error: 'Insufficient stock for this supplement.'
```

**Where it appears:** Supplements page — stock automatically adjusts when sales are recorded.

---

### 5.4 `trg_subscription_auto_expire` — BEFORE INSERT on Subscription

**Purpose:** When a new subscription is created for a member, any existing active subscription is automatically expired.

```sql
-- Member 1 has an active subscription ending 2024-01-10
-- When a new subscription is inserted:
INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status) VALUES (1, 2, CURDATE(), '2025-01-01', 'Active');
-- The old subscription's status is automatically set to 'Expired'
```

**Where it appears:** Works automatically whenever subscriptions are created via the `sp_renew_subscription` procedure or direct insert.

---

### 5.5 `trg_member_status_audit` — AFTER UPDATE on Member

**Purpose:** Logs member status changes (Active → Inactive or vice versa) to the `Audit_Log` with both old and new values.

```sql
-- When a member is deactivated:
UPDATE Member SET status = 'Inactive' WHERE member_id = 1;

-- Audit_Log entry created with:
-- old_values = {"status": "Active", "name": "John Doe"}
-- new_values = {"status": "Inactive", "name": "John Doe"}
```

**Where it appears:** Reports page → Audit Log table shows status change entries.

---

## 6. Integration Map

| DB Feature | Type | Frontend Page | Backend File |
|---|---|---|---|
| `vw_member_dashboard` | View | Members | `memberController.js → getAllMembers()` |
| `fn_member_age()` | Function | Members (Age column) | `memberController.js → getAllMembers()` |
| `fn_subscription_status_label()` | Function | Members (Status label) | `memberController.js → getAllMembers()` |
| `fn_total_revenue_by_member()` | Function | Members (Revenue column) | `memberController.js → getAllMembers()` |
| `sp_register_member` | Procedure | Members (Register modal) | `memberController.js → createMember()` |
| `sp_gym_performance_report` | Procedure | Reports (all stats) | `reportsController.js → getReports()` |
| `sp_renew_subscription` | Procedure | Reports API | `reportsController.js → renewSubscription()` |
| `vw_monthly_revenue` | View | Reports (Revenue chart) | `reportsController.js → getReports()` |
| `vw_equipment_health` | View | Reports (Health table) | `reportsController.js → getReports()` |
| `vw_daily_attendance` | View | Attendance (internal) | `attendanceController.js` |
| `Audit_Log` (all triggers) | Triggers | Reports (Audit Log table) | `reportsController.js → getReports()` |
| `trg_attendance_validate_member` | Trigger | Attendance (error msg) | Fires automatically on INSERT |
| `trg_payment_audit_log` | Trigger | Reports (Audit Log) | Fires automatically on INSERT |
| `trg_supplement_stock_update` | Trigger | Supplements | Fires automatically on INSERT |
| `trg_subscription_auto_expire` | Trigger | Subscriptions | Fires automatically on INSERT |
| `trg_member_status_audit` | Trigger | Reports (Audit Log) | Fires automatically on UPDATE |

### Graceful Fallback

Every backend endpoint tries the view/procedure/function first. If `advanced_db_features.sql` has not been run yet, it falls back to plain SQL queries. The application works in both states — the advanced features simply enrich the data when available.

### Setup

```bash
# 1. Run the advanced features SQL
mysql -u root -p gym_db < gym-backend/advanced_db_features.sql

# 2. Restart the backend server
cd gym-backend && node server.js
```
