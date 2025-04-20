const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateUserRegistration } = require('../middleware/validate');
const {
    startGuestSession,
    signup,
    login,
    logout,
    getCurrentUser
} = require('../controllers/authController');

// Start guest session
router.post('/:shop_id/start-guest-session', startGuestSession);

// User signup
router.post('/:shop_id/signup', validateUserRegistration, signup);

// User login
router.post('/:shop_id/login', login);

// User logout
router.post('/:shop_id/logout', auth, logout);

// Get current user
router.get('/:shop_id/me', auth, getCurrentUser);

module.exports = router; 