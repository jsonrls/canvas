# MyBoardPrep Collaborative Learning Suite

A real-time collaborative learning platform for board exam preparation, powered by Yjs for seamless multi-user editing and shared study experiences.

## Overview

The Collaborative Learning Suite transforms individual study into an interactive, social learning experience. Students and instructors can collaborate on notes, annotate PDFs together, discuss clinical cases in real-time, and utilize AI-assisted study tools.

## Key Features

- **Real-time Collaboration**: Sub-250ms synchronization using Yjs CRDTs
- **Collaborative Notes**: Rich text editing with live cursors and presence
- **PDF Annotation**: Shared highlighting, drawing, and sticky notes
- **Case Discussions**: Interactive clinical case analysis
- **Live Whiteboard**: Multi-user drawing and brainstorming
- **Study Rooms**: Dedicated spaces with notes, whiteboard, chat, and tools
- **AI Study Assistant**: Summarization, quiz generation, and resource recommendations

## Technology Stack

### Frontend
- React
- Tiptap (rich text editor)
- React PDF
- Excalidraw (whiteboard)
- Tailwind CSS

### Backend
- Supabase
- PostgreSQL
- Supabase Storage

### Real-time
- Yjs
- y-websocket
- Awareness API

### AI
- OpenAI Responses API
- Embeddings (optional)

## Target Users

- **Students**: Veterinary Medicine, Psychology, Fisheries, Agriculture, Food Technology, Maritime, Professional Education
- **Instructors**: Subject Matter Experts, Lecturers, Review Coaches
- **Administrators**: Manage collaborative spaces and moderate discussions

## Getting Started

See [ENVIRONMENT.md](./ENVIRONMENT.md) for setup instructions.

## Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System Architecture
- [API.md](./API.md) - API Documentation
- [DATABASE.md](./DATABASE.md) - Database Schema
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment Guide
- [TESTING.md](./TESTING.md) - Testing Strategy
- [SECURITY.md](./SECURITY.md) - Security Considerations
- [STYLEGUIDE.md](./STYLEGUIDE.md) - Code Style Guide
- [AGENTS.md](./AGENTS.md) - AI Agent Instructions

## License

[Your License Here]

## Contact

[Your Contact Information]
