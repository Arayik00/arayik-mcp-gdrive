
# arayik-mcp-gdrive

A Node.js MCP server for Google Drive integration using a Google service account. Endpoints are protected by a secret MCP key and do not require OAuth2.

## Features
- Google Drive service account authentication (no OAuth2 required)
- List, read, update, and upload files
- Endpoints protected by MCP secret key
- Programmatic file upload via JSON API

## Setup
1. Clone the repo and run `npm install`.
2. Add your base64-encoded Google service account key as `gdrive-mcp-service-key.b64` in the project root.
3. Set your MCP secret key in the environment: `export mcp_secret_key=YOUR_SECRET_KEY`
4. Start the server: `npm start`

## Endpoints & Tools

### Main API Endpoints (all require `X-MCP-KEY` header)

- `GET /list-files` — Lists files in the service account's Google Drive.
- `GET /read-file/:id` — Reads the contents of a file by its ID.
- `POST /update-file/:id` — Updates the contents of a file by its ID.
- `POST /upload-file-api` — Upload file (JSON, base64 or plain text content)
- `GET /health` — Health check (shows minimal service account info)

## Deployment
- Works locally and in the cloud (Render, Railway, Heroku, etc.)
- Set your MCP secret key in your cloud environment settings
- Use `.gitignore` to exclude sensitive files

## Security
- Do not commit service account keys or secrets to public repos
- All endpoints are protected by the MCP secret key
- Only requests with the correct `X-MCP-KEY` header are authorized
