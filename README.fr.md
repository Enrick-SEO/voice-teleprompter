[English](README.md) · **Français**

# 🎬 Voice Teleprompter

Une fenêtre flottante, transparente et toujours au-dessus des autres apps, pour lire un script vidéo face caméra — avec **défilement automatique au micro** (le texte avance quand vous parlez, se met en pause quand vous faites une pause).

> ℹ️ L'interface de l'application est en **français**.

---

## 🚀 Lancer l'application

**Le plus simple :** double-cliquez sur l'icône **« Voice Teleprompter »** sur votre **Bureau**.
> La toute première fois : **clic droit → Ouvrir** (pour passer l'avertissement macOS), puis macOS demandera l'accès au **microphone** → **acceptez** (nécessaire pour le défilement vocal). Ensuite, un simple double-clic suffit.

**Autres façons de lancer** (depuis ce dossier) :
- Double-cliquez sur `Run dev mode.command` (mode développement)
- Ou en terminal : `npm install` (1re fois) puis `npm start`

> Si vous refusez le micro par erreur : *Réglages Système → Confidentialité et sécurité → Microphone* → activez « Voice Teleprompter ».

### 🔁 Mettre à jour l'app du Bureau
Si l'outil est modifié, double-cliquez sur **`Build app.command`** : il repackage « Voice Teleprompter » et le replace à jour sur votre Bureau.

---

## 🎛️ Fonctionnalités

| Fonction | Comment |
|---|---|
| **Coller / mettre en forme votre script** | Bouton **✎ Texte** → collez votre texte, mettez-le en forme → **Enregistrer** |
| **Transparence du fond** | Curseur **Opacité fond** (0 % = totalement transparent, vous voyez tout derrière) |
| **Couleur du texte** | Sélecteur **Couleur** dans la barre (couleur par défaut de tout le texte) |
| **Transparence du texte** | Curseur **Opacité texte** |
| **Taille du texte** | Boutons **A− / A+** (ou touches `+` / `−`) |
| **Police** | Menu **Police** — **Lexend** par défaut (+ Inter, Montserrat, Roboto, etc.) |
| **Défilement automatique (voix)** | Mode **🎙 Voix** : le texte avance pendant que vous parlez, se met en pause quand vous vous arrêtez |
| **Vitesse** | Curseur **Vitesse** (allure constante en Manuel ; allure pendant que vous parlez en Voix) |
| **Mode miroir** | Bouton **⇄** (pour les téléprompteurs à vitre/réflexion) |
| **Mode verrouillé (clic-à-travers)** | Bouton **🔓** ou `⌘⇧L` : **masque toute la barre**, rend la fenêtre transparente aux clics |
| **Surbrillance ligne en cours** | Menu **⚙** : la ligne lue reste nette, le reste est atténué |
| **Temps de lecture + progression** | Affichés en bas (⏱ restant / total) — basés sur le nombre de mots |
| **Didascalies (notes non lues)** | Mettez vos notes entre `[crochets]` : affichées en orange, exclues du minutage |
| **Position de la ligne / largeur / interligne** | Menu **⚙** : réglages d'affichage |
| **Déplacer la fenêtre** | Glissez la **barre du haut** |
| **Redimensionner** | Tirez les **bords** de la fenêtre |

### ✍️ Mise en forme du texte (éditeur)
Dans **✎ Texte**, sélectionnez un mot ou une phrase puis utilisez la barre d'outils :
- **G** gras · **I** italique · **S** souligné
- **A** (couleur) : colore le texte sélectionné · **▍** (surligneur) : surligne le texte sélectionné
- **⌫ Format** : efface la mise en forme de la sélection
- **↵ Joindre** : retire les sauts de ligne inutiles (ceux du copier-coller) en joignant les lignes, **tout en gardant les paragraphes** (séparés par une ligne vide). Annulable avec `⌘Z`.

> 💡 Le collage colle toujours en **texte brut** (sans la mise en forme d'origine). Pour nettoyer un texte déjà collé : **↵ Joindre** (sauts de ligne) et/ou **⌫ Format** (couleurs/gras).

Vous pouvez ainsi mettre en évidence les mots à accentuer, les transitions, etc. La mise en forme est enregistrée avec le script.

### 🎯 Aides à la lecture (menu ⚙)

- **Didascalies / notes non lues** — écrivez vos indications de tournage entre **crochets**, par ex. `[montrer l'écran]`, `[zoom sur le panier]`. Elles s'affichent en **orange italique** (vous les repérez d'un coup d'œil sans les lire à voix haute) et **ne comptent pas** dans le temps de lecture.
- **Surbrillance de la ligne en cours** — la ligne au niveau du repère reste bien nette, les autres sont légèrement atténuées → vous ne perdez jamais votre place. (Activable/désactivable dans **⚙**.)
- **Temps de lecture + barre de progression** — en bas à gauche : **⏱ temps restant / temps total** estimés (≈ 150 mots/min), et une barre de progression sur le bord bas. Masquables dans **⚙**.
- **Position de la ligne de lecture** — placez le repère plus haut ou plus bas (jusqu'en haut de la fenêtre, pour rester près de la caméra).
- **Largeur du texte** — réduisez la largeur pour des lignes plus courtes (lecture plus fluide, moins de balayage des yeux).
- **Interligne** — espacement entre les lignes.

### 🔒 Mode verrouillé
Quand vous activez le verrou (bouton **🔓** ou `⌘⇧L`) : **toute la barre du haut disparaît**, et la fenêtre devient **transparente aux clics** — vous voyez parfaitement les fenêtres derrière et vous cliquez « à travers » l'app (montage, navigateur…) sans qu'elle gêne, tout en gardant le script affiché.

Pour déverrouiller, une petite **pastille « Débloquer »** apparaît (par défaut en haut à droite de l'écran) :
- **Cliquez-la** pour déverrouiller.
- **Glissez-la** pour la déplacer où vous voulez (par ex. hors du cadre de votre enregistrement).
- Le raccourci **`⌘⇧L`** fonctionne toujours en secours.

### Les deux modes de défilement

- **🎙 Voix (automatique)** — Le téléprompteur écoute votre micro : il fait défiler le texte tant que vous parlez et **se met en pause dès que vous faites une pause** (pour réfléchir, respirer, refaire une prise). L'allure pendant que vous parlez se règle avec le curseur **Vitesse**. C'est le mode le plus naturel : le texte suit votre rythme de parole.
- **Manuel** — Défilement à vitesse constante que vous réglez avec le curseur **Vitesse**.

---

## ⌨️ Raccourcis clavier

| Touche | Action |
|---|---|
| `Espace` | Lecture / Pause |
| `↑` / `↓` | Reculer / avancer le texte |
| Molette souris | Repositionner le texte |
| `+` / `−` | Agrandir / réduire le texte |
| `M` | Mode miroir |
| `E` | Modifier le script |
| `Échap` | Stopper le défilement |
| `⌘⇧L` | **Verrouiller / déverrouiller** la fenêtre (mode « clic-à-travers » : les clics passent vers l'app derrière) |

---

## 🔧 Réglages mémorisés

Vos préférences (script, taille, police, opacité, vitesse, mode) sont **enregistrées automatiquement** et rechargées au prochain lancement.

---

## ❓ Dépannage

- **« Le défilement vocal ne réagit pas »** → vérifiez l'autorisation micro (Réglages Système → Confidentialité → Microphone), et que le bon micro est sélectionné dans les Réglages Son de macOS. L'indicateur de niveau (barre verte/rouge) dans la barre du haut doit bouger quand vous parlez.
- **« La fenêtre ne se met pas au-dessus d'une app en plein écran »** → macOS limite parfois cela ; sortez l'app cible du vrai plein écran (utilisez une fenêtre maximisée plutôt que le plein écran natif).
- **« Le sélecteur de couleur ne s'ouvre pas »** → l'app utilise une palette intégrée (pas le sélecteur macOS natif, qui ne s'ouvre pas derrière une fenêtre toujours-au-dessus).

---

## 🛠️ Construire depuis les sources

Prérequis : **macOS** + **[Node.js](https://nodejs.org)** (≥ 18).

```bash
npm install        # installe les dépendances (Electron est épinglé à la v33)
npm start          # lance en mode développement
npm run package    # construit l'app « Voice Teleprompter.app » dans dist/
```

Le plus simple reste de double-cliquer sur **`Build app.command`** (build + signature locale + copie sur le Bureau).

> ⚠️ Electron est volontairement **épinglé à la v33** : la v42 plante au démarrage sur macOS récent.

---

*Développé avec Electron. Léger, local, aucune donnée envoyée sur Internet (hormis le chargement initial des polices Google Fonts). Licence [MIT](LICENSE).*
