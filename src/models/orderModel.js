const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true
    },
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    discount_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    tax: {
        type: Number,
        required: true,
        min: 0
    },
    shipping: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    products: [{
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
        variant_id: {
            type: mongoose.Schema.Types.ObjectId
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    addresses: {
        country: {
            type: String,
            required: true
        },
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        apartment: {
            type: String
        },
        suite_etc: {
            type: String
        },
        city: {
            type: String,
            required: true
        },
        postal_code: {
            type: String
        },
        phone: {
            type: String,
            required: true
        }
    },
    payment_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentType',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
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

// Create indexes
orderSchema.index({ session_id: 1 });
orderSchema.index({ shop_id: 1 });
orderSchema.index({ status: 1 });

// Update the updated_at field before saving
orderSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 