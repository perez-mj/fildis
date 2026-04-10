// backend/models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedFiles: [{
        // Google Drive specific fields
        googleDriveFileId: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        originalFileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        webViewLink: String,
        webContentLink: String,
        // Keep original fields for backward compatibility
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: {
        type: String,
        trim: true
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['submitted', 'late', 'graded', 'returned'],
        default: 'submitted'
    },
    grade: {
        score: {
            type: Number,
            min: 0
        },
        feedback: String,
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date
    },
    isLate: {
        type: Boolean,
        default: false
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    ipAddress: String,
    userAgent: String,
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

// Ensure one submission per student per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Update timestamp on save - removed 'next' parameter
submissionSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

// Check if submission is late - async pre-save hook
submissionSchema.pre('save', async function() {
    if (this.isNew) {
        const Assignment = mongoose.model('Assignment');
        const assignment = await Assignment.findById(this.assignmentId);
        if (assignment && this.submissionDate > assignment.dueDate) {
            this.isLate = true;
            this.status = 'late';
        }
    }
});

// Method to check if submission can be graded
submissionSchema.methods.canBeGraded = function() {
    return this.status === 'submitted' || this.status === 'late';
};

// Method to get Google Drive file IDs
submissionSchema.methods.getGoogleDriveFileIds = function() {
    return this.submittedFiles.map(file => file.googleDriveFileId).filter(id => id);
};

// Method to check if submission has files
submissionSchema.methods.hasFiles = function() {
    return this.submittedFiles && this.submittedFiles.length > 0;
};

// Static method to find submissions by Google Drive file ID
submissionSchema.statics.findByGoogleDriveFileId = async function(fileId) {
    return this.findOne({
        'submittedFiles.googleDriveFileId': fileId
    });
};

module.exports = mongoose.model('Submission', submissionSchema);