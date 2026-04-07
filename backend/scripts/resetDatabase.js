const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const User = require('../models/User');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Announcement = require('../models/Announcement');

const resetDatabase = async () => {
    try {
        await connectDB();
        
        console.log('🗑️  Resetting database...');
        
        await User.deleteMany({});
        await Course.deleteMany({});
        await Material.deleteMany({});
        await Assignment.deleteMany({});
        await Submission.deleteMany({});
        await Announcement.deleteMany({});
        
        console.log('✅ Database reset completed!');
        console.log('💡 Run npm run init-db to reinitialize with sample data');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDatabase();