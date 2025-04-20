const express = require('express');
const router = express.Router();
const { processCheckout } = require('../controllers/checkoutController');
const { auth } = require('../middleware/auth');

// Process checkout
router.post('/:shop_id/checkout', auth, processCheckout);

module.exports = router; 