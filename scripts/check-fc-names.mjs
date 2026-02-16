async function findNames() {
    const res = await fetch("https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1");
    const data = await res.json();
    console.log("Names starting with 20:", data.filter(d => d.player.name.startsWith('20')).map(d => d.player.name));
}
findNames();
