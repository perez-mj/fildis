// backend/config/googleOAuth.js
const { google } = require('googleapis');

class GoogleOAuthClient {
    constructor() {
        this.oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        
        // Auto-refresh token when expired
        this.oAuth2Client.on('tokens', (tokens) => {
            if (tokens.refresh_token) {
                console.log('🔄 New refresh token received');
                // Store the new refresh token securely (update .env)
                process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
            }
            if (tokens.access_token) {
                console.log('🔄 New access token obtained');
            }
        });
    }

    // Set credentials and handle token refresh
    async initialize() {
        if (!process.env.GOOGLE_REFRESH_TOKEN) {
            throw new Error('GOOGLE_REFRESH_TOKEN not found in .env. Run getRefreshToken script first.');
        }
        
        this.oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        
        // Test token validity
        try {
            await this.oAuth2Client.getAccessToken();
            console.log('✅ Google OAuth initialized successfully');
            return this.oAuth2Client;
        } catch (error) {
            console.error('❌ Failed to initialize Google OAuth:', error.message);
            throw error;
        }
    }

    getClient() {
        return this.oAuth2Client;
    }
}

module.exports = new GoogleOAuthClient();