import { getLeague, getLeagueRosters, getLeagueUsers, getLeagueWinners } from "@/lib/sleeper";
import { Trophy, Calendar, Medal } from "lucide-react";

const LEAGUE_ID = "1203080446066307072";

async function getHistoricalChampions() {
    let currentId: string | null = LEAGUE_ID;
    const history = [];

    while (currentId && currentId !== "0") {
        const league = await getLeague(currentId);
        if (!league || league.status === "not_found") break;

        const winners = await getLeagueWinners(currentId);
        const rosters = await getLeagueRosters(currentId);
        const users = await getLeagueUsers(currentId);

        // The winners_bracket returns a list of matches. 
        // Usually the last match with p=1 or the one where "w" exists for the champion.
        // Simplifying: Find the roster_id of the winner.
        const championshipMatch = winners.find((m: any) => m.p === 1);
        const winnerRosterId = championshipMatch?.w;
        const winnerRoster = rosters.find((r: any) => r.roster_id === winnerRosterId);
        const winnerUser = users.find((u: any) => u.user_id === winnerRoster?.owner_id);

        history.push({
            year: league.season,
            name: league.name,
            id: currentId,
            champion: winnerUser?.display_name || "TBD"
        });

        currentId = league.previous_league_id;
    }
    return history;
}

export default async function HistoryPage() {
    const history = await getHistoricalChampions();

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-5xl font-outfit font-bold gradient-text pb-2">League History</h1>
                <p className="text-muted-foreground text-lg">Walking back through time...</p>
            </header>

            <div className="relative border-l-2 border-primary/20 ml-4 pl-10 space-y-12 py-10">
                {history.map((league, index) => (
                    <div key={league.id} className="relative group">
                        <div className="absolute -left-[51px] top-0 w-10 h-10 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10">
                            <Trophy className="w-5 h-5 text-primary" />
                        </div>

                        <div className="glass p-8 rounded-3xl border border-white/5 hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold font-mono">
                                    {league.year}
                                </div>
                                <h2 className="text-2xl font-outfit font-bold">{league.name}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                        <Medal className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Champion</p>
                                        <p className="font-bold">{league.champion}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">League ID</p>
                                        <p className="font-bold font-mono text-sm">{league.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
