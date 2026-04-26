// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const Course = require('../models/Course');
const geminiService = require('../services/geminiService');
const googleDriveService = require('../services/googleDriveService');
const { protect } = require('../middleware/auth');

// Helper to check access
async function hasAccess(material, userId, userRole) {
    if (userRole === 'admin') return true;
    
    const course = await Course.findOne({
        _id: material.courseId,
        $or: [{ students: userId }, { teacher: userId }]
    });
    
    return !!course;
}

// GET summary - Extract content from Google Drive first
router.get('/materials/:materialId/summary', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }
        
        const authorized = await hasAccess(material, req.user.id, req.user.role);
        if (!authorized) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Check cache
        if (material.aiSummary && material.aiSummary.summary && !material.aiSummary.isPlaceholder) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (new Date(material.aiSummary.generatedAt) > thirtyDaysAgo) {
                return res.json({ success: true, data: material.aiSummary, cached: true });
            }
        }
        
        // Verify file access and extract content
        const accessInfo = await googleDriveService.verifyAIAccess(material.googleDriveFileId);
        
        if (!accessInfo.canAccess) {
            return res.status(400).json({
                success: false,
                message: 'Cannot access file content',
                solution: accessInfo.solution || 'Please ensure the file is shared publicly and contains extractable text'
            });
        }
        
        if (!accessInfo.isExtractable) {
            return res.status(400).json({
                success: false,
                message: 'File type does not support text extraction',
                solution: accessInfo.solution || 'Please upload PDF or Word documents for AI features'
            });
        }
        
        // Extract actual content
        console.log(`📄 Extracting content from: ${material.fileName}`);
        const extractionResult = await googleDriveService.getExtractableContent(
            material.googleDriveFileId,
            material.mimeType
        );
        
        if (!extractionResult.success || !extractionResult.content) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract text content from this file',
                error: extractionResult.error,
                solution: 'Make sure your file contains selectable text (not scanned images or encrypted PDFs)'
            });
        }
        
        console.log(`✅ Extracted ${extractionResult.content.length} characters`);
        
        // Generate summary using content
        const summary = await geminiService.generateSummaryFromContent(
            extractionResult.content,
            material.title,
            { mimeType: material.mimeType, size: material.fileSize }
        );
        
        // Cache the summary
        material.aiSummary = summary;
        await material.save();
        
        res.json({ success: true, data: summary, cached: false });
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            suggestion: 'Make sure your file contains extractable text (not scanned images or encrypted PDFs)'
        });
    }
});

// GET reviewer using extracted content
router.get('/materials/:materialId/reviewer', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }
        
        const authorized = await hasAccess(material, req.user.id, req.user.role);
        if (!authorized) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Check cache
        if (material.aiReviewer && material.aiReviewer.questions && material.aiReviewer.questions.length > 0) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (new Date(material.aiReviewer.generatedAt) > thirtyDaysAgo) {
                return res.json({ success: true, data: material.aiReviewer, cached: true });
            }
        }
        
        // Verify file access
        const accessInfo = await googleDriveService.verifyAIAccess(material.googleDriveFileId);
        
        if (!accessInfo.canAccess || !accessInfo.isExtractable) {
            return res.status(400).json({
                success: false,
                message: 'Cannot access file content or file type not supported'
            });
        }
        
        // Extract content
        const extractionResult = await googleDriveService.getExtractableContent(
            material.googleDriveFileId,
            material.mimeType
        );
        
        if (!extractionResult.success || !extractionResult.content) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract text content from this file'
            });
        }
        
        const { numQuestions = 10, difficulty = 'medium' } = req.query;
        
        const reviewer = await geminiService.generateReviewerFromContent(
            extractionResult.content,
            material.title,
            { numQuestions: parseInt(numQuestions), difficulty }
        );
        
        material.aiReviewer = reviewer;
        await material.save();
        
        res.json({ success: true, data: reviewer, cached: false });
    } catch (error) {
        console.error('Reviewer error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper endpoint to check file accessibility
router.get('/materials/:materialId/check-access', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }
        
        const accessInfo = await googleDriveService.verifyAIAccess(material.googleDriveFileId);
        
        res.json({
            success: true,
            data: accessInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// CHANGED: Now STUDENTS can regenerate summaries (not teachers)
router.post('/materials/:materialId/regenerate-summary', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }
        
        // Allow students who have access to regenerate
        const hasCourseAccess = await hasAccess(material, req.user.id, req.user.role);
        if (!hasCourseAccess) {
            return res.status(403).json({ success: false, message: 'You do not have access to this material' });
        }
        
        const extractionResult = await googleDriveService.getExtractableContent(
            material.googleDriveFileId,
            material.mimeType
        );
        
        if (!extractionResult.success) {
            return res.status(400).json({ success: false, error: 'Could not extract content' });
        }
        
        const summary = await geminiService.generateSummaryFromContent(
            extractionResult.content,
            material.title
        );
        
        material.aiSummary = summary;
        await material.save();
        
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Regenerate summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// CHANGED: Now STUDENTS can regenerate reviewers (not teachers)
router.post('/materials/:materialId/regenerate-reviewer', protect, async (req, res) => {
    try {
        const material = await Material.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }
        
        // Allow students who have access to regenerate
        const hasCourseAccess = await hasAccess(material, req.user.id, req.user.role);
        if (!hasCourseAccess) {
            return res.status(403).json({ success: false, message: 'You do not have access to this material' });
        }
        
        const extractionResult = await googleDriveService.getExtractableContent(
            material.googleDriveFileId,
            material.mimeType
        );
        
        if (!extractionResult.success) {
            return res.status(400).json({ success: false, error: 'Could not extract content' });
        }
        
        const { numQuestions = 10, difficulty = 'medium' } = req.body;
        
        const reviewer = await geminiService.generateReviewerFromContent(
            extractionResult.content,
            material.title,
            { numQuestions, difficulty }
        );
        
        material.aiReviewer = reviewer;
        await material.save();
        
        res.json({ success: true, data: reviewer });
    } catch (error) {
        console.error('Regenerate reviewer error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;