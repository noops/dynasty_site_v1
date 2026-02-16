import { getLeague, getLeagueRosters, getLeagueUsers } from "@/lib/sleeper";
import { Trophy, Users, Calendar, Settings } from "lucide-react";
import StatsCard from "@/components/StatsCard";

const LEAGUE_ID = "1203080446066307072";

export default async function DashboardPage() {
  const league = await getLeague(LEAGUE_ID);
  const rosters = await getLeagueRosters(LEAGUE_ID);
  const users = await getLeagueUsers(LEAGUE_ID);

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-4xl lg:text-5xl font-outfit font-bold gradient-text pb-2">{league.name}</h1>
        <p className="text-muted-foreground text-base lg:text-lg">Season {league.season} &bull; {league.total_rosters} Teams &bull; {league.status.toUpperCase()}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Teams"
          value={league.total_rosters}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="League Status"
          value={league.status}
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Scoring Type"
          value={league.scoring_settings.rec === 1 ? "PPR" : "Standard"}
          icon={Settings}
          color="pink"
        />
        <StatsCard
          title="Playoff Teams"
          value={league.settings.playoff_teams}
          icon={Trophy}
          color="yellow"
        />
      </div>

      <section>
        <h2 className="text-2xl font-outfit font-bold mb-6">Manager Standings</h2>
        <div className="grid grid-cols-1 gap-4">
          {rosters.map((roster: any) => {
            const user = users.find((u: any) => u.user_id === roster.owner_id);
            return (
              <div key={roster.roster_id} className="glass p-4 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden border border-white/10">
                    {user?.avatar ? (
                      <img src={`https://sleepercdn.com/avatars/thumbs/${user.avatar}`} alt={user?.display_name || "Owner"} />
                    ) : (
                      <Users className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{user?.display_name || "Unknown Owner"}</h3>
                    <p className="text-sm text-muted-foreground">{roster.settings.wins}W - {roster.settings.losses}L</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">Points For</p>
                  <p className="text-xl font-bold">{roster.settings.fpts}.{roster.settings.fpts_decimal}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
