**English** · [Français](README.fr.md)

# 🎬 Ça téléprompt — voice teleprompter for macOS

A floating, transparent, always-on-top teleprompter to read a video script straight to camera — with **hands-free voice scrolling** (the text advances while you speak and pauses when you pause).

> ℹ️ The app's interface is in **French** (it was built for a French-speaking creator). This README is available in [English](README.md) and [Français](README.fr.md).

---

## ✨ Highlights

- **Transparent, always-on-top window** — see (and click) whatever is behind it.
- **Voice scrolling** — listens to your mic; scrolls while you talk, pauses on silence.
- **Manual mode** — constant, adjustable scroll speed.
- **Rich-text scripts** — bold, italic, underline, text color, highlighter.
- **Reading aids** — current-line highlight, estimated reading time + progress bar, and "stage directions" you don't read aloud.
- **Click-through lock** — hides the toolbar and lets clicks pass through to the app behind, with a draggable **"Unlock" pill** to come back.
- **100% local** — no data leaves your machine (apart from the initial Google Fonts download).

---

## 🚀 Getting started

The app is **not on the App Store** — you build it locally (this is normal and avoids Gatekeeper warnings).

**Requirements:** **macOS** + **[Node.js](https://nodejs.org)** (≥ 18).

```bash
npm install        # install dependencies (Electron is pinned to v33 — see note below)
npm start          # run in development mode
npm run package    # build "Ça téléprompt.app" into dist/
```

The easiest way to get a double-clickable app: run **`Reconstruire l'app.command`** ("Rebuild the app" — double-click it). It builds, ad-hoc signs, and copies **`Ça téléprompt.app`** to your Desktop.

On first launch, macOS asks for **microphone** access → **allow it** (required for voice scrolling). If you used a packaged `.app` from someone else: right-click → **Open** the first time.

> 🤖 Sharing with someone who uses an AI assistant (Claude, etc.)? Send them this repo — `CLAUDE.md` tells the assistant exactly how to install and build it.

---

## 🎛️ Features

| Feature | How |
|---|---|
| **Paste / format your script** | **✎ Texte** button → paste your text, format it → **Enregistrer** (Save) |
| **Background transparency** | **Opacité fond** slider (0% = fully transparent, you see everything behind) |
| **Text color** | **Couleur** picker in the toolbar (default color of the whole text) |
| **Text transparency** | **Opacité texte** slider |
| **Text size** | **A− / A+** buttons (or `+` / `−` keys) |
| **Font** | **Police** menu — **Lexend** by default (+ Inter, Montserrat, Roboto, etc.) |
| **Auto-scroll (voice)** | **🎙 Voix** mode: the text advances while you speak, pauses when you stop |
| **Speed** | **Vitesse** slider (constant in Manual; pace-while-speaking in Voice) |
| **Mirror mode** | **⇄** button (for beam-splitter / reflective teleprompters) |
| **Click-through lock** | **🔓** button or `⌘⇧L`: **hides the whole toolbar**, makes the window click-through |
| **Current-line highlight** | **⚙** menu: the line being read stays sharp, the rest is dimmed |
| **Reading time + progress** | Shown at the bottom (⏱ remaining / total) — based on word count |
| **Stage directions (not read)** | Put notes in `[brackets]`: shown in orange, excluded from timing |
| **Reading-line position / width / line height** | **⚙** menu: display settings |
| **Move the window** | Drag the **top bar** |
| **Resize** | Drag the **window edges** |

### ✍️ Text formatting (editor)
In **✎ Texte**, select a word or sentence then use the toolbar:
- **G** bold · **I** italic · **S** underline
- **A** (color): colors the selected text · **▍** (highlighter): highlights the selected text
- **⌫ Format**: clears formatting from the selection
- **↵ Joindre** ("Join lines"): removes unnecessary line breaks (the ones from copy-paste) by joining lines together, **while keeping paragraphs** (separated by a blank line). Undo with `⌘Z`.

> 💡 Pasting always inserts **plain text** (no imported formatting). To clean up already-pasted text: **↵ Joindre** (line breaks) and/or **⌫ Format** (colors/bold).

### 🎯 Reading aids (⚙ menu)

- **Stage directions / unread notes** — write your shooting cues in **brackets**, e.g. `[show the screen]`, `[zoom on the cart]`. They appear in **italic orange** (easy to spot without reading them aloud) and **don't count** toward the reading time.
- **Current-line highlight** — the line at the reading marker stays sharp while the others dim slightly, so you never lose your place. (Toggle in **⚙**.)
- **Reading time + progress bar** — bottom-left: estimated **⏱ remaining / total** (≈ 150 wpm) and a progress bar along the bottom edge.
- **Reading-line position** — place the marker higher or lower (all the way to the top of the window, to stay close to the camera).
- **Text width** — narrow it for shorter lines (smoother reading, less eye sweep).
- **Line height** — spacing between lines.

### 🔒 Locked mode (click-through)
When you lock (**🔓** button or `⌘⇧L`): **the whole top bar disappears** and the window becomes **click-through** — you see the windows behind perfectly and click "through" the app (editor, browser…) without it getting in the way, while the script stays visible.

To unlock, a small **"Débloquer" (Unlock) pill** appears (top-right of the screen by default):
- **Click it** to unlock.
- **Drag it** to move it anywhere (e.g. out of your recording frame).
- The **`⌘⇧L`** shortcut still works as a fallback.

### The two scrolling modes

- **🎙 Voice (automatic)** — the teleprompter listens to your mic: it scrolls while you talk and **pauses as soon as you pause** (to think, breathe, redo a take). The pace while you speak is set with the **Vitesse** (Speed) slider. The most natural mode — the text follows your speaking rhythm.
- **Manual** — constant scroll speed you set with the **Vitesse** slider.

---

## ⌨️ Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `↑` / `↓` | Move the text back / forward |
| Mouse wheel | Reposition the text |
| `+` / `−` | Increase / decrease text size |
| `M` | Mirror mode |
| `E` | Edit the script |
| `Esc` | Stop scrolling |
| `⌘⇧L` | **Lock / unlock** the window (click-through mode) |

---

## 🔧 Saved settings

Your preferences (script, size, font, opacity, speed, mode, display settings) are **saved automatically** and restored on the next launch.

---

## 🧩 Tech notes

- Built with **[Electron](https://www.electronjs.org/)**. Lightweight and fully local.
- Electron is intentionally **pinned to v33**: v42 crashes on launch on recent macOS (native CommonJS-lexer assertion).
- Scrolling uses a CSS `transform` (not `scrollTop`) so it never stalls when the mic meter repaints the bar.
- Color pickers use an in-app palette (the native macOS picker won't open behind an always-on-top window).

---

## 📄 License

[MIT](LICENSE) © Enrick Pellegrin
