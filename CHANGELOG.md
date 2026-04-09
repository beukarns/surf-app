# Changelog - Surf App

## [2026-01-12] - Ajout des nouvelles colonnes CSV

### Ajouté

#### Base de données
- ✅ 5 nouvelles colonnes dans la table `spots`:
  - `frequency_score` (DECIMAL 3,2) - Score de fréquence normalisé
  - `wave_quality_score` (DECIMAL 3,2) - Score de qualité normalisé
  - `experience_needed_score` (DECIMAL 3,2) - Score de niveau requis
  - `swell_min` (DECIMAL 4,2) - Taille minimale de houle en mètres
  - `swell_max` (DECIMAL 4,2) - Taille maximale de houle en mètres

- ✅ 4 nouveaux index pour optimiser les performances:
  - `idx_spots_wave_quality_score` - Tri par qualité
  - `idx_spots_frequency_score` - Tri par fréquence
  - `idx_spots_swell_min` - Filtrage par houle min
  - `idx_spots_swell_max` - Filtrage par houle max

#### Backend (Python/FastAPI)
- ✅ Modèles SQLAlchemy mis à jour ([backend/models.py](backend/models.py):57-61)
- ✅ Schémas Pydantic mis à jour ([backend/schemas.py](backend/schemas.py):64-68)
- ✅ Script d'importation CSV enrichi ([import_spots.py](import_spots.py))
  - Nouvelle fonction `parse_float()` pour gérer les valeurs numériques
  - Support des colonnes: Frequency_Score, Wave_Quality_Score, Experience_Needed_Score, swell_min, swell_max

#### Frontend (React)
- ✅ Page de détail du spot mise à jour ([frontend/src/pages/SpotDetail.jsx](frontend/src/pages/SpotDetail.jsx))
  - Section "Scores" avec les 3 scores normalisés
  - Affichage des seuils de houle min/max

- ✅ Liste des spots enrichie ([frontend/src/pages/Spots.jsx](frontend/src/pages/Spots.jsx))
  - Badge de score qualité (vert)
  - Indicateur de niveau requis (Expert/Intermédiaire/Tous niveaux)
  - Affichage du range de houle (ex: "Houle: 1.5m - 4m")

#### Scripts et Documentation
- ✅ Script de migration SQL ([migration_add_new_columns.sql](migration_add_new_columns.sql))
- ✅ Script de setup automatisé ([setup_database.sh](setup_database.sh))
- ✅ Guide de migration complet ([MIGRATION_GUIDE.md](MIGRATION_GUIDE.md))

### Modifié

#### Fichiers modifiés
1. [database_schema.sql](database_schema.sql) - Lignes 52-68
2. [backend/models.py](backend/models.py) - Lignes 57-61
3. [backend/schemas.py](backend/schemas.py) - Lignes 64-68, 94-98
4. [import_spots.py](import_spots.py) - Lignes 55-64, 113-117, 137-149
5. [frontend/src/pages/SpotDetail.jsx](frontend/src/pages/SpotDetail.jsx) - Lignes 80-89, 96-101
6. [frontend/src/pages/Spots.jsx](frontend/src/pages/Spots.jsx) - Lignes 51-91

### Impact utilisateur

#### Ce qui change pour l'utilisateur final
1. **Plus d'informations sur chaque spot**
   - Scores objectifs de qualité et de fréquence
   - Indication claire du niveau requis
   - Plage de houle fonctionnelle du spot

2. **Meilleure navigation**
   - Liste des spots plus informative avec badges visuels
   - Tri et filtrage plus pertinent possible (à venir)

3. **Base pour les features futures**
   - Filtres avancés par niveau/houle/qualité
   - Alertes intelligentes basées sur les prévisions
   - Recommandations personnalisées

#### Compatibilité
- ✅ 100% rétrocompatible
- ✅ Pas de breaking changes dans l'API
- ✅ Les anciens spots sans ces données fonctionnent toujours
- ✅ Valeurs NULL gérées correctement partout

### À faire ensuite (Roadmap)

#### MVP - Phase suivante
- [ ] Système d'authentification complet
- [ ] Écran de connexion/inscription
- [ ] Protection des routes API
- [ ] Tests end-to-end

#### Features futures suggérées
- [ ] Filtres avancés dans la liste des spots
  - Par niveau (débutant/intermédiaire/expert)
  - Par taille de houle actuelle
  - Par score de qualité
  - Par fréquence

- [ ] Intégration API météo
  - Afficher les prévisions par spot
  - Calculer si le spot marche actuellement (swell_min/max)
  - Alertes automatiques

- [ ] Système de sessions
  - Logger ses sessions avec conditions
  - Affiner les données des spots avec le feedback utilisateurs
  - Statistiques personnelles

- [ ] Carte interactive
  - Visualiser tous les spots sur une map
  - Clustering par région
  - Filtrage géographique

- [ ] Alertes personnalisées
  - Par email/Telegram
  - Basées sur région + niveau + conditions

### Notes techniques

#### Performance
- Les nouveaux index garantissent que les requêtes de tri/filtrage restent rapides
- Structure de données optimisée pour le scaling futur

#### Sécurité
- Validation des données à l'import (parse_float avec gestion d'erreurs)
- Types de données SQL stricts (DECIMAL avec précision)

#### Qualité du code
- Code documenté avec commentaires
- Gestion propre des valeurs NULL/manquantes
- Respect des conventions React (hooks, composants fonctionnels)

### Commandes utiles

```bash
# Setup complet de la BDD
./setup_database.sh

# Migration sur BDD existante
psql surf_app < migration_add_new_columns.sql

# Import des données
python3 import_spots.py /path/to/infos-spot_all_GRANDMASTER.csv

# Démarrer le backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Démarrer le frontend
cd frontend && npm run dev
```

### Stats du CSV GRANDMASTER

Le fichier source contient des données sur des spots du monde entier avec :
- Continents, pays, régions, spots
- Caractéristiques détaillées des vagues
- Conditions optimales
- Accès et localisation
- Descriptions riches
- **Nouveaux scores normalisés pour analyse**

### Contributeurs

- Migration des données: Claude Code
- Design système: Architecture scalable pour features futures
- Date: 2026-01-12
