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
        required: true
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

// Update timestamp on save
assignmentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Validate dates
assignmentSchema.pre('save', function(next) {
    if (this.dueDate && this.availableFrom && this.availableUntil) {
        if (this.dueDate <= this.availableFrom) {
            return next(new Error('Due date must be after available from date'));
        }
        if (this.availableUntil <= this.availableFrom) {
            return next(new Error('Available until must be after available from'));
        }
        if (this.dueDate > this.availableUntil) {
            return next(new Error('Due date must be before or equal to available until'));
        }
    }
    next();
});

// Virtual for checking if assignment is active
assignmentSchema.virtual('isOpen').get(function() {
    const now = new Date();
    return now >= this.availableFrom && now <= this.availableUntil;
});

// Virtual for checking if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
    return new Date() > this.dueDate;
});

module.exports = mongoose.model('Assignment', assignmentSchema);