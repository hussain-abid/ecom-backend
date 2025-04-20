const Shop = require('../models/shopModel');
const User = require('../models/userModel');
const { validateEmail, validatePhone } = require('../middleware/validate');

// Create a new shop
const createShop = async (req, res) => {
    try {
        const {
            name,
            description,
            owner_name,
            owner_email,
            owner_phone,
            address,
            city,
            state,
            country,
            zip_code,
            currency,
            timezone
        } = req.body;

        // Validate owner email and phone
        const validatedEmail = validateEmail(owner_email);
        if (owner_phone) {
            validatePhone(owner_phone);
        }

        // Check if shop with same owner email exists
        const existingShop = await Shop.findOne({ owner_email: validatedEmail });
        if (existingShop) {
            throw new Error('A shop with this owner email already exists');
        }

        // Create shop
        const shop = await Shop.create({
            name,
            description,
            owner_name,
            owner_email: validatedEmail,
            owner_phone,
            address,
            city,
            state,
            country,
            zip_code,
            currency,
            timezone
        });

        // Create admin user for the shop
        const adminUser = await User.create({
            name: owner_name,
            email: validatedEmail,
            password: req.body.password, // Password will be hashed by the User model
            phone: owner_phone,
            shop_id: shop._id,
            role: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            data: {
                shop,
                admin: {
                    id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating shop',
            error: error.message
        });
    }
};

// Get shop details
const getShop = async (req, res) => {
    try {
        const { shop_id } = req.params;

        const shop = await Shop.findOne({
            _id: shop_id,
            status: 'active'
        });

        if (!shop) {
            throw new Error('Shop not found or inactive');
        }

        res.status(200).json({
            success: true,
            message: 'Shop details retrieved successfully',
            data: {
                shop
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Error retrieving shop details',
            error: error.message
        });
    }
};

// Update shop
const updateShop = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const updates = req.body;

        // Validate owner email and phone if provided
        if (updates.owner_email) {
            updates.owner_email = validateEmail(updates.owner_email);
        }
        if (updates.owner_phone) {
            validatePhone(updates.owner_phone);
        }

        const shop = await Shop.findOneAndUpdate(
            { _id: shop_id, status: 'active' },
            { ...updates },
            { new: true, runValidators: true }
        );

        if (!shop) {
            throw new Error('Shop not found or inactive');
        }

        res.status(200).json({
            success: true,
            message: 'Shop updated successfully',
            data: {
                shop
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating shop',
            error: error.message
        });
    }
};

// Delete shop (soft delete)
const deleteShop = async (req, res) => {
    try {
        const { shop_id } = req.params;

        const shop = await Shop.findOneAndUpdate(
            { _id: shop_id, status: { $ne: 'suspended' } },
            { status: 'inactive' },
            { new: true }
        );

        if (!shop) {
            throw new Error('Shop not found or already suspended');
        }

        // Also deactivate all users of this shop
        await User.updateMany(
            { shop_id },
            { status: 'inactive' }
        );

        res.status(200).json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting shop',
            error: error.message
        });
    }
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    deleteShop
}; 