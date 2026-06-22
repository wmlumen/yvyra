/**
 * Rutas del Sistema de Agentes (/api/auto).
 */

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema, agentTaskSchema, requireJson } = require('../middleware/validate');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/auto — ejecutar tarea autónoma
router.post('/', requireJson, validateSchema(agentTaskSchema), agentController.run);

// GET /api/auto/history — historial de ejecuciones
router.get('/history', agentController.history);

// GET /api/auto/:id — detalle de una ejecución
router.get('/:id', agentController.detail);

module.exports = router;
