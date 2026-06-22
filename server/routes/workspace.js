const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

// Ruta Pública (Visitantes en el árbol)
router.get('/public', tenantResolver, workspaceController.getPublicProfile);

// Rutas Privadas (Dueño en el Dashboard)
router.get('/me', authMiddleware, workspaceController.getPrivateProfile);
router.put('/me', authMiddleware, workspaceController.updateProfile);

module.exports = router;
