# Contributing to TerminalTurtle 🐢

First off, thank you for considering contributing to TerminalTurtle! It's people like you that make TerminalTurtle such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Focus on constructive feedback
- Support fellow contributors

## How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include logs, screenshots, and code samples where possible

### Suggesting Enhancements 💡

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Any possible drawbacks or challenges
- If possible, example code or mock-ups

### Pull Requests 🚀

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

1. Fork and clone the repo
   ```bash
   git clone https://github.com/yourusername/TerminalTurtle.git
   ```

2. Install dependencies
   ```bash
   cd TerminalTurtle
   npm install
   ```

3. Create your environment file
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Start development server
   ```bash
   npm run dev
   ```

## Project Structure

```
TerminalTurtle/
├── src/                # Source code
│   ├── executor/       # Command execution logic
│   ├── server/         # API server implementation
│   └── utils/          # Utility functions
├── tests/              # Test files
├── config/             # Configuration files
└── workspace/          # Default workspace directory
```

## Coding Guidelines

- Write TypeScript code
- Follow functional programming principles
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features
- Keep functions small and focused
- Use async/await for asynchronous operations

## Testing

Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

## Documentation

- Update README.md if you change functionality
- Comment your code when adding complex logic
- Update API documentation for endpoint changes
- Include examples for new features

## Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Review Process

The core team looks at Pull Requests on a regular basis. After feedback has been given we expect responses within two weeks. After two weeks we may close the pull request if it isn't showing any activity.

## Community

- Join our discussions in GitHub Issues
- Follow our GitHub repository for updates
- Share your success stories and use cases

## Questions?

Don't hesitate to ask questions in GitHub Issues. We're here to help!

---

Thank you for contributing to TerminalTurtle! 🎉
