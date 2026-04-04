const db = require('../db');

exports.getAllMembers = async () => {
  return db.query(`
    SELECT
      m.member_id, m.member_name, m.email, m.phone, m.join_date, m.status,
      YEAR(CURDATE()) - YEAR(m.date_of_birth) AS age,
      CASE
        WHEN s.status = 'Active' THEN 'Active'
        WHEN s.status = 'Expired' THEN 'Expired'
        ELSE 'Inactive'
      END AS subscription_status,
      COALESCE(SUM(p.amount), 0) AS lifetime_revenue,
      pl.plan_name,
      DATEDIFF(s.end_date, CURDATE()) AS days_remaining,
      COALESCE(COUNT(DISTINCT a.attendance_id), 0) AS total_visits
    FROM Member m
    LEFT JOIN Subscription s ON m.member_id = s.member_id
    LEFT JOIN Plan pl ON s.plan_id = pl.plan_id
    LEFT JOIN Payment p ON m.member_id = p.member_id
    LEFT JOIN Attendance a ON m.member_id = a.member_id
    GROUP BY m.member_id
    ORDER BY m.join_date DESC
  `);
};

exports.getMemberById = async (memberId) => {
  const [rows] = await db.query('SELECT * FROM Member WHERE member_id = ?', [memberId]);
  return rows[0];
};

exports.createMember = async (data) => {
  const { member_name, email, phone, date_of_birth, join_date, status } = data;
  return db.query(
    'INSERT INTO Member (member_name, email, phone, date_of_birth, join_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [member_name, email, phone, date_of_birth, join_date, status]
  );
};

exports.updateMember = async (memberId, data) => {
  const { member_name, email, phone, status } = data;
  return db.query(
    'UPDATE Member SET member_name = ?, email = ?, phone = ?, status = ? WHERE member_id = ?',
    [member_name, email, phone, status, memberId]
  );
};

exports.deleteMember = async (memberId) => {
  return db.query('DELETE FROM Member WHERE member_id = ?', [memberId]);
};
