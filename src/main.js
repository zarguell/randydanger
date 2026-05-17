import { game, initCanvas, ctx, W, H } from './state.js';
import { MOVE_SPEED, ROT_SPEED, MAP_W, TRACKPAD_SENSITIVITY, AUTO_AIM_ANGLE } from './constants.js';
import { initInput, keys, mouse, mobile, escapePressed, clearInput } from './input.js';
import { updateHUD, updateScoreboard, addMsg } from './hud.js';
import { goToTitle, onGameStart, pauseGame, resumeGame, gameOver, winWave } from './screens.js';
import { renderScene, renderTitleAnimation, drawMinimap, drawDebug, updateDebug } from './renderer.js';
import { buildMap, spawnEnemies, spawnAmmo, updateEnemies } from './enemy.js';
import { shoot, reload, finishReload } from './combat.js';
import { playPickup } from './audio.js';

function handleStartGame() {
  game.map = buildMap(game.wave);
  game.player = {
    x: 2.5, y: 2.5,
    angle: 0,
    hp: 100, maxHp: 100,
    ammo: 30, maxAmmo: 30,
    reloading: false, reloadT: 0,
    shootCool: 0,
    speed: MOVE_SPEED,
  };
  game.enemies = spawnEnemies(game.wave);
  game.ammoPickups = spawnAmmo();
  game.score = 0;
  game.kills = 0;
  game.gameTime = 0;
  game.gunBob = 0;
  game.gunShootFlash = 0;
  onGameStart();
  updateHUD(game.player);
  updateScoreboard(game.score, game.wave, game.kills);
}

function applyAutoAim() {
  const p = game.player;
  if (!p) return;
  let closestDiff = null;
  let closestAngle = AUTO_AIM_ANGLE;
  for (const e of game.enemies) {
    if (!e.alive) continue;
    const dx = e.x - p.x, dy = e.y - p.y;
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const absDiff = Math.abs(diff);
    if (absDiff < closestAngle) {
      closestDiff = diff;
      closestAngle = absDiff;
    }
  }
  if (closestDiff !== null) {
    const strength = 1 - (closestAngle / AUTO_AIM_ANGLE);
    p.angle += closestDiff * strength * 0.12;
  }
}

function update(dt) {
  if (game.state !== 'playing') return;
  const p = game.player;
  if (!p) return;
  game.gameTime += dt;

  const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
  const spd = p.speed * (sprint ? 1.6 : 1);
  const fwd = (keys['KeyW'] || keys['ArrowUp'] ? 1 : keys['KeyS'] || keys['ArrowDown'] ? -1 : 0)
    + (mobile.leftJoy.active ? -mobile.leftJoy.dy : 0);
  const strafe = (keys['KeyD'] ? 1 : keys['KeyA'] ? -1 : 0)
    + (mobile.leftJoy.active ? mobile.leftJoy.dx : 0);
  const moveX = Math.cos(p.angle) * fwd * spd * dt + Math.cos(p.angle + Math.PI / 2) * strafe * spd * dt;
  const moveY = Math.sin(p.angle) * fwd * spd * dt + Math.sin(p.angle + Math.PI / 2) * strafe * spd * dt;

  const kbRot = (keys['ArrowLeft'] ? -1 : 0) + (keys['ArrowRight'] ? 1 : 0);
  p.angle += kbRot * ROT_SPEED * dt;
  if (mouse.locked) {
    p.angle += mouse.dx * 0.003;
    mouse.dx = 0;
  }
  if (mobile.rightPad.active) {
    p.angle += mobile.rightPad.deltaX * TRACKPAD_SENSITIVITY;
    mobile.rightPad.deltaX = 0;
    applyAutoAim();
  }

  const nx = p.x + moveX, ny = p.y + moveY;
  const pad = 0.3;
  if (game.map[Math.floor(p.y) * MAP_W + Math.floor(nx + (moveX > 0 ? pad : -pad))] === 0) p.x = nx;
  if (game.map[Math.floor(ny + (moveY > 0 ? pad : -pad)) * MAP_W + Math.floor(p.x)] === 0) p.y = ny;

  const moving = moveX !== 0 || moveY !== 0;
  game.gunBob += moving ? dt * 6 : 0;
  if (game.gunShootFlash > 0) game.gunShootFlash -= dt * 5;

  if (p.shootCool > 0) p.shootCool -= dt;

  if (p.reloading) {
    p.reloadT -= dt;
    if (p.reloadT <= 0) finishReload();
  }

  const triggerShoot = () => {
    const result = shoot();
    if (result.waveClear) {
      winWave();
      return true;
    }
    return false;
  };

  if (mobile.rightPad.tapShoot) {
    triggerShoot();
  }
  if ((keys['Space'] && mouse.locked) || mobile.fireHeld || (mouse.clicked && mouse.locked)) {
    const r = triggerShoot();
    if (r) return;
  }
  mouse.clicked = false;

  if (mobile.reloadPressed) reload();

  for (const a of game.ammoPickups) {
    if (!a.active) continue;
    const dx = a.x - p.x, dy = a.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < 0.7 && (keys['KeyE'] || a.dist < 0.5)) {
      if (p.ammo < p.maxAmmo) {
        p.ammo = Math.min(p.maxAmmo, p.ammo + a.amount);
        a.active = false;
        playPickup();
        addMsg('+10 ammo. Classic Randy.');
        updateHUD(p);
      }
    }
    a.dist = Math.sqrt(dx * dx + dy * dy);
  }

  const enemyResult = updateEnemies(dt);
  if (enemyResult.playerDied) {
    gameOver();
    return;
  }

  updateHUD(p);
  updateScoreboard(game.score, game.wave, game.kills);
}

function loop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
  game.lastTime = timestamp;
  updateDebug();

  ctx.clearRect(0, 0, W, H);

  if (game.state === 'title' || game.state === 'gameover' || game.state === 'victory') {
    renderTitleAnimation();
  } else if (game.state === 'playing' || game.state === 'paused') {
    renderScene();
    drawMinimap();
  }
  drawDebug();

  if (game.state === 'playing') update(dt);

  if (escapePressed) {
    escapePressed = false;
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
  }
  if (mobile.pausePressed) {
    mobile.pausePressed = false;
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
  }

  clearInput();
  requestAnimationFrame(loop);
}

function init() {
  initCanvas();
  initInput();
  goToTitle();

  document.getElementById('start-btn').addEventListener('click', handleStartGame);
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-pause-menu').addEventListener('click', goToTitle);
  document.getElementById('btn-retry').addEventListener('click', handleStartGame);
  document.getElementById('btn-gameover-menu').addEventListener('click', goToTitle);
  document.getElementById('btn-next-wave').addEventListener('click', handleStartGame);
  document.getElementById('btn-victory-menu').addEventListener('click', goToTitle);

  game.lastTime = performance.now();
  requestAnimationFrame(loop);

  window.render_game_to_text = function () {
    return JSON.stringify({
      state: game.state,
      player: game.player
        ? {
            x: +game.player.x.toFixed(2),
            y: +game.player.y.toFixed(2),
            angle: +game.player.angle.toFixed(2),
            hp: game.player.hp,
            ammo: game.player.ammo,
          }
        : null,
      enemies: (game.enemies || []).filter((e) => e.alive).map((e) => ({ x: +e.x.toFixed(2), y: +e.y.toFixed(2), hp: e.hp })),
      score: game.score,
      kills: game.kills,
      wave: game.wave,
    });
  };
  window.advanceTime = function (ms) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) update(1 / 60);
  };
}

init();
