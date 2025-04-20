const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/userModel');
const Shop = require('./src/models/shopModel');
const Category = require('./src/models/categoryModel');
const Product = require('./src/models/productModel');
const Coupon = require('./src/models/couponModel');
const AdminUser = require('./src/models/adminUserModel');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/new-ecom';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
        return initializeDatabase();
    })
    .then(() => {
        console.log('Database initialization completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });

// Clean up existing data
async function cleanupDatabase() {
    try {
        await Shop.deleteMany({});
        await AdminUser.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Coupon.deleteMany({});
        console.log('Existing data cleaned up successfully');
    } catch (error) {
        console.error('Error cleaning up database:', error);
        throw error;
    }
}

// Function to initialize the database
async function initializeDatabase() {
    // Clean up existing data
    await cleanupDatabase();

    // Create shop
    console.log('Creating new shop...');
    const shop = await Shop.create({
        name: 'Tech Store',
        description: 'Your one-stop shop for all tech gadgets',
        address: '123 Tech Street, Silicon Valley',
        contact_email: 'contact@techstore.com',
        contact_phone: '+1234567890',
        is_active: true
    });
    console.log('Shop created successfully');

    // Create admin user
    console.log('Creating admin user...');
    const admin = await AdminUser.create({
        name: 'Admin User',
        email: 'admin@techstore.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
    });
    console.log('Admin user created successfully');

    // Create categories
    console.log('Creating categories...');
    const smartphoneCategory = await Category.create({
        shop_id: shop._id,
        name: 'Smartphones',
        description: 'Latest smartphones and accessories',
        is_active: true
    });

    const laptopCategory = await Category.create({
        shop_id: shop._id,
        name: 'Laptops',
        description: 'High-performance laptops and accessories',
        is_active: true
    });
    console.log('Categories created successfully');

    // Create products
    console.log('Creating products...');
    const iphone = await Product.create({
        shop_id: shop._id,
        category_id: smartphoneCategory._id,
        name: 'iPhone 13 Pro',
        description: 'The latest iPhone with advanced camera system',
        price: 999.99,
        quantity: 100,
        sku: 'IP13P',
        variants: [
            {
                name: 'Storage',
                options: [
                    {
                        name: '128GB',
                        sku: 'IP13P-128',
                        price_adjustment: 0,
                        quantity: 50
                    },
                    {
                        name: '256GB',
                        sku: 'IP13P-256',
                        price_adjustment: 100,
                        quantity: 30
                    }
                ]
            }
        ],
        status: 'active'
    });

    const macbook = await Product.create({
        shop_id: shop._id,
        category_id: laptopCategory._id,
        name: 'MacBook Pro',
        description: 'Powerful laptop for professionals',
        price: 1999.99,
        quantity: 50,
        sku: 'MBP',
        variants: [
            {
                name: 'Model',
                options: [
                    {
                        name: 'M1 Pro 14"',
                        sku: 'MBP14-M1',
                        price_adjustment: 0,
                        quantity: 20
                    },
                    {
                        name: 'M1 Max 16"',
                        sku: 'MBP16-M1',
                        price_adjustment: 500,
                        quantity: 15
                    }
                ]
            }
        ],
        status: 'active'
    });
    console.log('Products created successfully');

    // Create coupons
    console.log('Creating coupons...');
    const welcomeCoupon = await Coupon.create({
        shop_id: shop._id,
        code: 'WELCOME10',
        description: '10% off on first purchase',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 0,
        max_discount_amount: 100,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        is_active: true,
        usage_limit: 100,
        used_count: 0
    });

    const freeShippingCoupon = await Coupon.create({
        shop_id: shop._id,
        code: 'FREESHIP',
        description: 'Free shipping on orders above $200',
        discount_type: 'fixed',
        discount_value: 0,
        min_order_amount: 200,
        max_discount_amount: 0,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        is_active: true,
        usage_limit: 50,
        used_count: 0
    });
    console.log('Coupons created successfully');
} 