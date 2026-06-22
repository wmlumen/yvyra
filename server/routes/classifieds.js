const express = require('express');
const router = express.Router();
const classifiedController = require('../controllers/classifiedController');

// Ruta pública global: /api/classifieds/search
router.get('/search', classifiedController.searchClassifieds);

module.exports = router;
