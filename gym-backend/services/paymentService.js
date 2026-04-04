const db = require('../db');

exports.getAllPayments = async () => {
  return db.query(`
    SELECT
      p.payment_id, p.member_id, m.member_name, p.plan_id, pl.plan_name,
      p.amount, p.payment_method, p.payment_date, p.status
    FROM Payment p
    LEFT JOIN Member m ON p.member_id = m.member_id
    LEFT JOIN Plan pl ON p.plan_id = pl.plan_id
    ORDER BY p.payment_date DESC
  `);
};

exports.getPaymentById = async (paymentId) => {
  const [rows] = await db.query('SELECT * FROM Payment WHERE payment_id = ?', [paymentId]);
  return rows[0];
};

exports.createPayment = async (data) => {
  const { member_id, plan_id, amount, payment_method, payment_date, status } = data;
  return db.query(
    'INSERT INTO Payment (member_id, plan_id, amount, payment_method, payment_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [member_id, plan_id, amount, payment_method, payment_date, status]
  );
};

exports.updatePaymentStatus = async (paymentId, status) => {
  return db.query('UPDATE Payment SET status = ? WHERE payment_id = ?', [status, paymentId]);
};

exports.getPaymentStats = async () => {
  return db.query(`
    SELECT
      COUNT(*) as total_payments,
      SUM(amount) as total_revenue,
      AVG(amount) as avg_payment,
      MAX(amount) as max_payment
    FROM Payment
    WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `);
};

exports.getMonthlyTrend = async () => {
  return db.query(`
    SELECT
      DATE_TRUNC(payment_date, MONTH) as payment_month,
      SUM(amount) as revenue
    FROM Payment
    GROUP BY DATE_TRUNC(payment_date, MONTH)
    ORDER BY payment_month DESC
  `);
};
