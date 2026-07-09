const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_development_key';

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Banking API is running on PostgreSQL with Auth.' });
});

// Authentication Middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.customerId = decoded.customerId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// ------------------------------------------------------------------
// AUTHENTICATION ROUTES
// ------------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            'INSERT INTO customers (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id',
            [firstName, lastName, email, phone, passwordHash]
        );
        
        // Auto-create a default Checking account for the new user
        const customerId = rows[0].customer_id;
        await pool.query(
            "INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES ($1, 'Checking', 0.00, 'INR', 'Active')",
            [customerId]
        );

        res.status(201).json({ message: 'User registered successfully', customerId });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Postgres unique violation
            return res.status(400).json({ error: 'Email or phone already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
        const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const customer = rows[0];
        const isMatch = await bcrypt.compare(password, customer.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ customerId: customer.customer_id, email: customer.email }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            token,
            user: {
                customerId: customer.customer_id,
                firstName: customer.first_name,
                lastName: customer.last_name,
                email: customer.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ------------------------------------------------------------------
// USER & ACCOUNT ROUTES
// ------------------------------------------------------------------

// Get logged-in user's profile and accounts
app.get('/api/me', requireAuth, async (req, res) => {
    try {
        const { rows: userRows } = await pool.query(
            'SELECT customer_id, first_name, last_name, email, phone FROM customers WHERE customer_id = $1',
            [req.customerId]
        );
        
        if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const { rows: accountRows } = await pool.query(
            'SELECT * FROM accounts WHERE customer_id = $1',
            [req.customerId]
        );
        
        res.json({
            profile: userRows[0],
            accounts: accountRows
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Legacy route (only used for testing now)
app.get('/api/customers', async (req, res) => {
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
});

app.get('/api/accounts/:id', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM accounts WHERE account_id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (rows[0].customer_id !== req.customerId) return res.status(403).json({ error: 'Forbidden' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// ------------------------------------------------------------------
// TRANSACTION ROUTES (ACID COMPLIANT)
// ------------------------------------------------------------------

app.post('/api/deposit', requireAuth, async (req, res) => {
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
});

app.post('/api/withdraw', requireAuth, async (req, res) => {
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
});

app.post('/api/transfer', requireAuth, async (req, res) => {
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
});

app.get('/api/accounts/:id/statement', requireAuth, async (req, res) => {
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
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
