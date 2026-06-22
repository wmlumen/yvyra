const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');
const { validateSchema, createBlockSchema, requireJson } = require('../middleware/validate');

// Ruta pública: Ver el árbol de un usuario (Resuelve con el Host)
router.get('/', tenantResolver, blockController.getPublicBlocks);

// Rutas privadas: El usuario edita su propio árbol (Usa el workspaceId del Token JWT)
router.get('/me', authMiddleware, blockController.getPrivateBlocks);
router.post('/', authMiddleware, requireJson, validateSchema(createBlockSchema), blockController.createBlock);
router.put('/:id', authMiddleware, requireJson, blockController.updateBlock);
router.delete('/:id', authMiddleware, blockController.deleteBlock);

// Reordenar bloques (requiere auth)
router.put('/reorder/all', authMiddleware, requireJson, blockController.reorderBlocks);

module.exports = router;
