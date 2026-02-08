# Request & Email Logger

A Next.js-based request logging system with a clean debugging UI, now with **email data support**.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 🔍 **Debug UI**: Root page (`/`) - View, filter, and search logged requests
- 💾 **In-Memory Storage**: Simple and fast (upgradeable to persistent storage)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS
- 📊 **Request Details**: Captures method, headers, body, timestamp, and IP
- 🔄 **Backward Compatible**: Works with both API requests and email data

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the debug UI.

## API Documentation

### POST /api/log

Logs any incoming request with full details. Automatically detects and handles email data.

#### Regular API Request

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello World"}'
```

**Response**:
```json
{
  "success": true,
  "id": "unique-request-id",
  "timestamp": "2026-02-07T18:15:00.000Z",
  "isEmail": false
}
```

#### Email Data Request

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "emailSubject": "Project Update",
    "emailBody": "Here is the latest update on our project...",
    "emailFrom": "alice@example.com",
    "emailTo": ["bob@example.com", "charlie@example.com"],
    "emailType": "sent"
  }'
```

**Response**:
```json
{
  "success": true,
  "id": "unique-request-id",
  "timestamp": "2026-02-07T18:15:00.000Z",
  "isEmail": true
}
```

### Email Fields

When logging email data, include these fields:

- **emailSubject** (string, optional): Email subject line
- **emailBody** (string, optional): Full email content/message
- **emailFrom** (string, optional): Sender email address
- **emailTo** (string[], optional): Array of recipient email addresses
- **emailType** (string, optional): Type of email - `"received"`, `"sent"`, or `"draft"`

All email fields are optional, but including at least one email field will mark the request as an email in the UI.

### GET /api/log

Retrieves all logged requests.

**Query Parameters**:
- `method` (optional): Filter by HTTP method
- `search` (optional): Search in body content
- `emailType` (optional): Filter by email type (received, sent, draft)
- `isEmail` (optional): Filter by email/non-email (`true` or `false`)

**Response**:
```json
{
  "requests": [...],
  "total": 10
}
```

### DELETE /api/log

Clears all logged requests.

## UI Features

### Filtering & Search

- **Content Type Filter**: View all, only emails, or only API requests
- **Email Type Filter**: Filter emails by type (received, sent, draft)
- **HTTP Method Filter**: Filter by GET, POST, PUT, DELETE, PATCH
- **Search**: Search across all request fields including email content
- **Auto Refresh**: Enable automatic refresh every 2 seconds

### Email Display

Email requests are displayed with:
- 📨 Email badge and type badge
- Subject line prominently displayed
- Sender and recipient information
- Message body preview in list view
- Full message body in detail view
- Clean, email-client-like interface

### Request Statistics

- Total requests count
- Email vs API request breakdown
- Filtered results count

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: In-memory (upgradeable)

## Backward Compatibility

The system is fully backward compatible:
- Regular API requests work exactly as before
- No email fields required for standard logging
- Email detection is automatic based on presence of email fields
- UI adapts based on request type

## Use Cases

### API Development
- Debug webhook payloads
- Monitor API requests during development
- Test request/response flows

### Email Testing
- Log outgoing emails during development
- Debug email content and formatting
- Monitor email delivery attempts
- Test email workflows

### Integration Testing
- Capture and inspect integration data
- Verify data transformation
- Debug data flows between systems

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] Export logged requests and emails (JSON, CSV, EML)
- [ ] Email attachment support
- [ ] HTML email rendering
- [ ] Webhook forwarding
- [ ] Request replay functionality
- [ ] Real-time updates with WebSockets
- [ ] Authentication and access control
- [ ] Email templates library
- [ ] Scheduled email simulation

## License

MIT
