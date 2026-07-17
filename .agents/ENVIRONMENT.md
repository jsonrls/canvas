# Environment Setup Guide

## Overview

This document provides instructions for setting up the development environment for the MyBoardPrep Collaborative Learning Suite.

## Prerequisites

### Required Software

- **Node.js**: Version 20.9 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: Latest stable version
- **Supabase CLI**: For local development

### Optional Software

- **PostgreSQL Client**: For direct database access
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (for API testing)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/boardprep-canvas.git
cd boardprep-canvas
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server-only Supabase configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_DB_POOLER_HOST=aws-0-your-region.pooler.supabase.com

# Yjs WebSocket Server
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234
YJS_HOST=127.0.0.1
YJS_PORT=1234

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# OpenAI API (optional, for AI features)
OPENAI_API_KEY=your_openai_api_key

```

Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. The current browser bundle does not create a Supabase client; authenticated Data API calls remain server-side and carry the validated user JWT so RLS applies.

### 5. Set Up Supabase Project

#### Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - Name: `boardprep-dev`
   - Database Password: [generate strong password]
   - Region: Choose closest to your location
4. Wait for project to be created (2-3 minutes)

#### Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - Project URL
   - service_role secret key

#### Update Environment Variables

Add the project URL, server-only service-role key, database password, and session-pooler hostname to `.env`. Keep the service key out of public variables and client bundles.

### 6. Apply the Remote Database Migrations

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply database migrations
supabase db push
```

### 7. Seed Database (Optional)

No Docker-backed local Supabase stack or `DATABASE_URL` is required for this vertical slice.

## Development Commands

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm run start
```

### Testing

```bash
npm run verify:yjs
npm run verify:schema
npm run verify:version-history
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run type-check
```

### Database Operations

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset local database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/database.ts

# Open database dashboard
supabase dashboard
```

## Project Structure

```
boardprep-canvas/
├── .agents/              # Documentation and configuration
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # State management
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── styles/          # Global styles
├── public/              # Static assets
├── tests/               # Test files
├── supabase/            # Supabase configuration
├── .env.local          # Environment variables (local)
├── .env.example        # Environment variables template
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
└── next.config.js      # Next.js configuration
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

#### Supabase Connection Issues

If you can't connect to Supabase:

```bash
# Check Supabase status
supabase status

# Restart Supabase
supabase stop
supabase start

# Check logs
supabase logs
```

#### Dependency Issues

If you encounter dependency errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use npm ci for clean install
npm ci
```

#### TypeScript Errors

If TypeScript errors occur:

```bash
# Regenerate types
supabase gen types typescript --local > src/types/database.ts

# Clear TypeScript cache
rm -rf .next
npm run dev
```

## Environment-Specific Configurations

### Development Environment

- Local development server
- Local Supabase instance
- Debug logging enabled
- Hot module replacement
- Source maps enabled

### Staging Environment

- Deployed to Vercel staging
- Staging Supabase project
- Production-like configuration
- Monitoring enabled
- Error tracking enabled

### Production Environment

- Deployed to Vercel production
- Production Supabase project
- Optimized build
- Error tracking enabled
- Performance monitoring enabled
- Debug logging disabled

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### VS Code Extensions

Recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- GitLens
- Thunder Client

## Git Configuration

### Pre-commit Hooks

Install Husky for pre-commit hooks:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run test:unit"
```

### Commitlint

Install Commitlint for commit message linting:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']};" > commitlint.config.js
```

## Performance Monitoring

### Local Monitoring

Enable performance monitoring in development:

```env
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Profiling

Profile the application:

```bash
# Build with profiling
npm run build -- --profile

# Analyze bundle
npm run analyze
```

## Security Best Practices

### Environment Variables

- Never commit `.env.local` to version control
- Use `.env.example` as a template
- Rotate keys regularly
- Use different keys for different environments

### API Keys

- Store API keys in environment variables
- Use service role keys only on server
- Never expose service role keys to client
- Rotate compromised keys immediately

## Continuous Integration

### GitHub Actions

The project uses GitHub Actions for CI/CD. Ensure:

- Environment variables are set in GitHub Secrets
- Tests pass before merging
- Linting passes before merging
- Type checking passes before merging

## Next Steps

After setting up the environment:

1. Read the [AGENTS.md](./AGENTS.md) for development guidelines
2. Review the [STYLEGUIDE.md](./STYLEGUIDE.md) for coding standards
3. Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for system understanding
4. Explore the [API.md](./API.md) for API documentation
5. Set up your feature branch and start contributing

## Support

For environment setup issues:

- Check existing GitHub issues
- Create a new issue with detailed error messages
- Contact the development team
- Check Supabase documentation for platform-specific issues

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Yjs Documentation](https://docs.yjs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
