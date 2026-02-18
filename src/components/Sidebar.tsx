"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    History,
    FileText,
    ArrowLeftRight,
    UserPlus,
    Users,
    BarChart3,
    Trophy,
    Menu,
    X,
    ExternalLink,
    Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Team Overview", href: "/teams", icon: Users },
    { name: "Recap", href: "/recap", icon: History },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Trades", href: "/trades", icon: ArrowLeftRight },
    { name: "Trade Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Roster Moves", href: "/moves", icon: UserPlus },
    { name: "History", href: "/history", icon: Trophy },
    { name: "Bylaws", href: "/bylaws", icon: FileText },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-40 px-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Trophy className="text-white w-5 h-5" />
                    </div>
                    <span className="font-outfit font-bold text-lg tracking-tight uppercase">Shmantasy Shmootball</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-xl bg-white/5 text-primary"
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 lg:w-64 border-r border-border h-full flex flex-col glass z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <div className="hidden lg:flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Trophy className="text-white w-5 h-5" />
                        </div>
                        <span className="font-outfit font-bold text-xl tracking-tight leading-tight uppercase">Shmantasy<br />Shmootball</span>
                    </div>

                    <nav className="space-y-1.5 mt-16 lg:mt-0">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                        isActive
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:scale-110 transition-transform")} />
                                    <span className="font-medium relative z-10">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20">
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">League ID</p>
                        <p className="text-xs font-mono truncate opacity-60">1203080446066307072</p>
                    </div>
                    <a
                        href="https://noops.work"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-colors text-[10px] uppercase tracking-widest font-bold border border-transparent hover:border-primary/20 group"
                    >
                        <span>Powered by noops.work</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden w-full py-3 rounded-xl bg-white/5 text-sm font-bold"
                    >
                        Close Menu
                    </button>
                </div>
            </aside>
        </>
    );
}
