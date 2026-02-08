# Request & Email Logger with Scraper Monitoring

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, and monitoring news content scraping activity.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Scraper Monitor**: Specialized interface for tracking news outlet scraping
- 🔍 **Debug UI**: Root page (`/`) - View, filter, and search logged requests
- 💾 **In-Memory Storage**: Simple and fast (upgradeable to persistent storage)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS and dark mode
- 📊 **Request Details**: Captures method, headers, body, timestamp, and IP
- 🔄 **Backward Compatible**: Works with API requests, email data, and scraper content

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the following URLs:
- [http://localhost:3000](http://localhost:3000) - Main debug console
- [http://localhost:3000/scraper](http://localhost:3000/scraper) - Scraper monitoring dashboard

## API Documentation

### POST /api/log

Logs any incoming request with full details. Automatically detects request type (API, email, or scraper).

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
  "timestamp": "2026-02-07T21:15:00.000Z",
  "isEmail": false,
  "isScraper": false
}
```

#### Email Data Request

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "emailSubject": "Project Update",
    "emailBody": "Here is the latest update...",
    "emailFrom": "alice@example.com",
    "emailTo": ["bob@example.com"],
    "emailType": "sent"
  }'
```

#### Scraped News Content

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "NYT Cooking",
    "scraperStatus": "success",
    "articleUrl": "https://cooking.nytimes.com/recipes/12345",
    "scrapedAt": "2026-02-07T21:00:00Z",
    "emailSubject": "5 Weeknight Pasta Recipes",
    "emailBody": "Discover quick and delicious pasta recipes for busy weeknights...",
    "emailFrom": "cooking@nytimes.com"
  }'
```

**Response**:
```json
{
  "success": true,
  "id": "unique-request-id",
  "timestamp": "2026-02-07T21:15:00.000Z",
  "isEmail": true,
  "isScraper": true
}
```

#### App Health Ping

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"source": "App Health Check", "scraperStatus": "success"}'
```

### Field Reference

#### Email Fields
- **emailSubject** (string, optional): Email subject line
- **emailBody** (string, optional): Full email content/message
- **emailFrom** (string, optional): Sender email address
- **emailTo** (string[], optional): Array of recipient email addresses
- **emailType** (string, optional): Type of email - `"received"`, `"sent"`, or `"draft"`

#### Scraper Fields
- **source** (string, optional): News outlet name (e.g., "NYT Cooking", "The Atlantic")
- **scraperStatus** (string, optional): Scraping status - `"success"`, `"error"`, or `"pending"`
- **articleUrl** (string, optional): Source URL of the scraped content
- **scrapedAt** (string, optional): ISO 8601 timestamp of when content was scraped

### GET /api/log

Retrieves logged requests with optional filtering.

**Query Parameters**:
- `method` (optional): Filter by HTTP method
- `search` (optional): Search across all fields
- `emailType` (optional): Filter by email type (received, sent, draft)
- `isEmail` (optional): Filter email vs non-email (`true` or `false`)
- `isScraper` (optional): Filter scraper vs non-scraper (`true` or `false`)
- `source` (optional): Filter by news source name
- `status` (optional): Filter by scraper status (success, error, pending)

**Examples**:
```bash
# Get all scraper data
curl http://localhost:3000/api/log?isScraper=true

# Get successful scrapes from NYT Cooking
curl "http://localhost:3000/api/log?source=NYT%20Cooking&status=success"

# Get all emails
curl http://localhost:3000/api/log?isEmail=true
```

**Response**:
```json
{
  "requests": [...],
  "total": 10
}
```

### DELETE /api/log

Clears all logged requests.

```bash
curl -X DELETE http://localhost:3000/api/log
```

## User Interfaces

### 1. Debug Console (`/`)

General-purpose debugging interface for all requests:
- View all logged requests (API, email, scraper)
- Search and filter by type, method, email type
- Detailed request inspector
- Real-time statistics
- Auto-refresh capability

### 2. Scraper Monitor (`/scraper`)

Specialized interface for monitoring news scraping:
- **Real-time Dashboard**: Active scraping metrics
  - Total scrapes count
  - Success vs error rates
  - Recent ping activity (last 60 seconds)
- **Source Metrics**: Per-outlet statistics
  - Total scrapes by source
  - Success/error breakdown
  - Visual source indicators
- **Content Display**: Optimized for news articles
  - Email-style content preview
  - Source URL links
  - Clean article body rendering
- **Filtering**: By source, status, or search terms
- **Auto-refresh**: Updates every 3 seconds

## Supported News Sources

The scraper interface includes special icons for:
- 🗓️ **NYT/New York Times** (including NYT Cooking)
- 🌊 **The Atlantic**
- 📬 **Washington Post**
- 🛡️ **The Guardian**
- 🍳 **Cooking newsletters**
- 📰 **Generic news sources**

Any custom source name is supported - the system adapts automatically.

## Use Cases

### API Development
- Debug webhook payloads
- Monitor API requests during development
- Test request/response flows

### Email Testing & Monitoring
- Log outgoing emails during development
- Debug email content and formatting
- Monitor email delivery attempts
- Test email workflows

### News Content Scraping
- Monitor scraper health and activity
- Track scraping success rates by source
- Debug failed scrape attempts
- View scraped newsletter/article content
- Monitor app ping activity

### Integration Testing
- Capture and inspect integration data
- Verify data transformation
- Debug data flows between systems

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: In-memory (up to 200 requests)

## Architecture

```
/api/log              → Single endpoint for all logging
/                     → Debug console (all requests)
/scraper              → Scraper monitor (scraper data only)
/app/components       → Shared components (Navigation)
```

## Backward Compatibility

The system is fully backward compatible:
- Regular API requests work as before
- No special fields required for basic logging
- Email and scraper fields are entirely optional
- Automatic type detection based on fields present
- UI adapts to display appropriate view for each request type

## Storage & Performance

- In-memory storage for fast access
- Automatically maintains last 200 requests
- Older requests are pruned automatically
- Data cleared on server restart (by design)
- Can be upgraded to persistent storage (database)

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] Export functionality (JSON, CSV, EML)
- [ ] Email attachment support
- [ ] HTML email rendering
- [ ] Webhook forwarding for scraper alerts
- [ ] Request replay functionality
- [ ] Real-time updates with WebSockets
- [ ] Authentication and access control
- [ ] Scraping schedule visualization
- [ ] Error rate alerting
- [ ] Historical metrics and trends
- [ ] Content comparison tools
- [ ] RSS feed generation from scraped content

## Development Tips

### Testing Scraper Integration

1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:3000/scraper
3. Send test scraper data using the examples above
4. Watch real-time updates in the dashboard

### Simulating Multiple Sources

```bash
# NYT Cooking
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "NYT Cooking", "scraperStatus": "success", "emailSubject": "Recipe of the Day"}'

# The Atlantic
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "The Atlantic", "scraperStatus": "success", "emailSubject": "Today's Newsletter"}'

# Simulate error
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "The Guardian", "scraperStatus": "error", "emailSubject": "Failed Scrape"}'
```

## License

MIT
