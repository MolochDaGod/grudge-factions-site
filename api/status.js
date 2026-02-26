// Vercel serverless function — returns server status
// Called by the site for real-time server checking
export default async function handler(req, res) {
  const SERVER_IP = '26.228.21.150';
  const SERVER_PORT = 25565;

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}:${SERVER_PORT}`);
    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      online: data.online || false,
      players: data.players || { online: 0, max: 20 },
      version: data.version || '1.20.1',
      motd: data.motd?.clean?.[0] || 'Grudge Factions'
    });
  } catch (err) {
    res.status(200).json({ online: false, error: 'Status check failed' });
  }
}
