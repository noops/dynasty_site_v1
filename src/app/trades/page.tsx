"use client";

import { useEffect, useState } from "react";
import { getAllTrades, getLeagueUsers, getLeagueRosters } from "@/lib/sleeper";
import { getMarketValues } from "@/lib/fantasy_calc";
import { ArrowRightLeft, Calendar, User, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import playerMapData from "@/lib/player_map.json";

const LEAGUE_ID = "1203080446066307072";
const playerMap: Record<string, string> = playerMapData;

export default function TradesPage() {
    const [trades, setTrades] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [marketValues, setMarketValues] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [tradesData, usersData, rostersData, valuesData] = await Promise.all([
                    getAllTrades(LEAGUE_ID),
                    getLeagueUsers(LEAGUE_ID),
                    getLeagueRosters(LEAGUE_ID),
                    getMarketValues()
                ]);
                setTrades(tradesData);
                setUsers(usersData);
                setRosters(rostersData);
                setMarketValues(valuesData);
            } catch (error) {
                console.error("Failed to fetch trade data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getManagerName = (rosterId: number) => {
        const roster = rosters.find(r => r.roster_id === rosterId);
        const user = users.find(u => u.user_id === roster?.owner_id);
        return user?.display_name || `Team ${rosterId}`;
    };

    const getPlayerName = (id: string) => {
        return playerMap[id] || `Unknown Player (${id})`;
    };

    const getPickValue = (pick: any) => {
        // Map Sleeper pick info to FantasyCalc names
        // e.g. "2026 1st"
        const genericName = `${pick.season} ${pick.round}${idxToSuffix(pick.round)}`;
        // FantasyCalc uses "2026 1st" but also specific ones like "2026 Pick 1.05"
        // Since we don't have the spot, we use the generic one
        const simpleName = `${pick.season} ${pick.round}${idxToSuffix(pick.round)}`;

        // FantasyCalc format search:
        const searchNames = [
            `${pick.season} ${pick.round}${idxToSuffix(pick.round)}`, // "2026 1st"
            `${pick.season} Round ${pick.round}` // Fallback
        ];

        for (const name of searchNames) {
            if (marketValues[name]) return marketValues[name];
        }

        // Ultimate fallback if pick value missing from API
        return Math.max(0, 3000 - (pick.round * 700));
    };

    const idxToSuffix = (i: number) => {
        if (i === 1) return 'st';
        if (i === 2) return 'nd';
        if (i === 3) return 'rd';
        return 'th';
    };

    const getValue = (id: string | number, type: 'player' | 'pick', pickInfo?: any) => {
        if (type === 'player') {
            return marketValues[id.toString()] || 100; // Small value for deep scrubs
        }
        return getPickValue(pickInfo);
    };

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse font-outfit">Consulting Market Databases...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">League Trades</h1>
                <p className="text-muted-foreground text-base lg:text-lg">Real-time blockbusters with live FantasyCalc market values.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {trades.length === 0 ? (
                    <div className="glass p-20 rounded-3xl text-center">
                        <ArrowRightLeft className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground text-xl">No trades found for the current season.</p>
                    </div>
                ) : (
                    trades.map((trade: any) => {
                        // Pre-calculate totals for winner logic
                        const sides = trade.roster_ids.map((rosterId: number) => {
                            const adds = Object.entries(trade.adds || {}).filter(([_, rId]) => rId === rosterId);
                            const picks = (trade.draft_picks || []).filter((pick: any) => pick.owner_id === rosterId);

                            let total = 0;
                            adds.forEach(([pId]) => total += getValue(pId, 'player'));
                            picks.forEach((p: any) => total += getValue(0, 'pick', p));

                            return { rosterId, total, adds, picks };
                        });

                        const sideA = sides[0];
                        const sideB = sides[1];
                        const isDraw = sideA.total === sideB.total;

                        return (
                            <div key={trade.transaction_id} className="glass rounded-3xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-300">
                                <div className="bg-secondary/30 px-6 py-4 border-b border-white/5 flex justify-between items-center text-xs lg:text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="font-bold">Week {trade.leg}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Market Analysis Complete</span>
                                        <span className="font-mono opacity-40">#{trade.transaction_id}</span>
                                    </div>
                                </div>

                                <div className="p-6 lg:p-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                                        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 -translate-x-1/2"></div>

                                        {sides.map((side: any) => {
                                            const isWinner = side.total > (sides.find((s: any) => s.rosterId !== side.rosterId)?.total || 0);

                                            return (
                                                <div key={side.rosterId} className="space-y-6">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest whitespace-nowrap">Acquisition by</p>
                                                                {isWinner && !isDraw && (
                                                                    <span className="bg-green-500/10 text-green-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-500/20 uppercase tracking-tighter">
                                                                        Market Winner
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-xl lg:text-2xl font-bold font-outfit truncate">{getManagerName(side.rosterId)}</h3>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Market Value</p>
                                                            <p className={cn("text-xl font-mono font-bold leading-none mt-1", isWinner ? "text-green-400" : "text-white")}>
                                                                {side.total.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {side.adds.map(([playerId]: [string, any]) => {
                                                            const val = getValue(playerId, 'player');
                                                            return (
                                                                <div key={playerId} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group/asset hover:bg-white/10 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                                            <User className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="font-medium text-sm lg:text-base">{getPlayerName(playerId)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold text-[8px]">FC Value</span>
                                                                        <span className="text-xs font-mono text-blue-400 font-bold">{val.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {side.picks.map((pick: any, pIdx: number) => {
                                                            const val = getValue(0, 'pick', pick);
                                                            return (
                                                                <div key={`${pick.season}-${pick.round}-${pIdx}`} className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 group/asset hover:bg-primary/10 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                            <Package className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-sm lg:text-base">
                                                                                {pick.season} Round {pick.round}
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground italic">
                                                                                Org: {getManagerName(pick.roster_id)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold text-[8px]">FC Value</span>
                                                                        <span className="text-xs font-mono text-primary font-bold">{val.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {side.adds.length === 0 && side.picks.length === 0 && (
                                                            <p className="text-xs text-muted-foreground italic">No assets recorded for this side.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] p-4 flex items-center justify-center gap-3 border-t border-white/5">
                                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                        Data Provided by <span className="text-primary">FantasyCalc API</span> &bull; Updated Live
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
