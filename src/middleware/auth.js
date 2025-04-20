const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');

// Middleware to verify session
const auth = async (req, res, next) => {
    console.log('\n=== Auth Middleware Start ===');
    console.log('Time:', new Date().toISOString());
    console.log('Request URL:', req.originalUrl);
    console.log('Request Method:', req.method);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    
    try {
        const session_id = req.header('X-Session-ID');
        
        console.log('Session ID from header:', session_id);
        
        if (!session_id) {
            console.log('No session ID provided');
            return res.status(401).json({
                success: false,
                message: 'No session ID provided'
            });
        }

        console.log('Looking for session in database...');
        const session = await Session.findOne({
            session_id,
            status: 'active',
            expires_at: { $gt: new Date() }
        });

        console.log('Session found:', session ? 'Yes' : 'No');
        if (session) {
            console.log('Session details:', {
                session_id: session.session_id,
                user_id: session.user_id,
                status: session.status,
                expires_at: session.expires_at
            });
        }

        if (!session) {
            console.log('Session not found or expired');
            throw new Error('Session expired or invalid');
        }

        if (session.user_id) {
            console.log('Looking for user in database...');
            const user = await User.findOne({
                _id: session.user_id,
                status: 'active'
            });

            console.log('User found:', user ? 'Yes' : 'No');
            if (user) {
                console.log('User details:', {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                });
            }

            if (!user) {
                console.log('User not found or inactive');
                throw new Error('User not found or inactive');
            }

            req.user = user;
        }

        req.session = session;
        console.log('=== Auth Middleware End - Success ===\n');
        next();
    } catch (error) {
        console.error('=== Auth Middleware Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('=== Auth Middleware End - Error ===\n');
        res.status(401).json({
            success: false,
            message: 'Please authenticate',
            error: error.message
        });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }
        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Access denied',
            error: error.message
        });
    }
};

// Middleware to check if user is staff or admin
const isStaffOrAdmin = async (req, res, next) => {
    try {
        if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
            throw new Error('Access denied. Staff privileges required.');
        }
        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Access denied',
            error: error.message
        });
    }
};

module.exports = {
    auth,
    isAdmin,
    isStaffOrAdmin
}; 