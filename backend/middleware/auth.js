// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Authorize based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

// Check if user is the teacher of the course
const isCourseTeacher = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if the logged-in user is the teacher of this course
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized - You are not the teacher of this course' });
        }
        
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if student is enrolled in the course
const isEnrolled = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if the student is enrolled in this course
        if (!course.students.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized - You are not enrolled in this course' });
        }
        
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if user owns the resource (material, assignment, etc.)
const isOwner = (model) => async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resource = await model.findById(resourceId);
        
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        
        // Check if user owns the resource (has uploadedBy or createdBy field)
        const ownerField = resource.uploadedBy || resource.createdBy;
        
        if (ownerField && ownerField.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to modify this resource' });
        }
        
        req.resource = resource;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    protect, 
    authorize, 
    isCourseTeacher, 
    isEnrolled,
    isOwner 
};