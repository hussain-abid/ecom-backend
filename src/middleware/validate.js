const validator = require('validator');

// Validate email
const validateEmail = (email) => {
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email address');
    }
    return email.toLowerCase();
};

// Validate password
const validatePassword = (password) => {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    return password;
};

// Validate phone number
const validatePhone = (phone) => {
    if (phone && !validator.isMobilePhone(phone)) {
        throw new Error('Invalid phone number');
    }
    return phone;
};

// Validate shop registration
const validateShopRegistration = (req, res, next) => {
    try {
        const { name, owner_name, owner_email, owner_phone } = req.body;

        if (!name || !owner_name || !owner_email) {
            throw new Error('Name, owner name, and owner email are required');
        }

        req.body.owner_email = validateEmail(owner_email);
        if (owner_phone) {
            req.body.owner_phone = validatePhone(owner_phone);
        }

        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.message
        });
    }
};

// Validate user registration
const validateUserRegistration = (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            throw new Error('Name, email, and password are required');
        }

        req.body.email = validateEmail(email);
        req.body.password = validatePassword(password);
        if (phone) {
            req.body.phone = validatePhone(phone);
        }

        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.message
        });
    }
};

// Validate product creation
const validateProduct = (req, res, next) => {
    try {
        const { name, price, quantity } = req.body;

        if (!name || !price || quantity === undefined) {
            throw new Error('Name, price, and quantity are required');
        }

        if (price < 0) {
            throw new Error('Price cannot be negative');
        }

        if (quantity < 0) {
            throw new Error('Quantity cannot be negative');
        }

        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            error: error.message
        });
    }
};

module.exports = {
    validateEmail,
    validatePassword,
    validatePhone,
    validateShopRegistration,
    validateUserRegistration,
    validateProduct
}; 