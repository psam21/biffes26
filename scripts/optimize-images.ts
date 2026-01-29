#!/usr/bin/env tsx
/**
 * Image Optimization Script for BIFFes 2026
 * Converts all poster images to optimized WebP format
 * 
 * Usage: npx tsx scripts/optimize-images.ts
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const POSTERS_DIR = path.join(process.cwd(), "public/posters");
const OPTIMIZED_DIR = path.join(process.cwd(), "public/posters-optimized");

// Target sizes for responsive images
const SIZES = {
  thumb: 200,   // For grid thumbnails
  medium: 400,  // For cards
  large: 600,   // For drawer/detail view
};

const QUALITY = 80; // WebP quality (0-100)

async function optimizeImages() {
  console.log("🖼️  Starting image optimization...\n");
  
  // Create optimized directory
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTERS_DIR).filter(f => 
    /\.(jpg|jpeg|png|gif)$/i.test(f)
  );

  console.log(`Found ${files.length} images to optimize\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;
  let processed = 0;

  for (const file of files) {
    const inputPath = path.join(POSTERS_DIR, file);
    const baseName = path.parse(file).name;
    const stats = fs.statSync(inputPath);
    totalOriginal += stats.size;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Generate each size variant
      for (const [sizeName, width] of Object.entries(SIZES)) {
        const outputPath = path.join(OPTIMIZED_DIR, `${baseName}-${sizeName}.webp`);
        
        // Only resize if original is larger
        const resizeWidth = metadata.width && metadata.width > width ? width : undefined;
        
        await sharp(inputPath)
          .resize(resizeWidth, undefined, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: QUALITY })
          .toFile(outputPath);

        const optimizedStats = fs.statSync(outputPath);
        totalOptimized += optimizedStats.size;
      }

      // Also create a standard version for fallback
      const standardPath = path.join(OPTIMIZED_DIR, `${baseName}.webp`);
      await sharp(inputPath)
        .resize(600, undefined, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: QUALITY })
        .toFile(standardPath);

      processed++;
      if (processed % 20 === 0) {
        console.log(`  Processed ${processed}/${files.length} images...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error);
    }
  }

  const savings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
  
  console.log("\n✅ Optimization complete!");
  console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Savings: ${savings}%`);
  console.log(`\n📁 Optimized images saved to: ${OPTIMIZED_DIR}`);
}

// Run if called directly
optimizeImages().catch(console.error);
