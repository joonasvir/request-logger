# Request & Email Logger with News Reader

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, monitoring news scraping activity, and reading scraped articles.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful interface for reading scraped news content
- 🔧 **Scraper Monitor**: Technical monitoring for tracking scraping activity
- 🔍 **Debug Console**: General-purpose request debugging
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
- **[http://localhost:3000](http://localhost:3000)** - Debug Console (all requests)
- **[http://localhost:3000/articles](http://localhost:3000/articles)** - Articles Reader (news content)
- **[http://localhost:3000/scraper](http://localhost:3000/scraper)** - Scraper Monitor (technical metrics)

## User Interfaces

### 1. 📰 Articles Reader (`/articles`) - NEW!

**Purpose**: Beautiful, magazine-style interface for reading scraped news content.

**Features**:
- Card-based article layout
- Source badges with custom styling (NYT, Atlantic, etc.)
- Prominent headlines and content previews
- "Read more" / "Show less" functionality
- Filter by news source or content type
- Search across headlines and content
- Auto-refresh every 5 seconds
- Direct links to original articles
- Content type indicators (Newsletter, Article, Digest, Alert)

**Best for**:
- Reading scraped newsletters and articles
- Browsing news content from multiple sources
- Consuming content in a clean, distraction-free interface

### 2. 🔧 Scraper Monitor (`/scraper`)

**Purpose**: Technical monitoring dashboard for scraping operations.

**Features**:
- Real-time scraping metrics (total, success, errors)
- Recent ping activity tracking
- Per-source statistics and breakdowns
- Scraper status indicators
- Technical request details
- Auto-refresh every 3 seconds

**Best for**:
- Monitoring scraper health
- Debugging failed scrapes
- Tracking scraping frequency
- Technical troubleshooting

### 3. 🔍 Debug Console (`/`)

**Purpose**: General-purpose debugging interface for all requests.

**Features**:
- View all logged requests (API, email, scraper)
- Search and filter by type, method, email type
- Detailed request inspector with headers and body
- Real-time statistics
- Auto-refresh capability

**Best for**:
- General API debugging
- Inspecting raw request data
- Testing webhooks and integrations

## API Documentation

### POST /api/log

Logs any incoming request with full details. Automatically detects request type (API, email, or scraper).

#### Example: Scraped Newsletter Content

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "NYT Cooking",
    "contentType": "newsletter",
    "articleUrl": "https://cooking.nytimes.com/recipes/12345",
    "scraperStatus": "success",
    "scrapedAt": "2026-02-07T21:00:00Z",
    "emailSubject": "5 Quick Weeknight Pasta Recipes",
    "emailBody": "Discover delicious pasta recipes perfect for busy weeknights. From classic carbonara to creative vegetable pastas, these dishes come together in 30 minutes or less.\n\n1. Lemon Garlic Spaghetti\nA bright, zesty dish with...",
    "emailFrom": "cooking@nytimes.com"
  }'
```

**Response**:
```json
{
  "success": true,
  "id": "1707342000000-abc123",
  "timestamp": "2026-02-07T21:15:00.000Z",
  "isEmail": true,
  "isScraper": true
}
```

#### Example: Article Content

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "The Atlantic",
    "contentType": "article",
    "articleUrl": "https://theatlantic.com/technology/...",
    "scraperStatus": "success",
    "emailSubject": "The Future of AI in Education",
    "emailBody": "Full article content here...",
    "emailFrom": "newsletter@theatlantic.com"
  }'
```

#### Example: Daily Digest

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Washington Post",
    "contentType": "digest",
    "scraperStatus": "success",
    "emailSubject": "Morning Brief: Top Stories",
    "emailBody": "Here are today's top stories:\n\n1. Story headline...\n2. Another story..."
  }'
```

#### Regular API Request (still supported)

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello World"}'
```

### Field Reference

#### Email Fields
- **emailSubject** (string, optional): Email subject line / article headline
- **emailBody** (string, optional): Full email content / article text
- **emailFrom** (string, optional): Sender email address
- **emailTo** (string[], optional): Array of recipient email addresses
- **emailType** (string, optional): Type of email - `"received"`, `"sent"`, or `"draft"`

#### Scraper Fields
- **source** (string, optional): News outlet name (e.g., "NYT Cooking", "The Atlantic")
- **scraperStatus** (string, optional): Scraping status - `"success"`, `"error"`, or `"pending"`
- **articleUrl** (string, optional): Source URL of the scraped content
- **scrapedAt** (string, optional): ISO 8601 timestamp of when content was scraped
- **contentType** (string, optional): Type of content - `"newsletter"`, `"article"`, `"digest"`, or `"alert"` (NEW!)

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
- `contentType` (optional): Filter by content type (newsletter, article, digest, alert) (NEW!)

**Examples**:
```bash
# Get all articles and newsletters
curl http://localhost:3000/api/log?isScraper=true&isEmail=true

# Get only newsletters from NYT Cooking
curl "http://localhost:3000/api/log?source=NYT%20Cooking&contentType=newsletter"

# Get all digest-type content
curl http://localhost:3000/api/log?contentType=digest

# Get successful article scrapes
curl "http://localhost:3000/api/log?contentType=article&status=success"
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

## Supported News Sources

The interfaces include special styling for popular sources:
- 🗓️ **NYT/New York Times** (purple badge, including NYT Cooking)
- 🌊 **The Atlantic** (blue badge)
- 📬 **Washington Post** (indigo badge)
- 🛡️ **The Guardian** (cyan badge)
- 🍳 **Cooking newsletters** (orange badge)
- 📰 **Generic news sources** (green badge)

Any custom source name is supported - the system adapts automatically.

## Content Types

Categorize your scraped content:
- **newsletter**: Email newsletters from news outlets
- **article**: Individual articles or stories
- **digest**: Daily/weekly roundups or summary emails
- **alert**: Breaking news or urgent updates

## Use Cases

### News Aggregation & Reading
- Aggregate newsletters from multiple sources
- Read scraped articles in a clean interface
- Search across all your news content
- Track which sources you're following
- Archive interesting articles

### Content Monitoring
- Monitor scraper health and success rates
- Track scraping frequency by source
- Debug failed scrape attempts
- View raw scraped data

### API Development & Testing
- Debug webhook payloads
- Monitor API requests during development
- Test request/response flows
- Inspect email delivery

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Storage**: In-memory (up to 200 requests)

## Architecture

```
/api/log              → Single endpoint for all logging
/                     → Debug console (all requests)
/articles             → Articles reader (news content only)
/scraper              → Scraper monitor (technical metrics)
/app/components       → Shared components (Navigation)
```

## Navigation

All interfaces include a navigation bar for easy switching:
- **🔍 Debug Console**: View all requests and raw data
- **📰 Articles**: Read news content in a magazine-style layout
- **🔧 Monitor**: Technical scraping metrics and monitoring

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

## Development Tips

### Testing the Articles Interface

1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:3000/articles
3. Send test article data using the examples above
4. Watch content appear in real-time with auto-refresh

### Simulating Multiple Sources and Content Types

```bash
# NYT Cooking Newsletter
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "NYT Cooking", "contentType": "newsletter", "scraperStatus": "success", "emailSubject": "Weekend Baking Projects", "emailBody": "Try these delicious recipes this weekend..."}'

# Atlantic Article
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "The Atlantic", "contentType": "article", "scraperStatus": "success", "emailSubject": "The Rise of Remote Work", "emailBody": "An in-depth look at how remote work is changing society...", "articleUrl": "https://theatlantic.com/..."}'

# Washington Post Digest
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "Washington Post", "contentType": "digest", "scraperStatus": "success", "emailSubject": "The Daily Brief", "emailBody": "Today's top stories:\n\n1. Politics update\n2. Tech news\n3. World events"}'

# Breaking News Alert
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "The Guardian", "contentType": "alert", "scraperStatus": "success", "emailSubject": "BREAKING: Major Event", "emailBody": "Breaking news alert content..."}'
```

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] Export functionality (JSON, CSV, EML, PDF)
- [ ] Article bookmarking and favorites
- [ ] Tags and categories for organization
- [ ] Full-text search with highlighting
- [ ] Email attachment support
- [ ] HTML email rendering
- [ ] Webhook forwarding for scraper alerts
- [ ] Request replay functionality
- [ ] Real-time updates with WebSockets
- [ ] Authentication and access control
- [ ] Article sharing and collaboration
- [ ] Reading progress tracking
- [ ] RSS feed generation from scraped content
- [ ] Content comparison tools
- [ ] Historical metrics and trends
- [ ] AI-powered article summaries

## License

MIT
