import ReactMarkdown from "react-markdown";
import { FileText, ShieldAlert } from "lucide-react";

// In a real app, this might come from a file or CMS.
const BYLAWS_MD = `
# League Bylaws

## 1. League Overview
This is a **Dynasty** league intended for long-term competition. Managers are expected to remain active year-round.

## 2. Roster Settings
- **Total Rosters**: 12 Teams
- **Active Roster**: 1 QB, 2 RB, 2 WR, 1 TE, 2 FLEX, 1 SUPERFLEX
- **Bench**: 15 slots
- **Taxi Squad**: 5 slots (Rookies only)

## 3. Scoring System
- **PPR**: 1 point per reception.
- **Passing**: 4 pts per TD, 1 pt per 25 yards.
- **Rushing/Receiving**: 6 pts per TD, 1 pt per 10 yards.

## 4. Trades & Transactions
- **Trade Deadline**: Week 13.
- **Trade Vetoes**: No league votes. Only Commissioner intervention in cases of clear collusion.
- **FAAB**: $100 budget for the season.

## 5. Playoffs
- **Teams**: Top 6 teams.
- **Format**: Weeks 15-17.
- **Tie-break**: Most points for.

## 6. Drafts
- **Rookie Draft**: 4 rounds every May.
- **Order**: Reverse standings of non-playoff teams (Max PF), then playoff results.
`;

export default function BylawsPage() {
    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">League Bylaws</h1>
                <p className="text-muted-foreground text-base lg:text-lg">The constitution of our competition.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 lg:gap-10">
                <div className="glass p-6 lg:p-10 rounded-3xl border border-white/5 prose prose-invert max-w-none prose-headings:font-outfit prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-xl lg:prose-h2:text-2xl prose-h2:mt-10 prose-p:text-muted-foreground prose-li:text-muted-foreground">
                    <ReactMarkdown>{BYLAWS_MD}</ReactMarkdown>
                </div>

                <aside className="space-y-6">
                    <div className="glass p-6 rounded-2xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <ShieldAlert className="w-5 h-5" />
                            <h3 className="font-bold">Quick Rules</h3>
                        </div>
                        <ul className="space-y-4 text-sm">
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">Trade Deadline</span>
                                <span className="font-bold">Week 13</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">FAAB Budget</span>
                                <span className="font-bold">$100</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-muted-foreground">Draft Date</span>
                                <span className="font-bold">May 15</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass p-6 rounded-2xl border border-white/5">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            Resources
                        </h3>
                        <div className="space-y-2">
                            <button className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors text-left">
                                Download PDF
                            </button>
                            <button className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors text-left">
                                View Draft Board
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
