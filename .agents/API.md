# API Documentation

## Overview

This document describes the API endpoints and data structures used in the MyBoardPrep Collaborative Learning Suite.

> **Implementation status (verified 2026-07-18):** Supabase cookie authentication, protected room rendering, automatic user profiles, access-token, private-PDF, room-authorized AI generation, and saved-study-guide Route Handlers, authenticated durable Notes/PDF/Whiteboard Yjs channels, room-lifecycle Server Actions, and note version-history Server Actions are implemented. The broader REST contracts later in this document remain planned.

## Base URL

```
Local: http://localhost:3000
```

## Authentication

`src/proxy.ts` refreshes cookie sessions and redirects unauthenticated `/rooms/*` requests to `/login`. Server Components and Server Actions validate identity with Supabase `getClaims()` and send the user access token to the Data API so RLS remains authoritative.

The browser can request its current collaboration credential from:

```http
GET /api/auth/access-token
Cache-Control: private, no-store
```

The response is `401` without a valid cookie session. The service-role key is never returned.

## WebSocket Endpoints

### Yjs WebSocket Server

```
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234
```

`npm run dev:yjs` starts the separate durable service locally. `NEXT_PUBLIC_YJS_WS_URL` is a WebSocket base URL, not a generated secret. When the variable is omitted on Vercel, the browser uses the same-origin `wss://<deployment>/api/collaboration` Function. Supabase persists complete Yjs state and relays updates, awareness, and presenter state between Function instances.

#### Connection Parameters

```javascript
const wsProvider = new WebsocketProvider(
  process.env.NEXT_PUBLIC_YJS_WS_URL ?? "ws://localhost:1234",
  "room-slug--pdf",
  ydoc,
  { params: { access_token: validatedAccessToken } },
);
```

The standalone upgrade returns `401` for a missing/invalid token and `403` for a non-member. The same-origin Vercel route validates the secure Supabase session cookie before upgrading and never places the access token in the URL. Plain room slugs address notes; `--pdf` and `--whiteboard` suffixes select the other two document rows. Authorized state is loaded from `public.documents` before the first sync message and debounced back to the same row after updates.

### Private PDF Upload

```http
POST /api/rooms/{roomSlug}/pdf
Content-Type: application/json

{"fileName":"review.pdf","mimeType":"application/pdf","size":84210}
```

An authenticated owner/editor receives a random PDF revision, versioned room-prefixed object path, and two-hour Supabase signed upload URL. The browser uploads directly to Storage, then finalizes with:

```http
PUT /api/rooms/{roomSlug}/pdf
Content-Type: application/json

{"fileName":"review.pdf","revision":"uuid","size":84210}
```

Finalization revalidates the cookie session, role, path, stored content type/size, and `%PDF-` header. It publishes metadata only if the active path has not changed concurrently, returns a ten-minute signed member read URL, and removes the replaced version. Both methods return `Cache-Control: private, no-store`; unauthenticated callers receive `401`, while invalid or unauthorized requests receive bounded `400` JSON errors.

### AI Study Pack

```http
POST /api/rooms/{roomSlug}/ai-study-pack
Content-Type: application/json

{"sourceText":"The explicit collaborative-note snapshot..."}
```

The Route Handler validates the cookie session and room membership before provider use. It accepts exactly one bounded `sourceText` field, applies an instance-local five-per-ten-minute user/room limit, aborts provider work after 30 seconds, and calls the OpenAI Responses API with `store: false`, bounded output tokens, prompt-injection separation, and a strict JSON Schema. A successful `private, no-store` response contains `generatedAt`, `sourceCharacters`, and a validated `studyPack` with `summary`, `quiz`, `flashcards`, `recommendations`, and `misconceptions`.

Unauthenticated callers receive `401`; missing rooms/non-members receive bounded `404`; invalid input returns `400`; rate limiting returns `429` with `Retry-After`; refusals return `422`; missing server configuration returns `503`; timeouts return `504`; and provider or output failures return a generic `502`. Provider response bodies, API credentials, and stack traces are never returned.

### Implemented routes and mutations

- `GET /auth/confirm` exchanges PKCE codes or verifies email OTP token hashes.
- `GET /api/auth/access-token` returns the validated cookie session's access token with `private, no-store` caching.
- `POST` and `PUT /api/rooms/[roomId]/pdf` implement the two-phase private direct-upload flow described above. No service-role credential is serialized to the browser.
- `POST /api/rooms/[roomId]/ai-study-pack` implements the private Phase 4 generation flow described above. Every member may generate from notes they can already read; generation remains provider-storage-disabled and source notes are not retained.
- `GET`, `POST`, and `DELETE /api/rooms/[roomId]/saved-study-guides` list creator-private metadata, save a validated guide, load one full guide with `?guideId=...`, and delete creator-owned guides. Lists omit the JSON payload; every operation rechecks room membership and creator ownership through RLS.
- `/login` invokes sign-in/sign-up Server Actions. Signup validates a 1–60 character display name and sends it as Auth metadata; a database trigger creates the corresponding `public.profiles` row.
- `/rooms` reads the signed-in user's joined rooms and discoverable public rooms through RLS. `/rooms/[roomId]` opens only an existing authorized room, and `/rooms/[roomId]/settings` is owner-only.
- Room UI invokes Server Actions for create, public join, leave, room settings, exact-email member addition, member role changes, member removal, and typed-confirmation deletion. These are internal UI mutations, not public REST endpoints.
- Room creation calls `public.create_study_room(text, boolean)`, public joining calls `public.join_public_room(uuid)`, and owner-authorized exact-email member addition calls `public.add_room_member_by_email(uuid, text, text)`. Each function derives the actor from `auth.uid()` and is executable only by `authenticated`.
- Room UI also invokes sign-out, create-version, and prepare-restore Server Actions. Presence and version-history author labels are hydrated from profiles rather than derived from email addresses.
- Version reads originate in the protected Room Server Component; version mutations are not public REST endpoints.

## REST API Endpoints

> **Planned:** The following broader product contracts document intended behavior and are not implemented as REST handlers in the current application.

### Authentication

#### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student|instructor|admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "jwt_token"
  }
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "jwt_token"
  }
}
```

### Rooms

#### Create Room

```http
POST /rooms
```

**Request Body:**

```json
{
  "name": "Study Room 1",
  "type": "study|review|case",
  "subject": "veterinary|psychology|fisheries",
  "maxParticipants": 10,
  "isPrivate": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Study Room 1",
    "type": "study",
    "subject": "veterinary",
    "maxParticipants": 10,
    "isPrivate": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "createdBy": "uuid"
  }
}
```

#### Get Room

```http
GET /rooms/{roomId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Study Room 1",
    "type": "study",
    "subject": "veterinary",
    "maxParticipants": 10,
    "currentParticipants": 5,
    "isPrivate": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "createdBy": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### List Rooms

```http
GET /rooms?subject=veterinary&type=study&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "uuid",
        "name": "Study Room 1",
        "type": "study",
        "subject": "veterinary",
        "currentParticipants": 5,
        "isPrivate": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### Join Room

```http
POST /rooms/{roomId}/join
```

**Response:**

```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "userId": "uuid",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Leave Room

```http
POST /rooms/{roomId}/leave
```

**Response:**

```json
{
  "success": true,
  "message": "Left room successfully"
}
```

### Documents

#### Create Document

```http
POST /documents
```

**Request Body:**

```json
{
  "roomId": "uuid",
  "type": "notes|pdf|whiteboard",
  "title": "Lecture Notes",
  "content": "Initial content"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "type": "notes",
    "title": "Lecture Notes",
    "content": "Initial content",
    "yjsDocId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Document

```http
GET /documents/{documentId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "type": "notes",
    "title": "Lecture Notes",
    "content": "Document content",
    "yjsDocId": "uuid",
    "version": 5,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Document

```http
PUT /documents/{documentId}
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "content": "Updated content",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Document History

```http
GET /documents/{documentId}/history
```

**Response:**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "createdBy": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

### Annotations

#### Create Annotation

```http
POST /annotations
```

**Request Body:**

```json
{
  "documentId": "uuid",
  "type": "highlight|underline|sticky_note|drawing",
  "position": {
    "page": 1,
    "x": 100,
    "y": 200,
    "width": 50,
    "height": 20
  },
  "content": "Annotation text",
  "color": "#cc785c"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "documentId": "uuid",
    "type": "highlight",
    "position": {
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 20
    },
    "content": "Annotation text",
    "color": "#cc785c",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Document Annotations

```http
GET /documents/{documentId}/annotations
```

**Response:**

```json
{
  "success": true,
  "data": {
    "annotations": [
      {
        "id": "uuid",
        "type": "highlight",
        "position": {
          "page": 1,
          "x": 100,
          "y": 200
        },
        "content": "Annotation text",
        "color": "#cc785c",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Case Discussions

#### Create Case Discussion

```http
POST /cases
```

**Request Body:**

```json
{
  "roomId": "uuid",
  "title": "Canine Parvovirus Case",
  "patientHistory": "History text",
  "laboratoryResults": "Lab results",
  "images": ["image1.jpg", "image2.jpg"],
  "subject": "veterinary"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "title": "Canine Parvovirus Case",
    "patientHistory": "History text",
    "laboratoryResults": "Lab results",
    "images": ["image1.jpg", "image2.jpg"],
    "subject": "veterinary",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Add Discussion Post

```http
POST /cases/{caseId}/posts
```

**Request Body:**

```json
{
  "content": "My diagnosis is...",
  "type": "diagnosis|differential|treatment|question",
  "parentId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "caseId": "uuid",
    "content": "My diagnosis is...",
    "type": "diagnosis",
    "parentId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get AI Summary

```http
POST /cases/{caseId}/ai-summary
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": "AI-generated summary of the case discussion",
    "keyPoints": ["Point 1", "Point 2"],
    "diagnosis": "Suggested diagnosis",
    "treatment": "Suggested treatment"
  }
}
```

### Flashcards

#### Create Flashcard Deck

```http
POST /flashcards/decks
```

**Request Body:**

```json
{
  "roomId": "uuid",
  "title": "Veterinary Anatomy",
  "subject": "veterinary",
  "isPublic": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomId": "uuid",
    "title": "Veterinary Anatomy",
    "subject": "veterinary",
    "isPublic": false,
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Add Flashcard

```http
POST /flashcards/decks/{deckId}/cards
```

**Request Body:**

```json
{
  "front": "What is the function of the liver?",
  "back": "The liver performs over 500 functions including detoxification, protein synthesis, and bile production.",
  "tags": ["anatomy", "physiology"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deckId": "uuid",
    "front": "What is the function of the liver?",
    "back": "The liver performs over 500 functions including detoxification, protein synthesis, and bile production.",
    "tags": ["anatomy", "physiology"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Submit Deck for Review

```http
POST /flashcards/decks/{deckId}/submit
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deckId": "uuid",
    "status": "pending_review",
    "submittedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Approve Deck

```http
POST /flashcards/decks/{deckId}/approve
```

**Request Body:**

```json
{
  "reviewerNotes": "Great deck, approved for publication."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deckId": "uuid",
    "status": "published",
    "approvedAt": "2024-01-01T00:00:00Z"
  }
}
```

### AI Assistant

#### Generate Quiz

```http
POST /ai/quiz
```

**Request Body:**

```json
{
  "topic": "Canine Anatomy",
  "difficulty": "easy|medium|hard",
  "questionCount": 10,
  "context": "Additional context about the topic"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "quizId": "uuid",
    "questions": [
      {
        "id": "uuid",
        "question": "What is the largest organ in a dog's body?",
        "options": ["Heart", "Liver", "Skin", "Brain"],
        "correctAnswer": 2,
        "explanation": "The skin is the largest organ in a dog's body."
      }
    ]
  }
}
```

#### Generate Summary

```http
POST /ai/summary
```

**Request Body:**

```json
{
  "content": "Text to summarize",
  "type": "discussion|notes|document",
  "length": "short|medium|long"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": "Generated summary text",
    "keyPoints": ["Key point 1", "Key point 2"]
  }
}
```

#### Detect Misconceptions

```http
POST /ai/misconceptions
```

**Request Body:**

```json
{
  "discussion": "Discussion text to analyze",
  "topic": "Canine Anatomy"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "misconceptions": [
      {
        "text": "Misconception found in discussion",
        "correction": "Correct information",
        "severity": "high|medium|low"
      }
    ]
  }
}
```

### Users

#### Get User Profile

```http
GET /users/{userId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Student bio",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update User Profile

```http
PUT /users/{userId}
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication token is missing or invalid
- `PERMISSION_DENIED`: User lacks permission for the requested action
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- **Authenticated Users**: 1000 requests per hour
- **Unauthenticated Users**: 100 requests per hour
- **WebSocket Connections**: 10 concurrent connections per user

## Webhooks

### Room Events

Webhook notifications are sent for room events:

```json
{
  "event": "room.joined|room.left|room.created",
  "roomId": "uuid",
  "userId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Document Events

```json
{
  "event": "document.created|document.updated|document.deleted",
  "documentId": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { MyBoardPrepClient } from "@myboardprep/sdk";

const client = new MyBoardPrepClient({
  apiKey: "your-api-key",
  baseUrl: "http://localhost:3000",
});

// Create a room
const room = await client.rooms.create({
  name: "Study Room",
  type: "study",
  subject: "veterinary",
});

// Join room
await client.rooms.join(room.id);

// Create collaborative document
const doc = await client.documents.create({
  roomId: room.id,
  type: "notes",
  title: "Lecture Notes",
});

// Connect to Yjs
const ydoc = await client.collaboration.connect(doc.yjsDocId);
```

## Versioning

The API is versioned using the URL path. Current version: v1

```
http://localhost:3000/v1/...
```

Previous versions are supported for 12 months after deprecation notice.
