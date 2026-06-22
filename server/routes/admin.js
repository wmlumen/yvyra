const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación JWT + rol ADMIN
router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/stats/detailed', adminController.getDetailedStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/audit', adminController.getGlobalAudit);
router.get('/agents', adminController.getAgentExecutions);

module.exports = router;
