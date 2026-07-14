const pool = require('../db');

const getMe = async (req, res) => {
    try {
        const { rows: userRows } = await pool.query(
            'SELECT customer_id, first_name, last_name, email, phone, is_admin FROM customers WHERE customer_id = $1',
            [req.customerId]
        );
        
        if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const { rows: accountRows } = await pool.query(`
            SELECT a.*, false as is_joint, NULL as shared_by_email 
            FROM accounts a 
            WHERE a.customer_id = $1
            UNION
            SELECT a.*, true as is_joint, c.email as shared_by_email 
            FROM accounts a
            JOIN joint_accounts ja ON a.account_id = ja.account_id
            JOIN customers c ON a.customer_id = c.customer_id
            WHERE ja.customer_id = $1
        `, [req.customerId]);
        
        res.json({
            profile: userRows[0],
            accounts: accountRows
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

const getCustomers = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT c.customer_id, c.first_name, c.last_name, c.email, 
                   COUNT(a.account_id) as account_count,
                   COALESCE(SUM(a.balance), 0) as total_balance
            FROM customers c
            LEFT JOIN accounts a ON c.customer_id = a.customer_id
            GROUP BY c.customer_id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const getAccountById = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM accounts WHERE account_id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (rows[0].customer_id !== req.customerId) return res.status(403).json({ error: 'Forbidden' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account' });
    }
};

module.exports = { getMe, getCustomers, getAccountById };
