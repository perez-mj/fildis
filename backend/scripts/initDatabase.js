const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Announcement = require('../models/Announcement');

// Connect to MongoDB
const connectDB = require('../config/db');

// Sample data
const sampleData = {
    users: [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@lms.com',
            password: 'admin123',
            role: 'admin',
            isActive: true
        },
        {
            firstName: 'John',
            lastName: 'Smith',
            email: 'teacher@lms.com',
            password: 'teacher123',
            role: 'teacher',
            department: 'Computer Science',
            specialization: ['Web Development', 'Database Systems'],
            isActive: true
        },
        {
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'student@lms.com',
            password: 'student123',
            role: 'student',
            studentId: 'STU2024001',
            enrollmentDate: new Date(),
            isActive: true
        },
        {
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'student2@lms.com',
            password: 'student123',
            role: 'student',
            studentId: 'STU2024002',
            enrollmentDate: new Date(),
            isActive: true
        }
    ],
    courses: [
        {
            courseCode: 'CS101',
            courseName: 'Introduction to Programming',
            description: 'Learn the fundamentals of programming using Python',
            credits: 3,
            department: 'Computer Science',
            semester: 1,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-05-15'),
            maxStudents: 50,
            isActive: true
        },
        {
            courseCode: 'CS201',
            courseName: 'Data Structures and Algorithms',
            description: 'Advanced concepts in data structures and algorithm design',
            credits: 4,
            department: 'Computer Science',
            semester: 2,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-05-15'),
            maxStudents: 40,
            isActive: true
        },
        {
            courseCode: 'WEB301',
            courseName: 'Web Development',
            description: 'Full-stack web development with MERN stack',
            credits: 3,
            department: 'Computer Science',
            semester: 3,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-05-15'),
            maxStudents: 45,
            isActive: true
        }
    ],
    announcements: [
        {
            title: 'Welcome to the New Semester!',
            content: 'Welcome to the Spring 2024 semester. Please check your course schedules and materials.',
            targetAudience: 'all',
            priority: 'high',
            isPinned: true,
            isActive: true
        },
        {
            title: 'Important: System Maintenance',
            content: 'The LMS will be down for maintenance on Sunday from 2-4 AM.',
            targetAudience: 'all',
            priority: 'normal',
            isActive: true
        }
    ]
};

// Clear existing data
const clearDatabase = async () => {
    console.log('Clearing existing data...');
    try {
        await User.deleteMany({});
        await Course.deleteMany({});
        await Material.deleteMany({});
        await Assignment.deleteMany({});
        await Submission.deleteMany({});
        await Announcement.deleteMany({});
        console.log('✅ Database cleared');
    } catch (error) {
        console.log('Error clearing database:', error.message);
    }
};

// Insert sample data
const insertSampleData = async () => {
    console.log('Inserting sample data...');
    
    try {
        // Hash passwords for users
        const usersWithHashedPasswords = await Promise.all(
            sampleData.users.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return { ...user, password: hashedPassword };
            })
        );
        
        // Insert users
        const users = await User.insertMany(usersWithHashedPasswords);
        console.log(`✅ ${users.length} users inserted`);
        
        // Find users by role
        const teacher = users.find(u => u.role === 'teacher');
        const student1 = users.find(u => u.email === 'student@lms.com');
        const student2 = users.find(u => u.email === 'student2@lms.com');
        const admin = users.find(u => u.role === 'admin');
        
        if (!teacher || !student1 || !student2 || !admin) {
            throw new Error('Required users not found after insertion');
        }
        
        // Insert courses with teacher assignment
        const courses = [];
        for (const courseData of sampleData.courses) {
            const course = new Course({
                ...courseData,
                teacher: teacher._id,
                students: [student1._id, student2._id]
            });
            const savedCourse = await course.save();
            courses.push(savedCourse);
        }
        console.log(`✅ ${courses.length} courses inserted`);
        
        // Update students with enrolled courses
        await User.findByIdAndUpdate(student1._id, {
            $set: { courses: courses.map(c => c._id) }
        });
        await User.findByIdAndUpdate(student2._id, {
            $set: { courses: courses.map(c => c._id) }
        });
        console.log('✅ Students enrolled in courses');
        
        // Insert announcements
        const announcements = [];
        for (const announcementData of sampleData.announcements) {
            const announcement = new Announcement({
                ...announcementData,
                author: admin._id
            });
            const savedAnnouncement = await announcement.save();
            announcements.push(savedAnnouncement);
        }
        console.log(`✅ ${announcements.length} announcements inserted`);
        
        // Add announcements to courses (for course-specific announcements)
        for (const course of courses) {
            const courseAnnouncement = new Announcement({
                title: `${course.courseName} - Course Introduction`,
                content: `Welcome to ${course.courseName}! Please review the syllabus and course materials.`,
                author: teacher._id,
                targetAudience: 'course',
                courseId: course._id,
                priority: 'high',
                isActive: true
            });
            const savedCourseAnnouncement = await courseAnnouncement.save();
            
            course.announcements.push(savedCourseAnnouncement._id);
            await course.save();
        }
        console.log('✅ Course announcements added');
        
        return { users, courses };
    } catch (error) {
        console.error('Error inserting sample data:', error);
        throw error;
    }
};

// Create sample materials
const createSampleMaterials = async (courses) => {
    console.log('Creating sample materials...');
    
    try {
        const materialsData = [
            {
                title: 'Course Syllabus',
                description: 'Complete course syllabus and schedule',
                fileType: 'pdf',
                isPublic: true,
                tags: ['syllabus', 'important']
            },
            {
                title: 'Week 1 - Introduction Slides',
                description: 'Introduction to the course and basic concepts',
                fileType: 'ppt',
                tags: ['lecture', 'week1']
            },
            {
                title: 'Programming Basics - Video Tutorial',
                description: 'Video tutorial on programming fundamentals',
                fileType: 'video',
                tags: ['video', 'tutorial']
            }
        ];
        
        for (const course of courses) {
            for (const materialData of materialsData) {
                const material = new Material({
                    ...materialData,
                    courseId: course._id,
                    uploadedBy: course.teacher,
                    googleDriveFileId: `sample_${Date.now()}_${Math.random()}_${Math.random()}_${Math.random()}`,
                    fileName: materialData.title.replace(/\s/g, '_').toLowerCase(),
                    originalFileName: `${materialData.title}.${materialData.fileType}`,
                    fileSize: Math.floor(Math.random() * 5000000) + 100000,
                    mimeType: materialData.fileType === 'pdf' ? 'application/pdf' : 
                             materialData.fileType === 'ppt' ? 'application/vnd.ms-powerpoint' : 
                             'video/mp4',
                    webViewLink: `https://drive.google.com/file/d/sample_${Date.now()}/view`,
                    webContentLink: `https://drive.google.com/uc?id=sample_${Date.now()}`,
                    googleDriveCreatedTime: new Date()
                });
                await material.save();
                
                course.materials.push(material._id);
            }
            await course.save();
        }
        console.log('✅ Sample materials created');
    } catch (error) {
        console.error('Error creating materials:', error);
        throw error;
    }
};

// Create sample assignments
const createSampleAssignments = async (courses) => {
    console.log('Creating sample assignments...');
    
    try {
        const now = new Date();
        const assignmentsData = [
            {
                title: 'Programming Assignment 1',
                description: 'Create a simple calculator program',
                maxScore: 100,
                passingScore: 60,
                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                availableFrom: now,
                availableUntil: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
                instructions: 'Create a console-based calculator that can perform basic arithmetic operations.',
                allowedFileTypes: ['py', 'js', 'java'],
                maxFileSize: 5 * 1024 * 1024,
                isActive: true
            },
            {
                title: 'Quiz 1',
                description: 'Multiple choice quiz on programming concepts',
                maxScore: 50,
                passingScore: 30,
                dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                availableFrom: now,
                availableUntil: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
                instructions: 'Answer all questions. Time limit: 30 minutes.',
                allowedFileTypes: ['txt', 'pdf'],
                maxFileSize: 2 * 1024 * 1024,
                isActive: true
            },
            {
                title: 'Final Project',
                description: 'Complete a full-stack web application',
                maxScore: 200,
                passingScore: 120,
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                availableFrom: now,
                availableUntil: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
                instructions: 'Build a web application with user authentication and database integration.',
                allowedFileTypes: ['zip', 'rar'],
                maxFileSize: 50 * 1024 * 1024,
                isActive: true
            }
        ];
        
        for (const course of courses) {
            for (const assignmentData of assignmentsData) {
                const assignment = new Assignment({
                    ...assignmentData,
                    courseId: course._id,
                    createdBy: course.teacher
                });
                await assignment.save();
                
                course.assignments.push(assignment._id);
            }
            await course.save();
        }
        console.log('✅ Sample assignments created');
    } catch (error) {
        console.error('Error creating assignments:', error);
        throw error;
    }
};

// Create database indexes
const createIndexes = async () => {
    console.log('Creating database indexes...');
    
    try {
        // Users indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ studentId: 1 }, { sparse: true, unique: true });
        console.log('✅ Users indexes created');
        
        // Courses indexes
        await Course.collection.createIndex({ courseCode: 1 }, { unique: true });
        await Course.collection.createIndex({ teacher: 1 });
        await Course.collection.createIndex({ students: 1 });
        console.log('✅ Courses indexes created');
        
        // Materials indexes
        await Material.collection.createIndex({ courseId: 1, createdAt: -1 });
        await Material.collection.createIndex({ googleDriveFileId: 1 }, { unique: true });
        console.log('✅ Materials indexes created');
        
        // Assignments indexes
        await Assignment.collection.createIndex({ courseId: 1, dueDate: 1 });
        await Assignment.collection.createIndex({ createdBy: 1 });
        console.log('✅ Assignments indexes created');
        
        // Submissions indexes
        await Submission.collection.createIndex({ assignmentId: 1, studentId: 1 }, { unique: true });
        await Submission.collection.createIndex({ status: 1 });
        console.log('✅ Submissions indexes created');
        
        // Announcements indexes
        await Announcement.collection.createIndex({ targetAudience: 1, createdAt: -1 });
        await Announcement.collection.createIndex({ courseId: 1 });
        console.log('✅ Announcements indexes created');
    } catch (error) {
        console.log('Warning: Some indexes may already exist:', error.message);
    }
};

// Run initialization
const initializeDatabase = async () => {
    try {
        console.log('🚀 Starting database initialization...\n');
        
        // Connect to database
        await connectDB();
        console.log('✅ Connected to MongoDB Atlas\n');
        
        // Check if data already exists
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('⚠️  Database already contains data. Skipping initialization...');
            console.log('📊 Current Database Statistics:');
            console.log(`   - Users: ${await User.countDocuments()}`);
            console.log(`   - Courses: ${await Course.countDocuments()}`);
            console.log(`   - Materials: ${await Material.countDocuments()}`);
            console.log(`   - Assignments: ${await Assignment.countDocuments()}`);
            console.log(`   - Submissions: ${await Submission.countDocuments()}`);
            console.log(`   - Announcements: ${await Announcement.countDocuments()}`);
            
            console.log('\n🔑 Test Credentials:');
            console.log('   Admin:');
            console.log('   - Email: admin@lms.com');
            console.log('   - Password: admin123');
            console.log('\n   Teacher:');
            console.log('   - Email: teacher@lms.com');
            console.log('   - Password: teacher123');
            console.log('\n   Student:');
            console.log('   - Email: student@lms.com');
            console.log('   - Password: student123');
            
            await mongoose.connection.close();
            return;
        }
        
        // Clear existing data
        await clearDatabase();
        
        // Insert sample data
        const { users, courses } = await insertSampleData();
        
        // Create sample materials
        await createSampleMaterials(courses);
        
        // Create sample assignments
        await createSampleAssignments(courses);
        
        // Create indexes after data is inserted
        await createIndexes();
        
        console.log('\n🎉 Database initialization completed successfully!\n');
        console.log('📊 Database Statistics:');
        console.log(`   - Users: ${await User.countDocuments()}`);
        console.log(`   - Courses: ${await Course.countDocuments()}`);
        console.log(`   - Materials: ${await Material.countDocuments()}`);
        console.log(`   - Assignments: ${await Assignment.countDocuments()}`);
        console.log(`   - Submissions: ${await Submission.countDocuments()}`);
        console.log(`   - Announcements: ${await Announcement.countDocuments()}`);
        
        console.log('\n🔑 Test Credentials:');
        console.log('   Admin:');
        console.log('   - Email: admin@lms.com');
        console.log('   - Password: admin123');
        console.log('\n   Teacher:');
        console.log('   - Email: teacher@lms.com');
        console.log('   - Password: teacher123');
        console.log('\n   Student:');
        console.log('   - Email: student@lms.com');
        console.log('   - Password: student123');
        
        console.log('\n📝 Next Steps:');
        console.log('   1. Start your server: npm run dev');
        console.log('   2. Test authentication with the credentials above');
        console.log('   3. Configure Google Drive integration with your folder IDs');
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Could not connect to MongoDB. Please check your MONGO_URI in .env file');
        }
        if (error.name === 'MongoServerError' && error.code === 11000) {
            console.error('   Duplicate key error. This might be because the database already has data.');
            console.error('   Try running: npm run reset-db first');
        }
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Process terminated. Closing database connection...');
    mongoose.connection.close(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
    });
});

// Run the initialization
initializeDatabase();