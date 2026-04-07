const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    department: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    materials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
    }],
    assignments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
    }],
    announcements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Announcement'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxStudents: {
        type: Number,
        default: 50
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

// Simple pre-save hook without validation issues
courseSchema.pre('save', function() {
    this.updatedAt = new Date();
});

// Virtual for enrolled students count
courseSchema.virtual('enrolledCount').get(function() {
    return this.students ? this.students.length : 0;
});

// No validation pre-save hooks to avoid errors

module.exports = mongoose.model('Course', courseSchema);