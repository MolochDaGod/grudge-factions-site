// ═══════════════════════════════════════════════════════════════
// GRUDGE STUDIOS — Server Lobby Script
// ═══════════════════════════════════════════════════════════════

const MC_IP = '26.228.21.150';
const MC_PORT = 25565;

// ── Game server definitions ────────────────────────────────────
const GAMES = [
  {
    id: 'factions',
    name: 'Grudge Factions',
    icon: '&#9876;',
    platform: 'Minecraft 1.20.1',
    desc: 'Souls-like MMO Minecraft with 4 classes, faction wars, AI companions, 17 weapon types, and 120 mods. Parry, dodge, conquer.',
    tags: ['Souls-Like', 'MMO', 'PvP', 'Factions', '120 Mods'],
    type: 'minecraft',
    primaryLabel: 'Download Modpack',
    primaryUrl: 'https://github.com/MolochDaGod/grudge-factions-site/releases/latest/download/GrudgeFactions.zip',
    secondaryLabel: 'Copy IP',
    serverIp: `${MC_IP}:${MC_PORT}`,
  },
  {
    id: 'warlords',
    name: 'Grudge Warlords',
    icon: '&#128081;',
    platform: 'Browser RPG',
    desc: 'Full character builder, skill trees, gear progression, and combat across islands. Shared characters with all Grudge games.',
    tags: ['RPG', 'Character Builder', 'Skill Trees', 'Gear'],
    type: 'browser',
    primaryLabel: 'Play Now',
    primaryUrl: 'https://grudgewarlords.com',
    secondaryLabel: 'Info',
    secondaryUrl: 'https://grudgewarlords.com',
  },
  {
    id: 'dungeon',
    name: 'Dungeon Crawler Quest',
    icon: '&#128123;',
    platform: 'Browser · Voxel',
    desc: 'Dungeon crawler with voxel enemies, combo animations, MOBA mode, and AI-generated content. Explore, fight, survive.',
    tags: ['Dungeon Crawler', 'Voxel', 'MOBA', 'AI'],
    type: 'browser',
    primaryLabel: 'Play Now',
    primaryUrl: 'https://dungeon-crawler-quest.vercel.app',
    secondaryLabel: 'Editor',
    secondaryUrl: 'https://dungeon-crawler-quest.vercel.app/editor',
  },
  {
    id: 'crafting',
    name: 'Warlord Crafting Suite',
    icon: '&#128296;',
    platform: 'Browser · Tools',
    desc: 'Crafting calculator, profession trees, item database, and gear planning for all Grudge Warlords content.',
    tags: ['Crafting', 'Professions', 'Items', 'Planner'],
    type: 'browser',
    primaryLabel: 'Open Tools',
    primaryUrl: 'https://grudge-crafting.puter.site',
    secondaryLabel: 'Item DB',
    secondaryUrl: 'https://molochdagod.github.io/ObjectStore/GRUDGE_Item_Database.html',
  },
  {
    id: 'armada',
    name: 'Grim Armada',
    icon: '&#9875;',
    platform: 'Browser · Naval',
    desc: 'Naval warfare and fleet command. Build your armada, sail between islands, and engage in ship-to-ship combat.',
    tags: ['Naval', 'Strategy', 'Fleet', 'PvP'],
    type: 'browser',
    primaryLabel: 'Play Now',
    primaryUrl: 'https://grim-armada-web.vercel.app',
  },
  {
    id: 'gdevelop',
    name: 'GDevelop Assistant',
    icon: '&#127918;',
    platform: 'Launcher · Editor',
    desc: 'Grudge services manager and game launcher. Connect backends, browse assets, and launch all Grudge games from one hub.',
    tags: ['Launcher', 'Editor', 'Assets', 'Services'],
    type: 'browser',
    primaryLabel: 'Open Launcher',
    primaryUrl: 'https://gdevelop-assistant.vercel.app',
    secondaryLabel: 'Asset Gallery',
    secondaryUrl: 'https://gdevelop-assistant.vercel.app/asset-gallery',
  },
];

// ── Render game cards ──────────────────────────────────────────
function renderGameGrid() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;

  grid.innerHTML = GAMES.map(g => {
    const statusClass = g.type === 'minecraft' ? '' : 'browser';
    const statusText = g.type === 'minecraft' ? 'Checking...' : 'Browser — Always On';
    const statusId = g.type === 'minecraft' ? 'id="mcStatus"' : '';

    let extra = '';
    if (g.serverIp) {
      extra = `
        <div class="mc-ip-row">
          <div class="mc-ip-box" id="mcIpBox" onclick="copyMcIp()">
            <code>${g.serverIp}</code>
            <span class="copy-icon">⎘</span>
          </div>
        </div>`;
    }

    const tags = (g.tags || []).map(t => `<span class="game-tag">${t}</span>`).join('');

    let actions = `<a href="${g.primaryUrl}" target="_blank" rel="noopener" class="game-btn primary">${g.primaryLabel}</a>`;
    if (g.secondaryLabel && g.serverIp) {
      actions += `<button class="game-btn secondary" onclick="copyMcIp()">${g.secondaryLabel}</button>`;
    } else if (g.secondaryLabel && g.secondaryUrl) {
      actions += `<a href="${g.secondaryUrl}" target="_blank" rel="noopener" class="game-btn secondary">${g.secondaryLabel}</a>`;
    }

    return `
      <div class="game-card" data-game="${g.id}">
        <div class="game-card-header">
          <div class="game-icon">${g.icon}</div>
          <div>
            <div class="game-card-title">${g.name}</div>
            <div class="game-card-platform">${g.platform}</div>
          </div>
        </div>
        <div class="game-status" ${statusId}>
          <span class="status-dot ${statusClass}"></span>
          <span class="status-text">${statusText}</span>
        </div>
        ${extra}
        <div class="game-card-desc">${g.desc}</div>
        <div class="game-card-tags">${tags}</div>
        <div class="game-card-actions">${actions}</div>
      </div>`;
  }).join('');
}

// ── MC server status ───────────────────────────────────────────
async function checkMcStatus() {
  const el = document.getElementById('mcStatus');
  if (!el) return;
  const dot = el.querySelector('.status-dot');
  const text = el.querySelector('.status-text');
  const heroPlayers = document.getElementById('mcPlayers');

  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${MC_IP}:${MC_PORT}`);
    const data = await res.json();

    if (data.online) {
      dot.className = 'status-dot online';
      const p = data.players || {};
      text.textContent = `Online — ${p.online || 0}/${p.max || '?'} players`;
      if (heroPlayers) heroPlayers.textContent = p.online || 0;
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'Offline';
      if (heroPlayers) heroPlayers.textContent = '0';
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Status unavailable';
  }
}

// ── Copy MC IP ─────────────────────────────────────────────────
function copyMcIp() {
  const ip = `${MC_IP}:${MC_PORT}`;
  navigator.clipboard.writeText(ip).then(() => {
    const box = document.getElementById('mcIpBox');
    if (box) {
      box.classList.add('copied');
      setTimeout(() => box.classList.remove('copied'), 2000);
    }
  });
}

// ── Auth UI ────────────────────────────────────────────────────
function showAuthModal() {
  document.getElementById('authOverlay').classList.remove('hidden');
}
function hideAuthModal() {
  document.getElementById('authOverlay').classList.add('hidden');
}

async function authGrudgeLogin() {
  hideAuthModal();
  try {
    // Redirect to Grudge auth gateway
    if (typeof Grudge !== 'undefined') {
      Grudge.auth.oauth('discord');
    } else {
      window.location.href = 'https://id.grudge-studio.com/auth/login?redirect_uri=' + encodeURIComponent(window.location.href);
    }
  } catch (e) {
    console.error('Auth error:', e);
  }
}

async function authDiscord() {
  hideAuthModal();
  if (typeof Grudge !== 'undefined') {
    Grudge.auth.discord();
  } else {
    window.location.href = 'https://id.grudge-studio.com/auth/discord?redirect_uri=' + encodeURIComponent(window.location.href);
  }
}

async function authGuest() {
  hideAuthModal();
  try {
    if (typeof Grudge !== 'undefined') {
      await Grudge.auth.guest();
      updateAuthUI();
    }
  } catch (e) {
    console.error('Guest auth error:', e);
  }
}

function updateAuthUI() {
  const controls = document.getElementById('authControls');
  if (!controls) return;

  const user = (typeof Grudge !== 'undefined' && Grudge.auth.isLoggedIn())
    ? Grudge.auth.user()
    : null;

  if (user) {
    const initial = (user.username || user.grudgeId || 'G')[0].toUpperCase();
    const name = user.username || user.grudgeId || 'Player';
    controls.innerHTML = `
      <div class="user-pill">
        <div class="user-avatar">${initial}</div>
        <span class="user-name">${name}</span>
      </div>
      <button class="auth-btn logout" onclick="doLogout()">Sign Out</button>`;
  } else {
    controls.innerHTML = `<button class="auth-btn login" onclick="showAuthModal()">Sign In</button>`;
  }
}

async function doLogout() {
  if (typeof Grudge !== 'undefined') {
    await Grudge.auth.logout();
  }
  updateAuthUI();
}

// ── Particles ──────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 6}s`;
    p.style.width = p.style.height = `${1 + Math.random() * 3}px`;
    container.appendChild(p);
  }
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  createParticles();
  renderGameGrid();
  checkMcStatus();
  setInterval(checkMcStatus, 60000);

  // Try auto-login via Grudge SDK
  if (typeof Grudge !== 'undefined') {
    try { await Grudge.auth.init(); } catch {}
    updateAuthUI();
  }
});
