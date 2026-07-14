const pool = require('../db');

const getJointAccounts = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ja.joint_id, ja.account_id, ja.added_at, a.account_type, a.balance, c.email as user_email
            FROM joint_accounts ja
            JOIN accounts a ON ja.account_id = a.account_id
            JOIN customers c ON ja.customer_id = c.customer_id
            WHERE a.customer_id = $1
        `, [req.customerId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch joint accounts' });
    }
};

const addJointAccount = async (req, res) => {
    const { accountId, email } = req.body;
    if (!accountId || !email) return res.status(400).json({ error: 'Missing accountId or email' });
    
    try {
        // Verify account belongs to user
        const { rows: accRows } = await pool.query('SELECT account_id FROM accounts WHERE account_id = $1 AND customer_id = $2', [accountId, req.customerId]);
        if (accRows.length === 0) return res.status(403).json({ error: 'Account not found or not owned by you' });
        
        // Find user by email
        const { rows: userRows } = await pool.query('SELECT customer_id FROM customers WHERE email = $1', [email]);
        if (userRows.length === 0) return res.status(404).json({ error: 'User with that email not found' });
        
        const targetUserId = userRows[0].customer_id;
        if (targetUserId === req.customerId) return res.status(400).json({ error: 'Cannot add yourself to your own account' });

        await pool.query(
            'INSERT INTO joint_accounts (account_id, customer_id) VALUES ($1, $2)',
            [accountId, targetUserId]
        );
        res.status(201).json({ success: true, message: 'User added to joint account' });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'User is already on this account' });
        res.status(500).json({ error: 'Failed to add user to joint account' });
    }
};

const removeJointAccount = async (req, res) => {
    try {
        const jointId = req.params.id;
        // Verify the account belongs to the user
        const { rowCount } = await pool.query(`
            DELETE FROM joint_accounts 
            WHERE joint_id = $1 AND account_id IN (SELECT account_id FROM accounts WHERE customer_id = $2)
        `, [jointId, req.customerId]);
        
        if (rowCount === 0) return res.status(404).json({ error: 'Joint account not found or not authorized' });
        res.json({ success: true, message: 'Joint owner removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove joint owner' });
    }
};

module.exports = {
    getJointAccounts,
    addJointAccount,
    removeJointAccount
};
