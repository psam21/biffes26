# 17th BIFFes 2026 - Film Festival Explorer

A modern, interactive dashboard for exploring the 17th Bengaluru International Film Festival (BIFFes) 2026 film lineup.

![BIFFes 2026](https://biffes.org/frontend/images/logo/newlogoBIFFes.png)

## 🎬 Features

- **Category Overview**: Browse films organized by 14+ curated categories including Asian Cinema, Indian Cinema, Kannada Cinema, World Cinema, and more
- **Interactive Film Cards**: Responsive grid layout with film posters, language badges, and quick info
- **Film Detail Drawer**: Slide-out panel with full film details including synopsis, director, duration, and premiere badges
- **Festival Ticker**: Real-time stats showing total films, countries represented, and festival dates
- **Smooth Animations**: Framer Motion powered transitions and interactions

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript 5
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Scraping**: Axios + Cheerio (for data pipeline)

## 📂 Project Structure

```
.
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React UI components
│   │   ├── CategoryCard.tsx
│   │   ├── CategoryView.tsx
│   │   ├── FilmCard.tsx
│   │   ├── FilmDrawer.tsx
│   │   └── FestivalTicker.tsx
│   ├── data/           # JSON data files
│   ├── lib/            # Utility functions
│   └── types/          # TypeScript definitions
├── scripts/            # Data scraping scripts
└── public/             # Static assets
```

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/psam21/biffes26.git
cd biffes26
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 4. Data Pipeline (Optional)

To refresh film data from biffes.org:

```bash
# Scrape films from all categories
npm run scrape

# Generate seed data
npm run seed
```

## 🚀 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

1. Push your code to GitHub
2. Import the project into Vercel
3. Vercel will automatically detect Next.js and deploy

## 📝 Data Sources

Film data is sourced from [biffes.org](https://biffes.org/filmcategory), the official website of the Bengaluru International Film Festival.

### Categories Included

- Opening & Closing Films
- Asian Cinema Competition
- Indian Cinema Competition
- Kannada Cinema Competition
- Contemporary World Cinema
- Critics' Week
- Bio-Pics
- Retrospective
- Centenary Tributes
- Chronicles of Africa
- Voice for Equality
- 50 Years of Cinematic Journey
- And more...

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own film festival dashboards.

---

Built with ❤️ for cinema lovers
