"use client";

import { motion } from "framer-motion";
import {
    Clock,
    MessageSquare,
    ArrowUpCircle,
    ExternalLink,
    Newspaper,
    TrendingUp,
    Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const SUBREDDITS = [
    { id: "FantasyFootball", name: "r/FantasyFootball", icon: "🏈" },
    { id: "DynastyFF", name: "r/DynastyFF", icon: "💎" },
    { id: "nfl", name: "r/NFL", icon: "🏟️" }
];

export default function NewsPage() {
    const [selectedSub, setSelectedSub] = useState(SUBREDDITS[0].id);
    const [timeFilter, setTimeFilter] = useState("day");
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRedditNews() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/news?sub=${selectedSub}&t=${timeFilter}&limit=5`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || `Server Error: ${res.status}`);
                }

                if (data.error) {
                    throw new Error(`${data.error}: ${data.details || ''}`);
                }

                if (!data?.data?.children) {
                    console.error("Unexpected Reddit API response:", data);
                    throw new Error("Invalid response structure from Reddit");
                }

                const formattedPosts = data.data.children.map((child: any) => {
                    const post = child.data;
                    if (!post) return null;
                    return {
                        id: post.id || Math.random().toString(),
                        title: post.title || "No Title",
                        url: post.permalink ? `https://reddit.com${post.permalink}` : post.url || "#",
                        author: post.author || "anonymous",
                        ups: typeof post.ups === 'number' ? post.ups : 0,
                        num_comments: typeof post.num_comments === 'number' ? post.num_comments : 0,
                        thumbnail: (typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http')) ? post.thumbnail : null,
                        created_utc: post.created_utc || Date.now() / 1000,
                        subreddit: post.subreddit || selectedSub,
                        selftext: post.selftext || ""
                    };
                }).filter(Boolean);

                setPosts(formattedPosts);
            } catch (err: any) {
                console.error("Failed to fetch reddit news", err);
                setError(err.message || "An error occurred while fetching news.");
            } finally {
                setLoading(false);
            }
        }

        fetchRedditNews();
    }, [selectedSub, timeFilter]);

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-1">Reddit Intelligence</h1>
                    <p className="text-muted-foreground text-base lg:text-lg">Real-time pulse from the industry's sharpest subreddits.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1">
                        {SUBREDDITS.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSub(sub.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                    selectedSub === sub.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span>{sub.icon}</span>
                                <span className="hidden md:inline">{sub.name}</span>
                                <span className="md:hidden">{sub.id}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1">
                        <button
                            onClick={() => setTimeFilter("week")}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                timeFilter === "week"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            WEEKLY
                        </button>
                        <button
                            onClick={() => setTimeFilter("day")}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                timeFilter === "day"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            TODAY
                        </button>
                    </div>
                </div>
            </header>
            {error ? (
                <div className="glass p-12 rounded-3xl border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center gap-4">
                    <TrendingUp className="w-10 h-10 text-red-500/50 rotate-180" />
                    <h3 className="text-xl font-bold font-outfit text-white">Intelligence Unavailable</h3>
                    <p className="text-muted-foreground max-w-md">{error}</p>
                    <button
                        onClick={() => setSelectedSub(selectedSub)}
                        className="mt-4 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/10 text-white"
                    >
                        Retry Connection
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="glass rounded-[2rem] h-[350px] animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                    {posts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "glass rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col group hover:border-primary/40 transition-all duration-500 relative min-h-[350px]",
                                index === 0 && "lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent min-h-[420px]"
                            )}
                        >
                            <div className="p-8 md:p-12 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        {post.subreddit} intelligence
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                                        <ArrowUpCircle className="w-4 h-4" />
                                        {post.ups.toLocaleString()}
                                    </div>
                                </div>

                                <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group/title"
                                >
                                    <h2 className={cn(
                                        "font-bold font-outfit mb-6 group-hover/title:text-primary transition-colors line-clamp-3 leading-tight tracking-tight text-white",
                                        index === 0 ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"
                                    )}>
                                        {post.title}
                                    </h2>
                                </a>

                                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <span className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-primary/50" /> {post.num_comments}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            u/{post.author}
                                        </span>
                                    </div>

                                    <a
                                        href={post.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-90"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
                        </motion.article>
                    ))}
                </div>
            )}
        </div>
    );
}
