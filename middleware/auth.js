const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido (No autorizado)' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}

function requireMerchant(req, res, next) {
    if (req.userRole !== 'merchant') {
        return res.status(403).json({ error: 'Acceso denegado: Solo para comerciantes' });
    }
    next();
}

module.exports = { verifyToken, requireMerchant };