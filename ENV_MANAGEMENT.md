# Environment Variables Management

## Overview

Mission Control provides a centralized UI for managing environment variables that affect both Mission Control and OpenClaw.

**UI Location:** `http://localhost:3001/settings/env`

## Global .env File

All variables are stored in: `~/.openclaw/.env`

This file is shared between:
- **OpenClaw Gateway** - Reads on startup
- **Mission Control** - Reads/writes via UI
- **OpenClaw Config** - Uses env var substitution

## Features

### 1. Add New Variable
- Click "Add New Matrix Variable" button
- Enter key and value
- Click "Save Changes"

### 2. Edit Existing Variable
- Modify value directly in the input field
- Click "Save Changes"

### 3. Delete Variable
- Click trash icon next to variable
- Variable is **commented out** (not deleted) for safety
- Can be restored manually from .env file

### 4. Safety Features
- **Comment preservation** - All comments in .env are preserved
- **Safe deletion** - Variables are commented out, not removed
- **Backup** - OpenClaw auto-backups before changes
- **Validation** - API validates before writing

## Managed API Keys

| Variable | Purpose |
|----------|---------|
| `BRAVE_API_KEY` | Web Search (Brave Search API) |
| `GITHUB_TOKEN` | GitHub Integration |
| `GOOGLE_CLOUD_API_KEY` | Vector Embeddings |
| `OPENROUTER_API_KEY` | LLM Access |
| `GOG_KEYRING_PASSWORD` | Google Workspace Token Encryption |

## API Endpoints

### GET /api/env
Returns all environment variables as JSON array.

**Response:**
```json
[
  { "key": "BRAVE_API_KEY", "value": "..." },
  { "key": "GITHUB_TOKEN", "value": "..." }
]
```

### POST /api/env
Updates environment variables.

**Request:**
```json
[
  { "key": "NEW_VAR", "value": "new-value" }
]
```

**Behavior:**
- Adds new variables
- Updates existing variables
- Comments out deleted variables
- Preserves all comments

## Integration with OpenClaw

### Environment Variable Substitution

OpenClaw config can reference env vars using `${VAR_NAME}` syntax:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "brave",
        "apiKey": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

### Restart Required

After changing env vars, OpenClaw Gateway needs restart to pick up changes:
```bash
openclaw gateway restart
# or
systemctl --user restart openclaw-gateway
```

## Migration History

**2026-02-10:**
- Initial implementation
- Added delete feature (safe comment-out)
- Enhanced comment preservation
- Migrated 5 API keys to global .env

## Best Practices

1. **Always use UI** - Don't edit .env manually
2. **Test after changes** - Verify services still work
3. **Keep backups** - OpenClaw auto-backups config
4. **Document changes** - Add comments in UI if needed

## Troubleshooting

### Variable not showing in UI
- Check .env file exists at `~/.openclaw/.env`
- Verify file permissions
- Check Mission Control logs

### Changes not taking effect
- Restart OpenClaw Gateway
- Restart Mission Control: `pm2 restart mission-control --update-env`
- Check for syntax errors in .env

### UI shows empty values
- Variable might be empty in .env
- Check API response: `curl http://localhost:3001/api/env`
