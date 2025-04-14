# AI Project Generator Agent 🤖⚡

An AI-powered agent that generates and sets up complete projects locally based on natural language descriptions. Built as a CLI tool with potential for VS Code extension integration.

## Features ✨

- **Natural Language Processing**: Describe your project in plain English
- **Full Project Generation**: 
  - Folder structure creation
  - File generation with complete code
  - Dependency installation
  - Port management
- **Interactive Workflow**:
  - Shows generated plan for approval
  - Handles errors gracefully with retry logic
  - Automatic port conflict resolution
- **Project Cleanup**: Safely remove generated projects

## Tech Stack 🛠️

- **Core**: Node.js (ES Modules)
- **AI Integration**: Google Gemini API (free tier)
- **CLI**: Inquirer.js for interactive prompts
- **Process Management**: Execa for command execution
- **Validation**: Zod for schema validation
- **Port Management**: Portfinder + Kill-port

## Installation 📦

1. **Prerequisites**:
   - Node.js v18+
   - Google Gemini API key (free tier)

2. **Setup**:
   ```bash
   git clone [your-repo-url]
   cd ai-project-generator
   npm install
