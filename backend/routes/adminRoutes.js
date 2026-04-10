// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// ==================== User Management ====================

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Admin
router.get('/users', async (req, res) => {
    try {
        const { role, isActive, search, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users
// @desc    Create new user (teacher or student)
// @access  Admin
router.post('/users', async (req, res) => {
    try {
        const { role, email, password, ...userData } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Create user
        const user = new User({
            ...userData,
            email,
            password,
            role
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user.toJSON()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user.id && req.body.role && req.body.role !== user.role) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        // Update user fields
        const updatableFields = ['firstName', 'lastName', 'email', 'department', 
                                 'specialization', 'studentId', 'enrollmentDate', 'isActive'];
        
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user.toJSON()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove user from courses
        if (user.role === 'teacher') {
            await Course.updateMany(
                { teacher: user._id },
                { teacher: null }
            );
        } else if (user.role === 'student') {
            await Course.updateMany(
                { students: user._id },
                { $pull: { students: user._id } }
            );
        }

        // Use deleteOne instead of remove()
        await User.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Course Management ====================

// @route   GET /api/admin/courses
// @desc    Get all courses with filtering
// @access  Admin
router.get('/courses', async (req, res) => {
    try {
        const { department, semester, isActive, search, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (department) query.department = department;
        if (semester) query.semester = parseInt(semester);
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        if (search) {
            query.$or = [
                { courseCode: { $regex: search, $options: 'i' } },
                { courseName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const courses = await Course.find(query)
            .populate({
                path: 'teacher',
                select: 'firstName lastName email department',
                // Handle null teacher by just not populating
            })
            .populate('students', 'firstName lastName studentId email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Course.countDocuments(query);

        // Ensure teacher field is null if not populated
        const processedCourses = courses.map(course => {
            const courseObj = course.toObject();
            if (!courseObj.teacher) {
                courseObj.teacher = null;
            }
            return courseObj;
        });

        res.json({
            success: true,
            data: processedCourses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   GET /api/admin/courses/:id
// @desc    Get single course by ID
// @access  Admin
router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('teacher', 'firstName lastName email department')
            .populate('students', 'firstName lastName lastName studentId email');
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Admin
router.post('/courses', async (req, res) => {
    try {
        const { courseCode } = req.body;

        // Check if course exists
        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        const course = new Course(req.body);
        await course.save();

        // Populate teacher info before sending response
        await course.populate('teacher', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Admin
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const updatableFields = ['courseName', 'description', 'credits', 'department', 
                                 'semester', 'teacher', 'startDate', 'endDate', 
                                 'isActive', 'maxStudents'];
        
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();
        
        // Populate teacher info before sending response
        await course.populate('teacher', 'firstName lastName email');

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Admin
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Remove course reference from students
        await User.updateMany(
            { courses: course._id },
            { $pull: { courses: course._id } }
        );

        await Course.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Enrollment Management ====================

// @route   POST /api/admin/courses/:courseId/students
// @desc    Enroll student in course
// @access  Admin
router.post('/courses/:courseId/students', async (req, res) => {
    try {
        const { studentId } = req.body;
        
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const student = await User.findOne({ 
            _id: studentId, 
            role: 'student' 
        });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already enrolled
        if (course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        // Check course capacity
        if (course.students.length >= course.maxStudents) {
            return res.status(400).json({ message: 'Course has reached maximum capacity' });
        }

        course.students.push(studentId);
        await course.save();

        // Add course to student's courses
        if (!student.courses.includes(course._id)) {
            student.courses.push(course._id);
            await student.save();
        }

        res.json({
            success: true,
            message: 'Student enrolled successfully',
            data: course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Admin
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Remove course reference from students
        await User.updateMany(
            { courses: course._id },
            { $pull: { courses: course._id } }
        );

        await Course.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Dashboard Stats ====================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const [totalStudents, totalTeachers, totalCourses, activeCourses] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            Course.countDocuments(),
            Course.countDocuments({ isActive: true })
        ]);

        // Get recent activities
        const recentEnrollments = await Course.aggregate([
            { $unwind: '$students' },
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'users',
                localField: 'students',
                foreignField: '_id',
                as: 'student'
            }},
            { $project: {
                courseName: 1,
                'student.firstName': 1,
                'student.lastName': 1,
                updatedAt: 1
            }}
        ]);

        res.json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalCourses,
                activeCourses,
                recentEnrollments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;