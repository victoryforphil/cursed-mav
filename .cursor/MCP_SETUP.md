# MCP Sequential Thinking Setup Guide

This guide helps you integrate the Sequential Thinking MCP Server with Cursor for structured problem-solving.

## Prerequisites

- Python 3.10 or higher
- UV package manager ([Install Guide](https://docs.astral.sh/uv/getting-started/installation/))
- Cursor IDE with MCP support

## Installation Steps

### 1. Install the Sequential Thinking MCP Server

```bash
# Using pip
pip install mcp-sequential-thinking

# Or using UV (recommended)
uv pip install mcp-sequential-thinking
```

### 2. Configure Cursor

Add the MCP server to your Cursor configuration. The location varies by OS:

**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/storage.json`
**Windows**: `%APPDATA%\Cursor\User\globalStorage\storage.json`  
**Linux**: `~/.config/Cursor/User/globalStorage/storage.json`

Add this configuration:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "mcp-sequential-thinking"
    }
  }
}
```

### 3. Alternative Configuration (if installed via UV)

If you installed using UV and set up a virtual environment:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "uv",
      "args": [
        "run",
        "--directory", "/path/to/your/mcp-sequential-thinking",
        "mcp-sequential-thinking"
      ]
    }
  }
}
```

### 4. Restart Cursor

Close and restart Cursor IDE to load the new MCP server configuration.

## Verification

### Check MCP Connection

1. Open Cursor
2. Look for MCP server indicators in the status bar
3. Try using the Sequential Thinking tools in chat:

```
Can you help me use sequential thinking to plan out a complex feature?
```

### Test Basic Functionality

Try this example workflow:

```
I want to use sequential thinking to plan adding user authentication to my app.

process_thought(
  thought="Need to add secure user authentication while maintaining good UX",
  thought_number=1,
  total_thoughts=5,
  next_thought_needed=true,
  stage="Problem Definition"
)
```

## Available MCP Tools

Once configured, you'll have access to these tools in Cursor:

- **`sequential_thinking`** - Process individual thoughts in your sequence
- **`get_thinking_summary`** - Generate summaries of your thinking process  
- **`clear_thinking_history`** - Reset to start a new thinking session

## Integration with Your Cursor Rules

The rules in `.cursor/rules/mcp-sequential-thinking.mdc` will automatically guide the AI on when and how to use these MCP tools effectively. The AI will:

- Suggest Sequential Thinking for complex problems
- Guide you through the 5-stage framework
- Help maintain continuity across thinking sessions
- Generate useful summaries

## Troubleshooting

### Common Issues

**MCP Server Not Found**
- Verify the installation path is correct
- Check that Python/UV is in your system PATH
- Try using absolute paths in the configuration

**Permission Errors**
- Ensure proper file permissions on the MCP server executable
- On Unix systems, you may need to make the script executable

**Connection Timeout**
- Restart Cursor completely
- Check if any antivirus software is blocking the connection
- Verify the MCP server starts correctly in terminal: `mcp-sequential-thinking`

### Getting Help

- Check the [official MCP Sequential Thinking documentation](https://glama.ai/mcp/servers/@arben-adm/mcp-sequential-thinking)
- Visit the [Reddit MCP community](https://www.reddit.com/r/mcp/) for community support
- Review Cursor's MCP integration documentation

## Next Steps

Once configured, try using Sequential Thinking for:

1. **Complex feature planning** - Break down large features systematically
2. **Architecture decisions** - Evaluate different approaches methodically  
3. **Debugging complex issues** - Structure your investigation process
4. **Code refactoring** - Plan and track large-scale changes

The combination of your refined Cursor rules and MCP Sequential Thinking creates a powerful workflow for tackling complex development challenges! 