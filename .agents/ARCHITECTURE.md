# Architecture Document

## System Overview

The MyBoardPrep Collaborative Learning Suite follows a modern real-time web application architecture with separate frontend and backend services, connected through WebSocket connections for real-time collaboration.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Tiptap Editor│  │  Excalidraw  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React PDF   │  │  Yjs Client   │  │  State Mgmt  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (Y-websocket)
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  PostgreSQL  │  │  Yjs Server  │      │
│  │   Auth       │  │   Database   │  │  (WebSocket) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  OpenAI API  │  │  Storage     │      │
│  │  Storage     │  │  Integration  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── common/           # Shared UI components
│   ├── collaboration/    # Real-time collaboration components
│   │   ├── notes/        # Collaborative notes editor
│   │   ├── pdf/          # PDF annotation
│   │   ├── whiteboard/   # Live whiteboard
│   │   └── chat/         # Real-time chat
│   ├── study/            # Study-related components
│   │   ├── flashcards/   # Flashcard system
│   │   ├── cases/        # Case discussions
│   │   └── rooms/        # Study rooms
│   └── ai/               # AI-powered features
├── hooks/
│   ├── useCollaboration.ts
│   ├── usePresence.ts
│   ├── useOfflineSync.ts
│   └── useAIAssistant.ts
├── stores/
│   ├── collaborationStore.ts
│   ├── userStore.ts
│   └── roomStore.ts
├── utils/
│   ├── yjs/
│   │   ├── documentManager.ts
│   │   ├── awareness.ts
│   │   └── offlineSync.ts
│   └── api/
└── types/
```

### State Management

- **Zustand** for global state management
- **Yjs** for collaborative document state
- **React Context** for theme and authentication
- **IndexedDB** through `y-indexeddb` for account-and-room-scoped Yjs document persistence; `localStorage` holds only the minimal versioned cleanup registry

### Real-time Communication

- **Y-websocket** for Yjs document synchronization
- **Supabase Realtime** for presence and notifications
- **Custom WebSocket handlers** for room-specific events

## Backend Architecture

### Supabase Services

- **Authentication**: User management and role-based access control
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: File storage for PDFs, images, and user uploads
- **Realtime**: PostgreSQL changes and presence subscriptions
- **Edge Functions**: Custom server-side logic when needed

### Database Schema

```
public/
├── profiles/
├── rooms/
├── room_members/
├── documents/
└── document_versions/
```

Supabase Auth owns `auth.users`; `public.profiles` exposes only application-safe identity fields. A signup trigger provisions the one-to-one profile, while RLS limits profile discovery to the current user and shared-room collaborators.

### Yjs Server Architecture

- **WebSocket Server**: Separate Node process validates a Supabase access token and owner/editor room membership before upgrade
- **Document Storage**: Loads full Yjs state from `public.documents` before sync, debounces complete-state writes, and flushes on last disconnect/shutdown
- **Awareness Service**: Manages user presence information
- **Version History**: Stores immutable ProseMirror JSON plus corresponding Yjs state in `public.document_versions`
- **Offline Sync**: One stable browser `Y.Doc` is shared by IndexedDB and a disconnected/reconnected authenticated `WebsocketProvider`
- **Conflict Review**: Transient ref-backed counters classify local versus provider-origin document batches; a completed overlap review compares the pre-remote draft with the Yjs merge, and any override uses authenticated immutable version history as its safety boundary

## Data Flow

### Real-time Collaboration Flow

1. Supabase Auth establishes an HTTP-only cookie session and `src/proxy.ts` protects room requests
2. The protected Room Server Component establishes RLS-controlled membership/document rows and reads the current profile plus version metadata
3. The browser constructs one Yjs document, loads the account-and-room IndexedDB state, and only then mounts the editor
4. The browser requests a no-store access token and connects its stable provider; the Yjs service validates token and owner/editor membership
5. Stored server Yjs state and any local updates merge through the protocol before the UI reports live sync
6. User changes are broadcast to all participants and presence is updated in real time
7. Complete state is debounced to Supabase, named versions are inserted through user-JWT RLS calls, and visible author names are resolved from shared-room profiles

### Offline Editing Flow

1. The protected room loads an account-scoped key in the form `boardprep:${userId}:${roomId}:notes` before rendering the editor
2. IndexedDB and the remote provider share one Yjs document; offline events disconnect only the remote transport
3. Edits remain writable and persist locally while remote-only checkpoint actions are gated
4. On `online` or manual retry, the browser fetches a fresh token, updates provider parameters, and reconnects without recreating the editor or document
5. Yjs merges local and concurrent server updates, while a bounded resync interval repairs an incomplete initial handshake
6. Explicit sign-out clears all IndexedDB databases registered for the active account before the server session ends

Cold offline startup is not included: the application shell and protected route still require a renderable page. IndexedDB is unencrypted same-origin storage and is not an authorization source.

### Reconnection Review Flow

1. While initial remote sync is pending or an established provider is disconnected, a transient reconciliation window counts Yjs document updates without causing React renders
2. Provider-origin transactions are remote batches; non-provider updates count as local only while the editor is focused, filtering initialization and persistence activity. Awareness and presence events never enter the detector
3. Immediately before the first remote transaction, the editor captures the current local JSON and plain text; after sync, the detector creates a review only if both local and remote batches occurred
4. The inline UI recommends the already-live Yjs merge and keeps editing available while comparing short local and merged excerpts
5. A confirmed local-draft override saves the latest merged snapshot through the authorized version Server Action, rechecks the Yjs state for intervening edits, and only then restores JSON as a normal synchronizing Yjs update

The detector intentionally covers trustworthy current-session overlap. It does not add last-write-wins behavior, semantic rich-text diffing, per-author attribution, or a persistent conflict queue.

### AI Assistant Flow

1. User requests AI assistance
2. Context is gathered from collaborative document
3. Request is sent to OpenAI API
4. Response is processed and formatted
5. Result is displayed in the UI

## Security Architecture

### Authentication & Authorization

- **Supabase Auth**: JWT-based authentication
- **Role-Based Access Control**: Room owner/editor write access and viewer read access
- **Row Level Security**: Database-level access control with private, hardened `SECURITY DEFINER` predicates
- **Room-based Authorization**: Access control per collaborative space

### Data Security

- **Encryption**: TLS 1.3 for all connections
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content sanitization and CSP headers

### Audit Logging

- **Action Logging**: All instructor actions are logged
- **Change Tracking**: Document version history
- **Access Logs**: Room access and modifications

## Performance Architecture

### Frontend Optimization

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: For large lists and documents

### Backend Optimization

- **Database Indexing**: Proper indexes for frequent queries
- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Static asset delivery through CDN

### Real-time Optimization

- **Delta Updates**: Only send changed data
- **Compression**: WebSocket message compression
- **Batching**: Batch multiple updates together
- **Debouncing**: Debounce rapid updates

## Scalability Architecture

### Horizontal Scaling

- **Stateless Frontend**: Can be deployed across multiple instances
- **Database Replication**: Read replicas for scaling
- **WebSocket Scaling**: Redis pub/sub for WebSocket scaling
- **Load Balancing**: Application load balancer

### Vertical Scaling

- **Database Optimization**: Query optimization and indexing
- **Resource Allocation**: Dynamic resource allocation
- **Caching Layers**: Multiple caching layers

## Deployment Architecture

### Development Environment

- **Local Development**: Native Node.js tooling and Supabase CLI for local services
- **Hot Reloading**: Vite for fast development
- **Mock Services**: Mock services for development

### Staging Environment

- **Preview Deployments**: Preview deployments for pull requests
- **Automated Testing**: Automated testing on deployment
- **Performance Monitoring**: Performance monitoring tools

### Production Environment

- **Multi-region Deployment**: Deployed across multiple regions
- **Auto-scaling**: Automatic scaling based on load
- **Monitoring**: Comprehensive monitoring and alerting
- **Backup**: Automated backup and disaster recovery

## Technology Choices

### Frontend Framework: React

- Large ecosystem and community support
- Component-based architecture
- Excellent developer tools
- Strong TypeScript support

### Rich Text Editor: Tiptap

- Based on ProseMirror (proven, reliable)
- Excellent collaboration support with Yjs
- Highly extensible
- Great TypeScript support

### Real-time: Yjs

- CRDT-based conflict resolution
- Excellent performance
- Strong offline support
- Easy integration with React

### Backend: Supabase

- Comprehensive backend solution
- Built-in authentication
- Real-time capabilities
- Excellent PostgreSQL integration

### Database: PostgreSQL

- ACID compliance
- Excellent performance
- Strong data integrity
- Great JSON support

## Monitoring & Observability

### Frontend Monitoring

- **Error Tracking**: Sentry for error tracking
- **Performance Monitoring**: Web Vitals monitoring
- **User Analytics**: User behavior analytics
- **Real-time Health**: WebSocket connection health

### Backend Monitoring

- **Application Monitoring**: APM tools
- **Database Monitoring**: Query performance monitoring
- **WebSocket Monitoring**: Connection and message monitoring
- **Resource Monitoring**: CPU, memory, and disk monitoring

## Disaster Recovery

### Backup Strategy

- **Database Backups**: Daily automated backups
- **Document Backups**: Yjs document snapshots
- **Storage Backups**: File storage backups
- **Configuration Backups**: Configuration version control

### Recovery Procedures

- **Database Recovery**: Point-in-time recovery
- **Document Recovery**: Document version history
- **Service Recovery**: Automated service recovery
- **Data Validation**: Post-recovery data validation
