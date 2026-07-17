---
name: change-logger
description: Automatically logs all changes made during development sessions to a .txt file with timestamps, file paths, and change descriptions.
---

# Change Logger

## Primary Directive

Your goal is to automatically log all changes made during development sessions to a text file. You must capture every modification with precise timestamps, file paths, and detailed change descriptions.

## When to Use This Skill

Activate this skill when:
- Any file is created, modified, or deleted
- API endpoints are added or modified
- Database schema changes occur
- Configuration files are updated
- Dependencies are added or removed
- Tests are created or modified
- Documentation is updated

## Log File Structure

### File Location
- Path: `.agents/logs/changes-[YYYY-MM-DD].txt`
- Rotation: Create new log file daily
- Format: Plain text with structured entries

### Log Entry Format

Each change must be logged in the following format:

```
================================================================================
TIMESTAMP: [YYYY-MM-DD HH:MM:SS]
SESSION: [Session ID or description]
OPERATION: [CREATE|MODIFY|DELETE|RENAME]
FILE: [File path]
================================================================================
CHANGE DESCRIPTION:
[Detailed description of what was changed and why]

BEFORE:
[Previous content if applicable]

AFTER:
[New content if applicable]

CONTEXT:
- Related files: [List of related files]
- API endpoints affected: [List if applicable]
- Database changes: [Description if applicable]
- Dependencies: [Any dependency changes]

AGENT: [Agent name that made the change]
TASK: [Task description or ticket reference]
================================================================================
```

## Logging Requirements

### Automatic Logging
- Log every file operation (create, modify, delete, rename)
- Log all API endpoint changes
- Log all database schema modifications
- Log all configuration changes
- Log all dependency updates
- Log all test additions/modifications
- Log all documentation updates

### Context Information
For each change, capture:
- **What**: Exact description of the change
- **Why**: Reason for the change (if known)
- **When**: Precise timestamp
- **Where**: File path and line numbers if applicable
- **Who**: Agent or user who made the change
- **How**: Method used (edit, write, delete, etc.)

### Change Categories

1. **Code Changes**
   - Feature implementations
   - Bug fixes
   - Refactoring
   - Performance improvements

2. **API Changes**
   - New endpoints
   - Modified endpoints
   - Endpoint deprecations
   - Authentication changes

3. **Database Changes**
   - Schema modifications
   - Migration files
   - Seed data changes
   - Index additions/removals

4. **Configuration Changes**
   - Environment variables
   - Configuration files
   - Build scripts
   - Deployment configurations

5. **Dependency Changes**
   - Package additions
   - Version updates
   - Dependency removals
   - Security patches

6. **Documentation Changes**
   - README updates
   - API documentation
   - Comments additions
   - Inline documentation

## Session Management

### Session Initialization
When starting a new logging session:
1. Create or append to today's log file
2. Add session header with timestamp
3. Include session context (user, project, task)
4. Generate unique session ID

### Session Header Format

```
================================================================================
NEW SESSION STARTED
SESSION ID: [UUID or timestamp-based ID]
DATE: [YYYY-MM-DD]
TIME: [HH:MM:SS]
USER: [User name or identifier]
PROJECT: [Project name]
TASK: [Overall task description]
================================================================================
```

### Session Termination
When ending a session:
1. Add session footer with timestamp
2. Count total changes in session
3. Summary of change types
4. Session duration

### Session Footer Format

```
================================================================================
SESSION ENDED
END TIME: [HH:MM:SS]
DURATION: [HH:MM:SS]
TOTAL CHANGES: [Number]
CHANGE BREAKDOWN:
- Code changes: [Number]
- API changes: [Number]
- Database changes: [Number]
- Configuration changes: [Number]
- Dependency changes: [Number]
- Documentation changes: [Number]
================================================================================
```

## Log File Management

### File Rotation
- Create new log file at midnight
- Keep logs for 30 days
- Archive old logs to `.agents/logs/archive/`
- Compress archives older than 7 days

### File Naming Convention
- Active: `changes-[YYYY-MM-DD].txt`
- Archived: `changes-[YYYY-MM-DD].txt.gz`

### Log Retention
- Active logs: 30 days
- Archived logs: 90 days
- Maximum total log size: 100MB

## Integration with Development Workflow

### Before Making Changes
1. Check if logging is active
2. Verify log file exists and is writable
3. Ensure session is initialized
4. Prepare change context

### During Changes
1. Capture change details before execution
2. Log the operation type
3. Record file paths and line numbers
4. Document the reason for change
5. Capture before/after states

### After Changes
1. Verify change was successful
2. Update log entry with completion status
3. Add any error information if applicable
4. Log any follow-up actions needed

## Error Handling

### Logging Failures
- If log file cannot be created, attempt to create `.agents/logs/` directory
- If write fails, retry 3 times with 1-second delays
- If all retries fail, alert user and continue with changes
- Maintain backup log in temporary directory

### Recovery
- Implement log rotation on startup
- Check for incomplete log entries
- Repair truncated entries if possible
- Alert user to any logging issues

## Search and Analysis

### Log Query Patterns
- Find all changes to a specific file
- Find changes by agent
- Find changes within a time range
- Find changes by category
- Find changes related to specific features

### Analysis Features
- Count changes per day
- Identify most changed files
- Track agent activity
- Calculate change frequency
- Generate change statistics

## Best Practices

1. **Log Immediately**: Log changes as they happen, not in batches
2. **Be Specific**: Include exact file paths, line numbers, and function names
3. **Provide Context**: Explain why changes were made
4. **Stay Consistent**: Use the same format for all log entries
5. **Review Regularly**: Check logs for completeness and accuracy
6. **Archive Properly**: Follow file rotation and retention policies
7. **Secure Sensitive Data**: Avoid logging sensitive information like passwords or API keys

## Integration Points

This skill should integrate with:
- File edit operations (edit tool)
- File write operations (write tool)
- File delete operations
- Git operations
- API endpoint modifications
- Database migrations
- Dependency management

## Example Log Entry

```
================================================================================
TIMESTAMP: 2024-01-15 14:32:45
SESSION: session-abc123
OPERATION: MODIFY
FILE: /Users/jaysonreales/Desktop/dev-project/boardprep-canvas/.agents/API.md
================================================================================
CHANGE DESCRIPTION:
Updated API base URLs from production to localhost for local development.

BEFORE:
Development: https://dev-api.myboardprep.com
Production: https://api.myboardprep.com

AFTER:
Local: http://localhost:3000

CONTEXT:
- Related files: .agents/docs/api/README.md
- API endpoints affected: All endpoints
- Database changes: None
- Dependencies: None

AGENT: Devin
TASK: Update API URLs to localhost
================================================================================
```

## Troubleshooting

### Common Issues
1. **Log file not created**: Check directory permissions
2. **Incomplete entries**: Check disk space and file permissions
3. **Missing timestamps**: Verify system time synchronization
4. **Large log files**: Implement rotation or archiving

### Resolution Steps
1. Verify `.agents/logs/` directory exists
2. Check file system permissions
3. Ensure disk space is available
4. Review log file for corruption
5. Test logging with simple operations