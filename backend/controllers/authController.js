const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_development_key';

const register = async (req, res) => {
    const { firstName, lastName, email, phone, password, accountType = 'Current' } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            'INSERT INTO customers (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id',
            [firstName, lastName, email, phone, passwordHash]
        );
        
        // Auto-create the initial account for the new user
        const customerId = rows[0].customer_id;
        const finalAccountType = ['Current', 'Savings'].includes(accountType) ? accountType : 'Current';
        await pool.query(
            "INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES ($1, $2, 0.00, 'INR', 'Active')",
            [customerId, finalAccountType]
        );

        res.status(201).json({ message: 'User registered successfully', customerId });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Postgres unique violation
            return res.status(400).json({ error: 'Email or phone already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
        const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const customer = rows[0];
        const isMatch = await bcrypt.compare(password, customer.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ customerId: customer.customer_id, email: customer.email, isAdmin: customer.is_admin }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            token,
            user: {
                customerId: customer.customer_id,
                firstName: customer.first_name,
                lastName: customer.last_name,
                email: customer.email,
                isAdmin: customer.is_admin
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

module.exports = {
    register,
    login
};
