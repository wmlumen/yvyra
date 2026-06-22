const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema, authRegisterSchema, authLoginSchema, requireJson } = require('../middleware/validate');

router.post('/register', requireJson, validateSchema(authRegisterSchema), authController.register);
router.post('/login', requireJson, validateSchema(authLoginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
