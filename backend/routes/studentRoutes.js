// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Announcement = require('../models/Announcement');
const { protect, authorize, isEnrolled } = require('../middleware/auth');
const googleDriveService = require('../services/googleDriveService');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024
    }
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ 
                message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024) / (1024 * 1024)}MB` 
            });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// All student routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// ==================== Course Management ====================

// @route   GET /api/student/courses
// @desc    Get all courses student is enrolled in
// @access  Student
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ students: req.user.id })
            .populate('teacher', 'firstName lastName email')
            .populate({
                path: 'materials',
                options: { sort: { createdAt: -1 }, limit: 5 }
            })
            .populate({
                path: 'assignments',
                match: { isActive: true },
                options: { sort: { dueDate: 1 } }
            });

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/courses/:courseId
// @desc    Get specific course details
// @access  Student (enrolled only)
router.get('/courses/:courseId', isEnrolled, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate('teacher', 'firstName lastName email department')
            .populate({
                path: 'materials',
                options: { sort: { createdAt: -1 } }
            })
            .populate({
                path: 'assignments',
                match: { isActive: true },
                options: { sort: { dueDate: 1 } }
            })
            .populate({
                path: 'announcements',
                match: { 
                    isActive: true,
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $gt: new Date() } }
                    ]
                },
                options: { sort: { createdAt: -1 } }
            });

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Materials ====================

// @route   GET /api/student/courses/:courseId/materials
// @desc    Get all materials for a course
// @access  Student (enrolled only)
router.get('/courses/:courseId/materials', isEnrolled, async (req, res) => {
    try {
        const materials = await Material.find({ courseId: req.params.courseId })
            .populate('uploadedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/materials/:materialId
// @desc    Download/view material
// @access  Student (enrolled in course)
router.get('/materials/:materialId', async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check if student is enrolled in the course
        const course = await Course.findOne({
            _id: material.courseId,
            students: req.user.id
        });

        if (!course && !material.isPublic) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        // Increment view count
        material.views += 1;
        await material.save();

        res.json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/student/materials/:materialId/view
// @desc    Track material view
// @access  Student (enrolled in course)
router.post('/materials/:materialId/view', async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check if student is enrolled in the course
        const course = await Course.findOne({
            _id: material.courseId,
            students: req.user.id
        });

        if (!course && !material.isPublic) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        // Increment view count
        material.views += 1;
        await material.save();

        res.json({
            success: true,
            message: 'View tracked successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/student/materials/:materialId/download
// @desc    Track material download
// @access  Student (enrolled in course)
router.post('/materials/:materialId/download', async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check if student is enrolled in the course
        const course = await Course.findOne({
            _id: material.courseId,
            students: req.user.id
        });

        if (!course && !material.isPublic) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        // Increment download count
        material.downloads += 1;
        await material.save();

        res.json({
            success: true,
            message: 'Download tracked successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Assignments ====================

// @route   GET /api/student/courses/:courseId/assignments
// @desc    Get all assignments for a course
// @access  Student (enrolled only)
router.get('/courses/:courseId/assignments', isEnrolled, async (req, res) => {
    try {
        const assignments = await Assignment.find({ 
            courseId: req.params.courseId,
            isActive: true
        })
        .sort({ dueDate: 1 });

        // Get submission status for each assignment
        const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
            const submission = await Submission.findOne({
                assignmentId: assignment._id,
                studentId: req.user.id
            });

            return {
                ...assignment.toObject(),
                submission: submission ? {
                    status: submission.status,
                    submissionDate: submission.submissionDate,
                    grade: submission.grade,
                    isLate: submission.isLate
                } : null
            };
        }));

        res.json({
            success: true,
            data: assignmentsWithStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/assignments/:assignmentId
// @desc    Get specific assignment details
// @access  Student (enrolled in course)
router.get('/assignments/:assignmentId', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId)
            .populate('createdBy', 'firstName lastName');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if student is enrolled in the course
        const course = await Course.findOne({
            _id: assignment.courseId,
            students: req.user.id
        });

        if (!course) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        // Get student's submission if any
        const submission = await Submission.findOne({
            assignmentId: assignment._id,
            studentId: req.user.id
        });

        res.json({
            success: true,
            data: {
                ...assignment.toObject(),
                submission
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/student/assignments/:assignmentId/submit
router.post('/assignments/:assignmentId/submit',
    upload.array('files', 5),
    handleUploadError,
    async (req, res) => {
        try {
            const assignment = await Assignment.findById(req.params.assignmentId);

            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            const course = await Course.findOne({
                _id: assignment.courseId,
                students: req.user.id
            });

            if (!course) {
                return res.status(403).json({ message: 'Not enrolled in this course' });
            }

            const now = new Date();
            if (now < assignment.availableFrom || now > assignment.availableUntil) {
                return res.status(400).json({ message: 'Assignment is not available for submission' });
            }

            const existingSubmission = await Submission.findOne({
                assignmentId: assignment._id,
                studentId: req.user.id
            });

            if (existingSubmission) {
                return res.status(400).json({ message: 'You have already submitted this assignment' });
            }

            const submittedFiles = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const fileExt = file.originalname.split('.').pop().toLowerCase();
                    if (!assignment.allowedFileTypes.includes(fileExt)) {
                        return res.status(400).json({ 
                            message: `File type .${fileExt} is not allowed for this assignment` 
                        });
                    }

                    if (file.size > assignment.maxFileSize) {
                        return res.status(400).json({ 
                            message: `File ${file.originalname} exceeds maximum allowed size` 
                        });
                    }
                }

                const driveFiles = await googleDriveService.uploadMultipleFiles(
                    req.files,
                    'submissions',
                    { 
                        userId: req.user.id,
                        assignmentId: req.params.assignmentId,
                        courseId: assignment.courseId
                    }
                );

                driveFiles.forEach((driveFile, index) => {
                    submittedFiles.push({
                        googleDriveFileId: driveFile.fileId,
                        fileName: driveFile.fileName,
                        originalFileName: req.files[index].originalname,
                        fileType: req.files[index].originalname.split('.').pop().toLowerCase(),
                        fileSize: driveFile.fileSize,
                        mimeType: driveFile.mimeType,
                        webViewLink: driveFile.webViewLink,
                        webContentLink: driveFile.webContentLink,
                        uploadedAt: new Date()
                    });
                });
            }

            const submission = new Submission({
                assignmentId: assignment._id,
                studentId: req.user.id,
                submittedFiles,
                comments: req.body.comments,
                submissionDate: now,
                isLate: now > assignment.dueDate,
                status: now > assignment.dueDate ? 'late' : 'submitted',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            await submission.save();

            assignment.submissions.push(submission._id);
            await assignment.save();

            res.status(201).json({
                success: true,
                message: 'Assignment submitted successfully',
                data: submission
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
);

// ==================== Submissions ====================

// @route   GET /api/student/submissions
// @desc    Get all submissions for the student
// @access  Student
router.get('/submissions', async (req, res) => {
    try {
        const submissions = await Submission.find({ 
            studentId: req.user.id 
        })
        .populate({
            path: 'assignmentId',
            select: 'title maxScore dueDate availableFrom availableUntil courseId',
            populate: {
                path: 'courseId',
                select: 'courseName courseCode'
            }
        })
        .sort({ submissionDate: -1 });

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/assignments/:assignmentId/my-submission
// @desc    Get student's submission for a specific assignment
// @access  Student
router.get('/assignments/:assignmentId/my-submission', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if student is enrolled in the course
        const course = await Course.findOne({
            _id: assignment.courseId,
            students: req.user.id
        });

        if (!course) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        const submission = await Submission.findOne({
            assignmentId: req.params.assignmentId,
            studentId: req.user.id
        });

        res.json({
            success: true,
            data: submission || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/student/submissions/:submissionId
// @desc    Update submission (if not graded) with new Google Drive files
// @access  Student (own submissions only)
router.put('/submissions/:submissionId',
    upload.array('files', 5),
    handleUploadError,
    async (req, res) => {
        try {
            const submission = await Submission.findById(req.params.submissionId);

            if (!submission) {
                return res.status(404).json({ message: 'Submission not found' });
            }

            // Check if submission belongs to student
            if (submission.studentId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Check if submission can be updated (not graded)
            if (submission.status === 'graded') {
                return res.status(400).json({ message: 'Cannot update graded submission' });
            }

            const assignment = await Assignment.findById(submission.assignmentId);

            // Check if assignment is still open
            const now = new Date();
            if (now > assignment.availableUntil) {
                return res.status(400).json({ message: 'Assignment submission period has ended' });
            }

            // Process new files and upload to Google Drive
            if (req.files && req.files.length > 0) {
                // Validate new files
                for (const file of req.files) {
                    const fileExt = file.originalname.split('.').pop().toLowerCase();
                    if (!assignment.allowedFileTypes.includes(fileExt)) {
                        return res.status(400).json({ 
                            message: `File type .${fileExt} is not allowed for this assignment` 
                        });
                    }

                    if (file.size > assignment.maxFileSize) {
                        return res.status(400).json({ 
                            message: `File ${file.originalname} exceeds maximum allowed size` 
                        });
                    }
                }

                // Upload new files to Google Drive
                const driveFiles = await googleDriveService.uploadMultipleFiles(
                    req.files,
                    'submissions',
                    { 
                        userId: req.user.id,
                        assignmentId: submission.assignmentId,
                        courseId: assignment.courseId,
                        submissionId: submission._id,
                        isUpdate: true
                    }
                );

                const newFiles = driveFiles.map((driveFile, index) => ({
                    googleDriveFileId: driveFile.fileId,
                    fileName: driveFile.fileName,
                    originalFileName: req.files[index].originalname,
                    fileType: req.files[index].originalname.split('.').pop().toLowerCase(),
                    fileSize: driveFile.fileSize,
                    mimeType: driveFile.mimeType,
                    webViewLink: driveFile.webViewLink,
                    webContentLink: driveFile.webContentLink,
                    uploadedAt: new Date()
                }));

                submission.submittedFiles = [...submission.submittedFiles, ...newFiles];
            }

            submission.comments = req.body.comments || submission.comments;
            submission.submissionDate = now;
            submission.isLate = now > assignment.dueDate;
            submission.status = now > assignment.dueDate ? 'late' : 'submitted';
            submission.attemptNumber += 1;

            await submission.save();

            res.json({
                success: true,
                message: 'Submission updated successfully with new Google Drive files',
                data: submission
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
);

// ==================== Grades ====================

// @route   GET /api/student/grades
// @desc    Get all grades for student
// @access  Student
router.get('/grades', async (req, res) => {
    try {
        const submissions = await Submission.find({ 
            studentId: req.user.id,
            status: 'graded'
        })
        .populate({
            path: 'assignmentId',
            select: 'title maxScore courseId',
            populate: {
                path: 'courseId',
                select: 'courseName courseCode'
            }
        })
        .populate('grade.gradedBy', 'firstName lastName')
        .sort({ 'grade.gradedAt': -1 });

        // Calculate statistics
        const totalGraded = submissions.length;
        let totalScore = 0;
        let totalMaxScore = 0;

        submissions.forEach(sub => {
            totalScore += sub.grade.score;
            totalMaxScore += sub.assignmentId.maxScore;
        });

        const averageGrade = totalGraded > 0 ? (totalScore / totalGraded).toFixed(2) : 0;
        const overallPercentage = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                submissions,
                statistics: {
                    totalGraded,
                    averageGrade,
                    totalScore,
                    totalMaxScore,
                    overallPercentage
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/student/courses/:courseId/grades
// @desc    Get grades for specific course
// @access  Student (enrolled only)
router.get('/courses/:courseId/grades', isEnrolled, async (req, res) => {
    try {
        const submissions = await Submission.find({ 
            studentId: req.user.id,
            assignmentId: { $in: await Assignment.find({ courseId: req.params.courseId }).distinct('_id') },
            status: 'graded'
        })
        .populate('assignmentId', 'title maxScore')
        .populate('grade.gradedBy', 'firstName lastName')
        .sort({ 'grade.gradedAt': -1 });

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Announcements ====================

// @route   GET /api/student/announcements
// @desc    Get all announcements for student
// @access  Student
router.get('/announcements', async (req, res) => {
    try {
        const studentCourses = await Course.find({ students: req.user.id });
        const courseIds = studentCourses.map(c => c._id);

        const announcements = await Announcement.find({
            $or: [
                { targetAudience: { $in: ['all', 'students'] } },
                { courseId: { $in: courseIds } }
            ],
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        })
        .populate('author', 'firstName lastName')
        .populate('courseId', 'courseName courseCode')
        .sort({ isPinned: -1, createdAt: -1 });

        // Mark as read
        const userId = req.user.id;
        announcements.forEach(async (announcement) => {
            const alreadyRead = announcement.readBy.some(
                r => r.user.toString() === userId
            );
            
            if (!alreadyRead) {
                announcement.readBy.push({ user: userId });
                announcement.views += 1;
                await announcement.save();
            }
        });

        res.json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== Dashboard Stats ====================

// @route   GET /api/student/stats
// @desc    Get student dashboard statistics
// @access  Student
router.get('/stats', async (req, res) => {
    try {
        const [enrolledCourses, pendingAssignments, recentGrades] = await Promise.all([
            Course.countDocuments({ students: req.user.id }),
            Submission.countDocuments({ 
                studentId: req.user.id,
                status: { $in: ['submitted', 'late'] }
            }),
            Submission.find({ 
                studentId: req.user.id,
                status: 'graded'
            })
            .populate('assignmentId', 'title')
            .sort({ 'grade.gradedAt': -1 })
            .limit(5)
        ]);

        // Get upcoming deadlines
        const now = new Date();
        const upcomingDeadlines = await Assignment.find({
            courseId: { $in: await Course.find({ students: req.user.id }).distinct('_id') },
            dueDate: { $gt: now },
            availableUntil: { $gt: now },
            isActive: true
        })
        .populate('courseId', 'courseName courseCode')
        .sort({ dueDate: 1 })
        .limit(5);

        res.json({
            success: true,
            data: {
                enrolledCourses,
                pendingAssignments,
                upcomingDeadlines,
                recentGrades
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;