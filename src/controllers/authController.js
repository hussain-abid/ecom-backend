const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const { validateEmail, validatePassword } = require('../middleware/validate');

// Start guest session
const startGuestSession = async (req, res) => {
    try {
        const { shop_id } = req.params;
        
        // Create a new session
        const session = await Session.create({
            session_id: require('crypto').randomBytes(32).toString('hex'),
            shop_id,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Guest session started',
            data: {
                session_id: session.session_id
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error starting guest session',
            error: error.message
        });
    }
};

// User signup
const signup = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { name, email, password, phone } = req.body;

        // Validate email and password
        const validatedEmail = validateEmail(email);
        const validatedPassword = validatePassword(password);

        // Check if user already exists
        const existingUser = await User.findOne({ email: validatedEmail });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Create user
        const user = await User.create({
            name,
            email: validatedEmail,
            password: validatedPassword,
            phone,
            shop_id
        });

        // If there's a session, update it with the user ID
        if (req.session) {
            await Session.findOneAndUpdate(
                { session_id: req.session.session_id },
                { user_id: user._id }
            );
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const { email, password } = req.body;
        const session_id = req.header('X-Session-ID');

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        // Validate email
        const validatedEmail = validateEmail(email);

        // Find user
        const user = await User.findOne({
            email: validatedEmail,
            shop_id,
            status: 'active'
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Update existing session with user_id
        const session = await Session.findOneAndUpdate(
            {
                session_id,
                shop_id,
                status: 'active',
                expires_at: { $gt: new Date() }
            },
            {
                user_id: user._id,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!session) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                session_id: session.session_id,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        // Update session status to expired
        await Session.findOneAndUpdate(
            { session_id: req.session.session_id },
            { status: 'expired' }
        );

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                success: true,
                message: 'Guest session',
                data: {
                    isGuest: true,
                    session: req.session
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'User session',
            data: {
                isGuest: false,
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role
                },
                session: req.session
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting current user',
            error: error.message
        });
    }
};

module.exports = {
    startGuestSession,
    signup,
    login,
    logout,
    getCurrentUser
}; 