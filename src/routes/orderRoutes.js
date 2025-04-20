const express = require('express');
const router = express.Router();
const { verifyAdminToken, getStoreOrders } = require('../controllers/orderController');

// Get all orders for a store (admin only)
router.get('/:shop_id/orders', verifyAdminToken, getStoreOrders);

module.exports = router; 