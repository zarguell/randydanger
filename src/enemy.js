import { MAP_W, MAP_H, OUCH_QUIPS, MAPS } from './constants.js';
import { game } from './state.js';
import { playHit, playDie } from './audio.js';
import { addMsg, flashHit, updateHUD } from './hud.js';

export function buildMap(waveNum) {
  const src = MAPS[Math.min(waveNum - 1, MAPS.length - 1)];
  return src.slice();
}

export function spawnEnemies(waveNum) {
  const count = 3 + waveNum * 2;
  const spawnPts = [
    [13.5, 13.5], [14.5, 1.5], [1.5, 14.5], [14.5, 14.5],
    [8, 1.5], [1.5, 8], [14.5, 8], [8, 14.5],
    [4, 4], [12, 4], [4, 12], [12, 12],
  ];
  const result = [];
  for (let i = 0; i < Math.min(count, spawnPts.length); i++) {
    const [ex, ey] = spawnPts[i];
    if (game.map[Math.floor(ey) * MAP_W + Math.floor(ex)] !== 0) continue;
    const pdx = ex - 2.5, pdy = ey - 2.5;
    if (Math.sqrt(pdx * pdx + pdy * pdy) < 3) continue;
    result.push({
      x: ex, y: ey,
      hp: 2 + Math.floor(waveNum / 2),
      maxHp: 2 + Math.floor(waveNum / 2),
      angle: Math.random() * Math.PI * 2,
      speed: 1.0 + waveNum * 0.3,
      shootCool: 2.0,
      shootRate: 2.5 - waveNum * 0.15,
      alertRange: 8,
      alerted: false,
      alive: true,
      bobT: Math.random() * 10,
      dist: 0,
    });
  }
  return result;
}

export function spawnAmmo() {
  const spots = [[5, 5], [10, 5], [5, 10], [10, 10], [7, 2], [2, 7], [13, 7], [7, 13]];
  return spots.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5, amount: 10, active: true }));
}

export function updateEnemies(dt) {
  const p = game.player;
  let playerDied = false;

  for (const e of game.enemies) {
    if (!e.alive) continue;
    e.bobT += dt;
    const dx = p.x - e.x, dy = p.y - e.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    if (distToPlayer < e.alertRange) e.alerted = true;
    if (!e.alerted) continue;

    const moveSpd = e.speed * dt;
    const ang = Math.atan2(dy, dx);
    const nx = e.x + Math.cos(ang) * moveSpd;
    const ny = e.y + Math.sin(ang) * moveSpd;
    if (game.map[Math.floor(e.y) * MAP_W + Math.floor(nx)] === 0) e.x = nx;
    if (game.map[Math.floor(ny) * MAP_W + Math.floor(e.x)] === 0) e.y = ny;

    e.shootCool -= dt;
    if (e.shootCool <= 0 && distToPlayer < 8) {
      e.shootCool = e.shootRate;
      let los = true;
      const steps = Math.ceil(distToPlayer * 5);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const cx = e.x + dx * t, cy = e.y + dy * t;
        if (game.map[Math.floor(cy) * MAP_W + Math.floor(cx)] !== 0) { los = false; break; }
      }
      if (los) {
        const dmg = 8 + Math.floor(Math.random() * 7);
        p.hp -= dmg;
        flashHit();
        playHit();
        addMsg(OUCH_QUIPS[Math.floor(Math.random() * OUCH_QUIPS.length)], true);
        updateHUD(p);
        if (p.hp <= 0) { playerDied = true; break; }
      }
    }
    if (distToPlayer < 0.4) {
      p.hp -= 0.5;
      updateHUD(p);
      if (p.hp <= 0) { playerDied = true; break; }
    }
  }

  return { playerDied };
}
