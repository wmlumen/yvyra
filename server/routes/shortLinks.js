const express = require('express');
const router = express.Router();
const shortLinkController = require('../controllers/shortLinkController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

// Ruta pública: Resolver un enlace corto por slug
router.get('/:slug', shortLinkController.resolveShortLink);

// Rutas privadas (requieren autenticación)
router.get('/', authMiddleware, shortLinkController.listShortLinks);
router.post('/', authMiddleware, shortLinkController.createShortLink);
router.put('/:id', authMiddleware, shortLinkController.updateShortLink);
router.delete('/:id', authMiddleware, shortLinkController.deleteShortLink);

module.exports = router;
