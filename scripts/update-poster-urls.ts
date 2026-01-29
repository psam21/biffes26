#!/usr/bin/env tsx
/**
 * Update poster URLs in biffes_data.json to use optimized WebP images
 */

import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src/data/biffes_data.json");

async function updatePosterUrls() {
  console.log("📝 Updating poster URLs to use optimized images...\n");

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  
  let updated = 0;
  
  for (const film of data.films) {
    if (film.posterUrl && film.posterUrl.startsWith("/posters/")) {
      // Keep original as remote fallback
      film.posterUrlRemote = `https://biffes.org${film.posterUrl.replace("/posters/", "/wp-content/uploads/")}`;
      
      // Update to optimized version
      const baseName = path.parse(film.posterUrl).name;
      film.posterUrl = `/posters-optimized/${baseName}.webp`;
      updated++;
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  
  console.log(`✅ Updated ${updated} poster URLs to use optimized WebP images`);
}

updatePosterUrls().catch(console.error);
