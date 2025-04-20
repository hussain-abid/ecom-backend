const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const PaymentType = require('../models/paymentTypeModel');
const Coupon = require('../models/couponModel');
const mongoose = require('mongoose');

// Validate address fields
const validateAddress = (address, type) => {
    const requiredFields = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code'
    ];

    const missingFields = requiredFields.filter(field => !address[field]);
    if (missingFields.length > 0) {
        return {
            isValid: false,
            message: `Missing required address fields: ${missingFields.join(', ')}`
        };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
        return {
            isValid: false,
            message: `Invalid email format in ${type} address`
        };
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(address.phone)) {
        return {
            isValid: false,
            message: `Invalid phone format in ${type} address`
        };
    }

    return {
        isValid: true
    };
};

// Calculate shipping based on address and order total
const calculateShipping = (addresses, subtotal) => {
    // TODO: Implement actual shipping calculation logic
    // For now, using a simple flat rate based on country
    const shippingRates = {
        'United States': 9.99,
        'Canada': 14.99,
        'United Kingdom': 19.99,
        // Add more countries and rates as needed
    };

    return shippingRates[addresses.country] || 29.99; // Default rate
};

// Calculate tax based on address and order total
const calculateTax = (addresses, subtotal) => {
    // TODO: Implement actual tax calculation logic
    // For now, using a simple percentage based on country
    const taxRates = {
        'United States': 0.08, // 8%
        'Canada': 0.13, // 13%
        'United Kingdom': 0.20, // 20%
        // Add more countries and rates as needed
    };

    const taxRate = taxRates[addresses.country] || 0.10; // Default 10%
    return subtotal * taxRate;
};

// Process checkout
const processCheckout = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { billing_address, shipping_address, payment_type_id } = req.body;
        const session_id = req.session.session_id;

        // Validate both addresses
        if (!billing_address || !shipping_address) {
            return res.status(400).json({
                success: false,
                message: 'Both billing and shipping addresses are required'
            });
        }

        // Validate billing address
        const billingValidation = validateAddress(billing_address, 'billing');
        if (!billingValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: `Billing address validation failed: ${billingValidation.message}`
            });
        }

        // Validate shipping address
        const shippingValidation = validateAddress(shipping_address, 'shipping');
        if (!shippingValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: `Shipping address validation failed: ${shippingValidation.message}`
            });
        }

        // Get cart
        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        }).populate('items.product_id', 'price');

        if (!cart || cart.items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found or empty'
            });
        }

        // Get payment type details
        const paymentType = await PaymentType.findOne({
            _id: payment_type_id,
            shop_id,
            is_active: true
        });

        console.log("paymentType",paymentType);

        if (!paymentType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type'
            });
        }

        // Calculate subtotal
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        // Calculate shipping and tax based on shipping address
        const shipping = calculateShipping(shipping_address, subtotal);
        const tax = calculateTax(shipping_address, subtotal);

        // Create order
        const order = await Order.create({
            shop_id,
            user_id: cart.user_id,
            session_id,
            products: cart.items.map(item => ({
                product_id: item.product_id._id,
                quantity: item.quantity,
                price: item.price,
                selected_variants: item.selected_variants
            })),
            addresses: {
                billing: billing_address,
                shipping: shipping_address
            },
            payment: {
                _id: paymentType._id,
                name: paymentType.name,
                description: paymentType.description
            },
            subtotal,
            shipping,
            tax,
            total: subtotal + shipping + tax - (cart.discount_amount || 0),
            coupon_id: cart.coupon_id,
            discount_amount: cart.discount_amount || 0,
            status: 'pending'
        });

        // Clear cart
        await Cart.findByIdAndUpdate(cart._id, {
            $set: {
                items: [],
                subtotal: 0,
                shipping: 0,
                tax: 0,
                total: 0,
                coupon_id: null,
                discount_amount: 0
            }
        });

        // Update coupon usage if applied
        if (cart.coupon_id) {
            await Coupon.findByIdAndUpdate(cart.coupon_id, {
                $inc: { used_count: 1 }
            });
        }

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing checkout',
            error: error.message
        });
    }
};

module.exports = {
    processCheckout
}; 