import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

# Ajouter le dossier parent au path pour importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
from models import Base, Spot

def parse_coordinate(coord_str):
    """Parse une coordonnée de format '43° 31.591' N' vers décimal"""
    if not coord_str or pd.isna(coord_str):
        return None

    try:
        # Enlever les espaces
        coord_str = coord_str.strip()

        # Extraire la direction (N, S, E, W)
        direction = coord_str[-1] if coord_str[-1] in ['N', 'S', 'E', 'W'] else None

        # Enlever la direction
        coord_str = coord_str[:-1].strip()

        # Séparer degrés et minutes
        parts = coord_str.split('°')
        if len(parts) != 2:
            return None

        degrees = float(parts[0])
        minutes = float(parts[1].replace("'", "").strip())

        # Convertir en décimal
        decimal = degrees + (minutes / 60.0)

        # Appliquer le signe selon la direction
        if direction in ['S', 'W']:
            decimal = -decimal

        return round(decimal, 8)
    except:
        return None

def import_csv_to_db(csv_file_path):
    """Importer le CSV dans la base de données"""

    # Créer les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)

    # Lire le CSV
    print(f"Lecture du fichier CSV: {csv_file_path}")
    df = pd.read_csv(csv_file_path)

    print(f"Nombre de spots trouvés: {len(df)}")

    # Créer une session
    db = SessionLocal()

    try:
        # Vider la table spots (attention en production !)
        db.query(Spot).delete()
        db.commit()
        print("Table spots vidée")

        # Mapper les colonnes CSV aux colonnes de la base
        column_mapping = {
            'Continent': 'continent',
            'Country': 'country',
            'Region': 'region',
            'Spot': 'name',
            'Latitude': 'latitude',
            'Longitude': 'longitude',
            'Datum': 'datum',
            'Precision': 'precision',
            'Access info': 'access_info',
            'Distance': 'distance',
            'Walk': 'walk',
            'Easy to find?': 'easy_to_find',
            'Public access?': 'public_access',
            'Special access': 'special_access',
            'Wave quality': 'wave_quality',
            'Experience': 'experience',
            'Frequency': 'frequency',
            'Type': 'type',
            'Direction': 'direction',
            'Bottom': 'bottom',
            'Power': 'power',
            'Normal length': 'normal_length',
            'Good day length': 'good_day_length',
            'Good swell direction': 'good_swell_direction',
            'Good wind direction': 'good_wind_direction',
            'Swell size': 'swell_size',
            'Best tide position': 'best_tide_position',
            'Best tide movement': 'best_tide_movement',
            'Week crowd': 'week_crowd',
            'Week-end crowd': 'weekend_crowd',
            'Webcam url': 'webcam_url',
            'Additional Description': 'description',
            'Additional Description 2': 'description_2',
            'Rating': 'rating',
            'Votes': 'votes'
        }

        # Insérer chaque ligne
        count = 0
        for _, row in df.iterrows():
            spot_data = {}

            for csv_col, db_col in column_mapping.items():
                value = row.get(csv_col)

                # Gérer les valeurs vides
                if pd.isna(value) or value == '':
                    spot_data[db_col] = None
                elif db_col == 'latitude':
                    spot_data[db_col] = parse_coordinate(value)
                elif db_col == 'longitude':
                    spot_data[db_col] = parse_coordinate(value)
                elif db_col in ['rating', 'votes']:
                    try:
                        spot_data[db_col] = int(value)
                    except:
                        spot_data[db_col] = None
                else:
                    spot_data[db_col] = str(value)

            # Créer le spot
            spot = Spot(**spot_data)
            db.add(spot)
            count += 1

            # Commit tous les 100 spots
            if count % 100 == 0:
                db.commit()
                print(f"{count} spots importés...")

        # Commit final
        db.commit()
        print(f"\n✅ Import terminé ! {count} spots importés avec succès.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erreur lors de l'import: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_csv.py <chemin_vers_fichier.csv>")
        sys.exit(1)

    csv_path = sys.argv[1]

    if not os.path.exists(csv_path):
        print(f"Erreur: Le fichier {csv_path} n'existe pas")
        sys.exit(1)

    import_csv_to_db(csv_path)
