export async function getPlayers() {
    // Static fetch for local or build time if needed
    // In a real production app with Next.js, we often use a local JSON or a light DB 
    // because the Sleeper players.json is 50MB+.
    const res = await fetch('https://api.sleeper.app/v1/players/nfl');
    return res.json();
}
