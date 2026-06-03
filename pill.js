// Pastille « Débloquer » : clic = déverrouiller, glisser = déplacer la fenêtre.
const pill = document.getElementById('pill');

let dragging = false;
let moved = 0;
let lastX = 0;
let lastY = 0;

pill.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  dragging = true;
  moved = 0;
  lastX = e.screenX;
  lastY = e.screenY;
  pill.setPointerCapture(e.pointerId); // continue à recevoir les events même hors fenêtre
  e.preventDefault();
});

pill.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.screenX - lastX;
  const dy = e.screenY - lastY;
  lastX = e.screenX;
  lastY = e.screenY;
  moved += Math.abs(dx) + Math.abs(dy);
  if (dx || dy) window.teleAPI.pillMove(dx, dy);
});

pill.addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false;
  // un simple clic (quasi sans déplacement) = déverrouiller
  if (moved <= 4) window.teleAPI.pillUnlock();
});
