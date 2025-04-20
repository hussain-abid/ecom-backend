const Shop = require('../models/shopModel');
const User = require('../models/userModel');
const { validateEmail, validatePhone } = require('../middleware/validate');
const Order = require('../models/orderModel');
const { verifyAdminToken } = require('../middleware/auth');
const AdminUser = require('../models/adminUserModel');

// Create a new shop
const createShop = async (req, res) => {
    try {
        const { name, description, address, contact_email, contact_phone } = req.body;

        // Validate required fields
        if (!name || !description || !address || !contact_email || !contact_phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create shop
        const shop = await Shop.create({
            name,
            description,
            address,
            contact_email,
            contact_phone,
            admin_id: req.admin._id
        });

        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            data: shop
        });
    } catch (error) {
        console.error('Create shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get shop details
const getShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({
            _id: req.params.shop_id,
            admin_id: req.admin._id,
            is_active: true
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found or you do not have access to this shop'
            });
        }

        res.json({
            success: true,
            data: shop
        });
    } catch (error) {
        console.error('Get shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update shop
const updateShop = async (req, res) => {
    try {
        const { name, description, address, contact_email, contact_phone } = req.body;

        const shop = await Shop.findOneAndUpdate(
            {
                _id: req.params.shop_id,
                admin_id: req.admin._id,
                is_active: true
            },
            {
                name,
                description,
                address,
                contact_email,
                contact_phone
            },
            { new: true, runValidators: true }
        );

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found or you do not have access to this shop'
            });
        }

        res.json({
            success: true,
            message: 'Shop updated successfully',
            data: shop
        });
    } catch (error) {
        console.error('Update shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Soft delete shop
const deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findOneAndUpdate(
            {
                _id: req.params.shop_id,
                admin_id: req.admin._id,
                is_active: true
            },
            {
                is_active: false
            },
            { new: true }
        );

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found or you do not have access to this shop'
            });
        }

        res.json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error('Delete shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all orders for a shop
const getShopOrders = async (req, res) => {
    try {
        // First verify if the shop belongs to the admin
        const shop = await Shop.findOne({
            _id: req.params.shop_id,
            admin_id: req.admin._id,
            is_active: true
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found or you do not have access to this shop'
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        const query = { shop_id: req.params.shop_id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('products.product_id')
            // .populate('user_id', 'email');

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        // First verify if the shop belongs to the admin
        const shop = await Shop.findOne({
            _id: req.params.shop_id,
            admin_id: req.admin._id,
            is_active: true
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found or you do not have access to this shop'
            });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.order_id, shop_id: req.params.shop_id },
            { status, updated_at: Date.now() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

// Get all shops for the logged-in admin
const getAdminShops = async (req, res) => {
    try {
        const shops = await Shop.find({
            admin_id: req.admin._id,
            is_active: true
        }).select('-__v');

        res.json({
            success: true,
            shops
        });
    } catch (error) {
        console.error('Get admin shops error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    deleteShop,
    getShopOrders,
    updateOrderStatus,
    getAdminShops
}; 