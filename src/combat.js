import { QUIPS } from './constants.js';
import { game } from './state.js';
import { castRay } from './renderer.js';
import { playShoot, playHit, playDie, playEmpty, playPickup } from './audio.js';
import { addMsg, updateHUD } from './hud.js';

export function shoot() {
  const p = game.player;
  if (game.state !== 'playing') return { shot: false };
  if (p.reloading) return { shot: false };
  if (p.ammo <= 0) {
    playEmpty();
    addMsg('Out of ammo! Press R!', true);
    return { shot: false };
  }
  if (p.shootCool > 0) return { shot: false };

  p.ammo--;
  p.shootCool = 0.25;
  playShoot();
  updateHUD(p);

  const hitInfo = castRay(p.x, p.y, p.angle, true);
  if (hitInfo && hitInfo.enemy) {
    const e = hitInfo.enemy;
    e.hp -= 1;
    game.score += 10;
    if (e.hp <= 0) {
      e.alive = false;
      game.kills++;
      game.score += 50;
      playDie();
      addMsg(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
      if (game.enemies.every(en => !en.alive)) {
        return { shot: true, killed: true, waveClear: true };
      }
      return { shot: true, killed: true, waveClear: false };
    }
    playHit();
    addMsg(`Hit! ${e.hp} HP left`);
    return { shot: true, killed: false, waveClear: false };
  }
  return { shot: true, killed: false, waveClear: false };
}

export function reload() {
  const p = game.player;
  if (p.reloading || p.ammo >= p.maxAmmo) return;
  p.reloading = true;
  p.reloadT = 1.5;
  addMsg('Reloading...');
  updateHUD(p);
}

export function finishReload() {
  const p = game.player;
  p.reloading = false;
  p.ammo = p.maxAmmo;
  playPickup();
  addMsg('Locked and loaded, baby.');
  updateHUD(p);
}
