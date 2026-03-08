# ImmoTracker — Extension Chrome pour Immoweb

Extension Chrome pour suivre, analyser et comparer des biens immobiliers depuis [Immoweb.be](https://www.immoweb.be).

## Fonctionnalités

- **Sauvegarde rapide** : bouton flottant sur chaque annonce Immoweb pour extraire automatiquement les données du bien
- **Calculateur de rentabilité** : rendement brut, net, cash-flow mensuel, prix/m²
- **Pipeline Kanban** : suivi visuel des biens par statut (À étudier → Acquis)
- **Comparateur** : tableau comparatif côte à côte (jusqu'à 3 biens)
- **Export CSV** : téléchargement de toutes les données en CSV

## Installation en mode développeur

1. Téléchargez ou clonez ce dépôt
2. Ouvrez Chrome et accédez à `chrome://extensions/`
3. Activez le **Mode développeur** (interrupteur en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier contenant ce projet
6. L'icône ImmoTracker apparaît dans la barre d'extensions

## Utilisation

### Sur une annonce Immoweb

1. Naviguez vers une annonce sur `immoweb.be/fr/annonce/...`
2. Cliquez sur le bouton **💾 Sauvegarder ce bien** en bas à droite
3. Vérifiez/modifiez les données extraites dans la sidebar
4. Ajoutez vos notes, tags, loyer estimé et charges
5. Choisissez un statut et un score
6. Cliquez **Sauvegarder**

### Pipeline Kanban (popup)

1. Cliquez sur l'icône ImmoTracker dans la barre Chrome
2. Visualisez vos biens organisés par colonnes de statut
3. Glissez-déposez les cartes entre colonnes pour changer le statut
4. Utilisez les boutons Voir / Modifier / Supprimer sur chaque carte

### Comparateur

1. Cochez jusqu'à 3 biens dans le Kanban
2. Cliquez **Comparer** pour afficher le tableau comparatif

### Export

Cliquez **Exporter CSV** pour télécharger toutes les données au format CSV.

## Structure du projet

```
.
├── manifest.json    # Configuration Manifest V3
├── content.js       # Script de contenu (scraping + sidebar)
├── sidebar.css      # Styles de la sidebar
├── popup.html       # Interface Kanban
├── popup.css        # Styles du popup
├── popup.js         # Logique Kanban, comparateur, export CSV
├── icons/           # Icônes de l'extension
└── README.md        # Ce fichier
```

## Contraintes techniques

- Manifest V3 strict (pas de `eval`, pas de scripts inline)
- Vanilla JS uniquement, aucune dépendance externe
- Compatible Chrome 120+
