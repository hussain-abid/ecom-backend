const mongoose = require('mongoose');

const paymentTypeSchema = new mongoose.Schema({
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
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
paymentTypeSchema.index({ shop_id: 1 });
paymentTypeSchema.index({ is_active: 1 });

// Update the updated_at field before saving
paymentTypeSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const PaymentType = mongoose.model('PaymentType', paymentTypeSchema);

module.exports = PaymentType; 