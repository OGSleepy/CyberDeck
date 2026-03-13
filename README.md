# CyberDeck ⚡

A fully browser-based TweetDeck-style Nostr client with a cypherpunk aesthetic. Features multi-column layout, live event updates, Lightning zaps, and complete client-side operation with no backend required.

## Features

### Multi-Column Deck Interface
- **TweetDeck-style layout** with horizontally scrolling columns
- **Five column types**:
  - **Latest**: Stream of posts from users you follow (requires login)
  - **Worldwide**: All recent posts from connected relays
  - **Hashtag**: Filter posts by specific hashtags (#nostr, #bitcoin, etc.)
  - **Author**: Follow specific users by npub, nprofile, or hex pubkey
  - **Custom**: Build your own personalized algorithm with advanced filters
- **Add/remove columns** dynamically with persistent localStorage state
- **Auto-refresh** every 60 seconds with manual refresh buttons

### Posting & Interactions
- **Compose notes** with in-browser signing using Nostr extensions or keys
- **Media uploads** via Blossom servers - attach images and videos to posts
- **Multiple attachments** with preview thumbnails and removal options
- **Lightning zaps** via Nostr Wallet Connect (NWC) or WebLN
- **Rich content rendering** with clickable hashtags, mentions, and links
- **Profile avatars** and metadata display

### Cypherpunk Design
- **Dark mode by default** with green matrix-style accents
- **JetBrains Mono** monospace font throughout for terminal aesthetic
- **Subtle animations** for new events and interactions
- **Custom scrollbars** with green glow effects
- **Responsive layout** that works on desktop and mobile

### Technical Features
- **Fully client-side** - runs entirely in the browser, no backend
- **Multiple relay support** with NIP-65 relay list management
- **Nostr login** with NIP-07 extensions, nsec keys, or NIP-46 bunker
- **Wallet integration** for Lightning payments
- **Persistent state** - column configuration saved to localStorage

## Usage

### Getting Started

1. **Launch the app** - it will load with three default columns (Worldwide, #nostr, #bitcoin)
2. **Log in** using the account button in the top right:
   - Browser extension (NIP-07)
   - Secret key (nsec)
   - Nostr bunker (NIP-46)
3. **Start posting** using the "Post Note" button

### Managing Columns

- **Add columns**: Click the "Add Column" button and choose:
  - Latest (Following) - posts from users you follow (requires login)
  - Worldwide - all recent posts from all relays
  - Posts with a specific hashtag
  - Posts from a specific author (enter npub or hex pubkey)
- **Customize columns**: Click the "Customize" button to create advanced filters:
  - **Event Kinds**: Choose which event types to show (notes, articles, reactions, etc.)
  - **Multiple Authors**: Filter by specific users
  - **Multiple Hashtags**: Combine hashtag filters (AND logic)
  - **Content Search**: Search for keywords in post content
  - **Date Ranges**: Filter by start/end dates
  - **Include/Exclude Replies**: Control reply visibility
  - **Include Reposts**: Show or hide reposted content
  - **Custom Limits**: Fetch 10-500 events per refresh
  - **Quick Presets**: Text notes, articles, last 7 days, all activity
- **Remove columns**: Click the X button in any column header
- **Refresh**: Click the refresh icon to manually reload column content

### Lightning Zaps

1. **Connect wallet** via the "Wallet" button in the header:
   - Nostr Wallet Connect (NWC) - recommended
   - WebLN browser extension
2. **Zap notes** by clicking the lightning icon on any post
3. **Send custom amounts** with optional messages

### Settings

- **Manage relays**: Add/remove Nostr relays for reading and publishing
- **Toggle theme**: Switch between light and dark mode (dark recommended)
- **Relay sync**: Changes sync across devices when logged in with Nostr

## Technology Stack

- **React 18** with hooks and TypeScript
- **Nostrify** for Nostr protocol implementation
- **TanStack Query** for data fetching and caching
- **TailwindCSS** with custom cypherpunk color scheme
- **shadcn/ui** components with dark theme customization
- **JetBrains Mono** monospace font
- **Vite** for fast development and production builds

## Architecture

### Components
- `NostrDeck`: Main container with header and column management
- `DeckColumn`: Individual column with live event streaming
- `NoteCard`: Card component for displaying Nostr events
- `ComposeDialog`: Modal for creating new notes
- `AddColumnDialog`: Modal for adding preset columns
- `CustomColumnDialog`: Advanced column builder with personalized filters

### Hooks
- `useDeckColumn`: Manages event queries and live subscriptions per column
- `useNostrPublish`: Publishes signed events to relays
- `useZaps`: Handles Lightning zap functionality
- `useCurrentUser`: Gets logged-in user state and metadata

### State Management
- Column configuration persisted to `localStorage` under `cyberdeck:columns`
- Relay configuration synced via NIP-65 when logged in
- App config (theme, relays) persisted under `nostr:app-config`

## Default Relays

The app connects to these 15 relays by default for maximum coverage:
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

Users can add/remove relays from Settings.

## Browser Compatibility

Works in all modern browsers with:
- WebSocket support
- IndexedDB for localStorage
- ES2020+ JavaScript features

## Development

Built with [Shakespeare](https://shakespeare.diy) - an AI-powered website builder.

## License

MIT License - see project files for details

---

**Vibed with [Shakespeare](https://shakespeare.diy)** ⚡
