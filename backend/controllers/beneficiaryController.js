const pool = require('../db');

const getBeneficiaries = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT b.*, a.account_type, a.status FROM beneficiaries b JOIN accounts a ON b.beneficiary_account_id = a.account_id WHERE b.customer_id = $1 ORDER BY b.created_at DESC',
            [req.customerId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch beneficiaries' });
    }
};

const addBeneficiary = async (req, res) => {
    const { beneficiaryAccountId, nickname } = req.body;
    if (!beneficiaryAccountId || !nickname) return res.status(400).json({ error: 'Missing details' });

    try {
        // Verify beneficiary account exists and is not owned by the current user
        const { rows: accountCheck } = await pool.query('SELECT customer_id FROM accounts WHERE account_id = $1', [beneficiaryAccountId]);
        if (accountCheck.length === 0) return res.status(404).json({ error: 'Beneficiary account not found' });
        if (accountCheck[0].customer_id === req.customerId) return res.status(400).json({ error: 'Cannot add your own account as a beneficiary' });

        const { rows } = await pool.query(
            'INSERT INTO beneficiaries (customer_id, beneficiary_account_id, nickname) VALUES ($1, $2, $3) RETURNING *',
            [req.customerId, beneficiaryAccountId, nickname]
        );
        res.status(201).json({ success: true, beneficiary: rows[0], message: 'Beneficiary added successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Beneficiary already added' });
        }
        res.status(500).json({ error: 'Failed to add beneficiary' });
    }
};

const removeBeneficiary = async (req, res) => {
    try {
        const { rowCount } = await pool.query('DELETE FROM beneficiaries WHERE beneficiary_id = $1 AND customer_id = $2', [req.params.id, req.customerId]);
        if (rowCount === 0) return res.status(404).json({ error: 'Beneficiary not found or unauthorized' });
        res.json({ success: true, message: 'Beneficiary removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove beneficiary' });
    }
};

module.exports = {
    getBeneficiaries,
    addBeneficiary,
    removeBeneficiary
};
