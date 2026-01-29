#!/usr/bin/env python3
"""
Extract Feb 3-6 schedule from the 29th Jan PDF.
Carefully parse each page with structured time slots.
"""

import json
import re
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
from pathlib import Path

# Load existing films for matching
def load_films():
    films_path = Path(__file__).parent.parent / "src/data/biffes_data.json"
    with open(films_path) as f:
        data = json.load(f)
    return {film['title'].upper().strip(): film for film in data['films']}

def normalize_title(title):
    """Normalize film title for matching"""
    title = title.upper().strip()
    title = re.sub(r'\s+', ' ', title)
    title = re.sub(r'[^\w\s]', '', title)
    return title

def find_film_match(title, films_db):
    """Find best match for a film title"""
    normalized = normalize_title(title)
    
    # Direct match
    for db_title, film in films_db.items():
        if normalize_title(db_title) == normalized:
            return film
    
    # Partial match
    for db_title, film in films_db.items():
        db_norm = normalize_title(db_title)
        if normalized in db_norm or db_norm in normalized:
            return film
    
    return None

# Time slots per screen type (from PDF header)
TIME_SLOTS = {
    "screen": ["10:00", "12:30", "14:50", "17:10", "19:40"],  # screens 1-8
    "forum": ["11:00", "15:00", "18:00"],  # Open Forum
    "openair": ["19:00"],  # Open Air @ 7pm
    "rajkumar": ["10:30", "14:00", "17:30"],  # Rajkumar
    "banashankari": ["10:30", "15:00", "18:00"],  # Banashankari
}

# Page 6: Feb 3 films extracted manually from OCR
FEB_3_FILMS = {
    "cinepolis": {
        "1": [
            ("10:00", "MAHAKAVI", "Baragur Ramachandrappa", "India", 2025, "Kannada", 121),
            ("12:30", "SHAPE OF MOMO", "Tribeny Rai", "India", 2025, "Nepali", 115),
            ("14:50", "INVISIBLE TALES", "Mehdi Fard Ghaderi", "Iran", 2025, "Farsi", 100),
            ("17:10", "THE LOVE THAT REMAINS", "Hlynur Palmason", "Iceland", 2025, "Icelandic", 109),
            ("19:40", "MAN OF MARBLE", "Andrzej Wajda", "Poland", 1977, "Polish", 165),
        ],
        "2": [
            ("10:00", "OUT OF LOVE", "Nathan Ambrosioni", "France", 2025, "French", 111),
            ("12:30", "DRAGONFLY", "Paul Andrew Williams", "United Kingdom", 2025, "English", 98),
            ("14:50", "BEFORE THE BODY", "Lucia Bracelis, Carina Piazza", "Argentina", 2025, "Spanish", 84),
            ("17:10", "THE LAST SUMMER", "Shi Refei", "China", 2025, "Mandarin Chinese", 90),
            ("19:40", "NATIONAL IMMIGRE", "Sidney Sokhona", "France", 1976, "French", 85),
        ],
        "3": [
            ("10:00", "BLUE MOON", "Richard Linklater", "United States", 2025, "English", 100),
            ("12:30", "SLEEPLESS CITY", "Guillermo Galoe", "Spain", 2025, "Spanish", 97),
            ("14:50", "HALF MOON", "Frank Scheffer", "Netherlands", 2025, "English", 92),
            ("17:10", "THE GREAT ARCH", "Stephane Demoustier", "France", 2025, "French", 106),
            ("19:40", "ON THE SILVER GLOBE", "Andrzej Zulawski", "Poland", 1988, "Polish", 166),
        ],
        "4": [
            ("10:00", "COMANDANTE FRITZ", "Pavel Giroud", "Germany", 2025, "German", 107),
            ("12:30", "RUDAALI", "Kalpana Lajmi", "India", 1993, "Hindi", 128),
            ("14:50", "DIVINE COMEDY", "Ali Asgari", "Iran", 2025, "Persian", 96),
            ("17:10", "DJ AHMET", "Georgi M. Unkovski", "Macedonia", 2025, "Turkish", 99),
            ("19:40", "INNOCENT SORCERERS", "Andrzej Wajda", "Poland", 1960, "Polish", 87),
        ],
        "5": [
            ("10:00", "ORENDA", "Pirjo Honkasalo", "Finland", 2025, "Finnish", 119),
            ("12:30", "KURAK", "Rke Dzhumaki", "Kyrgyzstan", 2025, "Kyrgyz", 89),
            ("14:50", "MOHAM", "Fazil Razak", "India", 2025, "Malayalam", 102),
            ("17:10", "GAMAN", "Manoj Madhukar Naiksatam", "India", 2025, "Marathi", 105),
            ("19:40", "BHAKTA KANAKADASA", "Y. R. Swamy", "India", 1960, "Kannada", 127),
        ],
        "6": [
            ("10:00", "SONGS OF FORGOTTEN TREES", "Anuparna Roy", "India", 2025, "Hindi", 80),
            ("12:30", "WHAT DOES THAT NATURE SAY TO YOU", "Hong Sang-Soo", "South Korea", 2025, "Korean", 109),
            ("14:50", "CLOISTERED SISTER", "Ivana Mladenovic", "Romania", 2025, "Romanian", 107),
            ("17:10", "A CONVERSATION WITH JAYANT KAIKINI", None, "India", 2025, "English", 90),
        ],
        "7": [
            ("10:00", "BIDAD", "Soheil Beiraghi", "Iran", 2025, "Iranian", 104),
            ("12:30", "THE DREAMED ONES", "Ruth Beckermann", "Austria", 2016, "German", 89),
            ("14:50", "UNDER THE VOLCANO", "Damian Kocur", "Poland", 2024, "Ukrainian", 105),
            ("17:10", "KHIDKI GAAV", "Sanju Surendran", "India", 2025, "Malayalam", 100),
        ],
        "8": [
            ("10:00", "YOUNG MOTHERS", "Jean-Pierre Dardenne, Luc Dardenne", "France", 2025, "French", 106),
            ("12:30", "LATE SHIFT", "Petra Biondina Volpe", "Switzerland", 2025, "Swiss-German", 92),
            ("14:50", "FATHER MOTHER SISTER BROTHER", "Jim Jarmusch", "USA", 2025, "English", 110),
            ("17:10", "OSLO: A TAIL OF PROMISE", "Isha Pungaliya", "India", 2025, "Hindi", 93),
            ("19:40", "JEVANN", "Akshay Nayak", "India", 2025, "Konkani", 117),
        ],
    },
    "rajkumar": [
        ("10:30", "TUG OF WAR", "Amil Shivji", "Tanzania", 2021, "Swahili", 92),
        ("14:00", "CHIDAMBARAM", "Govindan Aravindan", "India", 1985, "Malayalam", 100),
        ("17:30", "THE NATURE OF INVISIBLE THINGS", "Rafaela Camelo", "Brazil", 2025, "Portuguese", 90),
    ],
    "banashankari": [
        ("10:30", "THE LITTLE GIRL WHO SOLD THE SUN", "Djibril Diop Mambety", "Senegal", 1999, "Wolof", 45),
        ("11:15", "LE FRANC", "Djibril Diop Mambety", "Senegal", 1994, "Wolof", 45),
        ("15:00", "MAHAKAVI", "Baragur Ramachandrappa", "India", 2025, "Kannada", 121),
        ("18:00", "GONDHAL", "Santosh Davakhar", "India", 2025, "Marathi", 120),
    ],
    "openair": [
        ("19:00", "AMMANG HELBEDA", "Anoop Lokkur", "India", 2025, "Kannada", 90),
    ],
}

FEB_4_FILMS = {
    "cinepolis": {
        "1": [
            ("10:00", "MALAVAZHI", "Boban Govindan", "India", 2025, "Malayalam", 91),
            ("12:30", "ELUMALE", "Punit Rangaswamy", "India", 2025, "Kannada", 133),
            ("14:50", "SOUND OF FALLING", "Mascha Schilinski", "Germany", 2025, "German", 149),
            ("17:10", "KRAURYA", "Girish Kasaravalli", "India", 1995, "Kannada", 120),
            ("19:40", "THE PRESIDENT'S CAKE", "Hasan Hadi", "Iraq", 2025, "Arabic", 105),
        ],
        "2": [
            ("10:00", "BAKSHO BONDI", "Tanushree Das, Saumyananda Sahi", "India", 2025, "Bengali", 93),
            ("12:30", "INVISIBLES", "Junna Chif", "Canada", 2025, "English", 94),
            ("14:50", "TALES OF THE WOUNDED LAND", "Abbas Fahdel", "Lebanon", 2025, "Arabic", 120),
            ("17:10", "CEMETERY OF SPLENDOUR", "Apichatpong Weerasethakul", "Thailand", 2015, "Thai", 122),
            ("19:40", "LITTLE TROUBLE GIRLS", "Urska Djukic", "Slovenia", 2025, "Slovenian", 89),
        ],
        "3": [
            ("10:00", "GHARDEV", "HD Jeevan", "India", 2025, "Banjara", 115),
            ("12:30", "BEFORE THE BODY", "Lucia Bracelis, Carina Piazza", "Argentina", 2025, "Spanish", 84),
            ("14:50", "CALLE MALAGA", "Maryam Touzani", "Spain", 2025, "Spanish", 116),
            ("17:10", "ACCIDENT", "Shankar Nag", "India", 1984, "Kannada", 107),
            ("19:40", "SHANKAR GURU", "V. Somasekhar", "India", 1978, "Kannada", 179),
        ],
        "4": [
            ("10:00", "KY NAM INN", "Leon Le", "Vietnam", 2025, "Vietnamese", 140),
            ("12:30", "NO OTHER CHOICE", "Park Chan-Wook", "South Korea", 2025, "Korean", 139),
            ("14:50", "LAPTEIN", "Ravi Shankar Kaushik", "India", 2025, "Hindi", 86),
            ("17:10", "DO BIGHA ZAMIN", "Bimal Roy", "India", 1953, "Hindi", 131),
            ("19:40", "SANDHYA RAAGA", "A.C Narasimha Murthy", "India", 1966, "Kannada", 153),
        ],
        "5": [
            ("10:00", "VERTICAL FILMMAKING DISCUSSION", None, "India", 2025, "English", 90),
            ("14:50", "THAAY! SAHEBA", "Girish Kasaravalli", "India", 1997, "Kannada", 117),
            ("17:10", "PADUVARAHALLI PANDAVARU", "Puttanna Kanagal", "India", 1978, "Kannada", 146),
            ("19:40", "AMARA SHILPI JAKANACHARI", "B. S. Ranga", "India", 1964, "Kannada", 126),
        ],
        "6": [
            ("14:50", "APICHATPONG WEERASETHAKUL MASTERCLASS", None, "Thailand", 2025, "English", 90),
        ],
    },
    "rajkumar": [
        ("10:30", "THE LITTLE GIRL WHO SOLD THE SUN", "Djibril Diop Mambety", "Senegal", 1999, "Wolof", 45),
        ("11:15", "LE FRANC", "Djibril Diop Mambety", "Senegal", 1994, "Wolof", 45),
        ("14:00", "MAHAKAVI", "Baragur Ramachandrappa", "India", 2025, "Kannada", 121),
        ("17:30", "GONDHAL", "Santosh Davakhar", "India", 2025, "Marathi", 120),
    ],
    "banashankari": [
        ("10:30", "AMMANG HELBEDA", "Anoop Lokkur", "India", 2025, "Kannada", 90),
        ("15:00", "KRAURYA", "Girish Kasaravalli", "India", 1995, "Kannada", 120),
        ("18:00", "BHOOTHALAM", "Sreekanth Pangapattu", "India", 2025, "Malayalam", 85),
    ],
    "openair": [
        ("19:00", "APICHATPONG RETROSPECTIVE", "Apichatpong Weerasethakul", "Thailand", 2010, "Thai", 113),
    ],
}

FEB_5_FILMS = {
    "cinepolis": {
        "1": [
            ("10:00", "MIRCH MASALA", "Ketan Mehta", "India", 1987, "Hindi", 128),
            ("12:30", "A LIGHT THAT NEVER GOES OUT", "Lauri Matti Parppei", "Norway", 2025, "Finnish", 108),
            ("14:50", "LOVE ME TENDER", "Anna Cazenave Cambet", "France", 2025, "French", 134),
            ("17:10", "ON THE SILVER GLOBE", "Andrzej Zulawski", "Poland", 1988, "Polish", 166),
            ("19:40", "JEEVANA CHAITRA", "Dorai-Bhagavan", "India", 1992, "Kannada", 157),
        ],
        "2": [
            ("10:00", "RENOVATION", "Gabriele Urbonante", "Lithuania", 2025, "Lithuanian", 95),
            ("12:30", "SUNDAYS", "Alauda Ruiz de Azua", "Spain", 2025, "Spanish", 117),
            ("14:50", "MORTICIAN", "Abdolreza Kahani", "Canada", 2025, "Persian", 94),
            ("17:10", "DOORA THEERA YAANA", "Mansore", "India", 2025, "Kannada", 131),
            ("19:40", "FRANZ", "Agnieszka Holland", "Poland", 2025, "Czech", 127),
        ],
        "3": [
            ("10:00", "BEFORE THE BODY", "Lucia Bracelis, Carina Piazza", "Argentina", 2025, "Spanish", 84),
            ("12:30", "EIRAWY", "Sarah Goher", "Egypt", 2025, "Arabic", 95),
            ("14:50", "K POPPER", "Ebrahim Amini", "Iran", 2025, "Farsi", 83),
            ("17:10", "VAGHACHIPANI", "Natesh Hegde", "India", 2025, "Kannada", 87),
            ("19:40", "THEATRE", "Nishanth Kalidindi", "India", 2025, "Tamil", 93),
        ],
        "4": [
            ("10:00", "FOLLIES", "Eric K", "Canada", 2025, "French", 104),
            ("12:30", "A USEFUL GHOST", "Ratchapoom Boonbunchachoke", "Thailand", 2025, "Thai", 130),
            ("14:50", "WHAT DOES THAT NATURE SAY TO YOU", "Hong Sang-Soo", "South Korea", 2025, "Korean", 109),
            ("17:10", "JAI", "Roopesh Shetty", "India", 2025, "Tulu", 165),
            ("19:40", "THE PROMISED LAND", "Andrzej Wajda", "Poland", 1975, "Polish", 180),
        ],
        "5": [
            ("10:00", "BEACHCOMBER", "Aristotelis Maragkos", "Greece", 2025, "Greek", 92),
            ("12:30", "LOST LAND", "Akio Fujimoto", "Japan", 2025, "Rohingya", 99),
            ("14:50", "NAM SAALI", "Aneel Kumar", "India", 2025, "Kannada", 90),
            ("17:10", "AMRUM", "Fatih Akin", "Germany", 2025, "German", 93),
            ("19:40", "BAL POUSSIERE", "Henri Duparc", "Ivory Coast", 1989, "French", 93),
        ],
        "6": [
            ("10:00", "CARAVAN", "Zuzana Kirchnerova-Spidlova", "Czechia", 2025, "Czech", 102),
            ("12:30", "IT WAS JUST AN ACCIDENT", "Jafar Panahi", "Iran", 2025, "Iranian", 106),
            ("14:50", "FIUME O MORTE!", "Igor Bezinovic", "Croatia", 2025, "Croatian", 112),
            ("17:10", "SARKEET", "Thamar Mon Karuvanta Valappil", "India", 2025, "Malayalam", 125),
            ("19:40", "DR. RAJKUMAR HERO OF SUBALTERNS DISCUSSION", None, "India", 2025, "English", 90),
        ],
        "7": [
            ("10:00", "SABAR BONDA", "Rohan Parashuram Kanawade", "India", 2025, "Marathi", 117),
            ("12:30", "FULL PLATE", "Tannishtha Chatterjee", "India", 2025, "Hindi", 109),
            ("14:50", "SENTIMENTAL VALUE", "Joachim Trier", "Norway", 2025, "Norwegian", 135),
            ("17:10", "AMOEBA", "Tan Siyou", "Singapore", 2025, "English", 98),
            ("19:40", "REPUBLIC OF PIPOLIPINAS", "Renei Dimla", "Philippines", 2025, "Tagalog", 105),
        ],
        "8": [
            ("10:00", "CASE 137", "Dominik Moll", "France", 2025, "French", 122),
            ("12:30", "SILENT FRIEND", "Ildiko Enyedi", "Germany", 2025, "German", 147),
            ("14:50", "THE DISAPPEARANCE OF JOSEF MENGELE", "Kirill Serebrennikov", "Germany", 2025, "German", 135),
            ("17:10", "THE PORTUGUESE HOUSE", "Avelina Prat", "Spain", 2025, "Spanish", 114),
            ("19:40", "DRY LEAF", "Alexandre Koberidze", "Georgia", 2025, "Georgian", 186),
        ],
    },
    "rajkumar": [
        ("10:30", "NADUBETTU APPANNA", "Anupama Sharadhi", "India", 2025, "Are Bhashe", 92),
        ("14:00", "BHUMIKA", "Shyam Benegal", "India", 1977, "Hindi", 142),
        ("17:30", "JEEV", "Ravindra Manik Jadhav", "India", 2025, "Marathi", 103),
    ],
    "banashankari": [
        ("10:30", "HAKKIGHAGI", "Garghee Karehaiklu", "India", 2025, "Kannada", 122),
        ("15:00", "KANASEMBA KUDUREYANERI", "Girish Kasaravalli", "India", 2010, "Kannada", 104),
        ("18:00", "TWENTY YEARS OF AFRICAN CINEMA", "Ferid Boughedir", "Tunisia", 1983, "French", 95),
    ],
    "openair": [
        ("19:00", "RIVERSTONE", "Lalith Rathnayake", "Sri Lanka", 2025, "Sinhala", 120),
    ],
    "forum": [
        ("11:00", "FIPRESCI AT 100 PANEL DISCUSSION", None, "India", 2025, "English", 120),
        ("15:00", "SATYA HARISHCHANDRA", "Trupthulaaan", "India", 2025, "Kannada", 90),
        ("18:00", "WOMEN SHAPING CINEMA PANEL", None, "India", 2025, "English", 90),
    ],
}

FEB_6_FILMS = {
    "cinepolis": {
        "1": [
            ("10:00", "MY UNCLE JENS", "Brwa Vahabpour", "Norway", 2025, "Norwegian", 98),
            ("12:30", "WIND, TALK TO ME", "Stefan Dordevic", "Serbia", 2025, "Serbian", 100),
            ("14:50", "GOD WILL NOT HELP", "Hana Jusic", "Croatia", 2025, "Croatian", 137),
            ("17:10", "CHOPIN, A SONATA IN PARIS", "Michal Kwiecinski", "Poland", 2025, "Polish", 133),
            ("19:40", "MAN OF MARBLE", "Andrzej Wajda", "Poland", 1977, "Polish", 165),
        ],
        "2": [
            ("10:00", "INVISIBLES", "Junna Chif", "Canada", 2025, "English", 94),
            ("12:30", "MAYSOON", "Nancy Biniadaki", "Germany", 2025, "German", 120),
            ("14:50", "FATHER", "Tereza Nvotova", "Slovakia", 2025, "Slovak", 103),
            ("17:10", "THE GREAT ARCH", "Stephane Demoustier", "France", 2025, "French", 106),
            ("19:40", "AFTERIMAGE", "Andrzej Wajda", "Poland", 2016, "Polish", 98),
        ],
        "3": [
            ("10:00", "REEDLAND", "Sven Bresser", "Netherlands", 2025, "Dutch", 111),
            ("12:30", "HUMAN RESOURCE", "Nawapol Thamrongrattanarit", "Thailand", 2025, "Thai", 122),
            ("14:50", "MARK", "Vijay Kartikeyaa", "India", 2025, "Kannada", 144),
            ("17:10", "TUG OF WAR", "Amil Shivji", "Tanzania", 2021, "Swahili", 92),
            ("19:40", "THE HOURGLASS SANATORIUM", "Wojciech Jerzy Has", "Poland", 1973, "Polish", 125),
        ],
        "4": [
            ("10:00", "DRAGONFLY", "Paul Andrew Williams", "United Kingdom", 2025, "English", 98),
            ("12:30", "COMANDANTE FRITZ", "Pavel Giroud", "Germany", 2025, "German", 107),
            ("14:50", "SECRET OF A MOUNTAIN SERPENT", "Nidhi Saxena", "India", 2025, "Hindi", 108),
            ("17:10", "CLEO FROM 5 TO 7", "Agnes Varda", "France", 1962, "French", 90),
            ("19:40", "OUT OF LOVE", "Nathan Ambrosioni", "France", 2025, "French", 111),
        ],
        "5": [
            ("10:00", "DIVINE COMEDY", "Ali Asgari", "Iran", 2025, "Persian", 96),
            ("12:30", "GONDHAL", "Santosh Davakhar", "India", 2025, "Marathi", 120),
            ("14:50", "KIDKI GAAV", "Sanju Surendran", "India", 2025, "Malayalam", 100),
            ("17:10", "WHITE SNOW", "Praveen Morchhale", "India", 2025, "Urdu", 82),
            ("19:40", "AMMANG HELBEDA", "Anoop Lokkur", "India", 2025, "Kannada", 90),
        ],
        "6": [
            ("10:00", "KRAURYA", "Girish Kasaravalli", "India", 1995, "Kannada", 120),
            ("12:30", "AMOEBA", "Tan Siyou", "Singapore", 2025, "English", 98),
            ("14:50", "SKIN OF YOUTH", "Ash Mayfair", "Vietnam", 2025, "Vietnamese", 122),
            ("17:10", "BILI CHUKKI HALLI HAKKI", "Mahesh Chandregowda", "India", 2025, "Kannada", 138),
            ("19:40", "SHANKAR GURU", "V. Somasekhar", "India", 1978, "Kannada", 179),
        ],
        "7": [
            ("10:00", "THE MASTERMIND", "Kelly Reichardt", "USA", 2025, "English", 110),
            ("12:30", "THE FIN", "Syeyoung Park", "South Korea", 2025, "Korean", 85),
            ("14:50", "GANARAAG", "Dip Bhuyan", "India", 2025, "Assamese", 102),
            ("17:10", "YOUNG MOTHERS", "Jean-Pierre Dardenne, Luc Dardenne", "France", 2025, "French", 106),
            ("19:40", "LITTLE TROUBLE GIRLS", "Urska Djukic", "Slovenia", 2025, "Slovenian", 89),
        ],
        "8": [
            ("10:00", "GOLEM", "Piotr Szulkin", "Poland", 1979, "Polish", 93),
            ("12:30", "UMMATHAT - THE RHYTHM OF KODAVA", "Prakash Kariappa Kottukathira", "India", 2025, "Kodava", 49),
            ("14:50", "ANMOL - LOVINGLY OURS", "Priyankka Saha", "India", 2025, "Hindi", 99),
        ],
    },
    "rajkumar": [
        ("10:30", "GHARDEV", "HD Jeevan", "India", 2025, "Banjara", 115),
        ("14:00", "HEMAVATHI", "S. Siddalingaiah", "India", 1977, "Kannada", 140),
    ],
    "banashankari": [
        ("10:30", "SERENG", "NPK", "India", 2025, "Nagpuri", 120),
        ("15:00", "THE TABLET", "Aravind Siva", "India", 2025, "Tamil", 79),
        ("18:00", "PHOUOIBEE", "Rakesh Moirangthem", "India", 2025, "Manipuri", 89),
    ],
    "openair": [
        ("19:00", "MEMORIA", "Apichatpong Weerasethakul", "Thailand", 2021, "English", 136),
    ],
}

# Rest of Feb 6 Cinepolis screenings
FEB_6_FILMS["cinepolis"]["1"].extend([])

def convert_to_schedule_format(day_films, date, day_number, label):
    """Convert extracted films to schedule_data.json format"""
    screenings = []
    
    # Cinepolis screens
    if "cinepolis" in day_films:
        for screen, films in day_films["cinepolis"].items():
            showings = []
            for film_data in films:
                time, film, director, country, year, language, duration = film_data
                showings.append({
                    "time": time,
                    "film": film,
                    "director": director,
                    "country": country,
                    "year": year,
                    "language": language,
                    "duration": duration
                })
            screenings.append({
                "venue": "cinepolis",
                "screen": screen,
                "showings": showings
            })
    
    # Other venues
    for venue in ["rajkumar", "banashankari", "openair", "forum"]:
        if venue in day_films:
            showings = []
            for film_data in day_films[venue]:
                time, film, director, country, year, language, duration = film_data
                showings.append({
                    "time": time,
                    "film": film,
                    "director": director,
                    "country": country,
                    "year": year,
                    "language": language,
                    "duration": duration
                })
            if showings:
                screenings.append({
                    "venue": venue if venue != "forum" else "cinepolis",
                    "screen": "Open Forum" if venue == "forum" else "1",
                    "showings": showings
                })
    
    return {
        "date": date,
        "dayNumber": day_number,
        "label": label,
        "screenings": screenings
    }

def main():
    # Load existing schedule
    schedule_path = Path(__file__).parent.parent / "src/data/schedule_data.json"
    with open(schedule_path) as f:
        schedule_data = json.load(f)
    
    films_db = load_films()
    
    # Create new days
    new_days = [
        convert_to_schedule_format(FEB_3_FILMS, "2026-02-03", 5, "Day 5 - Tuesday"),
        convert_to_schedule_format(FEB_4_FILMS, "2026-02-04", 6, "Day 6 - Wednesday"),
        convert_to_schedule_format(FEB_5_FILMS, "2026-02-05", 7, "Day 7 - Thursday"),
        convert_to_schedule_format(FEB_6_FILMS, "2026-02-06", 8, "Day 8 - Friday"),
    ]
    
    # Add to schedule
    schedule_data["days"].extend(new_days)
    schedule_data["schedule"]["lastUpdated"] = "2026-01-29T12:00:00.000Z"
    schedule_data["schedule"]["source"] = "film schedule curve (29th Jan) - 12 pages.pdf"
    
    # Count films and verify matches
    total_showings = 0
    matched = 0
    unmatched = []
    
    for day in new_days:
        for screening in day["screenings"]:
            for showing in screening["showings"]:
                total_showings += 1
                film_title = showing["film"]
                if find_film_match(film_title, films_db):
                    matched += 1
                else:
                    unmatched.append(film_title)
    
    print(f"Total new showings: {total_showings}")
    print(f"Matched to database: {matched}")
    print(f"Not in database: {len(unmatched)}")
    
    if unmatched:
        print("\nFilms not in database (may be classics/retrospectives/events):")
        for title in sorted(set(unmatched)):
            print(f"  - {title}")
    
    # Save updated schedule
    with open(schedule_path, 'w') as f:
        json.dump(schedule_data, f, indent=2)
    
    print(f"\n✓ Updated {schedule_path}")
    print(f"  Total days: {len(schedule_data['days'])}")

if __name__ == "__main__":
    main()
