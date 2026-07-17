# Product Requirements Document (PRD)

# MyBoardPrep Collaborative Learning Suite

## Version 1.0

## Overview

The Collaborative Learning Suite brings real-time collaboration to
MyBoardPrep using Yjs. Instead of students consuming content
individually, they can learn together through shared notes, annotations,
whiteboards, case discussions, and AI-assisted study sessions.

## Goals

-   Increase student engagement
-   Improve knowledge retention through collaboration
-   Enable instructor-guided learning
-   Support real-time and offline-first editing
-   Differentiate MyBoardPrep from traditional review platforms

------------------------------------------------------------------------

# Target Users

## Students

-   Veterinary Medicine
-   Psychology
-   Fisheries
-   Agriculture
-   Food Technology
-   Maritime
-   Professional Education

## Instructors

-   Subject Matter Experts
-   Lecturers
-   Review Coaches

## Administrators

-   Manage collaborative spaces
-   Moderate discussions
-   Review analytics

------------------------------------------------------------------------

# Core Features

## 1. Collaborative Notes

Students and instructors edit the same document simultaneously.

### Capabilities

-   Real-time editing
-   Rich text formatting
-   Live cursors
-   User presence
-   Inline comments
-   Mentions (@username)
-   Autosave
-   Version history
-   Offline editing
-   Automatic conflict resolution

------------------------------------------------------------------------

## 2. Live Review Workspace

Every review class includes a shared workspace containing:

-   Lecture notes
-   Question area
-   High-yield facts
-   Mnemonics
-   Key formulas
-   Instructor announcements

------------------------------------------------------------------------

## 3. Shared PDF Annotation

Supported actions:

-   Highlight text
-   Underline
-   Draw
-   Sticky notes
-   Page comments
-   Replies
-   Bookmarks

Annotations synchronize instantly for all participants.

------------------------------------------------------------------------

## 4. Collaborative Case Discussions

Each clinical case includes:

-   Patient history
-   Laboratory results
-   Images
-   Diagnosis discussion
-   Differential diagnosis
-   Treatment plan
-   Instructor feedback
-   AI summary

------------------------------------------------------------------------

## 5. Live Whiteboard

Supports:

-   Drawing
-   Shapes
-   Text
-   Image insertion
-   Laser pointer
-   Multi-user editing

------------------------------------------------------------------------

## 6. Group Flashcards

Students collaboratively create flashcards.

Workflow:

Draft → Review → Instructor Approval → Published Deck

------------------------------------------------------------------------

## 7. Study Rooms

Each room contains:

-   Shared notes
-   Whiteboard
-   Chat
-   Flashcards
-   Checklist
-   Pomodoro timer
-   Member presence

------------------------------------------------------------------------

## 8. AI Study Assistant

AI can:

-   Summarize discussions
-   Detect misconceptions
-   Generate quizzes
-   Generate flashcards
-   Produce review sheets
-   Recommend learning resources

------------------------------------------------------------------------

# Functional Requirements

## Collaboration

-   Real-time synchronization (\<250 ms target)
-   Unlimited concurrent edits (subject to infrastructure)
-   Automatic conflict resolution via CRDT
-   Presence indicators
-   Live cursor tracking

## Permissions

Roles:

-   Admin
-   Instructor
-   Moderator
-   Student

Permissions include:

-   Read
-   Comment
-   Edit
-   Approve
-   Publish

------------------------------------------------------------------------

# Non-Functional Requirements

## Performance

-   Initial load \<2 seconds
-   Autosave every change
-   Offline editing supported

## Reliability

-   Automatic reconnection
-   Data persistence
-   Version history
-   Recovery after disconnect

## Security

-   Authenticated access
-   Room-based authorization
-   Encrypted transport (HTTPS/WSS)
-   Audit logs for instructor actions

------------------------------------------------------------------------

# Suggested Technology Stack

Frontend

-   React
-   Tiptap
-   React PDF
-   Excalidraw
-   Tailwind CSS

Backend

-   Supabase
-   PostgreSQL
-   Supabase Storage

Realtime

-   Yjs
-   y-websocket
-   Awareness API

AI

-   OpenAI Responses API
-   Embeddings (optional)

------------------------------------------------------------------------

# Success Metrics

-   Daily active collaborative sessions
-   Average session duration
-   Notes created per review class
-   PDF annotations per document
-   Case discussions completed
-   Flashcards generated
-   AI summaries viewed
-   Student satisfaction
-   Board exam pass rate improvements

------------------------------------------------------------------------

# Future Enhancements

-   Voice collaboration
-   Live polling
-   Collaborative concept maps
-   Shared code editor
-   Mobile offline synchronization
-   Learning analytics dashboard
-   AI tutor participating in discussions
