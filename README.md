# arayik-mcp-gdrive

A Node.js MCP server for Google Drive integration. Supports OAuth2 authentication, file upload, metadata, and programmatic API access.

## Features
- Google Drive OAuth2 authentication
- List, read, update, and upload files
- Programmatic file upload via JSON API
- Token persistence for cloud deployment

## Setup
1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env` and fill in your Google credentials.
3. Start the server: `npm start`
4. Visit `/auth/login` in your browser and complete Google authentication.

## Endpoints
- `GET /health` — Health check
- `GET /auth/login` — Start OAuth2 login
- `GET /auth/callback` — OAuth2 callback
- `GET /list-files` — List files
- `GET /read-file/:id` — Read file metadata/content
- `POST /update-file/:id` — Update file content
- `POST /upload-file` — Upload file (multipart/form-data)
- `POST /upload-file-api` — Upload file (JSON, base64 content)

## Deployment
- Works locally and in the cloud (Render, Railway, Heroku, etc.)
- Set `REDIRECT_URI` in `.env` and Google Cloud Console to your public domain
- Use `.gitignore` to exclude sensitive files

## Security
- Do not commit `.env` or `gdrive_tokens.json` to public repos
- Protect endpoints with authentication if deploying publicly

## License
MIT
