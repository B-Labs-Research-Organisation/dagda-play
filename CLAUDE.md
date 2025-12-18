# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build (note: --no-lint flag used)
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **Blockchain**: Wagmi + Viem, targeting Base Sepolia testnet
- **State Management**: React Query (@tanstack/react-query)
- **Path Aliases**: `@/*` maps to `./src/*`

### Core Architecture Patterns

**Dual Platform Design**: The app functions both as a standalone web application AND as a Farcaster mini app with native frame support. This dual nature affects many implementation decisions.

**Client-Side State Management**: Player data (balances, daily limits) is stored entirely in localStorage via manager classes:
- `BalanceManager` (src/lib/BalanceManager.ts): Handles PIE token balances
- `LimitManager` (src/lib/LimitManager.ts): Enforces daily play limits (3 plays per game per day)
- Both managers handle server-side rendering safety and daily UTC resets

**Authentication Flow**: Hierarchical provider structure in src/components/providers/Providers.tsx:
```
WagmiProvider
└── QueryClientProvider
    └── FarcasterProvider (Farcaster OAuth context)
        └── WalletProvider (Web3 wallet connections)
```

**Farcaster Integration**:
- Manifest endpoint: `/api/manifest` serves Farcaster app manifest (redirected from `/.well-known/farcaster.json` via next.config.ts)
- Frame endpoints: `/api/frame/`, `/api/frame/coinflip`, `/api/frame/randomizer`, `/api/frame/leaderboard`
- Each frame has both a `route.ts` (frame metadata) and `image/route.ts` (frame image generation)
- Frames use inline HTML/CSS for rendering images (600x400px) with Celtic-themed styling

### Key Implementation Details

**Game Logic**: Both games (Coinflip and Randomizer) follow the same pattern:
1. Check wallet connection
2. Verify daily limit via LimitManager
3. Check PIE balance (5 PIE bet required)
4. Execute game logic with animations
5. Update balance via BalanceManager
6. Save state to localStorage

**Wallet Configuration** (src/lib/wagmi.ts):
- Only Base Sepolia chain supported
- Injected wallet + WalletConnect connectors
- Coinbase Wallet connector commented out due to dev telemetry issues
- Requires `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable

**Environment Variables**:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (required): WalletConnect Cloud project ID
- `NEXT_PUBLIC_APP_URL`: Base URL for the app (default: localhost:3000)
- `NEXT_PUBLIC_FARCASTER_APP_URL`: Farcaster-specific URL
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Optional custom RPC endpoint

### File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── frame/         # Farcaster frame endpoints
│   │   └── manifest/      # Farcaster manifest
│   ├── page.tsx           # Main game selection UI
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Celtic-themed emerald green styles
├── components/
│   ├── auth/              # Farcaster authentication
│   ├── games/             # CoinflipGame & RandomizerGame
│   ├── providers/         # Context providers hierarchy
│   └── frame/             # Frame metadata components
└── lib/
    ├── BalanceManager.ts  # PIE token balance management
    ├── LimitManager.ts    # Daily play limit enforcement
    ├── wagmi.ts           # Wagmi blockchain configuration
    └── frame-utils.ts     # Frame HTML generation utilities
```

### Important Constraints

- No backend database: all state is localStorage-based
- Daily limits reset at UTC midnight
- Build command uses `--no-lint` flag
- Turbopack is enabled for both dev and build
- Starting balance: 15 PIE tokens
- Game bet: 5 PIE per play
- Coinflip win: +5 PIE (net 10 PIE), loss: -5 PIE
- Farcaster users get +5 bonus PIE on signup and 5 plays/day instead of 3

### Deployment Considerations

When deploying, ensure:
1. Set `NEXT_PUBLIC_APP_URL` to production domain
2. Update Farcaster manifest URLs in src/app/api/manifest/route.ts if domain changes
3. Verify WalletConnect Project ID is production-ready
4. Frame redirects in next.config.ts work with production URLs
