# Testing Documentation

## Overview

This document outlines the testing strategy and procedures for the MyBoardPrep Collaborative Learning Suite.

## Implemented Verification Gate

The current slice is verified with `npm run format:check`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run verify:password-reset`, `npm run verify:yjs`, `npm run verify:schema`, `npm run verify:rooms`, `npm run verify:version-history`, `npm run verify:offline-sync`, `npm run verify:conflict-review`, `npm run verify:phase-3`, `npm run verify:phase-3-storage`, `npm run verify:phase-4`, and `npm run verify:saved-study-guides`. Schema verification now asserts six RLS tables, 18 public policies, four private-PDF object policies, 13 hardened functions, three tool documents per room, immutable saved-guide grants, constrained PDF metadata, and the hosted private bucket. The saved-guide verifier proves metadata-only lists, creator detail, member/outsider isolation, immutable grants, owner deletion, and cleanup. Room/version/password/conflict verifiers retain their prior lifecycle and authorization coverage. Offline verification proves account/room/tool isolation plus durable independent Notes/PDF/Whiteboard CRDT merges. The pure Phase 3 verifier checks file and payload boundaries, document-name/key isolation, per-key merging, client-only loading, read-only controls, zoom, and Route Handler guards. The disposable three-user Storage verifier proves private bucket restrictions, owner upload/replacement, viewer write denial, signed member reads, outsider denial, and old-object cleanup. The pure Phase 4 verifier checks source and result boundaries, strict stored-disabled provider requests, refusal parsing, membership/configuration wiring, all five views, keyboard tabs, medical-study messaging, and desktop/mobile CSS contracts without calling the paid provider.

Phase 3 browser acceptance on 2026-07-17 used a disposable confirmed owner and room against the real development services. At desktop width it verified the PDF empty state, direct private upload and PDF.js render, page-comment creation, text save, reply, bookmark, 125% zoom, whiteboard rectangle/text/image insertion, live status, and clean application console. At `375 × 812` it verified visible Notes/PDF/Board navigation, a non-zero responsive whiteboard, no horizontal document overflow, and no framework overlay. Temporary Storage, room, and Auth records were removed afterward.

Phase 4 acceptance on 2026-07-18 passed the full repository gate, every Phase 1–3 verifier, the deterministic Phase 4 contract, and a live OpenAI structured-output smoke test. An authenticated disposable room then verified explicit note capture, loading and success states, keyboard tab navigation, immediate quiz feedback, flashcard flipping, learning recommendations, untrusted embedded-instruction handling, cautious misconception review, the persistent medical-study notice, and unchanged notes on return. At `375 × 812` it measured zero horizontal overflow, 56-pixel result tabs, and 50-pixel workspace controls. The application produced no warnings or errors and no framework overlay; unrelated wallet-extension console noise was excluded by origin. The temporary room, memberships, documents, and Auth user were removed afterward.

Saved-guide acceptance on 2026-07-18 passed the hosted migration and lifecycle verifier: creator metadata lists omit full JSON, creator detail loads the validated payload, another room member and outsider receive no rows, non-creators cannot delete, creators can delete, and temporary users/rooms cascade cleanly.

The 2026-07-17 browser acceptance pass additionally verified `Live → Offline → Live`, writable Tiptap content during network emulation, the exact IndexedDB key and minimal registry, disabled checkpoint actions, clean-context receipt of the reconnected edit, no console warnings/errors, and account-wide database removal before sign-out.

Password-recovery browser acceptance on 2026-07-17 verified the request page at desktop and 375-pixel widths, visible labels and helper text, the login return path, invalid-or-expired update-link routing, and a clean application-origin console. The authenticated update form remains covered by its static contract and Server Action verification; no recovery email was sent during acceptance.

Conflict review visual/interactive browser acceptance was not executed because three checks exposed neither the documented browser CLI nor a browser runtime backend. On 2026-07-17, the product owner explicitly accepted the passing production HTTP smoke, full build, authenticated two-client CRDT merge, real Yjs transaction-origin detector, static accessible panel rendering, strict types, and lint as the implementation closure gate. This is a documented verification exception: it is not evidence for real-browser focus order, responsive appearance, or the complete click-through checkpoint flow, which remain recommended regression coverage.

Room-management interactive browser acceptance was also unavailable. Closure evidence is the production build, static accessibility/interaction review, protected-route HTTP smoke, remote schema assertions, the disposable three-user lifecycle verifier, and all collaboration regression suites; responsive visual appearance and complete click-through behavior remain recommended browser regression coverage.

## Testing Philosophy

- **Test-Driven Development**: Write tests before implementation when possible
- **Comprehensive Coverage**: Aim for >80% code coverage
- **Real-World Scenarios**: Test actual user workflows
- **Collaboration Focus**: Heavily test real-time features
- **Continuous Testing**: Automated testing in CI/CD pipeline

## Testing Types

### Unit Tests

**Purpose**: Test individual functions and components in isolation

**Tools**: Jest, React Testing Library

**Coverage**:

- Utility functions
- React components
- Custom hooks
- API client functions
- Data transformation logic

**Example**:

```typescript
// utils/validation.test.ts
import { validateEmail } from "./validation";

describe("validateEmail", () => {
  it("should return true for valid email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("should return false for invalid email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
  });
});
```

### Integration Tests

**Purpose**: Test interactions between components and services

**Tools**: Jest, Supabase Test Client, MSW (Mock Service Worker)

**Coverage**:

- API endpoint integration
- Database operations
- Authentication flows
- Real-time collaboration scenarios
- WebSocket connections

**Example**:

```typescript
// integration/collaboration.test.ts
import { setupTestRoom } from "./helpers";

describe("Collaboration Integration", () => {
  it("should sync document changes between users", async () => {
    const room = await setupTestRoom();
    const user1 = await room.connectUser("user1");
    const user2 = await room.connectUser("user2");

    await user1.editDocument("content");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(user2.getDocumentContent()).toBe("content");
  });
});
```

### End-to-End Tests

**Purpose**: Test complete user workflows from start to finish

**Tools**: Playwright, Cypress

**Coverage**:

- User registration and login
- Room creation and joining
- Document collaboration
- PDF annotation
- Case discussions
- Flashcard creation
- AI assistant interactions

**Example**:

```typescript
// e2e/room-creation.spec.ts
import { test, expect } from "@playwright/test";

test("user can create and join a study room", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await page.click("text=Create Room");
  await page.fill('[name="name"]', "Study Room 1");
  await page.selectOption('[name="subject"]', "veterinary");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=Study Room 1")).toBeVisible();
});
```

### Real-Time Collaboration Tests

**Purpose**: Test multi-user collaboration scenarios

**Tools**: Custom test framework with multiple browser instances

**Coverage**:

- Concurrent editing
- Conflict resolution
- Live cursor tracking
- Presence indicators
- Offline/online transitions
- Document synchronization

**Example**:

```typescript
// realtime/concurrent-editing.test.ts
describe("Concurrent Editing", () => {
  it("should handle concurrent edits without conflicts", async () => {
    const room = await createTestRoom();
    const user1 = await room.connectUser("user1");
    const user2 = await room.connectUser("user2");

    const promises = [
      user1.editDocument("User 1 content"),
      user2.editDocument("User 2 content"),
    ];

    await Promise.all(promises);
    await room.waitForSync();

    const finalContent = room.getDocumentContent();
    expect(finalContent).toContain("User 1 content");
    expect(finalContent).toContain("User 2 content");
  });
});
```

### Performance Tests

**Purpose**: Ensure application performance meets requirements

**Tools**: Lighthouse, k6, custom performance monitoring

**Coverage**:

- Initial load time (<2 seconds)
- Time to interactive
- First contentful paint
- WebSocket connection time
- Document sync latency (<250ms)
- API response times

**Example**:

```typescript
// performance/load-test.ts
import { check } from "k6";
import http from "k6/http";

export let options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 0 },
  ],
};

export default function () {
  let res = http.get("https://api.myboardprep.com/rooms");
  check(res, {
    "status was 200": (r) => r.status == 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  });
}
```

### Security Tests

**Purpose**: Identify security vulnerabilities

**Tools**: OWASP ZAP, Snyk, custom security tests

**Coverage**:

- SQL injection prevention
- XSS vulnerabilities
- CSRF protection
- Authentication bypass
- Authorization checks
- Data exposure

**Example**:

```typescript
// security/authorization.test.ts
describe("Authorization", () => {
  it("should prevent unauthorized access to private rooms", async () => {
    const room = await createPrivateRoom();
    const unauthorizedUser = await createUser();

    const response = await unauthorizedUser.api.get(`/rooms/${room.id}`);
    expect(response.status).toBe(403);
  });
});
```

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── api/
├── integration/
│   ├── collaboration/
│   ├── database/
│   └── realtime/
├── e2e/
│   ├── auth/
│   ├── rooms/
│   ├── documents/
│   └── ai/
├── realtime/
│   ├── concurrent-editing/
│   ├── presence/
│   └── offline-sync/
├── performance/
│   ├── load/
│   └── latency/
└── security/
    ├── authorization/
    └── input-validation/
```

### Test Configuration

**jest.config.js**

```javascript
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:e2e
```

## Test Data Management

### Fixtures

**tests/fixtures/rooms.ts**

```typescript
export const testRoom = {
  name: "Test Study Room",
  type: "study",
  subject: "veterinary",
  maxParticipants: 10,
};

export const testDocument = {
  title: "Test Document",
  type: "notes",
  content: "Test content",
};
```

### Test Database

- Separate test database
- Automatic cleanup between tests
- Seed data for consistent testing
- Transaction rollback for isolation

## Performance Benchmarks

### Target Metrics

| Metric              | Target | Measurement       |
| ------------------- | ------ | ----------------- |
| Initial Load        | <2s    | Lighthouse        |
| Time to Interactive | <3s    | Lighthouse        |
| API Response        | <200ms | Custom monitoring |
| WebSocket Connect   | <500ms | Custom monitoring |
| Document Sync       | <250ms | Custom monitoring |
| Concurrent Users    | 100+   | Load testing      |

## Testing Checklist

### Before Committing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code coverage maintained
- [ ] No new linting errors
- [ ] Manual smoke test

### Before Merging

- [ ] All tests pass in CI
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Code review approved

### Before Release

- [ ] Full test suite passes
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Manual testing completed

## Mocking Strategy

### API Mocking

Use MSW for API mocking in tests:

```typescript
// tests/mocks/handlers.ts
import { rest } from "msw";

export const handlers = [
  rest.get("/api/rooms", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: "1", name: "Room 1" },
        { id: "2", name: "Room 2" },
      ]),
    );
  }),
];
```

### Database Mocking

Use test database with fixtures for realistic testing:

```typescript
// tests/helpers/database.ts
export async function setupTestDatabase() {
  await testDatabase.migrate();
  await testDatabase.seed("fixtures");
}

export async function cleanupTestDatabase() {
  await testDatabase.rollback();
}
```

## Continuous Testing

### Local Development

```bash
# Watch mode for unit tests
npm run test:unit -- --watch

# Watch mode for integration tests
npm run test:integration -- --watch

# Run specific test file
npm run test -- path/to/test.test.ts
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint"
    }
  }
}
```

## Troubleshooting

### Common Issues

**Flaky Tests**

- Identify timing dependencies
- Add proper waits and retries
- Isolate external dependencies
- Use deterministic test data

**Slow Tests**

- Optimize database queries
- Use mocks for external services
- Parallelize test execution
- Cache expensive operations

**Memory Leaks**

- Clean up connections after tests
- Use proper teardown procedures
- Monitor memory usage
- Fix component unmounting issues

## Reporting

### Test Reports

- HTML coverage reports
- JSON test results
- Performance metrics
- Security scan results

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Best Practices

1. **Write Clear Tests**: Test names should describe what is being tested
2. **Test Behavior, Not Implementation**: Focus on expected outcomes
3. **Keep Tests Independent**: Tests should not depend on each other
4. **Use Descriptive Assertions**: Clear failure messages
5. **Mock External Dependencies**: Control external dependencies
6. **Test Edge Cases**: Don't just test happy paths
7. **Maintain Test Data**: Keep fixtures up to date
8. **Review Test Coverage**: Regularly review coverage reports
9. **Refactor Tests**: Keep tests maintainable
10. **Document Complex Tests**: Explain complex test scenarios
