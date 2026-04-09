# Guide de Setup Rapide

## 1. Installation de PostgreSQL

```bash
brew install postgresql@15
brew services start postgresql@15
```

Créer la base de données :
```bash
createdb surf_spots
```

## 2. Setup Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Importer vos données CSV

```bash
python scripts/import_csv.py /chemin/vers/votre/fichier.csv
```

Le script va :
- Créer automatiquement les tables
- Parser les coordonnées GPS
- Importer tous les spots

### Lancer le backend

```bash
uvicorn main:app --reload
```

Backend disponible sur : http://localhost:8000
Documentation API : http://localhost:8000/docs

## 3. Setup Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur
npm run dev
```

Frontend disponible sur : http://localhost:5173

## 4. Premier test

1. Ouvrir http://localhost:5173
2. Cliquer sur "S'inscrire"
3. Créer un compte avec email/password
4. Naviguer dans les spots !

## Troubleshooting

### PostgreSQL ne démarre pas
```bash
brew services restart postgresql@15
```

### Erreur "database does not exist"
```bash
createdb surf_spots
```

### Port 8000 déjà utilisé
```bash
# Lancer sur un autre port
uvicorn main:app --reload --port 8001

# Modifier aussi frontend/vite.config.js ligne 7
```

### Erreur CORS
Vérifier que le backend autorise bien `http://localhost:5173` dans [backend/main.py](backend/main.py:16)

## Configuration production

### SECRET_KEY
Dans [backend/auth.py](backend/auth.py:10), changer :
```python
SECRET_KEY = "ton-secret-key-tres-securisee-ici"
```

### Database URL
Dans [backend/database.py](backend/database.py:6), changer pour la prod :
```python
DATABASE_URL = "postgresql://user:password@localhost/surf_spots"
```

### CORS
Dans [backend/main.py](backend/main.py), adapter les origins :
```python
allow_origins=["https://votredomaine.com"]
```
