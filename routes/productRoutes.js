const express = require('express');
const productController = require('../controllers/productController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get(
    ['/produtos', '/api/produtos'], 
    requireAuth,
    productController.listProducts
);

router.get(
    ['/produtos/resumo', '/api/produtos/resumo'],
    requireAuth, 
    productController.getProductSummary
);

router.get(
    ['/produtos/:id', '/api/produtos/:id'],
    requireAuth, 
    productController.getProduct
);

router.post(
    ['/produtos', '/api/produtos'], 
    requireAuth, 
    productController.createProduct
);

router.put(
    ['/produtos/:id', '/api/produtos/:id'], 
    requireAuth, 
    productController.updateProduct
);

router.delete(
    ['/produtos/:id', '/api/produtos/:id'], 
    requireAuth, 
    productController.deleteProduct
);

router.post(
    ['/produtos/:id/saida', '/api/produtos/:id/saida'], 
    requireAuth, 
    productController.registerProductExit
);

module.exports = router;
