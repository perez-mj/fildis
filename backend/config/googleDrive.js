// backend/config/googleDrive.js
const { google } = require('googleapis');
const path = require('path');

// Initialize Google Drive client with service account
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../google-drive-credentials.json'), // Fixed typo
    scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth });

// Folder IDs from environment variables
const FOLDER_IDS = {
    materials: process.env.GOOGLE_DRIVE_MATERIALS_FOLDER_ID,
    assignments: process.env.GOOGLE_DRIVE_ASSIGNMENTS_FOLDER_ID,
    submissions: process.env.GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID,
    profiles: process.env.GOOGLE_DRIVE_PROFILES_FOLDER_ID,
    announcements: process.env.GOOGLE_DRIVE_ANNOUNCEMENTS_FOLDER_ID,
    other: process.env.GOOGLE_DRIVE_OTHER_FOLDER_ID
};

// Validate folder IDs
Object.entries(FOLDER_IDS).forEach(([key, value]) => {
    if (!value) {
        console.warn(`Warning: GOOGLE_DRIVE_${key.toUpperCase()}_FOLDER_ID is not set in .env`);
    }
});

module.exports = { drive, FOLDER_IDS };