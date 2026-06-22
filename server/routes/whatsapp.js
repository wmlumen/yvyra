const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

// Generar URL de campaña (requiere auth o tenant)
router.post('/campaign', authMiddleware, whatsappController.generateCampaign);

// Registrar contacto desde WhatsApp (público)
router.post('/contact', tenantResolver, whatsappController.recordContact);

// Estadísticas de campañas (requiere auth)
router.get('/stats', authMiddleware, whatsappController.getCampaignStats);

module.exports = router;
