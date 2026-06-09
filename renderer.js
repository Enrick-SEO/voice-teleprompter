// ============================================================
//  Téléprompteur — logique principale
// ============================================================

const $ = (sel) => document.querySelector(sel);

const els = {
  bar: $('#bar'),
  viewport: $('#viewport'),
  content: $('#content'),
  readingLine: $('#readingLine'),
  playBtn: $('#playBtn'),
  modeGroup: $('#modeGroup'),
  speed: $('#speed'),
  speedGroup: $('#speedGroup'),
  voiceGroup: $('#voiceGroup'),
  micSelect: $('#micSelect'),
  micSensitivity: $('#micSensitivity'),
  meterFill: $('#meterFill'),
  voiceState: $('#voiceState'),
  fontMinus: $('#fontMinus'),
  fontPlus: $('#fontPlus'),
  fontVal: $('#fontVal'),
  font: $('#font'),
  opacity: $('#opacity'),
  textColorBtn: $('#textColorBtn'),
  textColorSw: $('#textColorSw'),
  textOpacity: $('#textOpacity'),
  editBtn: $('#editBtn'),
  mirrorBtn: $('#mirrorBtn'),
  topBtn: $('#topBtn'),
  settingsBtn: $('#settingsBtn'),
  settingsPanel: $('#settingsPanel'),
  captureToggle: $('#captureToggle'),
  passClicksToggle: $('#passClicksToggle'),
  barPosGroup: $('#barPosGroup'),
  focusToggle: $('#focusToggle'),
  readingPos: $('#readingPos'),
  textWidth: $('#textWidth'),
  lineHeight: $('#lineHeight'),
  infoToggle: $('#infoToggle'),
  timeReadout: $('#timeReadout'),
  progressWrap: $('#progressWrap'),
  progressFill: $('#progressFill'),
  lockBtn: $('#lockBtn'),
  closeBtn: $('#closeBtn'),
  editor: $('#editor'),
  editorToolbar: $('#editorToolbar'),
  scriptInput: $('#scriptInput'),
  selColorBtn: $('#selColorBtn'),
  selHiliteBtn: $('#selHiliteBtn'),
  selColorIco: $('#selColorIco'),
  selHiliteIco: $('#selHiliteIco'),
  clearFmt: $('#clearFmt'),
  joinLines: $('#joinLines'),
  palette: $('#palette'),
  wordCount: $('#wordCount'),
  saveEdit: $('#saveEdit'),
  cancelEdit: $('#cancelEdit'),
};

const DEFAULT_SCRIPT = `Bienvenue dans votre téléprompteur 👋

Cliquez sur « ✎ Texte » pour coller le script de votre vidéo.

Mode « Manuel » : le texte défile à vitesse constante. Réglez la vitesse avec le curseur.

Mode « 🎙 Voix » : le texte avance pendant que vous parlez et se met en pause dès que vous faites une pause. La vitesse s'adapte automatiquement à la longueur de votre script.

Astuces :
• Espace = Lecture / Pause
• Molette = repositionner le texte
• + / − = taille du texte
• ⌘⇧L = verrouiller la fenêtre (clic-à-travers)

Bon tournage !`;

// ---------------- État + persistance ----------------
const SETTINGS_KEY = 'teleprompteur.settings';
const SCRIPT_KEY = 'teleprompteur.script';

const state = {
  playing: false,
  mode: 'manual', // 'manual' | 'voice'
  speedManual: 40, // px/seconde (plage utile 5–150)
  fontSize: 44,
  fontFamily: 'Lexend',
  panelAlpha: 0.55,
  textColor: '#ffffff', // couleur par défaut du texte
  textOpacity: 1, // transparence globale du texte (1 = opaque)
  mirror: false,
  locked: false,
  focusLine: true, // surbrillance de la ligne en cours
  readingPos: 0.38, // position verticale de la ligne de lecture (fraction)
  textWidth: 0.88, // largeur de la colonne de texte (fraction)
  lineHeight: 1.5, // interligne
  showInfo: true, // afficher temps + barre de progression
  hideFromCapture: true, // invisible à l'enregistrement d'écran (par défaut OUI)
  passClicks: false, // clic-à-travers hybride (clics passent sauf sur la barre)
  barPosition: 'top', // position de la barre d'outils : top|bottom|left|right
  micDeviceId: '', // micro choisi ('' = micro par défaut du système)
  micSensitivity: 1, // sensibilité de la détection de voix (0.5–3)
};

const BAR_POSITIONS = ['top', 'bottom', 'left', 'right'];

const WPM = 150; // mots/minute de référence pour estimer le temps de lecture

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    Object.assign(state, saved);
  } catch (e) {}
}
function saveSettings() {
  const { playing, locked, ...persist } = state;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(persist));
}

// ---------------- Rendu du script ----------------
function getScript() {
  return localStorage.getItem(SCRIPT_KEY) || DEFAULT_SCRIPT;
}
function setScript(text) {
  localStorage.setItem(SCRIPT_KEY, text);
  renderScript(text);
}

// Le script est stocké en HTML (pour la mise en forme). Un ancien script en
// texte brut est converti à la volée (sauts de ligne -> <br>).
function toHTML(raw) {
  if (/<[a-z!/][\s\S]*>/i.test(raw)) return raw; // déjà du HTML
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc.replace(/\n/g, '<br>');
}

// Découpe le HTML en « lignes » visuelles (conserve la mise en forme inline)
function htmlToLines(html) {
  const h = (html || '')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n');
  const lines = h.split('\n');
  // retire les lignes vides parasites en tête / queue (sans toucher aux sauts internes)
  while (lines.length > 1 && lines[0].trim() === '') lines.shift();
  while (lines.length > 1 && lines[lines.length - 1].trim() === '') lines.pop();
  return lines;
}

// Entoure les didascalies [entre crochets] d'un <span class="cue"> (texte non lu)
function markCues(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const txt = node.nodeValue;
    if (!/\[[^\]]+\]/.test(txt)) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    const re = /\[[^\]]+\]/g;
    let m;
    while ((m = re.exec(txt))) {
      if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'cue';
      span.textContent = m[0];
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

let totalWords = 1; // nombre de mots « lus » (hors didascalies)
function computeTotalWords() {
  const clone = els.content.cloneNode(true);
  clone.querySelectorAll('.cue').forEach((c) => c.remove());
  totalWords = Math.max(1, (clone.textContent.trim().match(/\S+/g) || []).length);
}

function renderScript(text) {
  const lines = htmlToLines(toHTML(text));
  els.content.innerHTML = lines
    .map((l) => `<div class="line">${l.trim() === '' ? '<br>' : l}</div>`)
    .join('');
  markCues(els.content);
  computeTotalWords();
  applyPadding();
  cacheLineOffsets();
  applyScroll();
}

// Espace avant/après pour que le texte commence/finisse sur la ligne de lecture
function applyPadding() {
  const h = els.viewport.clientHeight || 400;
  els.content.style.paddingTop = Math.round(h * state.readingPos) + 'px';
  els.content.style.paddingBottom = Math.round(h * 0.85) + 'px';
}

// ---------------- Boucle de défilement ----------------
let currentSpeed = 0; // px/s lissée
let lastTs = null;
let position = 0; // décalage de défilement (source de vérité, en px)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function maxScroll() {
  return Math.max(0, els.content.scrollHeight - els.viewport.clientHeight);
}

// Le défilement se fait via transform (composité GPU) et non via scrollTop :
// un conteneur overflow:hidden voit son scrollTop remis à 0 à chaque reflow
// (ex. quand l'indicateur micro met à jour la barre), ce qui figeait le texte.
function applyScroll() {
  position = clamp(position, 0, maxScroll());
  const mir = state.mirror ? ' scaleX(-1)' : '';
  els.content.style.transform = `translateY(${-position}px)${mir}`;
  updateProgress();
  updateCurrentLine();
}

function scrollTo(px) {
  position = px;
  applyScroll();
  currentSpeed = 0;
}

// ---- Surbrillance de la ligne en cours ----
let lineOffsets = []; // positions (layout) de chaque ligne dans #content
let currentLineIdx = -1;

function cacheLineOffsets() {
  lineOffsets = [];
  els.content.querySelectorAll('.line').forEach((el) => {
    lineOffsets.push({ el, top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight });
  });
  currentLineIdx = -1;
}

function updateCurrentLine() {
  if (!state.focusLine || !lineOffsets.length) return;
  const y = position + state.readingPos * els.viewport.clientHeight;
  // recherche dichotomique de la ligne traversant la ligne de lecture
  let lo = 0,
    hi = lineOffsets.length - 1,
    idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const L = lineOffsets[mid];
    if (y < L.top) hi = mid - 1;
    else if (y >= L.bottom) lo = mid + 1;
    else {
      idx = mid;
      break;
    }
  }
  if (idx === -1) idx = clamp(lo, 0, lineOffsets.length - 1);
  if (idx !== currentLineIdx) {
    if (currentLineIdx >= 0 && lineOffsets[currentLineIdx]) {
      lineOffsets[currentLineIdx].el.classList.remove('current');
    }
    if (lineOffsets[idx]) lineOffsets[idx].el.classList.add('current');
    currentLineIdx = idx;
  }
}

// ---- Barre de progression + temps de lecture ----
let lastRemSec = -1;

function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function updateProgress() {
  const max = maxScroll();
  const p = max > 0 ? position / max : 0;
  els.progressFill.style.width = (p * 100).toFixed(2) + '%';
  const total = (totalWords / WPM) * 60; // secondes
  const remaining = total * (1 - p);
  const remSec = Math.round(remaining);
  if (remSec !== lastRemSec) {
    els.timeReadout.textContent = '⏱ ' + fmtTime(remaining) + ' / ' + fmtTime(total);
    lastRemSec = remSec;
  }
}

// Recalcule marges + positions de lignes après tout changement de mise en page
function relayout() {
  applyPadding();
  cacheLineOffsets();
  applyScroll();
}

function tick(ts) {
  if (lastTs == null) lastTs = ts;
  const dt = Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;

  let target = 0;
  if (state.playing) {
    // Manuel : vitesse constante du curseur.
    // Voix : même vitesse, mais uniquement tant que l'on parle (pause sur silence).
    target =
      state.mode === 'manual' || voiceActive ? state.speedManual : 0;
  }

  // lissage : démarrage doux, arrêt un peu plus franc (pause réactive sur silence)
  const smoothing = target > currentSpeed ? 5 : 8;
  currentSpeed += (target - currentSpeed) * Math.min(1, smoothing * dt);

  if (state.playing && currentSpeed > 0.1) {
    position += currentSpeed * dt;
    const max = maxScroll();
    if (position >= max) {
      position = max;
      setPlaying(false); // fin du script
    }
    applyScroll();
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------------- Détection de voix (Web Audio) ----------------
let audioCtx = null;
let analyser = null;
let micData = null;
let voiceActive = false;
let noiseFloor = 0.01; // niveau du bruit de fond, calibré en continu
const MIN_FLOOR = 0.003; // plancher pour ne pas devenir hypersensible
let speakingHold = 0; // ms restantes avant de considérer « silence »

let micStream = null;

// Libère le micro (flux + contexte audio). La boucle monitorMic s'arrête
// d'elle-même quand analyser devient null.
function stopMic() {
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {}
    audioCtx = null;
  }
  analyser = null;
  els.meterFill.style.width = '0%';
}

// (Re)capte le micro. force=true relance la captation avec le device courant
// (utile au passage en Voix, au changement de micro, ou au branchement).
async function startMic(force) {
  if (audioCtx && !force) return true;
  stopMic();
  try {
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    if (state.micDeviceId) audio.deviceId = { exact: state.micDeviceId };
    const stream = await navigator.mediaDevices.getUserMedia({ audio });
    micStream = stream;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    micData = new Float32Array(analyser.fftSize);
    src.connect(analyser);
    noiseFloor = 0.01; // recalibrage du bruit de fond pour le nouveau micro
    requestAnimationFrame(monitorMic);
    populateMicList(); // les libellés ne sont dispo qu'après autorisation
    return true;
  } catch (e) {
    // le micro choisi a disparu (débranché) -> on retombe sur le micro par défaut
    if (state.micDeviceId) {
      state.micDeviceId = '';
      saveSettings();
      return startMic(true);
    }
    alert(
      "Impossible d'accéder au micro.\n\n" +
        'Ouvrez Réglages Système > Confidentialité et sécurité > Microphone, ' +
        "puis autorisez l'application, et relancez le téléprompteur."
    );
    return false;
  }
}

// Remplit la liste déroulante des micros disponibles.
async function populateMicList() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    els.micSelect.innerHTML = '';
    els.micSelect.appendChild(new Option('Micro par défaut', ''));
    devices.forEach((d) => {
      if (d.kind !== 'audioinput') return;
      if (!d.deviceId || d.deviceId === 'default' || d.deviceId === 'communications') return;
      els.micSelect.appendChild(new Option(d.label || 'Micro', d.deviceId));
    });
    els.micSelect.value = state.micDeviceId || '';
  } catch (e) {}
}

function monitorMic(ts) {
  if (!analyser) return;
  analyser.getFloatTimeDomainData(micData);

  // niveau RMS (énergie sonore)
  let sum = 0;
  for (let i = 0; i < micData.length; i++) sum += micData[i] * micData[i];
  const rms = Math.sqrt(sum / micData.length);

  // seuil de parole : nettement au-dessus du bruit de fond mesuré
  const sens = state.micSensitivity || 1;
  const speechThresh = Math.max(MIN_FLOOR, (noiseFloor * 1.8 + 0.004) / sens);

  if (rms > speechThresh) {
    voiceActive = true;
    speakingHold = 320; // garde le défilement 320 ms après le dernier son (pauses entre mots)
  } else {
    // pendant les silences, on recalibre le bruit de fond (montée ET descente)
    noiseFloor += (rms - noiseFloor) * 0.05;
    if (noiseFloor < MIN_FLOOR) noiseFloor = MIN_FLOOR;
    if (speakingHold > 0) {
      speakingHold -= 16;
      voiceActive = speakingHold > 0;
    } else {
      voiceActive = false;
    }
  }

  // affichage du niveau (vert = on vous entend assez pour faire défiler)
  const pct = Math.min(100, Math.round((rms / (speechThresh * 2.5)) * 100));
  els.meterFill.style.width = pct + '%';
  els.voiceState.textContent = voiceActive ? 'vous parlez' : 'silence';
  els.voiceState.classList.toggle('speaking', voiceActive);

  requestAnimationFrame(monitorMic);
}

// ---------------- Application de l'état à l'UI ----------------
function applyState() {
  document.documentElement.style.setProperty('--font-size', state.fontSize + 'px');
  const fam = state.fontFamily.includes('apple')
    ? state.fontFamily
    : `'${state.fontFamily}', sans-serif`;
  document.documentElement.style.setProperty('--font-family', fam);
  document.documentElement.style.setProperty('--panel-alpha', state.panelAlpha);
  document.documentElement.style.setProperty('--text-color', state.textColor);
  document.documentElement.style.setProperty('--text-opacity', state.textOpacity);
  document.documentElement.style.setProperty('--reading-pos', state.readingPos * 100 + '%');
  document.documentElement.style.setProperty('--text-width', state.textWidth * 100 + '%');
  document.documentElement.style.setProperty('--line-height', state.lineHeight);

  els.fontVal.textContent = state.fontSize;
  els.speed.value = state.speedManual;
  els.micSensitivity.value = Math.round(state.micSensitivity * 100);
  els.opacity.value = Math.round(state.panelAlpha * 100);
  els.textColorSw.style.background = state.textColor;
  els.textOpacity.value = Math.round(state.textOpacity * 100);
  els.font.value = state.fontFamily;
  els.mirrorBtn.classList.toggle('toggled', state.mirror);

  // réglages d'affichage
  els.readingPos.value = Math.round(state.readingPos * 100);
  els.textWidth.value = Math.round(state.textWidth * 100);
  els.lineHeight.value = Math.round(state.lineHeight * 10);
  els.content.classList.toggle('focus', state.focusLine);
  els.focusToggle.classList.toggle('toggled', state.focusLine);
  els.focusToggle.textContent = state.focusLine ? 'Activée' : 'Désactivée';
  els.infoToggle.classList.toggle('toggled', state.showInfo);
  els.infoToggle.textContent = state.showInfo ? 'Affichées' : 'Masquées';
  els.captureToggle.classList.toggle('toggled', state.hideFromCapture);
  els.captureToggle.textContent = state.hideFromCapture ? 'Activé' : 'Désactivé';
  els.passClicksToggle.classList.toggle('toggled', state.passClicks);
  els.passClicksToggle.textContent = state.passClicks ? 'Activé' : 'Désactivé';
  // position de la barre d'outils
  BAR_POSITIONS.forEach((pos) => document.body.classList.toggle('bar-' + pos, state.barPosition === pos));
  els.barPosGroup.querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.pos === state.barPosition);
  });
  els.timeReadout.classList.toggle('hidden', !state.showInfo);
  els.progressWrap.classList.toggle('hidden', !state.showInfo);
  if (!state.focusLine && currentLineIdx >= 0 && lineOffsets[currentLineIdx]) {
    lineOffsets[currentLineIdx].el.classList.remove('current');
    currentLineIdx = -1;
  }

  // mode
  els.modeGroup.querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });
  // la vitesse reste réglable même en mode voix (allure de lecture quand on parle)
  els.voiceGroup.style.display = state.mode === 'voice' ? 'flex' : 'none';

  // bouton lecture
  const ico = els.playBtn.querySelector('.ico');
  const lbl = els.playBtn.querySelector('.lbl');
  ico.textContent = state.playing ? '⏸' : '▶';
  lbl.textContent = state.playing ? 'Pause' : 'Lecture';

  applyScroll();
}

// La fenêtre reste « toujours au-dessus » UNIQUEMENT pendant la lecture
// (ou quand elle est verrouillée). Sinon, fenêtre normale : un clic sur une
// autre app la fait passer derrière.
function updateAlwaysOnTop() {
  window.teleAPI.setAlwaysOnTop(state.playing || state.locked);
}

function setPlaying(v) {
  state.playing = v;
  if (v) lastTs = null;
  if (v && state.mode === 'voice') startMic();
  updateAlwaysOnTop();
  refreshClickThrough(); // clic-à-travers actif uniquement en lecture
  applyState();
}

function setMode(mode) {
  state.mode = mode;
  if (mode === 'voice') startMic(true); // re-capte le micro courant à chaque passage en Voix
  else stopMic(); // libère le micro hors mode Voix
  saveSettings();
  applyState();
}

// ---------------- Contrôles UI ----------------
els.playBtn.addEventListener('click', () => setPlaying(!state.playing));

els.modeGroup.querySelectorAll('.seg-btn').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode));
});

els.speed.addEventListener('input', () => {
  state.speedManual = parseInt(els.speed.value, 10);
  saveSettings();
});

// Choix du micro
els.micSelect.addEventListener('change', () => {
  state.micDeviceId = els.micSelect.value;
  saveSettings();
  if (state.mode === 'voice') startMic(true);
});

// Sensibilité de la détection de voix
els.micSensitivity.addEventListener('input', () => {
  state.micSensitivity = parseInt(els.micSensitivity.value, 10) / 100;
  saveSettings();
});

// Branchement / débranchement d'un micro : on rafraîchit la liste et on re-capte
navigator.mediaDevices.addEventListener('devicechange', async () => {
  await populateMicList();
  if (state.mode === 'voice') startMic(true);
});

function changeFont(delta) {
  state.fontSize = Math.max(14, Math.min(120, state.fontSize + delta));
  applyState();
  relayout();
  saveSettings();
}
els.fontMinus.addEventListener('click', () => changeFont(-2));
els.fontPlus.addEventListener('click', () => changeFont(2));

els.font.addEventListener('change', () => {
  state.fontFamily = els.font.value;
  applyState();
  relayout();
  saveSettings();
});

els.opacity.addEventListener('input', () => {
  state.panelAlpha = parseInt(els.opacity.value, 10) / 100;
  applyState();
  saveSettings();
});

// ---- Palette de couleurs intégrée (remplace le sélecteur natif, qui ne
//      s'ouvre pas correctement derrière une fenêtre toujours-au-dessus) ----
const TEXT_COLORS = ['#ffffff', '#ffd60a', '#ff9f0a', '#ff453a', '#32d74b', '#2b8cff', '#bf5af2', '#8e8e93'];
const HILITE_COLORS = ['none', '#ffe14d', '#ffd60a', '#32d74b', '#2b8cff', '#ff6b6b', '#bf5af2', '#ff9f0a'];

function openPalette(anchor, colors, current, onPick) {
  const pal = els.palette;
  pal.innerHTML = '';
  colors.forEach((c) => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'pal-swatch' + (c === current ? ' sel' : '') + (c === 'none' ? ' none' : '');
    if (c !== 'none') sw.style.background = c;
    sw.title = c === 'none' ? 'Aucun / retirer' : c;
    sw.addEventListener('mousedown', (e) => e.preventDefault()); // conserve la sélection de l'éditeur
    sw.addEventListener('click', (e) => {
      e.stopPropagation();
      onPick(c);
      hidePalette();
    });
    pal.appendChild(sw);
  });
  pal.classList.remove('hidden');
  // positionne sous le bouton (sans déborder de la fenêtre)
  const r = anchor.getBoundingClientRect();
  const pw = pal.offsetWidth || 152;
  let left = Math.min(r.left, window.innerWidth - pw - 8);
  pal.style.left = Math.max(8, left) + 'px';
  pal.style.top = r.bottom + 6 + 'px';
}
function hidePalette() {
  els.palette.classList.add('hidden');
}
// referme la palette si on clique ailleurs / Échap
document.addEventListener('click', (e) => {
  if (!els.palette.classList.contains('hidden') && !e.target.closest('#palette')) {
    hidePalette();
  }
});

// Couleur de TOUT le texte (barre du haut)
els.textColorBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openPalette(els.textColorBtn, TEXT_COLORS, state.textColor, (c) => {
    state.textColor = c;
    applyState();
    saveSettings();
  });
});

els.textOpacity.addEventListener('input', () => {
  state.textOpacity = parseInt(els.textOpacity.value, 10) / 100;
  applyState();
  saveSettings();
});

els.mirrorBtn.addEventListener('click', () => {
  state.mirror = !state.mirror;
  applyState();
  saveSettings();
});

els.topBtn.addEventListener('click', () => scrollTo(0));

// ---- Menu réglages d'affichage ----
// Le panneau est volontairement HORS de la barre du haut (zone « déplacer la
// fenêtre ») : sinon les curseurs ne réagissent pas à la souris. On le
// positionne donc sous le bouton ⚙ à l'ouverture.
function positionSettings() {
  const r = els.settingsBtn.getBoundingClientRect();
  const pw = els.settingsPanel.offsetWidth || 280;
  const ph = els.settingsPanel.offsetHeight; // tient déjà compte du max-height (scroll)
  const margin = 8;
  // horizontal : sous/aligné au bouton, sans déborder
  const left = Math.min(r.right - pw, window.innerWidth - pw - margin);
  els.settingsPanel.style.left = Math.max(margin, left) + 'px';
  // vertical : sous le bouton, mais remonté s'il dépasserait le bas de la fenêtre
  let top = r.bottom + margin;
  if (top + ph > window.innerHeight - margin) {
    top = window.innerHeight - margin - ph;
  }
  els.settingsPanel.style.top = Math.max(margin, top) + 'px';
}
els.settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const willOpen = els.settingsPanel.classList.contains('hidden');
  if (willOpen) {
    els.settingsPanel.classList.remove('hidden');
    positionSettings(); // après affichage pour avoir offsetWidth
  } else {
    els.settingsPanel.classList.add('hidden');
  }
});
// referme le menu si on clique ailleurs (ni le bouton, ni le panneau)
document.addEventListener('click', (e) => {
  if (
    !els.settingsPanel.classList.contains('hidden') &&
    !e.target.closest('#settingsPanel') &&
    !e.target.closest('.settings-wrap')
  ) {
    els.settingsPanel.classList.add('hidden');
  }
});
window.addEventListener('resize', () => {
  if (!els.settingsPanel.classList.contains('hidden')) positionSettings();
});

els.focusToggle.addEventListener('click', () => {
  state.focusLine = !state.focusLine;
  applyState();
  saveSettings();
});

els.readingPos.addEventListener('input', () => {
  state.readingPos = parseInt(els.readingPos.value, 10) / 100;
  applyState();
  relayout();
  saveSettings();
});

els.textWidth.addEventListener('input', () => {
  state.textWidth = parseInt(els.textWidth.value, 10) / 100;
  applyState();
  relayout();
  saveSettings();
});

els.lineHeight.addEventListener('input', () => {
  state.lineHeight = parseInt(els.lineHeight.value, 10) / 10;
  applyState();
  relayout();
  saveSettings();
});

els.infoToggle.addEventListener('click', () => {
  state.showInfo = !state.showInfo;
  applyState();
  saveSettings();
});

// Position de la barre d'outils (Haut / Bas / Gauche / Droite)
els.barPosGroup.querySelectorAll('.seg-btn').forEach((b) => {
  b.addEventListener('click', () => {
    if (!BAR_POSITIONS.includes(b.dataset.pos)) return;
    state.barPosition = b.dataset.pos;
    applyState();
    // la zone de lecture change de dimensions -> on recadre marges + lignes
    requestAnimationFrame(relayout);
    saveSettings();
  });
});

els.captureToggle.addEventListener('click', () => {
  state.hideFromCapture = !state.hideFromCapture;
  window.teleAPI.setContentProtection(state.hideFromCapture);
  applyState();
  saveSettings();
});

// ---------------- Éditeur de texte enrichi ----------------
function openEditor() {
  els.scriptInput.innerHTML = toHTML(getScript());
  updateWordCount();
  els.editor.classList.remove('hidden');
  // utilise des styles CSS inline (spans) plutôt que des balises <font>
  try {
    document.execCommand('styleWithCSS', false, true);
  } catch (e) {}
  els.scriptInput.focus();
  setPlaying(false);
}
function closeEditor() {
  hidePalette();
  els.editor.classList.add('hidden');
}
els.editBtn.addEventListener('click', openEditor);
els.cancelEdit.addEventListener('click', closeEditor);
els.saveEdit.addEventListener('click', () => {
  setScript(els.scriptInput.innerHTML);
  scrollTo(0);
  closeEditor();
});
function updateWordCount() {
  const txt = els.scriptInput.innerText || '';
  const n = (txt.trim().match(/\S+/g) || []).length;
  els.wordCount.textContent = n + (n > 1 ? ' mots' : ' mot');
}
els.scriptInput.addEventListener('input', updateWordCount);

// Collage : on insère TOUJOURS du texte brut (sans la mise en forme d'origine),
// pour qu'il adopte le style par défaut (sinon, ex. du texte noir invisible sur fond noir).
function insertPlainText(text) {
  if (!text) return;
  const clean = text.replace(/\r\n?/g, '\n'); // normalise les retours à la ligne
  document.execCommand('insertText', false, clean);
  updateWordCount();
}
els.scriptInput.addEventListener('paste', (e) => {
  e.preventDefault();
  const cb = e.clipboardData || window.clipboardData;
  insertPlainText(cb ? cb.getData('text/plain') : '');
});
els.scriptInput.addEventListener('drop', (e) => {
  e.preventDefault();
  const dt = e.dataTransfer;
  insertPlainText(dt ? dt.getData('text/plain') : '');
});

// Mémorise la sélection dans l'éditeur (le sélecteur de couleur natif vole le focus)
let savedRange = null;
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (sel.rangeCount && els.scriptInput.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange();
  }
});
function restoreSelection() {
  if (!savedRange) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
  els.scriptInput.focus();
}
function exec(cmd, value = null) {
  restoreSelection();
  document.execCommand(cmd, false, value);
  updateWordCount();
}

// Boutons gras / italique / souligné : on garde la sélection via mousedown
els.editorToolbar.querySelectorAll('button.fmt[data-cmd]').forEach((b) => {
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', () => exec(b.dataset.cmd));
});

// Couleur du texte sélectionné (palette intégrée)
els.selColorBtn.addEventListener('mousedown', (e) => e.preventDefault());
els.selColorBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openPalette(els.selColorBtn, TEXT_COLORS, null, (c) => {
    exec('foreColor', c);
    els.selColorIco.style.color = c;
  });
});
// Surlignage du texte sélectionné (palette intégrée, avec « Aucun »)
els.selHiliteBtn.addEventListener('mousedown', (e) => e.preventDefault());
els.selHiliteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openPalette(els.selHiliteBtn, HILITE_COLORS, null, (c) => {
    exec('hiliteColor', c === 'none' ? 'transparent' : c);
    if (c !== 'none') els.selHiliteIco.style.color = c;
  });
});

// Joindre les lignes : retire les sauts de ligne « de découpage » (copier-coller)
// en joignant les lignes par une espace, tout en conservant les paragraphes
// (les lignes vides). Annulable avec ⌘Z (insertHTML).
function removeLineBreaks() {
  const lines = htmlToLines(els.scriptInput.innerHTML);
  const paragraphs = [];
  let cur = [];
  lines.forEach((l) => {
    if (l.trim() === '') {
      if (cur.length) {
        paragraphs.push(cur.join(' '));
        cur = [];
      }
    } else {
      cur.push(l.trim());
    }
  });
  if (cur.length) paragraphs.push(cur.join(' '));
  const html = paragraphs.join('<br><br>');
  if (!html) return;
  els.scriptInput.focus();
  const r = document.createRange();
  r.selectNodeContents(els.scriptInput);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
  document.execCommand('insertHTML', false, html);
  updateWordCount();
}
els.joinLines.addEventListener('mousedown', (e) => e.preventDefault());
els.joinLines.addEventListener('click', removeLineBreaks);

// Effacer la mise en forme (de la sélection, ou de TOUT le script si rien n'est sélectionné)
els.clearFmt.addEventListener('mousedown', (e) => e.preventDefault());
els.clearFmt.addEventListener('click', () => {
  restoreSelection();
  const sel = window.getSelection();
  const inEditor = sel.rangeCount && els.scriptInput.contains(sel.anchorNode);
  if (!inEditor || sel.isCollapsed) {
    // rien de sélectionné → on nettoie tout le contenu
    const r = document.createRange();
    r.selectNodeContents(els.scriptInput);
    sel.removeAllRanges();
    sel.addRange(r);
  }
  document.execCommand('removeFormat');
  document.execCommand('hiliteColor', false, 'transparent');
  updateWordCount();
});

// Fermer
els.closeBtn.addEventListener('click', () => window.teleAPI.quit());

// Verrou « clic-à-travers ». L'état réel est géré par le process principal
// (qui pilote aussi la pastille « Débloquer ») ; ici on ne fait que :
//  - demander un changement (bouton 🔓)
//  - refléter l'état dans l'UI quand il change (bouton, pastille ou ⌘⇧L)
function applyLockUI(v) {
  state.locked = v;
  document.body.classList.toggle('locked', v);
  els.lockBtn.textContent = v ? '🔒' : '🔓';
  els.lockBtn.classList.toggle('toggled', v);
  updateAlwaysOnTop(); // verrouillé = on reste au-dessus
  refreshClickThrough(); // ré-évalue le clic-à-travers (verrou / lecture)
  // la barre disparaît/réapparaît : la zone de lecture change de hauteur,
  // on recadre les marges et les lignes une fois le layout recalculé
  requestAnimationFrame(relayout);
}
els.lockBtn.addEventListener('click', () => window.teleAPI.requestLock(true));
window.teleAPI.onLockedChanged((v) => applyLockUI(v));

// ---------------- Clic-à-travers « hybride » ----------------
// Quand activé : les clics passent à travers la fenêtre PARTOUT, sauf sur la
// barre / l'éditeur / les menus. On suit le curseur (les mousemove sont transmis
// même en mode clic-à-travers grâce à { forward:true }) et on bascule l'« ignore
// souris » en conséquence. Le verrouillage reste prioritaire (géré côté main).
const INTERACTIVE_SEL = '#bar, #editor, #settingsPanel, #palette, #lockHint';
let lastIgnore = null; // évite d'envoyer l'IPC à chaque pixel

// Le clic-à-travers hybride n'est actif que si : option cochée ET en LECTURE
// (et non verrouillé — le verrou est géré séparément par le main).
function hybridActive() {
  return state.passClicks && state.playing && !state.locked;
}

function updatePassthrough(e) {
  if (!hybridActive()) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const overInteractive = !!(el && el.closest(INTERACTIVE_SEL));
  const ignore = !overInteractive;
  if (ignore !== lastIgnore) {
    lastIgnore = ignore;
    window.teleAPI.setIgnoreMouse({ ignore, forward: true });
  }
}
window.addEventListener('mousemove', updatePassthrough);

// (Re)met l'état souris correct quand lecture / verrou / option changent.
// Hors lecture (ou option décochée) et non verrouillé : fenêtre 100% cliquable.
function refreshClickThrough() {
  lastIgnore = null;
  if (!hybridActive() && !state.locked) {
    window.teleAPI.setIgnoreMouse({ ignore: false, forward: false });
  }
  // si hybridActive : le mousemove pilote ; si verrouillé : géré par le main
}

els.passClicksToggle.addEventListener('click', () => {
  state.passClicks = !state.passClicks;
  refreshClickThrough();
  applyState();
  saveSettings();
});

// ---------------- Molette : repositionner le texte ----------------
els.viewport.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    scrollTo(clamp(position + e.deltaY, 0, maxScroll()));
  },
  { passive: false }
);

// ---------------- Raccourcis clavier ----------------
window.addEventListener('keydown', (e) => {
  if (!els.editor.classList.contains('hidden')) {
    if (e.key === 'Escape') closeEditor();
    return; // on tape dans l'éditeur, on ignore les raccourcis
  }
  switch (e.key) {
    case ' ':
      e.preventDefault();
      setPlaying(!state.playing);
      break;
    case 'ArrowDown':
      scrollTo(clamp(position + 40, 0, maxScroll()));
      break;
    case 'ArrowUp':
      scrollTo(clamp(position - 40, 0, maxScroll()));
      break;
    case '+':
    case '=':
      changeFont(2);
      break;
    case '-':
    case '_':
      changeFont(-2);
      break;
    case 'm':
    case 'M':
      els.mirrorBtn.click();
      break;
    case 'e':
    case 'E':
      openEditor();
      break;
    case 'Escape':
      setPlaying(false);
      break;
  }
});

// Recalcule la mise en page quand la fenêtre est redimensionnée
window.addEventListener('resize', relayout);

// ---------------- Démarrage ----------------
loadSettings();
renderScript(getScript());
applyState();
// synchronise l'invisibilité à l'enregistrement avec la préférence enregistrée
window.teleAPI.setContentProtection(state.hideFromCapture);
// au lancement on n'est pas en lecture → ni au-dessus, ni clic-à-travers
updateAlwaysOnTop();
refreshClickThrough();
populateMicList(); // pré-remplit la liste des micros (libellés après autorisation)
// recadre une fois les polices chargées (la hauteur du texte peut changer)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(relayout);
}
