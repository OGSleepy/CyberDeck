# Quick Start Guide

Get up and running with CyberDeck in under 2 minutes!

## Step 1: Open the App

Visit your deployed URL or run locally:

```bash
npm install
npm run dev
```

The app will launch with 3 default columns already configured:
- **Latest** - Recent posts from all relays
- **#nostr** - Posts tagged with #nostr
- **#bitcoin** - Posts tagged with #bitcoin

## Step 2: Log In (Optional but Recommended)

Click the **account button** in the top right corner and choose your login method:

### Option A: Browser Extension (Easiest)
1. Install a Nostr extension like [Alby](https://getalby.com) or [nos2x](https://github.com/fiatjaf/nos2x)
2. Create/import your Nostr keys in the extension
3. Click "Extension" in the login dialog
4. Approve the connection

### Option B: Secret Key
1. Click "Secret Key" in the login dialog
2. Paste your nsec key (starts with `nsec1...`)
3. Click "Log In"

### Option C: Remote Signer (Advanced)
1. Set up a NIP-46 bunker (like [nsecBunker](https://github.com/kind-0/nsecbunkerd))
2. Click "Remote Signer" in the login dialog
3. Paste your bunker:// URI
4. Approve the connection

## Step 3: Customize Your Deck

### Add Columns

Click the **"Add Column"** button on the right side:

1. **Latest Posts** - Shows all recent posts from your relays
2. **Hashtag** - Enter any hashtag (bitcoin, nostr, grownostr, etc.)
3. **Author** - Follow specific users by npub or hex pubkey

**Examples:**
- Hashtag: `bitcoin` (without the #)
- Author: `npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m`

### Remove Columns

Click the **X button** in any column header to remove it.

### Refresh Columns

Click the **refresh icon** in any column header to manually reload events.

## Step 4: Post Your First Note

1. Make sure you're logged in
2. Click the **"Post Note"** button in the header
3. Type your message
4. Click **"Publish"**

Your note will be signed with your Nostr key and published to all your configured relays!

## Step 5: Send Lightning Zaps ⚡

### Connect Your Wallet

Click the **"Wallet"** button in the header and choose:

**Option A: Nostr Wallet Connect (Recommended)**
1. Get a NWC connection string from:
   - [Alby](https://getalby.com)
   - [Mutiny Wallet](https://www.mutinywallet.com)
   - [Coinos](https://coinos.io)
2. Paste the connection string (starts with `nostr+walletconnect://`)
3. Click "Connect"

**Option B: WebLN Extension**
- Install [Alby Extension](https://getalby.com)
- It will be detected automatically

### Zap a Note

1. Find a note you like
2. Click the **⚡ lightning icon** 
3. Enter an amount in sats
4. Add an optional message
5. Click "Send Zap"

Your payment will be sent instantly via Lightning!

## Step 6: Manage Relays

Click the **⚙️ Settings icon** → **"Manage Relays"**

### Default Relays
The app connects to 15 relays by default for maximum coverage:
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

### Add Custom Relays
1. Enter the relay URL (must start with `wss://`)
2. Toggle read/write permissions
3. Click "Add Relay"

**Tip:** If you're logged in, your relay list will sync across all your devices via NIP-65!

## Tips & Tricks

### Keyboard Shortcuts
- **Scroll horizontally** with touchpad or mouse wheel
- **Shift + Scroll** to scroll faster

### Performance
- Each column shows up to 100 events
- Events auto-refresh every 60 seconds
- New events show a **green pulse dot** in the column header

### Privacy
- Your keys stay in your browser/extension - never sent to servers
- All data is client-side only
- No tracking, no analytics

### Troubleshooting

**No events showing?**
1. Check your relay connections in Settings
2. Try adding more relays
3. Wait a few seconds for events to load
4. Click the refresh icon in the column header

**Can't log in?**
1. Make sure your nsec/bunker URI is correct
2. Check browser extension permissions
3. Try refreshing the page

**Zaps not working?**
1. Connect your wallet via the Wallet button
2. Make sure the author has a Lightning address
3. Check your wallet has sufficient balance

## Next Steps

- Explore different hashtags (#grownostr, #foodstr, #artstr)
- Follow interesting authors
- Post engaging content
- Zap creators you appreciate
- Join the Nostr community!

---

**Need help?** 
- Check out [FEATURES.md](./FEATURES.md) for detailed documentation
- Read [README.md](./README.md) for technical details
- Visit [nostr.how](https://nostr.how) to learn more about Nostr

**Vibed with [Shakespeare](https://shakespeare.diy)** ⚡
