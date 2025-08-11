// Always list files in the 'e2e documentations' folder
const E2E_DOCS_FOLDER_ID = 'YOUR_E2E_DOCUMENTATIONS_FOLDER_ID'; // <-- Replace with actual folder ID
// Secret key for endpoint protection (lowercase)
const MCP_SECRET_KEY = process.env.mcp_secret_key || 'yourSecretKeyHere';

const express = require('express');
const app = express();
app.use(express.json());

// Auth middleware: require X-MCP-KEY header for all endpoints except /initialize
function requireMcpKey(req, res, next) {
  if (req.path === '/initialize' || req.path === '/') return next();
  const key = req.headers['x-mcp-key'];
  if (!key || key !== MCP_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid MCP key.' });
  }
  next();
}

app.use(requireMcpKey);
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
const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const JSON5 = require('json5');


// Load Google Drive service account key from environment variable (JSON object)
if (!process.env.gdrive_mcp_service_key) {
  throw new Error('gdrive_mcp_service_key environment variable is required.');
}
const serviceAccountKey = JSON5.parse(process.env.gdrive_mcp_service_key);
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

// Helper to ensure valid access token before each API call
// Helper: Wait for /health to return 200 before making Drive API calls
async function ensureServerInitialized() {
  const url = 'https://arayik-mcp-gdrive.onrender.com/health';
  let initialized = false;
  while (!initialized) {
    try {
      const res = await axios.get(url, {
        headers: {
          'X-MCP-KEY': MCP_SECRET_KEY
        }
      });
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
  // Dynamically update process.env if env is provided
  if (env.GDRIVE_CREDS_DIR) process.env.GDRIVE_CREDS_DIR = env.GDRIVE_CREDS_DIR;
  res.json({
    status: 'ok',
    server: 'arayik-mcp-gdrive',
    capabilities: ['list-files', 'read-file', 'update-file'],
    message: 'MCP server initialized with dynamic env.',
    env: {
      GDRIVE_CREDS_DIR: process.env.GDRIVE_CREDS_DIR
    }
  });
});


app.get('/', (req, res) => {
  res.json({
    message: 'arayik-mcp-gdrive server is running!'
  });
});

app.get('/health', (req, res) => {
  // Print the first 100 characters of the env variable for debugging (do not print the whole key for security)
  if (process.env.gdrive_mcp_service_key) {
    console.log('gdrive_mcp_service_key (first 100 chars):', process.env.gdrive_mcp_service_key.slice(0, 100));
  } else {
    console.log('gdrive_mcp_service_key is not set');
  }
  try {
    res.status(200).json({
      status: 'ok',
      gdrive_service_account: {
        client_email: serviceAccountKey.client_email,
        project_id: serviceAccountKey.project_id
      }
    });
  } catch (err) {
    // Always return status 200, but include error info
    res.status(200).json({
      status: 'error',
      error: err.message
    });
  }
});

app.get('/list-files', async (req, res) => {
  try {
    console.log('Received /list-files request');
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    // Accept driveId as query param for shared drive support
    const driveId = '0AOyCk43g4oilUk9PVA';
    const params = {
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      driveId,
      corpora: 'drive'
    };
    const result = await drive.files.list(params);
    res.json({ files: result.data.files });
  } catch (err) {
    console.error('Error in /list-files:', err);
    res.status(500).json({ error: err.message });
  }
});

// Read file metadata and content
app.get('/read-file/:id', async (req, res) => {
  const fileId = req.params.id;
  const driveId = '0AOyCk43g4oilUk9PVA';
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    // Get file metadata
    const meta = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      driveId
    });
    // Get file content (as plain text)
    const content = await drive.files.get({
      fileId,
      alt: 'media',
      supportsAllDrives: true,
      driveId
    }, { responseType: 'text' });
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
  const driveId = '0AOyCk43g4oilUk9PVA';
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
      supportsAllDrives: true,
      driveId,
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
  // Spotless upload: log, validate, robust error handling
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
  const driveId = '0AOyCk43g4oilUk9PVA';
  if (!filename || !content) {
    console.error('Upload failed: missing filename or content');
    return res.status(400).json({ error: 'Missing filename or content.' });
  }
  if (typeof filename !== 'string' || filename.length < 3) {
    console.error('Upload failed: invalid filename', filename);
    return res.status(400).json({ error: 'Invalid filename.' });
  }
  // Supported MIME types
  const mimeTypes = {
    '.md': 'text/markdown',
    '.html': 'application/vnd.google-apps.document',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf'
  };
  let mimeType = 'text/plain';
  for (const ext in mimeTypes) {
    if (filename.endsWith(ext)) {
      mimeType = mimeTypes[ext];
      break;
    }
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
      console.error('Base64 decode failed:', e.message);
      return res.status(400).json({ error: 'Base64 decode failed: ' + e.message });
    }
  } else {
    buffer = Buffer.from(content, 'utf8');
  }
  // Log upload attempt
  console.log(`Uploading file: ${filename} to ${folderId ? 'folder ' + folderId : 'shared drive root'} with MIME type ${mimeType}`);
  try {
    await ensureServerInitialized();
    const drive = google.drive({ version: 'v3', auth });
    let fileMetadata = { name: filename };
    // Only set parents if folderId is provided
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    const media = {
      mimeType,
      body: Readable.from(buffer)
    };
    const params = {
      resource: fileMetadata,
      media,
      fields: 'id, name, parents',
      supportsAllDrives: true,
      driveId
    };
    const result = await drive.files.create(params);
    console.log('Upload successful:', result.data);
    res.json({ success: true, file: result.data });
  } catch (err) {
    console.error('Google Drive upload failed:', err.message);
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
