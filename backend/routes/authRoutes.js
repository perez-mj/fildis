// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate Access Token (short-lived)
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30m' 
    });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated. Contact administrator.' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken();

        // Save refresh token to user document
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: user.toJSON(),
            message: 'Login successful'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        console.log('Refresh attempt with token:', refreshToken ? 'present' : 'missing');
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }
        
        // Find user with this refresh token
        const user = await User.findOne({ refreshToken });
        
        if (!user) {
            console.log('No user found with refresh token');
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        
        console.log('User found, generating new tokens for:', user.email);
        
        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken();
        
        // Update refresh token in database
        user.refreshToken = newRefreshToken;
        await user.save();
        
        res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user - invalidate refresh token
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        // Clear refresh token from database
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        // Invalidate all refresh tokens on password change (optional but secure)
        user.refreshToken = null;
        await user.save();

        res.json({ 
            success: true, 
            message: 'Password changed successfully. Please login again.' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('courses', 'courseName courseCode');
        
        res.json(user.toJSON());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // In a real application, send email with reset token
        // For now, just return success
        
        res.json({ 
            success: true, 
            message: 'Password reset instructions sent to your email' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;