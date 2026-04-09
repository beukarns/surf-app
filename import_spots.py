#!/usr/bin/env python3
"""
Script d'importation des spots de surf depuis un fichier CSV vers PostgreSQL
"""
import csv
import psycopg2
from psycopg2.extras import execute_values
import os
import re

# Configuration de la base de données
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'surf_app'),
    'user': os.getenv('DB_USER', os.getenv('USER', 'postgres')),  # Utilise l'utilisateur système par défaut
    'password': os.getenv('DB_PASSWORD', ''),  # Pas de mot de passe par défaut pour connexion locale
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

def parse_coordinates(coord_str):
    """
    Convertit les coordonnées du format "43° 22.918' N" en décimal
    """
    if not coord_str or coord_str.strip() == '':
        return None

    # Pattern: degrees° minutes' direction
    pattern = r"(\d+)°\s*(\d+\.?\d*)'?\s*([NSEW])"
    match = re.search(pattern, coord_str)

    if not match:
        return None

    degrees = float(match.group(1))
    minutes = float(match.group(2))
    direction = match.group(3)

    # Conversion en décimal
    decimal = degrees + (minutes / 60)

    # Appliquer le signe selon la direction
    if direction in ['S', 'W']:
        decimal = -decimal

    return round(decimal, 8)

def clean_value(value):
    """
    Nettoie les valeurs du CSV
    """
    if value is None or value.strip() == '' or value.strip().lower() == "don't know":
        return None
    return value.strip()

def parse_float(value):
    """
    Convertit une valeur en float, retourne None si impossible
    """
    try:
        if value is None or value.strip() == '' or value.strip().lower() == "don't know" or value.strip().lower() == "unknown":
            return None
        return float(value.strip())
    except (ValueError, AttributeError):
        return None

def import_spots_from_csv(csv_file_path):
    """
    Importe les spots depuis un fichier CSV vers la base de données
    """
    print(f"Lecture du fichier CSV: {csv_file_path}")

    spots = []
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            spot = {
                'name': clean_value(row['Spot']),
                'continent': clean_value(row['Continent']),
                'country': clean_value(row['Country']),
                'region': clean_value(row['Region']),
                'latitude': parse_coordinates(row['Latitude']),
                'longitude': parse_coordinates(row['Longitude']),
                'datum': clean_value(row['Datum']),
                'precision': clean_value(row['Precision']),
                'access_info': clean_value(row['Access info']),
                'distance': clean_value(row['Distance']),
                'walk': clean_value(row['Walk']),
                'easy_to_find': clean_value(row['Easy to find?']),
                'public_access': clean_value(row['Public access?']),
                'special_access': clean_value(row['Special access']),
                'wave_quality': clean_value(row['Wave quality']),
                'experience': clean_value(row['Experience']),
                'frequency': clean_value(row['Frequency']),
                'type': clean_value(row['Type']),
                'direction': clean_value(row['Direction']),
                'bottom': clean_value(row['Bottom']),
                'power': clean_value(row['Power']),
                'normal_length': clean_value(row['Normal length']),
                'good_day_length': clean_value(row['Good day length']),
                'good_swell_direction': clean_value(row['Good swell direction']),
                'good_wind_direction': clean_value(row['Good wind direction']),
                'swell_size': clean_value(row['Swell size']),
                'best_tide_position': clean_value(row['Best tide position']),
                'best_tide_movement': clean_value(row['Best tide movement']),
                'week_crowd': clean_value(row['Week crowd']),
                'weekend_crowd': clean_value(row['Week-end crowd']),
                'webcam_url': clean_value(row['Webcam url']),
                'description': clean_value(row['Additional Description']),
                'description_2': clean_value(row['Additional Description 2']),
                'rating': int(row['Rating']) if row['Rating'] and row['Rating'].strip() else None,
                'votes': int(row['Votes']) if row['Votes'] and row['Votes'].strip() else None,
                'frequency_score': parse_float(row.get('Frequency_Score')),
                'wave_quality_score': parse_float(row.get('Wave_Quality_Score')),
                'experience_needed_score': parse_float(row.get('Experience_Needed_Score')),
                'swell_min': parse_float(row.get('swell_min')),
                'swell_max': parse_float(row.get('swell_max'))
            }
            spots.append(spot)

    print(f"{len(spots)} spots trouvés dans le CSV")

    # Connexion à la base de données
    print(f"Connexion à la base de données {DB_CONFIG['dbname']}...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Requête d'insertion
    insert_query = """
    INSERT INTO spots (
        name, continent, country, region, latitude, longitude, datum, precision,
        access_info, distance, walk, easy_to_find, public_access, special_access,
        wave_quality, experience, frequency, type, direction, bottom, power,
        normal_length, good_day_length, good_swell_direction, good_wind_direction,
        swell_size, best_tide_position, best_tide_movement, week_crowd, weekend_crowd,
        webcam_url, description, description_2, rating, votes,
        frequency_score, wave_quality_score, experience_needed_score, swell_min, swell_max
    ) VALUES (
        %(name)s, %(continent)s, %(country)s, %(region)s, %(latitude)s, %(longitude)s,
        %(datum)s, %(precision)s, %(access_info)s, %(distance)s, %(walk)s,
        %(easy_to_find)s, %(public_access)s, %(special_access)s, %(wave_quality)s,
        %(experience)s, %(frequency)s, %(type)s, %(direction)s, %(bottom)s, %(power)s,
        %(normal_length)s, %(good_day_length)s, %(good_swell_direction)s,
        %(good_wind_direction)s, %(swell_size)s, %(best_tide_position)s,
        %(best_tide_movement)s, %(week_crowd)s, %(weekend_crowd)s, %(webcam_url)s,
        %(description)s, %(description_2)s, %(rating)s, %(votes)s,
        %(frequency_score)s, %(wave_quality_score)s, %(experience_needed_score)s,
        %(swell_min)s, %(swell_max)s
    )
    """

    # Insertion des données
    print("Insertion des spots dans la base de données...")
    inserted_count = 0
    for spot in spots:
        try:
            cursor.execute(insert_query, spot)
            inserted_count += 1
        except Exception as e:
            print(f"Erreur lors de l'insertion du spot '{spot['name']}': {e}")
            conn.rollback()
            continue

    # Commit des changements
    conn.commit()
    print(f"{inserted_count} spots insérés avec succès!")

    # Fermeture de la connexion
    cursor.close()
    conn.close()

    print("Importation terminée!")

if __name__ == '__main__':
    import sys

    # Accepter le chemin du fichier CSV en argument, sinon utiliser le défaut
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        csv_file = '/Users/benoitriom/Desktop/Dev/infos-spot_Spain_Pais Vasco.csv'

    # Vérifier que le fichier existe
    if not os.path.exists(csv_file):
        print(f"Erreur: Le fichier {csv_file} n'existe pas!")
        exit(1)

    try:
        import_spots_from_csv(csv_file)
    except Exception as e:
        print(f"Erreur lors de l'importation: {e}")
        exit(1)
