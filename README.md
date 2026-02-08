# Request & Email Logger with User & Recipient Management

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, monitoring news scraping activity, and comprehensive **sender and recipient tracking**.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful interface for reading scraped news content
- 🔧 **Scraper Monitor**: Technical monitoring for tracking scraping activity
- 🔍 **Debug Console**: General-purpose request debugging
- 👥 **Sender Management**: Track requests by sender with session grouping
- 📬 **Recipient Tracking**: Filter and organize content by recipient ("for whom") - NEW!
- ⏱️ **Enhanced Timestamps**: Relative and absolute time display - NEW!
- 💾 **In-Memory Storage**: Simple and fast (up to 300 requests)
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS and dark mode
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

Access the interfaces:
- **[http://localhost:3000](http://localhost:3000)** - Debug Console
- **[http://localhost:3000/articles](http://localhost:3000/articles)** - Articles Reader
- **[http://localhost:3000/scraper](http://localhost:3000/scraper)** - Scraper Monitor

## API Documentation

### POST /api/log

Log requests with complete sender and recipient information.

#### Complete Example

```bash
curl -X POST http://localhost:3000/api/log \\
  -H "Content-Type: application/json" \\
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
    "sessionId": "wabi-session-abc",
    "deviceInfo": "Wabi v1.0/iOS 17.2",
    "recipientName": "Alice Smith",
    "recipientId": "recipient-456",
    "recipientEmail": "alice@example.com"
  }'
```

### Field Reference

#### Scraper Fields
- **source** (string): News outlet name
- **contentType** (string): newsletter | article | digest | alert
- **articleUrl** (string): Source URL
- **scraperStatus** (string): success | error | pending
- **scrapedAt** (string): ISO 8601 timestamp

#### Email Fields
- **emailSubject** (string): Subject line
- **emailBody** (string): Content
- **emailFrom** (string): Sender email
- **emailTo** (string[]): Recipients array
- **emailType** (string): received | sent | draft

#### Sender Identification (Who Sent)
- **senderName** (string): Display name (e.g., "Joonas Virtanen")
- **senderId** (string): Unique identifier
- **sessionId** (string): Session grouping
- **deviceInfo** (string): Device/app info

#### Recipient Identification (For Whom) - NEW!
- **recipientName** (string): Display name (e.g., "Alice Smith")
- **recipientId** (string): Unique identifier  
- **recipientEmail** (string): Email address

### GET /api/log - Query Parameters

**General Filters:**
- `method` - HTTP method
- `search` - Search all fields
- `isEmail` - true/false
- `isScraper` - true/false

**Content Filters:**
- `source` - News source
- `contentType` - Content type
- `status` - Scraper status
- `emailType` - Email type

**Sender Filters:**
- `senderId` - Specific sender
- `sessionId` - Specific session
- `senderName` - Sender name (partial)

**Recipient Filters (NEW!):**
- `recipientId` - Specific recipient
- `recipientName` - Recipient name (partial)
- `recipientEmail` - Recipient email

**Examples:**
```bash
# Get all content for Alice
curl "http://localhost:3000/api/log?recipientId=recipient-456"

# Get Alice's newsletters from Joonas
curl "http://localhost:3000/api/log?recipientId=recipient-456&senderId=user-123&contentType=newsletter"

# Get all content sent to alice@example.com
curl "http://localhost:3000/api/log?recipientEmail=alice@example.com"
```

## UI Features

### Timestamp Display (NEW!)

All requests now show:
- **Relative time**: "2m ago", "1h ago", "just now"
- **Absolute time**: "Feb 7, 2026 at 9:53 PM PST"
- **Auto-updates**: Relative times refresh every 10 seconds
- **Prominent placement**: Top-right of all request cards
- **Dual format**: Quick glance (relative) + precise (absolute)

### Recipient Management (NEW!)

**RecipientStats Component:**
- Sidebar showing all recipients
- Recipient count and statistics
- Color-coded recipient avatars (purple/pink/rose/fuchsia palette)
- Recent activity indicators
- Click-to-filter functionality

**Recipient Display:**
- "For: [Recipient Name]" on all cards
- Recipient email badges (purple)
- Recipient avatars with initials
- Clear sender → recipient flow visualization

**Filtering:**
- Filter by specific recipient
- "All Recipients" view
- Combined sender + recipient filtering
- Visual filter indicators

### Dual Sidebar Support

All pages now support:
- **Left Sidebar**: Sender/User stats (blue theme)
- **Right Sidebar**: Recipient stats (purple theme)
- Toggle buttons for both
- Responsive grid layout (adapts to sidebar count)
- Clear visual separation

### Visual Indicators

**Filter Status Banner:**
- Shows when sender or recipient filter is active
- "From: [Sender]" + "For: [Recipient]"
- Quick clear button
- Color-coded badges

**Avatar System:**
- **Senders**: Blue/green/purple/pink avatars
- **Recipients**: Purple/pink/rose/fuchsia avatars
- **Initials**: Auto-extracted from names
- **Border**: Recipients get white border for distinction
- **Active dots**: Green for senders, purple for recipients

## Use Cases

### Personal News Aggregation
- Track which content is for which recipient
- Filter by "for whom" to see personalized feeds
- Monitor content distribution

### Multi-Recipient Systems
- Track content sent to different recipients
- Filter by recipient to see their specific content
- Monitor recipient engagement

### Email Distribution Tracking
- See who received what content
- Track email distribution patterns
- Monitor per-recipient activity

### Wabi App Integration
- Track scraped content for specific users
- Filter articles by recipient
- Monitor user-specific content delivery

## Integration Example

```javascript
// From Wabi App
const logArticle = async (article) => {
  await fetch('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: article.source,
      contentType: 'newsletter',
      emailSubject: article.title,
      emailBody: article.content,
      scraperStatus: 'success',
      
      // Who scraped it (sender)
      senderName: currentUser.name,
      senderId: currentUser.id,
      sessionId: currentSession.id,
      deviceInfo: `Wabi v${appVersion}/${platform}`,
      
      // Who it's for (recipient)
      recipientName: targetUser.name,
      recipientId: targetUser.id,
      recipientEmail: targetUser.email
    })
  })
}
```

## UI Navigation

### Sidebar Controls

**All pages include:**
- "Show/Hide Senders" button (blue)
- "Show/Hide Recipients" button (purple)
- Auto-refresh toggle
- Filter status banner

**Responsive Layout:**
- 0 sidebars: Full width (6 columns)
- 1 sidebar: Content gets 5 columns
- 2 sidebars: Content gets 4 columns
- Mobile: Sidebars collapse, content full width

## Timestamp Formats

**Relative Time:**
- "just now" (< 10s)
- "30s ago" (< 1min)
- "5m ago" (< 1hr)
- "2h ago" (< 24hr)
- "3d ago" (< 7days)
- "Jan 15" (older)

**Absolute Time:**
- "Feb 7, 2026, 9:53 PM PST"
- Includes timezone
- 12-hour format
- Full date for clarity

## Backward Compatibility

✅ All new fields are optional
✅ Existing requests display normally
✅ Sidebars only appear when data exists
✅ Filters adapt to available data
✅ No breaking changes

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- In-memory storage (300 requests)

## License

MIT
