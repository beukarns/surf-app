# Checklist de vérification - Surf App

## 🔍 Avant de commencer

### Environnement
- [ ] PostgreSQL installé et démarré
  ```bash
  brew services list | grep postgresql
  ```
- [ ] Python 3.9+ installé
  ```bash
  python3 --version
  ```
- [ ] Node.js 18+ installé
  ```bash
  node --version
  ```

### Fichiers source
- [ ] CSV GRANDMASTER présent à `/Users/benoitriom/Desktop/Dev/infos-spot_all_GRANDMASTER.csv`
- [ ] Tous les fichiers du projet présents

## ⚙️ Setup de la base de données

### Option 1 : Setup automatique (recommandé)
- [ ] Rendre le script exécutable : `chmod +x setup_database.sh`
- [ ] Lancer : `./setup_database.sh`
- [ ] Vérifier qu'il se termine sans erreur
- [ ] Noter le nombre de spots importés

### Option 2 : Setup manuel
- [ ] Créer la base : `createdb surf_app`
- [ ] Créer les tables : `psql surf_app < database_schema.sql`
- [ ] Importer les données : `python3 import_spots.py /path/to/csv`

### Vérification de la BDD
- [ ] Se connecter : `psql surf_app`
- [ ] Lister les tables : `\dt`
  - [ ] Table `users` existe
  - [ ] Table `spots` existe
  - [ ] Table `sessions` existe
  - [ ] Table `alerts` existe

- [ ] Vérifier les colonnes de spots :
  ```sql
  \d spots
  ```
  Colonnes à vérifier :
  - [ ] frequency_score
  - [ ] wave_quality_score
  - [ ] experience_needed_score
  - [ ] swell_min
  - [ ] swell_max

- [ ] Compter les spots :
  ```sql
  SELECT COUNT(*) FROM spots;
  ```
  Devrait être > 0

- [ ] Vérifier quelques exemples :
  ```sql
  SELECT name, wave_quality_score, swell_min, swell_max
  FROM spots
  WHERE wave_quality_score IS NOT NULL
  LIMIT 5;
  ```

## 🐍 Backend

### Setup
- [ ] Aller dans backend : `cd backend`
- [ ] Créer venv : `python3 -m venv venv`
- [ ] Activer venv : `source venv/bin/activate`
- [ ] Installer deps : `pip install -r requirements.txt`

### Configuration
- [ ] Vérifier [database.py](backend/database.py)
  - [ ] DB_NAME = "surf_app"
  - [ ] Connection string correct

### Lancement
- [ ] Lancer : `uvicorn main:app --reload`
- [ ] Vérifier que ça démarre sans erreur
- [ ] Port 8000 libre et utilisé

### Tests API
Ouvrir http://localhost:8000/docs

- [ ] Documentation Swagger accessible
- [ ] Section "auth" visible
- [ ] Section "spots" visible

#### Test Auth
- [ ] POST /api/auth/register
  - Créer un compte test
  - Vérifier réponse 200
  - Noter le token

- [ ] POST /api/auth/login
  - Se connecter avec le compte créé
  - Vérifier réponse 200
  - Token retourné

#### Test Spots (avec authentification)
- [ ] GET /api/spots/continents
  - Cliquer "Try it out"
  - Ajouter le token : `Bearer <votre_token>`
  - Execute
  - Vérifier liste des continents

- [ ] GET /api/spots/countries/{continent}
  - Tester avec "Europe"
  - Vérifier liste des pays

- [ ] GET /api/spots/list/{continent}/{country}/{region}
  - Tester avec Europe/Spain/Pais Vasco
  - Vérifier que les spots ont les nouveaux champs :
    - wave_quality_score
    - frequency_score
    - experience_needed_score
    - swell_min
    - swell_max

- [ ] GET /api/spots/{spot_id}
  - Prendre un ID de la liste précédente
  - Vérifier détails complets du spot
  - Vérifier nouveaux champs présents

## ⚛️ Frontend

### Setup
- [ ] Aller dans frontend : `cd frontend`
- [ ] Installer deps : `npm install`
- [ ] Vérifier package.json OK

### Configuration
- [ ] Vérifier [src/services/api.js](frontend/src/services/api.js)
  - [ ] Base URL pointe vers http://localhost:8000

### Lancement
- [ ] Lancer : `npm run dev`
- [ ] Vérifier que ça démarre sans erreur
- [ ] Port 5173 libre et utilisé
- [ ] Ouvrir http://localhost:5173

### Tests UI

#### Page Login
- [ ] Page de login s'affiche
- [ ] Formulaire email/password visible
- [ ] Pouvoir se connecter avec compte test
- [ ] Redirection après login

#### Navigation Continents
- [ ] Liste des continents visible
- [ ] Pas d'erreur console (F12)
- [ ] Cliquer sur "Europe"

#### Navigation Pays
- [ ] Liste des pays européens visible
- [ ] Cliquer sur "Spain"

#### Navigation Régions
- [ ] Liste des régions d'Espagne visible
- [ ] Cliquer sur "Pais Vasco"

#### Liste Spots
- [ ] Liste des spots visible
- [ ] **NOUVEAUTÉ** : Badge vert "Q:XX%" visible ?
- [ ] **NOUVEAUTÉ** : Ligne "Houle: Xm - Ym" visible ?
- [ ] **NOUVEAUTÉ** : Ligne "Niveau: ..." visible ?
- [ ] Rating bleu affiché
- [ ] Cliquer sur un spot (ex: Mundaka)

#### Détail Spot
- [ ] Toutes les infos du spot affichées
- [ ] Section "Caractéristiques de la vague"
- [ ] **NOUVEAUTÉ** : Section "Scores (sur 1.0)" visible ?
  - [ ] Score qualité
  - [ ] Score fréquence
  - [ ] Score niveau requis
- [ ] Section "Conditions optimales"
- [ ] **NOUVEAUTÉ** : "Houle min (m)" affiché ?
- [ ] **NOUVEAUTÉ** : "Houle max (m)" affiché ?
- [ ] Bouton retour fonctionne

#### Navigation Retour
- [ ] Retour Spot → Liste spots
- [ ] Retour Liste → Régions
- [ ] Retour Régions → Pays
- [ ] Retour Pays → Continents

#### Console
- [ ] Ouvrir console (F12)
- [ ] Pas d'erreurs rouges
- [ ] Requêtes API en 200 OK
- [ ] Pas de warnings majeurs

## 📱 Tests Responsive (bonus)

### Mobile (DevTools, 375px)
- [ ] Login responsive
- [ ] Listes lisibles
- [ ] Badges non coupés
- [ ] Boutons cliquables

### Tablet (768px)
- [ ] Mise en page OK
- [ ] Pas de débordement

## 🐛 Debug si problèmes

### Backend ne démarre pas
- [ ] Port 8000 déjà utilisé ? → Changer de port
- [ ] BDD inaccessible ? → Vérifier PostgreSQL
- [ ] Import manquant ? → Réinstaller requirements.txt

### Frontend ne démarre pas
- [ ] Port 5173 utilisé ? → `npm run dev -- --port 5174`
- [ ] node_modules corrompu ? → Supprimer et `npm install`

### API retourne 401
- [ ] Token expiré → Se reconnecter
- [ ] Token mal formaté → Vérifier "Bearer <token>"

### Nouveaux champs pas affichés
- [ ] BDD migrée ? → Lancer migration_add_new_columns.sql
- [ ] CSV réimporté ? → Lancer import_spots.py
- [ ] Backend redémarré ? → Ctrl+C et relancer

### Console erreurs React
- [ ] Null/undefined ? → Vérifier que les champs existent en BDD
- [ ] Type error ? → Vérifier types (Decimal → Number en JS)

## ✅ Critères de succès

### MVP fonctionnel si :
- [ ] ✅ Backend démarre et API répond
- [ ] ✅ Frontend démarre et affiche pages
- [ ] ✅ Login/Register fonctionne
- [ ] ✅ Navigation complète Continent→Spot
- [ ] ✅ Tous les nouveaux champs s'affichent
- [ ] ✅ Pas de bugs bloquants

### Bonus réussi si :
- [ ] 🎨 Design propre et cohérent
- [ ] 📱 Responsive OK
- [ ] ⚡ Rapide (< 2s par page)
- [ ] 🔒 Sécurité de base OK

## 📋 Notes

### Nombres attendus
- Spots totaux : Plusieurs milliers (variable selon CSV)
- Continents : ~6-7
- Pays : ~50+
- Temps de chargement : < 1s par page

### Performance
Si lent :
- Ajouter pagination (>50 items)
- Vérifier index BDD
- Cache API calls

## 🎉 Une fois tout validé

### Git
```bash
git add .
git commit -m "feat: add new CSV columns support

- Add 5 new database columns (scores + swell range)
- Update backend models and schemas
- Enhance frontend UI with badges and indicators
- Add migration scripts and documentation"
```

### Documentation
- [ ] CHANGELOG.md à jour
- [ ] README.md reflète l'état actuel
- [ ] Commentaires code clairs

### Prêt pour la suite !
→ Consulter [NEXT_STEPS.md](NEXT_STEPS.md) pour la roadmap
