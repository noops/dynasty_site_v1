"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    History,
    FileText,
    ArrowLeftRight,
    BarChart3,
    Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Recap", href: "/recap", icon: History },
    { name: "Blog", href: "/blog", icon: FileText },
    { name: "Trades", href: "/trades", icon: ArrowLeftRight },
    { name: "Trade Analytics", href: "/analytics", icon: BarChart3 },
    { name: "History", href: "/history", icon: Trophy },
    { name: "Bylaws", href: "/bylaws", icon: FileText },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-border h-full flex flex-col glass z-20">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Trophy className="text-white w-5 h-5" />
                    </div>
                    <span className="font-outfit font-bold text-xl tracking-tight">DYNASTY</span>
                </div>

                <nav className="space-y-2">
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

            <div className="mt-auto p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">League ID</p>
                    <p className="text-sm font-mono truncate opacity-60">1203080446066307072</p>
                </div>
            </div>
        </aside>
    );
}
