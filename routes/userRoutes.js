const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/api/usuarios', requireAuth, userController.listUsers);
router.post('/api/usuarios', requireAuth, userController.createUser);
router.put('/api/usuarios/:id', requireAuth, userController.updateUser);
router.delete('/api/usuarios/:id', requireAuth, userController.deleteUser);

module.exports = router;
