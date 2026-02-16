"use client";

import { useEffect, useState } from "react";
import { getAllMoves, getLeagueUsers, getLeagueRosters } from "@/lib/sleeper";
import { UserPlus, UserMinus, Calendar, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import playerMapData from "@/lib/player_map.json";

const LEAGUE_ID = "1203080446066307072";
const playerMap: Record<string, string> = playerMapData;

export default function MovesPage() {
    const [moves, setMoves] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "waiver" | "free_agent">("all");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [movesData, usersData, rostersData] = await Promise.all([
                    getAllMoves(LEAGUE_ID),
                    getLeagueUsers(LEAGUE_ID),
                    getLeagueRosters(LEAGUE_ID)
                ]);
                // Sort by transaction_id descending (latest moves first)
                setMoves(movesData.sort((a: any, b: any) => b.status_updated - a.status_updated));
                setUsers(usersData);
                setRosters(rostersData);
            } catch (error) {
                console.error("Failed to fetch moves:", error);
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

    const filteredMoves = moves.filter(move => {
        const matchesType = filterType === "all" || move.type === filterType;
        const playerNames = [...Object.keys(move.adds || {}), ...Object.keys(move.drops || {})]
            .map(id => getPlayerName(id).toLowerCase());
        const matchesSearch = searchTerm === "" ||
            playerNames.some(name => name.includes(searchTerm.toLowerCase())) ||
            getManagerName(move.roster_ids[0]).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse font-outfit font-bold uppercase tracking-widest">Scanning Waiver Wire...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">Roster Moves</h1>
                    <p className="text-muted-foreground text-base lg:text-lg">Tracking acquisitions, drops, and waiver claims.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search players or managers..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 w-full sm:w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        {(["all", "waiver", "free_agent"] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    filterType === type
                                        ? "bg-primary text-white shadow-lg"
                                        : "text-muted-foreground hover:text-white"
                                )}
                            >
                                {type.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {filteredMoves.length === 0 ? (
                    <div className="glass p-20 rounded-3xl text-center">
                        <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground text-xl font-outfit">No roster moves match your criteria.</p>
                    </div>
                ) : (
                    filteredMoves.map((move: any) => (
                        <div key={move.transaction_id} className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center p-4 lg:p-6 gap-6">
                                {/* Manager Info */}
                                <div className="sm:w-48 shrink-0">
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Manager</p>
                                    <h3 className="text-lg font-bold font-outfit truncate">{getManagerName(move.roster_ids[0])}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
                                        <Calendar className="w-3 h-3" />
                                        <span>Week {move.leg}</span>
                                        <span className="opacity-30">&bull;</span>
                                        <span className="uppercase font-bold text-white/40">{move.type.replace("_", " ")}</span>
                                    </div>
                                </div>

                                {/* Adds */}
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <UserPlus className="w-3 h-3" /> Added
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {move.adds && Object.keys(move.adds).length > 0 ? (
                                            Object.keys(move.adds).map(id => (
                                                <div key={id} className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl flex justify-between items-center group/item hover:bg-green-500/10 transition-colors">
                                                    <span className="font-medium text-sm">{getPlayerName(id)}</span>
                                                    {move.type === 'waiver' && move.settings?.waiver_bid > 0 && (
                                                        <span className="text-[10px] font-mono font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">
                                                            ${move.settings.waiver_bid}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic opacity-50">None</p>
                                        )}
                                    </div>
                                </div>

                                {/* Drops */}
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <UserMinus className="w-3 h-3" /> Dropped
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {move.drops && Object.keys(move.drops).length > 0 ? (
                                            Object.keys(move.drops).map(id => (
                                                <div key={id} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex justify-between items-center group/item hover:bg-red-500/10 transition-colors">
                                                    <span className="font-medium text-sm opacity-70 group-hover:opacity-100 transition-opacity">{getPlayerName(id)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic opacity-50">None</p>
                                        )}
                                    </div>
                                </div>

                                {/* ID badge for desktop */}
                                <div className="hidden lg:block shrink-0 px-4 text-right">
                                    <p className="text-[8px] font-mono opacity-20 group-hover:opacity-40 transition-opacity">#{move.transaction_id}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
