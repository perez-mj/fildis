const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'teachers', 'admins', 'course'],
        default: 'all'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: function() {
            return this.targetAudience === 'course';
        }
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String
    }],
    expiresAt: {
        type: Date,
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
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
announcementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Auto-expire announcements
announcementSchema.methods.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
};

// Virtual for unread count
announcementSchema.virtual('unreadCount').get(function() {
    // This would need to be calculated based on target audience
    return 0;
});

module.exports = mongoose.model('Announcement', announcementSchema);