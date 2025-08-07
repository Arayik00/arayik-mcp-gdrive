// MCP stdio protocol handler
if (!process.env.MCP_DISABLE_STDIO) {
  process.stdin.setEncoding('utf8');
  let buffer = '';
  process.stdin.on('data', chunk => {
    buffer += chunk;
    let boundary;
    while ((boundary = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      if (line) {
        try {
          const msg = JSON.parse(line);
          // Respond to 'initialize' request
          if (msg.method === 'initialize') {
            process.stdout.write(JSON.stringify({
              id: msg.id,
              result: {
                status: 'ok',
                server: 'arayik-mcp-gdrive',
                capabilities: ['list-files', 'read-file', 'update-file']
              }
            }) + '\n');
          }
          // Add more MCP methods as needed
        } catch (err) {
          process.stdout.write(JSON.stringify({ error: err.message }) + '\n');
        }
      }
    }
  });
}
// arayik-mcp-gdrive: Node.js MCP server for Google Drive
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
const app = express();
app.use(express.json());

const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'gdrive-mcp-service-key.json');
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const fs = require('fs');
const path = require('path');

// Helper to ensure valid access token before each API call
// Helper: Wait for /health to return 200 before making Drive API calls
async function ensureServerInitialized() {
  const url = 'https://arayik-mcp-gdrive.onrender.com/health';
  let initialized = false;
  while (!initialized) {
    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        initialized = true;
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
// Service account authentication does not require token refresh logic.
// Remove ensureValidAccessToken and all token management.

// MCP /initialize endpoint for protocol handshake and dynamic env
app.post('/initialize', (req, res) => {
  const env = req.body && req.body.env ? req.body.env : {};
  console.log('MCP /initialize received env:', env);
  // Dynamically update process.env and OAuth client if env is provided
  if (env.CLIENT_ID) process.env.CLIENT_ID = env.CLIENT_ID;
  if (env.CLIENT_SECRET) process.env.CLIENT_SECRET = env.CLIENT_SECRET;
  if (env.REDIRECT_URI) process.env.REDIRECT_URI = env.REDIRECT_URI;
  if (env.GDRIVE_CREDS_DIR) process.env.GDRIVE_CREDS_DIR = env.GDRIVE_CREDS_DIR;

  // Re-initialize oauth2Client if any env changed
  oauth2Client._clientId = process.env.CLIENT_ID;
  oauth2Client._clientSecret = process.env.CLIENT_SECRET;
  oauth2Client.redirectUri = process.env.REDIRECT_URI;

  res.json({
    status: 'ok',
    server: 'arayik-mcp-gdrive',
    capabilities: ['list-files', 'read-file', 'update-file'],
    message: 'MCP server initialized with dynamic env.',
    env: {
      CLIENT_ID: process.env.CLIENT_ID,
      CLIENT_SECRET: process.env.CLIENT_SECRET,
      REDIRECT_URI: process.env.REDIRECT_URI,
      GDRIVE_CREDS_DIR: process.env.GDRIVE_CREDS_DIR
    }
  });
});

// Load tokens from disk if available

// If GDRIVE_TOKEN is not set, userTokens will be null and OAuth flow will be required

app.get('/', (req, res) => {
  res.send('arayik-mcp-gdrive server is running!');
});

app.get('/health', (req, res) => {
  let tokenStatus = fs.existsSync(TOKEN_PATH) ? 'set' : 'not set';
  let tokenValue = null;
  if (tokenStatus === 'set') {
    try {
      tokenValue = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } catch (err) {
      tokenValue = 'error reading token';
    }
  }
  res.json({ status: 'ok', gdrive_token_status: tokenStatus, gdrive_token_value: tokenValue });
});

app.get('/auth/login', (req, res) => {
  // Allow override of CLIENT_ID, CLIENT_SECRET, REDIRECT_URI from query params
  const clientId = req.query.CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = req.query.CLIENT_SECRET || process.env.CLIENT_SECRET;
  const redirectUri = req.query.REDIRECT_URI || process.env.REDIRECT_URI;

  // Update oauth2Client with new values if provided
  oauth2Client._clientId = clientId;
  oauth2Client._clientSecret = clientSecret;
  oauth2Client.redirectUri = redirectUri;

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
    scope: scopes,
    client_id: clientId,
    redirect_uri: redirectUri,
    prompt: 'consent'
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
    userTokens.last_refreshed = Date.now();
    // Remove old token file before saving new one
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(userTokens, null, 2), 'utf8');
      console.log('Saved Google Drive tokens to gdrive_tokens.json.');
    } catch (err) {
      console.warn('Failed to save Google Drive tokens:', err.message);
    }
    res.redirect('/list-files');
  } catch (err) {
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

app.get('/list-files', async (req, res) => {
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    const result = await drive.files.list({ pageSize: 10 });
    res.json({ files: result.data.files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read file metadata and content
app.get('/read-file/:id', async (req, res) => {
  const fileId = req.params.id;
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
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
app.post('/update-file/:id', async (req, res) => {
  const fileId = req.params.id;
  // Accept JSON body: { content, mimeType }
  const { content, mimeType } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Missing content.' });
  let finalMimeType = mimeType;
  if (!finalMimeType) {
    finalMimeType = fileId.endsWith('.md') ? 'text/markdown' : 'text/plain';
  }
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.update({
      fileId,
      media: {
        mimeType: finalMimeType,
        body: Buffer.from(content, 'utf8')
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a new file via JSON (base64 content)
const { Readable } = require('stream');
app.post('/upload-file-api', async (req, res) => {
  // Always use latest env
  // Support both legacy and MCP tool-style payloads
  let filename, content, isBase64, folderId;
  if (req.body.tool === 'Upload_Document' && req.body.args) {
    filename = req.body.args.file_name || req.body.args.filename;
    content = req.body.args.content;
    isBase64 = req.body.args.is_base64;
    folderId = req.body.args.folder_id;
  } else {
    filename = req.body.file_name || req.body.filename;
    content = req.body.content;
    isBase64 = req.body.is_base64;
    folderId = req.body.folder_id;
  }
  if (!filename || !content) {
    return res.status(400).json({ error: 'Missing filename or content.' });
  }
  // Validate filename
  if (typeof filename !== 'string' || filename.length < 3) {
    return res.status(400).json({ error: 'Invalid filename.' });
  }
  // Handle base64 or raw text
  let buffer;
  if (isBase64) {
    try {
      buffer = Buffer.from(content, 'base64');
      if (!buffer || buffer.length === 0) {
        throw new Error('Decoded content is empty or invalid base64.');
      }
    } catch (e) {
      return res.status(400).json({ error: 'Base64 decode failed: ' + e.message });
    }
  } else {
    buffer = Buffer.from(content, 'utf8');
  }
  // Auto-detect MIME type
  let mimeType = 'text/plain';
  if (filename.endsWith('.md')) {
    mimeType = 'text/markdown';
  } else if (filename.endsWith('.html')) {
    mimeType = 'application/vnd.google-apps.document';
  } else if (filename.endsWith('.json')) {
    mimeType = 'application/json';
  }
  // Add more types as needed
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    // Add folderId as parent if provided
    const fileMetadata = folderId ? { name: filename, parents: [folderId] } : { name: filename };
    const media = {
      mimeType,
      body: Readable.from(buffer)
    };
    const result = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, parents'
    });
    res.json({ success: true, file: result.data });
  } catch (err) {
    res.status(500).json({ error: 'Google Drive upload failed: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // Print only valid JSON handshake for orchestrator
  console.log(JSON.stringify({
    status: "ok",
    server: "arayik-mcp-gdrive",
    port: PORT,
    tools: [
      { name: "list-files", endpoint: "/list-files", method: "GET" },
      { name: "read-file", endpoint: "/read-file/:id", method: "GET" },
      { name: "update-file", endpoint: "/update-file/:id", method: "POST" },
      { name: "upload-file-api", endpoint: "/upload-file-api", method: "POST" }
    ]
  }));
  // Optionally, print plain text log after JSON handshake
  setTimeout(() => {
    console.log(`arayik-mcp-gdrive server running on port ${PORT}`);
  }, 100);
});
