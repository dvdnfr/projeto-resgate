const express = require('express');
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/api/relatorios', requireAuth, reportController.getReports);

module.exports = router;
