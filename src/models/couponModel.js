const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    discount_type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discount_value: {
        type: Number,
        required: true,
        min: 0
    },
    min_order_amount: {
        type: Number,
        default: 0
    },
    max_discount_amount: {
        type: Number
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    usage_limit: {
        type: Number,
        default: null // null means unlimited
    },
    used_count: {
        type: Number,
        default: 0
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
couponSchema.index({ shop_id: 1, code: 1 });
couponSchema.index({ is_active: 1, start_date: 1, end_date: 1 });

// Update the updated_at field before saving
couponSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon; 