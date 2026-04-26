// backend/services/googleDriveService.js
const stream = require('stream');
const mime = require('mime-types');
const { initializeDrive, drive: getDrive, FOLDER_IDS: getFolderIds } = require('../config/googleDrive');

let pdfParse;
try {
    const pdfModule = require('pdf-parse');
    pdfParse = pdfModule.default || pdfModule;
} catch (error) {
    console.warn('pdf-parse not installed. PDF text extraction will not work.');
    pdfParse = null;
}

// Import mammoth for Word documents
let mammoth;
try {
    mammoth = require('mammoth');
} catch (error) {
    console.warn('mammoth not installed. Word document extraction will not work.');
    mammoth = null;
}

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

            const bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);

            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
            const fileName = `${timestamp}-${sanitizedName}`;

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

            // Make file publicly accessible
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

    // Delete file
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

    // Extract text content from file
    async extractFileContent(fileId, mimeType) {
        try {
            await this.ensureInitialized();
            
            // For Google Docs
            if (mimeType === 'application/vnd.google-apps.document') {
                const response = await this.drive.files.export(
                    { fileId, mimeType: 'text/plain' },
                    { responseType: 'stream' }
                );
                return await this.streamToString(response.data);
            }
            
            // For regular files - download as stream
            const response = await this.drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );
            
            const buffer = await this.streamToBuffer(response.data);
            const text = await this.extractTextFromBuffer(buffer, mimeType);
            return text;
        } catch (error) {
            console.error('Text extraction error:', error);
            throw error;
        }
    }

    // Extract text from buffer based on MIME type
    async extractTextFromBuffer(buffer, mimeType) {
        try {
            // PDF files - FIXED: Use pdfParse correctly
            if (mimeType === 'application/pdf') {
                if (!pdfParse) {
                    throw new Error('pdf-parse library not installed. Run: npm install pdf-parse');
                }
                const data = await pdfParse(buffer);
                return data.text || '';
            } 
            // Word documents
            else if (mimeType.includes('word') || mimeType.includes('document')) {
                if (!mammoth) {
                    throw new Error('mammoth library not installed. Run: npm install mammoth');
                }
                const result = await mammoth.extractRawText({ buffer: buffer });
                return result.value || '';
            }
            // Plain text files
            else if (mimeType.startsWith('text/')) {
                return buffer.toString('utf-8');
            }
            // PowerPoint files - limited support
            else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
                return "NOTE: PowerPoint files have limited text extraction. For best AI results, please export slides as PDF or provide a text document summary.";
            }
            // Unsupported format
            else {
                return `Text extraction not supported for ${mimeType}. For best results, use PDF or Word documents with selectable text.`;
            }
        } catch (error) {
            console.error('Text extraction from buffer error:', error);
            throw new Error(`Failed to extract text: ${error.message}`);
        }
    }

    // Get content for AI processing
    async getExtractableContent(fileId, mimeType) {
        try {
            const content = await this.extractFileContent(fileId, mimeType);
            
            if (!content || content.length < 50) {
                return {
                    success: false,
                    content: null,
                    length: 0,
                    error: 'File contains insufficient extractable text (less than 50 characters). Please ensure the file has readable text content, not scanned images.'
                };
            }
            
            return {
                success: true,
                content: content,
                length: content.length,
                isExtractable: true
            };
        } catch (error) {
            return {
                success: false,
                content: null,
                length: 0,
                error: error.message
            };
        }
    }

    // Verify AI can access the file
    async verifyAIAccess(fileId) {
        try {
            await this.ensureInitialized();
            
            // First, check if file exists
            const file = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, webViewLink',
                supportsAllDrives: true
            });
            
            if (!file || !file.data) {
                return {
                    canAccess: false,
                    fileExists: false,
                    solution: 'File not found in Google Drive'
                };
            }
            
            // Check if file is publicly accessible
            const permissions = await this.drive.permissions.list({
                fileId: fileId,
                supportsAllDrives: true,
                fields: 'permissions(id, type, role)'
            });
            
            const hasPublicAccess = permissions.data.permissions?.some(
                p => p.type === 'anyone' && p.role === 'reader'
            );
            
            if (!hasPublicAccess) {
                return {
                    canAccess: false,
                    fileExists: true,
                    fileName: file.data.name,
                    solution: 'Share this file publicly: Right-click file → Share → General access → Anyone with the link → Viewer',
                    sharingUrl: file.data.webViewLink
                };
            }
            
            // Check if file type is extractable
            const mimeType = file.data.mimeType;
            const isExtractable = this.isExtractableFileType(mimeType);
            
            if (!isExtractable) {
                return {
                    canAccess: true,
                    fileExists: true,
                    fileName: file.data.name,
                    isExtractable: false,
                    solution: `File type ${mimeType} cannot be processed for text extraction. Please upload as PDF or Word document.`
                };
            }
            
            return {
                canAccess: true,
                fileExists: true,
                fileName: file.data.name,
                isExtractable: true,
                mimeType: mimeType,
                fileSize: file.data.size
            };
        } catch (error) {
            console.error('Verify AI access error:', error);
            return {
                canAccess: false,
                error: error.message,
                solution: 'Check that the file exists and you have permission to access it'
            };
        }
    }

    // Helper: Check if file type supports text extraction
    isExtractableFileType(mimeType) {
        const extractableTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/html',
            'application/vnd.google-apps.document'
        ];
        
        return extractableTypes.some(type => mimeType.includes(type));
    }

    // Helper: Convert stream to string
    async streamToString(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
    }

    // Helper: Convert stream to buffer
    async streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
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
}

module.exports = new GoogleDriveService();