# Database Schema Documentation

## Overview

This document describes the database schema for the MyBoardPrep Collaborative Learning Suite, built on PostgreSQL with Supabase.

> **Implemented baseline (verified 2026-07-17):** The authoritative schema is in `supabase/migrations/`. It currently contains Supabase-managed `auth.users` plus RLS-protected `public.profiles`, `public.rooms`, `public.room_members`, `public.documents`, and `public.document_versions`. The broader product tables later in this document are planned models, not deployed tables.

### Implemented profiles

`public.profiles.id` is a one-to-one foreign key to `auth.users.id` with `ON DELETE CASCADE`. `display_name` is required and constrained to 1–60 trimmed characters; `avatar_path` is an optional storage path. An `auth.users` trigger provisions new profiles and the migration backfills existing users.

Authenticated users may select their own profile or profiles belonging to users who share a room. They may insert or update only their own row, cannot delete profile rows directly, and anonymous users have no table privileges. Authorization uses `private.can_view_profile(uuid)` with an empty search path and revoked public execution.

### Implemented room lifecycle

The deployed room model uses `public.rooms`, `public.room_members`, and `public.documents` from the migration baseline rather than the planned illustrative schemas below. Membership roles are `owner`, `editor`, and `viewer`; document type `notes` is provisioned for every room.

- `public.create_study_room(text, boolean)` validates and normalizes the name, generates a collision-resistant slug, and atomically inserts the room, owner membership, and notes document from `auth.uid()`.
- `public.join_public_room(uuid)` is the only authenticated public-join path. Direct authenticated inserts into `public.room_members` are revoked.
- `public.add_room_member_by_email(uuid, text, text)` allows only the owner to add an existing Auth account by exact normalized email as editor or viewer and returns no email data.
- Owner membership identity and role are protected by triggers and RLS: owners cannot be demoted, removed, or leave. Room reads expose profiles only for shared-room collaborators.
- Direct authenticated inserts into `public.rooms` are revoked. The three public lifecycle functions and seven private authorization helpers have empty search paths, fully qualified relations, revoked default execution, and explicit grants.
- All five exposed application tables retain RLS. The deployed schema has 15 public policies; immutable version rows, membership identity, room timestamps, profile provisioning, and room-creation invariants are asserted by `npm run verify:schema`.

The SQL definitions shown later in this document remain product-shape examples unless they match a file in `supabase/migrations/`.

## Database Tables

### users

Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'moderator', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  subject VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subject ON users(subject);
```

### rooms

Stores collaborative room information.

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('study', 'review', 'case', 'general')),
  subject VARCHAR(100),
  description TEXT,
  max_participants INTEGER DEFAULT 10,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_rooms_subject ON rooms(subject);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
```

### room_participants

Tracks room membership and participation.

```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
```

### documents

Stores collaborative document metadata.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('notes', 'pdf', 'whiteboard', 'case')),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  yjs_doc_id VARCHAR(255) UNIQUE NOT NULL,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_room_id ON documents(room_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_yjs_doc_id ON documents(yjs_doc_id);
```

### document_versions

Stores document version history.

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, version)
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
```

### annotations

Stores PDF and document annotations.

```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('highlight', 'underline', 'sticky_note', 'drawing', 'bookmark')),
  position JSONB NOT NULL,
  content TEXT,
  color VARCHAR(7) DEFAULT '#cc785c',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_annotations_document_id ON annotations(document_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_annotations_type ON annotations(type);
```

### annotation_replies

Stores replies to annotations.

```sql
CREATE TABLE annotation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_annotation_replies_annotation_id ON annotation_replies(annotation_id);
```

### case_discussions

Stores clinical case discussions.

```sql
CREATE TABLE case_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  patient_history TEXT NOT NULL,
  laboratory_results TEXT,
  images TEXT[],
  subject VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_case_discussions_room_id ON case_discussions(room_id);
CREATE INDEX idx_case_discussions_subject ON case_discussions(subject);
```

### case_posts

Stores posts in case discussions.

```sql
CREATE TABLE case_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES case_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES case_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('diagnosis', 'differential', 'treatment', 'question', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_case_posts_case_id ON case_posts(case_id);
CREATE INDEX idx_case_posts_user_id ON case_posts(user_id);
CREATE INDEX idx_case_posts_parent_id ON case_posts(parent_id);
```

### flashcard_decks

Stores flashcard decks.

```sql
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flashcard_decks_room_id ON flashcard_decks(room_id);
CREATE INDEX idx_flashcard_decks_status ON flashcard_decks(status);
CREATE INDEX idx_flashcard_decks_subject ON flashcard_decks(subject);
```

### flashcards

Stores individual flashcards.

```sql
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tags TEXT[],
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_tags ON flashcards USING GIN(tags);
```

### study_sessions

Stores study session information.

```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

CREATE INDEX idx_study_sessions_room_id ON study_sessions(room_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
```

### ai_interactions

Stores AI assistant interactions.

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('summary', 'quiz', 'misconception', 'recommendation', 'flashcard')),
  input TEXT NOT NULL,
  output TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);
```

### audit_logs

Stores audit logs for security and compliance.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### yjs_documents

Stores Yjs document snapshots.

```sql
CREATE TABLE yjs_documents (
  id VARCHAR(255) PRIMARY KEY,
  data BYTEA NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_yjs_documents_updated_at ON yjs_documents(updated_at);
```

## Row Level Security (RLS) Policies

### Users Table

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Rooms Table

```sql
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Public rooms can be read by authenticated users
CREATE POLICY "Authenticated users can read public rooms"
  ON rooms FOR SELECT
  USING (NOT is_private OR auth.uid() IS NOT NULL);

-- Private rooms can only be read by participants
CREATE POLICY "Room participants can read room"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = rooms.id AND user_id = auth.uid()
    )
  );

-- Users can create rooms
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Room owners and moderators can update rooms
CREATE POLICY "Room owners can update room"
  ON rooms FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = rooms.id AND user_id = auth.uid() AND role IN ('owner', 'moderator')
    )
  );
```

### Documents Table

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Room participants can read documents
CREATE POLICY "Room participants can read documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = documents.room_id AND user_id = auth.uid()
    )
  );

-- Room participants can create documents
CREATE POLICY "Room participants can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = documents.room_id AND user_id = auth.uid()
    )
  );

-- Document creators and room moderators can update documents
CREATE POLICY "Document creators can update documents"
  ON documents FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = documents.room_id AND user_id = auth.uid() AND role IN ('owner', 'moderator')
    )
  );
```

## Database Functions

### update_updated_at

Automatically update the updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### create_audit_log

Create audit log entries.

```sql
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### updated_at triggers

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Audit log triggers

```sql
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_rooms
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();
```

## Database Views

### active_rooms

View of rooms with active participants.

```sql
CREATE VIEW active_rooms AS
SELECT
  r.*,
  COUNT(rp.user_id) as current_participants,
  MAX(rp.last_active_at) as last_activity
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id
WHERE rp.last_active_at > NOW() - INTERVAL '1 hour'
GROUP BY r.id;
```

### user_activity

View of user activity statistics.

```sql
CREATE VIEW user_activity AS
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  COUNT(DISTINCT rp.room_id) as rooms_joined,
  COUNT(DISTINCT ss.id) as study_sessions,
  SUM(ss.duration_seconds) as total_study_time
FROM users u
LEFT JOIN room_participants rp ON u.id = rp.user_id
LEFT JOIN study_sessions ss ON u.id = ss.user_id
GROUP BY u.id;
```

## Indexing Strategy

### Performance Indexes

- Foreign key indexes on all relationships
- Composite indexes for common query patterns
- GIN indexes for array and JSONB columns
- Partial indexes for filtering on status or boolean fields

### Full-Text Search

```sql
-- Add full-text search for documents
CREATE INDEX idx_documents_content_fts ON documents
USING GIN (to_tsvector('english', content));

-- Add full-text search for case discussions
CREATE INDEX idx_case_discussions_fts ON case_discussions
USING GIN (to_tsvector('english', title || ' ' || patient_history));
```

## Backup Strategy

- Daily automated backups at 2:00 AM UTC
- Point-in-time recovery enabled (7-day retention)
- Weekly full backups with 1-month retention
- Manual backups before major schema changes

## Migration Strategy

- Use Supabase migrations for schema changes
- Version control all migration files
- Test migrations on staging environment first
- Create rollback procedures for each migration
- Use transactions for multi-step migrations
