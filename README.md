# 🎬 17th BIFFes 2026

A modern Progressive Web App for exploring the **17th Bengaluru International Film Festival** (January 30 – February 6, 2026).

**🌐 Live: [biffes26.vercel.app](https://biffes26.vercel.app)**

## ✨ Features

### 🎥 Film Discovery
- **Browse by Category** — 13 categories including Asian Cinema, World Cinema, Indian Panorama, Kannada Cinema, Critics' Week, Bio-Pics, Documentaries, and more
- **Award Winners** — Films grouped by prestigious festivals (Cannes, Venice, Berlin, Sundance, Toronto, Locarno, San Sebastián, Karlovy Vary, National Film Awards India)
- **A-Z Film List** — Alphabetically sorted complete film catalog with letter quick-jump
- **Smart Search** — Instant search across titles, directors, countries, and languages with debounced dropdown results
- **Rating Filters** — Filter films by minimum IMDb, RT, or Letterboxd scores

### 📅 Schedule & Planning
- **8-Day Schedule** — Complete festival timetable (Jan 30 – Feb 6) across all venues
- **Multi-Venue Support** — Cinepolis LULU Mall (5 screens), Rajkumar Bhavana, Suchitra Cinema, Open Air
- **Live "Now Showing"** — Real-time indicator for currently playing films (IST timezone aware)
- **Today Auto-Select** — Schedule automatically opens to current festival day
- **View Modes** — Toggle between compact timeline and detailed card views
- **Venue Filtering** — Filter schedule by specific cinema or screen

### ❤️ Watchlist System
- **Personal Watchlist** — Build your must-watch list with one-tap add/remove
- **Local-First Storage** — Works offline with localStorage, syncs to cloud when online
- **Share Codes** — Generate 6-character codes to share your watchlist with friends
- **Import Lists** — Import shared watchlists via URL parameter (`?import=ABC123`)
- **Schedule Integration** — See your watchlist films mapped to screening times
- **Conflict Detection** — Visual warnings when watchlist films overlap in schedule

### ✨ Top Rated Picks
- **Daily Picks** — Films ranked by highest ratings for each festival day
- **Multi-Source Scoring** — Aggregates IMDb, RT, Metacritic, Letterboxd ratings with award bonuses
- **Conflict-Free Planning** — Greedy algorithm ensures no overlapping screenings
- **Alternative Showings** — Suggests other days/times if a recommended film conflicts
- **Shareable** — Share your daily picks via Web Share API or clipboard
- **Bulk Add** — One-click "Add All to Watchlist" for quick planning

### 📊 Data Observatory (`/data`)
- **Festival Statistics** — Total films, countries, languages, runtime analytics
- **Geographic Distribution** — Films by country/language bar charts
- **Schedule Analytics** — Screenings by venue, by day, peak hours
- **Platform Stats** — Active sync codes, watchlists, data sizes
- **Category Breakdown** — Film counts per category

### ⭐ Ratings & Info
- **Multi-Platform Ratings** — IMDb, Rotten Tomatoes, Metacritic, Letterboxd scores
- **Clickable Links** — Direct links to external rating pages
- **Awards Display** — Festival selections and prizes prominently shown
- **Premiere Badges** — World/Asia/India premiere indicators
- **Full Details** — Synopsis, cast, crew, runtime, language, country for every film

### 📱 Progressive Web App
- **Installable** — Add to home screen on mobile/desktop
- **Offline Support** — Service worker caches essential assets and posters
- **Fast Loading** — Static site generation with incremental data updates
- **Responsive Design** — Mobile-first, works beautifully on all screen sizes

### ♿ Accessibility
- **Skip Navigation** — Skip-to-content link for screen readers
- **ARIA Labels** — Proper labeling throughout the UI
- **Keyboard Navigation** — Full keyboard support including focus trapping in modals
- **Reduced Motion** — Respects `prefers-reduced-motion` setting

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router, SSG |
| **React** | 19.x | UI library with Server Components |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 12.x | Smooth animations |
| **@tanstack/react-virtual** | 3.x | Virtualized lists for performance |
| **@upstash/redis** | 1.x | Serverless Redis for watchlist sync |
| **Cheerio** | 1.x | HTML parsing for web scraping |
| **Sharp** | 0.34 | Image optimization |
| **Lucide React** | 0.561 | Icon library |

## 🚀 Quick Start

```bash
git clone https://github.com/psam21/biffes26.git
cd biffes26
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Home - categories & award winners
│   ├── films/                # A-Z alphabetical film listing
│   ├── schedule/             # 8-day festival schedule
│   ├── recommendations/      # Top-rated daily picks
│   ├── watchlist/            # Personal watchlist with schedule view
│   ├── data/                 # Festival statistics dashboard
│   ├── category/[slug]/      # Dynamic category pages (13 categories)
│   ├── film/[id]/            # Individual film detail pages (200+ films)
│   └── api/                  # API routes
│       ├── watchlist/        # Watchlist CRUD + sync codes
│       ├── status/           # Health check endpoint
│       └── cron/refresh/     # Daily data refresh
├── components/               # Reusable UI components
│   ├── FilmDrawer.tsx        # Full-screen film details panel
│   ├── FilmCard.tsx          # Film card with poster & ratings
│   ├── VirtualizedFilmGrid.tsx # Performance-optimized grid
│   ├── WatchlistButton.tsx   # Add/remove watchlist button
│   ├── ShareWatchlist.tsx    # Movie ticket-styled share modal
│   ├── RatingBadges.tsx      # Compact multi-platform ratings
│   ├── SiteHeader.tsx        # Sticky header with festival info
│   ├── SiteNav.tsx           # Navigation pills
│   └── ...                   # 15+ components total
├── data/                     # Static JSON data
│   ├── biffes_data.json      # Festival info, categories, films
│   └── schedule_data.json    # 8-day venue/screen schedule
├── lib/                      # Utilities & context
│   ├── watchlist-context.tsx # React Context for watchlist state
│   ├── recommendations.ts    # Scoring algorithm
│   ├── utils.ts              # Helpers (cn, formatDuration, etc.)
│   └── upstash.ts            # Redis client
└── types/
    └── index.ts              # TypeScript interfaces

scripts/                      # Data pipeline tooling
├── pipeline.ts               # Main scraping orchestrator
├── scrape-films.ts           # biffes.org film scraper
├── download-posters.ts       # Poster image downloader
├── optimize-images.ts        # AVIF conversion
└── ...

public/
├── posters/                  # Film poster images
├── manifest.json             # PWA manifest
└── sw.js                     # Service worker
```

## 🔄 Data Pipeline

```bash
# Full pipeline (scrape + ratings + posters)
npm run pipeline

# Quick update (skip scraping, ratings only)
npm run pipeline:quick

# Individual steps
npm run download-posters      # Download missing poster images
npm run optimize-images       # Convert to AVIF format
npm run schedule:generate     # Generate schedule from extracted data
npm run schedule:validate     # Validate schedule consistency
```

### Environment Variables

```env
# Required for ratings
OMDB_API_KEY=your_key_here

# Required for cloud sync
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Required for cron refresh
CRON_SECRET=your_secret_here
```

## ☁️ Cloud Sync Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│   Vercel Edge    │────▶│  Upstash Redis  │
│   (localStorage)│◀────│   API Routes     │◀────│   (Serverless)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │ Daily Cron
        │                        ▼
        │               ┌──────────────────┐
        └──────────────▶│   biffes.org     │
           (fallback)   │   (Source)       │
                        └──────────────────┘
```

- **Local-first**: Works offline, syncs when online
- **Rate limiting**: 60 requests/min per IP
- **TTL**: 30-day expiration for inactive watchlists
- **Share codes**: 6-character alphanumeric (32^6 = 1B+ combinations)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/watchlist` | GET/POST/DELETE | Watchlist CRUD operations |
| `/api/watchlist/sync` | POST | Create/retrieve share codes |
| `/api/status` | GET | Health check + stats |
| `/api/cron/refresh` | GET | Daily data refresh (cron) |

## 📦 Data Sources

| Source | Data Provided |
|--------|---------------|
| [biffes.org](https://biffes.org) | Films, categories, crew, synopses, awards |
| [OMDb API](https://omdbapi.com) | IMDb, Rotten Tomatoes, Metacritic ratings |
| [Letterboxd](https://letterboxd.com) | Community ratings (manual enrichment) |
| Official Schedule PDF | Venue, screen, and timing data |

## 🎨 Design Highlights

- **Dark Theme** — Easy on the eyes for cinema lovers
- **Amber Accents** — Festival branding color (#eab308)
- **Smooth Animations** — Framer Motion page transitions
- **Movie Ticket UI** — Share modal styled like a film ticket
- **Category Gradients** — Unique color gradients per category
- **Glass Morphism** — Subtle backdrop blur effects

## 📱 PWA Features

- **Manifest**: App name, icons, theme color, standalone display
- **Service Worker**: 
  - Static assets cached on install
  - Posters: cache-first with background revalidation
  - Navigation: network-first with cache fallback
  - API: stale-while-revalidate

## 🏗 Deployment

Deployed on **Vercel** with automatic deployments on push to `main`.

```bash
npm run build    # Production build
npm run start    # Start production server
```

## 📄 License

MIT — Feel free to fork for your own film festival!

---

Built with ❤️ for cinema lovers attending BIFFes 2026

**Venues**: LULU Mall Cinepolis • Rajkumar Bhavana • Suchitra Cinema
