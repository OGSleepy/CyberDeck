# Changelog

All notable changes to CyberDeck are documented in this file.

## [1.0.0] - 2026-01-29

### 🎉 Initial Release

#### Core Features

##### Multi-Column TweetDeck Layout
- Horizontal scrolling deck interface with unlimited columns
- Five column types: Latest (Following), Worldwide, Hashtag, Author, Custom
- Persistent column configuration via localStorage
- Add/remove columns dynamically
- Auto-refresh every 60 seconds
- Manual refresh button per column

##### Column Types

**Latest (Following)**
- Shows posts from users you follow
- Requires Nostr login
- Queries your contact list (kind 3) automatically
- Displays helpful login prompt when not authenticated

**Worldwide**
- Global feed from all connected relays
- No filtering - complete activity stream
- No login required

**Hashtag**
- Filter by specific hashtags (#nostr, #bitcoin, etc.)
- Simple tag-based filtering
- No login required

**Author**
- Follow specific users by npub, nprofile, or hex pubkey
- Automatic format detection and conversion
- No login required

**Custom (Personalized Algorithm)**
- Advanced multi-parameter filtering
- Build your own personalized feed
- Three-tab interface: Basic, Filters, Advanced
- **Basic Options**:
  - Custom column title
  - Multiple event kinds (0-65535)
  - Adjustable event limit (10-500)
- **Filter Options**:
  - Multiple authors (combine different users)
  - Multiple hashtags (AND logic)
  - Content search (keyword matching)
- **Advanced Options**:
  - Date range filtering (since/until)
  - Reply inclusion toggle
  - Repost inclusion toggle
  - Quick presets for common use cases

##### Posting & Media
- Compose dialog for creating notes
- In-browser signing with multiple auth methods
- **Media uploads via Blossom servers**:
  - Image and video support
  - Multiple attachments per note
  - Preview thumbnails with removal
  - Automatic NIP-94 imeta tags
  - File validation (type and size)
  - Max 50MB per file
  - Upload progress indicator
- Character counter with media count
- Toast notifications for success/errors

##### Lightning Zaps
- Integrated zap button on every note
- **Payment methods**:
  - Nostr Wallet Connect (NWC)
  - WebLN browser extensions
  - Manual invoice with QR code
- Zap totals displayed per note
- Custom amounts with optional messages
- Only shown for notes with Lightning addresses

##### Authentication
- **Login methods**:
  - NIP-07 browser extensions (Alby, nos2x, etc.)
  - Direct nsec key input
  - NIP-46 remote signers (bunker URLs)
- Account switcher for multiple identities
- Persistent login across sessions
- LoginArea component in header

##### Relay Management
- NIP-65 relay list sync
- Add/remove relays with read/write permissions
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
- Settings dialog for configuration
- Auto-sync when logged in

##### Cypherpunk Design
- **Dark mode by default** with matrix-style green accents
- **JetBrains Mono** monospace font throughout
- **Custom color scheme**:
  - Primary green: #00ff66 (hsl 120 100% 45%)
  - Dark background: #0d1410 (hsl 120 10% 5%)
  - Green-themed scrollbars with glow
- **Animations**:
  - Slide-in for new posts
  - Pulse for new event indicators
  - Glow-pulse for highlighted elements
  - Smooth transitions throughout
- **Visual effects**:
  - Backdrop blur on headers
  - Shadow effects with primary color
  - Gradient text effects
  - Hover state animations

##### Background Music
- Hidden YouTube embed with looping audio
- Floating volume control button
- Starts muted for autoplay compliance
- Pulsing icon when active
- Positioned in bottom-right corner

##### Mobile Optimization
- **Responsive design** for all screen sizes
- **Non-sticky header on mobile** - saves screen space
- **Compact mobile layout**:
  - Separate mobile header (2-row layout)
  - Smaller text sizes (xs/sm vs sm/base)
  - Reduced padding (8px vs 12px)
  - Narrower columns (300px vs 380px)
  - Smaller buttons and icons
  - Abbreviated button labels
- **Touch-optimized**:
  - All touch targets ≥24px
  - Easy one-handed use
  - Horizontal swipe navigation
- **Tested devices**: iPhone SE to iPad Pro

### 🏗️ Technical Stack

- **React 18** with hooks and TypeScript
- **Nostrify** for Nostr protocol implementation
- **TanStack Query** for data fetching and caching
- **TailwindCSS** with custom cypherpunk color scheme
- **shadcn/ui** components with dark theme customization
- **JetBrains Mono** monospace font
- **Vite** for fast development and production builds
- **date-fns** for timestamp formatting
- **nostr-tools** for NIP-19 encoding/decoding

### 📦 Custom Hooks

- `useDeckColumn` - Manages event queries and auto-refresh per column
- `useNostrPublish` - Publishes signed events to relays
- `useUploadFile` - Uploads files via Blossom servers
- `useZaps` - Handles Lightning zap functionality
- `useCurrentUser` - Gets logged-in user state and metadata
- `useAuthor` - Fetches profile metadata for any pubkey
- `useWallet` - Unified wallet detection (WebLN + NWC)
- `useTheme` - Theme management (light/dark)

### 🎨 Components

**Main Components:**
- `NostrDeck` - Main container with header and column management
- `DeckColumn` - Individual column with event streaming
- `NoteCard` - Event display card with author info and actions
- `ComposeDialog` - Note creation with media upload
- `AddColumnDialog` - Quick column presets
- `CustomColumnDialog` - Advanced column builder
- `BackgroundMusic` - Hidden YouTube audio player

**UI Components:**
- 48+ shadcn/ui components available
- Custom styled for cypherpunk theme
- Fully accessible with ARIA support

### 💾 State Management

- **Column config** → localStorage (`nostr-deck:columns`)
- **App config** → localStorage (`nostr:app-config`)
  - Theme preference
  - Relay list (NIP-65)
- **Login state** → localStorage (`nostr:login`)
- **Wallet config** → localStorage (`nostr:nwc-connections`)

### 🔒 Security

- Client-side signing - keys never leave browser
- NIP-07 extension support - keys stay in extension
- Remote signing with NIP-46 bunker
- HTTPS-only client tags
- Validated inputs for all user data

### 🌐 Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Brave
- ✅ Edge

**Requirements:**
- WebSocket support
- IndexedDB
- ES2020+ JavaScript
- Modern CSS (Grid, Flexbox, Custom Properties)

### 📚 Documentation

- **README.md** - Project overview and features
- **FEATURES.md** - Detailed feature list and architecture
- **QUICKSTART.md** - Step-by-step user guide
- **CUSTOM_COLUMNS.md** - Custom column builder guide
- **MOBILE.md** - Mobile optimization details
- **CHANGELOG.md** - Version history (this file)

### 🐛 Known Issues

- None at launch! 🎉

### 🔮 Future Enhancements

Potential features for future versions:
- Image/video preview in feeds
- Thread view for reply chains
- DM column support (NIP-04/NIP-17)
- Notification column for mentions
- Bookmark/save posts
- Export/import column configuration
- Custom relay presets
- Keyboard shortcuts
- Search within columns
- Mute/block users
- Custom color themes
- Column reordering via drag-and-drop
- Gif search integration
- Emoji picker
- Draft saving

---

**Built with** [Shakespeare](https://shakespeare.diy) ⚡
