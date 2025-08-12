## Delete a File

## Upload a Google Docs File (with Markdown Content)

Create a native Google Docs file in Drive, with Markdown text as its content:

```bash
curl -X POST https://arayik-mcp-gdrive.onrender.com/upload-file-api \
	-H "Content-Type: application/json" \
	-H "X-MCP-KEY: YOUR_SECRET_KEY" \
	--data-binary @- <<'EOF'
{
	"filename": "example-doc.gdoc",
	"content": "# Your Markdown documentation\n...",
	"doc_type": "gdoc"
}
EOF
```

Response:
```
{
	"success": true,
	"file": {
		"id": "<file-id>",
		"name": "example-doc.gdoc",
		"type": "gdoc"
	}
}
```

All e2e documentation files should be stored in Google Docs format (`.gdoc`) on Drive, with Markdown text inside each doc. This allows for easy editing, automation, and versioning, while keeping formatting consistent.

## Upload a Markdown or Text File

Upload as before (no doc_type or doc_type != 'gdoc'):

```bash
curl -X POST https://arayik-mcp-gdrive.onrender.com/upload-file-api \
	-H "Content-Type: application/json" \
	-H "X-MCP-KEY: YOUR_SECRET_KEY" \
	--data-binary @- <<'EOF'
{
	"filename": "example.md",
	"content": "# Markdown content\n...",
	"is_base64": false
}
EOF
```
Delete a file from Google Drive by file ID:

```bash
curl -X POST https://arayik-mcp-gdrive.onrender.com/delete-file/<file-id> \
	-H "X-MCP-KEY: YOUR_SECRET_KEY"
```

Response:
```
{
	"success": true,
	"fileId": "<file-id>"
}
```

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
