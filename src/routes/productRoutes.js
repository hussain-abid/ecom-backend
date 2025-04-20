const express = require('express');
const router = express.Router();
const { auth, isStaffOrAdmin } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validate');
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} = require('../controllers/productController');

// Test route to verify middleware
router.get('/test', (req, res) => {
    console.log('Test route called');
    res.json({ message: 'Test route working' });
});

// Test route with auth middleware
router.get('/test-auth', auth, (req, res) => {
    console.log('Test auth route called');
    res.json({ message: 'Test auth route working', session: req.session });
});

// Create a new product
router.post('/:shop_id/products', auth, isStaffOrAdmin, validateProduct, createProduct);

// Get all products
router.get('/:shop_id/products', auth, getProducts);

// Search products
router.get('/:shop_id/products/search', auth, searchProducts);

// Get a single product
router.get('/:shop_id/products/:product_id', auth, getProduct);

// Update a product
router.patch('/:shop_id/products/:product_id', auth, isStaffOrAdmin, validateProduct, updateProduct);

// Delete a product
router.delete('/:shop_id/products/:product_id', auth, isStaffOrAdmin, deleteProduct);

module.exports = router; 