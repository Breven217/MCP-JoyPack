# MCP JoyPack Dashboard

A desktop application built with Tauri, React, and TypeScript for managing Model Context Protocol (MCP) servers. MCP JoyPack allows you to easily install, configure, and manage various MCP servers from a single interface.

## Features

- Install and manage multiple MCP servers
- Configure environment variables for each server
- Enable/disable servers with a single click
- Support for Docker-based and locally installed MCP servers
- Automatic server configuration from a central repository
- Docker wrapper support for GitHub Container Registry authentication

## Installation

### One-Line Installation for macOS

Open Terminal and run the following command:

```bash
curl -L -o /tmp/mcp-install.sh https://raw.githubusercontent.com/Breven217/MCP-JoyPack/main/install.sh && chmod +x /tmp/mcp-install.sh && /tmp/mcp-install.sh
```

> **Note:** MCP JoyPack currently only supports macOS.

### What the Installer Does

The installer will:
- Download the latest version of MCP JoyPack
- Install it to your Applications folder
- Configure necessary security settings
- Create required directories in your home folder (~/.mcp and ~/.codeium/windsurf)
- Install Homebrew if it's not already installed
- Install Git if it's not already installed
- Create a first-run helper script

### What Happens After Installation

The installer will:

1. **Run the first-time setup script automatically**
2. **Open MCP JoyPack automatically** when installation is complete

When you first launch the app:

1. **If prompted about an unidentified developer**:
   - Click 'Cancel'
   - Right-click (or Control+click) on the app icon in Applications
   - Select "Open" from the context menu
   - Click "Open" when prompted

2. **Grant Permissions**:
   - The app will request permission to access files and run commands
   - These permissions are required for the app to function properly

### Troubleshooting

If you encounter permission issues:

1. Check that you've approved all permission requests
2. Ensure the directories `~/.mcp` and `~/.codeium/windsurf` exist and are writable
3. If the app won't open, run this command in Terminal:
   ```
   xattr -dr com.apple.quarantine /Applications/MCP-JoyPack.app
   ```

### Development Setup

If you want to build the application from source:

1. Clone this repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run tauri dev`
4. Build for production: `npm run tauri build`

## Server Configuration

MCP JoyPack fetches server configurations from a central GitHub Gist: [https://gist.github.com/Breven217/78add136e29ae98a8ed1a2c28d4f8d80](https://gist.github.com/Breven217/78add136e29ae98a8ed1a2c28d4f8d80)

### Adding a New Server Configuration

UV/UVX servers are currently not supported by MCP JoyPack.

To add a new server to the dashboard, you need to add its configuration to the `server-config.json` file in the Gist. Each server configuration follows this structure:

```json
{
  "server-name": {
    "name": "server-name",
    "displayName": "Human-Readable Server Name",
    "description": "A brief description of the server",
    "docsUrl": "https://github.com/org/repo",
    "dockerWrapper": false,
    "mcpConfig": {
      "command": "docker",
      "disabledTools": [],
      "args": [
        "run",
        "--rm",
        "-i",
        "--env-file",
        "~/.mcp/server-name.env",
        "ghcr.io/org/image:tag"
      ]
    },
    "env": {
      "ENV_VAR_1": {
        "type": "string",
        "value": "default-value"
      },
      "ENV_VAR_2": {
        "type": "password",
        "value": "",
        "docsUrl": "https://example.com/docs",
        "description": "Description of this environment variable"
      }
    }
  }
}
```

### Server Configuration Options

Based on the current `server-config.json`, here are the available configuration options:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Internal name of the server (used as identifier) |
| `displayName` | string | Human-readable name shown in the UI |
| `description` | string | Detailed description of the server |
| `docsUrl` | string | URL to the server's documentation |
| `dockerWrapper` | boolean | Whether to use a Docker wrapper for GitHub Container Registry authentication, must be paired with `GITHUB_PERSONAL_ACCESS_TOKEN` in the env |
| `mcpConfig` | object | Configuration for running the MCP server |
| `env` | object | Environment variables for the server |
| `prerequisites` | string[] | Required prerequisites for the server |
| `localSetup` | object | Configuration for locally installed servers |
| `npxSetup` | object | Configuration for npx-based servers |

#### npxSetup options

| Option | Type | Description |
|--------|------|-------------|
| `args` | string[] | Arguments to pass to npx |
| `package` | string | NPM package to install |

#### mcpConfig options

| Option | Type | Description |
|--------|------|-------------|
| `command` | string | Command to run the MCP server |
| `disabledTools` | string[] | Tools to disable |
| `args` | string[] | Arguments to pass to the command |

#### localSetup options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | string | URL of the repository |
| `command` | CommandType | Command to run the server |
| `entryPoint` | string | Entry point for the server |
| `buildCommand` | string | Command to build the server |

### Server Types

#### Docker-based Servers

For servers that run in Docker containers:

```json
"mcpConfig": {
  "command": "docker",
  "disabledTools": [],
  "args": [
    "run",
    "--rm",
    "-i",
    "--env-file",
    "~/.mcp/server-name.env",
    "ghcr.io/org/image:tag"
  ]
}
```

#### Docker with GitHub Container Registry Authentication

For servers that require authentication with GitHub Container Registry:

```json
"dockerWrapper": true,
"env": {
  "SLITE_API_KEY": {
    "type": "password",
    "value": "",
    "docsUrl": "https://example.com/api-key"
  },
  "GITHUB_PERSONAL_ACCESS_TOKEN": {
    "type": "password",
    "value": "",
    "docsUrl": "https://github.com/settings/tokens/new",
    "description": "A personal access token for GitHub SSO, be sure to add `read:packages` scope and SSO auth."
  }
}
```

#### Local Repository Servers

For servers that need to be cloned from a repository and run locally:

```json
"prerequisites": ["node"],
"localSetup": {
  "repo": "https://github.com/org/repo.git",
  "command": "node",
  "entryPoint": "build/index.js",
  "buildCommand": "npm"
},
"env": {
  "API_TOKEN": {
    "type": "password",
    "value": "",
    "docsUrl": "https://example.com/api-tokens"
  }
}
```

#### npx-based Servers

For servers that can be installed using npx:

```json
"prerequisites": ["npx"],
"npxSetup": {
  "args": ["-y", "@org/server-name"],
  "package": "@org/server-name"
}
```

### Environment Variable Configuration

Environment variables can be configured with the following properties:

```json
"ENV_VARIABLE_NAME": {
  "type": "string" | "password",  // Use "password" for sensitive data
  "value": "default-value",       // Default value or empty string
  "docsUrl": "https://example.com/docs",  // Optional link to documentation
  "description": "Description of this variable"  // Optional description
}
```