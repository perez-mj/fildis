// backend/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxScore: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    passingScore: {
        type: Number,
        required: true,
        min: 1
    },
    dueDate: {
        type: Date,
        required: true
    },
    availableFrom: {
        type: Date,
        default: Date.now
    },
    availableUntil: {
        type: Date,
        required: false
    },
    instructions: {
        type: String
    },
    attachments: [{
        googleDriveFileId: String,
        fileName: String,
        originalFileName: String,
        fileType: String,
        fileSize: Number,
        mimeType: String,
        webViewLink: String,
        webContentLink: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    allowedFileTypes: [{
        type: String,
        enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'zip', 'py', 'js', 'java', 'rar']
    }],
    maxFileSize: {
        type: Number,
        default: 10 * 1024 * 1024
    },
    isActive: {
        type: Boolean,
        default: true
    },
    submissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save - NO next() parameter
assignmentSchema.pre('save', function() {
    this.updatedAt = new Date();
});

// Validate dates - NO next() parameter, just throw errors
assignmentSchema.pre('save', function() {
    // Only validate if required dates exist
    if (!this.dueDate) {
        throw new Error('Due date is required');
    }
    
    if (this.availableFrom && this.dueDate <= this.availableFrom) {
        throw new Error('Due date must be after available from date');
    }
    
    // Validate availableUntil only if it exists
    if (this.availableUntil) {
        if (this.availableFrom && this.availableUntil <= this.availableFrom) {
            throw new Error('Available until must be after available from');
        }
        if (this.dueDate > this.availableUntil) {
            throw new Error('Due date must be before or equal to available until');
        }
    }
});

// Virtual for checking if assignment is active
assignmentSchema.virtual('isOpen').get(function() {
    const now = new Date();
    const availableFrom = this.availableFrom || new Date(0);
    const availableUntil = this.availableUntil || new Date(8640000000000000);
    return now >= availableFrom && now <= availableUntil;
});

// Virtual for checking if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
    return new Date() > this.dueDate;
});

module.exports = mongoose.model('Assignment', assignmentSchema);