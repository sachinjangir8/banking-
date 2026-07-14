const pool = require('../db');

const deposit = async (req, res) => {
    const { accountId, amount } = req.body;
    if (!accountId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid details' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Verify ownership and lock row
        const { rows: authRows } = await client.query('SELECT customer_id FROM accounts WHERE account_id = $1 FOR UPDATE', [accountId]);
        if (authRows.length === 0) throw new Error('Account not found');
        if (authRows[0].customer_id !== req.customerId) throw new Error('Forbidden');

        await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, accountId]);
        
        await client.query(
            'INSERT INTO transactions (to_account_id, transaction_type, amount, status, description) VALUES ($1, $2, $3, $4, $5)',
            [accountId, 'Deposit', amount, 'Completed', 'Cash Deposit']
        );

        await client.query('COMMIT');
        res.json({ success: true, message: `Successfully deposited ₹${amount}` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(error.message === 'Forbidden' ? 403 : 400).json({ error: error.message });
    } finally {
        client.release();
    }
};

const withdraw = async (req, res) => {
    const { accountId, amount } = req.body;
    if (!accountId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid details' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { rows: authRows } = await client.query('SELECT customer_id, balance FROM accounts WHERE account_id = $1 FOR UPDATE', [accountId]);
        if (authRows.length === 0) throw new Error('Account not found');
        if (authRows[0].customer_id !== req.customerId) throw new Error('Forbidden');
        if (parseFloat(authRows[0].balance) < amount) throw new Error('Insufficient funds');

        await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, accountId]);
        
        await client.query(
            'INSERT INTO transactions (from_account_id, transaction_type, amount, status, description) VALUES ($1, $2, $3, $4, $5)',
            [accountId, 'Withdrawal', amount, 'Completed', 'Cash Withdrawal']
        );

        await client.query('COMMIT');
        res.json({ success: true, message: `Successfully withdrew ₹${amount}` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(error.message === 'Forbidden' ? 403 : 400).json({ error: error.message });
    } finally {
        client.release();
    }
};

const transfer = async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid details' });
    if (fromAccountId === toAccountId) return res.status(400).json({ error: 'Same account' });

    const maxRetries = 3;
    const executeTransfer = async (retries) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const firstId = Math.min(fromAccountId, toAccountId);
            const secondId = Math.max(fromAccountId, toAccountId);

            await client.query('SELECT * FROM accounts WHERE account_id = $1 FOR UPDATE', [firstId]);
            await client.query('SELECT * FROM accounts WHERE account_id = $1 FOR UPDATE', [secondId]);

            const { rows: fromRows } = await client.query('SELECT customer_id, balance FROM accounts WHERE account_id = $1', [fromAccountId]);
            if (fromRows.length === 0) throw new Error('Source account not found');
            if (fromRows[0].customer_id !== req.customerId) throw new Error('Forbidden: You do not own the source account');
            if (parseFloat(fromRows[0].balance) < amount) throw new Error('Insufficient funds');

            const { rows: toRows } = await client.query('SELECT account_id FROM accounts WHERE account_id = $1', [toAccountId]);
            if (toRows.length === 0) throw new Error('Destination account not found');

            await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, fromAccountId]);
            await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, toAccountId]);

            await client.query(
                'INSERT INTO transactions (from_account_id, to_account_id, transaction_type, amount, status, description) VALUES ($1, $2, $3, $4, $5, $6)',
                [fromAccountId, toAccountId, 'Transfer', amount, 'Completed', 'API Transfer']
            );

            await client.query('COMMIT');
            return { success: true, message: `Transferred ₹${amount}` };
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '40001' && retries > 0) {
                client.release();
                await new Promise(r => setTimeout(r, 50));
                return executeTransfer(retries - 1);
            }
            throw error;
        } finally {
            client.release();
        }
    };

    try {
        const result = await executeTransfer(maxRetries);
        res.json(result);
    } catch (error) {
        res.status(error.message.startsWith('Forbidden') ? 403 : 400).json({ error: error.message });
    }
};

const getStatement = async (req, res) => {
    const accountId = parseInt(req.params.id);
    const { from, to } = req.query;

    try {
        const { rows: authCheck } = await pool.query('SELECT customer_id FROM accounts WHERE account_id = $1', [accountId]);
        if (authCheck.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (authCheck[0].customer_id !== req.customerId) return res.status(403).json({ error: 'Forbidden' });

        let sql = `
            SELECT * FROM (
                SELECT 
                    transaction_id, transaction_date, transaction_type, 
                    CASE 
                        WHEN transaction_type = 'Deposit' THEN amount
                        WHEN transaction_type = 'Withdrawal' THEN -amount
                        WHEN from_account_id = $1 THEN -amount 
                        ELSE amount 
                    END as amount_change,
                    description,
                    SUM(
                        CASE 
                            WHEN transaction_type = 'Deposit' THEN amount
                            WHEN transaction_type = 'Withdrawal' THEN -amount
                            WHEN from_account_id = $2 THEN -amount 
                            ELSE amount 
                        END
                    ) OVER (ORDER BY transaction_date ASC ROWS UNBOUNDED PRECEDING) as running_balance
                FROM transactions 
                WHERE from_account_id = $3 OR to_account_id = $4
            ) AS base_statement
            WHERE 1=1
        `;
        
        const queryParams = [accountId, accountId, accountId, accountId];
        let paramIndex = 5;

        if (from) {
            sql += ` AND transaction_date >= $${paramIndex++}`;
            queryParams.push(from);
        }
        if (to) {
            sql += ` AND transaction_date <= $${paramIndex++}`;
            queryParams.push(to + ' 23:59:59');
        }
        sql += ' ORDER BY transaction_date DESC';

        const { rows } = await pool.query(sql, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

module.exports = {
    deposit,
    withdraw,
    transfer,
    getStatement
};
