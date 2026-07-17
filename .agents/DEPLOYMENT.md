# Deployment Documentation

## Overview

This document describes the deployment process and infrastructure for the MyBoardPrep Collaborative Learning Suite.

## Environments

### Development

- **URL**: dev.myboardprep.com
- **Purpose**: Active development and testing
- **Data**: Test data, can be reset
- **Access**: Development team only

### Staging

- **URL**: staging.myboardprep.com
- **Purpose**: Pre-production testing
- **Data**: Production-like data
- **Access**: Development and QA teams

### Production

- **URL**: app.myboardprep.com
- **Purpose**: Live production environment
- **Data**: Real user data
- **Access**: Authorized personnel only

## Infrastructure

### Frontend Hosting

**Platform**: Vercel

- **Framework**: Next.js/React
- **Build**: Optimized production builds
- **CDN**: Vercel Edge Network
- **SSL**: Automatic SSL certificates
- **Deployment**: Git-based deployment

### Backend Services

**Platform**: Supabase

- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions

### Yjs WebSocket Server

**Platform**: Railway or Fly.io

- **Runtime**: Node.js
- **Scaling**: Horizontal scaling
- **Persistence**: PostgreSQL integration
- **Load Balancing**: Built-in load balancing

## Deployment Process

### Frontend Deployment

#### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

#### Build Process

```bash
# Run tests
npm test

# Build for production
npm run build

# Run production build locally (optional)
npm run start
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
NEXT_PUBLIC_YJS_WS_URL=wss://yjs-server.myboardprep.com
NEXT_PUBLIC_SITE_URL=https://app.myboardprep.com
```

The service-role key is a server secret. Configure it separately on Vercel and the Yjs host; never prefix it with `NEXT_PUBLIC_` or expose it to browser code. The Yjs deployment also requires `SUPABASE_URL` and should set `YJS_ALLOWED_ORIGIN=https://app.myboardprep.com`.

### Backend Deployment

#### Supabase Setup

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - Create new project
   - Choose region closest to users

2. **Database Migration**

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to project
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```

3. **Enable RLS**
   - Apply Row Level Security policies
   - Test policies with different user roles

4. **Configure Storage**
   - Create storage buckets
   - Set up CDN
   - Configure CORS policies

#### Yjs Server Deployment

**Deploy to Railway**

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Configure the service's start command as `npm start`, then deploy
railway up
```

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--scope myboardprep"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod --scope myboardprep"
```

## Monitoring & Logging

### Application Monitoring

**Tools**: Vercel Analytics, Sentry

```javascript
// Sentry configuration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Database Monitoring

- Supabase Dashboard
- Query performance metrics
- Connection pool monitoring
- Storage usage tracking

### WebSocket Monitoring

- Connection count
- Message throughput
- Error rates
- Latency metrics

## Backup & Recovery

### Database Backups

- **Frequency**: Daily automated backups
- **Retention**: 7-day point-in-time recovery
- **Location**: Multiple regions for redundancy
- **Testing**: Monthly restore tests

### Disaster Recovery

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 15 minutes
3. **Failover**: Automatic failover to backup region
4. **Data Restoration**: Point-in-time recovery available

## Scaling Strategy

### Horizontal Scaling

- **Frontend**: Vercel automatic scaling
- **Backend**: Supabase auto-scaling
- **WebSocket**: Redis pub/sub for scaling

### Vertical Scaling

- **Database**: Upgrade instance size based on load
- **WebSocket**: Increase server resources
- **Monitoring**: Auto-scaling based on metrics

## Security in Production

### SSL/TLS

- All connections use HTTPS/WSS
- Automatic certificate management
- HSTS headers enabled

### Firewall Rules

- Whitelist allowed IP ranges
- Restrict database access
- Rate limiting on all endpoints

### Secrets Management

- Environment variables for all secrets
- No secrets in code
- Regular secret rotation

## Rollback Procedure

### Frontend Rollback

```bash
# Via Vercel CLI
vercel rollback <deployment-url>

# Or revert git commit
git revert <commit-hash>
git push origin main
```

### Database Rollback

```bash
# Use Supabase CLI
supabase db reset

# Or specific migration
supabase migration down
```

## Performance Optimization

### Frontend Optimization

- Code splitting
- Image optimization
- Lazy loading
- CDN caching

### Backend Optimization

- Database indexing
- Query optimization
- Connection pooling
- Caching strategies

### WebSocket Optimization

- Message batching
- Compression
- Connection pooling
- Load balancing

## Troubleshooting

### Common Issues

**Build Failures**

- Check environment variables
- Verify dependencies
- Review build logs

**Database Connection Issues**

- Check connection string
- Verify network access
- Review connection pool

**WebSocket Connection Issues**

- Check WSS URL
- Verify JWT token
- Review server logs

## Maintenance

### Regular Tasks

- **Daily**: Monitor error rates and performance
- **Weekly**: Review security logs
- **Monthly**: Dependency updates
- **Quarterly**: Security audits

### Update Process

1. Test in development environment
2. Deploy to staging
3. Run full test suite
4. Schedule production deployment
5. Monitor after deployment
6. Prepare rollback plan

## Support

For deployment issues:

- **Documentation**: https://docs.myboardprep.com
- **Support Email**: support@myboardprep.com
- **Emergency**: emergency@myboardprep.com
