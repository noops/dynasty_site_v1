async function checkPicks() {
    const res = await fetch("https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1");
    const data = await res.json();
    const picks = data.filter(d => !d.player.position || d.player.name.includes('Round'));
    console.log("Picks found:", picks.length);
    if (picks.length > 0) {
        console.log("Sample pick:", JSON.stringify(picks[0], null, 2));
    }
}
checkPicks();
