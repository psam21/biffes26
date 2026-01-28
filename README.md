# 17th BIFFes 2026

A modern PWA for exploring the Bengaluru International Film Festival 2026 lineup.

**🌐 [biffes26.vercel.app](https://biffes26.vercel.app)**

## Features

- 🏆 **Award Winners** — Films grouped by Cannes, Venice, Berlin, Sundance & more
- ⭐ **Ratings** — IMDb, Letterboxd, Rotten Tomatoes at a glance
- 📋 **Watchlist** — Build & share your personal list with friends
- 🔍 **Search** — Find films by title, director, or country
- 📱 **PWA** — Installable with offline support

## Tech Stack

Next.js 16 • TypeScript • Tailwind CSS 4 • Framer Motion • Upstash Redis • Vercel

## Quick Start

```bash
git clone https://github.com/psam21/biffes26.git
cd biffes26
npm install
npm run dev
```

## Project Structure

```
src/
├── app/                 # Next.js pages
├── components/          # UI components
├── data/                # Festival data (JSON)
├── lib/                 # Utils, Redis client, context
└── types/               # TypeScript types

scripts/                 # Data pipeline
public/                  # Posters, PWA assets
```

## Data Pipeline

```bash
npm run pipeline              # Incremental update
npm run pipeline:full         # Full refresh (needs OMDB_API_KEY)
npm run pipeline:posters      # Download missing posters
```

## Auto-Refresh

Data refreshes **daily** via Vercel Cron + Upstash Redis.

```
Vercel Cron (daily) → /api/cron/refresh → biffes.org → Upstash Redis
```

### Setup

1. Create Redis at [console.upstash.com](https://console.upstash.com)
2. Add env vars in Vercel:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXxx...
   ```

## Data Sources

| Source | Data |
|--------|------|
| [biffes.org](https://biffes.org) | Films, categories, crew, awards |
| [OMDb API](https://omdbapi.com) | IMDb, RT, Metacritic ratings |
| [Letterboxd](https://letterboxd.com) | Community ratings |

## License

MIT — feel free to fork for your own film festival.

---

Built with ❤️ for cinema lovers
