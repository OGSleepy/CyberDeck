# CyberDeck Features & Implementation

## Core Features

### 1. Multi-Column TweetDeck Layout ✅
- **Horizontal scrolling deck** with unlimited columns
- **Responsive width** - each column is 380px with smooth scrolling
- **Persistent state** - columns saved to localStorage
- **Visual indicators** for new posts with animated dot

### 2. Column Types ✅

#### Latest (Following)
- Shows posts from users you follow (requires login)
- Queries your contact list (kind 3) automatically
- Displays login prompt when not authenticated
- Auto-refresh every 60 seconds

#### Worldwide
- Shows all recent posts from connected relays
- No filtering - complete global feed
- Auto-refresh every 60 seconds

#### Hashtag Filter
- Filter posts by specific hashtags
- User can add any hashtag (e.g., #nostr, #bitcoin, #grownostr)
- Auto-refresh for matching posts

#### Author Filter
- Follow specific Nostr users
- Supports npub, nprofile, and hex pubkey formats
- Automatic format detection and conversion

#### Custom (Personalized Algorithm)
- **Build your own feed** with advanced multi-parameter filtering
- **Basic Options**:
  - Custom column title
  - Multiple event kinds (notes, articles, reactions, reposts, etc.)
  - Adjustable event limit (10-500)
- **Filter Options**:
  - Multiple authors (combine different users in one feed)
  - Multiple hashtags (AND logic - posts must have all tags)
  - Content search (keyword matching in post text)
- **Advanced Options**:
  - Date range filtering (since/until timestamps)
  - Reply inclusion toggle (show/hide replies)
  - Repost inclusion (automatically adds kind 6 & 16)
  - Quick presets for common use cases
- **Tabbed Interface**: Easy navigation between Basic, Filters, and Advanced settings
- **Real-time preview**: See filter summary before creating

### 3. Live Event Streaming ✅
- **Real-time subscriptions** via WebSocket
- **Live event counter** shows new posts since last refresh
- **Auto-deduplication** prevents duplicate events
- **Smart sorting** by timestamp (most recent first)

### 4. Posting & Publishing ✅
- **ComposeDialog** for creating new notes
- **In-browser signing** using:
  - NIP-07 browser extensions (Alby, nos2x, etc.)
  - Direct nsec key input
  - NIP-46 bunker URLs
- **Media uploads** via Blossom servers:
  - Image and video support
  - Multiple attachments per note
  - Preview thumbnails with removal option
  - Automatic NIP-94 imeta tags
  - File validation (type and size)
  - Upload progress indicator
  - Max 50MB per file
- **Character counter** with media count
- **Success/error notifications** via toast system

### 5. Lightning Zaps ⚡
- **Integrated zap button** on every note
- **Multiple payment methods**:
  - Nostr Wallet Connect (NWC) - primary method
  - WebLN browser extensions
  - Manual invoice payment (QR code + lightning: URI)
- **Zap totals** displayed per note
- **Custom amounts** with optional messages
- **Author validation** - only shows zap button for notes with lightning addresses

### 6. Cypherpunk Aesthetic 🔒
- **Dark mode by default** with green matrix accents
- **JetBrains Mono** monospace font throughout
- **Custom color scheme**:
  - Background: Deep dark green (#0a0f0c)
  - Primary: Bright green (#00ff66)
  - Borders: Subtle green glow
- **Custom scrollbars** with green thumb
- **Glow effects** on hover and focus states
- **Smooth animations**:
  - Slide-in for new posts
  - Pulse for new event indicators
  - Glow-pulse for highlighted elements

### 7. User Authentication ✅
- **LoginArea component** in header
- **Multiple login methods**:
  - Browser extension (NIP-07)
  - Secret key (nsec)
  - Remote signer (NIP-46 bunker)
- **Account switching** for multiple identities
- **Persistent login** across sessions

### 8. Relay Management ✅
- **Settings dialog** for relay configuration
- **NIP-65 support** - relay lists sync across devices
- **15 default relays** for maximum coverage:
  - wss://relay.ditto.pub
  - wss://relay.primal.net
  - wss://relay.damus.io
  - wss://nos.lol
  - wss://relay.nostr.bg
  - wss://nostr.wine
  - wss://relay.snort.social
  - wss://nostr.mom
  - wss://relay.nostr.wirednet.jp
  - wss://nostr.oxtr.dev
  - wss://relay.mostr.pub
  - wss://nostr-pub.wellorder.net
  - wss://nostr.fmt.wiz.biz
  - wss://relay.siamstr.com
  - wss://relay.orangepill.dev
- **Add/remove relays** with read/write permissions
- **Auto-sync** when logged in with Nostr

### 9. Rich Content Display ✅
- **NoteContent component** for rendering:
  - Clickable URLs
  - Hashtags (#nostr, #bitcoin)
  - Nostr mentions (nostr:npub, nostr:note)
  - Preserves line breaks
- **Profile avatars** with fallback initials
- **Display names** with NIP-05 verification badges
- **Relative timestamps** ("2 minutes ago", "3 hours ago")

### 10. Wallet Integration ✅
- **WalletModal** for managing Lightning connections
- **NWC setup wizard** with connection string input
- **WebLN detection** for compatible extensions
- **Connection status** indicators
- **Persistent wallet config** across sessions

## Technical Implementation

### Component Architecture

```
NostrDeck (main container)
├── Header
│   ├── Logo & Title
│   ├── ComposeDialog (post button)
│   ├── WalletModal button
│   ├── Settings dropdown
│   └── LoginArea (account switcher)
├── Column Container (horizontal scroll)
│   ├── DeckColumn (Latest)
│   │   ├── Column Header (with refresh/remove)
│   │   └── NoteCard[] (event list)
│   ├── DeckColumn (Hashtag #nostr)
│   │   └── NoteCard[]
│   ├── DeckColumn (Author)
│   │   └── NoteCard[]
│   └── AddColumnDialog (add new column)
└── Dialogs
    ├── Settings (relay management)
    └── WalletModal (Lightning setup)
```

### Custom Hooks

- **useDeckColumn(config)**: Manages queries and live subscriptions per column
- **useNostrPublish()**: Publishes signed events with proper tags
- **useZaps(event)**: Handles zap functionality and payment flow
- **useCurrentUser()**: Gets logged-in user state and metadata
- **useAuthor(pubkey)**: Fetches profile metadata for any pubkey

### State Management

1. **Column Configuration** → localStorage (`nostr-deck:columns`)
2. **App Config** → localStorage (`nostr:app-config`)
   - Theme preference
   - Relay list (NIP-65)
3. **Login State** → localStorage (`nostr:login`)
4. **Wallet Config** → localStorage (`nostr:nwc-connections`)

### Real-Time Features

- **TanStack Query** for caching and background refetch
- **WebSocket subscriptions** for live events
- **Auto-deduplication** by event ID
- **Smart refresh** - respects component lifecycle
- **Optimistic updates** for published events

## Browser Compatibility

✅ Chrome/Chromium (full support)
✅ Firefox (full support)
✅ Safari (full support)
✅ Brave (full support)
✅ Edge (full support)

**Requirements:**
- WebSocket support
- IndexedDB (for localStorage)
- ES2020+ JavaScript
- Modern CSS (Grid, Flexbox, Custom Properties)

## Performance Optimizations

1. **Event limit**: Max 100 events per column to prevent memory issues
2. **Lazy loading**: Components only render visible content
3. **Debounced queries**: Prevents excessive relay requests
4. **Cached profiles**: Author metadata cached with TanStack Query
5. **Optimized re-renders**: React.memo and useMemo where appropriate

## Security Features

- **Client-side signing** - private keys never leave the browser
- **NIP-07 extension support** - keys stay in extension
- **Remote signing** with NIP-46 bunker
- **HTTPS-only** client tags for published events
- **Validated inputs** for nsec, npub, and bunker URIs

## Future Enhancement Ideas

- [ ] Image/video preview in notes
- [ ] Thread view for replies
- [ ] DM column support (NIP-04/NIP-17)
- [ ] Notification column for mentions
- [ ] Bookmark/save posts
- [ ] Export column configuration
- [ ] Custom relay presets
- [ ] Dark/light theme switcher in header
- [ ] Mobile swipe gestures
- [ ] Keyboard shortcuts
- [ ] Search within columns
- [ ] Filter by date range
- [ ] Mute/block users
- [ ] Custom color themes

---

Built with ⚡ using Shakespeare
