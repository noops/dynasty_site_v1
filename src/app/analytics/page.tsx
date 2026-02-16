"use client";

import { useEffect, useState } from "react";
import { getAllTrades, getLeagueUsers, getLeagueRosters } from "@/lib/sleeper";
import { getMarketValues } from "@/lib/fantasy_calc";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { TrendingUp, Trophy, ArrowRightLeft, DollarSign, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const LEAGUE_ID = "1203080446066307072";

export default function AnalyticsPage() {
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [trades, rosters, users, marketValues] = await Promise.all([
                getAllTrades(LEAGUE_ID),
                getLeagueRosters(LEAGUE_ID),
                getLeagueUsers(LEAGUE_ID),
                getMarketValues()
            ]);

            const tradeCounts: Record<number, number> = {};
            const winCounts: Record<number, number> = {};
            const totalValueTraded: Record<number, number> = {};

            const getValue = (id: string | number, type: 'player' | 'pick', pickInfo?: any) => {
                if (type === 'player') return marketValues[id.toString()] || 100;
                const name = `${pickInfo.season} ${pickInfo.round}${pickInfo.round === 1 ? 'st' : pickInfo.round === 2 ? 'nd' : pickInfo.round === 3 ? 'rd' : 'th'}`;
                return marketValues[name] || Math.max(0, 3000 - (pickInfo.round * 700));
            };

            trades.forEach((trade: any) => {
                const sides = trade.roster_ids.map((rosterId: number) => {
                    const adds = Object.entries(trade.adds || {}).filter(([_, rId]) => rId === rosterId);
                    const picks = (trade.draft_picks || []).filter((pick: any) => pick.owner_id === rosterId);

                    let total = 0;
                    adds.forEach(([pId]) => total += getValue(pId, 'player'));
                    picks.forEach((p: any) => total += getValue(0, 'pick', p));

                    // Stats Trackers
                    tradeCounts[rosterId] = (tradeCounts[rosterId] || 0) + 1;
                    totalValueTraded[rosterId] = (totalValueTraded[rosterId] || 0) + total;

                    return { rosterId, total };
                });

                if (sides.length === 2) {
                    if (sides[0].total > sides[1].total) {
                        winCounts[sides[0].rosterId] = (winCounts[sides[0].rosterId] || 0) + 1;
                    } else if (sides[1].total > sides[0].total) {
                        winCounts[sides[1].rosterId] = (winCounts[sides[1].rosterId] || 0) + 1;
                    }
                }
            });

            interface ChartData {
                name: string;
                trades: number;
                wins: number;
                value: number;
                rosterId: number;
            }

            const chartData: ChartData[] = rosters.map((roster: any) => {
                const user = users.find((u: any) => u.user_id === roster.owner_id);
                const rId = roster.roster_id;
                return {
                    name: user?.display_name || `Team ${rId}`,
                    trades: tradeCounts[rId] || 0,
                    wins: winCounts[rId] || 0,
                    value: totalValueTraded[rId] || 0,
                    rosterId: rId
                };
            }).sort((a: ChartData, b: ChartData) => b.trades - a.trades);

            setData(chartData);

            // Winners lists
            const mostWins = [...chartData].sort((a, b) => b.wins - a.wins)[0];
            const mostValue = [...chartData].sort((a, b) => b.value - a.value)[0];
            const leastValue = [...chartData].sort((a, b) => a.value - b.value)[0];
            const totalLeagueVolume = chartData.reduce((acc, curr) => acc + curr.value, 0) / 2;
            const avgTrades = (chartData.reduce((acc, curr) => acc + curr.trades, 0) / chartData.length).toFixed(1);

            setStats({
                mostActive: chartData[0],
                mostWins,
                mostValue,
                leastValue,
                avgTrades,
                totalLeagueVolume,
                totalTrades: trades.length
            });

            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse font-outfit font-bold uppercase tracking-widest">Crunching Market Data...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">Trade Analytics</h1>
                <p className="text-muted-foreground text-base lg:text-lg">Quantifying the league's deal-makers.</p>
            </header>

            <div className="glass p-6 lg:p-10 rounded-3xl border border-white/5 h-[450px] lg:h-[550px]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Activity Ranking</h2>
                        <p className="text-xs text-muted-foreground">Total trades per manager</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass p-4 rounded-xl border border-primary/20 bg-background/90 backdrop-blur-md shadow-2xl">
                                            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">{payload[0].payload.name}</p>
                                            <p className="text-xl font-outfit font-bold">{payload[0].value} <span className="text-xs text-muted-foreground font-normal">Trades</span></p>
                                            <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] uppercase text-muted-foreground font-bold">Wins</p>
                                                    <p className="text-xs font-bold text-green-400">{payload[0].payload.wins}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] uppercase text-muted-foreground font-bold">Vol Traded</p>
                                                    <p className="text-xs font-bold font-mono">{payload[0].payload.value.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="trades"
                            radius={[6, 6, 0, 0]}
                            activeBar={{
                                fill: 'hsl(263.4, 70%, 50.4%)',
                                strokeWidth: 0,
                            }}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`hsl(${263 + (index * 15)}, 70%, 50%)`}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1 */}
                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">League Average</p>
                        <p className="text-4xl font-outfit font-bold">{stats.avgTrades}</p>
                        <p className="text-xs text-muted-foreground mt-1">Trades per team</p>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Most Market Wins</p>
                        <p className="text-2xl font-outfit font-bold text-white truncate">{stats.mostWins.name}</p>
                        <p className="text-3xl text-green-400 font-bold mt-1">{stats.mostWins.wins} Wins</p>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                            <ArrowRightLeft className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Most Active</p>
                        <p className="text-2xl font-bold truncate">{stats.mostActive.name}</p>
                        <p className="text-3xl text-blue-400 font-bold mt-1">{stats.mostActive.trades} Trades</p>
                    </div>
                </div>

                {/* Row 2: Market Dynamics */}
                <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-primary font-bold uppercase tracking-widest">League Total Volume</p>
                            <p className="text-3xl font-mono font-bold">{Math.round(stats.totalLeagueVolume).toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This reflects the total market value of all assets that have changed hands this season.
                    </p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Market Volume King</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-outfit font-bold truncate">{stats.mostValue.name}</h3>
                                <p className="text-xl font-mono text-green-400 font-bold">{Math.round(stats.mostValue.value).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">Highest total value moved</p>
                            </div>
                        </div>

                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                                    <Zap className="w-4 h-4 opacity-50" />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">The Stagnant Roster</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-outfit font-bold truncate">{stats.leastValue.name}</h3>
                                <p className="text-xl font-mono text-red-400 font-bold">{Math.round(stats.leastValue.value).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">Lowest total value moved</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-center text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Season Velocity</p>
                    <p className="text-5xl font-outfit font-bold gradient-text">{stats.totalTrades}</p>
                    <p className="text-sm text-muted-foreground mt-2 font-bold italic">Verified Blockbusters</p>
                </div>
            </div>
        </div>
    );
}
