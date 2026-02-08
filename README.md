# Request & Email Logger with User & Recipient Tracking

A Next.js-based request logging system with specialized interfaces for debugging API requests, email data, monitoring news scraping activity, and **comprehensive user/recipient management**.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful interface for reading scraped news content
- 🔧 **Scraper Monitor**: Technical monitoring for tracking scraping activity
- 🔍 **Debug Console**: General-purpose request debugging
- 👥 **User Management**: Track requests by sender with session grouping
- 👤 **Recipient Tracking**: Filter and organize by recipient (NEW!)
- ⏰ **Enhanced Timestamps**: Relative and absolute time display (NEW!)
- 💾 **In-Memory Storage**: Up to 300 requests
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

### URLs
- **[http://localhost:3000](http://localhost:3000)** - Debug Console
- **[http://localhost:3000/articles](http://localhost:3000/articles)** - Articles Reader
- **[http://localhost:3000/scraper](http://localhost:3000/scraper)** - Scraper Monitor

## API Documentation

### POST /api/log

Complete example with all fields:

```bash
curl -X POST http://localhost:3000/api/log \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"source\": \"NYT Cooking\",
    \"contentType\": \"newsletter\",
    \"articleUrl\": \"https://cooking.nytimes.com/recipes/12345\",
    \"scraperStatus\": \"success\",
    \"scrapedAt\": \"2026-02-07T21:00:00Z\",
    \"emailSubject\": \"5 Quick Weeknight Pasta Recipes\",
    \"emailBody\": \"Discover delicious pasta recipes...\",
    \"emailFrom\": \"cooking@nytimes.com\",
    \"senderName\": \"Joonas Virtanen\",
    \"senderId\": \"user-123\",
    \"recipientName\": \"John Doe\",
    \"recipientId\": \"recipient-456\",
    \"recipientEmail\": \"john@example.com\",
    \"sessionId\": \"wabi-session-abc\",
    \"deviceInfo\": \"Wabi v1.0 / iOS 17.2\"
  }'
```

### Field Reference

#### Sender/User Fields (Optional)
- **senderName** (string): Display name (e.g., \"Joonas Virtanen\")
- **senderId** (string): Unique user ID (e.g., \"user-123\")
- **sessionId** (string): Session identifier
- **deviceInfo** (string): Device info (e.g., \"Wabi v1.0 / iOS 17.2\")

#### Recipient Fields (Optional) - NEW!
- **recipientName** (string): Recipient display name (e.g., \"John Doe\")
- **recipientId** (string): Unique recipient ID (e.g., \"recipient-456\")
- **recipientEmail** (string): Recipient email address

#### Email Fields (Optional)
- **emailSubject**, **emailBody**, **emailFrom**, **emailTo**, **emailType**

#### Scraper Fields (Optional)
- **source**, **scraperStatus**, **articleUrl**, **scrapedAt**, **contentType**

### GET /api/log - Query Parameters

**User Filters:**
- `?senderId=xxx` - Filter by sender
- `?sessionId=xxx` - Filter by session
- `?senderName=xxx` - Search by sender name

**Recipient Filters (NEW!):**
- `?recipientId=xxx` - Filter by recipient ID
- `?recipientName=xxx` - Search by recipient name
- `?recipientEmail=xxx` - Filter by recipient email

**Other Filters:**
- `?method=GET/POST/etc` - HTTP method
- `?isEmail=true/false` - Email vs API
- `?isScraper=true/false` - Scraper vs regular
- `?source=xxx` - News source
- `?status=success/error` - Scraper status
- `?contentType=newsletter/article/etc` - Content type

### Query Examples

```bash
# Get all content for a specific recipient
curl \"http://localhost:3000/api/log?recipientId=recipient-456\"

# Get articles scraped by Joonas for John
curl \"http://localhost:3000/api/log?senderId=user-123&recipientId=recipient-456\"

# Get recipient's newsletters from NYT Cooking
curl \"http://localhost:3000/api/log?recipientEmail=john@example.com&source=NYT%20Cooking\"
```

## User Interface Features

### Timestamp Display (NEW!)

All request cards now show:
- **Relative time**: \"2m ago\", \"5h ago\", \"just now\"
- **Absolute time**: \"Feb 7, 2026 at 9:53 PM PST\"
- **Auto-updating**: Refreshes every 10 seconds
- **Prominent display**: Blue/highlighted for easy scanning

### Recipient Tracking (NEW!)

**RecipientStats Sidebar:**
- Total recipients count
- Recent recipients (last hour)
- Items per recipient
- Purple-themed avatars with initials
- \"Recent\" indicators for activity within 1 hour
- Click to filter content for specific recipient

**Recipient Display:**
- Purple-themed avatars (distinct from user avatars)
- \"For: [Recipient Name]\" indicators
- Recipient email when available
- Combined sender → recipient flow visualization

### User & Recipient Distinction

**Visual Coding:**
- **Users/Senders**: Blue/green/pink color palette
- **Recipients**: Purple/pink/fuchsia palette
- **Dual Avatars**: Both sender and recipient shown when available
- **Clear Labels**: \"From: [Sender]\" vs \"For: [Recipient]\"

### Filtering Options

All interfaces support:
- ✅ Filter by sender (user who scraped)
- ✅ Filter by recipient (who it's for)
- ✅ Combined sender + recipient filtering
- ✅ Search across both sender and recipient names
- ✅ \"Show/Hide Users\" and \"Show/Hide Recipients\" toggles

## Component Reference

### UserStats Component
- Tracks senders/users
- Blue-themed design
- Active indicator (5-minute window)
- Session counts

### RecipientStats Component (NEW!)
- Tracks recipients
- Purple-themed design
- Recent indicator (1-hour window)
- Item counts per recipient

### TimeUtils (NEW!)
- `getRelativeTime()` - Returns \"2m ago\", \"5h ago\", etc.
- `formatTimestamp()` - Returns full formatted date/time
- `formatShortTimestamp()` - Returns compact format

## Integration Guide for Wabi App

Include these fields when logging from Wabi:

```typescript
const logToServer = async (contentData: any) => {
  await fetch('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...contentData, // your scraped content
      
      // Sender (who's running the app)
      senderName: currentUser.name,
      senderId: currentUser.id,
      sessionId: appSession.id,
      deviceInfo: `Wabi v${version}/${platform}`,
      
      // Recipient (who the content is for)
      recipientName: targetRecipient.name,
      recipientId: targetRecipient.id,
      recipientEmail: targetRecipient.email
    })
  })
}
```

## Use Cases

### Personal News Aggregation
- Scrape newsletters for specific recipients
- Filter content by \"For whom\"
- Track who receives which sources
- Organize by recipient preferences

### Multi-User Development
- Track which developer scraped what
- See who content is intended for
- Debug recipient-specific issues
- Monitor sender → recipient flows

### Content Distribution
- Track content delivery per recipient
- Monitor scraping activity by user
- Recipient-specific content feeds
- Distribution analytics

## Backward Compatibility

✅ **All fields are optional**
✅ **Works without sender or recipient data**
✅ **Existing functionality unchanged**
✅ **Stats panels only show when data exists**

## Storage & Performance

- In-memory: Up to 300 requests
- Auto-pruning: Oldest entries removed automatically
- Fast filtering: Client-side with optimized queries
- Real-time updates: Configurable auto-refresh

## Future Enhancements

- [ ] Persistent database storage
- [ ] Recipient preferences and profiles
- [ ] Content recommendations per recipient
- [ ] Email template customization by recipient
- [ ] Recipient activity analytics
- [ ] Multi-recipient batch operations
- [ ] Recipient groups and teams
- [ ] Export per-recipient data
- [ ] Webhook notifications to recipients
- [ ] Recipient-specific dashboards

## License

MIT
