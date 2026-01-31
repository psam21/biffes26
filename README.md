# 17th BIFFes 2026

A modern PWA for exploring the Bengaluru International Film Festival 2026 lineup (Jan 30 – Feb 6).

**🌐 [biffes26.vercel.app](https://biffes26.vercel.app)**

## Features

- 🏠 **Browse by Category** — Asian, Indian, Kannada Cinema, World Cinema, Critics' Week, Bio-Pics, and more
- 🏆 **Award Winners** — Films grouped by Cannes, Venice, Berlin, Sundance & more
- 📅 **Full Schedule** — 8-day screening timetable across all venues (Cinepolis, Rajkumar Theatre, Banashankari, Open Air)
- ✨ **Daily Picks** — AI-curated recommendations ranked by ratings for each festival day
- ❤️ **Watchlist** — Build, share & export your personal list with friends
- 📋 **Smart Schedule View** — See your watchlist films mapped to screening times with conflict detection
- ⭐ **Ratings** — IMDb, Letterboxd, Rotten Tomatoes, Metacritic at a glance
- 🔍 **Search** — Find films by title, director, or country
- 📱 **PWA** — Installable with offline support

## Tech Stack

Next.js 16 • React 19 • TypeScript • Tailwind CSS 4 • Framer Motion • Upstash Redis • Vercel

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
├── app/                 # Next.js App Router pages
│   ├── page.tsx         # Home - categories & award winners
│   ├── films/           # A-Z alphabetical film listing
│   ├── schedule/        # Full festival schedule by day/venue
│   ├── recommendations/ # Daily AI picks
│   ├── watchlist/       # Personal watchlist with schedule
│   ├── category/[slug]/ # Category detail pages
│   ├── film/[id]/       # Individual film pages
│   └── api/             # API routes (cron, watchlist sync)
├── components/          # Reusable UI components
├── data/                # Festival data (JSON)
├── lib/                 # Utils, Redis client, context
└── types/               # TypeScript types

scripts/                 # Data pipeline (scraping, posters, schedule)
public/                  # Posters, PWA assets, schedule PDFs
```

## Data Pipeline

```bash
npm run pipeline              # Incremental update
npm run pipeline:full         # Full refresh (needs OMDB_API_KEY)
npm run pipeline:quick        # Skip scraping, update ratings only
npm run pipeline:ratings      # Ratings only, no posters
npm run download-posters      # Download missing posters
npm run optimize-images       # Optimize poster images with Sharp
npm run schedule:generate     # Generate schedule from extracted data
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
   OMDB_API_KEY=xxx (optional, for ratings)
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
