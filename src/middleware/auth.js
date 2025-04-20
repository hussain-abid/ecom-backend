const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const AdminUser = require('../models/adminUserModel');
const Shop = require('../models/shopModel');

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await AdminUser.findOne({
            _id: decoded.id,
            status: 'active'
        });

        if (!admin) {
            throw new Error('Admin not found or inactive');
        }

        // For shop-specific routes, verify if admin has access to the shop
        if (req.params.shop_id) {
            const shop = await Shop.findOne({
                _id: req.params.shop_id,
                admin_id: admin._id
            });
            
            if (!shop) {
                throw new Error('Admin does not have access to this shop');
            }
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Please authenticate',
            error: error.message
        });
    }
};

// Middleware to verify session
const auth = async (req, res, next) => {
    try {
        const session_id = req.header('X-Session-ID');
        
        if (!session_id) {
            return res.status(401).json({
                success: false,
                message: 'No session ID provided'
            });
        }

        const session = await Session.findOne({
            session_id,
            status: 'active',
            expires_at: { $gt: new Date() }
        });

        if (!session) {
            throw new Error('Session expired or invalid');
        }

        if (session.user_id) {
            const user = await User.findOne({
                _id: session.user_id,
                status: 'active'
            });

            if (!user) {
                throw new Error('User not found or inactive');
            }

            req.user = user;
        }

        req.session = session;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Please authenticate',
            error: error.message
        });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }
        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Access denied',
            error: error.message
        });
    }
};

// Middleware to check if user is staff or admin
const isStaffOrAdmin = async (req, res, next) => {
    try {
        if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
            throw new Error('Access denied. Staff privileges required.');
        }
        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Access denied',
            error: error.message
        });
    }
};

module.exports = {
    auth,
    isAdmin,
    isStaffOrAdmin,
    verifyAdminToken
}; 