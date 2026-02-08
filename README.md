# Request & Email Logger with User & Recipient Management

A Next.js-based comprehensive logging system with user identification, recipient filtering, session tracking, and specialized interfaces for debugging, news reading, and scraper monitoring.

## Features

- 📝 **API Endpoint**: `/api/log` - Accepts and stores request data
- 📨 **Email Support**: Log and view email data with dedicated UI
- 📰 **Articles Reader**: Beautiful magazine-style interface for scraped news
- 🔧 **Scraper Monitor**: Technical monitoring dashboard
- 🔍 **Debug Console**: General-purpose request debugging
- 👥 **User Tracking**: Track requests by sender with session management
- 📬 **Recipient Filtering**: Organize content by recipient (\"For Whom\") - NEW!
- ⏰ **Enhanced Timestamps**: Relative and absolute time display - NEW!
- 💾 **In-Memory Storage**: 300 requests capacity
- 🎨 **Clean Interface**: Modern UI with Tailwind CSS and dark mode
- 🔄 **Backward Compatible**: All features optional

## Getting Started

```bash
npm install
npm run dev
```

**Interfaces:**
- **[http://localhost:3000](http://localhost:3000)** - Debug Console
- **[http://localhost:3000/articles](http://localhost:3000/articles)** - Articles Reader
- **[http://localhost:3000/scraper](http://localhost:3000/scraper)** - Scraper Monitor

## API Documentation

### POST /api/log

#### Complete Example with All Features

```bash
curl -X POST http://localhost:3000/api/log \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"source\": \"NYT Cooking\",
    \"contentType\": \"newsletter\",
    \"articleUrl\": \"https://cooking.nytimes.com/recipes/12345\",
    \"scraperStatus\": \"success\",
    \"scrapedAt\": \"2026-02-07T21:00:00Z\",
    \"emailSubject\": \"Weekend Pasta Recipes\",
    \"emailBody\": \"Delicious recipes for your weekend cooking...\",
    \"emailFrom\": \"cooking@nytimes.com\",
    \"senderName\": \"Joonas Virtanen\",
    \"senderId\": \"user-joonas-123\",
    \"sessionId\": \"wabi-session-xyz\",
    \"deviceInfo\": \"Wabi v1.0 / iOS 17.2\",
    \"recipientName\": \"Alice Smith\",
    \"recipientId\": \"recipient-alice-456\",
    \"recipientEmail\": \"alice@example.com\"
  }'
```

### Field Reference

#### Email Fields (Optional)
- **emailSubject** - Email subject / article headline
- **emailBody** - Full email content / article text
- **emailFrom** - Sender email address
- **emailTo** - Array of recipient emails
- **emailType** - \"received\", \"sent\", or \"draft\"

#### Scraper Fields (Optional)
- **source** - News outlet (\"NYT Cooking\", \"The Atlantic\", etc.)
- **scraperStatus** - \"success\", \"error\", or \"pending\"
- **articleUrl** - Source URL
- **scrapedAt** - ISO 8601 timestamp
- **contentType** - \"newsletter\", \"article\", \"digest\", or \"alert\"

#### Sender Fields (Optional)
- **senderName** - Person who triggered request
- **senderId** - Unique sender identifier
- **sessionId** - Session grouping identifier
- **deviceInfo** - Device/browser info

#### Recipient Fields (Optional) - NEW!
- **recipientName** - Display name of intended recipient
- **recipientId** - Unique recipient identifier
- **recipientEmail** - Recipient email address

### GET /api/log - Query Parameters

**All Filters:**
- `method`, `search`, `emailType`, `isEmail`, `isScraper`
- `source`, `status`, `contentType`
- `senderId`, `sessionId`, `senderName` (sender/user filters)
- **`recipientId`** - Filter by recipient ID - NEW!
- **`recipientName`** - Filter by recipient name - NEW!
- **`recipientEmail`** - Filter by recipient email - NEW!

**Examples:**
```bash
# Get content for specific recipient
curl \"http://localhost:3000/api/log?recipientId=recipient-alice-456\"

# Get articles for Alice from NYT Cooking
curl \"http://localhost:3000/api/log?recipientName=Alice&source=NYT%20Cooking\"

# Get content sent to specific email
curl \"http://localhost:3000/api/log?recipientEmail=alice@example.com\"

# Combined: Joonas's scrapes for Alice
curl \"http://localhost:3000/api/log?senderId=user-joonas&recipientId=recipient-alice\"
```

## New Features

### 📬 Recipient Filtering (\"For Whom\")

**RecipientFilter Component** - Sidebar showing:
- Total recipients count
- Recent recipients (last hour)
- Request count per recipient
- Color-coded recipient avatars
- \"All Recipients\" view + individual selection
- Click any recipient to filter content

**Filter Banner:**
- Shows active filters (sender + recipient)
- Clear \"From: [Sender]\" and \"For: [Recipient]\" indicators
- One-click filter clearing
- Visual avatars for quick identification

**Recipient Display:**
- Purple/pink/rose color palette (distinct from user colors)
- Initials in circular avatars
- Email address when available
- Recent activity indicators

### ⏰ Enhanced Timestamps

**Dual Display:**
- **Relative time**: \"2m ago\", \"1h ago\", \"3d ago\"
- **Absolute time**: \"Feb 7, 2026 at 9:53 PM PST\"
- Updates every 10 seconds

**Smart Formatting:**
- \"just now\" for <10 seconds
- \"Xs ago\" for seconds
- \"Xm ago\" for minutes
- \"Xh ago\" for hours
- \"Xd ago\" for days
- Date format for older items

**Prominent Display:**
- Top-right of each card
- Relative time in larger font
- Absolute time in smaller, secondary text
- Color-coded (blue) for visibility

## User Interfaces

### 🔍 Debug Console (`/`)
- User stats sidebar (show/hide)
- Recipient filter sidebar (show/hide) - NEW!
- Filter banner showing active filters - NEW!
- Session grouping
- Enhanced timestamp display - NEW!
- Recipient badges on cards - NEW!

### 📰 Articles Reader (`/articles`)
- Magazine-style article cards
- User & recipient avatars - NEW!
- Dual timestamp display - NEW!
- Filter by user or recipient - NEW!
- \"From\" and \"For\" indicators - NEW!
- Source and content type filtering

### 🔧 Scraper Monitor (`/scraper`)
- Real-time metrics dashboard
- User & recipient filtering - NEW!
- Enhanced timestamps - NEW!
- Source statistics
- Status tracking

## Visual Features

### Color Schemes
- **Users**: Blue, green, purple, pink, indigo, red, yellow, teal
- **Recipients**: Purple, pink, rose, fuchsia, violet, indigo (distinct palette)
- Deterministic assignment based on ID hash

### Avatar System
- Circular avatars with 2-letter initials
- Consistent colors per user/recipient
- Multiple sizes (4px, 6px, 8px, 10px, 12px)
- Active indicators (green for users, purple for recipients)

### Filter Banner
- Gradient background (blue to purple)
- Shows active sender and recipient
- Avatar + name display
- One-click clear button

## Integration Guide for Wabi App

```javascript
const logToServer = async (data) => {
  await fetch('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      // Sender info
      senderName: currentUser.name,
      senderId: currentUser.id,
      sessionId: currentSession.id,
      deviceInfo: `Wabi v${version}/${platform}`,
      // Recipient info (for whom this content is intended)
      recipientName: targetUser.name,
      recipientId: targetUser.id,
      recipientEmail: targetUser.email
    })
  })
}
```

## Use Cases

### Multi-User News Aggregation
- Scrape articles for different users
- Filter content by intended recipient
- Track who scraped what for whom
- Personal news feeds per user

### Team Collaboration
- Share scraped content with specific team members
- Track content distribution
- Monitor per-recipient activity
- Organize by content recipient

### Testing & Development
- Test user-specific vs recipient-specific filtering
- Debug multi-user scenarios
- Track content flow from sender to recipient
- Session-based debugging

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- In-memory storage (300 requests)

## Backward Compatibility

✅ All fields optional
✅ Works without user/recipient data
✅ Sidebars only appear when data present
✅ All existing functionality preserved

## License

MIT
