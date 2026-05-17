import { FOV, HALF_FOV, MAX_DEPTH, MAP_W, MAP_H, WALL_COLORS, FLOOR_COLOR, CEIL_COLOR } from './constants.js';
import { game, canvas, ctx, W, H, HALF_H, COLS } from './state.js';

export function castRay(ox, oy, angle, checkEnemy = false) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  let x = ox, y = oy;
  let dist = 0;
  const step = 0.05;
  for (let i = 0; i < MAX_DEPTH / step; i++) {
    x += cos * step; y += sin * step;
    dist += step;
    const mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return { dist, wall: 1, x, y };
    if (game.map[my * MAP_W + mx] !== 0) return { dist, wall: game.map[my * MAP_W + mx], x, y };
    if (checkEnemy) {
      for (const e of game.enemies) {
        if (!e.alive) continue;
        const dx = e.x - x, dy = e.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.35) return { dist, enemy: e, x, y };
      }
    }
    if (dist > MAX_DEPTH) break;
  }
  return { dist: MAX_DEPTH, wall: 0, x, y };
}

export function shadeColor(hex, t) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${(r * t) | 0},${(g * t) | 0},${(b * t) | 0})`;
}

export function renderScene() {
  const p = game.player;
  if (!p) return;
  const cols = COLS;
  const scale = W / cols;

  ctx.fillStyle = CEIL_COLOR;
  ctx.fillRect(0, 0, W, HALF_H);
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, HALF_H, W, HALF_H);

  const zBuffer = new Float32Array(cols);
  for (let col = 0; col < cols; col++) {
    const rayAngle = p.angle - HALF_FOV + (col / cols) * FOV;
    const { dist, wall } = castRay(p.x, p.y, rayAngle);
    zBuffer[col] = dist;
    if (wall === 0) continue;
    const corrected = dist * Math.cos(rayAngle - p.angle);
    const wallH = Math.min(H, (H / corrected) | 0);
    const wallTop = (HALF_H - wallH / 2) | 0;
    const shade = Math.max(0, 1 - dist / MAX_DEPTH);
    const colors = WALL_COLORS[Math.min(wall, WALL_COLORS.length - 1)] || WALL_COLORS[1];
    const base = col % 2 === 0 ? colors[0] : colors[1];
    ctx.fillStyle = shadeColor(base, shade);
    ctx.fillRect(col * scale, wallTop, Math.ceil(scale), wallH);
    const gradH = Math.floor(wallH * 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(col * scale, wallTop, Math.ceil(scale), gradH);
    ctx.fillRect(col * scale, wallTop + wallH - gradH, Math.ceil(scale), gradH);
  }

  const allSprites = [];
  for (const e of game.enemies) {
    if (!e.alive) continue;
    const dx = e.x - p.x, dy = e.y - p.y;
    e.dist = Math.sqrt(dx * dx + dy * dy);
    allSprites.push({ type: 'enemy', obj: e });
  }
  for (const a of game.ammoPickups) {
    if (!a.active) continue;
    const dx = a.x - p.x, dy = a.y - p.y;
    a.dist = Math.sqrt(dx * dx + dy * dy);
    allSprites.push({ type: 'ammo', obj: a });
  }
  allSprites.sort((a, b) => b.obj.dist - a.obj.dist);

  for (const sp of allSprites) {
    const obj = sp.obj;
    const dx = obj.x - p.x, dy = obj.y - p.y;
    const dist = obj.dist;
    if (dist < 0.2) continue;
    let spriteAngle = Math.atan2(dy, dx) - p.angle;
    while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;
    while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
    if (Math.abs(spriteAngle) > HALF_FOV + 0.3) continue;

    const proj = (spriteAngle / FOV + 0.5) * W;
    const spriteH = Math.min(H * 2, (H / dist) | 0);
    const spriteW = spriteH;
    const sx = (proj - spriteW / 2) | 0;
    const sy = (HALF_H - spriteH / 2) | 0;
    const shade = Math.max(0.2, 1 - dist / MAX_DEPTH);

    const startCol = Math.max(0, (sx / (W / cols)) | 0);
    const endCol = Math.min(cols - 1, ((sx + spriteW) / (W / cols)) | 0);
    let blocked = true;
    for (let c = startCol; c <= endCol; c++) {
      if (zBuffer[c] > dist) { blocked = false; break; }
    }
    if (blocked) continue;

    if (sp.type === 'enemy') drawEnemy(obj, sx, sy, spriteW, spriteH, shade);
    else drawAmmoPickup(obj, sx, sy, spriteW, spriteH, shade);
  }

  drawGun();
}

function drawGun() {
  const p = game.player;
  if (!p) return;
  const cx = W / 2, cy = H;
  const bob = Math.sin(game.gunBob) * 6;
  const flash = game.gunShootFlash;
  const gw = Math.min(W * 0.45, 220);
  const gh = gw * 0.7;
  const gx = cx - gw / 2;
  const gy = cy - gh * 0.6 + bob;

  ctx.save();
  ctx.fillStyle = flash > 0.5 ? '#aaccaa' : '#556655';
  ctx.fillRect(gx + gw * 0.42, gy + gh * 0.18, gw * 0.16, gh * 0.28);
  ctx.fillStyle = flash > 0.5 ? '#88aa88' : '#3a4a3a';
  ctx.beginPath();
  ctx.moveTo(gx + gw * 0.32, gy + gh * 0.38);
  ctx.lineTo(gx + gw * 0.68, gy + gh * 0.38);
  ctx.lineTo(gx + gw * 0.72, gy + gh);
  ctx.lineTo(gx + gw * 0.28, gy + gh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#223322';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gx + gw * 0.5, gy + gh * 0.75, gw * 0.1, 0, Math.PI);
  ctx.stroke();
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,220,100,${flash})`;
    ctx.beginPath();
    ctx.arc(gx + gw * 0.5, gy + gh * 0.18, gw * 0.07 * flash, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(e, sx, sy, sw, sh, shade) {
  ctx.save();
  const bodyAlpha = Math.max(0.1, shade);
  ctx.globalAlpha = bodyAlpha;
  const headR = sh * 0.18;
  const headX = sx + sw / 2, headY = sy + headR * 1.2;
  ctx.fillStyle = '#cc9966';
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  const bx = sx + sw * 0.25, by = sy + sh * 0.38;
  const bw = sw * 0.5, bh = sh * 0.38;
  ctx.fillStyle = '#4a5a2a';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(bx, by + bh * 0.75, bw, bh * 0.15);
  ctx.fillStyle = '#3a4a2a';
  ctx.fillRect(bx, by + bh, bw * 0.42, sh * 0.22);
  ctx.fillRect(bx + bw * 0.58, by + bh, bw * 0.42, sh * 0.22);
  if (e.hp < e.maxHp) {
    ctx.globalAlpha = 0.85;
    const barW = sw * 0.8, barH = 4;
    const barX = sx + sw * 0.1, barY = sy - 8;
    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#00ff50';
    ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawAmmoPickup(a, sx, sy, sw, sh, shade) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.3, shade);
  const cx = sx + sw / 2, cy = sy + sh * 0.6;
  const r = Math.min(sw, sh) * 0.22;
  ctx.fillStyle = '#ccaa00';
  ctx.fillRect(cx - r * 0.4, cy - r * 1.2, r * 0.8, r * 2.2);
  ctx.fillStyle = '#ffdd33';
  ctx.fillRect(cx - r * 0.55, cy - r * 1.2, r * 1.1, r * 0.5);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawMinimap() {
  const ms = 5, ox = 8, oy = 8;
  const mw = MAP_W * ms, mh = MAP_H * ms;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#000a00';
  ctx.fillRect(ox - 2, oy - 2, mw + 4, mh + 4);
  for (let my = 0; my < MAP_H; my++) {
    for (let mx = 0; mx < MAP_W; mx++) {
      const tile = game.map[my * MAP_W + mx];
      ctx.fillStyle = tile !== 0 ? '#2a5a2a' : '#0a1a0a';
      ctx.fillRect(ox + mx * ms, oy + my * ms, ms - 1, ms - 1);
    }
  }
  for (const e of game.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(ox + e.x * ms - 1, oy + e.y * ms - 1, 3, 3);
  }
  for (const a of game.ammoPickups) {
    if (!a.active) continue;
    ctx.fillStyle = '#ffdd33';
    ctx.fillRect(ox + a.x * ms - 1, oy + a.y * ms - 1, 3, 3);
  }
  if (game.player) {
    ctx.fillStyle = '#00ff50';
    ctx.fillRect(ox + game.player.x * ms - 2, oy + game.player.y * ms - 2, 4, 4);
    ctx.strokeStyle = '#00ff50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + game.player.x * ms, oy + game.player.y * ms);
    ctx.lineTo(ox + (game.player.x + Math.cos(game.player.angle) * 2) * ms,
               oy + (game.player.y + Math.sin(game.player.angle) * 2) * ms);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function renderTitleAnimation() {
  ctx.fillStyle = '#000a00';
  ctx.fillRect(0, 0, W, H);
  game.titleAngle += 0.008;
  const px = W / 2 + Math.cos(game.titleAngle) * W * 0.1;
  const py = H / 2 + Math.sin(game.titleAngle * 0.7) * H * 0.08;
  ctx.fillStyle = CEIL_COLOR;
  ctx.fillRect(0, 0, W, H / 2);
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, H / 2, W, H / 2);
  const vanishX = W / 2, vanishY = H / 2;
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const wallW = W * t, wallH = H * t;
    const x1 = vanishX - wallW / 2, y1 = vanishY - wallH / 2;
    const shade = Math.floor(30 + 30 * t);
    ctx.strokeStyle = `rgb(0,${shade},0)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, wallW, wallH);
  }
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, y, W, 2);
  }
}

export function updateDebug() {
  game._frames++;
  const n = performance.now();
  game._ft = n - (game._prev || n);
  game._prev = n;
  if (n - game._lastDbg >= 1000) {
    game._fps = (game._frames * 1000) / (n - game._lastDbg);
    game._frames = 0;
    game._lastDbg = n;
  }
}

export function drawDebug() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(W - 140, 0, 140, 16);
  ctx.font = '10px Share Tech Mono, monospace';
  ctx.fillStyle = game._fps < 30 ? '#ff4444' : '#00ff50';
  ctx.fillText(`FPS:${game._fps.toFixed(0)} ${game._ft.toFixed(1)}ms`, W - 135, 12);
  ctx.restore();
}
