// backend/models/Material.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'video', 'link', 'other'],
        required: true
    },
    // Google Drive specific fields
    googleDriveFileId: {
        type: String,
        required: true,
        unique: true
    },
    fileName: {
        type: String,
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number, // in bytes
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    webViewLink: {
        type: String,
        required: true
    },
    webContentLink: {
        type: String,
        required: true
    },
    googleDriveCreatedTime: {
        type: Date
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    downloads: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    aiSummary: {
        summary: { type: String, default: null },
        generatedAt: { type: Date, default: null },
        model: { type: String, default: null },
        source: { type: String, default: null },
        documentTitle: { type: String, default: null },
        contentLength: { type: Number, default: null },
        isPlaceholder: { type: Boolean, default: false },
        detectedLanguage: { type: String, enum: ['english', 'filipino'], default: 'english' } // ADD THIS
    },

    aiReviewer: {
        questions: [{
            id: Number,
            type: { type: String, enum: ['multiple_choice', 'true_false', 'short_answer'] },
            question: String,
            options: [String],
            correctAnswer: mongoose.Schema.Types.Mixed,
            explanation: String
        }],
        summary: { type: String, default: null },
        studyTips: [String],
        generatedAt: { type: Date, default: null },
        model: { type: String, default: null },
        settings: {
            numQuestions: { type: Number, default: 10 },
            difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
        },
        contentLength: { type: Number, default: null },
        isPlaceholder: { type: Boolean, default: false },
        detectedLanguage: { type: String, enum: ['english', 'filipino'], default: 'english' } // ADD THIS
    },
    
    aiFeaturesEnabled: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
materialSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Material', materialSchema);