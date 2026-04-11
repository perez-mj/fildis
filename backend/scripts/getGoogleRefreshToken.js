// backend/scripts/getGoogleRefreshToken.js
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');

// Load .env from backend folder
function loadEnv() {
    // Try backend/.env first (since that's where you have it)
    const possiblePaths = [
        path.join(__dirname, '../.env'),        // backend/.env
        path.join(__dirname, '../../.env'),     // root/.env
        path.join(process.cwd(), '.env'),       // cwd/.env
        path.join(process.cwd(), 'backend/.env') // cwd/backend/.env
    ];
    
    for (const envPath of possiblePaths) {
        if (fs.existsSync(envPath)) {
            console.log('📁 Loading .env from:', envPath);
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    const value = valueParts.join('=');
                    if (key && value) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            }
            console.log('✅ .env loaded successfully');
            return true;
        }
    }
    
    console.error('❌ .env file not found in any of these locations:');
    possiblePaths.forEach(p => console.log('   -', p));
    return false;
}

// Load env first
if (!loadEnv()) {
    console.log('\n📝 Please create backend/.env with:');
    console.log('GOOGLE_CLIENT_ID=your_client_id');
    console.log('GOOGLE_CLIENT_SECRET=your_client_secret');
    console.log('GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback');
    process.exit(1);
}

// Now check for credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

console.log('\n🔍 Checking environment variables:');
console.log('GOOGLE_CLIENT_ID:', CLIENT_ID ? '✅ Set (length: ' + CLIENT_ID.length + ')' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', CLIENT_SECRET ? '✅ Set (length: ' + CLIENT_SECRET.length + ')' : '❌ Missing');
console.log('GOOGLE_REDIRECT_URI:', REDIRECT_URI);

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('\n❌ Missing required credentials in backend/.env');
    console.log('\nYour backend/.env should contain:');
    console.log('GOOGLE_CLIENT_ID=your_actual_client_id');
    console.log('GOOGLE_CLIENT_SECRET=your_actual_client_secret');
    console.log('GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback');
    process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function getTokenManually() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        redirect_uri: REDIRECT_URI
    });

    console.log('\n📋 Step 1: Authorize by visiting this URL:\n');
    console.log(authUrl);
    console.log('\n⚠️  After authorizing, you\'ll be redirected. Copy the entire "code" parameter from the URL.');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('\n✏️ Step 2: Paste the authorization code here: ', async (code) => {
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            console.log('\n✅ SUCCESS! Add these to your backend/.env file:\n');
            console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log(`\n📝 Token expires: ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A'}`);
            console.log('\n⚠️  IMPORTANT: Save this refresh token immediately!');
            rl.close();
        } catch (error) {
            console.error('\n❌ Error getting tokens:', error.response?.data || error.message);
            if (error.message.includes('redirect_uri')) {
                console.log('\n🔧 Fix: Make sure your redirect_uri matches exactly in:');
                console.log('1. Google Cloud Console -> Credentials -> OAuth 2.0 Client IDs');
                console.log(`2. Your backend/.env: GOOGLE_REDIRECT_URI=${REDIRECT_URI}`);
            }
            rl.close();
        }
    });
}

getTokenManually();