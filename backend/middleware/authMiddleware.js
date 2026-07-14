const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_development_key';

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.customerId = decoded.customerId;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

module.exports = {
    requireAuth,
    requireAdmin
};
