const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/userModel');
const Shop = require('./src/models/shopModel');
const Category = require('./src/models/categoryModel');
const Product = require('./src/models/productModel');
const Coupon = require('./src/models/couponModel');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/new-ecom';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Function to initialize the database
async function initializeDatabase() {
    try {
        const shopId = new mongoose.Types.ObjectId('68025be4c45f3cd14284e573');
        const ownerEmail = 'owner@test.com';

        // Check if shop exists with the given email
        let shop = await Shop.findOne({ owner_email: ownerEmail });
        
        if (!shop) {
            // If no shop exists with this email, create a new one
            console.log('Shop not found, creating new shop...');
            shop = await Shop.create({
                _id: shopId,
                name: 'Tech Store',
                description: 'Your one-stop shop for all tech gadgets',
                address: '123 Tech Street, Silicon Valley',
                phone: '+1 234 567 8900',
                email: 'contact@techstore.com',
                website: 'https://techstore.com',
                status: 'active',
                owner_name: 'John Doe',
                owner_email: ownerEmail,
                owner_phone: '+1 234 567 8901'
            });
            console.log('Shop created successfully');
        } else {
            // If shop exists, update it with the new ID if needed
            if (shop._id.toString() !== shopId.toString()) {
                console.log('Updating existing shop with new ID...');
                shop._id = shopId;
                await shop.save();
                console.log('Shop updated successfully');
            } else {
                console.log('Using existing shop');
            }
        }

        // Clear existing categories for this shop
        await Category.deleteMany({ shop_id: shopId });
        console.log('Cleared existing categories');

        // Create new categories
        console.log('Creating categories...');
        const categories = await Category.create([
            {
                name: 'Audio',
                description: 'Audio devices and accessories',
                shop_id: shopId
            },
            {
                name: 'Smartphones',
                description: 'Latest smartphones and accessories',
                shop_id: shopId
            },
            {
                name: 'Laptops',
                description: 'High-performance laptops and accessories',
                shop_id: shopId
            }
        ]);
        console.log('Categories created successfully:', categories.map(c => c.name).join(', '));

        // Clear existing products for this shop
        await Product.deleteMany({ shop_id: shopId });
        console.log('Cleared existing products');

        // Create products with variants
        console.log('Creating products...');
        
        // Create products one by one to catch any errors
        const productData = [
            {
                name: 'AirPods Pro',
                description: 'Active Noise Cancellation, Transparency mode, Spatial Audio',
                price: 249.99,
                sku: 'AP-PRO',
                quantity: 80,
                category_id: categories[0]._id,
                shop_id: shopId,
                variants: [
                    {
                        name: 'Color',
                        options: [
                            {
                                name: 'White',
                                price_adjustment: 0,
                                quantity: 50,
                                sku: 'AP-PRO-WHITE'
                            },
                            {
                                name: 'Black',
                                price_adjustment: 0,
                                quantity: 30,
                                sku: 'AP-PRO-BLACK'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'iPhone 15 Pro',
                description: 'A17 Pro chip, Titanium design, 48MP camera',
                price: 999.99,
                sku: 'IP15-PRO',
                quantity: 100,
                category_id: categories[1]._id,
                shop_id: shopId,
                variants: [
                    {
                        name: 'Storage',
                        options: [
                            {
                                name: '256GB',
                                price_adjustment: 100,
                                quantity: 35,
                                sku: 'IP15-PRO-256'
                            },
                            {
                                name: '512GB',
                                price_adjustment: 300,
                                quantity: 25,
                                sku: 'IP15-PRO-512'
                            }
                        ]
                    },
                    {
                        name: 'Color',
                        options: [
                            {
                                name: 'Natural Titanium',
                                price_adjustment: 0,
                                quantity: 50,
                                sku: 'IP15-PRO-NAT'
                            },
                            {
                                name: 'Blue Titanium',
                                price_adjustment: 0,
                                quantity: 50,
                                sku: 'IP15-PRO-BLUE'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'MacBook Pro 14"',
                description: 'M3 Pro or M3 Max chip, Liquid Retina XDR display',
                price: 1999.99,
                sku: 'MBP-14',
                quantity: 50,
                category_id: categories[2]._id,
                shop_id: shopId,
                variants: [
                    {
                        name: 'Chip',
                        options: [
                            {
                                name: 'M3 Pro',
                                price_adjustment: 0,
                                quantity: 30,
                                sku: 'MBP-14-M3PRO'
                            },
                            {
                                name: 'M3 Max',
                                price_adjustment: 500,
                                quantity: 20,
                                sku: 'MBP-14-M3MAX'
                            }
                        ]
                    },
                    {
                        name: 'Color',
                        options: [
                            {
                                name: 'Space Gray',
                                price_adjustment: 0,
                                quantity: 25,
                                sku: 'MBP-14-SG'
                            },
                            {
                                name: 'Silver',
                                price_adjustment: 0,
                                quantity: 25,
                                sku: 'MBP-14-SILVER'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Magic Mouse',
                description: 'Multi-Touch surface, Rechargeable battery',
                price: 79.99,
                sku: 'MM-2',
                quantity: 100,
                category_id: categories[2]._id,
                shop_id: shopId
            }
        ];

        const createdProducts = [];
        for (const product of productData) {
            try {
                console.log(`Creating product: ${product.name}`);
                const createdProduct = await Product.create(product);
                createdProducts.push(createdProduct);
                console.log(`Successfully created product: ${product.name}`);
            } catch (error) {
                console.error(`Error creating product ${product.name}:`, error);
                console.error('Product data:', JSON.stringify(product, null, 2));
            }
        }

        console.log('Products creation completed');
        console.log('Products created:', createdProducts.map(p => p.name).join(', '));

        // Clear existing coupons for this shop
        await Coupon.deleteMany({ shop_id: shopId });
        console.log('Cleared existing coupons');

        // Create coupons
        console.log('Creating coupons...');
        const coupons = await Coupon.create([
            {
                shop_id: shopId,
                code: 'WELCOME10',
                description: '10% off on your first order',
                discount_type: 'percentage',
                discount_value: 10,
                min_order_amount: 0,
                max_discount_amount: 100,
                start_date: new Date(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                is_active: true,
                usage_limit: null
            },
            {
                shop_id: shopId,
                code: 'FREESHIP',
                description: 'Free shipping on orders above $100',
                discount_type: 'fixed',
                discount_value: 0,
                min_order_amount: 100,
                max_discount_amount: 0,
                start_date: new Date(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                is_active: true,
                usage_limit: null
            }
        ]);
        console.log('Coupons created successfully:', coupons.map(c => c.code).join(', '));

        // Verify the products were created
        const allProducts = await Product.find({ shop_id: shopId });
        console.log('Total products in database:', allProducts.length);
        console.log('Product names:', allProducts.map(p => p.name).join(', '));

        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase(); 