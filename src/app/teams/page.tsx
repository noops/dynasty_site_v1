"use client";

import { useEffect, useState } from "react";
import {
    getLeagueRosters,
    getLeagueUsers,
    getTradedPicks
} from "@/lib/sleeper";
import { getMarketValues } from "@/lib/fantasy_calc";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    ChevronDown,
    ChevronUp,
    Star,
    TrendingUp,
    TrendingDown,
    Clock,
    Dna,
    LayoutDashboard,
    ArrowRightLeft,
    ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import metadata from "@/data/player_metadata.json";

const LEAGUE_ID = "1203080446066307072";
const playerMetadata: Record<string, any> = metadata;

interface TeamAnalysis {
    roster_id: number;
    ownerName: string;
    avatar: string | null;
    players: any[];
    picks: any[];
    avgAge: number;
    posStrengths: Record<string, number>;
    summary: string;
    status: "Contender" | "Rebuilding" | "Middling" | "Determining";
    totalValue: number;
    pickValue: number;
    rank: number;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<TeamAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

    useEffect(() => {
        async function fetchTeamData() {
            setLoading(true);
            try {
                const [rosters, users, tradedPicks, marketMap] = await Promise.all([
                    getLeagueRosters(LEAGUE_ID),
                    getLeagueUsers(LEAGUE_ID),
                    getTradedPicks(LEAGUE_ID),
                    getMarketValues()
                ]);

                const analyzedTeams = rosters.map((roster: any) => {
                    const user = users.find((u: any) => u.user_id === roster.owner_id);

                    // Players Logic
                    const teamPlayers = (roster.players || []).map((pid: string) => ({
                        id: pid,
                        ...(playerMetadata[pid] || { n: "Unknown Player", p: "???" })
                    }));

                    // Age Calculation
                    let totalAge = 0;
                    let count = 0;
                    const currentYear = new Date().getFullYear();
                    teamPlayers.forEach((p: any) => {
                        if (p.bd) {
                            const birthYear = new Date(p.bd).getFullYear();
                            totalAge += (currentYear - birthYear);
                            count++;
                        }
                    });
                    const avgAge = count > 0 ? totalAge / count : 0;

                    // Positional Strengths
                    const counts: Record<string, number> = {};
                    teamPlayers.forEach((p: any) => {
                        counts[p.p] = (counts[p.p] || 0) + 1;
                    });

                    // Picks Logic
                    const myPicks = [];
                    // Default own picks (Rounds 1-3 for 2026)
                    for (let r = 1; r <= 3; r++) {
                        const isTraded = tradedPicks.some((tp: any) =>
                            tp.season === "2026" &&
                            tp.round === r &&
                            tp.previous_owner_id === roster.roster_id
                        );
                        if (!isTraded) {
                            myPicks.push({ season: "2026", round: r, org: "OWN" });
                        }
                    }
                    // Acquired picks
                    tradedPicks.forEach((tp: any) => {
                        if (tp.season === "2026" && tp.owner_id === roster.roster_id) {
                            const origRoster = rosters.find((r: any) => r.roster_id === tp.previous_owner_id);
                            const origUser = users.find((u: any) => u.user_id === origRoster?.owner_id);
                            myPicks.push({
                                season: tp.season,
                                round: tp.round,
                                org: origUser?.display_name || `Roster ${tp.previous_owner_id}`
                            });
                        }
                    });

                    // Value Calculation
                    let playerVal = 0;
                    teamPlayers.forEach((p: any) => {
                        playerVal += marketMap[p.id] || 0;
                    });

                    let pickVal = 0;
                    myPicks.forEach((p: any) => {
                        const pickName = `${p.season} ${p.round}${p.round === 1 ? 'st' : p.round === 2 ? 'nd' : 'rd'}`;
                        pickVal += marketMap[pickName] || 0;
                    });

                    const totalValue = playerVal + pickVal;
                    const pickRatio = pickVal / totalValue;

                    // Status & Summary Generation
                    let status: "Contender" | "Rebuilding" | "Middling" | "Determining" = "Middling";

                    // Logic: High pick value or high pick ratio + young age = Rebuilding
                    if (pickVal > 8500 || (pickRatio > 0.12 && avgAge < 25.8)) {
                        status = "Rebuilding";
                    }
                    // Logic: top 4 in total value or high wins or veteran core with wins = Contender
                    // Note: Rank is calculated later, so we'll use a value threshold for now (~75k is usually top tier)
                    else if (totalValue > 78000 || roster.settings.wins > 16 || (avgAge > 26.5 && roster.settings.wins > 10)) {
                        status = "Contender";
                    }

                    const sortedPlayers = [...teamPlayers].sort((a: any, b: any) => (marketMap[b.id] || 0) - (marketMap[a.id] || 0));
                    const starPlayers = sortedPlayers.slice(0, 3).map((p: any) => p.n);

                    const summary = status === "Contender"
                        ? `${user?.display_name} is in clear 'Win Now' mode with a veteran core (Avg Age ${avgAge.toFixed(1)}). The roster is headlined by elite talent like ${starPlayers.slice(0, 2).join(" and ")}, carrying a total market value of ${Math.round(totalValue / 1000)}k. They are all-in for a championship.`
                        : status === "Rebuilding"
                            ? `A classic 'Process' build for ${user?.display_name}. With ${Math.round(pickVal / 1000)}k in raw draft capital (${(pickRatio * 100).toFixed(0)}% of team value) and a youthful average age of ${avgAge.toFixed(1)}, the future is locked in. ${starPlayers[0]} serves as the cornerstone of this rising dynasty.`
                            : `${user?.display_name} is navigating the 'Mushy Middle'. While they possess solid assets like ${starPlayers[0]}, the squad currently lacks the top-end value to push for a title or the draft capital to fully pivot. Total team value sits at ${Math.round(totalValue / 1000)}k.`;

                    return {
                        roster_id: roster.roster_id,
                        ownerName: user?.display_name || "Unknown",
                        avatar: user?.avatar || null,
                        players: sortedPlayers.map(p => ({ ...p, val: marketMap[p.id] || 0 })),
                        picks: myPicks.sort((a: any, b: any) => a.round - b.round),
                        avgAge,
                        posStrengths: counts,
                        summary,
                        status,
                        totalValue,
                        pickValue: pickVal,
                        rank: 0
                    };
                });

                const rankedTeams = analyzedTeams
                    .sort((a: TeamAnalysis, b: TeamAnalysis) => b.totalValue - a.totalValue)
                    .map((team: TeamAnalysis, idx: number) => ({ ...team, rank: idx + 1 }));

                setTeams(rankedTeams.sort((a: TeamAnalysis, b: TeamAnalysis) => a.ownerName.localeCompare(b.ownerName)));
            } catch (err) {
                console.error("Failed to fetch teams", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTeamData();
    }, []);

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text">Team Overviews</h1>
                <p className="text-muted-foreground text-sm lg:text-base max-w-2xl">
                    Comprehensive roster analysis, asset tracking, and strategic outlook for every franchise in the league.
                </p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-outfit animate-pulse uppercase tracking-widest text-xs font-bold">Infiltrating Front Offices...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    {teams.map((team: TeamAnalysis) => (
                        <div
                            key={team.roster_id}
                            className={cn(
                                "group transition-all duration-300",
                                expandedTeam === team.roster_id ? "col-span-1" : ""
                            )}
                        >
                            <div
                                onClick={() => setExpandedTeam(expandedTeam === team.roster_id ? null : team.roster_id)}
                                className={cn(
                                    "glass rounded-3xl p-6 cursor-pointer border border-white/5 hover:border-primary/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden",
                                    expandedTeam === team.roster_id && "border-primary/40 bg-primary/5"
                                )}
                            >
                                <div className="flex items-center gap-6 z-10">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                                            {team.avatar ? (
                                                <img
                                                    src={`https://sleepercdn.com/avatars/thumbs/${team.avatar}`}
                                                    alt={team.ownerName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Users className="w-8 h-8 text-white/20" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="text-xl font-bold font-outfit group-hover:text-primary transition-colors">{team.ownerName}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-mono font-bold text-primary backdrop-blur-md">RANK #{team.rank}</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg text-[9px] font-bold border backdrop-blur-md",
                                                    team.status === "Contender" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        team.status === "Rebuilding" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                            "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                                )}>
                                                    {team.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Avg Age: {team.avgAge.toFixed(1)}</span>
                                            <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3 h-3" /> {team.players.length} Players</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 z-10">
                                    <div className="hidden md:flex flex-col items-end">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Value</p>
                                        <p className="text-lg font-bold font-mono text-primary">{Math.round(team.totalValue / 1000)}k</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end border-l border-white/10 pl-8">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Pick Capital</p>
                                        <p className="text-lg font-bold font-mono text-white/80">{Math.round(team.pickValue / 1000)}k</p>
                                    </div>
                                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
                                        {expandedTeam === team.roster_id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none opacity-50"></div>
                            </div>

                            <AnimatePresence>
                                {expandedTeam === team.roster_id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
                                            {/* Summary & Analytics */}
                                            <div className="glass rounded-3xl p-8 border border-white/10 lg:col-span-2 space-y-8 bg-gradient-to-br from-primary/5 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                        <ScrollText className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold font-outfit">Franchise Summary</h4>
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {team.summary}
                                                </p>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                                    {Object.entries(team.posStrengths).map(([pos, count]) => (
                                                        <div key={pos} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">{pos}</p>
                                                            <p className="text-xl font-bold font-mono">{count}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Asset List */}
                                            <div className="glass rounded-3xl p-8 border border-white/10 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                                        <ArrowRightLeft className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold font-outfit">Trade Assets</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">2026 Draft Picks</p>
                                                    {team.picks.map((pick, i) => (
                                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                            <span className="text-sm font-bold">{pick.season} Round {pick.round}</span>
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{pick.org}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Roster List */}
                                            <div className="glass rounded-3xl p-8 border border-white/10 lg:col-span-3 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                                        <Dna className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold font-outfit">Roster Foundation</h4>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                    {team.players.map((p) => (
                                                        <div key={p.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group/player flex flex-col justify-between min-h-[70px]">
                                                            <div>
                                                                <p className="text-xs font-bold truncate group-hover/player:text-primary transition-colors">{p.n}</p>
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{p.p} • {p.t || "FA"}</p>
                                                            </div>
                                                            <div className="mt-2 text-[10px] font-mono font-bold text-primary/80">
                                                                {p.val > 0 ? `${Math.round(p.val).toLocaleString()}` : "—"}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
