"use client";

import { motion } from "framer-motion";
import { Clock, User, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";

const BLOG_POSTS = [
    {
        id: 1,
        title: "The 2026 Rookie Class: Who is the Next Superstar?",
        excerpt: "Diving deep into the tape of Travis Hunter and Ashton Jeanty. Which one should you take at the 1.01?",
        author: "Commish",
        date: "Feb 14, 2026",
        category: "Draft",
        image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 2,
        title: "Why You Should Be Trading Away Your Aging Vets Now",
        excerpt: "The dynasty window is shorter than you think. Here are 5 players you should sell before their value craters.",
        author: "DynastyGuru",
        date: "Feb 10, 2026",
        category: "Strategy",
        image: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: 3,
        title: "League Power Rankings: Post-Season Edition",
        excerpt: "The trophy has been hoisted, but who is actually in the best position for a 2026 run? Our updated power rankings.",
        author: "StatsMan",
        date: "Feb 05, 2026",
        category: "Rankings",
        image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800",
    }
];

export default function BlogPage() {
    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">League Blog</h1>
                <p className="text-muted-foreground text-base lg:text-lg">Insights, rants, and analysis from the managers.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {BLOG_POSTS.map((post, index) => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-3xl overflow-hidden border border-white/5 flex flex-col group cursor-pointer hover:border-primary/30 transition-all duration-500"
                    >
                        <div className="h-56 w-full overflow-hidden relative">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                    {post.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {post.date}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" /> {post.author}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold font-outfit mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                            </h2>

                            <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                                {post.excerpt}
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between group/link">
                                <span className="text-xs font-bold text-primary flex items-center gap-2">
                                    READ FULL ARTICLE
                                </span>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>

            <div className="glass p-10 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-primary/10 to-transparent">
                <div>
                    <h3 className="text-2xl font-outfit font-bold mb-2">Want to contribute?</h3>
                    <p className="text-muted-foreground">Submit your articles, trade reviews, or power rankings to the commissioner.</p>
                </div>
                <button className="px-8 py-4 rounded-2xl bg-primary text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                    Write a Post
                </button>
            </div>
        </div>
    );
}
