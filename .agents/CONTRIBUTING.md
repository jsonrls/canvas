# Contributing Guidelines

## Overview

Thank you for your interest in contributing to the MyBoardPrep Collaborative Learning Suite! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We pledge to:

- Be respectful and considerate
- Use inclusive language
- Be open to different viewpoints
- Focus on constructive feedback
- Welcome newcomers and help them learn

### Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- Harassment or discriminatory language
- Personal attacks or insults
- Unwelcome sexual attention or advances
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account (for backend development)
- Basic knowledge of React, TypeScript, and PostgreSQL

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/your-username/boardprep-canvas.git
   cd boardprep-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local development
   supabase start
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes
- `docs/*`: Documentation updates

### Creating a Feature Branch

```bash
# Ensure your main branch is up to date
git checkout main
git pull origin main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write code following the style guide**
   - Follow [STYLEGUIDE.md](./STYLEGUIDE.md)
   - Use TypeScript for type safety
   - Write clear, descriptive comments

2. **Test your changes**
   ```bash
   # Run unit tests
   npm run test:unit
   
   # Run integration tests
   npm run test:integration
   
   # Run E2E tests
   npm run test:e2e
   ```

3. **Check code quality**
   ```bash
   # Run linter
   npm run lint
   
   # Check TypeScript
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(collaboration): add live cursor tracking
fix(auth): resolve JWT token expiration issue
docs(api): update API documentation
refactor(database): optimize query performance
```

### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill in the PR template

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of the changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   - [ ] All tests passing
   ```

5. **Address Review Feedback**
   - Respond to reviewer comments
   - Make requested changes
   - Update tests if needed
   - Push updates to your branch

## Code Review Guidelines

### For Reviewers

- Be constructive and respectful
- Focus on the code, not the person
- Explain the reasoning behind suggestions
- Approve when the PR is ready
- Request changes when necessary

### For Authors

- Respond to all review comments
- Make requested changes promptly
- Ask for clarification if needed
- Update the PR description if scope changes
- Mark conversations as resolved when addressed

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for high code coverage
- Test edge cases and error conditions

### Integration Tests

- Test component interactions
- Test API integrations
- Test database operations
- Use test fixtures for consistency

### E2E Tests

- Test complete user workflows
- Test critical paths
- Test real-time collaboration scenarios
- Use realistic test data

### Test Coverage

- Aim for >80% code coverage
- Focus on critical paths
- Test security-sensitive code thoroughly
- Regularly review coverage reports

## Documentation

### Code Documentation

- Document complex functions
- Explain non-obvious logic
- Use JSDoc for TypeScript functions
- Keep comments up to date

### Project Documentation

- Update [API.md](./API.md) for API changes
- Update [DATABASE.md](./DATABASE.md) for schema changes
- Update [ARCHITECTURE.md](./ARCHITECTURE.md) for architectural changes
- Update [STYLEGUIDE.md](./STYLEGUIDE.md) for style changes

### README Updates

- Update installation instructions if needed
- Update configuration instructions
- Add new environment variables
- Update feature descriptions

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, version
6. **Screenshots**: If applicable
7. **Additional Context**: Logs, error messages

### Feature Requests

When requesting features, include:

1. **Description**: Clear description of the feature
2. **Use Case**: Why this feature is needed
3. **Proposed Solution**: How you envision it working
4. **Alternatives**: Alternative solutions considered
5. **Additional Context**: Examples, mockups, etc.

## Design Guidelines

### UI/UX

- Follow the design system in [DESIGN.md](./DESIGN.md)
- Use warm cream canvas (#faf9f5) as base
- Use coral (#cc785c) for primary CTAs
- Use Copernicus/Tiempos Headline for display text
- Use StyreneB/Inter for body text
- Ensure accessibility (WCAG 2.1 AA)
- Test with screen readers

### Component Design

- Reuse existing components when possible
- Follow established patterns
- Make components reusable
- Document component props
- Add component examples

## Security Guidelines

### Never Commit
- API keys or secrets
- Passwords or credentials
- Personal user data
- Sensitive configuration

### Security Best Practices
- Validate all user inputs
- Use parameterized queries
- Implement proper error handling
- Follow security guidelines in [SECURITY.md](./SECURITY.md)
- Report security vulnerabilities privately

## Performance Guidelines

### Frontend Performance
- Optimize images and assets
- Use code splitting
- Implement lazy loading
- Minimize bundle size
- Use memoization appropriately

### Backend Performance
- Optimize database queries
- Use indexes appropriately
- Implement caching
- Monitor query performance
- Use connection pooling

### Real-time Performance
- Minimize message size
- Batch updates when possible
- Use delta updates
- Monitor WebSocket performance
- Implement reconnection logic

## Release Process

### Version Bumping
- Update version in package.json
- Update CHANGELOG.md
- Tag the release
- Create GitHub release

### Deployment
- Deploy to staging first
- Run full test suite
- Perform smoke testing
- Deploy to production
- Monitor for issues

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Annual contributor highlights

## Getting Help

- **Documentation**: Check project documentation first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers for private questions
- **Community**: Join our community channels

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Questions?

For questions about contributing:
- Open a GitHub Discussion
- Contact the maintainers
- Check existing documentation

Thank you for contributing to MyBoardPrep Collaborative Learning Suite!
