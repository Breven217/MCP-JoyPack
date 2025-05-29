# MCP JoyPack Dashboard

A desktop application built with Tauri, React, and TypeScript for managing Model Context Protocol (MCP) servers. MCP JoyPack allows you to easily install, configure, and manage various MCP servers from a single interface.

![MCP JoyPack Dashboard](./docs/dashboard.png)

## Features

- Install and manage multiple MCP servers
- Configure environment variables for each server
- Enable/disable servers with a single click
- Support for Docker-based and locally installed MCP servers
- Automatic server configuration from a central repository

## Installation

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
      "ENV_VAR_1": "default-value",
      "ENV_VAR_2": ""
    }
  }
}
```

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

#### Local Repository Servers

For servers that need to be cloned from a repository and run locally:

```json
"mcpConfig": {
  "command": "~/.mcp/repos/repo-name/server-wrapper.sh",
  "args": []
},
"env": {
  "API_TOKEN": ""
},
"localSetup": {
  "repo": "https://github.com/org/repo.git",
  "command": "node",
  "entryPoint": "build/index.js"
}
```