import fs from 'fs';
import path from 'path';

async function generatePlayerMap() {
    const filePath = path.join(process.cwd(), 'nfl_players.json');
    const playersData = fs.readFileSync(filePath, 'utf8');
    const players = JSON.parse(playersData);

    const map = {};

    Object.keys(players).forEach(id => {
        const p = players[id];
        if (p.full_name) {
            map[id] = p.full_name + ' (' + p.position + ')';
        }
    });

    const targetDir = path.join(process.cwd(), 'src/lib');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(
        path.join(targetDir, 'player_map.json'),
        JSON.stringify(map)
    );
    console.log('Player map generated!');
}

generatePlayerMap();
