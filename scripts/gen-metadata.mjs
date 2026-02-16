import fs from 'fs';
import path from 'path';

const rawData = fs.readFileSync('nfl_players.json', 'utf-8');
const players = JSON.parse(rawData);

const metadata = {};

Object.keys(players).forEach(id => {
    const p = players[id];
    metadata[id] = {
        n: p.full_name || `${p.first_name} ${p.last_name}`,
        p: p.position,
        t: p.team,
        bd: p.birth_date
    };
});

// Ensure directory exists
if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
}

fs.writeFileSync('src/data/player_metadata.json', JSON.stringify(metadata));
console.log('Metadata generated successfully');
