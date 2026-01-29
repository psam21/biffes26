#!/usr/bin/env python3
"""
Parse the BIFFes 2026 schedule PDF and update schedule_data.json
This script carefully extracts schedule information from the OCR'd PDF
"""

import fitz
import pytesseract
from PIL import Image
import io
import json
import re
from pathlib import Path
from datetime import datetime

# Load existing data for film matching
with open('src/data/biffes_data.json', 'r') as f:
    biffes_data = json.load(f)

# Create film title lookup (uppercase)
film_lookup = {}
for film in biffes_data['films']:
    film_lookup[film['title'].upper()] = film
    # Also add variations without special chars
    clean_title = re.sub(r'[^\w\s]', '', film['title'].upper())
    film_lookup[clean_title] = film

print(f"Loaded {len(biffes_data['films'])} films from database")

# Load existing schedule
with open('src/data/schedule_data.json', 'r') as f:
    schedule_data = json.load(f)

print(f"Existing schedule has {len(schedule_data['days'])} days")

# Open PDF
pdf_path = "public/schedule/All Days/film schedule curve (29th Jan) - 12 pages (1).pdf"
doc = fitz.open(pdf_path)
print(f"PDF has {len(doc)} pages")

# Extract text from all pages
pages_text = []
for page_num in range(len(doc)):
    page = doc[page_num]
    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
    img = Image.open(io.BytesIO(pix.tobytes('png')))
    text = pytesseract.image_to_string(img)
    pages_text.append(text)
    print(f"  Page {page_num + 1}: {len(text)} chars")

# Parse film entries
# Pattern: FILM TITLE\nDir: DIRECTOR | COUNTRY | YEAR | LANGUAGE | DURATION'

film_pattern = re.compile(
    r'^([A-Z][A-Z0-9\s\-\'\.,:\(\)&]+)\s*\n'
    r'Dir:\s*([^|]+)\s*\|\s*'
    r'([^|]+)\s*\|\s*'
    r'(\d{4})\s*\|\s*'
    r'([^|]+)\s*\|\s*'
    r"(\d+)['\"]?",
    re.MULTILINE
)

# Alternative pattern for inline format
inline_pattern = re.compile(
    r'([A-Z][A-Z0-9\s\-\'\.,:\(\)&]+)\s+'
    r'Dir:\s*([^|]+)\s*\|\s*'
    r'([^|]+)\s*\|\s*'
    r'(\d{4})\s*\|\s*'
    r'([^|]+)\s*\|\s*'
    r"(\d+)['\"]?"
)

# Time slot pattern
time_pattern = re.compile(r'\b(\d{1,2}:\d{2})\b')

# Date pattern
date_pattern = re.compile(r'(\d{2})-([A-Za-z]{3})-(\d{4})')

def parse_date(date_str):
    """Convert date string to ISO format"""
    months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    }
    match = date_pattern.search(date_str)
    if match:
        day, month, year = match.groups()
        return f"{year}-{months.get(month, '01')}-{day}"
    return None

def find_film_in_db(title):
    """Find a film in our database by title"""
    title_upper = title.upper().strip()
    if title_upper in film_lookup:
        return film_lookup[title_upper]
    
    # Try without special chars
    clean = re.sub(r'[^\w\s]', '', title_upper)
    if clean in film_lookup:
        return film_lookup[clean]
    
    # Try partial match
    for db_title, film in film_lookup.items():
        if clean in db_title or db_title in clean:
            return film
    
    return None

# Extract all films mentioned in the PDF
all_found_films = []
for page_num, text in enumerate(pages_text):
    # Find films using pattern
    for match in film_pattern.finditer(text):
        title = match.group(1).strip()
        all_found_films.append({
            'title': title,
            'director': match.group(2).strip(),
            'country': match.group(3).strip(),
            'year': int(match.group(4)),
            'language': match.group(5).strip(),
            'duration': int(match.group(6)),
            'page': page_num + 1,
            'in_db': find_film_in_db(title) is not None
        })

print(f"\nFound {len(all_found_films)} film entries in PDF")

# Count matches vs misses
in_db = sum(1 for f in all_found_films if f['in_db'])
print(f"  Matched to database: {in_db}")
print(f"  Not in database: {len(all_found_films) - in_db}")

# Print films not in database (potential new films or OCR errors)
print("\nFilms not found in database:")
for f in all_found_films:
    if not f['in_db']:
        print(f"  - {f['title']} ({f['year']}, {f['country']})")

# Now let's focus on parsing the schedule structure
# Each page typically represents specific days and venues

print("\n\nSchedule Structure Analysis:")
print("=" * 50)

for page_num, text in enumerate(pages_text):
    # Find dates on this page
    dates = date_pattern.findall(text)
    # Find time slots
    times = time_pattern.findall(text)
    # Find venue mentions
    venues = []
    if 'CINEPOLIS' in text.upper():
        venues.append('cinepolis')
    if 'RAJKUMAR' in text.upper():
        venues.append('rajkumar')
    if 'SUCHITRA' in text.upper() or 'BANASHANKARI' in text.upper():
        venues.append('banashankari')
    if 'OPEN AIR' in text.upper():
        venues.append('openair')
    
    if dates or times:
        print(f"\nPage {page_num + 1}:")
        if dates:
            print(f"  Dates: {[f'{d[0]}-{d[1]}-{d[2]}' for d in dates]}")
        print(f"  Time slots: {list(set(times))[:10]}...")
        print(f"  Venues: {venues}")

print("\n" + "=" * 50)
print("Schedule extraction complete.")
print("\nNote: Due to the curved layout, manual verification is recommended.")
print("The OCR may have alignment issues between time slots and film titles.")
