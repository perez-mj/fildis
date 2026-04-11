// backend/config/googleDrive.js
const { google } = require('googleapis');
const oAuthClient = require('./googleOAuth');

let drive;
let FOLDER_IDS;

// Initialize Drive client
async function initializeDrive() {
    try {
        const authClient = await oAuthClient.initialize();
        drive = google.drive({ 
            version: 'v3', 
            auth: authClient 
        });
        
        // Folder IDs from environment variables
        FOLDER_IDS = {
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
                console.warn(`⚠️ Warning: GOOGLE_DRIVE_${key.toUpperCase()}_FOLDER_ID is not set`);
            }
        });
        
        return { drive, FOLDER_IDS };
    } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
        throw error;
    }
}

module.exports = { initializeDrive, drive: () => drive, FOLDER_IDS: () => FOLDER_IDS };