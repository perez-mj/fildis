// backend/routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get all announcements (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = { isActive: true };

        // Filter based on user role
        if (req.user.role === 'student') {
            const studentCourses = await Course.find({ students: req.user.id });
            const courseIds = studentCourses.map(c => c._id);
            
            query.$or = [
                { targetAudience: { $in: ['all', 'students'] } },
                { courseId: { $in: courseIds } }
            ];
        } else if (req.user.role === 'teacher') {
            const teacherCourses = await Course.find({ teacher: req.user.id });
            const courseIds = teacherCourses.map(c => c._id);
            
            query.$or = [
                { targetAudience: { $in: ['all', 'teachers'] } },
                { courseId: { $in: courseIds } }
            ];
        } else if (req.user.role === 'admin') {
            // Admins can see all announcements
        }

        // Filter by course if specified
        if (req.query.courseId) {
            query.courseId = req.query.courseId;
        }

        // Filter by priority
        if (req.query.priority) {
            query.priority = req.query.priority;
        }

        const announcements = await Announcement.find(query)
            .populate('author', 'firstName lastName role')
            .populate('courseId', 'courseName courseCode')
            .sort({ isPinned: -1, createdAt: -1 });

        // Mark as read for the current user (non-admin)
        if (req.user.role !== 'admin') {
            const userId = req.user.id;
            for (const announcement of announcements) {
                const alreadyRead = announcement.readBy.some(
                    r => r.user && r.user.toString() === userId
                );
                
                if (!alreadyRead) {
                    announcement.readBy.push({ user: userId });
                    announcement.views += 1;
                    await announcement.save();
                }
            }
        }

        res.json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/announcements
// @desc    Create announcement
// @access  Private (Admin/Teacher)
router.post('/', protect, async (req, res) => {
    try {
        // Check authorization
        if (req.user.role === 'student') {
            return res.status(403).json({ message: 'Students cannot create announcements' });
        }

        // If it's a course announcement, verify teacher teaches the course
        if (req.body.targetAudience === 'course' && req.body.courseId) {
            if (req.user.role === 'teacher') {
                const course = await Course.findOne({
                    _id: req.body.courseId,
                    teacher: req.user.id
                });

                if (!course) {
                    return res.status(403).json({ message: 'You do not teach this course' });
                }
            }
        }

        // Remove courseId if targetAudience is not 'course'
        const announcementData = { ...req.body };
        if (announcementData.targetAudience !== 'course') {
            delete announcementData.courseId;
        }

        const announcement = new Announcement({
            ...announcementData,
            author: req.user.id
        });

        await announcement.save();

        // If it's a course announcement, add to course
        if (announcement.targetAudience === 'course' && announcement.courseId) {
            await Course.findByIdAndUpdate(
                announcement.courseId,
                { $push: { announcements: announcement._id } }
            );
        }

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('author', 'firstName lastName role')
            .populate('courseId', 'courseName courseCode');

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: populatedAnnouncement
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (Author/Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check authorization (author or admin)
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this announcement' });
        }

        const updatableFields = ['title', 'content', 'priority', 'expiresAt', 'isPinned', 'isActive', 'targetAudience'];
        
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                announcement[field] = req.body[field];
            }
        });

        // Handle courseId update
        if (req.body.targetAudience === 'course' && req.body.courseId) {
            announcement.courseId = req.body.courseId;
        } else if (req.body.targetAudience !== 'course') {
            announcement.courseId = null;
        }

        await announcement.save();

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('author', 'firstName lastName role')
            .populate('courseId', 'courseName courseCode');

        res.json({
            success: true,
            message: 'Announcement updated successfully',
            data: populatedAnnouncement
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (Author/Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check authorization (author or admin)
        if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        // Remove from course if applicable
        if (announcement.courseId) {
            await Course.findByIdAndUpdate(
                announcement.courseId,
                { $pull: { announcements: announcement._id } }
            );
        }

        await Announcement.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   GET /api/announcements/unread-count
// @desc    Get unread announcements count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
    try {
        let query = { isActive: true };

        if (req.user.role === 'student') {
            const studentCourses = await Course.find({ students: req.user.id });
            const courseIds = studentCourses.map(c => c._id);
            
            query.$or = [
                { targetAudience: { $in: ['all', 'students'] } },
                { courseId: { $in: courseIds } }
            ];
        } else if (req.user.role === 'teacher') {
            const teacherCourses = await Course.find({ teacher: req.user.id });
            const courseIds = teacherCourses.map(c => c._id);
            
            query.$or = [
                { targetAudience: { $in: ['all', 'teachers'] } },
                { courseId: { $in: courseIds } }
            ];
        }

        const announcements = await Announcement.find(query);
        
        const unreadCount = announcements.filter(a => 
            !a.readBy.some(r => r.user && r.user.toString() === req.user.id)
        ).length;

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/announcements/:id/mark-read
// @desc    Mark announcement as read
// @access  Private
router.post('/:id/mark-read', protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const alreadyRead = announcement.readBy.some(
            r => r.user && r.user.toString() === req.user.id
        );

        if (!alreadyRead) {
            announcement.readBy.push({ user: req.user.id });
            announcement.views += 1;
            await announcement.save();
        }

        res.json({
            success: true,
            message: 'Announcement marked as read'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;