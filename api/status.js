// Vercel serverless function - proxies Minecraft server status
// This avoids CORS issues and lets us cache the result

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://api.mcsrvstat.us/3/26.228.21.150:25565');
    const data = await response.json();

    res.status(200).json({
      online: data.online || false,
      players: data.players || { online: 0, max: 0 },
      version: data.version || null,
      motd: data.motd?.clean?.[0] || null,
    });
  } catch {
    res.status(200).json({ online: false, players: { online: 0, max: 0 } });
  }
}
