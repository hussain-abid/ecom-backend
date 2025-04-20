const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner_name: {
        type: String,
        required: true,
        trim: true
    },
    owner_email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    owner_phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    zip_code: {
        type: String,
        trim: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
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

// Create indexes
shopSchema.index({ name: 1 });
shopSchema.index({ owner_email: 1 }, { unique: true });
shopSchema.index({ status: 1 });

// Update the updated_at field before saving
shopSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop; 