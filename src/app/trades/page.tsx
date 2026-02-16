import { getAllTrades, getLeagueUsers } from "@/lib/sleeper";
import { ArrowRightLeft, User, Calendar } from "lucide-react";
import { format } from "date-fns";

const LEAGUE_ID = "1203080446066307072";

export default async function TradesPage() {
    const trades = await getAllTrades(LEAGUE_ID);
    const users = await getLeagueUsers(LEAGUE_ID);

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-5xl font-outfit font-bold gradient-text pb-2">League Trades</h1>
                <p className="text-muted-foreground text-lg">Every blockbuster and bench swap.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {trades.length === 0 ? (
                    <div className="glass p-20 rounded-3xl text-center">
                        <ArrowRightLeft className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground text-xl">No trades found for the current season.</p>
                    </div>
                ) : (
                    trades.map((trade: any) => (
                        <div key={trade.transaction_id} className="glass rounded-3xl overflow-hidden border border-white/5">
                            <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Week {trade.leg}</span>
                                </div>
                                <span className="font-mono text-xs opacity-40">#{trade.transaction_id}</span>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-8 items-center">
                                {/* Visualizing who got what can be complex because trade structure has roster_ids and adds/drops */}
                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Team A Receives</p>
                                    <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto max-h-40">
                                        {Object.entries(trade.adds || {}).map(([id, rosterId]) => (
                                            <div key={id}>Player {id}</div>
                                        ))}
                                        {(trade.draft_picks || []).map((pick: any, idx: number) => (
                                            <div key={`${pick.season}-${pick.round}-${pick.roster_id}-${idx}`}>
                                                {pick.season} Round {pick.round}
                                            </div>
                                        ))}
                                    </pre>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                        <ArrowRightLeft className="w-6 h-6 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary text-right">Team B Receives</p>
                                    <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto max-h-40">
                                        {/* Reverse logic would be needed here to show who received what */}
                                        {Object.entries(trade.drops || {}).map(([id, rosterId]) => (
                                            <div key={id}>Player {id}</div>
                                        ))}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
