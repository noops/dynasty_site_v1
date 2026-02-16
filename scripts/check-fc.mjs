async function checkData() {
    const res = await fetch("https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1");
    const data = await res.json();
    console.log("Total players:", data.length);
    if (data.length > 0) {
        console.log("Sample player:", JSON.stringify(data[0], null, 2));
    }
}
checkData();
