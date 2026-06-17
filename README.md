# Molkky Score

Application web/PWA de gestion de points pour le jeu Molkky.

Version de livraison actuelle : `V20260617_1207`.

## Ce que fait l'application

- Cree une nouvelle partie avec 2 a 6 equipes.
- Gere les noms, couleurs et handicaps de depart.
- Permet de choisir le score cible : 30, 40, 50 ou 75.
- Gere les lancers selon les regles du Molkky :
  - une quille tombee vaut son numero ;
  - plusieurs quilles tombees valent le nombre de quilles ;
  - un lancer rate compte comme 0.
- Gere les rates consecutifs avec elimination optionnelle.
- Gere plusieurs modes de depassement du score cible :
  - retour a 25 ;
  - retour a 0 ;
  - retour a la moitie ;
  - lancer ignore.
- Gere les essais de grace avant penalite de depassement.
- Permet d'annuler le dernier lancer.
- Detecte les victoires par score exact ou par elimination.
- Sauvegarde la partie en cours dans `localStorage`.
- Sauvegarde l'historique des parties terminees.
- Affiche les statistiques par joueur/equipe.
- Fonctionne comme PWA avec manifest, icones, cache offline et service worker.

## Ce qui a ete ameliore

L'application etait initialement concentree dans `index.html` et `sw.js`.
Elle a ete decoupee en fichiers maintenables, testables et compatibles GitHub Pages.

Principales ameliorations :

- Suppression de la dependance runtime a Babel/CDN.
- Ajout de React et ReactDOM en local dans `vendor/`.
- Ajout des polices locales dans `fonts/`.
- Extraction du CSS dans `styles.css`.
- Ajout du manifest PWA et des icones dans `icons/`.
- Extraction de la logique metier en modules testes.
- Extraction de composants UI et popups.
- Ajout d'un workflow de build.
- Ajout de tests unitaires et fonctionnels Playwright.
- Ajout d'un test d'encodage pour eviter le retour de texte mojibake.
- Synchronisation de version entre `index.html`, `sw.js`, `src/app.js` et `app.js`.

## Structure importante

Fichiers servis par le navigateur :

- `index.html` : page principale.
- `sw.js` : service worker et cache offline.
- `app.js` : application React generee depuis `src/app.js`.
- `styles.css` : styles principaux.
- `fonts.css` : declaration des polices locales.
- `manifest.webmanifest` : configuration PWA.
- `constants.js` : constantes partagees.
- `formatters.js` : formatage dates/durees.
- `components.js` : composants UI generiques.
- `game-components.js` : composants de l'ecran de partie.
- `game-state.js` : moteur d'etat de partie.
- `dialogs.js` : popups et modales.
- `setup-screen.js` : ecran de configuration d'une partie.
- `rules.js` : regles pures du Molkky.
- `storage.js` : lecture/ecriture `localStorage`.

Dossiers a publier aussi :

- `vendor/` : React local.
- `fonts/` : polices locales.
- `icons/` : icones PWA.

Fichiers de maintenance :

- `src/` : sources a modifier en priorite.
- `scripts/` : build et tests.
- `package.json` : commandes npm.
- `README.md` : documentation projet.

## Regle importante pour GitHub Pages

Il ne faut plus publier seulement `index.html` et `sw.js`.

Il faut publier tout le dossier applicatif, car `index.html` charge maintenant
plusieurs fichiers JavaScript, CSS, polices, icones et assets locaux.

## Modifier l'application

Modifier les fichiers dans `src/`, puis regenerer les fichiers servis :

```bash
npm run build
```

Pour preparer une livraison et forcer le rafraichissement du cache PWA :

```bash
npm run build V20260617_1207
```

Remplacer `V20260617_1207` par une nouvelle version unique au format :

```text
VYYYYMMDD_HHMM
```

Le build met a jour :

- `app.js`
- `constants.js`
- `formatters.js`
- `components.js`
- `game-components.js`
- `game-state.js`
- `dialogs.js`
- `setup-screen.js`
- `rules.js`
- `storage.js`
- `index.html`
- `sw.js`
- `src/app.js`

## Tests

Lancer toute la suite :

```bash
npm test
```

Tests disponibles :

```bash
npm run test:helpers
npm run test:rules
npm run test:game-state
npm run test:storage
npm run test:encoding
npm run test:functional
```

Ce que couvrent les tests :

- `test:helpers` : constantes et formatages.
- `test:rules` : score d'un lancer, depassement, preview, rates.
- `test:game-state` : transitions de partie, victoire, elimination, annulation.
- `test:storage` : sauvegarde defensive, historique, nettoyage.
- `test:encoding` : detection de texte mojibake.
- `test:functional` : parcours navigateur avec Playwright :
  - nouvelle partie ;
  - lancer ;
  - annulation ;
  - rate ;
  - victoire ;
  - historique ;
  - depassement avec grace ;
  - penalite de depassement ;
  - victoire par elimination ;
  - reload offline via service worker.

## Avant de publier

Checklist conseillee :

1. Generer une nouvelle version :

```bash
npm run build VYYYYMMDD_HHMM
```

2. Lancer les tests :

```bash
npm test
```

3. Verifier que tous les fichiers et dossiers sont bien publies :

- `index.html`
- `sw.js`
- tous les fichiers `.js` generes a la racine
- `styles.css`
- `fonts.css`
- `manifest.webmanifest`
- `vendor/`
- `fonts/`
- `icons/`
- idealement aussi `src/`, `scripts/`, `package.json`, `README.md`

## Points d'attention pour une prochaine intervention

- `src/app.js` reste encore le fichier principal React, mais il est beaucoup plus petit qu'au depart.
- La logique metier sensible est surtout dans `src/rules.js` et `src/game-state.js`.
- Les composants de rendu de partie sont dans `src/game-components.js`.
- Les popups sont dans `src/dialogs.js`.
- L'ecran de creation de partie est dans `src/setup-screen.js`.
- Ne pas modifier uniquement les fichiers generes a la racine si la modification doit durer : modifier la source dans `src/`, puis lancer le build.
- Si le service worker semble garder une ancienne version, incrementer `APP_VERSION` via `npm run build VYYYYMMDD_HHMM`.

## Etat actuel

Derniere validation connue :

```bash
npm run build V20260617_1207
npm test
```

Resultat : tous les tests passent, y compris les tests fonctionnels Playwright
et le test offline/reload du service worker.
