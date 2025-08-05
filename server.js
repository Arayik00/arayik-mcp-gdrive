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
const app = express();
app.use(express.json({ limit: '10mb' }));

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
// Start the Express server (should be at the end of the file, not inside any route)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`arayik-mcp-gdrive server running on port ${PORT}`);
});
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

// Upload a new file via JSON (base64 content)
const { Readable } = require('stream');
app.post('/upload-file-api', async (req, res) => {
  // Always use latest env
  oauth2Client._clientId = process.env.CLIENT_ID;
  oauth2Client._clientSecret = process.env.CLIENT_SECRET;
  oauth2Client.redirectUri = process.env.REDIRECT_URI;

  if (!userTokens) {
    // Not authenticated, provide login URL
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata',
      'openid',
      'email',
      'profile'
    ];
    const loginUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      client_id: process.env.CLIENT_ID
    });
    return res.status(401).json({ error: 'User not authenticated. Please log in.', loginUrl });
  }

  // Support both legacy and MCP tool-style payloads
  let filename, content, isBase64;
  if (req.body.tool === 'Upload_Document' && req.body.args) {
    filename = req.body.args.file_name || req.body.args.filename;
    content = req.body.args.content;
    isBase64 = req.body.args.is_base64;
  } else {
    filename = req.body.file_name || req.body.filename;
    content = req.body.content;
    isBase64 = req.body.is_base64;
  }
  // Debug logging
  console.log('UPLOAD DEBUG:', {
    filename,
    contentType: typeof content,
    contentLength: content ? content.length : 0,
    isBase64
  });
  if (!filename || !content) {
    console.error('UPLOAD ERROR: Missing filename or content.', { filename, content });
    return res.status(400).json({ error: 'Missing filename or content.' });
  }
  // Validate filename
  if (typeof filename !== 'string' || filename.length < 3) {
    console.error('UPLOAD ERROR: Invalid filename.', { filename });
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
      console.error('UPLOAD ERROR: Base64 decode failed.', { error: e.message });
      return res.status(400).json({ error: 'Base64 decode failed: ' + e.message });
    }
  } else {
    buffer = Buffer.from(content, 'utf8');
  }
  // Auto-detect MIME type
  let mimeType = 'text/plain';
  if (filename.endsWith('.html')) mimeType = 'text/html';
  else if (filename.endsWith('.md')) mimeType = 'text/markdown';
  else if (filename.endsWith('.json')) mimeType = 'application/json';
  // Add more types as needed
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileMetadata = { name: filename };
    const media = {
      mimeType,
      body: buffer
    };
    const result = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name'
    });
    res.json({ success: true, file: result.data });
  } catch (err) {
    console.error('UPLOAD ERROR: Google Drive upload failed.', { error: err.message });
    res.status(500).json({ error: 'Google Drive upload failed: ' + err.message });
  }
});
