# Surf Spots - Web App

Application web pour explorer et gérer des spots de surf à travers le monde.

## Structure du projet

```
surf-app/
├── backend/          # API FastAPI (Python)
└── frontend/         # Interface React + Vite
```

## Prérequis

- Python 3.9+
- Node.js 18+
- PostgreSQL 15+

## Installation rapide

### Setup automatique (recommandé)

```bash
# 1. Installer PostgreSQL si nécessaire
brew install postgresql@15
brew services start postgresql@15

# 2. Configurer la base de données et importer les données
./setup_database.sh

# 3. Lancer le backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# 4. Lancer le frontend (dans un autre terminal)
cd frontend
npm run dev
```

### Installation manuelle

#### 1. PostgreSQL

```bash
# Installation sur Mac
brew install postgresql@15
brew services start postgresql@15

# Créer la base de données
createdb surf_app
psql surf_app < database_schema.sql
```

#### 2. Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Mac/Linux

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload
```

#### 3. Importer les données

```bash
# Importer le fichier CSV GRANDMASTER
python import_spots.py /Users/benoitriom/Desktop/Dev/infos-spot_all_GRANDMASTER.csv
```

Le backend sera disponible sur http://localhost:8000

Documentation API : http://localhost:8000/docs

#### 4. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera disponible sur http://localhost:5173

## 🆕 Nouveautés (2026-01-12)

### Données enrichies

Le CSV GRANDMASTER inclut maintenant 5 nouveaux champs :
- **frequency_score** : Score de fréquence des vagues (0-1)
- **wave_quality_score** : Score de qualité (0-1)
- **experience_needed_score** : Niveau requis (0-1)
- **swell_min** : Taille min de houle (en mètres)
- **swell_max** : Taille max de houle (en mètres)

### Interface améliorée

- 📊 Scores visuels dans la liste des spots
- 🎯 Indicateurs de niveau (Expert/Intermédiaire/Tous niveaux)
- 🌊 Affichage du range de houle fonctionnel
- 📈 Section scores détaillés sur la page spot

Voir [CHANGELOG.md](CHANGELOG.md) pour plus de détails.

## Utilisation

1. Ouvrir http://localhost:5173
2. Créer un compte ou se connecter
3. Naviguer : Continents → Pays → Régions → Spots
4. Cliquer sur un spot pour voir tous les détails

## Structure de la base de données

### Table `users`
- Gestion des utilisateurs et authentification
- Stockage sécurisé des mots de passe (bcrypt)

### Table `spots`
- Tous les spots de surf avec leurs caractéristiques
- Informations : vagues, accès, conditions, localisation
- **Nouveaux champs** : scores normalisés, seuils de houle (swell_min/max)

### Tables futures
- `sessions` : Historique des sessions de surf
- `alerts` : Alertes personnalisées par conditions

## API Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Infos utilisateur

### Spots
- `GET /api/spots/continents` - Liste des continents
- `GET /api/spots/countries/{continent}` - Liste des pays
- `GET /api/spots/regions/{continent}/{country}` - Liste des régions
- `GET /api/spots/list/{continent}/{country}/{region}` - Liste des spots
- `GET /api/spots/{spot_id}` - Détails d'un spot

## Fonctionnalités futures

- [ ] Prévisions météo par spot
- [ ] Log de sessions avec rating
- [ ] Alertes personnalisées (email/Telegram)
- [ ] Filtres avancés (niveau, type de vague, etc.)
- [ ] Carte interactive
- [ ] Photos de spots
- [ ] Commentaires et avis

## Déploiement VPS

### Backend
```bash
# Installer les dépendances
sudo apt install postgresql python3-pip nginx

# Configurer PostgreSQL
# Copier les fichiers backend
# Installer Gunicorn
pip install gunicorn

# Lancer avec Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Build
npm run build

# Servir avec Nginx
# Copier dist/ vers /var/www/surf-spots
```

### Nginx config
```nginx
server {
    listen 80;
    server_name votredomaine.com;

    # Frontend
    location / {
        root /var/www/surf-spots;
        try_files $uri $uri/ /index.html;
    }

    # Backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Sécurité

- Modifier `SECRET_KEY` dans [backend/auth.py](backend/auth.py) en production
- Utiliser HTTPS
- Configurer CORS correctement
- Variables d'environnement pour les secrets

## Licence

Projet personnel
