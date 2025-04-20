const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { validateShopRegistration } = require('../middleware/validate');
const {
    createShop,
    getShop,
    updateShop,
    deleteShop
} = require('../controllers/shopController');

// Create a new shop
router.post('/create', validateShopRegistration, createShop);

// Get shop details
router.get('/:shop_id', auth, getShop);

// Update shop
router.patch('/:shop_id', auth, isAdmin, updateShop);

// Delete shop
router.delete('/:shop_id', auth, isAdmin, deleteShop);

module.exports = router; 