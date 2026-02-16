"use client";

import { useEffect, useState } from "react";
import { getLeagueMatchups, getLeagueUsers, getLeagueRosters } from "@/lib/sleeper";
import { cn } from "@/lib/utils";
import { Trophy, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LEAGUE_ID = "1203080446066307072";

export default function RecapPage() {
    const [mode, setMode] = useState<"in-season" | "offseason">("in-season");
    const [week, setWeek] = useState(1);
    const [matchups, setMatchups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [matchupsData, usersData, rostersData] = await Promise.all([
                getLeagueMatchups(LEAGUE_ID, week),
                getLeagueUsers(LEAGUE_ID),
                getLeagueRosters(LEAGUE_ID),
            ]);

            // Group matchups by roster_id pair (matchup_id)
            const grouped: any = {};
            matchupsData.forEach((m: any) => {
                if (!grouped[m.matchup_id]) grouped[m.matchup_id] = [];
                grouped[m.matchup_id].push(m);
            });

            setMatchups(Object.values(grouped));
            setUsers(usersData);
            setRosters(rostersData);
            setLoading(false);
        }
        if (mode === "in-season") {
            fetchData();
        }
    }, [week, mode]);

    const getManagerInfo = (rosterId: number) => {
        const roster = rosters.find((r) => r.roster_id === rosterId);
        const user = users.find((u) => u.user_id === roster?.owner_id);
        return {
            name: user?.display_name || `Team ${rosterId}`,
            avatar: user?.avatar,
        };
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-outfit font-bold gradient-text pb-2">League Recap</h1>
                    <p className="text-muted-foreground text-lg">Detailed analysis of our journey.</p>
                </div>

                <div className="flex bg-secondary/50 p-1 rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setMode("in-season")}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            mode === "in-season" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        In-Season
                    </button>
                    <button
                        onClick={() => setMode("offseason")}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            mode === "offseason" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Offseason
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {mode === "in-season" ? (
                    <motion.div
                        key="in-season"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between glass p-4 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setWeek(Math.max(1, week - 1))}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                disabled={week === 1}
                            >
                                <ChevronLeft className={cn("w-6 h-6", week === 1 ? "opacity-20" : "text-primary")} />
                            </button>
                            <div className="text-center px-8">
                                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Weekly Recap</p>
                                <h2 className="text-2xl font-outfit font-bold">Week {week}</h2>
                            </div>
                            <button
                                onClick={() => setWeek(week + 1)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 text-primary" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-muted-foreground">Loading matchups...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {matchups.map((matchupIdx: any[], i) => {
                                    const teamA = matchupIdx[0];
                                    const teamB = matchupIdx[1];
                                    if (!teamA || !teamB) return null;

                                    const infoA = getManagerInfo(teamA.roster_id);
                                    const infoB = getManagerInfo(teamB.roster_id);
                                    const winner = teamA.points > teamB.points ? "A" : "B";

                                    return (
                                        <div key={i} className="glass rounded-3xl overflow-hidden border border-white/5 group hover:border-primary/20 transition-all duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center p-8 gap-10">
                                                {/* Team A */}
                                                <div className={cn("flex items-center gap-6", winner === "B" && "opacity-40")}>
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-secondary/50 flex items-center justify-center">
                                                            {infoA.avatar ? (
                                                                <img src={`https://sleepercdn.com/avatars/thumbs/${infoA.avatar}`} alt={infoA.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="w-8 h-8 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {winner === "A" && (
                                                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
                                                                <Trophy className="w-4 h-4 text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold font-outfit">{infoA.name}</h3>
                                                        <p className="text-3xl font-bold text-white mt-1 font-mono">{teamA.points.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                {/* VS */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground border border-white/5">
                                                        VS
                                                    </div>
                                                </div>

                                                {/* Team B */}
                                                <div className={cn("flex items-center gap-6 flex-row-reverse text-right", winner === "A" && "opacity-40")}>
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-secondary/50 flex items-center justify-center">
                                                            {infoB.avatar ? (
                                                                <img src={`https://sleepercdn.com/avatars/thumbs/${infoB.avatar}`} alt={infoB.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="w-8 h-8 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {winner === "B" && (
                                                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                                                <Trophy className="w-4 h-4 text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold font-outfit">{infoB.name}</h3>
                                                        <p className="text-3xl font-bold text-white mt-1 font-mono">{teamB.points.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="offseason"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div className="glass p-10 rounded-3xl border border-white/5 md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent">
                            <h2 className="text-3xl font-outfit font-bold mb-4">2026 Offseason Preview</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                                As the final whistle blows on another intense season, the league enters its most volatile phase. Managers are already scouring the rookie boards and hunting for trade leverage. Our Rookie Draft is set for May, and the rumors are already swirling.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Rookie Draft</p>
                                        <p className="font-bold">May 15, 2026</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Trading Status</p>
                                        <p className="font-bold text-green-500">OPEN</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Defending Champ</p>
                                        <p className="font-bold font-outfit">Loading...</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl border border-white/5">
                            <h3 className="text-xl font-bold mb-4">Top Rookie Targets</h3>
                            <ul className="space-y-4">
                                {['Travis Hunter', 'Ashton Jeanty', 'Tetairoa McMillan', 'Luther Burden III'].map((name, i) => (
                                    <li key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-xs font-mono text-primary font-bold">TOP 5 PROSPECT</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass p-8 rounded-3xl border border-white/5">
                            <h3 className="text-xl font-bold mb-4">FAAB Balances</h3>
                            <div className="space-y-4">
                                <p className="text-muted-foreground text-sm">All FAAB has been reset to $100 for the new league year.</p>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
