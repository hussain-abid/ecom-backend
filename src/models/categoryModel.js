const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
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
categorySchema.index({ name: 1 });
categorySchema.index({ shop_id: 1 });
categorySchema.index({ parent_id: 1 });
categorySchema.index({ status: 1 });

// Update the updated_at field before saving
categorySchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 