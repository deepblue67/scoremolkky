# Molkky Score - README carnet de bord

Ce fichier est le carnet de bord officiel du projet.

Il sert a deux usages :

- aider le proprietaire du projet a se rappeler comment l'application fonctionne ;
- permettre a une future intervention Codex de reprendre vite, sans redecouvrir toute l'architecture.

Date de mise a jour du README : 2026-06-19.
Version documentee de l'application : `V20260619_1919`.
Derniere validation connue : `npm run build V20260619_1919`, puis `npm test`.

## Resume court

Molkky Score est une application web/PWA locale de gestion de points pour le jeu Molkky.

Au debut de l'audit, l'application etait essentiellement concentree dans `index.html` et `sw.js`, avec React/Babel charge depuis l'exterieur, beaucoup de logique dans un seul fichier, et peu de garde-fous automatises.

Le projet est maintenant decoupe en modules, avec :

- des fichiers sources dans `src/` ;
- des fichiers generes a la racine, servis par le navigateur ;
- un script de build ;
- une PWA autonome avec React local, polices locales, icones, manifest et service worker ;
- des tests unitaires et fonctionnels ;
- une version de livraison synchronisee dans `index.html`, `sw.js`, `src/app.js` et `app.js`.

## Fonctionnement utilisateur

L'application permet de gerer une partie de Molkky depuis un navigateur ou un mobile.

Fonctionnalites principales :

- creer une nouvelle partie ;
- donner un libelle optionnel a une partie ;
- configurer 2 a 6 equipes ;
- renommer les equipes ;
- reordonner l'ordre de passage des equipes avant le debut ;
- appliquer un handicap de depart par equipe ;
- choisir un score cible : 30, 40, 50 ou 75 ;
- activer ou desactiver l'elimination par rates ;
- choisir la limite de rates consecutifs : 2, 3 ou 4 ;
- choisir le mode de depassement du score cible ;
- ajouter des essais de grace avant penalite de depassement ;
- selectionner les quilles tombees ;
- calculer automatiquement le score du lancer ;
- valider un lancer ;
- valider un lancer rate ;
- annuler le dernier lancer ;
- afficher les popups de depassement, penalite et elimination ;
- detecter une victoire par score exact ;
- detecter une victoire par elimination ;
- sauvegarder la partie en cours ;
- reprendre une partie sauvegardee ;
- conserver l'historique des parties terminees ;
- retrouver le libelle d'une partie dans l'historique et le detail ;
- afficher des statistiques ;
- fonctionner offline apres mise en cache par le service worker.

## Regles de jeu gerees

Score d'un lancer :

- aucune quille : rate, 0 point ;
- une seule quille : le score vaut le numero de la quille ;
- plusieurs quilles : le score vaut le nombre de quilles tombees.

Depassement du score cible :

- mode `25` : retour a 25 points ;
- mode `0` : retour a 0 point ;
- mode `half` : retour a la moitie du score atteint ;
- mode `none` : le lancer est ignore.

Essais de grace :

- si une grace est disponible, le depassement ne penalise pas tout de suite ;
- le score reste au score precedent ;
- un compteur de depassement est affiche ;
- au depassement suivant, si la grace est consommee, la penalite s'applique.

Elimination :

- si l'elimination est active, une equipe est eliminee apres N rates consecutifs ;
- N est configurable ;
- le compteur de rates revient a 0 quand une quille tombe ;
- si une seule equipe reste active, elle gagne.

Annulation :

- l'annulation restaure le snapshot complet de l'equipe avant le lancer ;
- elle restaure aussi le joueur courant, le round, les rates, les eliminations, les compteurs de depassement et l'historique.

## Architecture generale

Le projet suit maintenant une architecture simple :

```text
src/                 Sources a modifier en priorite
scripts/             Build et tests
vendor/              React et ReactDOM locaux
fonts/               Polices locales
icons/               Icones PWA
*.js a la racine     Fichiers generes/servis par le navigateur
index.html           Page principale
sw.js                Service worker
styles.css           Styles
manifest.webmanifest Manifest PWA
README.md            Carnet de bord officiel
```

Principe important :

- on modifie les fichiers dans `src/` ;
- on lance `npm run build` ;
- le build recopie/genere les fichiers servis a la racine ;
- on evite de modifier a la main les fichiers generes a la racine si la modification doit durer.

## Chargement navigateur

`index.html` charge les fichiers dans cet ordre :

```html
vendor/react.production.min.js
vendor/react-dom.production.min.js
constants.js
formatters.js
components.js
game-components.js
rules.js
game-state.js
dialogs.js
setup-screen.js
storage.js
app.js
```

Ordre important :

- `rules.js` doit etre charge avant `game-state.js` ;
- `dialogs.js` doit etre charge avant `setup-screen.js` ;
- `app.js` arrive en dernier, car il orchestre les modules.

## Structure des fichiers

### Fichiers source

- `src/app.js` : orchestrateur React principal, navigation entre ecrans, liaison entre moteur et UI.
- `src/rules.js` : regles pures du Molkky, calculs de score, depassement, rates.
- `src/game-state.js` : moteur d'etat de partie, transitions de lancer, rate, annulation et reactions metier.
- `src/storage.js` : lecture/ecriture defensive dans `localStorage`.
- `src/constants.js` : couleurs d'equipe et ordre des quilles.
- `src/formatters.js` : dates et durees.
- `src/components.js` : composants UI generiques.
- `src/game-components.js` : rendu de l'ecran de partie, scoreboard et panneau de tour.
- `src/dialogs.js` : popups de regles, evenements et abandon.
- `src/setup-screen.js` : ecran de creation/configuration de partie.

### Fichiers generes ou servis

- `app.js`
- `rules.js`
- `game-state.js`
- `storage.js`
- `constants.js`
- `formatters.js`
- `components.js`
- `game-components.js`
- `dialogs.js`
- `setup-screen.js`

Ces fichiers sont servis par GitHub Pages et doivent etre publies.

### PWA et assets

- `index.html` : point d'entree.
- `sw.js` : service worker, cache offline et version de cache.
- `manifest.webmanifest` : definition PWA.
- `styles.css` : styles applicatifs.
- `fonts.css` : declaration des polices locales.
- `vendor/` : React local.
- `fonts/` : polices locales.
- `icons/` : icones PWA.

## Service worker et version

La version courante est :

```text
V20260619_1919
```

Elle est synchronisee dans :

- `index.html` ;
- `sw.js` ;
- `src/app.js` ;
- `app.js`.

Le cache du service worker utilise cette version pour construire son nom de cache.

Si une nouvelle version est publiee sans changer la version, un navigateur ou un telephone peut continuer a servir l'ancien cache.

Pour une livraison, utiliser :

```bash
npm run build VYYYYMMDD_HHMM
```

Exemple :

```bash
npm run build V20260619_1919
```

## Commandes

Installer les dependances n'est normalement pas necessaire pour l'app elle-meme, car React est local dans `vendor/`.

Commandes disponibles :

```bash
npm run build
npm test
npm run test:helpers
npm run test:rules
npm run test:game-state
npm run test:storage
npm run test:encoding
npm run test:functional
npm run test:a11y-mobile
```

Build simple :

```bash
npm run build
```

Build de livraison :

```bash
npm run build VYYYYMMDD_HHMM
```

Tests complets :

```bash
npm test
```

## Tests

Nombre de suites appelees par `npm test` : 7.

Suites actuelles :

| Suite | Fichier | Role |
|---|---|---|
| `test:helpers` | `scripts/test-helpers.js` | Verifie constantes et formatages. |
| `test:rules` | `scripts/test-rules.js` | Verifie les regles pures du Molkky. |
| `test:game-state` | `scripts/test-game-state.js` | Verifie les transitions de partie. |
| `test:storage` | `scripts/test-storage.js` | Verifie `localStorage`, historique et nettoyage. |
| `test:encoding` | `scripts/test-encoding.js` | Detecte les problemes d'encodage/mojibake. |
| `test:functional` | `scripts/test-functional.js` | Lance un serveur local et teste l'app dans Chromium via Playwright. |
| `test:a11y-mobile` | `scripts/test-a11y-mobile.js` | Verifie viewport mobile, cibles tactiles, focus clavier et historique au clavier. |

Parcours fonctionnels couverts :

- nouvelle partie ;
- libelle de partie ;
- reordonnancement des equipes avant lancement ;
- lancer ;
- annulation ;
- rate ;
- victoire ;
- historique ;
- depassement avec grace ;
- penalite de depassement ;
- victoire par elimination ;
- reload offline via service worker ;
- absence de debordement horizontal en viewport mobile ;
- cibles tactiles minimales ;
- focus clavier visible ;
- ouverture d'une partie d'historique au clavier.

Point Playwright important :

- pour les boutons de quille, utiliser un selecteur exact ;
- `Quille 1` matche aussi `Quille 10`, `Quille 11`, `Quille 12` si le selecteur est trop large.

## Stockage local

L'application utilise `localStorage`.

Elle stocke notamment :

- la partie en cours ;
- l'historique des parties ;
- les informations necessaires a la reprise.

Le module `storage.js` lit les donnees defensivement :

- si une valeur est absente, il retourne une valeur neutre ;
- si une valeur est corrompue, il evite de casser l'application ;
- il expose aussi des helpers de nettoyage et d'estimation de taille.

## Publication GitHub Pages

Il faut publier tout le dossier applicatif.

Ne pas publier uniquement :

- `index.html` ;
- `sw.js`.

Publier au minimum :

- `index.html`
- `sw.js`
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
- `styles.css`
- `fonts.css`
- `manifest.webmanifest`
- `vendor/`
- `fonts/`
- `icons/`

Publier aussi de preference :

- `src/`
- `scripts/`
- `package.json`
- `README.md`

Ces fichiers ne sont pas tous indispensables a l'execution dans le navigateur, mais ils sont indispensables pour maintenir correctement le projet.

## Checklist avant publication

1. Generer une version de livraison :

```bash
npm run build VYYYYMMDD_HHMM
```

2. Verifier que la version est synchronisee :

- `index.html`
- `sw.js`
- `src/app.js`
- `app.js`

3. Lancer les tests :

```bash
npm test
```

4. Verifier que tous les assets references existent.

5. Publier le dossier complet sur GitHub Pages.

6. Tester l'URL GitHub Pages :

- chargement initial ;
- nouvelle partie ;
- victoire ;
- historique ;
- reload ;
- offline si possible ;
- mobile si possible.

## Historique des evolutions

| Version / moment | Resume |
|---|---|
| Audit initial | Identification des risques : app monolithique, Babel/CDN, service worker fragile, undo/rematch incomplets, manque de tests. |
| Etape 1 | Correction de la coherence d'annulation, rematch, timers et restauration d'etat. |
| Etape 2 | Passage vers une architecture maintenable : assets locaux, CSS externe, build, modules `src/`. |
| Etape 3 | Extraction progressive de `rules`, `storage`, `constants`, `formatters`, composants, dialogs, setup screen, game components. |
| Etape 4 | Extraction du moteur de partie dans `game-state`, ajout de transitions pures et tests dedies. |
| Etape 5 | Ajout de tests fonctionnels Playwright sur les parcours critiques, y compris depassement, elimination et offline. |
| Livraison | Generation de `V20260617_1207`, verification assets, `npm test` complet OK. |
| Carnet de bord | README promu comme documentation officielle a maintenir a chaque evolution. |
| V20260619_1315 | Accueil plus sobre, actions historique/reglages deplacees en secondaire, libelle de partie et reordonnancement des equipes avant lancement. |
| V20260619_1819 | Passe mobile/accessibilite : focus visible, cibles tactiles 44px, historique ouvrable au clavier et test automatise dedie. |
| V20260619_1850 | Reequilibrage de l'ecran de jeu : scoreboard compact, tour plus visible, panneau de lancer renforce, grille de quilles 4x3 et actions basses resserrees. |
| V20260619_1919 | Nettete du nom d'equipe actif : reduction du halo, round separe en badge et titre de tour plus lisible. |

## Comment maintenir ce README

A chaque evolution, mettre a jour :

- la version documentee ;
- la description de ce qui existe ;
- le nombre de tests si une suite ou un scenario change ;
- l'historique des evolutions ;
- les tableaux de suivi ci-dessous.

Les tableaux ci-dessous sont le suivi officiel.

## Tableau de suivi - Technique et architecture

| Sujet | Description | Statut | Priorite | Version / remarque |
|---|---|---|---|---|
| Audit initial | Identifier les risques techniques et les zones sensibles de l'app. | Fait | Haute | Point de depart de la refonte. |
| Correction undo/rematch | Restaurer score, rates, elimination, round, teamBefore et eviter les timers obsoletes. | Fait | Haute | Corrige avant modularisation lourde. |
| Suppression Babel/CDN | Ne plus dependre de Babel et de CDN au runtime. | Fait | Haute | React local dans `vendor/`. |
| Assets locaux | Ajouter React, polices, icones et manifest localement. | Fait | Haute | Necessaire pour PWA autonome. |
| Extraction CSS | Sortir les styles de `index.html` vers `styles.css`. | Fait | Haute | Rend `index.html` maintenable. |
| Build workflow | Ajouter `scripts/build.js` et synchroniser les fichiers generes. | Fait | Haute | Commande : `npm run build`. |
| Version PWA | Synchroniser `APP_VERSION` entre `index.html`, `sw.js`, `src/app.js`, `app.js`. | Fait | Haute | Version actuelle `V20260619_1919`. |
| Service worker | Mettre en cache les assets locaux et permettre reload offline. | Fait | Haute | Teste via Playwright. |
| Decoupage `rules.js` | Extraire les regles pures du Molkky. | Fait | Haute | Teste par `test:rules`. |
| Decoupage `storage.js` | Extraire la persistance `localStorage`. | Fait | Haute | Teste par `test:storage`. |
| Decoupage constants/formatters | Sortir constantes et formatage dates/durees. | Fait | Moyenne | Teste par `test:helpers`. |
| Decoupage composants generiques | Extraire `FieldDiagram`, `ChipSelect`, `Toggle`. | Fait | Moyenne | Module `components.js`. |
| Decoupage dialogs | Extraire `RulePopup`, `EventPopup`, `AbandonModal`. | Fait | Moyenne | Module `dialogs.js`. |
| Decoupage setup screen | Extraire l'ecran de configuration de partie. | Fait | Moyenne | Module `setup-screen.js`. |
| Decoupage game components | Extraire scoreboard et panneau de tour. | Fait | Haute | Module `game-components.js`. |
| Moteur `game-state` | Extraire transitions lancer, rate, annulation et reactions metier. | Fait | Haute | Teste par `test:game-state`. |
| Tests unitaires | Couvrir helpers, regles, moteur et stockage. | Fait | Haute | 4 suites unitaires metier + encodage. |
| Tests fonctionnels | Couvrir parcours navigateur critiques. | Fait | Haute | `test:functional`, Playwright. |
| Test encodage | Eviter le retour de texte mojibake. | Fait | Haute | `test:encoding`. |
| Verification assets | Verifier que les references HTML/SW existent. | Fait | Haute | Controle fait avant livraison `V20260619_1919`. |
| README carnet de bord | Documenter fonctionnement, structure, suivi et historique. | Fait | Haute | Ce fichier est la reference officielle. |
| Accueil plus sobre | Retirer les actions historique/reglages de l'en-tete et les presenter comme actions secondaires. | Fait | Moyenne | Ajoute en `V20260619_1315`. |
| Test mobile/accessibilite | Automatiser controles viewport mobile, focus, cibles tactiles et clavier. | Fait | Haute | Suite `test:a11y-mobile`, ajoutee en `V20260619_1819`. |
| Ecran de jeu compact | Reequilibrer les zones de score, tour, quilles et actions sur mobile. | Fait | Haute | Grille 4x3 en portrait, ajout en `V20260619_1850`. |
| Extraire `WinScreen` | Sortir l'ecran de victoire de `src/app.js`. | A faire | Moyenne | Utile pour reduire `app.js`, pas bloquant. |
| Extraire historique/stats | Sortir `HistoryScreen`, `GameDetailScreen`, `PlayerStatsScreen`. | A faire | Moyenne | Bon prochain chantier structurel. |
| Extraire settings/home | Sortir `SettingsScreen` et `HomeScreen`. | Moyen terme | Moyenne | Nettoyage de lisibilite. |
| Refondre en bundler moderne | Passer a Vite/React modules ES. | A eviter pour l'instant | Basse | Trop gros changement avant besoin reel. |
| Refonte complete UI | Repenser toute l'interface. | A eviter pour l'instant | Basse | Risque eleve, valeur faible a court terme. |
| Tests accessibilite | Ajouter controles focus/clavier/contrastes. | Partiel | Moyenne | Focus/clavier/cibles tactiles automatises ; contrastes a approfondir. |
| Audit mobile reel | Tester installation mobile et offline sur telephone. | A faire | Haute | Complement manuel aux tests Playwright mobile. |

## Tableau de suivi - Gameplay et usage

| Sujet | Description | Statut | Priorite | Version / remarque |
|---|---|---|---|---|
| Nouvelle partie | Demarrer une partie depuis l'accueil. | Fait | Haute | Test fonctionnel existant. |
| Equipes 2 a 6 | Ajouter, retirer et renommer les equipes. | Fait | Haute | Configure dans `setup-screen.js`. |
| Libelle de partie | Nommer une partie et retrouver ce libelle dans l'historique/detail. | Fait | Moyenne | Ajoute et teste en `V20260619_1315`. |
| Ordre de passage | Reordonner les equipes avant le lancement avec des boutons monter/descendre. | Fait | Haute | Ajoute et teste en `V20260619_1315`. |
| Couleurs equipe | Couleurs automatiques par equipe. | Fait | Moyenne | Constantes dans `constants.js`. |
| Handicap | Donner des points de depart a une equipe. | Fait | Moyenne | Present dans setup. |
| Score cible | Choisir 30, 40, 50 ou 75. | Fait | Haute | 50 reste le mode officiel. |
| Ecran de lancer | Mettre en valeur le joueur courant, le score du lancer et l'etat apres lancer. | Fait | Haute | Panneau compact renforce en `V20260619_1850`, nom actif clarifie en `V20260619_1919`. |
| Calcul lancer | Une quille = numero, plusieurs quilles = nombre. | Fait | Haute | Teste par `test:rules`. |
| Lancer rate | Bouton rate, 0 point, avance au joueur suivant. | Fait | Haute | Test fonctionnel existant. |
| Elimination par rates | Eliminer apres N rates consecutifs. | Fait | Haute | Teste en moteur et Playwright. |
| Limite de rates | Choisir 2, 3 ou 4 rates. | Fait | Moyenne | Configure dans setup. |
| Victoire par score exact | Gagner en atteignant exactement le score cible. | Fait | Haute | Test fonctionnel existant. |
| Victoire par elimination | Gagner quand une seule equipe reste active. | Fait | Haute | Test fonctionnel ajoute. |
| Depassement retour 25 | Penalite officielle. | Fait | Haute | Teste via depassement penalise. |
| Depassement retour 0 | Mode severe. | Fait | Moyenne | Teste unitairement dans `rules`. |
| Depassement moitie | Penalite proportionnelle. | Fait | Moyenne | Teste unitairement dans `rules`. |
| Depassement ignore | Mode debutant. | Fait | Moyenne | Teste dans moteur/regles. |
| Essais de grace | Autoriser un ou plusieurs depassements avant penalite. | Fait | Haute | Test fonctionnel ajoute. |
| Popup depassement | Expliquer grace ou penalite de depassement. | Fait | Moyenne | `EventPopup`. |
| Popup elimination | Expliquer l'elimination par rates. | Fait | Moyenne | `EventPopup`. |
| Annuler dernier lancer | Restaurer l'etat precedent complet. | Fait | Haute | Teste moteur et fonctionnel. |
| Revanche | Relancer avec etat frais. | Fait | Haute | Corrige pendant les premieres etapes. |
| Sauvegarde partie en cours | Reprendre apres reload. | Fait | Haute | Via `localStorage`. |
| Historique parties | Consulter les parties terminees. | Fait | Moyenne | Test fonctionnel existant. |
| Statistiques joueurs | Afficher stats globales par joueur/equipe. | Fait | Moyenne | Present dans l'app. |
| Mode offline | Recharger l'app hors connexion apres cache. | Fait | Haute | Test fonctionnel existant. |
| Aide sur les regles | Popups d'aide sur elimination, handicap, depassement. | Fait | Moyenne | Present dans setup. |
| Accessibilite clavier | Verifier navigation clavier et focus visible. | Partiel | Moyenne | Focus visible et historique clavier testes en `test:a11y-mobile`. |
| Lisibilite mobile terrain | Tester sur vrais petits ecrans. | Partiel | Moyenne | Viewport 320px automatise et ecran jeu reequilibre ; vrai appareil encore a faire. |
| Sons/vibrations | Ajouter retours sensoriels. | Moyen terme | Basse | Pas prioritaire. |
| Export historique | Export CSV/JSON des parties. | Moyen terme | Basse | Idee future utile. |
| Mode tournoi | Gerer plusieurs parties/classement tournoi. | Moyen terme | Basse | Nouvelle fonctionnalite importante, a cadrer. |
| Multi-appareil temps reel | Synchroniser plusieurs telephones. | A eviter pour l'instant | Basse | Exigerait backend ou service externe. |
