const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    ip_address: {
        type: String
    },
    user_agent: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    expires_at: {
        type: Date,
        required: true
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
sessionSchema.index({ session_id: 1 }, { unique: true });
sessionSchema.index({ user_id: 1 });
sessionSchema.index({ shop_id: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ expires_at: 1 });

// Update the updated_at field before saving
sessionSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 