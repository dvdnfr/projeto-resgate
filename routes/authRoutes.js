const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/api/me', requireAuth, authController.me);
router.post('/logout', authController.logout);

module.exports = router;
