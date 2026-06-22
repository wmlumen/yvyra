const express = require('express');
const router = express.Router();
const miniSiteController = require('../controllers/miniSiteController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

// Ruta pública: Ver la miniweb renderizada (resuelve por subdominio)
router.get('/render', tenantResolver, miniSiteController.generateMiniSiteHTML);

// Rutas privadas: Configuración de la miniweb
router.get('/', authMiddleware, miniSiteController.getMiniSite);
router.put('/', authMiddleware, miniSiteController.updateMiniSite);
router.get('/download', authMiddleware, miniSiteController.downloadMiniSite);

module.exports = router;
