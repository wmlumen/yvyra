const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

// Ruta pública: Registrar evento (usa tenantResolver para saber a qué workspace pertenece)
router.post('/event', tenantResolver, analyticsController.recordEvent);

// Rutas privadas: Consultar analytics
router.get('/', authMiddleware, analyticsController.getAnalytics);
router.get('/csv', authMiddleware, analyticsController.exportAnalyticsCSV);

module.exports = router;
