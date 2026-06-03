# Ça téléprompt — teleprompter app for macOS (Electron)

A macOS teleprompter: floating transparent always-on-top window, hands-free voice
scrolling (mic detection), rich-text formatting, current-line highlight, reading time,
etc. See `README.md` for the full user guide.

## 🤖 If you are the AI assistant asked to install this project

Goal: install, then build the "Ça téléprompt" app and place it on the Desktop, ready to
double-click. This app is NOT on the App Store — you build it locally (this is normal and
avoids macOS Gatekeeper warnings).

### Steps

1. Check Node.js: `node --version` (need ≥ 18).
   - If missing: suggest `brew install node` (or download from https://nodejs.org).
2. Build + install on the Desktop, either:
   - **Easiest**: ask the user to double-click `Reconstruire l'app.command`
     (first time: right-click → Open).
   - **Or via the command line**, from this folder:
     ```bash
     npm install
     npm run package
     APP="Ça téléprompt.app"
     BUILT="$(ls -d dist/*/*.app 2>/dev/null | head -1)"   # *.app glob: avoids the "Ç" Unicode normalization issue
     codesign --force --deep --sign - "$BUILT"
     ditto "$BUILT" "$HOME/Desktop/$APP"
     xattr -dr com.apple.quarantine "$HOME/Desktop/$APP"
     ```
3. To just try it without building: `npm install` then `npm start`.

The build automatically targets the Mac's CPU (Apple Silicon or Intel).
On first launch, macOS asks for microphone access → accept it (required for voice
scrolling).

## ⚠️ Important (do not break)

- **Electron is pinned to v33** in `package.json`. DO NOT run
  `npm install electron@latest`: Electron 42 crashes on launch (native CommonJS lexer
  assertion, SIGTRAP) before the window even opens.
- Scrolling uses `transform: translateY` (NOT `scrollTop`) — see the comments in
  `renderer.js` (an `overflow:hidden` container's `scrollTop` gets reset to 0 on every
  reflow, which froze the text in voice mode).
- Color pickers use an **in-app palette** (`#palette`), not `<input type="color">`
  (the native picker won't open behind an always-on-top window).
- The mic requires `NSMicrophoneUsageDescription` (already in `assets/mac-extra.plist`).
- 100% local, no data sent out (apart from loading Google Fonts).

## Structure

- `main.js` / `preload.js` — Electron main process (windows, permissions, global shortcut, unlock pill)
- `index.html` / `styles.css` / `renderer.js` — teleprompter UI and logic
- `pill.html` / `pill.js` — the floating "Unlock" pill window (shown when locked)
- `assets/` — icon (`icon.icns`/`icon.png`) and `mac-extra.plist` (mic permission)
- `Reconstruire l'app.command` — build + sign + copy to the Desktop (double-click)
- `Lancer le téléprompteur.command` — run in development mode (double-click)
