import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
from models import Base, Spot


def parse_coordinate(coord_str):
    if not coord_str or pd.isna(coord_str):
        return None
    try:
        coord_str = str(coord_str).strip()
        direction = coord_str[-1] if coord_str[-1] in ['N', 'S', 'E', 'W'] else None
        coord_str = coord_str[:-1].strip()
        parts = coord_str.split('°')
        if len(parts) != 2:
            return None
        degrees = float(parts[0])
        minutes = float(parts[1].replace("'", "").strip())
        decimal = degrees + (minutes / 60.0)
        if direction in ['S', 'W']:
            decimal = -decimal
        return round(decimal, 8)
    except:
        return None


def parse_float(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        v = str(value).strip()
        if v.lower() in ('', 'nan', 'unknown', 'none', 'n/a'):
            return None
        return float(v)
    except:
        return None


def parse_int(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        return int(float(value))
    except:
        return None


def parse_str(value):
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except:
        pass
    s = str(value).strip()
    return s if s else None


def import_csv_to_db(csv_file_path):
    Base.metadata.create_all(bind=engine)

    print(f"Lecture du fichier CSV: {csv_file_path}")
    df = pd.read_csv(csv_file_path, dtype=str)
    print(f"Nombre de spots dans le CSV: {len(df)}")

    db = SessionLocal()

    try:
        db.query(Spot).delete()
        db.commit()
        print("Table spots vidée")

        count = 0
        skipped = 0

        for idx, row in df.iterrows():
            try:
                spot = Spot(
                    continent=parse_str(row.get('Continent')),
                    country=parse_str(row.get('Country')),
                    region=parse_str(row.get('Region')),
                    name=parse_str(row.get('Spot')),
                    latitude=parse_coordinate(row.get('Latitude')),
                    longitude=parse_coordinate(row.get('Longitude')),
                    datum=parse_str(row.get('Datum')),
                    precision=parse_str(row.get('Precision')),
                    access_info=parse_str(row.get('Access info')),
                    distance=parse_str(row.get('Distance')),
                    walk=parse_str(row.get('Walk')),
                    easy_to_find=parse_str(row.get('Easy to find?')),
                    public_access=parse_str(row.get('Public access?')),
                    special_access=parse_str(row.get('Special access')),
                    wave_quality=parse_str(row.get('Wave quality')),
                    experience=parse_str(row.get('Experience')),
                    frequency=parse_str(row.get('Frequency')),
                    type=parse_str(row.get('Type')),
                    direction=parse_str(row.get('Direction')),
                    bottom=parse_str(row.get('Bottom')),
                    power=parse_str(row.get('Power')),
                    normal_length=parse_str(row.get('Normal length')),
                    good_day_length=parse_str(row.get('Good day length')),
                    good_swell_direction=parse_str(row.get('Good swell direction')),
                    good_wind_direction=parse_str(row.get('Good wind direction')),
                    swell_size=parse_str(row.get('Swell size')),
                    best_tide_position=parse_str(row.get('Best tide position')),
                    best_tide_movement=parse_str(row.get('Best tide movement')),
                    week_crowd=parse_str(row.get('Week crowd')),
                    weekend_crowd=parse_str(row.get('Week-end crowd')),
                    webcam_url=parse_str(row.get('Webcam url')),
                    description=parse_str(row.get('Additional Description')),
                    description_2=parse_str(row.get('Additional Description 2')),
                    rating=parse_int(row.get('Rating')),
                    votes=parse_int(row.get('Votes')),
                    frequency_score=parse_float(row.get('Frequency_Score')),
                    wave_quality_score=parse_float(row.get('Wave_Quality_Score')),
                    experience_needed_score=parse_float(row.get('Experience_Needed_Score')),
                    swell_min=parse_float(row.get('swell_min')),
                    swell_max=parse_float(row.get('swell_max')),
                )
                db.add(spot)
                count += 1

                if count % 200 == 0:
                    db.commit()
                    print(f"{count} spots importés...")

            except Exception as e:
                skipped += 1
                print(f"  Ligne {idx} ignorée: {e}")
                db.rollback()

        db.commit()
        print(f"\n✅ Import terminé ! {count} spots importés, {skipped} ignorés.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erreur fatale: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_csv.py <fichier.csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"Erreur: {csv_path} introuvable")
        sys.exit(1)

    import_csv_to_db(csv_path)
