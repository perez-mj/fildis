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
materialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Material', materialSchema);