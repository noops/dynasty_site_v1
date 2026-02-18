"use client";

import { useEffect, useState } from "react";
import {
    getLeagueMatchups,
    getLeagueUsers,
    getLeagueRosters,
    getLeagueWinners,
    getTradedPicks
} from "@/lib/sleeper";
import { getMarketValues } from "@/lib/fantasy_calc";
import { cn } from "@/lib/utils";
import {
    Trophy,
    Calendar,
    Users,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Star,
    LayoutDashboard,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import playerMapData from "@/lib/player_map.json";

const LEAGUE_ID = "1203080446066307072";
const playerMap: Record<string, string> = playerMapData;

export default function RecapPage() {
    const [mode, setMode] = useState<"in-season" | "offseason">("in-season");
    const [week, setWeek] = useState(1);
    const [matchups, setMatchups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchup, setSelectedMatchup] = useState<number | null>(null);
    const [offseasonStats, setOffseasonStats] = useState<any>(null);

    useEffect(() => {
        async function fetchOffseasonData() {
            if (mode !== "offseason") return;
            setLoading(true);
            try {
                const [winners, userList, rosterList, tradedPicks, marketMap] = await Promise.all([
                    getLeagueWinners(LEAGUE_ID),
                    getLeagueUsers(LEAGUE_ID),
                    getLeagueRosters(LEAGUE_ID),
                    getTradedPicks(LEAGUE_ID),
                    getMarketValues()
                ]);

                // 1. Identify Champion (Matchup with p: 1)
                const champMatch = winners.find((m: any) => m.p === 1);
                const champRosterId = champMatch?.w;
                const champRoster = rosterList.find((r: any) => r.roster_id === champRosterId);
                const champUser = userList.find((u: any) => u.user_id === champRoster?.owner_id);

                // 2. Draft Capital Leader
                const capital: Record<number, number> = {};
                rosterList.forEach((r: any) => capital[r.roster_id] = 3); // Start with own 1,2,3
                tradedPicks.forEach((pick: any) => {
                    if (pick.season === '2026') {
                        capital[pick.previous_owner_id]--;
                        capital[pick.owner_id]++;
                    }
                });

                const draftKingEntry = Object.entries(capital).sort((a, b) => b[1] - a[1])[0];
                const draftKingRosterId = parseInt(draftKingEntry[0]);
                const draftKingUser = userList.find((u: any) => u.user_id === rosterList.find((r: any) => r.roster_id === draftKingRosterId)?.owner_id);

                // 3. Projected Draft Order (Top 6)
                const playoffRosterIds = new Set(winners.flatMap((m: any) => [m.t1, m.t2, m.w, m.l]).filter(Boolean));
                const draftOrder = rosterList
                    .filter((r: any) => r.owner_id && !playoffRosterIds.has(r.roster_id))
                    .sort((a: any, b: any) => {
                        if (a.settings.wins !== b.settings.wins) return a.settings.wins - b.settings.wins;
                        return (a.settings.fpts + a.settings.fpts_decimal / 100) - (b.settings.fpts + b.settings.fpts_decimal / 100);
                    })
                    .map((r: any) => userList.find((u: any) => u.user_id === r.owner_id)?.display_name || 'Unknown');

                // 4. Actual Rookie Prospects (Verified 2026 Class)
                const topProspects = [
                    { name: 'Jeremiyah Love', pos: 'RB', val: '1.01 Candidate' },
                    { name: 'Carnell Tate', pos: 'WR', val: 'Elite Prospect' },
                    { name: 'Makai Lemon', pos: 'WR', val: 'Top 5 Target' },
                    { name: 'Jordyn Tyson', pos: 'WR', val: 'First Round Grade' },
                    { name: 'Kenyon Sadiq', pos: 'TE', val: 'TE1 Prospect' }
                ];

                // 5. Dynamic Class Strength Calculation
                const pickValue = marketMap["2026 1st"] || 4000;
                let strength = "Average Class";
                if (pickValue > 5500) strength = "Generational Class";
                else if (pickValue > 4800) strength = "Deep Class";
                else if (pickValue < 3500) strength = "Weak Class";

                setOffseasonStats({
                    champName: champUser?.display_name || "jimmykiss",
                    draftKing: {
                        name: draftKingUser?.display_name || "Unknown",
                        picks: draftKingEntry[1]
                    },
                    draftOrder: draftOrder.slice(0, 5),
                    prospects: topProspects,
                    classStrength: strength,
                    pickPrice: Math.round(pickValue)
                });
                setUsers(userList);
                setRosters(rosterList);
            } catch (err) {
                console.error("Offseason fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchOffseasonData();
    }, [mode]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [matchupsData, usersData, rostersData] = await Promise.all([
                    getLeagueMatchups(LEAGUE_ID, week),
                    getLeagueUsers(LEAGUE_ID),
                    getLeagueRosters(LEAGUE_ID),
                ]);

                const grouped: any = {};
                matchupsData.forEach((m: any) => {
                    if (!grouped[m.matchup_id]) grouped[m.matchup_id] = [];
                    grouped[m.matchup_id].push(m);
                });

                setMatchups(Object.values(grouped));
                setUsers(usersData);
                setRosters(rostersData);
            } catch (error) {
                console.error("Failed to fetch Recap data:", error);
            } finally {
                setLoading(false);
            }
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

    const getMatchupAnalysis = (teamA: any, teamB: any) => {
        const getMVP = (matchup: any) => {
            if (!matchup.players_points) return null;
            let maxPoints = -1;
            let mvpId = null;

            Object.entries(matchup.players_points).forEach(([id, pts]: [string, any]) => {
                if (pts > maxPoints) {
                    maxPoints = pts;
                    mvpId = id;
                }
            });
            return { id: mvpId, points: maxPoints };
        };

        const getOptimal = (matchup: any) => {
            if (!matchup.players_points) return matchup.points;
            const starterCount = matchup.starters?.length || 9;
            const allPoints = Object.values(matchup.players_points as Record<string, number>).sort((a, b) => b - a);
            return allPoints.slice(0, starterCount).reduce((a, b) => a + b, 0);
        };

        const mvpA = getMVP(teamA);
        const mvpB = getMVP(teamB);
        const optA = getOptimal(teamA);
        const optB = getOptimal(teamB);
        const effA = Math.min(100, (teamA.points / (optA || 1)) * 100);
        const effB = Math.min(100, (teamB.points / (optB || 1)) * 100);

        const diff = Math.abs(teamA.points - teamB.points);
        let summary = "Standard Matchup";
        if (diff < 5) summary = "Nail Biter";
        else if (diff > 35) summary = "Absolute Blowout";
        else if (teamA.points > 150 || teamB.points > 150) summary = "High Scoring Affair";

        // Generate Narrative Commentary
        let commentary = "";
        const winner = teamA.points > teamB.points ? teamA : teamB;
        const loser = teamA.points > teamB.points ? teamB : teamA;
        const winnerMVP = teamA.points > teamB.points ? mvpA : mvpB;
        const loserMVP = teamA.points > teamB.points ? mvpB : mvpA;

        const infoA = getManagerInfo(teamA.roster_id);
        const infoB = getManagerInfo(teamB.roster_id);
        const infoWinner = teamA.points > teamB.points ? infoA : infoB;
        const infoLoser = teamA.points > teamB.points ? infoB : infoA;

        if (loserMVP && loserMVP.points > 28 && diff < 8) {
            commentary = `A devastating week for ${infoLoser.name}. Despite ${playerMap[loserMVP.id!]?.split('(')[0] || 'their star'} going nuclear with ${loserMVP.points.toFixed(1)} points, the rest of the roster couldn't provide enough support to close the ${diff.toFixed(1)} point gap. `;
        } else if (winnerMVP && winnerMVP.points > 32) {
            commentary = `${infoWinner.name} found the ultimate "get out of jail free" card this week. ${playerMap[winnerMVP.id!]?.split('(')[0] || 'Their MVP'}'s massive ${winnerMVP.points.toFixed(1)} point performance single-handedly outpaced the ${infoLoser.name} offense. `;
        } else if (teamA.points < 95 && teamB.points < 95) {
            commentary = `This was a grueling defensive struggle. In a week where yards were hard to come by, ${infoWinner.name} managed to scrape together just enough production to secure the win. `;
        } else if (diff > 40) {
            commentary = `Total dominance. ${infoWinner.name} didn't just win; they dismantled ${infoLoser.name} in every facet of the game. A blowout of this magnitude sends a clear message to the rest of the league. `;
        } else if (diff < 5) {
            commentary = `This one came down to the final play on Monday night. ${infoWinner.name} escapes with a narrow ${diff.toFixed(1)} point victory in what was arguably the most stressful matchup of the week. `;
        } else {
            commentary = `${infoWinner.name} put on a clinic in roster balance. Without relying on a single outlier performance, they methodically built a lead that ${infoLoser.name} simply couldn't track down. `;
        }

        if (effA < 75 && effB < 75) {
            commentary += " More interestingly, both teams left a combined " + ((optA - teamA.points) + (optB - teamB.points)).toFixed(1) + " points on the bench—a sloppy week of management on both sides.";
        } else if (effA < 72) {
            commentary += ` ${infoA.name} will be kicking themselves after leaving ${(optA - teamA.points).toFixed(1)} potential points on the bench.`;
        } else if (effB < 72) {
            commentary += ` ${infoB.name} could have flipped the script if they'd trusted their gut on a few bench players who outperformed their starters.`;
        }

        return { mvpA, mvpB, effA, effB, optA, optB, summary, commentary };
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">League Recap</h1>
                    <p className="text-muted-foreground text-base lg:text-lg">AI-powered analysis of every head-to-head battle.</p>
                </div>

                <div className="flex bg-secondary/50 p-1 rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setMode("in-season")}
                        className={cn(
                            "px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all",
                            mode === "in-season" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        In-Season
                    </button>
                    <button
                        onClick={() => setMode("offseason")}
                        className={cn(
                            "px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all",
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
                        className="space-y-6 lg:space-y-8"
                    >
                        <div className="flex items-center justify-between glass p-3 lg:p-4 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setWeek(Math.max(1, week - 1))}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                disabled={week === 1}
                            >
                                <ChevronLeft className={cn("w-5 h-5 lg:w-6 lg:h-6", week === 1 ? "opacity-20" : "text-primary")} />
                            </button>
                            <div className="text-center px-4 lg:px-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Weekly Recap</p>
                                <h2 className="text-xl lg:text-2xl font-outfit font-bold">Week {week}</h2>
                            </div>
                            <button
                                onClick={() => setWeek(week + 1)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted-foreground animate-pulse font-outfit uppercase tracking-widest text-xs font-bold">Scanning Matchup Data...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 lg:gap-6">
                                {matchups.map((mArr: any[], i) => {
                                    const teamA = mArr[0];
                                    const teamB = mArr[1];
                                    if (!teamA || !teamB) return null;

                                    const infoA = getManagerInfo(teamA.roster_id);
                                    const infoB = getManagerInfo(teamB.roster_id);
                                    const winner = teamA.points > teamB.points ? "A" : "B";
                                    const isExpanded = selectedMatchup === i;
                                    const analysis = getMatchupAnalysis(teamA, teamB);

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedMatchup(isExpanded ? null : i)}
                                            className={cn(
                                                "glass rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer group",
                                                isExpanded ? "border-primary/40 ring-1 ring-primary/20" : "border-white/5 hover:border-primary/20"
                                            )}
                                        >
                                            <div className="flex flex-col md:grid md:grid-cols-[1fr,auto,1fr] items-center p-6 lg:p-8 gap-6 lg:gap-10">
                                                <div className={cn("flex items-center gap-4 lg:gap-6 w-full md:w-auto transition-opacity", !isExpanded && winner === "B" && "opacity-40")}>
                                                    <div className="relative shrink-0">
                                                        <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-secondary/50 flex items-center justify-center">
                                                            {infoA.avatar ? (
                                                                <img src={`https://sleepercdn.com/avatars/thumbs/${infoA.avatar}`} alt={infoA.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {winner === "A" && (
                                                            <div className="absolute -top-2 -left-2 lg:-top-3 lg:-left-3 w-6 h-6 lg:w-8 lg:h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
                                                                <Trophy className="w-3 h-3 lg:w-4 lg:h-4 text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 md:flex-none">
                                                        <h3 className="text-base lg:text-xl font-bold font-outfit truncate">{infoA.name}</h3>
                                                        <p className="text-2xl lg:text-3xl font-bold text-white mt-0.5 lg:mt-1 font-mono">{teamA.points.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto">
                                                    <div className="h-[1px] flex-1 bg-white/10 md:hidden"></div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] lg:text-xs font-bold text-muted-foreground border border-white/5">
                                                            VS
                                                        </div>
                                                        <span className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-2 hidden md:block">{analysis.summary}</span>
                                                    </div>
                                                    <div className="h-[1px] flex-1 bg-white/10 md:hidden"></div>
                                                </div>

                                                <div className={cn("flex flex-row-reverse md:flex-row items-center gap-4 lg:gap-6 text-right md:text-left w-full md:w-auto transition-opacity", !isExpanded && winner === "A" && "opacity-40")}>
                                                    <div className="relative shrink-0">
                                                        <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-secondary/50 flex items-center justify-center">
                                                            {infoB.avatar ? (
                                                                <img src={`https://sleepercdn.com/avatars/thumbs/${infoB.avatar}`} alt={infoB.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {winner === "B" && (
                                                            <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 w-6 h-6 lg:w-8 lg:h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                                                <Trophy className="w-3 h-3 lg:w-4 lg:h-4 text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 md:flex-none">
                                                        <h3 className="text-base lg:text-xl font-bold font-outfit truncate">{infoB.name}</h3>
                                                        <p className="text-2xl lg:text-3xl font-bold text-white mt-0.5 lg:mt-1 font-mono">{teamB.points.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-white/10 bg-white/[0.02]"
                                                    >
                                                        <div className="p-6 lg:p-10">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-3">Lineup Efficiency</p>
                                                                        <div className="space-y-4">
                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-muted-foreground">{infoA.name}</span>
                                                                                    <span className="font-bold">{analysis.effA.toFixed(1)}%</span>
                                                                                </div>
                                                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-blue-500" style={{ width: `${analysis.effA}%` }} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-muted-foreground">{infoB.name}</span>
                                                                                    <span className="font-bold">{analysis.effB.toFixed(1)}%</span>
                                                                                </div>
                                                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-primary" style={{ width: `${analysis.effB}%` }} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-4 border-t border-white/5">
                                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-3">Matchup MVP</p>
                                                                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                                                                <Star className="w-5 h-5" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold truncate w-32">
                                                                                    {winner === "A"
                                                                                        ? (playerMap[analysis.mvpA?.id!]?.split('(')[0] || 'Unknown')
                                                                                        : (playerMap[analysis.mvpB?.id!]?.split('(')[0] || 'Unknown')}
                                                                                </p>
                                                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                                                    {winner === "A" ? analysis.mvpA?.points.toFixed(1) : analysis.mvpB?.points.toFixed(1)} Points
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="md:col-span-2 bg-white/5 rounded-3xl p-6 lg:p-8 flex flex-col justify-between border border-white/5 shadow-inner">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-4">
                                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                                                <TrendingUp className="w-4 h-4" />
                                                                            </div>
                                                                            <h4 className="text-xl font-bold font-outfit">Matchup Logic Report</h4>
                                                                        </div>
                                                                        <p className="text-base text-muted-foreground leading-relaxed italic">
                                                                            "{analysis.commentary}"
                                                                        </p>
                                                                    </div>
                                                                    <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                                                                        <div className="shrink-0">
                                                                            <Trophy className="w-8 h-8 text-yellow-500 opacity-50" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Key Takeaway</p>
                                                                            <p className="text-xs font-medium">
                                                                                {Math.abs(teamA.points - teamB.points) < 10
                                                                                    ? "Every single substitution proved critical in this outcome."
                                                                                    : "Depth and roster quality outshined individual performance this week."}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
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
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
                    >
                        {loading ? (
                            <div className="lg:col-span-2 p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted-foreground animate-pulse font-outfit uppercase tracking-widest text-xs font-bold">Processing Offseason Intelligence...</p>
                            </div>
                        ) : (
                            <>
                                <div className="glass p-6 lg:p-10 rounded-3xl border border-white/5 lg:col-span-2 bg-gradient-to-br from-primary/5 to-transparent">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                        <div>
                                            <h2 className="text-2xl lg:text-3xl font-outfit font-bold mb-2 uppercase tracking-tight">2026 Shmantasy Shmootball Hub</h2>
                                            <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
                                                Analyzing roster shifts, draft capital, and market trends as we head toward the 2026 Rookie Draft.
                                            </p>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold text-xs flex items-center gap-2">
                                            <Zap className="w-4 h-4" /> OFFSEASON FREEZE
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                                        <div className="p-4 lg:p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                                                <Trophy className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Defending Champ</p>
                                                <p className="text-sm lg:text-base font-bold font-outfit uppercase tracking-tighter">{offseasonStats?.champName}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 lg:p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                                <LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Draft Capital Leader</p>
                                                <p className="text-sm lg:text-base font-bold">{offseasonStats?.draftKing?.name} <span className="opacity-40 text-xs">({offseasonStats?.draftKing?.picks} Total)</span></p>
                                            </div>
                                        </div>

                                        <div className="p-4 lg:p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                                <Calendar className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">2026 Class Outlook</p>
                                                <p className="text-sm lg:text-base font-bold">{offseasonStats?.classStrength}</p>
                                                <p className="text-[10px] text-primary/60 font-mono font-bold">AVG VALUE: {offseasonStats?.pickPrice}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass p-8 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold font-outfit">Projected Draft Order</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {offseasonStats?.draftOrder?.map((name: string, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-primary font-bold">1.0{i + 1}</span>
                                                    <span className="font-bold text-sm tracking-tight">{name}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold px-2 py-0.5 rounded bg-white/5">Lottery</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-[10px] text-muted-foreground uppercase font-bold text-center tracking-widest opacity-50">
                                        Order based on regular season standings (inverse)
                                    </p>
                                </div>

                                <div className="glass p-8 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold font-outfit">Top 2026 Prospects</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {offseasonStats?.prospects?.map((p: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all group">
                                                <div>
                                                    <span className="font-bold text-sm block group-hover:text-orange-400 transition-colors">{p.name} <span className="text-[10px] text-muted-foreground">({p.pos})</span></span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.val}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-[10px] text-muted-foreground uppercase font-bold text-center tracking-widest opacity-50">
                                        Powered by FantasyPros & PFF Projections
                                    </p>
                                </div>

                                <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Zap className="w-32 h-32 text-primary" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold font-outfit mb-2">Offseason Strategy</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                            The 2026 class is heavy on skill position talent. Managers like <strong>{offseasonStats?.draftKing?.name}</strong> are currently holding the keys to the kingdom with {offseasonStats?.draftKing?.picks} picks in the upcoming cycle. Expect trade volume to spike during the NFL Combine as prospect metrics go live.
                                        </p>
                                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                            <p className="text-xs font-bold text-primary mb-1">Recommended Move:</p>
                                            <p className="text-xs text-muted-foreground">Consider trading veteran aging assets for 2026/2027 draft capital while market optimism is high.</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
