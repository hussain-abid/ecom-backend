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
        throw new Error(`Missing required ${type} address fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
        throw new Error(`Invalid email format in ${type} address`);
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(address.phone)) {
        throw new Error(`Invalid phone format in ${type} address`);
    }
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
        const session_id = req.session.session_id;
        const {
            addresses,
            payment_type_id
        } = req.body;

        // Validate required fields
        if (!addresses || !payment_type_id) {
            throw new Error('Addresses and payment type are required');
        }

        // Validate payment type
        const paymentType = await PaymentType.findOne({
            _id: payment_type_id,
            shop_id,
            is_active: true
        });

        if (!paymentType) {
            throw new Error('Invalid or inactive payment type');
        }

        // Validate billing address
        if (!addresses.billing) {
            throw new Error('Billing address is required');
        }
        validateAddress(addresses.billing, 'billing');

        // Validate shipping address
        if (!addresses.shipping) {
            throw new Error('Shipping address is required');
        }
        validateAddress(addresses.shipping, 'shipping');

        // Get the active cart with coupon
        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        }).populate('items.product_id', 'price variants');

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Calculate subtotal
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        // Calculate shipping and tax
        const shipping = calculateShipping(addresses.shipping, subtotal);
        const tax = calculateTax(addresses.billing, subtotal);

        // Calculate total with discount
        const total = subtotal - (cart.discount_amount || 0) + tax + shipping;

        try {
            // Create order
            const order = await Order.create({
                session_id,
                shop_id,
                subtotal,
                discount_amount: cart.discount_amount || 0,
                coupon_id: cart.coupon_id,
                tax,
                shipping,
                total,
                products: cart.items.map(item => ({
                    product_id: item.product_id._id,
                    quantity: item.quantity,
                    price: item.price,
                    selected_variants: item.selected_variants.map(variant => ({
                        name: variant.name,
                        value: variant.value,
                        price_adjustment: variant.price_adjustment
                    }))
                })),
                addresses: {
                    country: addresses.billing.country,
                    first_name: addresses.billing.first_name,
                    last_name: addresses.billing.last_name,
                    address: addresses.billing.address,
                    apartment: addresses.billing.address2,
                    city: addresses.billing.city,
                    postal_code: addresses.billing.postal_code,
                    phone: addresses.billing.phone
                },
                payment_type_id,
                status: 'pending'
            });

            // Update coupon usage if a coupon was applied
            if (cart.coupon_id) {
                await Coupon.updateOne(
                    { _id: cart.coupon_id },
                    { $inc: { used_count: 1 } }
                );
            }

            // Update cart status to converted
            await Cart.updateOne(
                { _id: cart._id },
                { 
                    status: 'converted',
                    items: [],
                    discount_amount: 0,
                    coupon_id: null
                }
            );

            // Update product quantities
            for (const item of cart.items) {
                const product = item.product_id;
                
                // For products with variants
                if (product.variants && product.variants.length > 0) {
                    for (const selectedVariant of item.selected_variants) {
                        const variant = product.variants.find(v => v.name === selectedVariant.name);
                        const option = variant.options.find(o => o.name === selectedVariant.value);
                        
                        if (!option || option.quantity < item.quantity) {
                            throw new Error(`Insufficient stock for ${product.name} - ${selectedVariant.name}: ${selectedVariant.value}`);
                        }
                        
                        option.quantity -= item.quantity;
                    }
                } else {
                    if (product.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}`);
                    }
                    product.quantity -= item.quantity;
                }
                
                await product.save();
            }

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: {
                    order
                }
            });
        } catch (error) {
            // If any error occurs, try to clean up
            if (order) {
                await Order.deleteOne({ _id: order._id });
            }
            throw error;
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error processing checkout',
            error: error.message
        });
    }
};

module.exports = {
    processCheckout
}; 