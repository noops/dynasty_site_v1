const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export async function getLeague(leagueId: string) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}`);
    return res.json();
}

export async function getLeagueRosters(leagueId: string) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/rosters`);
    return res.json();
}

export async function getLeagueUsers(leagueId: string) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/users`);
    return res.json();
}

export async function getLeagueTransactions(league_id: string, round: number = 1) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${league_id}/transactions/${round}`);
    return res.json();
}

export async function getLeagueWinners(league_id: string) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${league_id}/winners_bracket`);
    return res.json();
}

export async function getLeagueMatchups(league_id: string, week: number) {
    const res = await fetch(`${SLEEPER_API_BASE}/league/${league_id}/matchups/${week}`);
    return res.json();
}

export async function getLeagueHistory(league_id: string) {
    let leagues = [];
    let currentId: string | null = league_id;

    while (currentId && currentId !== '0') {
        const league = await getLeague(currentId);
        if (!league || league.status === 'not_found') break;
        leagues.push(league);
        currentId = league.previous_league_id;
    }
    return leagues;
}

export async function getAllTrades(leagueId: string) {
    // Typically we check all 18 weeks (standard NFL season + playoffs)
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    const allTransactions = await Promise.all(
        weeks.map(week => getLeagueTransactions(leagueId, week))
    );

    return allTransactions.flat().filter(t => t.type === 'trade');
}
