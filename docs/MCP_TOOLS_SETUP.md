# MCP Tools Setup Guide

This guide explains how to set up and configure z.ai MCP (Model Context Protocol) tools for GlassKeep development.

---

## Overview

The following z.ai devpack MCP servers are available for enhanced AI assistance:

| Tool | Purpose | Documentation |
|------|---------|---------------|
| **zread-mcp-server** | Read files with additional context and metadata | https://docs.z.ai/devpack/mcp/zread-mcp-server |
| **reader-mcp-server** | Enhanced file reading capabilities | https://docs.z.ai/devpack/mcp/reader-mcp-server |
| **search-mcp-server** | Find specific code patterns, functions, or text | https://docs.z.ai/devpack/mcp/search-mcp-server |
| **vision-mcp-server** | Analyze screenshots, UI designs, or images | https://docs.z.ai/devpack/mcp/vision-mcp-server |
| **cline tool** | Execute development tasks, run commands, manage project | https://docs.z.ai/devpack/tool/cline |

---

## Installation

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- MCP-compatible IDE (Claude Desktop, Cursor, etc.)

### Method 1: Using npx (Recommended)

The easiest way to run z.ai MCP tools is via npx, no installation required.

```bash
# Run any z.ai MCP tool directly
npx -y zread-mcp-server
```

### Method 2: Install Globally

Install the tools globally for easy access:

```bash
# Install zread-mcp-server
npm install -g zread-mcp-server

# Install reader-mcp-server
npm install -g reader-mcp-server

# Install search-mcp-server
npm install -g search-mcp-server

# Install vision-mcp-server
npm install -g vision-mcp-server
```

### Method 3: Project Local Installation

Install as dev dependencies for the project:

```bash
cd GLASSYDASH
npm install --save-dev zread-mcp-server reader-mcp-server search-mcp-server vision-mcp-server
```

---

## Configuration

### For Claude Desktop

Create or edit `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zread": {
      "command": "npx",
      "args": ["-y", "zread-mcp-server"]
    },
    "reader": {
      "command": "npx",
      "args": ["-y", "reader-mcp-server"]
    },
    "search": {
      "command": "npx",
      "args": ["-y", "search-mcp-server"]
    },
    "vision": {
      "command": "npx",
      "args": ["-y", "vision-mcp-server"]
    }
  }
}
```

### For Cursor

Create or edit `~/.cursorrules` or configure in Settings:

1. Open Cursor
2. Go to Settings > MCP
3. Add new server with name "z.ai"
4. Use command: `npx -y zread-mcp-server`

### Custom Installation Path

If installed globally, use the binary path:

```json
{
  "mcpServers": {
    "zread": {
      "command": "zread-mcp-server",
      "args": []
    }
  }
}
```

---

## Usage Examples

### Reading Files with Context (zread-mcp-server)

```
Read GLASSYDASH/src/App.jsx with context about related components
```

### Enhanced File Reading (reader-mcp-server)

```
Get detailed information about the server directory structure
```

### Searching Code Patterns (search-mcp-server)

```
Find all API endpoint definitions in the server/routes directory
```

### Analyzing Images (vision-mcp-server)

```
Analyze this UI screenshot to understand the component structure
```

---

## Key Features

### zread-mcp-server
- Reads files with project context
- Understands code relationships
- Provides metadata about files

### reader-mcp-server
- Enhanced file reading
- Better error messages
- Support for large files

### search-mcp-server
- Pattern-based search
- Cross-file search
- Regular expression support

### vision-mcp-server
- UI component analysis
- Text extraction from images
- Design understanding

---

## Troubleshooting

### Issue: MCP Server Not Starting

**Solution**: Ensure Node.js is accessible from the command line.

```bash
# Check Node.js installation
node --version

# Check if MCP tool can run
npx -y zread-mcp-server --version
```

### Issue: Permission Denied

**Solution**: Make sure the tool has read access to the project directory.

```bash
# On Linux/macOS
chmod +r GLASSYDASH

# Verify read access
ls -la GLASSYDASH
```

### Issue: Path Issues

**Solution**: Use absolute paths or ensure you're in the correct directory.

```bash
# Use absolute path in config
"command": "/usr/local/bin/zread-mcp-server"

# Or ensure working directory is set correctly
```

---

## Integration with GlassKeep Development

### Code Review

Use `reader-mcp-server` to get comprehensive context before code changes:
```
Read the entire AuthContext file with all imports and exports
```

### Debugging

Use `search-mcp-server` to find all error handling patterns:
```
Search for all try/catch blocks in the server directory
```

### Documentation

Use `zread-mcp-server` to understand code relationships for docs:
```
Read the notes flow from App.jsx through contexts to components
```

### UI Development

Use `vision-mcp-server` to analyze designs:
```
Analyze this dashboard mock to understand the layout
```

---

## Advanced Configuration

### Environment Variables

Some MCP tools support environment variables:

```bash
# Example for search-mcp-server
export SEARCH_MAX_RESULTS=100
export SEARCH_INCLUDE_HIDDEN=false
```

### Custom Settings

Create a `.zairc` file in the project root:

```ini
[general]
project_root = /path/to/GLASSYDASH
exclude_dirs = node_modules,.git,dist

[search]
max_file_size = 10MB
exclude_patterns = *.min.js,*.map
```

---

## Best Practices

1. **Use npx for development**: No installation required, always latest version
2. **Configure project-level settings**: Use `.zairc` for project-specific behavior
3. **Limit search scope**: Be specific with search patterns for better results
4. **Review context before changes**: Use `zread` to understand code relationships
5. **Use vision for UI review**: Analyze screenshots before implementing designs

---

## Support & Documentation

- **z.ai devpack**: https://docs.z.ai/devpack/
- **MCP Protocol**: https://modelcontextprotocol.io/
- **GlassKeep Documentation**: `GLASSYDASH/docs/`

---

**Last Updated**: January 18, 2026  
**Version**: 1.0