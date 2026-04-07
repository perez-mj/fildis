// backend/services/googleDriveService.js
const { drive, FOLDER_IDS } = require('../config/googleDrive');
const stream = require('stream');
const mime = require('mime-types');

class GoogleDriveService {
    // Upload file to Google Drive
    async uploadFile(file, folderType, metadata = {}) {
        try {
            const folderId = FOLDER_IDS[folderType] || FOLDER_IDS.other;
            
            if (!folderId) {
                throw new Error(`Folder ID not configured for type: ${folderType}`);
            }

            // Create a readable stream from the file buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
            const fileName = `${timestamp}-${sanitizedName}`;

            // Upload to Google Drive
            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [folderId],
                    description: JSON.stringify({
                        originalName: file.originalname,
                        uploadedBy: metadata.userId,
                        ...metadata
                    }),
                    mimeType: file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream'
                },
                media: {
                    mimeType: file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream',
                    body: bufferStream
                },
                fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime'
            });

            // Make file publicly accessible (optional - you can adjust permissions)
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

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
        return Promise.all(uploadPromises);
    }

    // Delete file from Google Drive
    async deleteFile(fileId) {
        try {
            await drive.files.delete({
                fileId: fileId
            });
            return { success: true };
        } catch (error) {
            console.error('Google Drive delete error:', error);
            throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
        }
    }

    // Get file metadata
    async getFileMetadata(fileId) {
        try {
            const response = await drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, description'
            });
            return response.data;
        } catch (error) {
            console.error('Google Drive metadata error:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    // Update file (replace with new version)
    async updateFile(fileId, newFile, metadata = {}) {
        try {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(newFile.buffer);

            const response = await drive.files.update({
                fileId: fileId,
                requestBody: {
                    description: JSON.stringify({
                        ...metadata,
                        updatedAt: new Date().toISOString()
                    })
                },
                media: {
                    mimeType: newFile.mimetype || mime.lookup(newFile.originalname) || 'application/octet-stream',
                    body: bufferStream
                },
                fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime'
            });

            return {
                success: true,
                fileId: response.data.id,
                fileName: response.data.name,
                webViewLink: response.data.webViewLink,
                webContentLink: response.data.webContentLink
            };
        } catch (error) {
            console.error('Google Drive update error:', error);
            throw new Error(`Failed to update file: ${error.message}`);
        }
    }

    // List files in a folder
    async listFiles(folderType, query = '') {
        try {
            const folderId = FOLDER_IDS[folderType];
            
            if (!folderId) {
                throw new Error(`Folder ID not configured for type: ${folderType}`);
            }

            const response = await drive.files.list({
                q: `'${folderId}' in parents and name contains '${query}' and trashed=false`,
                fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, description)',
                orderBy: 'createdTime desc'
            });

            return response.data.files;
        } catch (error) {
            console.error('Google Drive list error:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    // Create folder (if needed)
    async createFolder(folderName, parentFolderId = 'root') {
        try {
            const response = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId]
                },
                fields: 'id, name'
            });
            return response.data;
        } catch (error) {
            console.error('Google Drive folder creation error:', error);
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }
}

module.exports = new GoogleDriveService();