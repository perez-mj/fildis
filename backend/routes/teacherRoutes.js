// backend/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Announcement = require('../models/Announcement');
const { protect, authorize, isCourseTeacher } = require('../middleware/auth');
const googleDriveService = require('../services/googleDriveService');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
    }
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ 
                message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024) / (1024 * 1024)}MB` 
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                message: `Too many files. Maximum ${err.field} files allowed` 
            });
        }
        return res.status(400).json({ message: err.message });
    }
    
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    
    next();
};

// All teacher routes require authentication and teacher role
router.use(protect);
router.use(authorize('teacher'));

// ==================== Course Management ====================

// @route   GET /api/teacher/courses
// @desc    Get all courses taught by teacher
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id })
            .populate('students', 'firstName lastName email studentId')
            .populate('materials')
            .populate('assignments');

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/teacher/courses/:courseId/materials
// @desc    Upload material for course to Google Drive
router.post('/courses/:courseId/materials', 
    isCourseTeacher,
    upload.single('file'),
    handleUploadError,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Upload to Google Drive
            const driveFile = await googleDriveService.uploadFile(
                req.file, 
                'materials',
                { 
                    userId: req.user.id,
                    courseId: req.params.courseId,
                    title: req.body.title 
                }
            );

            // Determine file type from extension
            const fileExt = req.file.originalname.split('.').pop().toLowerCase();
            let fileType = 'other';
            if (['pdf'].includes(fileExt)) fileType = 'pdf';
            else if (['ppt', 'pptx'].includes(fileExt)) fileType = 'ppt';
            else if (['doc', 'docx'].includes(fileExt)) fileType = 'doc';
            else if (['mp4', 'mov', 'avi', 'webm'].includes(fileExt)) fileType = 'video';
            else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExt)) fileType = 'image';

            const material = new Material({
                title: req.body.title,
                description: req.body.description,
                courseId: req.params.courseId,
                uploadedBy: req.user.id,
                fileType: fileType,
                // Google Drive fields
                googleDriveFileId: driveFile.fileId,
                fileName: driveFile.fileName,
                originalFileName: req.file.originalname,
                fileSize: driveFile.fileSize,
                mimeType: driveFile.mimeType,
                webViewLink: driveFile.webViewLink,
                webContentLink: driveFile.webContentLink,
                googleDriveCreatedTime: driveFile.createdTime,
                tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : []
            });

            await material.save();

            // Add material reference to course
            await Course.findByIdAndUpdate(
                req.params.courseId,
                { $push: { materials: material._id } }
            );

            res.status(201).json({
                success: true,
                message: 'Material uploaded successfully to Google Drive',
                data: material
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
);

// @route   DELETE /api/teacher/materials/:materialId
// @desc    Delete material from Google Drive and database
router.delete('/materials/:materialId', async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check if teacher owns this material
        if (material.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete from Google Drive if it has a file ID
        if (material.googleDriveFileId) {
            try {
                await googleDriveService.deleteFile(material.googleDriveFileId);
            } catch (driveError) {
                console.error('Error deleting from Google Drive:', driveError);
                // Continue with database deletion even if Google Drive delete fails
            }
        }

        // Remove from course
        await Course.findByIdAndUpdate(
            material.courseId,
            { $pull: { materials: material._id } }
        );

        await material.deleteOne();

        res.json({
            success: true,
            message: 'Material deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

// @route   GET /api/teacher/courses/:courseId/assignments
// @desc    Get all assignments for a specific course
router.get('/courses/:courseId/assignments', 
    isCourseTeacher,
    async (req, res) => {
        try {
            const assignments = await Assignment.find({ 
                courseId: req.params.courseId 
            }).populate('courseId', 'courseName courseCode');
            
            res.json({
                success: true,
                data: assignments
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   POST /api/teacher/courses/:courseId/assignments
// @desc    Create assignment with Google Drive attachments
router.post('/courses/:courseId/assignments', 
    isCourseTeacher,
    upload.array('attachments', 5),
    handleUploadError,
    async (req, res) => {
        try {
            const attachments = [];
            
            // Upload attachments to Google Drive
            if (req.files && req.files.length > 0) {
                const uploadResult = await googleDriveService.uploadMultipleFiles(
                    req.files,
                    'assignments',
                    { 
                        userId: req.user.id,
                        courseId: req.params.courseId,
                        assignmentTitle: req.body.title 
                    }
                );

                // uploadResult.success contains the array of successfully uploaded files
                if (uploadResult.success && uploadResult.success.length > 0) {
                    uploadResult.success.forEach((driveFile, index) => {
                        // Find the original file that corresponds to this upload
                        const originalFile = req.files.find((f, i) => 
                            f.originalname === driveFile.originalName
                        );
                        
                        attachments.push({
                            googleDriveFileId: driveFile.fileId,
                            fileName: driveFile.fileName,
                            originalFileName: driveFile.originalName,
                            fileType: driveFile.originalName.split('.').pop().toLowerCase(),
                            fileSize: driveFile.fileSize,
                            mimeType: driveFile.mimeType,
                            webViewLink: driveFile.webViewLink,
                            webContentLink: driveFile.webContentLink,
                            uploadedAt: new Date()
                        });
                    });
                }
                
                // Log any failed uploads
                if (uploadResult.failed && uploadResult.failed.length > 0) {
                    console.warn(`${uploadResult.failed.length} file(s) failed to upload to Google Drive`);
                }
            }

            const assignment = new Assignment({
                title: req.body.title,
                description: req.body.description,
                instructions: req.body.instructions,
                courseId: req.params.courseId,
                createdBy: req.user.id,
                maxScore: req.body.maxScore || 100,
                passingScore: req.body.passingScore || 60,
                dueDate: req.body.dueDate,
                availableFrom: req.body.availableFrom || new Date(),
                availableUntil: req.body.availableUntil,
                attachments: attachments,
                allowedFileTypes: req.body.allowedFileTypes ? 
                    req.body.allowedFileTypes.split(',') : ['pdf', 'doc', 'docx'],
                maxFileSize: req.body.maxFileSize || 10 * 1024 * 1024, // 10MB default
                isActive: req.body.isActive !== false
            });

            await assignment.save();

            // Add assignment reference to course
            await Course.findByIdAndUpdate(
                req.params.courseId,
                { $push: { assignments: assignment._id } }
            );

            res.status(201).json({
                success: true,
                message: 'Assignment created successfully with Google Drive attachments',
                data: assignment
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
);

// @route   PUT /api/teacher/assignments/:assignmentId
// @desc    Update assignment (supports file attachments)
router.put('/assignments/:assignmentId', 
    upload.array('attachments', 5),
    handleUploadError,
    async (req, res) => {
        try {
            const assignmentId = req.params.assignmentId;
            
            // Validate assignment ID
            if (!assignmentId || typeof assignmentId === 'object') {
                return res.status(400).json({ message: 'Invalid assignment ID format' });
            }
            
            // Parse form data - handle both JSON and FormData
            let updateData = {};
            
            // If it's FormData with files
            if (req.body && Object.keys(req.body).length > 0) {
                // Handle string fields that might be booleans or numbers
                updateData.title = req.body.title;
                updateData.description = req.body.description;
                updateData.instructions = req.body.instructions;
                updateData.maxScore = req.body.maxScore ? parseInt(req.body.maxScore) : undefined;
                updateData.passingScore = req.body.passingScore ? parseInt(req.body.passingScore) : undefined;
                updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
                updateData.availableFrom = req.body.availableFrom;
                updateData.dueDate = req.body.dueDate;
                updateData.availableUntil = req.body.availableUntil || null;
                updateData.allowedFileTypes = req.body.allowedFileTypes ? req.body.allowedFileTypes.split(',') : undefined;
                updateData.maxFileSize = req.body.maxFileSize ? parseInt(req.body.maxFileSize) : undefined;
                
                // Handle keepAttachments if provided
                let keepAttachmentIds = [];
                if (req.body.keepAttachments) {
                    try {
                        keepAttachmentIds = JSON.parse(req.body.keepAttachments);
                    } catch (e) {
                        keepAttachmentIds = [];
                    }
                }
                
                // Get existing assignment
                const assignment = await Assignment.findById(assignmentId);
                
                if (!assignment) {
                    return res.status(404).json({ message: 'Assignment not found' });
                }
                
                // Check if teacher owns this assignment
                if (assignment.createdBy.toString() !== req.user.id) {
                    return res.status(403).json({ message: 'Not authorized' });
                }
                
                // Filter attachments to keep
                if (keepAttachmentIds.length > 0 && assignment.attachments) {
                    assignment.attachments = assignment.attachments.filter(
                        att => keepAttachmentIds.includes(att.googleDriveFileId)
                    );
                } else if (keepAttachmentIds.length === 0 && req.body.keepAttachments !== undefined) {
                    // If keepAttachments is empty array, remove all attachments
                    // Delete old attachments from Google Drive
                    for (const attachment of assignment.attachments || []) {
                        if (attachment.googleDriveFileId) {
                            try {
                                await googleDriveService.deleteFile(attachment.googleDriveFileId);
                            } catch (err) {
                                console.error('Error deleting attachment:', err);
                            }
                        }
                    }
                    assignment.attachments = [];
                }
                
                // Upload new attachments to Google Drive
                if (req.files && req.files.length > 0) {
                    const uploadResult = await googleDriveService.uploadMultipleFiles(
                        req.files,
                        'assignments',
                        { 
                            userId: req.user.id,
                            courseId: assignment.courseId,
                            assignmentTitle: updateData.title || assignment.title 
                        }
                    );
                    
                    if (uploadResult.success && uploadResult.success.length > 0) {
                        uploadResult.success.forEach((driveFile) => {
                            assignment.attachments.push({
                                googleDriveFileId: driveFile.fileId,
                                fileName: driveFile.fileName,
                                originalFileName: driveFile.originalName,
                                fileType: driveFile.originalName.split('.').pop().toLowerCase(),
                                fileSize: driveFile.fileSize,
                                mimeType: driveFile.mimeType,
                                webViewLink: driveFile.webViewLink,
                                webContentLink: driveFile.webContentLink,
                                uploadedAt: new Date()
                            });
                        });
                    }
                }
                
                // Update text fields
                const updatableFields = ['title', 'description', 'maxScore', 'passingScore',
                                         'dueDate', 'availableUntil', 'instructions', 'isActive', 
                                         'allowedFileTypes', 'maxFileSize', 'availableFrom'];
                
                updatableFields.forEach(field => {
                    if (updateData[field] !== undefined && updateData[field] !== null) {
                        assignment[field] = updateData[field];
                    }
                });
                
                await assignment.save();
                
                return res.json({
                    success: true,
                    message: 'Assignment updated successfully',
                    data: assignment
                });
            } else {
                // Handle regular JSON request (no files)
                const assignment = await Assignment.findById(assignmentId);
                
                if (!assignment) {
                    return res.status(404).json({ message: 'Assignment not found' });
                }
                
                // Check if teacher owns this assignment
                if (assignment.createdBy.toString() !== req.user.id) {
                    return res.status(403).json({ message: 'Not authorized' });
                }
                
                const updatableFields = ['title', 'description', 'maxScore', 'passingScore',
                                         'dueDate', 'availableUntil', 'instructions', 'isActive',
                                         'allowedFileTypes', 'maxFileSize', 'availableFrom'];
                
                updatableFields.forEach(field => {
                    if (req.body[field] !== undefined) {
                        assignment[field] = req.body[field];
                    }
                });
                
                await assignment.save();
                
                return res.json({
                    success: true,
                    message: 'Assignment updated successfully',
                    data: assignment
                });
            }
        } catch (error) {
            console.error(error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid assignment ID format' });
            }
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
);

// @route   DELETE /api/teacher/assignments/:assignmentId
// @desc    Delete an assignment and all its submissions
router.delete('/assignments/:assignmentId', async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Validate assignment ID
        if (!assignmentId || typeof assignmentId === 'object') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if teacher owns this assignment
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all submissions for this assignment
        const submissions = await Submission.find({ assignmentId: assignmentId });
        
        // Delete submission files from Google Drive
        for (const submission of submissions) {
            if (submission.submittedFiles && submission.submittedFiles.length > 0) {
                for (const file of submission.submittedFiles) {
                    if (file.googleDriveFileId) {
                        try {
                            await googleDriveService.deleteFile(file.googleDriveFileId);
                        } catch (driveError) {
                            console.error(`Error deleting submission file ${file.googleDriveFileId}:`, driveError);
                            // Continue with other deletions even if one fails
                        }
                    }
                }
            }
        }
        
        // Delete all submissions from database
        await Submission.deleteMany({ assignmentId: assignmentId });
        
        // Delete assignment attachments from Google Drive
        if (assignment.attachments && assignment.attachments.length > 0) {
            for (const attachment of assignment.attachments) {
                if (attachment.googleDriveFileId) {
                    try {
                        await googleDriveService.deleteFile(attachment.googleDriveFileId);
                    } catch (driveError) {
                        console.error(`Error deleting assignment attachment ${attachment.googleDriveFileId}:`, driveError);
                    }
                }
            }
        }
        
        // Remove assignment reference from course
        await Course.findByIdAndUpdate(
            assignment.courseId,
            { $pull: { assignments: assignment._id } }
        );
        
        // Delete the assignment
        await assignment.deleteOne();

        res.json({
            success: true,
            message: 'Assignment and all associated submissions deleted successfully'
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

// @route   GET /api/teacher/assignments/:assignmentId/submissions
// @desc    Get all submissions for an assignment
router.get('/assignments/:assignmentId/submissions', async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Validate assignment ID
        if (!assignmentId || typeof assignmentId === 'object') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if teacher owns this assignment
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
            .populate('studentId', 'firstName lastName studentId email')
            .populate('grade.gradedBy', 'firstName lastName')
            .sort({ submissionDate: -1 });

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/teacher/submissions/:submissionId/grade
// @desc    Grade a submission
router.post('/submissions/:submissionId/grade', async (req, res) => {
    try {
        const { score, feedback } = req.body;
        const submissionId = req.params.submissionId;
        
        // Validate submission ID
        if (!submissionId || typeof submissionId === 'object') {
            return res.status(400).json({ message: 'Invalid submission ID format' });
        }

        const submission = await Submission.findById(submissionId)
            .populate({
                path: 'assignmentId',
                select: 'maxScore createdBy'
            });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if teacher owns this assignment
        if (submission.assignmentId.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Validate score
        if (score < 0 || score > submission.assignmentId.maxScore) {
            return res.status(400).json({ 
                message: `Score must be between 0 and ${submission.assignmentId.maxScore}` 
            });
        }

        submission.grade = {
            score,
            feedback,
            gradedBy: req.user.id,
            gradedAt: new Date()
        };
        submission.status = 'graded';

        await submission.save();

        res.json({
            success: true,
            message: 'Submission graded successfully',
            data: submission
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid submission ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/assignments/:assignmentId/grading-summary
// @desc    Get grading summary for assignment
router.get('/assignments/:assignmentId/grading-summary', async (req, res) => {
    try {
        const assignmentId = req.params.assignmentId;
        
        // Validate assignment ID
        if (!assignmentId || typeof assignmentId === 'object') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if teacher owns this assignment
        if (assignment.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submissions = await Submission.find({ 
            assignmentId: req.params.assignmentId 
        });

        const summary = {
            totalSubmissions: submissions.length,
            graded: submissions.filter(s => s.status === 'graded').length,
            pending: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
        };

        // Calculate statistics
        const gradedSubmissions = submissions.filter(s => s.grade && s.grade.score !== undefined);
        if (gradedSubmissions.length > 0) {
            const scores = gradedSubmissions.map(s => s.grade.score);
            summary.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            summary.highestScore = Math.max(...scores);
            summary.lowestScore = Math.min(...scores);
        }

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid assignment ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/teacher/courses/:courseId/announcements
// @desc    Create course announcement
router.post('/courses/:courseId/announcements', 
    isCourseTeacher,
    async (req, res) => {
        try {
            const announcement = new Announcement({
                title: req.body.title,
                content: req.body.content,
                author: req.user.id,
                targetAudience: 'course',
                courseId: req.params.courseId,
                isPinned: req.body.isPinned || false,
                priority: req.body.priority || 'normal'
            });

            await announcement.save();

            // Add announcement reference to course
            await Course.findByIdAndUpdate(
                req.params.courseId,
                { $push: { announcements: announcement._id } }
            );

            res.status(201).json({
                success: true,
                message: 'Announcement created successfully',
                data: announcement
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET /api/teacher/announcements
// @desc    Get all announcements for teacher's courses
router.get('/announcements', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id });
        const courseIds = courses.map(c => c._id);

        const announcements = await Announcement.find({
            $or: [
                { targetAudience: { $in: ['all', 'teachers'] } },
                { courseId: { $in: courseIds } }
            ]
        })
        .populate('author', 'firstName lastName')
        .populate('courseId', 'courseName courseCode')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/teacher/stats
// @desc    Get teacher dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id });
        const courseIds = courses.map(c => c._id);

        const assignments = await Assignment.find({ courseId: { $in: courseIds } });
        const assignmentIds = assignments.map(a => a._id);

        const [totalCourses, totalStudents, pendingGrading, upcomingDeadlines] = await Promise.all([
            courses.length,
            User.countDocuments({ courses: { $in: courseIds } }),
            Submission.countDocuments({
                assignmentId: { $in: assignmentIds },
                status: { $in: ['submitted', 'late'] }
            }),
            Assignment.countDocuments({
                courseId: { $in: courseIds },
                dueDate: { $gt: new Date() },
                isActive: true
            })
        ]);

        // Get recent submissions
        const recentSubmissions = await Submission.find({
            assignmentId: { $in: assignmentIds }
        })
        .populate('studentId', 'firstName lastName')
        .populate('assignmentId', 'title')
        .sort({ submissionDate: -1 })
        .limit(10);

        res.json({
            success: true,
            data: {
                totalCourses,
                totalStudents,
                pendingGrading,
                upcomingDeadlines,
                recentSubmissions
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;