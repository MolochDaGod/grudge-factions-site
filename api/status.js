// Vercel serverless function — returns Grudge Studios server status
// Checks both the unified backend and Grudge Warlords API
export default async function handler(req, res) {
  const WARLORDS_URL = 'https://grudgewarlords.com';
  const BACKEND_URL = 'https://api.grudge-studio.com';

  try {
    const [warlords, backend] = await Promise.allSettled([
      fetch(WARLORDS_URL + '/api/health', { signal: AbortSignal.timeout(5000) }),
      fetch(BACKEND_URL + '/api/health', { signal: AbortSignal.timeout(5000) }),
    ]);

    const warlordsOk = warlords.status === 'fulfilled' && warlords.value.ok;
    const backendOk = backend.status === 'fulfilled' && backend.value.ok;

    // Try to get player stats
    let stats = {};
    try {
      const statsRes = await fetch(WARLORDS_URL + '/api/public/stats', { signal: AbortSignal.timeout(5000) });
      if (statsRes.ok) stats = await statsRes.json();
    } catch {}

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      online: warlordsOk || backendOk,
      services: {
        warlords: warlordsOk,
        backend: backendOk,
      },
      players: stats.totalPlayers || stats.players || stats.accounts || 0,
      heroes: stats.totalHeroes || stats.heroes || 0,
      battles: stats.totalBattles || stats.battles || 0,
    });
  } catch (err) {
    res.status(200).json({ online: false, error: 'Status check failed' });
  }
}
