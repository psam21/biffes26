import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import data from "../src/data/biffes_data.json";

const POSTERS_DIR = path.join(process.cwd(), "public", "posters");

async function downloadImage(url: string, filename: string): Promise<boolean> {
  try {
    // Fix double slash issue
    const fixedUrl = url.replace("biffes.org//", "biffes.org/");
    
    const response = await axios.get(fixedUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://biffes.org/",
      },
      timeout: 15000,
    });

    const filepath = path.join(POSTERS_DIR, filename);
    fs.writeFileSync(filepath, response.data);
    console.log(`✅ Downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${filename} - ${(error as Error).message}`);
    return false;
  }
}

function getExtension(url: string): string {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? match[0].toLowerCase() : ".jpg";
}

async function main() {
  console.log("🎬 Downloading BIFFes film posters...\n");

  // Create posters directory
  if (!fs.existsSync(POSTERS_DIR)) {
    fs.mkdirSync(POSTERS_DIR, { recursive: true });
  }

  const updatedFilms = [];
  let downloaded = 0;
  let failed = 0;

  for (const film of data.films) {
    if (!film.posterUrl) {
      updatedFilms.push(film);
      continue;
    }

    const ext = getExtension(film.posterUrl);
    const filename = `${film.id}${ext}`;
    const localPath = `/posters/${filename}`;

    // Fix the remote URL (remove double slash)
    const fixedRemoteUrl = film.posterUrl.replace("biffes.org//", "biffes.org/");

    const success = await downloadImage(film.posterUrl, filename);

    if (success) {
      downloaded++;
      updatedFilms.push({
        ...film,
        posterUrl: localPath,
        posterUrlRemote: fixedRemoteUrl, // Keep as fallback
      });
    } else {
      failed++;
      updatedFilms.push({
        ...film,
        posterUrl: fixedRemoteUrl, // Use fixed remote URL
        posterUrlRemote: fixedRemoteUrl,
      });
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Save updated data
  const updatedData = {
    ...data,
    films: updatedFilms,
  };

  fs.writeFileSync(
    path.join(process.cwd(), "src", "data", "biffes_data.json"),
    JSON.stringify(updatedData, null, 2)
  );

  console.log(`\n✅ Done! Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log("📁 Posters saved to: public/posters/");
  console.log("📄 Updated: src/data/biffes_data.json");
}

main().catch(console.error);
