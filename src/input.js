import { JOYSTICK_RADIUS, TAP_MAX_DURATION, TAP_MAX_MOVEMENT, LEFT_ZONE_RATIO } from './constants.js';

export const keys = {};
export const mouse = { dx: 0, clicked: false, locked: false };
export const mobile = {
  leftJoy: { dx: 0, dy: 0, active: false },
  rightPad: { deltaX: 0, active: false, tapShoot: false },
  fireHeld: false,
  reloadPressed: false,
  pausePressed: false,
};
export let escapePressed = false;

function onKeyDown(e) {
  keys[e.code] = true;
  if (e.code === 'Escape') {
    escapePressed = true;
    return;
  }
  if (e.code === 'KeyR') {
    mobile.reloadPressed = true;
  }
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Space') e.preventDefault();
}

function onKeyUp(e) {
  keys[e.code] = false;
}

let canvasEl = null;

function onCanvasClick() {
  if (mouse.locked) {
    mobile.fireHeld = true;
  }
}

function onCanvasMouseDown() {
  mouse.clicked = true;
}

function onMouseMove(e) {
  if (mouse.locked) {
    mouse.dx += e.movementX || 0;
  }
}

function onPointerLockChange() {
  mouse.locked = document.pointerLockElement === canvasEl;
}

function makeRing(id) {
  const ring = document.createElement('div');
  ring.className = 'dpad-ring';
  ring.id = id;
  const knob = document.createElement('div');
  knob.className = 'dpad-knob';
  ring.appendChild(knob);
  ring.style.display = 'none';
  document.getElementById('mc-overlay').appendChild(ring);
  return ring;
}

const ringL = makeRing('ring-left');
const ringR = makeRing('ring-right');
const knobL = ringL.querySelector('.dpad-knob');
const knobR = ringR.querySelector('.dpad-knob');

function showRing(ring, knob, x, y) {
  ring.style.display = '';
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  knob.style.left = '50%';
  knob.style.top = '50%';
}

function hideRing(ring) {
  ring.style.display = 'none';
  mobile.leftJoy.active = false;
  mobile.leftJoy.dx = 0;
  mobile.leftJoy.dy = 0;
}

function updateJoystick(ring, knob, side, ox, oy, cx, cy) {
  let dx = cx - ox, dy = cy - oy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > JOYSTICK_RADIUS) {
    dx = dx / len * JOYSTICK_RADIUS;
    dy = dy / len * JOYSTICK_RADIUS;
  }
  knob.style.left = (50 + dx / JOYSTICK_RADIUS * 42) + '%';
  knob.style.top = (50 + dy / JOYSTICK_RADIUS * 42) + '%';
  mobile.leftJoy.dx = dx / JOYSTICK_RADIUS;
  mobile.leftJoy.dy = dy / JOYSTICK_RADIUS;
  mobile.leftJoy.active = true;
}

const trackSlots = {};

function isTap(slot) {
  const dur = performance.now() - slot.startTime;
  return dur < TAP_MAX_DURATION && slot.totalMovement < TAP_MAX_MOVEMENT;
}

function onTouchStart(e) {
  const leftThreshold = window.innerWidth * LEFT_ZONE_RATIO;
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    if (x < leftThreshold) {
      showRing(ringL, knobL, x, y);
      trackSlots[t.identifier] = { side: 'joystick', startX: x, startY: y };
    } else {
      trackSlots[t.identifier] = {
        side: 'trackpad',
        startX: x, startY: y, startTime: performance.now(),
        lastX: x, totalMovement: 0,
      };
      mobile.rightPad.active = true;
    }
  }
}

function onTouchMove(e) {
  for (const t of e.changedTouches) {
    const slot = trackSlots[t.identifier];
    if (!slot) continue;
    if (slot.side === 'joystick') {
      updateJoystick(ringL, knobL, 'left', slot.startX, slot.startY, t.clientX, t.clientY);
    } else {
      const deltaX = t.clientX - slot.lastX;
      slot.lastX = t.clientX;
      slot.totalMovement += Math.abs(deltaX);
      mobile.rightPad.deltaX += deltaX;
      mobile.rightPad.active = true;
    }
  }
}

function onTouchEnd(e) {
  for (const t of e.changedTouches) {
    const slot = trackSlots[t.identifier];
    if (!slot) continue;
    if (slot.side === 'joystick') {
      hideRing(ringL);
    } else {
      if (isTap(slot)) {
        mobile.rightPad.tapShoot = true;
      }
      mobile.rightPad.deltaX = 0;
      mobile.rightPad.active = false;
    }
    delete trackSlots[t.identifier];
  }
}

function initMobileButtons() {
  const fireBtn = document.getElementById('mc-fire');
  const reloadBtn = document.getElementById('mc-reload');
  const pauseBtn = document.getElementById('mc-pause');

  if (fireBtn) {
    fireBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      fireBtn.classList.add('active');
      mobile.fireHeld = true;
    }, { passive: false });
    fireBtn.addEventListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      fireBtn.classList.remove('active');
      mobile.fireHeld = false;
    }, { passive: false });
    fireBtn.addEventListener('touchcancel', () => {
      fireBtn.classList.remove('active');
      mobile.fireHeld = false;
    }, { passive: false });
    fireBtn.addEventListener('mousedown', () => { mobile.fireHeld = true; });
    fireBtn.addEventListener('mouseup', () => { mobile.fireHeld = false; });
    fireBtn.addEventListener('mouseleave', () => { mobile.fireHeld = false; });
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      reloadBtn.classList.add('active');
      mobile.reloadPressed = true;
    }, { passive: false });
    reloadBtn.addEventListener('touchend', e => {
      e.preventDefault();
      reloadBtn.classList.remove('active');
    }, { passive: false });
    reloadBtn.addEventListener('touchcancel', () => {
      reloadBtn.classList.remove('active');
    }, { passive: false });
    reloadBtn.addEventListener('mousedown', () => { mobile.reloadPressed = true; });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      mobile.pausePressed = true;
    }, { passive: false });
    pauseBtn.addEventListener('click', () => { mobile.pausePressed = true; });
  }
}

export function initInput() {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  canvasEl = document.getElementById('gameCanvas');
  canvasEl.addEventListener('click', onCanvasClick);
  canvasEl.addEventListener('mousedown', onCanvasMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
  canvasEl.addEventListener('touchmove', onTouchMove, { passive: false });
  canvasEl.addEventListener('touchend', onTouchEnd, { passive: false });
  canvasEl.addEventListener('touchcancel', onTouchEnd, { passive: false });

  document.addEventListener('touchmove', e => {
    if (e.target === canvasEl) e.preventDefault();
  }, { passive: false });
  document.addEventListener('selectstart', e => e.preventDefault());

  initMobileButtons();
}

export function clearInput() {
  mobile.rightPad.tapShoot = false;
  mobile.reloadPressed = false;
  mobile.pausePressed = false;
  escapePressed = false;
  mobile.leftJoy.dx = 0;
  mobile.leftJoy.dy = 0;
  mobile.leftJoy.active = false;
}
