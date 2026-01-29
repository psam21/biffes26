#!/bin/bash
#
# BIFFes Schedule Pipeline
# Converts PDF schedule to OCR text files, then generates schedule_data.json
#
# Usage:
#   ./scripts/pipeline.sh                    # Run full pipeline
#   ./scripts/pipeline.sh --ocr-only         # Only regenerate OCR from PDF
#   ./scripts/pipeline.sh --json-only        # Only regenerate JSON from OCR
#   ./scripts/pipeline.sh --validate         # Validate OCR extraction vs authoritative
#
# Prerequisites:
#   - pdftoppm (from poppler-utils): brew install poppler / apt install poppler-utils
#   - tesseract: brew install tesseract / apt install tesseract-ocr
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PDF_FILE="$PROJECT_DIR/public/film schedule ver4.pdf"
SCHEDULE_DIR="$PROJECT_DIR/public/schedule"
TMP_DIR="/tmp/biffes_schedule"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎬 BIFFes Schedule Pipeline${NC}"
echo "================================"

# Parse arguments
OCR_ONLY=false
JSON_ONLY=false
VALIDATE=false

for arg in "$@"; do
  case $arg in
    --ocr-only)
      OCR_ONLY=true
      ;;
    --json-only)
      JSON_ONLY=true
      ;;
    --validate)
      VALIDATE=true
      ;;
  esac
done

# Check prerequisites
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ $1 is required but not installed.${NC}"
    echo "   Install with: $2"
    return 1
  fi
  return 0
}

if [ "$JSON_ONLY" = false ]; then
  echo -e "\n${YELLOW}Checking prerequisites...${NC}"
  check_command "pdftoppm" "brew install poppler (macOS) or apt install poppler-utils (Linux)"
  check_command "tesseract" "brew install tesseract (macOS) or apt install tesseract-ocr (Linux)"
  echo -e "${GREEN}✓ All prerequisites installed${NC}"
fi

# Step 1: Convert PDF to images
if [ "$JSON_ONLY" = false ]; then
  echo -e "\n${YELLOW}Step 1: Converting PDF to images...${NC}"
  
  if [ ! -f "$PDF_FILE" ]; then
    echo -e "${RED}❌ PDF file not found: $PDF_FILE${NC}"
    exit 1
  fi
  
  # Create temp directory
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
  
  # Convert PDF to PNG images (one per page)
  pdftoppm -png -r 300 "$PDF_FILE" "$TMP_DIR/page"
  
  PAGE_COUNT=$(ls -1 "$TMP_DIR"/page-*.png 2>/dev/null | wc -l)
  echo -e "${GREEN}✓ Created $PAGE_COUNT page images${NC}"
fi

# Step 2: OCR images to text
if [ "$JSON_ONLY" = false ]; then
  echo -e "\n${YELLOW}Step 2: Running OCR on images...${NC}"
  
  # Ensure schedule directory exists
  mkdir -p "$SCHEDULE_DIR"
  
  # Process each page
  for img in "$TMP_DIR"/page-*.png; do
    if [ -f "$img" ]; then
      # Extract page number (page-1.png -> 1)
      page_num=$(basename "$img" .png | sed 's/page-//')
      # Map to output file (_0.txt = page 5, _1.txt = page 4, etc)
      # Page 1 = cover (_4.txt), Page 2 = Day 1 (_3.txt), etc.
      case $page_num in
        1) output_num=4 ;;  # Cover
        2) output_num=3 ;;  # Day 1
        3) output_num=2 ;;  # Day 2
        4) output_num=1 ;;  # Day 3
        5) output_num=0 ;;  # Day 4
        *) output_num=$((5 - page_num)) ;;
      esac
      
      output_file="$SCHEDULE_DIR/_${output_num}.txt"
      echo "   Processing page $page_num → _${output_num}.txt"
      tesseract "$img" "$SCHEDULE_DIR/_${output_num}" -l eng --psm 6 2>/dev/null
    fi
  done
  
  echo -e "${GREEN}✓ OCR complete${NC}"
  
  # Cleanup temp files
  rm -rf "$TMP_DIR"
fi

# Step 3: Generate JSON from OCR
if [ "$OCR_ONLY" = false ]; then
  echo -e "\n${YELLOW}Step 3: Generating schedule JSON...${NC}"
  
  cd "$PROJECT_DIR"
  
  if [ "$VALIDATE" = true ]; then
    node scripts/extract-schedule.js --ocr --validate
  else
    # Use authoritative data by default
    node scripts/extract-schedule.js
  fi
fi

echo -e "\n${GREEN}✅ Pipeline complete!${NC}"
echo -e "   Schedule data: src/data/schedule_data.json"
echo -e "   OCR files: public/schedule/_*.txt"
