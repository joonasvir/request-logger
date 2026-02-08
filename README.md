# Request & Email Logger with User Management

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, monitoring news scraping activity, and **user/sender identification**.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful interface for reading scraped news content
- 🔧 **Scraper Monitor**: Technical monitoring for tracking scraping activity
- 🔍 **Debug Console**: General-purpose request debugging
- 👥 **User Management**: Track requests by sender with session grouping (NEW!)
- 💾 **In-Memory Storage**: Simple and fast (up to 300 requests)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS and dark mode
- 📊 **Request Details**: Captures method, headers, body, timestamp, IP, and user info
- 🔄 **Backward Compatible**: All features are optional

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

**Purpose**: Beautiful, magazine-style interface for reading scraped news content.

**Features**:
- Card-based article layout with prominent headlines
- Source badges with custom styling (NYT, Atlantic, etc.)
- User/sender identification with avatars
- Filter by news source, content type, or user
- Search across headlines and content
- Auto-refresh every 5 seconds
- Session grouping for multi-user environments

### 2. 🔧 Scraper Monitor (`/scraper`)

**Purpose**: Technical monitoring dashboard for scraping operations.

**Features**:
- Real-time scraping metrics (total, success, errors)
- Per-source statistics and breakdowns
- User activity tracking
- Recent ping activity monitoring
- Scraper status indicators
- Auto-refresh every 3 seconds

### 3. 🔍 Debug Console (`/`)

**Purpose**: General-purpose debugging interface for all requests.

**Features**:
- View all logged requests (API, email, scraper)
- User statistics sidebar (toggleable)
- Session grouping within each user
- Search and filter by type, method, email type, user
- Detailed request inspector
- Auto-refresh capability

## API Documentation

### POST /api/log

Logs any incoming request with full details. Automatically detects request type (API, email, or scraper).

#### Complete Example with User Identification

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
    "emailBody": "Discover delicious pasta recipes...",
    "emailFrom": "cooking@nytimes.com",
    "senderName": "Joonas Virtanen",
    "senderId": "user-123",
    "sessionId": "session-abc-xyz",
    "deviceInfo": "Chrome 120/MacOS 14.2"
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

### Field Reference

#### Email Fields (Optional)
- **emailSubject** (string): Email subject line / article headline
- **emailBody** (string): Full email content / article text
- **emailFrom** (string): Sender email address
- **emailTo** (string[]): Array of recipient email addresses
- **emailType** (string): Type of email - `"received"`, `"sent"`, or `"draft"`

#### Scraper Fields (Optional)
- **source** (string): News outlet name (e.g., "NYT Cooking", "The Atlantic")
- **scraperStatus** (string): Scraping status - `"success"`, `"error"`, or `"pending"`
- **articleUrl** (string): Source URL of the scraped content
- **scrapedAt** (string): ISO 8601 timestamp of when content was scraped
- **contentType** (string): Type of content - `"newsletter"`, `"article"`, `"digest"`, or `"alert"`

#### User/Sender Identification Fields (Optional) - NEW!
- **senderName** (string): Display name of the person who triggered the request
- **senderId** (string): Unique identifier for the sender (for filtering and grouping)
- **sessionId** (string): Session identifier to group related requests
- **deviceInfo** (string): Device information (browser, OS, app version, etc.)

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
- **`senderId`** (optional): Filter by sender ID - NEW!
- **`sessionId`** (optional): Filter by session ID - NEW!
- **`senderName`** (optional): Filter by sender name (partial match) - NEW!

**Examples**:
```bash
# Get all requests from a specific user
curl "http://localhost:3000/api/log?senderId=user-123"

# Get all requests from a session
curl "http://localhost:3000/api/log?sessionId=session-abc-xyz"

# Get scraper data from Joonas
curl "http://localhost:3000/api/log?isScraper=true&senderName=Joonas"

# Get all articles and newsletters from a user
curl "http://localhost:3000/api/log?isScraper=true&isEmail=true&senderId=user-123"
```

## User Management Features

### User Statistics Component

All three interfaces include a toggleable user statistics sidebar showing:

- **Total Users**: Count of unique senders
- **Active Users**: Users active in the last 5 minutes
- **Request Counts**: Total requests in the system
- **Per-User Stats**:
  - Request count per user
  - Session count per user
  - Last active timestamp
  - Active status indicator (green dot)
- **User Avatars**: Color-coded circles with user initials

### Session Grouping

When viewing a specific user's requests:
- Requests are automatically grouped by session
- Each session shows:
  - Session ID (truncated for readability)
  - Request count in session
  - Start time of session
  - Expandable/collapsible request list
- Timeline view of activity within each session

### User Display Features

- **Color-coded avatars**: Each user gets a consistent color
- **Initials display**: Automatic extraction from sender name
- **Active indicators**: Green dot for users active in last 5 minutes
- **Device info**: Shows browser/OS when available
- **Session tracking**: Groups related requests automatically

## Usage Examples

### Example 1: Regular API Request with User Info

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "message": "User action completed",
    "senderName": "Joonas Virtanen",
    "senderId": "user-123",
    "sessionId": "session-20260207-001",
    "deviceInfo": "Wabi App v1.0 / iOS 17.2"
  }'
```

### Example 2: Scraped Email with Full User Context

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "The Atlantic",
    "contentType": "article",
    "articleUrl": "https://theatlantic.com/...",
    "scraperStatus": "success",
    "emailSubject": "The Future of AI",
    "emailBody": "Article content here...",
    "emailFrom": "newsletter@theatlantic.com",
    "senderName": "Joonas Virtanen",
    "senderId": "user-123",
    "sessionId": "wabi-session-20260207-001",
    "deviceInfo": "Wabi App v1.0 / iPhone 15 Pro"
  }'
```

### Example 3: App Health Ping with User Context

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "source": "Wabi App",
    "scraperStatus": "success",
    "senderName": "Joonas Virtanen",
    "senderId": "user-123",
    "sessionId": "session-abc",
    "deviceInfo": "Wabi v1.0/iOS"
  }'
```

### Example 4: Query Requests by User

```bash
# Get all requests from a specific user
curl "http://localhost:3000/api/log?senderId=user-123"

# Get all articles scraped by Joonas
curl "http://localhost:3000/api/log?senderName=Joonas&isScraper=true"

# Get specific session data
curl "http://localhost:3000/api/log?sessionId=session-abc-xyz"
```

## Integration with Wabi App

When integrating with the Wabi app, include these fields in all requests:

```javascript
// Example JavaScript integration
const logData = {
  // Your data (email, scraper, etc.)
  source: "NYT Cooking",
  emailSubject: "Recipe of the Day",
  // ... other fields ...
  
  // User identification (add these)
  senderName: currentUser.name,        // e.g., "Joonas Virtanen"
  senderId: currentUser.id,            // e.g., "user-123" or UUID
  sessionId: currentSession.id,        // e.g., "wabi-session-2026..."
  deviceInfo: getDeviceInfo()          // e.g., "Wabi v1.0/iOS 17.2"
}

await fetch('http://localhost:3000/api/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(logData)
})
```

## User Interface Features

### User Statistics Sidebar

Click "Show User Stats" on any page to see:
- List of all users with request counts
- Active status indicators (green dot = active in last 5 minutes)
- Session counts per user
- Click any user to filter requests to that user only
- Color-coded user avatars with initials

### Session Grouping

When viewing a specific user:
- Requests are automatically grouped by sessionId
- Each session is collapsible/expandable
- Shows session start time and request count
- Timeline view of requests within the session
- Easy identification of user activity patterns

### User Avatars

Each request displays user information:
- **Circle avatar** with user initials
- **Consistent colors** per user (based on senderId hash)
- **Hover states** for interactive feedback
- **Active indicators** for recent activity

## Supported News Sources

The interfaces include special styling for popular sources:
- 🗓️ **NYT/New York Times** (purple badge)
- 🌊 **The Atlantic** (blue badge)
- 📬 **Washington Post** (indigo badge)
- 🛡️ **The Guardian** (cyan badge)
- 🍳 **Cooking newsletters** (orange badge)
- 📰 **Generic news sources** (green badge)

## Content Types

Categorize your scraped content:
- **newsletter**: Email newsletters from news outlets
- **article**: Individual articles or stories
- **digest**: Daily/weekly roundups or summary emails
- **alert**: Breaking news or urgent updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Storage**: In-memory (up to 300 requests)

## Architecture

```
/api/log                    → Single endpoint for all logging
/                           → Debug console with user stats
/articles                   → Articles reader with user filtering
/scraper                    → Scraper monitor with user tracking
/app/components/Navigation  → Shared navigation
/app/components/UserStats   → User statistics sidebar
```

## Backward Compatibility

The system is fully backward compatible:
- Regular API requests work as before
- No special fields required for basic logging
- Email, scraper, and user fields are entirely optional
- Automatic type detection based on fields present
- UI adapts to display appropriate view for each request type
- Requests without user info still display properly

## Storage & Performance

- In-memory storage for fast access
- Automatically maintains last 300 requests (increased from 200)
- Older requests are pruned automatically
- Data cleared on server restart (by design)
- Can be upgraded to persistent storage (database)

## User Management Best Practices

### Generating Sender IDs

```javascript
// Use consistent user IDs across sessions
const senderId = user.uuid || `user-${user.email.split('@')[0]}`
```

### Generating Session IDs

```javascript
// Create unique session IDs
const sessionId = `wabi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// Or use UUID library
const sessionId = crypto.randomUUID()
```

### Device Info Format

```javascript
// Recommended format: "App/Platform Version"
const deviceInfo = `Wabi v${appVersion}/${platform} ${osVersion}`
// Examples:
// "Wabi v1.0/iOS 17.2"
// "Wabi v1.0/Android 14"
// "Chrome 120/MacOS 14.2"
```

## Query Examples

### Filter by User

```bash
# All requests from a user
curl "http://localhost:3000/api/log?senderId=user-123"

# Articles scraped by Joonas
curl "http://localhost:3000/api/log?senderName=Joonas&isScraper=true&isEmail=true"
```

### Filter by Session

```bash
# All requests in a session
curl "http://localhost:3000/api/log?sessionId=wabi-session-20260207-001"

# Scraper requests in a session
curl "http://localhost:3000/api/log?sessionId=session-abc&isScraper=true"
```

### Combined Filters

```bash
# Successful NYT Cooking scrapes from Joonas
curl "http://localhost:3000/api/log?source=NYT%20Cooking&status=success&senderName=Joonas"

# All newsletter-type content from a specific session
curl "http://localhost:3000/api/log?contentType=newsletter&sessionId=session-abc"
```

## Use Cases

### Multi-User Development Team
- Track which developer triggered which requests
- Debug issues specific to a user's session
- Monitor individual scraping activity
- Identify problematic user sessions

### News Aggregation
- Personal news feeds per user
- Track which users are reading which sources
- Session-based reading history
- User-specific content recommendations

### App Monitoring
- Track user activity across sessions
- Monitor app health pings by user
- Debug user-specific issues
- Session replay for troubleshooting

### Testing & QA
- Isolate test data by user or session
- Track QA tester activity
- Separate production vs staging data by user
- Session-based test scenario tracking

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] User authentication and private logs
- [ ] User preferences and customization
- [ ] Session replay functionality
- [ ] User activity analytics and charts
- [ ] Team collaboration features
- [ ] User-specific webhooks and notifications
- [ ] Export functionality (JSON, CSV, EML, PDF)
- [ ] Real-time updates with WebSockets
- [ ] AI-powered article summaries
- [ ] Multi-tenant support
- [ ] User permissions and access control

## Development Tips

### Testing Multi-User Scenarios

```bash
# User 1: Joonas
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "NYT Cooking", "scraperStatus": "success", "senderName": "Joonas Virtanen", "senderId": "user-joonas", "sessionId": "session-1"}'

# User 2: Alice
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "The Atlantic", "scraperStatus": "success", "senderName": "Alice Smith", "senderId": "user-alice", "sessionId": "session-2"}'

# User 3: Bob
curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" \
  -d '{"source": "Washington Post", "scraperStatus": "success", "senderName": "Bob Johnson", "senderId": "user-bob", "sessionId": "session-3"}'
```

Then visit any interface and click "Show User Stats" to see the user sidebar!

## License

MIT
