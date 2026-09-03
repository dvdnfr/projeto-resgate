const express = require('express');
const movementController = require('../controllers/movementController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get(['/movimentacoes', '/api/movimentacoes'], requireAuth, movementController.listMovements);
router.get(
  ['/movimentacoes/:produtoId', '/api/movimentacoes/:produtoId'],
  requireAuth,
  movementController.listProductMovements
);

module.exports = router;
