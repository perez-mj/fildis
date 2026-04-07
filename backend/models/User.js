// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        required: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // ✅ Add refresh token field
    refreshToken: {
        type: String,
        default: null
    },
    // Teacher specific fields
    department: {
        type: String,
        required: function() { return this.role === 'teacher'; }
    },
    specialization: [String],
    // Student specific fields
    studentId: {
        type: String,
        unique: true,
        sparse: true,
        required: function() { return this.role === 'student'; }
    },
    enrollmentDate: {
        type: Date,
        required: function() { return this.role === 'student'; }
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, {
    timestamps: true
});

// ✅ FIXED: No 'next' parameter with async/await
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken; // Don't send refresh token in responses
    return user;
};

module.exports = mongoose.model('User', userSchema);