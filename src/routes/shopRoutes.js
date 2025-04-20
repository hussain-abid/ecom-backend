const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth');
const {
    createShop,
    getShop,
    updateShop,
    deleteShop,
    getShopOrders,
    updateOrderStatus,
    getAdminShops
} = require('../controllers/shopController');
const { getStoreOrders } = require('../controllers/orderController');

// Get all shops for the logged-in admin
router.get('/all', verifyAdminToken, getAdminShops);

// Shop CRUD routes with admin authentication
router.post('/', verifyAdminToken, createShop);
router.get('/:shop_id', verifyAdminToken, getShop);
// router.put('/:shop_id', verifyAdminToken, updateShop);
router.delete('/:shop_id', verifyAdminToken, deleteShop);

// Order management routes with admin authentication
router.get('/:shop_id/orders', verifyAdminToken, getShopOrders);
// router.put('/:shop_id/orders/:order_id/status', verifyAdminToken, updateOrderStatus);
// router.get('/:shop_id/orders', getStoreOrders);

module.exports = router; 