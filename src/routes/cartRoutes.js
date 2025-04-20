const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
} = require('../controllers/cartController');

// Apply coupon (more specific route first)
router.post('/:shop_id/cart/apply-coupon', auth, applyCoupon);

// Remove coupon
router.delete('/:shop_id/cart/remove-coupon', auth, removeCoupon);

// Get cart
router.get('/:shop_id/cart', auth, getCart);

// Add item to cart
router.post('/:shop_id/cart/:product_id', auth, addToCart);

// Update cart item
router.put('/:shop_id/cart/:product_id', auth, updateCartItem);

// Remove item from cart
router.delete('/:shop_id/cart/:product_id', auth, removeFromCart);

// Clear cart
router.delete('/:shop_id/cart', auth, clearCart);

module.exports = router; 