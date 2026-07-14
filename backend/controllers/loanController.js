const pool = require('../db');

const getLoans = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM loans WHERE customer_id = $1 ORDER BY created_at DESC', [req.customerId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
};

const applyLoan = async (req, res) => {
    const { loanType, amount, interestRate } = req.body;
    if (!loanType || !amount || !interestRate || amount <= 0) {
        return res.status(400).json({ error: 'Invalid loan details' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO loans (customer_id, loan_type, amount, interest_rate, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.customerId, loanType, amount, interestRate, 'Pending']
        );
        res.status(201).json({ success: true, loan: rows[0], message: 'Loan application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to apply for loan' });
    }
};

module.exports = {
    getLoans,
    applyLoan
};
