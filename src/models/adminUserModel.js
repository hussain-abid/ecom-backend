const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager'],
        default: 'manager'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    last_login: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
adminUserSchema.index({ shop_id: 1, email: 1 }, { unique: true });

// Pre-save hook to update updated_at
adminUserSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser; 