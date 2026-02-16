export async function getMarketValues() {
    // Parameters for 12 team Superflex PPR
    const res = await fetch("https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1");
    const data = await res.json();

    const valueMap: Record<string, number> = {};

    data.forEach((item: any) => {
        if (item.player.sleeperId) {
            valueMap[item.player.sleeperId] = item.value;
        }
        // Map picks
        if (item.player.name) {
            valueMap[item.player.name] = item.value;
        }
    });

    return valueMap;
}
