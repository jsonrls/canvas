# Changelog

All notable changes to the MyBoardPrep Collaborative Learning Suite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Next.js 16 App Router foundation with TypeScript, linting, production builds, and responsive loading/error states
- `/rooms/[roomId]` collaborative study-notes route with a default `/rooms/demo` entry point
- Tiptap rich-text editing with headings, lists, blockquotes, inline formatting, code, undo, and redo
- Yjs document synchronization, room awareness, participant presence, and collaborative cursor labels
- BoardPrep room shell with warm editorial styling, brand accents, study navigation, and a responsive mobile layout
- Two-client WebSocket synchronization verification through `npm run verify:yjs`
- Local setup and environment documentation in `README.md` and `.env.example`
- Supabase email/password authentication with cookie refresh, protected room routes, confirmation handling, and sign-out
- Supabase schema for rooms, owner/editor/viewer memberships, durable Yjs documents, and immutable document versions
- Named version creation, newest-first history metadata, pre-restore safety snapshots, and live Tiptap restoration
- Authenticated Yjs upgrade handling with membership/role checks and Supabase restart persistence
- Automated schema, RLS, viewer-role, WebSocket authorization, restart-persistence, snapshot, and immutability verification
- One-to-one user profiles with signup provisioning, existing-user backfill, shared-room visibility, and self-service update policies
- Display-name capture during signup plus profile-backed presence and version-author labels
- Automated profile trigger, privacy, shared-room visibility, and cross-user update-isolation verification
- Account-and-room-scoped Yjs IndexedDB persistence with local readiness, storage-unavailable fallback, and account-wide sign-out cleanup
- Explicit local/remote collaboration states, offline editing guidance, and checkpoint gating while live sync is unavailable
- Deterministic offline recovery, isolation, authenticated reconnect, concurrent merge, and durable persistence verification through `npm run verify:offline-sync`
- Current-session overlap detection using Yjs transaction origins, pre-remote draft capture, and an inline reconnection review that recommends the merged note
- Guarded offline-draft restoration with inline confirmation, authenticated safety checkpoint, intervening-update abort, accessible feedback, and `npm run verify:conflict-review`
- Authenticated `/rooms` home with explicit public/private creation, joined-room switching, public discovery, role-aware cards, and empty/loading/status states
- Owner-only room settings for name and visibility updates, existing-account collaborator addition, role changes, removals, and typed-name deletion
- Atomic room creation, hardened public joining, immutable owner membership, and disposable three-user lifecycle verification through `npm run verify:rooms`
- Account-neutral password recovery with a public reset request, authenticated new-password update, safe Supabase callback exchange, and focused verification through `npm run verify:password-reset`

### Changed

- Standardized Yjs WebSocket configuration on `NEXT_PUBLIC_YJS_WS_URL` and port `1234`
- Aligned the WebSocket client and server on Yjs 13-compatible `y-websocket@2.1.0`
- Marked planned REST contracts clearly in the API documentation
- Replaced the package Yjs binary with the custom `server/yjs-server.mjs` service
- Moved the responsive right rail from static checkpoints to durable version history
- Replaced email-prefix and UUID-fragment collaborator labels with profile display names
- Kept one Yjs document, editor, and disconnected/reconnected provider alive across network transitions; reconnects fetch a fresh access token and use a bounded resync interval
- Kept frequent reconciliation counters in refs and moved only completed conflict reviews into React state so collaborative typing does not rerender the room shell
- Closed the conflict resolution UI roadmap item with an explicit product-owner verification exception after three browser-backend checks were unavailable; automated build, CRDT, origin, rendering, type, and lint gates remained green
- Replaced implicit slug-driven room creation with explicit authenticated lifecycle actions and changed default authenticated navigation to `/rooms`
- Made viewer workspaces read-only from persisted state without opening writable WebSocket or IndexedDB collaboration paths

### Deprecated

- N/A

### Removed

- Docker development configuration and Docker-specific documentation
- Incompatible `@y/websocket-server@0.1.5`, whose Yjs 14 prerelease dependency did not replicate Tiptap's Yjs 13 document updates

### Fixed

- Moved collaboration state handoff into WebSocket event callbacks to satisfy React's effect lifecycle guidance
- Corrected the stale WebSocket documentation that pointed to `ws://localhost:3000/yjs`
- Registered the Next.js request proxy under `src/proxy.ts` for this src-based App Router project
- Unified the Yjs server on one CommonJS module instance and removed unsafe cookie-session user access
- Added Next's smooth-scroll document marker and browser-verified recovery from incomplete initial Yjs handshakes
- Prevented an offline-draft override from replacing newer live edits by rechecking the full Yjs state after checkpoint creation
- Replaced the public-room direct membership insert with a dedicated RLS-safe join function after integration verification exposed the policy conflict

### Security

- Enabled RLS on all five exposed application tables, revoked anonymous table access, and placed hardened authorization helpers in a private schema
- Limited document/version writes and editing WebSockets to owners/editors while retaining read-only viewer access
- Limited profile reads to the signed-in user and shared-room collaborators; only profile owners may insert or update their row
- Kept the Supabase service-role key exclusively in server processes; browser Data API access is not used
- Scoped offline database names to validated user/room identifiers, excluded credentials and authorization data, and required cache deletion before explicit sign-out
- Kept conflict comparison data transient and required the existing authenticated, RLS-protected version action to succeed before restoring an offline draft
- Revoked direct authenticated room and membership inserts, restricted lifecycle functions to authenticated callers, and protected owner membership against leave, removal, identity changes, and demotion
- Kept exact-email account lookup inside an owner-authorized database function and returned no collaborator email data to room reads or browser props
- Kept recovery requests account-neutral, validated recovery claims before password updates, constrained callback origins to HTTP(S), and closed the recovery session after success
- `npm audit` reports two moderate findings through Next.js's bundled PostCSS 8.4.31; npm proposes an unsafe Next.js 9 downgrade, so the upstream issue remains documented rather than force-fixed

## [0.1.0] - 2024-01-15

### Added

- Project initialization
- Architecture documentation
- Technology stack selection
- Development environment setup
- CI/CD pipeline configuration
- Initial database schema
- Basic authentication flow
- UI component library setup
- Design system tokens and components

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- Implemented Row Level Security (RLS) policies
- Added JWT token validation
- Configured secure cookie handling

## [Future Versions]

### [1.0.0] - Planned Q2 2024

- Complete real-time collaboration features
- Rich text editing with Tiptap
- PDF annotation capabilities
- Basic whiteboard functionality
- Study room management
- AI assistant integration
- Offline editing support

### [1.1.0] - Planned Q3 2024

- Advanced whiteboard features
- Voice collaboration
- Screen sharing
- Inline comments and mentions
- Enhanced mobile support
- Performance optimizations

### [1.2.0] - Planned Q4 2024

- Clinical case discussions
- AI case analysis
- Enhanced PDF features
- Image annotation
- Case study library

### [2.0.0] - Planned Q1 2025

- AI tutor integration
- Personalized learning paths
- Adaptive quizzes
- Progress tracking
- Learning analytics dashboard
- Spaced repetition system

### [2.1.0] - Planned Q2 2025

- Practice exams
- Performance analytics
- Knowledge gap analysis
- Instructor dashboards
- Class management tools
- Gradebook integration

### [3.0.0] - Planned Q3 2025

- Institutional accounts
- SSO integration
- Advanced admin controls
- Bulk user management
- Custom branding
- API access
- LMS integration

## Version Categories

### Major Versions

- Significant new features
- Architectural changes
- Breaking changes
- Major UI/UX overhauls

### Minor Versions

- New features (non-breaking)
- Feature enhancements
- Performance improvements
- UI/UX improvements

### Patch Versions

- Bug fixes
- Security updates
- Small improvements
- Documentation updates

## Release Process

1. **Development**: Features developed on feature branches
2. **Testing**: Comprehensive testing in staging environment
3. **Release Notes**: Update changelog with all changes
4. **Version Bump**: Update version numbers in package.json
5. **Deployment**: Deploy to production
6. **Monitoring**: Monitor for issues post-deployment

## Release Categories Explained

### Added

- New features
- New capabilities
- New integrations

### Changed

- Changes to existing functionality
- Feature modifications
- Behavior changes

### Deprecated

- Features marked for future removal
- APIs that will be removed
- Functionality being phased out

### Removed

- Removed features
- Deleted APIs
- Eliminated functionality

### Fixed

- Bug fixes
- Issue resolutions
- Error corrections

### Security

- Security patches
- Vulnerability fixes
- Security improvements

## Upgrade Guides

### From 0.x to 1.0

- Migration guide will be provided
- Breaking changes will be documented
- Upgrade scripts will be available
- Support will be provided during transition

### From 1.x to 2.0

- Major architectural changes
- Database migrations required
- API changes documented
- New features overview provided

## Deprecation Policy

- Features will be deprecated for at least one minor version before removal
- Clear migration paths will be provided
- Documentation will be updated
- Support will be available during deprecation period

## Backward Compatibility

- Patch versions: Fully backward compatible
- Minor versions: Backward compatible (deprecated features still work)
- Major versions: May include breaking changes

## Support Timeline

- Current major version: Full support
- Previous major version: Security updates only
- Older versions: No support

## Release Schedule

- Major releases: Quarterly
- Minor releases: Monthly
- Patch releases: As needed

## Emergency Releases

- Critical security fixes: Immediate release
- Critical bug fixes: Within 24 hours
- High priority issues: Within 1 week

## Release Communication

- Announcements via email
- In-app notifications
- Blog posts
- Social media updates
- Release notes in changelog

## Feedback

Users are encouraged to provide feedback on releases:

- GitHub issues
- In-app feedback forms
- Email support
- Community forums

## Changelog Maintenance

This changelog is maintained by the development team and updated with every release. For questions or suggestions about the changelog format, please contact the development team.
