import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Users, DollarSign, Star, Zap, Calendar, TrendingUp } from "lucide-react";
import SafeText from "@/components/SafeText";
import { QuickChallengeDialog } from "@/components/QuickChallengeDialog";

export default function PlayerDashboard() {
  const [isQuickChallengeOpen, setIsQuickChallengeOpen] = useState(false);

  const { data: playerStats } = useQuery<any>({
    queryKey: ["/api/player/stats"],
    retry: false,
  });

  const { data: challenges } = useQuery<any>({
    queryKey: ["/api/player/challenges"],
    retry: false,
  });

  const { data: leaderboard } = useQuery<any>({
    queryKey: ["/api/player/leaderboard"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Target className="mr-3 text-neon-green" />
          Player Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          <SafeText>{`${playerStats?.playerName ?? "Player"} • ${playerStats?.tier ?? "—"} Division`}</SafeText>
        </p>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Fargo Rating</CardTitle>
            <Target className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-fargo-rating">{playerStats?.fargoRating ?? "—"}</div>
            <p className="text-xs text-gray-400">
              Change: {playerStats?.ratingChange != null ? `${playerStats.ratingChange > 0 ? "+" : ""}${playerStats.ratingChange}` : "—"} this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ladder Rank</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-ladder-rank">
              {playerStats?.ladderRank != null ? `#${playerStats.ladderRank}` : "—"}
            </div>
            <p className="text-xs text-gray-400">in {playerStats?.division ?? "—"} Division</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Win Streak</CardTitle>
            <Zap className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-win-streak">{playerStats?.winStreak ?? "—"}</div>
            <p className="text-xs text-gray-400">Record: {playerStats?.recordStreak ?? "—"} games</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-sm border border-purple-500/30 shadow-felt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Respect Points</CardTitle>
            <Star className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-respect-points">{playerStats?.respectPoints ?? "—"}</div>
            <p className="text-xs text-gray-400">Good sportsmanship</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenge Center */}
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Target className="mr-3 text-neon-green" />
              Challenge Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={() => setIsQuickChallengeOpen(true)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
                data-testid="button-quick-challenge"
              >
                <Zap className="mr-2 h-4 w-4" />
                Quick Challenge
              </Button>
              <Button 
                className="w-full bg-neon-green hover:bg-green-400 text-black font-bold"
                data-testid="button-send-challenge"
              >
                Send Challenge
              </Button>
              <Button 
                className="w-full bg-neon-green hover:bg-green-400 text-black font-bold"
                data-testid="button-view-challenges"
              >
                View Incoming Challenges
              </Button>
              <Button 
                className="w-full bg-neon-green hover:bg-green-400 text-black font-bold"
                data-testid="button-challenge-pools"
              >
                Browse Challenge Pools
              </Button>
            </div>
            <div className="bg-green-900/20 border border-green-600/30 rounded p-3">
              <div className="text-sm text-green-300">Pending: {challenges?.pending ?? 0}</div>
              <div className="text-xs text-green-400">Available pools: {challenges?.availablePools ?? "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* My Profile */}
        <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Users className="mr-3 text-blue-400" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-view-stats"
              >
                View Full Stats
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-match-history"
              >
                Match History
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-highlight-clips"
              >
                Highlight Clips
              </Button>
            </div>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3">
              <div className="text-sm text-blue-300">W/L: {playerStats?.wins ?? 0}-{playerStats?.losses ?? 0}</div>
              <div className="text-xs text-blue-400">Win rate: {playerStats?.winRate != null ? `${playerStats.winRate}%` : "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet & Voting */}
        <Card className="bg-black/60 backdrop-blur-sm border border-amber-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <DollarSign className="mr-3 text-amber-400" />
              Wallet & Voting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-wallet"
              >
                View Wallet Balance
              </Button>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-monthly-voting"
              >
                Game of the Month Vote
              </Button>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                data-testid="button-suggestions"
              >
                Submit Suggestions
              </Button>
            </div>
            <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3">
              <div className="text-sm text-amber-300">Balance: ${playerStats?.walletBalance ?? 0}</div>
              <div className="text-xs text-amber-400">Vote expires: {playerStats?.voteExpiry ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Performance Trends */}
        <Card className="bg-black/60 backdrop-blur-sm border border-purple-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="mr-3 text-purple-400" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">{playerStats?.avgGameScore ?? "—"}/10</div>
                <div className="text-sm text-gray-400">Avg Game Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-green">{playerStats?.breakAndRuns ?? "—"}</div>
                <div className="text-sm text-gray-400">Break & Runs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{playerStats?.comebackWins ?? "—"}</div>
                <div className="text-sm text-gray-400">Comeback Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{playerStats?.perfectGames ?? "—"}</div>
                <div className="text-sm text-gray-400">Perfect Games</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="bg-black/60 backdrop-blur-sm border border-gray-500/30 shadow-felt">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Calendar className="mr-3 text-gray-400" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold" data-testid="text-next-opponent">
                    vs {playerStats?.nextOpponent ?? "—"}
                  </div>
                  <div className="text-sm text-gray-400">{playerStats?.nextGameDate ?? "—"}</div>
                </div>
                <div className="text-dollar-green font-bold">
                  {playerStats?.nextGameStake != null ? `$${playerStats.nextGameStake}` : "—"}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">Weekly Tournament</div>
                  <div className="text-sm text-gray-400">{playerStats?.tournamentDate ?? "—"}</div>
                </div>
                <div className="text-blue-400 font-bold">
                  {playerStats?.tournamentEntry != null ? `$${playerStats.tournamentEntry}` : "—"}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">Team Match</div>
                  <div className="text-sm text-gray-400">{playerStats?.teamMatchDate ?? "—"}</div>
                </div>
                <div className="text-purple-400 font-bold">Team Event</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hall Leaderboard */}
      <Card className="mt-6 bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Trophy className="mr-3 text-yellow-400" />
            Hall Leaderboard - {playerStats?.division ?? "—"} Division
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard?.slice(0, 5).map((player: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? "bg-yellow-400 text-black" :
                    index === 1 ? "bg-gray-300 text-black" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-gray-600 text-white"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-bold">{player.name}</div>
                    <div className="text-sm text-gray-400">Rating: {player.rating}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{player.points} pts</div>
                  <div className="text-sm text-gray-400">{player.wins}W-{player.losses}L</div>
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>

      {/* Quick Challenge Dialog */}
      <QuickChallengeDialog 
        isOpen={isQuickChallengeOpen}
        onClose={() => setIsQuickChallengeOpen(false)}
      />
    </div>
  );
}