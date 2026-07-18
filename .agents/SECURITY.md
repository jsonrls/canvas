# Security Documentation

## Overview

This document outlines the security measures and best practices implemented in the MyBoardPrep Collaborative Learning Suite.

> **Current implementation (verified 2026-07-18):** Supabase Auth cookie sessions protect room routes. Password recovery is account-neutral and claim-gated. Six exposed application tables have RLS, 18 public-table policies, and no anonymous table privileges; private PDFs add four membership-aware `storage.objects` policies. Direct authenticated room and membership inserts are revoked in favor of three narrowly scoped lifecycle functions, and ten private authorization helpers remain inaccessible to anonymous clients. The `boardprep-pdfs` bucket is private, PDF-only, limited to 15 MiB, and uses versioned room-prefixed paths. Upload initiation and finalization validate cookie claims, editor role, metadata, stored MIME/size, `%PDF-` bytes, and concurrent replacement state without exposing the service-role credential. Offline Yjs updates use unencrypted same-origin IndexedDB scoped by validated account, room, and tool identifiers; viewers do not open writable sockets or offline stores, and explicit sign-out clears every registered tool document. Phase 4 AI requests independently revalidate room membership, keep provider credentials server-only, disable provider response storage, bound source/output/rate/time, separate untrusted notes from instructions, strictly validate output, and retain generated packs only in browser memory unless the creator explicitly saves one. Saved guides retain only validated output metadata and payload, enforce creator-private immutable RLS, and cascade on room/account deletion. Broader controls described below remain product targets unless called out in verification scripts.

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
- Notes, PDF annotations, and whiteboard scenes resolve to separate validated document names and database rows; the same owner/editor upgrade check applies to every writable channel.

#### Implemented private PDF controls

- Only members can select objects from `boardprep-pdfs`; only owners/editors can insert, replace, or delete within their room UUID prefix. Object-name helpers reject malformed and cross-room paths before membership evaluation.
- Signed upload URLs use random revision UUIDs and are issued only after authenticated editor authorization. They permit direct browser transfer without revealing an API secret.
- Finalization rechecks authorization and the stored object, then conditionally updates the PDF row against the previously active path. A race removes the uncommitted new object instead of overwriting a newer replacement.
- Signed read URLs expire after ten minutes. Replacing a PDF changes the revision and prevents stale annotations from rendering against a different source.
- Whiteboard images accept only PNG, JPEG, WebP, or GIF files up to 1 MiB and render only validated base64 raster data URLs; SVG and arbitrary data URLs are rejected. Laser awareness is transient and excluded from persistence.

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
- **AI Interactions**: Provider requests set `store: false`; generated packs are transient unless a creator explicitly saves the validated output, which is retained until creator, room, or account deletion
- **Backups**: 7-day point-in-time recovery, 1-month full backups

## API Security

### Rate Limiting

- **Authenticated Users**: 1000 requests/hour
- **Unauthenticated Users**: 100 requests/hour
- **WebSocket Connections**: 10 concurrent connections/user
- **AI API Calls**: Implemented basic guard is five attempts per user/room in ten minutes per application instance; distributed production enforcement and monitoring remain future hardening

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
- **Offline Sync**: Unencrypted same-origin IndexedDB stores only Yjs updates; keys are account/room/tool scoped, tokens and authorization decisions are excluded, explicit sign-out clears the active account's registry, and every reconnect is revalidated by the WebSocket service
- **Conflict Review**: Local/merged excerpts and batch counts are transient client memory; awareness is excluded, the Yjs merge is the default, and an override uses the authenticated version Server Action before emitting replacement content. If checkpoint creation fails or the Yjs state changes while saving, the live merge is not replaced

## Third-Party Integrations

### OpenAI API

- `OPENAI_API_KEY` is read only by the Next.js Route Handler and is never prefixed with `NEXT_PUBLIC_`, serialized in props, or returned in errors
- Every request validates the Supabase cookie claim and current room membership before provider invocation
- Requests accept only one bounded note snapshot, label it untrusted, isolate it from instructions, cap output tokens, and abort after 30 seconds
- Strict structured output, explicit refusal handling, and runtime validation prevent malformed content from reaching result views
- Provider response storage is disabled and generated packs remain ephemeral browser state; note snapshots are not persisted by the application
- The study-aid notice and cautious confidence labels mitigate medical overreliance, but users must still verify every generated claim

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
