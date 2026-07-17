---
name: mistake-learner
description: Learns from all mistakes made during development sessions, records them systematically, and provides proactive guidance to prevent similar mistakes in the future.
---

# Mistake Learner

## Primary Directive

Your goal is to systematically learn from all mistakes made during development, record them in a structured knowledge base, and provide proactive guidance to prevent similar mistakes in future sessions.

## When to Use This Skill

Activate this skill when:
- Any error occurs during development
- A build fails
- Tests fail
- Runtime errors are encountered
- Logic bugs are discovered
- Performance issues are identified
- Security vulnerabilities are found
- User-reported issues are resolved
- Code review feedback indicates problems

## Mistake Knowledge Base Structure

### File Location
- Path: `.agents/knowledge/mistakes-[category].json`
- Categories: `build`, `runtime`, `logic`, `performance`, `security`, `testing`, `deployment`
- Format: JSON with structured entries

### Mistake Entry Schema

Each mistake must be recorded in the following JSON structure:

```json
{
  "mistake_id": "unique-identifier",
  "timestamp": "YYYY-MM-DD HH:MM:SS",
  "category": "build|runtime|logic|performance|security|testing|deployment",
  "severity": "critical|high|medium|low",
  "title": "Brief descriptive title",
  "description": "Detailed description of the mistake",
  "context": {
    "file": "path/to/file",
    "line": 123,
    "function": "functionName",
    "code_snippet": "Problematic code",
    "environment": "development|staging|production"
  },
  "error_message": "Actual error message if applicable",
  "root_cause": "Analysis of why the mistake occurred",
  "solution": "How the mistake was fixed",
  "prevention": {
    "strategies": ["Strategy 1", "Strategy 2"],
    "code_patterns": ["Pattern to avoid", "Pattern to use instead"],
    "tests_to_add": ["Test case descriptions"],
    "documentation_links": ["References to relevant docs"]
  },
  "related_mistakes": ["mistake_id_1", "mistake_id_2"],
  "occurrence_count": 1,
  "agent": "Agent name",
  "session": "Session ID",
  "resolved": true,
  "resolution_time": "YYYY-MM-DD HH:MM:SS"
}
```

## Mistake Categories

### 1. Build Mistakes
- Compilation errors
- Dependency conflicts
- Configuration errors
- Build script failures
- TypeScript errors
- ESLint violations

### 2. Runtime Mistakes
- Null/undefined errors
- Type mismatches
- API failures
- Network errors
- Database connection issues
- Memory leaks

### 3. Logic Mistakes
- Incorrect algorithms
- Wrong business logic
- Edge case handling
- State management errors
- Race conditions
- Incorrect assumptions

### 4. Performance Mistakes
- Inefficient queries
- Memory overuse
- Slow algorithms
- Unnecessary re-renders
- Large bundle sizes
- Missing optimizations

### 5. Security Mistakes
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication flaws
- Authorization issues
- Data exposure
- Insecure dependencies

### 6. Testing Mistakes
- Missing test coverage
- Flaky tests
- Incorrect assertions
- Test environment issues
- Mock failures
- Integration test failures

### 7. Deployment Mistakes
- Configuration mismatches
- Environment variable issues
- Database migration failures
- Service startup failures
- Network connectivity
- Resource limitations

## Mistake Analysis Process

### Step 1: Capture the Mistake
When a mistake occurs:
1. Record the exact error message
2. Capture the stack trace if available
3. Note the file, line, and function
4. Record the code context
5. Document the environment state

### Step 2: Identify Root Cause
Analyze why the mistake occurred:
- Was it a knowledge gap?
- Was it a typo or oversight?
- Was it a misunderstanding of requirements?
- Was it a tooling issue?
- Was it a communication breakdown?

### Step 3: Document the Solution
Record how the mistake was fixed:
- Exact changes made
- Files modified
- Steps taken
- Time to resolve
- Verification method

### Step 4: Develop Prevention Strategies
Create strategies to prevent recurrence:
- Code patterns to avoid
- Code patterns to use
- Tests to add
- Documentation to consult
- Tools to use
- Processes to implement

### Step 5: Update Knowledge Base
Store the mistake in the appropriate category file:
- Generate unique mistake ID
- Categorize appropriately
- Assess severity
- Link to related mistakes
- Update occurrence count if similar mistake exists

## Proactive Prevention System

### Before Development
When starting a new task:
1. Query the knowledge base for similar past mistakes
2. Review prevention strategies for relevant categories
3. Check for common patterns in the codebase
4. Identify potential risks based on historical data

### During Development
While working:
1. Monitor for patterns that match known mistakes
2. Alert when approaching risky code patterns
3. Suggest alternative approaches based on past learnings
4. Recommend tests based on historical failures

### Code Review
When reviewing code:
1. Check against known mistake patterns
2. Verify prevention strategies are applied
3. Ensure appropriate tests are present
4. Validate security considerations

### Build and Test
During build and test:
1. Analyze failures for known patterns
2. Update knowledge base with new patterns
3. Correlate failures with past mistakes
4. Generate insights for improvement

## Mistake Analysis Dashboard

### Key Metrics
- Total mistakes by category
- Mistakes over time trends
- Most common mistake patterns
- Average resolution time
- Recurrence rate by pattern
- Agent-specific mistake profiles

### Reports
Generate regular reports:
- Weekly mistake summary
- Monthly trend analysis
- Recurring mistake alerts
- Prevention effectiveness metrics
- Knowledge base growth statistics

## Integration with Development Workflow

### Error Capture
Automatically capture errors from:
- Build logs
- Test runners
- Runtime exceptions
- Console errors
- User reports
- Code review feedback

### Pattern Recognition
Identify patterns in:
- Error types
- File locations
- Code structures
- Agent behavior
- Time patterns
- Environment factors

### Intelligent Alerts
Provide alerts when:
- Similar mistake patterns are detected
- Prevention strategies aren't followed
- High-risk code is written
- Common pitfalls are approached
- Testing coverage is insufficient

## Knowledge Base Management

### File Organization
```
.agents/knowledge/
├── mistakes-build.json
├── mistakes-runtime.json
├── mistakes-logic.json
├── mistakes-performance.json
├── mistakes-security.json
├── mistakes-testing.json
├── mistakes-deployment.json
└── mistakes-index.json
```

### Index File
Maintain an index file for quick lookup:
```json
{
  "total_mistakes": 150,
  "last_updated": "2024-01-15 HH:MM:SS",
  "categories": {
    "build": 25,
    "runtime": 45,
    "logic": 30,
    "performance": 15,
    "security": 10,
    "testing": 20,
    "deployment": 5
  },
  "top_mistakes": [
    "mistake_id_1",
    "mistake_id_2",
    "mistake_id_3"
  ],
  "recent_mistakes": [
    "mistake_id_4",
    "mistake_id_5"
  ]
}
```

### Knowledge Base Queries
Support queries for:
- Find mistakes by category
- Find mistakes by severity
- Find mistakes by file pattern
- Find mistakes by agent
- Find similar mistakes
- Find recurring patterns
- Find prevention strategies

## Learning and Improvement

### Pattern Recognition
- Identify recurring mistake patterns
- Detect trends in mistake occurrence
- Correlate mistakes with code changes
- Analyze mistake frequency by context

### Adaptive Prevention
- Update prevention strategies based on effectiveness
- Prioritize high-impact prevention strategies
- Customize alerts based on agent behavior
- Adapt to project-specific patterns

### Knowledge Evolution
- Archive outdated entries
- Update entries with new insights
- Merge duplicate entries
- Refine categorization over time
- Improve root cause analysis

## Best Practices

1. **Blameless Analysis**: Focus on the mistake, not the person
2. **Complete Documentation**: Capture all relevant context
3. **Actionable Prevention**: Provide specific, implementable strategies
4. **Regular Review**: Periodically review and update the knowledge base
5. **Share Insights**: Communicate learnings across the team
6. **Measure Effectiveness**: Track if prevention strategies work
7. **Continuous Improvement**: Refine the system based on usage

## Example Mistake Entry

```json
{
  "mistake_id": "runtime-null-2024-01-15-001",
  "timestamp": "2024-01-15 14:32:45",
  "category": "runtime",
  "severity": "high",
  "title": "Null reference error in user profile component",
  "description": "Attempted to access user.profile.name when user.profile was undefined",
  "context": {
    "file": "src/components/UserProfile.tsx",
    "line": 45,
    "function": "renderUserName",
    "code_snippet": "const userName = user.profile.name;",
    "environment": "development"
  },
  "error_message": "TypeError: Cannot read property 'name' of undefined",
  "root_cause": "Assumed user.profile always exists without checking if user data is fully loaded",
  "solution": "Added optional chaining and null check: const userName = user.profile?.name || 'Unknown';",
  "prevention": {
    "strategies": [
      "Always use optional chaining for nested property access",
      "Add null checks for API data that may be incomplete",
      "Implement proper loading states before rendering user data"
    ],
    "code_patterns": [
      "Avoid: object.property.nestedProperty",
      "Use: object?.property?.nestedProperty"
    ],
    "tests_to_add": [
      "Test component with undefined nested properties",
      "Test component with partially loaded user data",
      "Test component loading state"
    ],
    "documentation_links": [
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining"
    ]
  },
  "related_mistakes": ["runtime-null-2024-01-10-005"],
  "occurrence_count": 3,
  "agent": "Devin",
  "session": "session-abc123",
  "resolved": true,
  "resolution_time": "2024-01-15 14:45:30"
}
```

## Integration with Other Skills

This skill should integrate with:
- **change-logger**: Correlate mistakes with specific changes
- **create-implementation-plan**: Check plans against known mistake patterns
- **vercel-react-best-practices**: Apply React-specific mistake prevention
- **supabase-postgres-best-practices**: Apply database-specific mistake prevention
- **testing**: Generate tests based on historical mistakes

## Reporting and Analytics

### Mistake Trends
- Track mistake frequency over time
- Identify increasing/decreasing trends
- Correlate with project milestones
- Analyze seasonal patterns

### Prevention Effectiveness
- Measure recurrence rates
- Track time between similar mistakes
- Assess prevention strategy adoption
- Calculate impact on development velocity

### Agent Performance
- Agent-specific mistake profiles
- Learning rate analysis
- Strength and weakness identification
- Personalized prevention recommendations

## Troubleshooting

### Common Issues
1. **Knowledge base not updating**: Check file permissions
2. **Duplicate entries**: Implement deduplication logic
3. **Missing context**: Improve error capture mechanisms
4. **Poor prevention strategies**: Refine based on feedback

### Resolution Steps
1. Verify `.agents/knowledge/` directory exists
2. Check JSON file integrity
3. Validate mistake entry schema
4. Review index file consistency
5. Test query functionality

## Continuous Learning

The system should continuously improve by:
- Learning from new mistakes
- Refining prevention strategies
- Updating pattern recognition
- Improving categorization
- Enhancing prediction accuracy
- Expanding knowledge base coverage