const express = require('express');
const router = express.Router();
const { auth, isStaffOrAdmin, verifyAdminToken } = require('../middleware/auth');
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


// Get all products
router.get('/:shop_id/', auth, getProducts);


// Get a single product
router.get('/:shop_id/products/:product_id', auth, getProduct);

// Update a product
router.patch('/:shop_id/products/:product_id', verifyAdminToken, validateProduct, updateProduct);

// Delete a product
router.delete('/:shop_id/products/:product_id', verifyAdminToken, deleteProduct);


// Create a new product
router.post('/:shop_id/products', verifyAdminToken, validateProduct, createProduct);



// Search products
router.get('/:shop_id/products/search', auth, searchProducts);

module.exports = router; 