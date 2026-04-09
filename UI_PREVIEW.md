# Aperçu des modifications UI

## 📱 Liste des Spots (Spots.jsx)

### Avant
```
┌─────────────────────────────────────────────┐
│ Spots - Pais Vasco                          │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐       │
│ │ Mundaka                     60/100│       │
│ │ Point-break • World Class         │       │
│ └───────────────────────────────────┘       │
│                                             │
│ ┌───────────────────────────────────┐       │
│ │ Zarautz                     40/100│       │
│ │ Beach-break • Normal              │       │
│ └───────────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

### Après
```
┌─────────────────────────────────────────────────────┐
│ Spots - Pais Vasco                                  │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐        │
│ │ Mundaka                    Q:90% | 60/100│        │
│ │ Point-break • World Class               │        │
│ │ Houle: 1.5m - 4m                        │        │
│ │ Niveau: Expert                          │        │
│ └──────────────────────────────────────────┘        │
│                                                     │
│ ┌──────────────────────────────────────────┐        │
│ │ Zarautz                    Q:50% | 40/100│        │
│ │ Beach-break • Normal                    │        │
│ │ Houle: 0.5m - 2.5m                      │        │
│ │ Niveau: Tous niveaux                    │        │
│ └──────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

**Nouveautés** :
- ✅ Badge vert "Q:XX%" = Score de qualité (wave_quality_score)
- ✅ "Houle: Xm - Ym" = Plage de houle fonctionnelle (swell_min/max)
- ✅ "Niveau:" = Calculé depuis experience_needed_score
  - 0-0.4 : Tous niveaux
  - 0.4-0.7 : Intermédiaire
  - 0.7-1.0 : Expert

---

## 📄 Détail d'un Spot (SpotDetail.jsx)

### Nouvelle section ajoutée

```
┌─────────────────────────────────────────────────────┐
│ Mundaka                                             │
│ Europe • Spain • Pais Vasco                         │
│ Note: 60/100 (26 votes)                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Caractéristiques de la vague                        │
│ ├─ Type: Point-break                                │
│ ├─ Direction: Left                                  │
│ ├─ Fond: Sandy with rock                            │
│ └─ Qualité: World Class                             │
│                                                     │
│ 🆕 Scores (sur 1.0)                                 │
│ ├─ Score qualité: 1.0                               │
│ ├─ Score fréquence: 0.8                             │
│ └─ Score niveau requis: 1.0                         │
│                                                     │
│ Conditions optimales                                │
│ ├─ Houle idéale: North, NorthWest                   │
│ ├─ Vent idéal: South, SouthEast                     │
│ ├─ Taille de houle: Starts at 1.5m...               │
│ ├─ 🆕 Houle min (m): 1.5                            │
│ ├─ 🆕 Houle max (m): 4.0                            │
│ └─ Marée: All tides                                 │
│                                                     │
│ [... reste des infos ...]                           │
└─────────────────────────────────────────────────────┘
```

**Nouveautés** :
- ✅ Nouvelle section "Scores (sur 1.0)"
  - Score qualité normalisé
  - Score fréquence normalisé
  - Score niveau requis normalisé
- ✅ Houle min/max en mètres (plus précis que le texte)

---

## 🎨 Codes couleur

### Badges
- 🔵 Bleu (#667eea) : Rating général (60/100)
- 🟢 Vert (#10b981) : Score qualité (Q:90%)

### Niveaux
- 🟢 Tous niveaux : experience_needed_score < 0.4
- 🟡 Intermédiaire : 0.4 ≤ score < 0.7
- 🔴 Expert : score ≥ 0.7

---

## 💡 Cas d'usage

### Utilisateur débutant
1. Voit immédiatement "Niveau: Tous niveaux"
2. Peut filtrer par houle actuelle (ex: si 1m aujourd'hui, spots 0.5-2m OK)
3. Badge qualité aide à choisir le meilleur spot

### Utilisateur expert
1. Cherche "Niveau: Expert" + "Q:80%+"
2. Vérifie que houle du jour est dans le range
3. Score fréquence = spots qui marchent souvent

### Pour alertes futures
```javascript
// Pseudo-code d'alerte intelligente
if (forecast.swell >= spot.swell_min && 
    forecast.swell <= spot.swell_max &&
    spot.experience_needed_score <= user.level &&
    spot.frequency_score > 0.6) {
  sendAlert(user, spot)
}
```

---

## 📐 Responsive

Le design reste responsive :
- Mobile : Badges empilés verticalement
- Desktop : Affichage côte à côte
- Tout reste lisible et cliquable

