// ═══════════════════════════════════════════════════════════════
// GRUDGE STUDIOS — Server Lobby Script
// ═══════════════════════════════════════════════════════════════

const BACKEND_URL = 'https://api.grudge-studio.com';
const WARLORDS_URL = 'https://grudgewarlords.com';

// ── Game server definitions ────────────────────────────────────
const GAMES = [
  {
    id: 'warlords',
    name: 'Grudge Warlords',
    icon: '&#9876;',
    platform: 'Open World MMO',
    desc: 'Souls-like browser MMO with 4 classes, 6 races, faction wars, 17 weapon types, island conquest, crew PvP, and AI companions. The flagship Grudge experience.',
    tags: ['Souls-Like', 'MMO', 'Open World', 'PvP', 'Factions', 'Crafting'],
    type: 'server',
    primaryLabel: 'Play Now',
    primaryUrl: WARLORDS_URL,
    secondaryLabel: 'Weapon Atlas',
    secondaryUrl: WARLORDS_URL + '/weapon-skill-tree.html',
  },
  {
    id: 'builder',
    name: 'Grudge Builder',
    icon: '&#128100;',
    platform: 'Character Hub',
    desc: 'Create and manage characters, assign gear, build skill trees, manage your island and roster. Shared across all Grudge games.',
    tags: ['Character Creator', 'Islands', 'Roster', 'Skills'],
    type: 'browser',
    primaryLabel: 'Open Builder',
    primaryUrl: 'https://grudge-builder.vercel.app',
    secondaryLabel: 'Compendium',
    secondaryUrl: WARLORDS_URL + '/character',
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
    desc: 'Crafting calculator, profession trees, item database with 3,400+ items, and gear planning for all Grudge Warlords content.',
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
    const isServer = g.type === 'server';
    const statusClass = isServer ? '' : 'browser';
    const statusText = isServer ? 'Checking server...' : 'Browser — Always On';
    const statusId = isServer ? 'id="serverStatus"' : '';

    const tags = (g.tags || []).map(t => `<span class="game-tag">${t}</span>`).join('');

    let actions = `<a href="${g.primaryUrl}" target="_blank" rel="noopener" class="game-btn primary">${g.primaryLabel}</a>`;
    if (g.secondaryLabel && g.secondaryUrl) {
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
        <div class="game-card-desc">${g.desc}</div>
        <div class="game-card-tags">${tags}</div>
        <div class="game-card-actions">${actions}</div>
      </div>`;
  }).join('');
}

// ── Server status (Grudge backend + Warlords) ──────────────────
async function checkServerStatus() {
  const el = document.getElementById('serverStatus');
  if (!el) return;
  const dot = el.querySelector('.status-dot');
  const text = el.querySelector('.status-text');
  const heroPlayers = document.getElementById('heroPlayers');

  try {
    // Check Warlords API health + stats in parallel
    const [healthRes, statsRes] = await Promise.allSettled([
      fetch(WARLORDS_URL + '/api/health'),
      fetch(WARLORDS_URL + '/api/public/stats'),
    ]);

    const healthOk = healthRes.status === 'fulfilled' && healthRes.value.ok;

    if (healthOk) {
      dot.className = 'status-dot online';
      // Try to get player count from stats
      let playerText = 'Online';
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const stats = await statsRes.value.json();
        const total = stats.totalPlayers || stats.players || stats.accounts || 0;
        if (total > 0) playerText = `Online — ${total} players registered`;
        if (heroPlayers) heroPlayers.textContent = total;
      }
      text.textContent = playerText;
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'Server Maintenance';
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Status unavailable';
  }
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
    if (typeof Grudge !== 'undefined') {
      Grudge.auth.oauth('discord');
    } else {
      window.location.href = BACKEND_URL + '/auth/login?redirect_uri=' + encodeURIComponent(window.location.href);
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
    window.location.href = BACKEND_URL + '/auth/discord?redirect_uri=' + encodeURIComponent(window.location.href);
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
  checkServerStatus();
  setInterval(checkServerStatus, 60000);

  // Try auto-login via Grudge SDK
  if (typeof Grudge !== 'undefined') {
    try { await Grudge.auth.init(); } catch {}
    updateAuthUI();
  }
});
