const Order = require('../models/orderModel');
const AdminUser = require('../models/adminUserModel');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await AdminUser.findOne({
            _id: decoded.id,
            shop_id: req.params.shop_id,
            is_active: true
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Get all orders for a store
const getStoreOrders = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { 
            page = 1, 
            limit = 10,
            status,
            start_date,
            end_date
        } = req.query;

        // Build filter object
        const filter = { shop_id };
        if (status) filter.status = status;
        if (start_date && end_date) {
            filter.created_at = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        // Get orders with pagination
        const orders = await Order.find(filter)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('products.product_id', 'name images')
            .populate('coupon_id', 'code discount_type discount_value');

        // Get total count for pagination
        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

module.exports = {
    verifyAdminToken,
    getStoreOrders
}; 