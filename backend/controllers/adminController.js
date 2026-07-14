const pool = require('../db');

const getStats = async (req, res) => {
    try {
        const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM customers WHERE is_admin = FALSE');
        const { rows: balanceSum } = await pool.query('SELECT SUM(balance) FROM accounts');
        const { rows: loanCount } = await pool.query("SELECT COUNT(*) FROM loans WHERE status = 'Pending'");
        const { rows: totalTransactions } = await pool.query('SELECT COUNT(*) FROM transactions');
        
        res.json({
            totalUsers: parseInt(userCount[0].count),
            totalBalances: parseFloat(balanceSum[0].sum || 0),
            pendingLoans: parseInt(loanCount[0].count),
            totalTransactions: parseInt(totalTransactions[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const getPendingLoans = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT l.*, c.first_name, c.last_name, c.email 
            FROM loans l
            JOIN customers c ON l.customer_id = c.customer_id
            WHERE l.status = 'Pending'
            ORDER BY l.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending loans' });
    }
};

const approveLoan = async (req, res) => {
    const loanId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Lock the loan row
        const { rows: loanRows } = await client.query("SELECT * FROM loans WHERE loan_id = $1 AND status = 'Pending' FOR UPDATE", [loanId]);
        if (loanRows.length === 0) throw new Error('Loan not found or already processed');
        const loan = loanRows[0];
        
        // Find user's current account (or savings) to deposit loan amount
        const { rows: accRows } = await client.query(
            "SELECT account_id FROM accounts WHERE customer_id = $1 AND account_type IN ('Current', 'Savings') AND status = 'Active' ORDER BY account_type ASC LIMIT 1 FOR UPDATE", 
            [loan.customer_id]
        );
        
        if (accRows.length === 0) throw new Error('Customer does not have an active account to receive funds');
        const accountId = accRows[0].account_id;
        
        // Update loan status
        await client.query("UPDATE loans SET status = 'Active' WHERE loan_id = $1", [loanId]);
        
        // Deposit funds
        await client.query("UPDATE accounts SET balance = balance + $1 WHERE account_id = $2", [loan.amount, accountId]);
        
        // Log transaction
        await client.query(
            "INSERT INTO transactions (to_account_id, transaction_type, amount, status, description) VALUES ($1, 'Deposit', $2, 'Completed', $3)",
            [accountId, loan.amount, `Loan Disbursement (ID: ${loanId})`]
        );
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Loan approved and funds disbursed' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message || 'Failed to approve loan' });
    } finally {
        client.release();
    }
};

const rejectLoan = async (req, res) => {
    try {
        const { rowCount } = await pool.query("UPDATE loans SET status = 'Closed' WHERE loan_id = $1 AND status = 'Pending'", [req.params.id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Loan not found or already processed' });
        res.json({ success: true, message: 'Loan rejected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject loan' });
    }
};

module.exports = {
    getStats,
    getPendingLoans,
    approveLoan,
    rejectLoan
};
