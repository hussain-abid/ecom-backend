const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    session_id: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        selected_variants: [{
            name: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            }
        }]
    }],
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'converted', 'abandoned'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
cartSchema.index({ shop_id: 1, session_id: 1, status: 1 });

// Update the updated_at field before saving
cartSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 