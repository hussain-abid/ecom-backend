const express = require('express');
const router = express.Router();
const { adminLogin, createAdmin } = require('../controllers/adminAuthController');
const { verifyAdminToken } = require('../middleware/auth');
const AdminUser = require('../models/adminUserModel');

router.post('/create', async (req, res, next) => {

    createAdmin(req, res, next);

}, );

// Admin login
router.post('/login', adminLogin);

// Get admin profile
// router.get('/profile', verifyAdminToken, async (req, res) => {
//     try {
//         const admin = await AdminUser.findById(req.admin.id).select('-password');
//         res.json({
//             success: true,
//             admin
//         });
//     } catch (error) {
//         console.error('Get admin profile error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// });

// Update admin profile
// router.put('/profile', verifyAdminToken, async (req, res) => {
//     try {
//         const { name, email } = req.body;
//         const admin = await AdminUser.findById(req.admin.id);

//         if (name) admin.name = name;
//         if (email) admin.email = email;

//         await admin.save();

//         res.json({
//             success: true,
//             admin: {
//                 id: admin._id,
//                 name: admin.name,
//                 email: admin.email,
//                 role: admin.role,
//                 shop_ids: admin.shop_ids
//             }
//         });
//     } catch (error) {
//         console.error('Update admin profile error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// });

// Change password
// router.put('/change-password', verifyAdminToken, async (req, res) => {
//     try {
//         const { current_password, new_password } = req.body;
//         const admin = await AdminUser.findById(req.admin.id);

//         const isMatch = await admin.comparePassword(current_password);
//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Current password is incorrect'
//             });
//         }

//         admin.password = new_password;
//         await admin.save();

//         res.json({
//             success: true,
//             message: 'Password updated successfully'
//         });
//     } catch (error) {
//         console.error('Change password error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// });

module.exports = router; 