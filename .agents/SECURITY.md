# Security Documentation

## Overview

This document outlines the security measures and best practices implemented in the MyBoardPrep Collaborative Learning Suite.

> **Current implementation (verified 2026-07-17):** Supabase Auth cookie sessions protect room routes. Password recovery returns account-neutral request feedback, exchanges recovery links through the cookie-backed confirmation route, validates trusted claims before a password update, and signs out the recovery session after success. Five exposed application tables have RLS, 15 policies, and no anonymous table privileges. Direct authenticated room and membership inserts are revoked in favor of three narrowly scoped lifecycle functions; seven private authorization helpers remain inaccessible to clients. User-editable metadata is used only to seed display names, never for authorization; `public.profiles` is readable only by the owner and shared-room collaborators, and writable only by its owner. Offline Yjs updates use unencrypted same-origin IndexedDB scoped by validated account and room identifiers; explicit sign-out clears every registered document for the active account. Reconnection-review drafts remain in memory, and a local-draft override cannot run until the authorized version action durably checkpoints the merged state. Broader controls described below remain product targets unless called out in the repository's verification scripts.

## Authentication & Authorization

### Authentication Flow

1. **User Registration**
   - Email validation using Supabase Auth
   - Password hashing with bcrypt (cost factor 12)
   - Email verification required before account activation
   - Rate limiting on registration endpoint

2. **User Login**
   - JWT token-based authentication
   - Token expiration: 24 hours
   - Refresh token rotation
   - Failed login attempt tracking

3. **Session Management**
   - Secure HTTP-only cookies for refresh tokens
   - JWT stored in memory (not localStorage)
   - Automatic token refresh
   - Session invalidation on logout

4. **Password Recovery**
   - Account-neutral request responses do not disclose registration status
   - Recovery callbacks are restricted to the configured HTTP(S) site origin and fixed confirmation path
   - Password updates require validated Supabase claims and terminate the recovery session on success

### Authorization Model

#### Role-Based Access Control (RBAC)

| Role           | Permissions                                               |
| -------------- | --------------------------------------------------------- |
| **Admin**      | Full system access, user management, system configuration |
| **Instructor** | Create rooms, approve content, moderate discussions       |
| **Moderator**  | Moderate discussions, manage room participants            |
| **Student**    | Participate in rooms, create content, use AI features     |

#### Room-Level Permissions

- **Owner**: Full control over room settings and content
- **Moderator**: Can moderate discussions and manage participants
- **Participant**: Can read and create content, cannot delete others' content

### Row Level Security (RLS)

All database tables implement RLS policies:

- Users can only access their own data unless explicitly granted permission
- Room participants can only access room content
- Instructors can access content in their assigned rooms
- Admins have full access for audit purposes

#### Implemented room authorization

- `create_study_room`, `join_public_room`, and `add_room_member_by_email` derive the actor from `auth.uid()`, use empty search paths and fully qualified relations, revoke default execution, and grant execution only to `authenticated`.
- Room creation is atomic. Public joining is explicit and private-room membership cannot be self-created. Exact-email member addition is owner-only, accepts only editor/viewer roles, and does not return Auth email data.
- Owner membership is immutable: the owner cannot be demoted, removed, or leave. Owners alone can update room settings and administer non-owner memberships.
- RLS-filtered mutations must return an affected row before the application reports success. Opening a room is read-only and never provisions resources.
- Owners and editors can open an authenticated writable Yjs connection. Viewers receive persisted read-only content without opening a writable WebSocket or offline-editing database.

## Data Protection

### Encryption

- **In Transit**: TLS 1.3 for all connections
- **At Rest**:
  - Database: AES-256 encryption via Supabase
  - Storage: AES-256 encryption via Supabase Storage
  - Backups: Encrypted with customer-managed keys

### Sensitive Data Handling

- **Passwords**: Never stored in plain text, bcrypt hashed
- **API Keys**: Stored in environment variables, never committed to code
- **PII**: Minimal collection, only necessary data stored
- **Content**: User-generated content is not encrypted for performance reasons

### Data Retention

- **User Data**: Retained until account deletion
- **Collaborative Content**: Retained according to room settings
- **Audit Logs**: Retained for 1 year
- **AI Interactions**: Retained for 90 days
- **Backups**: 7-day point-in-time recovery, 1-month full backups

## API Security

### Rate Limiting

- **Authenticated Users**: 1000 requests/hour
- **Unauthenticated Users**: 100 requests/hour
- **WebSocket Connections**: 10 concurrent connections/user
- **AI API Calls**: 100 calls/hour per user

### Input Validation

- Server-side validation on all inputs
- SQL injection prevention via parameterized queries
- XSS prevention via content sanitization
- CSRF protection via token validation
- File upload validation (type, size, content)

### API Security Headers

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss://api.myboardprep.com;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Real-time Security

### WebSocket Security

- WSS (WebSocket Secure) for all connections
- JWT token validation on connection
- Room-based authorization checks
- Message size limits (1MB max)
- Connection rate limiting

### Collaboration Security

- **Yjs Documents**: Room-based access control
- **Presence**: Only share presence with room participants
- **Live Cursors**: Only show cursors of authorized users
- **Offline Sync**: Unencrypted same-origin IndexedDB stores only Yjs updates; keys are account/room scoped, tokens and authorization decisions are excluded, explicit sign-out clears the active account's registry, and every reconnect is revalidated by the WebSocket service
- **Conflict Review**: Local/merged excerpts and batch counts are transient client memory; awareness is excluded, the Yjs merge is the default, and an override uses the authenticated version Server Action before emitting replacement content. If checkpoint creation fails or the Yjs state changes while saving, the live merge is not replaced

## Third-Party Integrations

### OpenAI API

- API key stored in Supabase Edge Function secrets
- Rate limiting per user
- Content filtering enabled
- PII redaction before sending to API
- Cost monitoring and limits

### Supabase

- Row Level Security enabled on all tables
- Service role key restricted to server-side use
- Anon key for client-side operations with RLS
- Regular security audits via Supabase dashboard

## Audit & Monitoring

### Audit Logging

- All user actions logged (create, update, delete)
- Instructor actions logged for compliance
- Failed authentication attempts logged
- Permission changes logged
- Data exports logged

### Security Monitoring

- **Failed Login Attempts**: Alert after 5 failed attempts
- **Suspicious Activity**: AI-powered anomaly detection
- **Data Access**: Monitor access to sensitive data
- **API Abuse**: Rate limit violations monitored
- **Data Exfiltration**: Monitor large data exports

### Incident Response

1. **Detection**: Automated monitoring and alerts
2. **Containment**: Immediate account suspension if needed
3. **Investigation**: Log analysis and impact assessment
4. **Remediation**: Patch vulnerabilities and restore services
5. **Post-Mortem**: Document incident and improve processes

## Compliance

### Data Privacy

- **GDPR Compliant**: User data export and deletion rights
- **COPPA Compliant**: No collection of data from children under 13
- **FERPA Considerations**: Educational records protection

### Security Standards

- **OWASP Top 10**: Mitigation of all top 10 vulnerabilities
- **SOC 2 Type II**: Working toward certification
- **ISO 27001**: Security management best practices

## Vulnerability Management

### Regular Security Audits

- Weekly dependency scans
- Monthly penetration testing
- Quarterly code security reviews
- Annual third-party security assessment

### Dependency Management

- Use npm audit for security vulnerabilities
- Regular dependency updates
- Lock file commits for reproducibility
- Only use dependencies with active maintenance

### Known Vulnerabilities

- **Zero-Day**: Immediate patching within 24 hours
- **High Severity**: Patching within 72 hours
- **Medium Severity**: Patching within 1 week
- **Low Severity**: Patching in next release cycle

## Best Practices

### Development

- Never commit secrets or API keys
- Use environment variables for configuration
- Implement security testing in CI/CD
- Code reviews for security implications
- Regular security training for developers

### Deployment

- Separate environments for dev/staging/prod
- Secrets management via environment variables
- Automated security scanning in CI/CD
- Blue-green deployments for zero downtime
- Database backups before deployments

### Operations

- Principle of least privilege
- Regular access reviews
- Multi-factor authentication for admin access
- Secure remote access procedures
- Incident response plan tested regularly

## User Security Guidelines

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords

### Account Security

- Enable 2FA when available
- Don't share account credentials
- Report suspicious activity immediately
- Review authorized applications regularly
- Use secure networks for sensitive activities

## Contact

For security concerns or vulnerabilities:

- **Security Email**: security@myboardprep.com
- **Bug Bounty**: https://myboardprep.com/security
- **Disclosures**: Coordinated disclosure within 90 days
