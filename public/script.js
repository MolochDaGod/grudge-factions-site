// === SERVER CONFIG ===
const SERVER_IP = '26.228.21.150';
const SERVER_PORT = 25565;

// === COPY IP ===
function copyIP() {
  const ip = document.getElementById('serverIP').textContent;
  navigator.clipboard.writeText(ip).then(() => {
    const box = document.getElementById('ipBox');
    const hint = document.getElementById('copyHint');
    box.classList.add('copied');
    hint.textContent = 'Copied!';
    setTimeout(() => {
      box.classList.remove('copied');
      hint.textContent = 'Click to copy';
    }, 2000);
  });
}

// === SERVER STATUS ===
async function checkServerStatus() {
  const el = document.getElementById('serverStatus');
  const text = el.querySelector('.status-text');
  const playerCount = document.getElementById('playerCount');

  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}:${SERVER_PORT}`);
    const data = await res.json();

    if (data.online) {
      el.classList.add('online');
      el.classList.remove('offline');
      const players = data.players || {};
      text.textContent = `Server Online — ${players.online || 0}/${players.max || '?'} players`;
      if (players.online > 0) {
        playerCount.textContent = `${players.online} adventurer${players.online !== 1 ? 's' : ''} currently online`;
      }
    } else {
      el.classList.add('offline');
      el.classList.remove('online');
      text.textContent = 'Server Offline';
    }
  } catch {
    el.classList.add('offline');
    el.classList.remove('online');
    text.textContent = 'Status unavailable';
  }
}

// === MOD LIST ===
async function loadModList() {
  const container = document.getElementById('modListContainer');
  if (!container) return;
  try {
    const res = await fetch('/modlist.json');
    const data = await res.json();
    container.innerHTML = data.mods.map(m =>
      `<span style="background:#1e1e2e;border:1px solid #333;padding:3px 10px;border-radius:12px;font-size:0.75rem;color:#ccc;white-space:nowrap;">${m.name}</span>`
    ).join('');
  } catch {
    container.textContent = 'Could not load mod list.';
  }
}

// === PARTICLES ===
function createParticles() {
  const container = document.getElementById('particles');
  const count = 30;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 6}s`;
    p.style.width = p.style.height = `${1 + Math.random() * 3}px`;
    container.appendChild(p);
  }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  checkServerStatus();
  loadModList();
  setInterval(checkServerStatus, 60000);
});
