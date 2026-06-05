const express = require('express');
const router = express.Router();
const consumerController = require('../controllers/consumerController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas o con autenticación opcional
router.post('/scan', consumerController.scanQR);
router.get('/business/:id', consumerController.getBusinessDetail);

// Reportar incidente (Usamos verifyToken opcional, o libre)
router.post('/business/:id/report', (req, res, next) => {
    // Si trae header de auth lo verifica, si no, lo deja pasar anónimo
    if (req.headers['authorization']) {
        return verifyToken(req, res, next);
    }
    next();
}, consumerController.reportIncident);

// Historial de reportes del usuario autenticado
router.get('/reports', verifyToken, consumerController.getMyReports);

module.exports = router;