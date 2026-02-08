# Request & Email Logger with User Tracking

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, monitoring news scraping activity, reading scraped articles, and tracking user activity.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful interface for reading scraped news content
- 🔧 **Scraper Monitor**: Technical monitoring for tracking scraping activity
- 🔍 **Debug Console**: General-purpose request debugging
- 👥 **User Tracking**: Identify and track requests by sender with session management (NEW!)
- 💾 **In-Memory Storage**: Simple and fast (upgradeable to persistent storage)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS and dark mode
- 📊 **Request Details**: Captures method, headers, body, timestamp, IP, and user data
- 🔄 **Backward Compatible**: Works with API requests, email data, scraper content, and user tracking

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

### 1. 📰 Articles Reader (`/articles`)

Magazine-style interface for reading scraped news content.

**Features**:
- Card-based article layout with user avatars
- Source badges with custom styling
- Prominent headlines and content previews
- User filtering and activity tracking
- Filter by news source or content type
- Search across headlines and content
- Auto-refresh every 5 seconds

### 2. 🔧 Scraper Monitor (`/scraper`)

Technical monitoring dashboard for scraping operations.

**Features**:
- Real-time scraping metrics
- Recent ping activity tracking
- Per-source and per-user statistics
- Scraper status indicators
- User activity monitoring
- Auto-refresh every 3 seconds

### 3. 🔍 Debug Console (`/`)

General-purpose debugging interface for all requests.

**Features**:
- View all logged requests
- User statistics sidebar with active users
- Session grouping for individual users
- Search and filter by type, method, user
- Detailed request inspector
- Real-time statistics

## User Tracking Features (NEW!)

### User Stats Sidebar
- Total users count
- Active users (within last 5 minutes)
- Request count per user
- Session count per user
- User avatars with initials
- Color-coded user identification
- Active status indicators (green dot)

### Session Management
- Group requests by session ID
- Collapsible session timeline
- Session duration tracking
- Device information display

### User Filtering
- Filter all requests by specific user
- View user-specific statistics
- Track user activity across sessions

## API Documentation

### POST /api/log

Logs any incoming request with full details. Automatically detects request type and user information.

#### Example: With User Identification

```bash
curl -X POST http://localhost:3000/api/log \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"source\": \"NYT Cooking\",
    \"contentType\": \"newsletter\",
    \"articleUrl\": \"https://cooking.nytimes.com/recipes/12345\",
    \"scraperStatus\": \"success\",
    \"emailSubject\": \"Weekend Pasta Recipes\",
    \"emailBody\": \"Delicious recipes for your weekend...\",
    \"emailFrom\": \"cooking@nytimes.com\",
    \"senderName\": \"Joonas Virtanen\",
    \"senderId\": \"user-123\",
    \"sessionId\": \"session-abc-2026\",
    \"deviceInfo\": \"Chrome 120 / MacOS\"
  }'
```

**Response**:
```json
{
  \"success\": true,
  \"id\": \"unique-request-id\",
  \"timestamp\": \"2026-02-07T21:15:00.000Z\",
  \"isEmail\": true,
  \"isScraper\": true
}
```

### Field Reference

#### Email Fields
- **emailSubject** (string, optional): Email subject line / article headline
- **emailBody** (string, optional): Full email content / article text
- **emailFrom** (string, optional): Sender email address
- **emailTo** (string[], optional): Array of recipient email addresses
- **emailType** (string, optional): Type of email - `\"received\"`, `\"sent\"`, or `\"draft\"`

#### Scraper Fields
- **source** (string, optional): News outlet name (e.g., \"NYT Cooking\", \"The Atlantic\")
- **scraperStatus** (string, optional): Scraping status - `\"success\"`, `\"error\"`, or `\"pending\"`
- **articleUrl** (string, optional): Source URL of the scraped content
- **scrapedAt** (string, optional): ISO 8601 timestamp of when content was scraped
- **contentType** (string, optional): Type of content - `\"newsletter\"`, `\"article\"`, `\"digest\"`, or `\"alert\"`

#### User Identification Fields (NEW!)
- **senderName** (string, optional): Display name of the sender (e.g., \"Joonas Virtanen\")
- **senderId** (string, optional): Unique identifier for the sender (e.g., \"user-123\")
- **sessionId** (string, optional): Session identifier for grouping related requests
- **deviceInfo** (string, optional): Device/browser information (e.g., \"Chrome 120 / MacOS\")

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
- `contentType` (optional): Filter by content type (newsletter, article, digest, alert)
- **senderId** (optional, NEW!): Filter by specific sender
- **sessionId** (optional, NEW!): Filter by specific session
- **senderName** (optional, NEW!): Filter by sender name (partial match)

**Examples**:
```bash
# Get all requests from a specific user
curl \"http://localhost:3000/api/log?senderId=user-123\"

# Get requests from a specific session
curl \"http://localhost:3000/api/log?sessionId=session-abc\"

# Get user's scraped articles
curl \"http://localhost:3000/api/log?senderId=user-123&isScraper=true&isEmail=true\"

# Search for a user by name
curl \"http://localhost:3000/api/log?senderName=Joonas\"
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Storage**: In-memory (up to 300 requests)

## Backward Compatibility

The system is fully backward compatible:
- Regular API requests work as before
- No special fields required for basic logging
- Email, scraper, and user fields are entirely optional
- Automatic type detection based on fields present
- UI adapts to display appropriate view for each request type
- User stats only appear when user data is present

## Use Cases

### Multi-User Development Teams
- Track which developer is testing what feature
- Monitor individual developer activity
- Debug user-specific issues
- Session-based debugging

### News Aggregation with User Accounts
- Track which users are scraping which sources
- User-specific article feeds
- Monitor scraping activity per user
- Session-based content organization

### API Testing & Monitoring
- Identify which client/user made requests
- Track request patterns by user
- Monitor user-specific API usage
- Debug user-specific integration issues

## Storage & Performance

- In-memory storage for fast access
- Automatically maintains last 300 requests (increased for user data)
- Older requests are pruned automatically
- Data cleared on server restart (by design)
- Can be upgraded to persistent storage (database)

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] User authentication and access control
- [ ] User profiles and settings
- [ ] Per-user data quotas
- [ ] User activity analytics and charts
- [ ] Export functionality (JSON, CSV, PDF)
- [ ] Email attachment support
- [ ] HTML email rendering
- [ ] Webhook forwarding
- [ ] Real-time updates with WebSockets
- [ ] Session replay functionality
- [ ] User collaboration features
- [ ] Custom user tags and labels
- [ ] Activity timeline visualization

## License

MIT
