const express = require('express');
const userController = require('../controllers/usuarioController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/api/usuarios', requireAuth, userController.listUsers);

router.post('/api/usuarios', requireAuth, requireAdmin, userController.createUser);
router.put('/api/usuarios/:id', requireAuth, requireAdmin, userController.updateUser);
router.delete('/api/usuarios/:id', requireAuth, requireAdmin, userController.deleteUser);

module.exports = router;