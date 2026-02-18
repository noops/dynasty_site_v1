import ReactMarkdown from "react-markdown";
import { FileText, ShieldAlert } from "lucide-react";
import { getLeague } from "@/lib/sleeper";

const LEAGUE_ID = "1203080446066307072";

export default async function BylawsPage() {
    const league = await getLeague(LEAGUE_ID);

    const rosterCount: Record<string, number> = {};
    league.roster_positions.forEach((pos: string) => {
        rosterCount[pos] = (rosterCount[pos] || 0) + 1;
    });

    const rosterDisplay = Object.entries(rosterCount)
        .filter(([pos]) => pos !== 'BN' && pos !== 'IR')
        .map(([pos, count]) => `${count} ${pos}`)
        .join(', ');

    const BYLAWS_MD = `
# League Bylaws: ${league.name}

## 1. League Overview
This is a **Shmantasy Shmootball** league intended for long-term competition. Managers are expected to remain active year-round.

## 2. Roster Settings
- **Total Rosters**: ${league.total_rosters} Teams
- **Active Roster**: ${rosterDisplay}
- **Bench Slots**: ${league.settings.reserve_slots || 0} IR, ${league.settings.taxi_slots || 0} Taxi
- **Position Limits**: Check league settings for specific position caps.

## 3. Scoring System
- **PPR**: ${league.scoring_settings.rec || 0} point(s) per reception.
- **Passing**: ${league.scoring_settings.pass_td || 0} pts per TD.
- **Rushing/Receiving**: Check full settings for yardage bonuses.

## 4. Trades & Transactions
- **Trade Deadline**: Week ${league.settings.trade_deadline || 'None'}.
- **Trade Vetoes**: Commissioner discretion only (anti-collusion).
- **Waivers**: FAAB (Budget: $100).

## 5. Playoffs
- **Teams**: ${league.settings.playoff_teams} Teams.
- **Start Week**: Week ${league.settings.playoff_week_start}.
- **Tie-break**: Most points for (Season).

## 6. Rookie Draft
- **Format**: Linear.
- **Order**: Determined by Max PF for non-playoff teams.
`;

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">League Bylaws</h1>
                <p className="text-muted-foreground text-base lg:text-lg">The constitution of our competition.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 lg:gap-10">
                <div className="glass p-6 lg:p-10 rounded-3xl border border-white/5 prose prose-invert max-w-none prose-headings:font-outfit prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-xl lg:prose-h2:text-2xl prose-h2:mt-10 prose-p:text-muted-foreground prose-li:text-muted-foreground">
                    <ReactMarkdown>{BYLAWS_MD}</ReactMarkdown>
                </div>

                <aside className="space-y-6">
                    <div className="glass p-6 rounded-2xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <ShieldAlert className="w-5 h-5" />
                            <h3 className="font-bold">Quick Rules</h3>
                        </div>
                        <ul className="space-y-4 text-sm">
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">Trade Deadline</span>
                                <span className="font-bold">Week {league.settings.trade_deadline}</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">Playoff Teams</span>
                                <span className="font-bold">{league.settings.playoff_teams}</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">Scoring Type</span>
                                <span className="font-bold">{league.scoring_settings.rec === 1 ? "PPR" : "Standard"}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass p-6 rounded-2xl border border-white/5">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            Resources
                        </h3>
                        <div className="space-y-2">
                            <button className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors text-left uppercase font-bold tracking-tighter">
                                Official Sleeper Link
                            </button>
                            <button className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors text-left uppercase font-bold tracking-tighter">
                                View Trade Block
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
