#!/bin/bash

# Script de setup complet de la base de données
# Date: 2026-01-12

set -e  # Arrêter en cas d'erreur

echo "=== Setup Base de Données Surf App ==="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="surf_app"
CSV_FILE="/Users/benoitriom/Desktop/Dev/infos-spot_all_GRANDMASTER.csv"

echo "${YELLOW}Étape 1: Vérification de PostgreSQL${NC}"
if ! command -v psql &> /dev/null; then
    echo "${RED}PostgreSQL n'est pas installé ou pas dans le PATH${NC}"
    echo "Pour installer PostgreSQL sur Mac:"
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    echo ""
    echo "Ajoutez ensuite PostgreSQL au PATH:"
    echo "  echo 'export PATH=\"/opt/homebrew/opt/postgresql@15/bin:\$PATH\"' >> ~/.zshrc"
    echo "  source ~/.zshrc"
    exit 1
fi
echo "${GREEN}✓ PostgreSQL est installé${NC}"
echo ""

echo "${YELLOW}Étape 2: Vérification de la base de données${NC}"
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "${YELLOW}La base de données '$DB_NAME' existe déjà${NC}"
    read -p "Voulez-vous la supprimer et la recréer? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Suppression de la base de données..."
        dropdb "$DB_NAME" 2>/dev/null || true
        echo "${GREEN}✓ Base de données supprimée${NC}"
    else
        echo "Conservation de la base existante"
        echo "Application de la migration..."
        psql "$DB_NAME" < migration_add_new_columns.sql
        echo "${GREEN}✓ Migration appliquée${NC}"
        echo ""
        echo "${YELLOW}Étape 3: Importation des données${NC}"
        read -p "Voulez-vous vider la table spots avant l'import? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            psql "$DB_NAME" -c "TRUNCATE TABLE spots CASCADE;"
            echo "${GREEN}✓ Table spots vidée${NC}"
        fi
        echo "Importation du CSV..."
        python3 import_spots.py "$CSV_FILE"
        echo ""
        echo "${GREEN}✓ Setup terminé !${NC}"
        exit 0
    fi
fi

echo "Création de la base de données '$DB_NAME'..."
createdb "$DB_NAME"
echo "${GREEN}✓ Base de données créée${NC}"
echo ""

echo "${YELLOW}Étape 3: Création des tables${NC}"
psql "$DB_NAME" < database_schema.sql
echo "${GREEN}✓ Tables créées${NC}"
echo ""

echo "${YELLOW}Étape 4: Vérification du fichier CSV${NC}"
if [ ! -f "$CSV_FILE" ]; then
    echo "${RED}Erreur: Le fichier CSV n'existe pas: $CSV_FILE${NC}"
    exit 1
fi

# Compter les lignes du CSV (moins 1 pour le header)
CSV_LINES=$(wc -l < "$CSV_FILE")
CSV_SPOTS=$((CSV_LINES - 1))
echo "${GREEN}✓ Fichier CSV trouvé: $CSV_SPOTS spots à importer${NC}"
echo ""

echo "${YELLOW}Étape 5: Importation des données${NC}"
python3 import_spots.py "$CSV_FILE"
echo ""

echo "${YELLOW}Étape 6: Vérification des données importées${NC}"
echo ""
echo "Spots par continent:"
psql "$DB_NAME" -c "SELECT continent, COUNT(*) as nb_spots FROM spots GROUP BY continent ORDER BY nb_spots DESC;"
echo ""

echo "Exemples de spots avec les nouveaux champs:"
psql "$DB_NAME" -c "SELECT name, wave_quality_score, frequency_score, swell_min, swell_max FROM spots WHERE wave_quality_score IS NOT NULL LIMIT 5;"
echo ""

echo "${GREEN}========================================${NC}"
echo "${GREEN}✓ Setup terminé avec succès !${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Base de données: $DB_NAME"
echo "Pour démarrer le backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "Pour démarrer le frontend:"
echo "  cd frontend"
echo "  npm run dev"
