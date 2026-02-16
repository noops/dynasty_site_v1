"use client";

import { useEffect, useState } from "react";
import { getAllTrades, getLeagueUsers, getLeagueRosters } from "@/lib/sleeper";
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
import { BarChart3, TrendingUp } from "lucide-react";

const LEAGUE_ID = "1203080446066307072";

export default function AnalyticsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const trades = await getAllTrades(LEAGUE_ID);
            const rosters = await getLeagueRosters(LEAGUE_ID);
            const users = await getLeagueUsers(LEAGUE_ID);

            const tradeCounts: Record<number, number> = {};

            trades.forEach((trade: any) => {
                trade.roster_ids.forEach((id: number) => {
                    tradeCounts[id] = (tradeCounts[id] || 0) + 1;
                });
            });

            interface ChartData {
                name: string;
                trades: number;
            }

            const chartData: ChartData[] = rosters.map((roster: any) => {
                const user = users.find((u: any) => u.user_id === roster.owner_id);
                return {
                    name: user?.display_name || `Team ${roster.roster_id}`,
                    trades: tradeCounts[roster.roster_id] || 0
                };
            }).sort((a: ChartData, b: ChartData) => b.trades - a.trades);

            setData(chartData);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return <div className="p-20 text-center">Loading analytics...</div>;

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-5xl font-outfit font-bold gradient-text pb-2">Trade Analytics</h1>
                <p className="text-muted-foreground text-lg">Who is the biggest wheeler-dealer?</p>
            </header>

            <div className="glass p-8 rounded-3xl border border-white/5 h-[500px]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Trades per Team</h2>
                </div>

                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#121212',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                color: '#fff'
                            }}
                        />
                        <Bar dataKey="trades" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${263 + (index * 20)}, 70%, 50%)`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-1">Most Active</p>
                    <p className="text-2xl font-bold">{data[0]?.name}</p>
                    <p className="text-3xl text-primary font-outfit font-bold">{data[0]?.trades} Trades</p>
                </div>
                <div className="glass p-6 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-1">League Average</p>
                    <p className="text-2xl font-bold">
                        {(data.reduce((acc, curr) => acc + curr.trades, 0) / data.length).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Trades per team</p>
                </div>
                <div className="glass p-6 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-1">Total Blockbusters</p>
                    <p className="text-2xl font-bold">
                        {data.reduce((acc, curr) => acc + curr.trades, 0) / 2}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Season total</p>
                </div>
            </div>
        </div>
    );
}
