# 17th BIFFes 2026 - Film Festival Explorer

A modern, interactive Progressive Web App for exploring the 17th Bengaluru International Film Festival (BIFFes) 2026 film lineup.

**🌐 Live Site: [biffes26.vercel.app](https://biffes26.vercel.app)**

![BIFFes 2026](https://biffes.org/frontend/images/logo/newlogoBIFFes.png)

## 🎬 Features

- **173 Films** across 13 curated categories including Asian Cinema, Indian Cinema, Kannada Cinema, World Cinema, and more
- **Award Winners Gallery**: Films grouped by prestigious festivals (Cannes, Venice, Berlin, Sundance, Toronto, etc.)
- **Rich Film Details**: Slide-out drawer with synopsis, director, cast, crew (producer, cinematography, editor, music, sound), and awards
- **Multi-Source Ratings**: IMDb, Rotten Tomatoes, Letterboxd, and Metacritic with clickable links
- **Festival Ticker**: Real-time stats - 173 films from 29 countries
- **Kannada Titles**: Native script titles for Indian films where available
- **PWA Support**: Installable app with offline caching for posters and data
- **Smooth Animations**: Framer Motion powered transitions and interactions

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript 5
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Data Pipeline**: Axios + Cheerio (scraping) + OMDB API (ratings)
- **Deployment**: Vercel

## 📂 Project Structure

\`\`\`
.
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # PWA meta tags & service worker
│   │   └── page.tsx      # Main festival dashboard
│   ├── components/       # React UI components
│   │   ├── CategoryCard.tsx
│   │   ├── CategoryView.tsx
│   │   ├── FilmCard.tsx
│   │   ├── FilmDrawer.tsx
│   │   └── FestivalTicker.tsx
│   ├── data/             # JSON data (173 films)
│   └── types/            # TypeScript definitions
├── scripts/
│   ├── pipeline.ts       # Full data pipeline
│   └── generate-icons.js # PWA icon generator
├── public/
│   ├── posters/          # Cached film posters
│   ├── sw.js             # Service worker for offline
│   └── manifest.json     # PWA manifest
\`\`\`

## ⚡ Getting Started

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/psam21/biffes26.git
cd biffes26
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 4. Data Pipeline

Refresh film data from biffes.org and fetch ratings:

\`\`\`bash
# Quick incremental update (only new/changed films)
npm run pipeline

# Full refresh of all film details
OMDB_API_KEY=your_key npm run pipeline:full

# Update only ratings
OMDB_API_KEY=your_key npm run pipeline:ratings

# Download missing posters
npm run pipeline:posters
\`\`\`

## 🚀 Deployment

Deployed automatically on [Vercel](https://vercel.com/) via GitHub.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/psam21/biffes26)

## ⏰ Automated Data Refresh

The app uses **Vercel Cron Jobs** + **Upstash Redis** to automatically refresh film data every hour.

### Setup

1. **Create Upstash Redis Database**
   - Go to [console.upstash.com](https://console.upstash.com)
   - Create a new Redis database (free tier works great)
   - Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

2. **Add Environment Variables in Vercel**
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXxx...
   OMDB_API_KEY=your_omdb_key        # Optional: for ratings
   CRON_SECRET=your_random_secret    # Optional: protect manual triggers
   ```

3. **Deploy to Vercel**
   - The `vercel.json` configures the hourly cron job automatically
   - Cron runs at the top of every hour (`0 * * * *`)

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Check data source and last update time |
| `GET /api/cron/refresh` | Manually trigger a data refresh (requires `CRON_SECRET`) |

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Vercel Cron    │────▶│  /api/cron/      │────▶│  Upstash Redis  │
│  (every hour)   │     │  refresh         │     │  (data store)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  biffes.org +    │
                        │  OMDB API        │
                        │  (data sources)  │
                        └──────────────────┘
```

The app reads from:
1. **Upstash Redis** (if configured) - live data
2. **Static JSON** (fallback) - build-time data

## 📊 Data Sources

| Source | Data |
|--------|------|
| [biffes.org](https://biffes.org) | Films, categories, synopses, crew, cast, awards |
| [OMDb API](https://www.omdbapi.com) | IMDb ratings, Rotten Tomatoes, Metacritic |
| [IMDb](https://www.imdb.com) | Linked ratings |
| [Letterboxd](https://letterboxd.com) | Community ratings |
| [Rotten Tomatoes](https://www.rottentomatoes.com) | Critics scores |

### Categories

- 🎬 Opening & Closing Films
- 🌏 Asian Cinema Competition (15 films)
- 🇮🇳 Indian Cinema Competition (15 films)
- 🎭 Kannada Cinema Competition (13 films)
- 🎪 Children's World (8 films)
- 🌍 Contemporary World Cinema (87 films)
- 🏆 Critics' Choice (13 films)
- 🎞️ Retrospective (5 films)
- 💯 Centenary Tributes (2 films)
- 🌍 Chronicles of Africa (9 films)
- ✊ Voice for Equality (1 film)
- 🎥 50 Years of Cinematic Journey (5 films)

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Service worker caches pages and posters
- **Fast Loading**: Stale-while-revalidate caching strategy
- **Custom Icons**: BIFFes branded icons for all platforms

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your own film festival apps.

---

Built with ❤️ for cinema lovers
