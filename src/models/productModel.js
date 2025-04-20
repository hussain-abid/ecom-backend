const mongoose = require('mongoose');

// Define the variant option schema
const variantOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price_adjustment: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    sku: {
        type: String,
        trim: true
    }
});

// Define the variant schema
const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    options: [variantOptionSchema]
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compare_at_price: {
        type: Number,
        min: 0
    },
    cost_per_item: {
        type: Number,
        min: 0
    },
    sku: {
        type: String,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    weight: {
        type: Number,
        min: 0
    },
    weight_unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'kg'
    },
    category_id: {
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
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },
    variants: [variantSchema],
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
productSchema.index({ name: 1 });
productSchema.index({ shop_id: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ status: 1 });
productSchema.index({ sku: 1 }, { sparse: true });
productSchema.index({ barcode: 1 }, { sparse: true });

// Update the updated_at field before saving
productSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 