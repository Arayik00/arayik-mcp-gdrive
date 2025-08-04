
// arayik-mcp-gdrive: Node.js MCP server for Google Drive
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const app = express();
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';
const CREDS_DIR = process.env.GDRIVE_CREDS_DIR || '.vscode/';
const fs = require('fs');
const path = require('path');
const TOKEN_PATH = path.join(CREDS_DIR, 'gdrive_tokens.json');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

let userTokens = null;

// Load tokens from disk if available
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokenData = fs.readFileSync(TOKEN_PATH, 'utf8');
    userTokens = JSON.parse(tokenData);
    oauth2Client.setCredentials(userTokens);
    console.log('Loaded Google Drive tokens from disk.');
  } catch (err) {
    console.warn('Failed to load Google Drive tokens:', err.message);
  }
}

app.get('/', (req, res) => {
  res.send('arayik-mcp-gdrive server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/auth/login', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'openid',
    'email',
    'profile'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing authorization code');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    userTokens = tokens;
    // Save tokens to disk for future use
    try {
      fs.mkdirSync(CREDS_DIR, { recursive: true });
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
      console.log('Saved Google Drive tokens to disk.');
    } catch (err) {
      console.warn('Failed to save Google Drive tokens:', err.message);
    }
    res.redirect('/list-files');
  } catch (err) {
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

app.get('/list-files', async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: 'User not authenticated. Please log in at /auth/login.' });
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const result = await drive.files.list({ pageSize: 10 });
    res.json({ files: result.data.files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read file metadata and content
app.get('/read-file/:id', async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: 'User not authenticated. Please log in at /auth/login.' });
  const fileId = req.params.id;
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // Get file metadata
    const meta = await drive.files.get({ fileId });
    // Get file content (as plain text)
    const content = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    res.json({ metadata: meta.data, content: content.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update file content (plain text)
app.post('/update-file/:id', express.text({ type: '*/*' }), async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: 'User not authenticated. Please log in at /auth/login.' });
  const fileId = req.params.id;
  const newContent = req.body;
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'text/plain',
        body: newContent
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`arayik-mcp-gdrive server running on port ${PORT}`);
});
