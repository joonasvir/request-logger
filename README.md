# Request Logger

A Next.js-based request logging system with a clean debugging UI.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 🔍 **Debug UI**: Root page (`/`) - View, filter, and search logged requests
- 💾 **In-Memory Storage**: Simple and fast (upgradeable to persistent storage)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS
- 📊 **Request Details**: Captures method, headers, body, timestamp, and IP

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

### Testing the API

Send requests to the logging endpoint:

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello World"}'
```

## API Documentation

### POST /api/log

Logs any incoming request with full details.

**Request**: Any JSON body

**Response**:
```json
{
  "success": true,
  "id": "unique-request-id",
  "timestamp": "2026-02-07T18:15:00.000Z"
}
```

### GET /api/log

Retrieves all logged requests.

**Query Parameters**:
- `method` (optional): Filter by HTTP method
- `search` (optional): Search in body content

**Response**:
```json
{
  "requests": [...],
  "total": 10
}
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: In-memory (upgradeable)

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] Export logged requests (JSON, CSV)
- [ ] Webhook forwarding
- [ ] Request replay functionality
- [ ] Real-time updates with WebSockets
- [ ] Authentication and access control

## License

MIT
