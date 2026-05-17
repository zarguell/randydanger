import { game } from './state.js';
import { addMsg } from './hud.js';
import * as audio from './audio.js';

const GAMEOVER_MSGS = [
  "Randy got got. Happens to the best of us.",
  "Even legends have bad days.",
  "Randy's down. Not out. But definitely down.",
  "Carl would've done worse, honestly.",
];

const VICTORY_MSGS = [
  "They never stood a chance. Randy is THAT guy.",
];

export function hideAllScreens() {
  ['title-screen', 'pause-screen', 'gameover-screen', 'victory-screen'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

export function showHUD(visible) {
  document.getElementById('hud').style.display = visible ? '' : 'none';
  document.getElementById('crosshair').style.display = visible ? '' : 'none';
}

export function goToTitle() {
  hideAllScreens();
  showHUD(false);
  document.getElementById('title-screen').style.display = '';
  game.state = 'title';
  audio.stopMusic();
  if (document.pointerLockElement) document.exitPointerLock();
}

export function pauseGame() {
  game.state = 'paused';
  document.getElementById('pause-screen').style.display = '';
  audio.pauseMusic();
  if (document.pointerLockElement) document.exitPointerLock();
}

export function resumeGame() {
  game.state = 'playing';
  document.getElementById('pause-screen').style.display = 'none';
  audio.resumeMusic();
}

export function gameOver() {
  game.state = 'gameover';
  document.getElementById('gameover-screen').style.display = '';
  showHUD(false);
  document.getElementById('gameover-msg').textContent =
    GAMEOVER_MSGS[Math.floor(Math.random() * GAMEOVER_MSGS.length)];
  document.getElementById('final-stats').innerHTML =
    `Score: ${game.score} &nbsp;|&nbsp; Kills: ${game.kills} &nbsp;|&nbsp; Wave: ${game.wave}`;
  audio.stopMusic();
  if (document.pointerLockElement) document.exitPointerLock();
}

export function winWave() {
  game.wave++;
  game.state = 'victory';
  document.getElementById('victory-screen').style.display = '';
  showHUD(false);
  const msg = `Wave ${game.wave - 1} cleared! Randy is basically unstoppable.`;
  document.getElementById('victory-msg').textContent =
    VICTORY_MSGS[Math.floor(Math.random() * VICTORY_MSGS.length)];
  document.getElementById('victory-stats').innerHTML =
    `Score: ${game.score} &nbsp;|&nbsp; Kills: ${game.kills} &nbsp;|&nbsp; Next wave: ${game.wave}`;
  audio.stopMusic();
  if (document.pointerLockElement) document.exitPointerLock();
}

export function onGameStart() {
  hideAllScreens();
  showHUD(true);
  game.state = 'playing';
  addMsg("Randy's on the job. Heaven help us.", false);
  audio.startMusic();
}
