# Custom Column Builder Guide

The Custom Column Builder allows you to create personalized feeds with advanced filtering - your own algorithm!

## How to Create a Custom Column

1. Click the **"Customize"** button in the "Add Column" area
2. Configure your filters across three tabs: **Basic**, **Filters**, and **Advanced**
3. Click **"Create Column"** to add it to your deck

---

## Tab 1: Basic Settings

### Column Title (Required)
Give your column a descriptive name like:
- "Bitcoin News"
- "My Favorite Authors"
- "Recent Articles"
- "This Week's Highlights"

### Event Kinds
Choose which types of Nostr events to display:

- **Kind 1**: Short text notes (standard posts)
- **Kind 6**: Reposts
- **Kind 7**: Reactions (likes, emojis)
- **Kind 16**: Generic reposts
- **Kind 30023**: Long-form articles
- **Kind 9735**: Zap receipts
- **Custom kinds**: Any valid kind number (0-65535)

**Example:** Select kinds `[1, 30023]` to show both notes and articles.

### Event Limit
Control how many events to fetch per refresh:
- **Minimum**: 10 events
- **Maximum**: 500 events
- **Default**: 50 events
- **Recommendation**: Lower limits = faster loading, higher limits = more content

---

## Tab 2: Filters

### Multiple Authors
Filter events from specific users:

1. Enter an **npub**, **nprofile**, or **hex pubkey**
2. Click **"Add"** or press Enter
3. Add multiple authors to combine their posts in one feed

**Use Cases:**
- Follow your favorite content creators
- Monitor specific accounts
- Create a "team feed" for project contributors

**Example:** Add 5 Bitcoin developers to see all their posts in one column.

### Multiple Hashtags
Combine hashtags with **AND logic** (posts must have ALL tags):

1. Enter a hashtag (without the # symbol)
2. Click **"Add"** or press Enter
3. Add multiple tags to narrow your search

**Use Cases:**
- `bitcoin` + `lightning` = posts about both topics
- `nostr` + `tutorial` = Nostr tutorials only
- `art` + `photography` = artistic photography posts

**Note:** Events must contain ALL specified hashtags to appear.

### Content Search
Search for keywords in post content:

1. Enter search terms (comma-separated)
2. The filter will match posts containing these words

**Important:** Relay support for content search varies. Some relays may not support this feature.

**Use Cases:**
- Search for "zap" to find zap-related discussions
- Search for "cashu" to track ecash conversations
- Search for your project name to monitor mentions

---

## Tab 3: Advanced Options

### Date Range Filtering

#### Start Date (Since)
- Only show events **after** this date/time
- Use the datetime picker to select
- Leave empty for no start limit

#### End Date (Until)
- Only show events **before** this date/time
- Use the datetime picker to select
- Leave empty for no end limit

**Use Cases:**
- Last 24 hours: Set "since" to yesterday
- Historical analysis: Set both dates to a specific period
- Event coverage: Filter posts during a conference

### Include/Exclude Replies
- **ON** (default): Shows all posts including replies
- **OFF**: Hides posts that are replies to other posts

**Use Case:** Turn off to see only original posts, not conversations.

### Include Reposts
- **ON**: Automatically adds kind 6 (reposts) and kind 16 (generic reposts) to your kinds list
- **OFF** (default): Reposts are not included

**Use Case:** Turn on to see what people are sharing, not just posting.

### Quick Presets
Pre-configured filters for common use cases:

1. **Text Notes Only** - Sets kinds to [1], title to "Text Notes"
2. **Articles** - Sets kinds to [30023], title to "Long-form Articles"
3. **Last 7 Days** - Filters posts from the past week
4. **All Activity** - Includes notes, reposts, and sets appropriate kinds

---

## Example Custom Columns

### 1. Bitcoin Lightning Discussion
**Use Case:** Track Lightning Network discussions

- **Kinds**: [1] (text notes)
- **Hashtags**: bitcoin, lightning
- **Include Replies**: Yes
- **Limit**: 100

### 2. Nostr Developer Updates
**Use Case:** Follow core Nostr developers

- **Kinds**: [1, 30023] (notes + articles)
- **Authors**: [Add developer npubs]
- **Include Replies**: No (original posts only)
- **Limit**: 50

### 3. Recent Art Showcase
**Use Case:** Discover recent artistic posts

- **Kinds**: [1]
- **Hashtags**: art, artstr
- **Start Date**: Last 3 days
- **Include Replies**: No
- **Limit**: 100

### 4. Weekly Nostr Recap
**Use Case:** Catch up on what happened this week

- **Kinds**: [1, 30023] (notes + articles)
- **Hashtags**: nostr
- **Date Range**: Last 7 days
- **Include Reposts**: Yes (see what people shared)
- **Limit**: 200

### 5. Breaking Bitcoin News
**Use Case:** Real-time Bitcoin updates

- **Kinds**: [1]
- **Content Search**: "breaking, announcement, news"
- **Hashtags**: bitcoin
- **Include Replies**: No
- **Limit**: 50

### 6. Project Mentions
**Use Case:** Monitor mentions of your project

- **Kinds**: [1]
- **Content Search**: "YourProjectName"
- **Include Replies**: Yes
- **Limit**: 100

---

## Tips for Building Great Custom Columns

### Performance Optimization
- **Use specific filters** rather than broad queries
- **Limit authors** to 10-20 for best performance
- **Lower event limits** (20-50) load faster
- **Avoid content search** on slow relays

### Combining Filters Effectively

**Narrow Filters (More Specific)**
- Multiple hashtags + limited authors = very specific feed
- Date ranges + content search = focused discovery
- Good for niche topics or research

**Broad Filters (More Content)**
- Single kind + no other filters = maximum content
- Multiple authors only = combined feeds
- Good for monitoring general activity

### Understanding AND vs OR Logic

- **Hashtags**: AND logic (post must have ALL tags)
- **Authors**: OR logic (post from ANY listed author)
- **Kinds**: OR logic (post can be ANY listed kind)

**Example:**
```
Hashtags: [bitcoin, lightning]
Authors: [alice, bob, charlie]
Kinds: [1, 30023]
```

Results: Posts that:
- Have BOTH #bitcoin AND #lightning tags
- From alice OR bob OR charlie
- Are kind 1 OR kind 30023

### Relay Limitations

Not all relays support all filter types:
- ✅ **Always supported**: kinds, authors, limit, since, until, hashtags
- ⚠️ **Varies by relay**: content search
- ❌ **Not a relay filter**: reply exclusion (filtered client-side)

### Saved State

Custom columns are **saved to localStorage** along with all your preset columns. Your configuration persists across browser sessions.

---

## Common Questions

**Q: Can I edit a custom column after creating it?**
A: Currently, you need to remove and recreate it. Column editing may be added in the future.

**Q: Why don't I see any events?**
A: Check that:
- Your filters aren't too restrictive
- The event kinds you selected have recent activity
- Your relays support the filter types you're using

**Q: How many custom columns can I create?**
A: Unlimited! But for best performance, we recommend 5-10 total columns.

**Q: Can I export my column configuration?**
A: Column configs are stored in localStorage under `nostr-deck:columns`. You can export/import via browser DevTools.

---

## Technical Details

### Nostr Filter Structure

Custom columns are converted to standard Nostr filters:

```typescript
{
  kinds: [1, 30023],           // Event types
  authors: ['pubkey1', 'pubkey2'], // Author filtering
  '#t': ['bitcoin', 'lightning'],  // Hashtag filtering (AND)
  search: 'keyword',           // Content search
  since: 1234567890,           // Unix timestamp
  until: 1234567890,           // Unix timestamp
  limit: 50                    // Max events
}
```

### Client-Side Filtering

Some filters are applied client-side after fetching:
- **Reply exclusion**: Checks for 'e' or 'reply' tags
- **Advanced content matching**: If relay search is unsupported

---

**Ready to build your perfect feed?** Click "Customize" and start experimenting! ⚡🔒
