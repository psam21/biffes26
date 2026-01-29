#!/usr/bin/env python3
"""
Merge all extracted daily schedule files into schedule_data.json
"""

import json
from pathlib import Path

def main():
    base_dir = Path(__file__).parent
    extracted_dir = base_dir / "schedule-extracted"
    output_file = base_dir.parent / "src/data/schedule_data.json"
    
    # Load existing schedule structure for venues info
    with open(output_file) as f:
        existing = json.load(f)
    
    # Load all daily files
    days = []
    for day_num in range(1, 9):
        day_file = extracted_dir / f"day{day_num}-{'jan30' if day_num == 1 else 'jan31' if day_num == 2 else 'feb0' + str(day_num - 2)}.json"
        if day_file.exists():
            with open(day_file) as f:
                day_data = json.load(f)
                days.append(day_data)
                print(f"Loaded {day_file.name}: {len(day_data['screenings'])} screenings")
    
    # Create new schedule data
    schedule_data = {
        "schedule": {
            "lastUpdated": "2026-01-30T12:00:00.000Z",
            "source": "film schedule curve (29th Jan) - 12 pages.pdf (Image extracted)",
            "note": "Schedule extracted directly from PDF images. Verified against official schedule.",
            "venues": existing["schedule"]["venues"]
        },
        "days": days
    }
    
    # Count totals
    total_showings = 0
    for day in days:
        for screening in day["screenings"]:
            total_showings += len(screening["showings"])
    
    print(f"\nTotal days: {len(days)}")
    print(f"Total showings: {total_showings}")
    
    # Save
    with open(output_file, 'w') as f:
        json.dump(schedule_data, f, indent=2)
    
    print(f"\n✓ Updated {output_file}")

if __name__ == "__main__":
    main()
