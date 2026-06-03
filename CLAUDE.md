# Ça téléprompt — application téléprompteur pour Mac (Electron)

Téléprompteur macOS : fenêtre flottante transparente toujours au-dessus, défilement
automatique au micro (détection de voix), mise en forme du texte, surbrillance de la
ligne en cours, temps de lecture, etc. Voir `README.md` pour le mode d'emploi complet.

## 🤖 Si tu es l'assistant IA chargé d'installer ce projet

Objectif : installer puis construire l'app « Ça téléprompt » et la placer sur le Bureau,
prête à double-cliquer. Cette app n'est PAS sur l'App Store : on la construit localement
(c'est normal, et ça évite tout blocage de sécurité macOS).

### Étapes

1. Vérifier Node.js : `node --version` (besoin de ≥ 18).
   - Si absent : proposer `brew install node` (ou télécharger sur https://nodejs.org).
2. Construire + installer sur le Bureau, au choix :
   - **Le plus simple** : demander à l'utilisateur de double-cliquer sur
     `Reconstruire l'app.command` (1re fois : clic droit → Ouvrir).
   - **Ou en ligne de commande**, depuis ce dossier :
     ```bash
     npm install
     npm run package
     APP="Ça téléprompt.app"
     BUILT="$(ls -d dist/*/*.app 2>/dev/null | head -1)"   # motif *.app : insensible à l'Unicode du « Ç »
     codesign --force --deep --sign - "$BUILT"
     ditto "$BUILT" "$HOME/Desktop/$APP"
     xattr -dr com.apple.quarantine "$HOME/Desktop/$APP"
     ```
3. Pour juste tester sans construire : `npm install` puis `npm start`.

Le build s'adapte automatiquement au processeur du Mac (Apple Silicon ou Intel).
Au 1er lancement, macOS demandera l'accès au micro → accepter (nécessaire pour le
défilement vocal).

## ⚠️ Important (ne pas casser)

- **Electron est épinglé à la v33** dans `package.json`. NE PAS faire
  `npm install electron@latest` : Electron 42 plante au démarrage (assertion native du
  lexer CommonJS, SIGTRAP) avant d'ouvrir la fenêtre.
- Le défilement se fait via `transform: translateY` (PAS `scrollTop`) — voir commentaires
  dans `renderer.js`.
- Les sélecteurs de couleur sont une **palette intégrée** (`#palette`), pas
  `<input type="color">` (le picker natif ne s'ouvre pas derrière une fenêtre
  toujours-au-dessus).
- Le micro nécessite `NSMicrophoneUsageDescription` (déjà dans `assets/mac-extra.plist`).
- 100 % local, aucune donnée envoyée (hormis le chargement des polices Google Fonts).

## Structure

- `main.js` / `preload.js` — process principal Electron (fenêtre, permissions, raccourci global)
- `index.html` / `styles.css` / `renderer.js` — interface et logique du téléprompteur
- `assets/` — icône (`icon.icns`/`icon.png`) et `mac-extra.plist` (permission micro)
- `Reconstruire l'app.command` — build + signature + copie sur le Bureau (double-clic)
- `Lancer le téléprompteur.command` — lance en mode développement (double-clic)
