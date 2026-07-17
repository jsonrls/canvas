# Code Style Guide

## Overview

This document outlines the coding standards and conventions for the MyBoardPrep Collaborative Learning Suite.

## General Principles

- **Readability First**: Code should be easy to read and understand
- **Consistency**: Follow established patterns across the codebase
- **Simplicity**: Avoid unnecessary complexity
- **Performance**: Write efficient code without premature optimization
- **Security**: Never compromise on security for convenience

## TypeScript

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
}

// Use types for unions, aliases, and utility types
type UserRole = 'student' | 'instructor' | 'admin';
type UserId = string;

// Use enums for fixed sets of related values
enum RoomType {
  STUDY = 'study',
  REVIEW = 'review',
  CASE = 'case',
  GENERAL = 'general',
}
```

### Best Practices

```typescript
// ✅ Good: Explicit return types
function getUserById(id: string): Promise<User> {
  return db.users.findById(id);
}

// ❌ Bad: Implicit return types
function getUserById(id: string) {
  return db.users.findById(id);
}

// ✅ Good: Use readonly for immutable arrays
function processItems(items: readonly string[]) {
  return items.map(item => item.toUpperCase());
}

// ❌ Bad: Mutable arrays
function processItems(items: string[]) {
  return items.map(item => item.toUpperCase());
}
```

## React

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';

// 2. Types
interface DocumentEditorProps {
  documentId: string;
  readOnly?: boolean;
}

// 3. Component
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  documentId,
  readOnly = false,
}) => {
  // 4. Hooks
  const { document, updateDocument } = useCollaboration(documentId);
  const [isSaving, setIsSaving] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [documentId]);

  // 6. Handlers
  const handleSave = async () => {
    setIsSaving(true);
    await updateDocument();
    setIsSaving(false);
  };

  // 7. Render
  return (
    <div className="document-editor">
      {/* Component JSX */}
    </div>
  );
};
```

### Best Practices

```typescript
// ✅ Good: Functional components with hooks
export const UserProfile: React.FC<Props> = ({ userId }) => {
  const user = useUser(userId);
  return <div>{user.name}</div>;
};

// ❌ Bad: Class components (unless necessary)
export class UserProfile extends React.Component<Props> {
  render() {
    return <div>{this.props.user.name}</div>;
  }
}

// ✅ Good: Custom hooks for reusable logic
function useDocument(documentId: string) {
  const [document, setDocument] = useState(null);
  // Hook logic
  return { document, updateDocument };
}

// ❌ Bad: Duplicated logic in components
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `DocumentEditor`)
- **Hooks**: camelCase with 'use' prefix (`useDocument`, `useCollaboration`)
- **Functions**: camelCase (`getUserById`, `updateDocument`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PARTICIPANTS`, `API_BASE_URL`)
- **Interfaces**: PascalCase (`User`, `Document`)
- **Types**: PascalCase (`UserRole`, `DocumentId`)

## CSS & Styling

### Tailwind CSS

```typescript
// ✅ Good: Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-primary text-white rounded-md">
    Action
  </button>
</div>

// ❌ Bad: Custom CSS when Tailwind works
<div className="custom-container">
  <h2 className="custom-title">Title</h2>
</div>
```

### Design System Usage

```typescript
// Use design system colors from DESIGN.md
const colors = {
  primary: '#cc785c',
  canvas: '#faf9f5',
  ink: '#141413',
  // ... other design tokens
};

// Apply design system spacing
const spacing = {
  md: '16px',
  lg: '24px',
  xl: '32px',
};
```

## File Organization

### Directory Structure

```
src/
├── components/
│   ├── common/           # Shared components
│   ├── collaboration/    # Collaboration features
│   ├── study/           # Study features
│   └── ui/              # UI components
├── hooks/               # Custom React hooks
├── stores/              # State management
├── utils/               # Utility functions
├── types/               # TypeScript types
├── api/                 # API client
└── styles/              # Global styles
```

### Import Order

```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { YDoc } from 'yjs';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useCollaboration } from '@/hooks/useCollaboration';
import { User } from '@/types/user';

// 4. Relative imports
import { localHelper } from './helpers';
import styles from './styles.module.css';
```

## Error Handling

### Async Operations

```typescript
// ✅ Good: Proper error handling
async function loadDocument(documentId: string) {
  try {
    const document = await api.documents.get(documentId);
    return document;
  } catch (error) {
    if (error instanceof NetworkError) {
      showToast('Network error. Please check your connection.');
    } else {
      showToast('Failed to load document.');
      logger.error('Document load error', error);
    }
    throw error;
  }
}

// ❌ Bad: Silent error handling
async function loadDocument(documentId: string) {
  try {
    return await api.documents.get(documentId);
  } catch (error) {
    // Silent failure
  }
}
```

### Error Boundaries

```typescript
// ✅ Good: Error boundaries for component trees
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Performance

### React Optimization

```typescript
// ✅ Good: Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ✅ Good: Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <div>{/* component */}</div>;
});
```

### Code Splitting

```typescript
// ✅ Good: Lazy load components
const DocumentEditor = lazy(() => import('./DocumentEditor'));

// ✅ Good: Dynamic imports for large libraries
const pdfjs = await import('pdfjs-dist');
```

## Security

### Input Validation

```typescript
// ✅ Good: Validate user input
function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000); // Limit length
}

// ✅ Good: Validate parameters
function updateDocument(documentId: string, content: string) {
  if (!isValidUuid(documentId)) {
    throw new Error('Invalid document ID');
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error('Content too long');
  }
  // Update logic
}
```

### API Security

```typescript
// ✅ Good: Never expose sensitive data
const publicUser = {
  id: user.id,
  name: user.name,
  // Never include: password, email, tokens
};

// ✅ Good: Use secure headers
const response = await fetch('/api/data', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
```

## Testing

### Test Structure

```typescript
describe('DocumentEditor', () => {
  // Arrange
  const props = {
    documentId: 'test-id',
    readOnly: false,
  };

  it('should render document content', () => {
    // Act
    render(<DocumentEditor {...props} />);

    // Assert
    expect(screen.getByText('Document content')).toBeInTheDocument();
  });
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should show error message when document fails to load', () => {});
it('should disable save button while saving', () => {});

// ❌ Bad: Vague test names
it('should work', () => {});
it('test error', () => {});
```

## Documentation

### JSDoc Comments

```typescript
/**
 * Fetches a document by ID with optional include parameters
 * @param documentId - The unique identifier of the document
 * @param options - Optional configuration for the fetch
 * @param options.include - Whether to include related data
 * @returns Promise resolving to the document
 * @throws {DocumentNotFoundError} When document doesn't exist
 * @example
 * ```ts
 * const doc = await getDocument('123', { include: true });
 * ```
 */
async function getDocument(
  documentId: string,
  options?: { include?: boolean }
): Promise<Document> {
  // Implementation
}
```

### Code Comments

```typescript
// ✅ Good: Comments explain "why", not "what"
// Using debounce here to prevent excessive API calls during typing
const debouncedSearch = debounce(searchTerm, 300);

// ❌ Bad: Comments repeat the code
// Define debounce function
const debouncedSearch = debounce(searchTerm, 300);
```

## Git Conventions

### Commit Messages

```
feat: add collaborative notes feature
fix: resolve document sync conflict
docs: update API documentation
style: format code with prettier
refactor: simplify document state management
test: add integration tests for authentication
chore: update dependencies
```

### Branch Naming

```
feature/collaborative-notes
fix/document-sync-conflict
hotfix/security-vulnerability
docs/api-documentation
```

## Linting and Formatting

### ESLint Rules

- Use `@typescript-eslint/recommended` rules
- Enable `react-hooks` rules
- Use `prettier` for consistent formatting

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Review Checklist

Before submitting code for review:

- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Tests are included for new features
- [ ] Documentation is updated
- [ ] Code is formatted with Prettier
- [ ] ESLint passes without errors
- [ ] Performance implications are considered
- [ ] Security implications are considered
- [ ] Accessibility is maintained
