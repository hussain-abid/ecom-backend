const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');

// Get cart with all details
const getCart = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const session_id = req.session.session_id;

        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        }).populate({
            path: 'items.product_id',
            select: 'name description price variants images'
        });

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    subtotal: 0,
                    discount_amount: 0,
                    tax: 0,
                    shipping: 0,
                    total: 0
                }
            });
        }

        // Calculate subtotal based on item prices and quantities
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        // Calculate tax and shipping (these would be calculated based on address if available)
        const tax = 0; // Will be calculated during checkout
        const shipping = 0; // Will be calculated during checkout

        // Calculate total with discount
        const total = subtotal - (cart.discount_amount || 0) + tax + shipping;

        res.status(200).json({
            success: true,
            data: {
                items: cart.items,
                subtotal,
                discount_amount: cart.discount_amount || 0,
                tax,
                shipping,
                total,
                coupon_id: cart.coupon_id
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error getting cart',
            error: error.message
        });
    }
};

// Apply coupon to cart
const applyCoupon = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const session_id = req.session.session_id;
        const { code } = req.body;

        if (!code) {
            throw new Error('Coupon code is required');
        }

        // Get cart
        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        }).populate('items.product_id', 'price');

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Calculate subtotal
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        // Find and validate coupon
        const coupon = await Coupon.findOne({
            code,
            shop_id,
            is_active: true,
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() }
        });

        if (!coupon) {
            throw new Error('Invalid or expired coupon');
        }

        // Check minimum order amount
        if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
            throw new Error(`Minimum order amount of ${coupon.min_order_amount} required for this coupon`);
        }

        // Calculate discount
        let discount_amount = coupon.discount_type === 'percentage'
            ? (subtotal * coupon.discount_value / 100)
            : coupon.discount_value;

        // Check maximum discount amount
        if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
            discount_amount = coupon.max_discount_amount;
        }

        // Update cart with coupon
        cart.coupon_id = coupon._id;
        cart.discount_amount = discount_amount;
        await cart.save();

        // Calculate total with new discount
        const total = subtotal - discount_amount;

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            data: {
                discount_amount,
                total,
                coupon_id: coupon._id
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error applying coupon',
            error: error.message
        });
    }
};

// Remove coupon from cart
const removeCoupon = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const session_id = req.session.session_id;

        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Remove coupon
        cart.coupon_id = undefined;
        cart.discount_amount = 0;
        await cart.save();

        // Recalculate total
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        res.status(200).json({
            success: true,
            message: 'Coupon removed successfully',
            data: {
                discount_amount: 0,
                total: subtotal
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error removing coupon',
            error: error.message
        });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;
        const { quantity = 1, selected_variants = [] } = req.body;
        const session_id = req.session.session_id;

        // Validate product
        const product = await Product.findOne({
            _id: product_id,
            shop_id,
            status: 'active'
        });

        if (!product) {
            throw new Error('Product not found or unavailable');
        }

        // Validate variants if product has variants
        if (product.variants && product.variants.length > 0) {
            if (!selected_variants || selected_variants.length === 0) {
                throw new Error('Product variants must be selected');
            }

            // Check if all variants are selected
            if (selected_variants.length !== product.variants.length) {
                throw new Error('All product variants must be selected');
            }

            // Validate each selected variant
            for (const selectedVariant of selected_variants) {
                const variant = product.variants.find(v => v.name === selectedVariant.name);
                if (!variant) {
                    throw new Error(`Variant ${selectedVariant.name} not found`);
                }

                const option = variant.options.find(o => o.name === selectedVariant.value);
                if (!option) {
                    throw new Error(`Option ${selectedVariant.value} not found for variant ${selectedVariant.name}`);
                }

                if (option.quantity < quantity) {
                    throw new Error(`Insufficient stock for variant ${selectedVariant.name}: ${selectedVariant.value}`);
                }
            }
        } else if (product.quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        // Find or create cart
        let cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        });

        if (!cart) {
            cart = await Cart.create({
                shop_id,
                session_id,
                user_id: req.user?._id
            });
        }

        // Calculate final price including variant adjustments
        let finalPrice = product.price;
        const variantSelections = [];

        if (selected_variants && selected_variants.length > 0) {
            for (const selectedVariant of selected_variants) {
                const variant = product.variants.find(v => v.name === selectedVariant.name);
                const option = variant.options.find(o => o.name === selectedVariant.value);
                
                // Add price adjustment to final price
                finalPrice += option.price_adjustment || 0;
                
                // Store variant selection without price adjustment
                variantSelections.push({
                    name: selectedVariant.name,
                    value: selectedVariant.value
                });
            }
        }

        // Check if product with same variants already in cart
        const itemIndex = cart.items.findIndex(item => {
            if (item.product_id.toString() !== product_id) return false;
            
            // Compare selected variants
            if (item.selected_variants.length !== variantSelections.length) return false;
            
            return item.selected_variants.every(variant => {
                const selectedVariant = variantSelections.find(v => v.name === variant.name);
                return selectedVariant && selectedVariant.value === variant.value;
            });
        });

        if (itemIndex > -1) {
            // Update quantity if product with same variants exists
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Add new item if product with these variants doesn't exist
            cart.items.push({
                product_id,
                quantity,
                price: finalPrice,
                selected_variants: variantSelections
            });
        }

        await cart.save();

        // Populate product details
        await cart.populate('items.product_id', 'name description price variants');

        // Calculate totals
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        const tax = 0; // Will be calculated during checkout
        const shipping = 0; // Will be calculated during checkout
        const total = subtotal - (cart.discount_amount || 0) + tax + shipping;

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            data: {
                items: cart.items,
                subtotal,
                discount_amount: cart.discount_amount || 0,
                tax,
                shipping,
                total,
                coupon_id: cart.coupon_id
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;
        const { quantity, selected_variants } = req.body;
        const session_id = req.session.session_id;

        if (quantity < 0) {
            throw new Error('Quantity cannot be negative');
        }

        // Validate product
        const product = await Product.findOne({
            _id: product_id,
            shop_id,
            status: 'active'
        });

        if (!product) {
            throw new Error('Product not found or unavailable');
        }

        // Validate variants if provided
        if (selected_variants && selected_variants.length > 0) {
            for (const selectedVariant of selected_variants) {
                const variant = product.variants.find(v => v.name === selectedVariant.name);
                if (!variant) {
                    throw new Error(`Variant ${selectedVariant.name} not found`);
                }

                const option = variant.options.find(o => o.name === selectedVariant.value);
                if (!option) {
                    throw new Error(`Option ${selectedVariant.value} not found for variant ${selectedVariant.name}`);
                }

                if (option.quantity < quantity) {
                    throw new Error(`Insufficient stock for variant ${selectedVariant.name}: ${selectedVariant.value}`);
                }
            }
        } else if (product.quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        // Find cart
        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Find item in cart
        const itemIndex = cart.items.findIndex(item => {
            if (item.product_id.toString() !== product_id) return false;
            
            if (!selected_variants) return true;
            
            if (item.selected_variants.length !== selected_variants.length) return false;
            
            return item.selected_variants.every(variant => {
                const selectedVariant = selected_variants.find(v => v.name === variant.name);
                return selectedVariant && selectedVariant.value === variant.value;
            });
        });

        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity and variants if provided
            cart.items[itemIndex].quantity = quantity;
            if (selected_variants) {
                // Calculate new price with variant adjustments
                let finalPrice = product.price;
                for (const selectedVariant of selected_variants) {
                    const variant = product.variants.find(v => v.name === selectedVariant.name);
                    const option = variant.options.find(o => o.name === selectedVariant.value);
                    finalPrice += option.price_adjustment || 0;
                }

                cart.items[itemIndex].selected_variants = selected_variants.map(variant => ({
                    name: variant.name,
                    value: variant.value
                }));
                cart.items[itemIndex].price = finalPrice;
            }
        }

        await cart.save();

        // Populate product details
        await cart.populate('items.product_id', 'name description price variants');

        // Calculate totals
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }

        const tax = 0; // Will be calculated during checkout
        const shipping = 0; // Will be calculated during checkout
        const total = subtotal - (cart.discount_amount || 0) + tax + shipping;

        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            data: {
                cart,
                subtotal,
                discount_amount: cart.discount_amount || 0,
                tax,
                shipping,
                total
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;
        const session_id = req.session.session_id;

        // Find cart
        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Remove item
        cart.items = cart.items.filter(
            item => item.product_id.toString() !== product_id
        );

        // Calculate total
        cart.total = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        await cart.save();

        // Populate product details
        await cart.populate('items.product_id', 'name description price');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            data: {
                cart
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

// Clear cart
const clearCart = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const session_id = req.session.session_id;

        const cart = await Cart.findOne({
            shop_id,
            session_id,
            status: 'active'
        });

        if (!cart) {
            throw new Error('Cart not found');
        }

        cart.items = [];
        cart.total = 0;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                cart
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

module.exports = {
    getCart,
    applyCoupon,
    removeCoupon,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
}; 