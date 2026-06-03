#!/bin/bash
# Double-cliquez sur ce fichier pour lancer le téléprompteur.
# (La première fois : clic droit > Ouvrir, pour passer l'avertissement macOS.)
cd "$(dirname "$0")" || exit 1

# Installe les dépendances si besoin (première utilisation)
if [ ! -d "node_modules/electron" ]; then
  echo "Première installation en cours…"
  npm install || { echo "Échec de l'installation. Avez-vous Node.js ? https://nodejs.org"; read -r; exit 1; }
fi

echo "Lancement du téléprompteur…"
npm start
