const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const productData = { ...req.body, shop_id };

        // Validate category if provided
        if (productData.category_id) {
            const category = await Category.findOne({
                _id: productData.category_id,
                shop_id,
                status: 'active'
            });
            if (!category) {
                throw new Error('Invalid category');
            }
        }

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                product
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// Get all products
const getProducts = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { 
            category_id,
            status,
            sort = '-created_at',
            page = 1,
            limit = 10
        } = req.query;

        const query = { shop_id };

        // Only add category_id to query if it's a valid ObjectId
        if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
            query.category_id = new mongoose.Types.ObjectId(category_id);
        }

        if (status) {
            query.status = status;
        }

        console.log('Query:', query);
        console.log('Sort:', sort);
        console.log('Pagination:', { page, limit });

        const products = await Product.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('category_id', 'name');

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.status(400).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message
        });
    }
};

// Get a single product
const getProduct = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;

        const product = await Product.findOne({
            _id: product_id,
            shop_id
        }).populate('category_id', 'name');

        if (!product) {
            throw new Error('Product not found');
        }

        res.status(200).json({
            success: true,
            message: 'Product retrieved successfully',
            data: {
                product
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message
        });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;
        const updates = req.body;

        // Validate category if provided
        if (updates.category_id) {
            const category = await Category.findOne({
                _id: updates.category_id,
                shop_id,
                status: 'active'
            });
            if (!category) {
                throw new Error('Invalid category');
            }
        }

        const product = await Product.findOneAndUpdate(
            { _id: product_id, shop_id },
            updates,
            { new: true, runValidators: true }
        ).populate('category_id', 'name');

        if (!product) {
            throw new Error('Product not found');
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: {
                product
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// Delete a product (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const { shop_id, product_id } = req.params;

        const product = await Product.findOneAndUpdate(
            { _id: product_id, shop_id },
            { status: 'inactive' },
            { new: true }
        );

        if (!product) {
            throw new Error('Product not found');
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { q, category_id, status, sort = '-created_at', page = 1, limit = 10 } = req.query;

        const query = {
            shop_id,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { sku: { $regex: q, $options: 'i' } },
                { barcode: { $regex: q, $options: 'i' } }
            ]
        };

        if (category_id) {
            query.category_id = category_id;
        }

        if (status) {
            query.status = status;
        }

        const products = await Product.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('category_id', 'name');

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Products searched successfully',
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error searching products',
            error: error.message
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    searchProducts
}; 