# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

App Netuno is a DeFi platform for Solana ecosystem users, providing a unified view of Liquidity Provider (LP) positions across different AMMs. The MVP allows users to connect their Solana wallet, view active LP positions, essential metrics, and basic historical data.

## Architecture

**Monorepo Structure:**
- `netuno-frontend/` - Next.js 15 + React 18 + Chakra UI frontend
- `netuno-backend/` - Node.js + Express backend with SQLite database
- `scripts/` - Project documentation and task management files

**Frontend (netuno-frontend):**
- Next.js 15 with App Router
- TypeScript with strict configuration
- Chakra UI v3 for components
- Solana Wallet Adapter integration (Phantom, Solflare, Backpack)
- Components: Dashboard, WalletConnection, PositionList, HistoricalPositions

**Backend (netuno-backend):**
- Express.js server with CORS for localhost:3000
- SQLite database (better-sqlite3) for LP position snapshots
- Solana Web3.js for RPC interactions
- LP token identification for Raydium, Orca, and Meteora protocols
- Price data integration (Birdeye, CoinMarketCap APIs)

## Key Commands

### Frontend (run from netuno-frontend/)
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Backend (run from netuno-backend/)
```bash
node index.js        # Start backend server (port 4000)
```

### Root Level
```bash
# Task management (uses task-master-ai)
task-master list     # View current tasks
task-master next     # Show next task to work on
task-master show <id># View specific task details
```

## Core Data Flow

1. **LP Position Detection**: Backend fetches user's SPL token accounts via Solana RPC
2. **Protocol Identification**: Cross-references token mints against known LP tokens from Raydium, Orca, Meteora
3. **Pool Data Fetching**: Retrieves pool metadata and reserves from protocol APIs
4. **Value Calculation**: Computes USD value using price APIs and pool reserves
5. **Historical Tracking**: Automatically detects position closures and saves snapshots to SQLite

## Key Components

**Frontend Components:**
- `Dashboard.tsx` - Main dashboard showing positions and metrics
- `WalletConnection.tsx` - Handles Solana wallet connection
- `PositionList.tsx` - Displays active LP positions
- `HistoricalPositions.tsx` - Shows closed position history

**Backend Services:**
- `lpTokenIdentifier.js` - Identifies LP tokens across protocols
- `priceService.js` - Fetches token prices from external APIs
- `lpMetrics.js` - Calculates LP position metrics
- Protocol-specific modules: `raydiumLpMints.js`, `orcaLpMints.js`, `meteoraLpMints.js`

## Environment Configuration

**Frontend**: Standard Next.js environment variables
**Backend**: Requires `.env` file with:
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `PRICE_API_URL` - Price service API endpoint
- API keys for price services (Birdeye, CoinMarketCap)

## Development Workflow

This project uses Task Master AI for task management. Key workflows:
- Run `task-master next` to identify next task
- Use `task-master show <id>` for detailed task information
- Mark tasks complete with `task-master set-status --id=<id> --status=done`
- Always run linting and formatting before commits

## Protocol Integration

The system supports three main Solana AMMs:
- **Raydium**: Uses `/pools` endpoint for pool data
- **Orca**: Integrates with Orca SDK for pool information
- **Meteora**: Uses Meteora API for dynamic pools

Each protocol has consistent interface:
- `fetchXXXLpMints()` - Returns array of LP token mints
- `fetchXXXPools()` - Returns array of pool data objects
- Pool objects contain: reserves, LP supply, token mints, metadata

## Database Schema

SQLite table `lp_snapshots`:
- `address` - User's wallet address
- `mint` - LP token mint address
- `protocol` - AMM protocol name
- `openDate`/`closeDate` - Position lifecycle timestamps
- `initialValue`/`finalValue` - USD values at open/close
- `totalFees` - Estimated fees collected

## Common Patterns

- All async operations use proper error handling
- Price data is cached and rate-limited
- UI components handle loading/error states consistently
- Backend endpoints follow RESTful conventions
- Frontend uses TypeScript interfaces for type safety