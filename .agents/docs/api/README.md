# API Documentation

This directory contains detailed API documentation for the MyBoardPrep Collaborative Learning Suite.

## API Documentation Structure

For detailed API information, refer to the main [API.md](../../API.md) file.

## Additional API Resources

### API Examples

Example requests and responses for different use cases:

#### Authentication Examples
- User registration
- User login
- Token refresh
- Password reset

#### Collaboration Examples
- Room creation and management
- Document operations
- Real-time synchronization
- Presence management

#### AI Features Examples
- Quiz generation
- Content summarization
- Misconception detection
- Study recommendations

### Postman Collections

Import the Postman collection for easy API testing:

```
docs/api/MyBoardPrep-API-Collection.json
```

### API Versioning

Current API version: v1

- Base URL: `http://localhost:3000/v1`
- WebSocket URL: `ws://localhost:3000/yjs`

### Rate Limiting

- Authenticated users: 1000 requests/hour
- Unauthenticated users: 100 requests/hour
- WebSocket connections: 10 concurrent connections/user

### Error Handling

Standard error response format:

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

### Webhooks

Webhook notifications for real-time events:

- Room events (join, leave, create)
- Document events (create, update, delete)
- User events (presence changes)

## API Testing

### Manual Testing

Use the provided Postman collection or Thunder Client (VS Code extension).

### Automated Testing

API tests are located in:
```
tests/api/
```

Run API tests:
```bash
npm run test:api
```

## API Security

- All endpoints require authentication (except public endpoints)
- JWT tokens for authentication
- Role-based access control
- Rate limiting on all endpoints
- Input validation and sanitization

## API Best Practices

- Use HTTPS for all API calls
- Include authentication headers
- Handle errors gracefully
- Implement retry logic for transient failures
- Cache responses where appropriate
- Use pagination for large datasets

## SDK Documentation

Client SDKs provide convenient access to the API:

- JavaScript/TypeScript SDK
- React SDK
- (Future) Mobile SDKs

See [API.md](../../API.md) for SDK usage examples.
