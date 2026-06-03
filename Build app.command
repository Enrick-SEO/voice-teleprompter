#!/bin/bash
# Reconstruit l'application « Voice Teleprompter » et la (re)place sur le Bureau.
# À lancer après toute modification de l'outil. (1re fois : clic droit > Ouvrir)
set -e
cd "$(dirname "$0")"

APP="Voice Teleprompter.app"
DEST="$HOME/Desktop/$APP"

echo "1/4  Installation des dépendances (si besoin)…"
[ -d "node_modules/electron" ] || npm install

echo "2/4  Packaging de l'application…"
npm run package

echo "3/4  Signature locale…"
# Retrouve l'app construite quel que soit le processeur (arm64 ou x64).
# On utilise un motif *.app (insensible à la normalisation Unicode du « Ç »).
BUILT="$(ls -d dist/*/*.app 2>/dev/null | head -1)"
[ -n "$BUILT" ] || { echo "❌ Build introuvable dans dist/"; exit 1; }
codesign --force --deep --sign - "$BUILT"

echo "4/4  Copie sur le Bureau…"
rm -rf "$DEST"
ditto "$BUILT" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

echo ""
echo "✅ Terminé ! « Voice Teleprompter » est à jour sur votre Bureau."
echo "   (Vous pouvez fermer cette fenêtre.)"
