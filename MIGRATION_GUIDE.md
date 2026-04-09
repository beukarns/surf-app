# Guide de Migration - Nouvelles Colonnes

Date: 2026-01-12

## Changements

Ajout de 5 nouvelles colonnes dans la table `spots` pour enrichir les données :

### Nouvelles colonnes

1. **frequency_score** (DECIMAL 3,2)
   - Score normalisé de fréquence des vagues (0.0 à 1.0)
   - Permet de filtrer les spots qui marchent souvent
   - Utile pour les alertes automatiques

2. **wave_quality_score** (DECIMAL 3,2)
   - Score normalisé de qualité des vagues (0.0 à 1.0)
   - Permet de trier les spots par qualité objective
   - Complète le rating utilisateur

3. **experience_needed_score** (DECIMAL 3,2)
   - Score de niveau requis (0.0 à 1.0)
   - 0.0-0.4 : Tous niveaux
   - 0.4-0.7 : Intermédiaire
   - 0.7-1.0 : Expert
   - Permet de filtrer par niveau

4. **swell_min** (DECIMAL 4,2)
   - Taille minimale de houle en mètres pour que le spot fonctionne
   - Ex: 1.5 = le spot commence à marcher à partir de 1.5m

5. **swell_max** (DECIMAL 4,2)
   - Taille maximale de houle en mètres que le spot peut tenir
   - Ex: 4.0 = le spot ferme/devient dangereux au-delà de 4m

## Instructions de migration

### Étape 1: Sauvegarder la base de données existante

```bash
pg_dump surf_app > backup_surf_app_$(date +%Y%m%d).sql
```

### Étape 2: Appliquer la migration

```bash
psql surf_app < migration_add_new_columns.sql
```

### Étape 3: Importer les nouvelles données

```bash
# Vider la table spots (optionnel, si vous voulez repartir de zéro)
psql surf_app -c "TRUNCATE TABLE spots CASCADE;"

# Importer le fichier GRANDMASTER avec toutes les données
python import_spots.py /Users/benoitriom/Desktop/Dev/infos-spot_all_GRANDMASTER.csv
```

### Étape 4: Vérifier les données

```bash
# Vérifier que les colonnes sont bien créées
psql surf_app -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'spots';"

# Vérifier quelques exemples de données
psql surf_app -c "SELECT name, wave_quality_score, frequency_score, swell_min, swell_max FROM spots WHERE wave_quality_score IS NOT NULL LIMIT 10;"

# Compter les spots par continent
psql surf_app -c "SELECT continent, COUNT(*) as nb_spots FROM spots GROUP BY continent ORDER BY nb_spots DESC;"
```

## Utilisation dans l'application

### Backend

Les nouveaux champs sont automatiquement disponibles via l'API :
- GET `/api/spots/{spot_id}` : Retourne tous les champs incluant les nouveaux
- GET `/api/spots/list/{continent}/{country}/{region}` : Inclut les scores pour filtrage

### Frontend

Les modifications ont été appliquées à :
- **SpotDetail.jsx** : Affiche les scores et les seuils de houle
- **Spots.jsx** : Affiche les indicateurs visuels (score qualité, niveau requis, range de houle)

### Features futures possibles

Avec ces nouvelles données, vous pourrez facilement implémenter :

1. **Filtres avancés**
   ```javascript
   // Filtrer par niveau
   spots.filter(s => s.experience_needed_score < 0.4) // Débutants

   // Filtrer par houle actuelle
   const currentSwell = 2.0; // mètres
   spots.filter(s => s.swell_min <= currentSwell && s.swell_max >= currentSwell)

   // Top spots par qualité
   spots.sort((a, b) => b.wave_quality_score - a.wave_quality_score)
   ```

2. **Alertes intelligentes**
   - Recevoir une alerte quand un spot dans votre région a des conditions optimales
   - Basé sur forecast météo + swell_min/max + votre niveau (experience_needed_score)

3. **Recommandations personnalisées**
   - Suggérer des spots adaptés au niveau de l'utilisateur
   - Montrer les spots qui marchent le plus souvent (frequency_score)

4. **Statistiques**
   - Graphiques de distribution des spots par niveau
   - Carte de chaleur par qualité de vague
   - Analyse des meilleurs spots par région

## Compatibilité

- ✅ Rétrocompatible : les anciennes données sans ces colonnes fonctionnent toujours
- ✅ Les valeurs NULL sont gérées correctement
- ✅ Aucun changement breaking dans l'API

## Rollback

Si vous devez annuler la migration :

```sql
ALTER TABLE spots DROP COLUMN IF EXISTS frequency_score;
ALTER TABLE spots DROP COLUMN IF EXISTS wave_quality_score;
ALTER TABLE spots DROP COLUMN IF EXISTS experience_needed_score;
ALTER TABLE spots DROP COLUMN IF EXISTS swell_min;
ALTER TABLE spots DROP COLUMN IF EXISTS swell_max;

DROP INDEX IF EXISTS idx_spots_wave_quality_score;
DROP INDEX IF EXISTS idx_spots_frequency_score;
DROP INDEX IF EXISTS idx_spots_swell_min;
DROP INDEX IF EXISTS idx_spots_swell_max;
```

## Support

Pour toute question sur cette migration, référez-vous au fichier CSV source :
`/Users/benoitriom/Desktop/Dev/infos-spot_all_GRANDMASTER.csv`
