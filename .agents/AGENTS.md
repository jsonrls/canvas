# AI Agent Instructions

## Overview

This document contains instructions and guidelines for AI agents working on the MyBoardPrep Collaborative Learning Suite.

## Agent Guidelines

### Code Style
- Follow the style guide in [STYLEGUIDE.md](./STYLEGUIDE.md)
- Use TypeScript for type safety
- Write clear, descriptive comments for complex logic
- Follow React best practices from [vercel-react-best-practices](../.agents/skills/vercel-react-best-practices/SKILL.md)

### Database Interactions
- Follow Supabase/PostgreSQL best practices from [supabase-postgres-best-practices](../.agents/skills/supabase-postgres-best-practices/SKILL.md)
- Use parameterized queries to prevent SQL injection
- Implement proper error handling for database operations
- Consider performance implications of queries

### UI/UX Development
- Apply the design system defined in [DESIGN.md](./DESIGN.md)
- Use warm cream canvas (#faf9f5) as the base surface
- Implement coral primary CTAs (#cc785c)
- Use Copernicus/Tiempos Headline serif for display text
- Use StyreneB/Inter for body text
- Follow the component patterns defined in the design system

### Real-time Collaboration
- Use Yjs for all collaborative features
- Implement proper conflict resolution using CRDTs
- Handle offline editing scenarios
- Show user presence and live cursors
- Implement automatic reconnection logic

### Testing
- Write unit tests for core business logic
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Test real-time collaboration scenarios
- Test offline/online transition handling

### Security
- Never expose API keys or secrets
- Implement proper authentication checks
- Validate all user inputs
- Use room-based authorization for collaborative spaces
- Log sensitive operations for audit trails

## Task Prioritization

When working on tasks, prioritize in this order:
1. Security vulnerabilities
2. Data loss or corruption issues
3. Real-time synchronization failures
4. Critical user functionality
5. Performance improvements
6. UI/UX enhancements
7. Documentation updates

## File Organization

- Place component files in appropriate feature directories
- Keep shared utilities in common directories
- Maintain clear separation between frontend and backend code
- Use TypeScript interfaces for type definitions

## Communication

- Provide clear explanations for code changes
- Update relevant documentation when making changes
- Flag potential breaking changes
- Suggest improvements to existing code when appropriate

## Skill Activation

Agents should automatically activate relevant skills based on the task:
- Use `vercel-react-best-practices` for React/Next.js work
- Use `supabase-postgres-best-practices` for database work
- Use `ui-ux-pro-max` for UI/UX design tasks
- Use `frontend-design` for creating new interfaces
- Use `create-implementation-plan` for new features

## Common Patterns

### Creating a New Collaborative Feature
1. Define the Yjs document structure
2. Implement the CRDT logic
3. Add presence awareness
4. Handle offline/online states
5. Add conflict resolution
6. Test with multiple concurrent users

### Database Schema Changes
1. Create migration file
2. Update TypeScript interfaces
3. Update API documentation
4. Test with sample data
5. Consider backwards compatibility

### UI Component Development
1. Reference DESIGN.md for design tokens
2. Use existing components when possible
3. Implement responsive design
4. Add accessibility attributes
5. Test with screen readers

## Error Handling

- Always handle errors gracefully
- Provide user-friendly error messages
- Log technical errors for debugging
- Implement retry logic for transient failures
- Never expose stack traces to users

## Performance Considerations

- Optimize database queries with proper indexes
- Implement pagination for large datasets
- Use memoization for expensive computations
- Lazy load components when appropriate
- Monitor real-time synchronization performance

## Documentation Standards

- Keep documentation up-to-date with code changes
- Use clear, concise language
- Include code examples where helpful
- Maintain consistent formatting
- Review documentation regularly for accuracy
