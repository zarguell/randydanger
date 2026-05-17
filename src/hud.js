export function updateHUD(player) {
  const hp = Math.max(0, player.hp);
  const healthVal = document.getElementById('health-val');
  healthVal.textContent = hp;
  healthVal.className = 'hud-value' + (hp < 30 ? ' danger' : hp < 60 ? ' warn' : '');

  const healthBar = document.getElementById('health-bar-inner');
  healthBar.style.width = (hp / player.maxHp * 100) + '%';
  healthBar.style.background = hp < 30 ? '#ff3333' : hp < 60 ? '#ffcc00' : '#00ff50';

  const ammo = player.ammo;
  const ammoEl = document.getElementById('ammo-val');
  ammoEl.textContent = player.reloading ? 'RELOADING' : ammo;
  ammoEl.className = 'hud-value' + (ammo <= 0 ? ' danger' : ammo < 8 ? ' warn' : '');
}

export function updateScoreboard(score, wave, kills) {
  document.getElementById('score-val').textContent = score;
  document.getElementById('wave-val').textContent = wave;
  document.getElementById('kills-val').textContent = kills;
}

export function addMsg(text, isDanger = false) {
  const el = document.createElement('div');
  el.className = 'msg' + (isDanger ? ' danger-msg' : '');
  el.textContent = text;
  const container = document.getElementById('messages');
  container.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

export function flashHit() {
  const el = document.getElementById('hit-flash');
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 120);
}
