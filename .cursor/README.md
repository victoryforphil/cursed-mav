# Cursor Rules Setup

This directory contains project-specific Cursor rules that customize AI behavior for this codebase.

## Rule Files Overview

### Core Rules
- **`global.mdc`** - Always active. Controls AI behavior, prevents going off-task, and encourages dialog
- **`react-best-practices.mdc`** - React patterns, especially avoiding useEffect anti-patterns
- **`typescript-standards.mdc`** - TypeScript coding standards and conventions
- **`tech-stack.mdc`** - Bun, Moon, Shadcn UI, Mantine integration guidelines
- **`styling-performance.mdc`** - Tailwind patterns and performance optimization
- **`web-development.mdc`** - Modern web development practices and API integration

### Advanced Problem Solving
- **`mcp-sequential-thinking.mdc`** - Structured approach for complex problems using MCP Sequential Thinking Server
- **`project-specific.mdc`** - Template for project-specific customizations

## Key Improvements from Old Setup

### 1. Prevents Claude from Going Off-Task
- Explicitly tells AI to stay focused on your request
- Prevents automatic linter fixes unless asked
- Stops feature creep and scope expansion

### 2. Smart Command Execution
- Checks if dev servers are already running before starting new ones
- Asks permission before running potentially conflicting commands
- Allows multiple runs of build/check commands

### 3. useEffect Anti-Pattern Prevention
- Emphasizes modern React patterns over useEffect
- References "You Might Not Need an Effect" documentation
- Promotes proper state derivation and event handling

### 4. Encourages Dialog
- AI will ask clarifying questions instead of making assumptions
- Promotes back-and-forth conversation like OpenAI's o1 model
- Better communication and fewer mistakes

### 5. Web Search Integration
- AI can use web search tools when helpful
- Enables finding current documentation and best practices

### 6. MCP Sequential Thinking Support
- Structured problem-solving for complex coding challenges
- Break down large features into manageable steps  
- Systematic approach to architecture decisions and debugging
- 5-stage thinking framework (Problem Definition → Research → Analysis → Synthesis → Conclusion)

## How It Works

The new `.cursor/rules/*.mdc` format uses frontmatter to control when rules are applied:

- `alwaysApply: true` - Rule is always active
- `globs: "**/*.tsx"` - Rule applies to specific file patterns
- `description` - Helps AI decide when to use the rule

## Usage Tips

1. **File-specific rules** activate automatically when working with matching file types
2. **Global rules** are always active across all interactions
3. **Tech stack rules** provide context about your preferred libraries and patterns
4. **MCP Sequential Thinking** can be referenced for complex problem-solving workflows
5. Rules can be referenced with `@` symbols in chat if needed

## MCP Sequential Thinking Workflow

For complex problems, use the Sequential Thinking approach:

1. **Problem Definition**: "I need to implement [feature] while considering [constraints]"
2. **Research**: Investigate available tools, patterns, and best practices
3. **Analysis**: Evaluate different approaches and trade-offs
4. **Synthesis**: Combine findings into actionable implementation plan
5. **Conclusion**: Summarize decisions and create implementation checklist

This structured approach prevents scope creep and ensures thorough consideration of all aspects.

## Customization

Feel free to edit any `.mdc` file to adjust the rules for your specific needs. The format is simple Markdown with YAML frontmatter.

## Migration from .cursorrules

This setup replaces the old `.cursorrules` file with a more modular, maintainable approach that's easier to version control and share with your team. 