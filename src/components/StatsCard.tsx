import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: "blue" | "purple" | "pink" | "yellow";
}

const colors = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
    return (
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-outfit font-bold">{value}</p>
        </div>
    );
}
