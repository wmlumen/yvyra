const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Auditoría del propio workspace
router.get('/', authMiddleware, auditController.getAuditLogs);

// Auditoría global (solo admin)
router.get('/global', authMiddleware, adminMiddleware, auditController.getGlobalAuditLogs);

module.exports = router;
