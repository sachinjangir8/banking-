const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Banking API is running on PostgreSQL with Auth.' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const loanRoutes = require('./routes/loanRoutes');
const jointAccountRoutes = require('./routes/jointAccountRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', accountRoutes);
app.use('/api', transactionRoutes);
app.use('/api', beneficiaryRoutes);
app.use('/api', loanRoutes);
app.use('/api', jointAccountRoutes);
app.use('/api', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
