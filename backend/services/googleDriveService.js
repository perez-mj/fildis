// backend/services/googleDriveService.js
const stream = require('stream');
const mime = require('mime-types');
const { initializeDrive, drive: getDrive, FOLDER_IDS: getFolderIds } = require('../config/googleDrive');

class GoogleDriveService {
    constructor() {
        this.initialized = false;
        this.drive = null;
        this.FOLDER_IDS = null;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            const { drive, FOLDER_IDS } = await initializeDrive();
            this.drive = drive;
            this.FOLDER_IDS = FOLDER_IDS;
            this.initialized = true;
        }
    }

    // Upload file to Google Drive
    async uploadFile(file, folderType, metadata = {}) {
        try {
            await this.ensureInitialized();
            
            const folderId = this.FOLDER_IDS[folderType] || this.FOLDER_IDS.other;
            
            if (!folderId) {
                throw new Error(`Folder ID not configured for type: ${folderType}`);
            }

            // Create a readable stream from the file buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
            const fileName = `${timestamp}-${sanitizedName}`;

            // Upload to Google Drive
            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [folderId],
                    description: JSON.stringify({
                        originalName: file.originalname,
                        uploadedBy: metadata.userId || 'system',
                        uploadedAt: new Date().toISOString(),
                        ...metadata
                    }),
                    mimeType: file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream'
                },
                media: {
                    mimeType: file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream',
                    body: bufferStream
                },
                fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
                supportsAllDrives: true
            });

            // Make file accessible (optional)
            try {
                await this.drive.permissions.create({
                    fileId: response.data.id,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone'
                    },
                    supportsAllDrives: true
                });
            } catch (permError) {
                console.warn('Could not set public permission:', permError.message);
                // Not fatal - file still uploaded
            }

            return {
                success: true,
                fileId: response.data.id,
                fileName: response.data.name,
                originalName: file.originalname,
                mimeType: response.data.mimeType,
                fileSize: file.size,
                webViewLink: response.data.webViewLink,
                webContentLink: response.data.webContentLink,
                createdTime: response.data.createdTime
            };
        } catch (error) {
            console.error('Google Drive upload error:', error);
            throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(files, folderType, metadata = {}) {
        const uploadPromises = files.map(file => this.uploadFile(file, folderType, metadata));
        const results = await Promise.allSettled(uploadPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
        
        return {
            success: successful,
            failed: failed,
            totalSuccess: successful.length,
            totalFailed: failed.length
        };
    }

    // Delete file from Google Drive
    async deleteFile(fileId) {
        try {
            await this.ensureInitialized();
            
            await this.drive.files.delete({
                fileId: fileId,
                supportsAllDrives: true
            });
            return { success: true, fileId };
        } catch (error) {
            console.error('Google Drive delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    // Get file metadata
    async getFileMetadata(fileId) {
        try {
            await this.ensureInitialized();
            
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, description',
                supportsAllDrives: true
            });
            
            // Parse description if it exists
            let metadata = {};
            if (response.data.description) {
                try {
                    metadata = JSON.parse(response.data.description);
                } catch (e) {
                    metadata = { raw: response.data.description };
                }
            }
            
            return { ...response.data, metadata };
        } catch (error) {
            console.error('Google Drive metadata error:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    // List files in a folder
    async listFiles(folderType, query = '', options = {}) {
        try {
            await this.ensureInitialized();
            
            const folderId = this.FOLDER_IDS[folderType];
            
            if (!folderId) {
                throw new Error(`Folder ID not configured for type: ${folderType}`);
            }

            let q = `'${folderId}' in parents and trashed=false`;
            if (query) {
                q += ` and name contains '${query}'`;
            }
            
            if (options.mimeType) {
                q += ` and mimeType = '${options.mimeType}'`;
            }

            const response = await this.drive.files.list({
                q: q,
                fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, description)',
                orderBy: options.orderBy || 'createdTime desc',
                pageSize: options.pageSize || 100,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            return response.data.files;
        } catch (error) {
            console.error('Google Drive list error:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    // Create folder if needed
    async createFolder(folderName, parentFolderId = 'root') {
        try {
            await this.ensureInitialized();
            
            const response = await this.drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId]
                },
                fields: 'id, name',
                supportsAllDrives: true
            });
            
            console.log(`📁 Created folder: ${folderName} (${response.data.id})`);
            return response.data;
        } catch (error) {
            console.error('Google Drive folder creation error:', error);
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }

    // Download file
    async downloadFile(fileId) {
        try {
            await this.ensureInitialized();
            
            const response = await this.drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );
            
            return response.data;
        } catch (error) {
            console.error('Google Drive download error:', error);
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }

    // Get direct download URL
    async getDownloadUrl(fileId) {
        try {
            await this.ensureInitialized();
            
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'webContentLink',
                supportsAllDrives: true
            });
            
            return response.data.webContentLink;
        } catch (error) {
            console.error('Failed to get download URL:', error);
            throw error;
        }
    }
}

module.exports = new GoogleDriveService();