const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { verifyToken, requireMerchant } = require('../middleware/auth');

// Todas estas rutas requieren Token y rol comerciante
router.post('/business/register', verifyToken, requireMerchant, merchantController.registerBusiness);
router.get('/diagnostic/questions', verifyToken, requireMerchant, merchantController.getQuestions);
router.post('/diagnostic/submit', verifyToken, requireMerchant, merchantController.submitDiagnostic);
router.post('/merchant/incidents/:id/respond', verifyToken, requireMerchant, merchantController.respondIncident);

module.exports = router;