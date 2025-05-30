# MCP JoyPack Dashboard

A desktop application built with Tauri, React, and TypeScript for managing Model Context Protocol (MCP) servers. MCP JoyPack allows you to easily install, configure, and manage various MCP servers from a single interface.

## Features

- Install and manage multiple MCP servers
- Configure environment variables for each server
- Enable/disable servers with a single click
- Support for Docker-based and locally installed MCP servers
- Automatic server configuration from a central repository
- Docker wrapper support for GitHub Container Registry authentication

## Download and Installation

### Download for macOS

<div align="center">

[![Download for macOS](https://img.shields.io/badge/Download-macOS-blue?style=for-the-badge&logo=apple)](https://github.com/Breven217/MCP-JoyPack/releases/latest/download/MCP-JoyPack-latest.dmg)

</div>

Simply click the button above to download the latest version of MCP JoyPack for macOS.

> **Note:** MCP JoyPack currently only supports macOS.

### Installation Instructions

1. Download the `.dmg` file
2. Open the downloaded file
3. Drag the application to your Applications folder
4. You may need to right-click the app and select "Open" the first time

### Development Setup

If you want to build the application from source:

1. Clone this repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run tauri dev`
4. Build for production: `npm run tauri build`

## Server Configuration

MCP JoyPack fetches server configurations from a central GitHub Gist: [https://gist.github.com/Breven217/78add136e29ae98a8ed1a2c28d4f8d80](https://gist.github.com/Breven217/78add136e29ae98a8ed1a2c28d4f8d80)

### Adding a New Server Configuration

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
| `dockerWrapper` | boolean | Whether to use a Docker wrapper for GitHub Container Registry authentication |
| `mcpConfig` | object | Configuration for running the MCP server |
| `env` | object | Environment variables for the server |
| `prerequisites` | string[] | Required prerequisites for the server |
| `localSetup` | object | Configuration for locally installed servers |

#### mcpConfig options

| Option | Type | Description |
|--------|------|-------------|
| `command` | string | Command to run the MCP server |
| `disabledTools` | string[] | Tools to disable |
| `args` | string[] | Arguments to pass to the command |

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
  "entryPoint": "build/index.js"
},
"env": {
  "API_TOKEN": {
    "type": "password",
    "value": "",
    "docsUrl": "https://example.com/api-tokens"
  }
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