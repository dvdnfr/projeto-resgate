const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/api/dashboard', requireAuth, dashboardController.getDashboard);
router.get('/dashboard', requireAuth, dashboardController.getDashboard);

module.exports = router;
