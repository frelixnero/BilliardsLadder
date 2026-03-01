import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Brain, Target, Users } from "lucide-react";
import type { Player } from "@shared/schema";

interface LadderTableProps {
  players: Player[];
  title: string;
  division: "HI" | "LO";
}

function LadderTable({ players, title, division }: LadderTableProps) {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  if (sortedPlayers.length === 0) {
    return (
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">No players in this division yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-green/20">
                <th className="text-left py-2 text-gray-400">Rank</th>
                <th className="text-left py-2 text-gray-400">Player</th>
                <th className="text-left py-2 text-gray-400">Points</th>
                <th className="text-left py-2 text-gray-400">Rating</th>
                <th className="text-left py-2 text-gray-400">City</th>
                <th className="text-left py-2 text-gray-400">Status</th>
                <th className="text-left py-2 text-gray-400">Streak</th>
                <th className="text-left py-2 text-gray-400">Respect</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  data-testid={`ladder-row-${division}-${index}`}
                >
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-neon-green">#{index + 1}</span>
                      {index === 0 && <span className="text-yellow-400">👑</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div>
                      <div className="font-semibold text-white">{player.name}</div>
                      {player.theme && (
                        <div className="text-xs text-gray-400 italic">"{player.theme}"</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-neon-green">{player.points}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-white">{player.rating}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-400">{player.city}</span>
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={player.member ? "default" : "secondary"}
                      className={
                        player.member
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-gray-600/20 text-gray-400"
                      }
                    >
                      {player.member ? "Member (5%)" : "Non-member (15%)"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-white">{player.streak || 0}</span>
                      {(player.streak || 0) >= 3 && <span className="text-orange-400">🔥</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-accent font-semibold">{player.respectPoints || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LadderRules() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">📋 Ladder Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Two Divisions:</span> 600+ killers and 599 & below grinders
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Challenge Rules:</span> Can challenge same rank or one spot above
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">King's Rule:</span> Win & stay King. Lose & drop 3–7 spots
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Commission:</span> 15% non-members, 5% members
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Streak Bonus:</span> Every 3 wins in a row = +25 points
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-neon-green font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Respect Points:</span> Used for tie-breaking and community recognition
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AILadderSection({ players }: { players: Player[] }) {
  const [matchmakingAdvice, setMatchmakingAdvice] = useState<string | null>(null);
  const [climbingStrategy, setClimbingStrategy] = useState<string | null>(null);
  const { toast } = useToast();

  const getMatchmakingAdviceMutation = useMutation({
    mutationFn: () =>
      fetch('/api/ai/community-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Analyze the current ladder standings and provide smart matchmaking suggestions. Consider player ratings, recent performance, and optimal challenge targets for advancing in the rankings.`
        })
      }).then(res => res.json()),
    onSuccess: (data) => {
      setMatchmakingAdvice(data.answer);
      toast({
        title: "Matchmaking Analysis Ready!",
        description: "AI has analyzed the ladder for optimal matches."
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to generate matchmaking advice.",
        variant: "destructive"
      });
    }
  });

  const getClimbingStrategyMutation = useMutation({
    mutationFn: () =>
      fetch('/api/ai/community-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `What are the best strategies for players to climb the ActionLadder effectively? Consider rating gaps, point systems, streak bonuses, and optimal challenge patterns.`
        })
      }).then(res => res.json()),
    onSuccess: (data) => {
      setClimbingStrategy(data.answer);
      toast({
        title: "Strategy Guide Ready!",
        description: "AI climbing strategies generated."
      });
    },
    onError: () => {
      toast({
        title: "Strategy Failed",
        description: "Unable to generate climbing strategies.",
        variant: "destructive"
      });
    }
  });

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Brain className="mr-3 text-green-400" />
          AI Ladder Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => getMatchmakingAdviceMutation.mutate()}
            disabled={getMatchmakingAdviceMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-ladder-matchmaking"
          >
            {getMatchmakingAdviceMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Smart Matchmaking
              </>
            )}
          </Button>
          <Button
            onClick={() => getClimbingStrategyMutation.mutate()}
            disabled={getClimbingStrategyMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-climbing-strategy"
          >
            {getClimbingStrategyMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Climbing Guide
              </>
            )}
          </Button>
        </div>

        {matchmakingAdvice && (
          <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Smart Matchmaking Analysis
            </h4>
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {matchmakingAdvice}
            </div>
          </div>
        )}

        {climbingStrategy && (
          <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              AI Climbing Strategy
            </h4>
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {climbingStrategy}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DivisionStats({ players }: { players: Player[] }) {
  const hiDivision = players.filter(p => p.rating >= 600);
  const loDivision = players.filter(p => p.rating < 600);

  const hiAvgRating =
    hiDivision.length > 0
      ? Math.round(hiDivision.reduce((sum, p) => sum + p.rating, 0) / hiDivision.length)
      : 0;
  const loAvgRating =
    loDivision.length > 0
      ? Math.round(loDivision.reduce((sum, p) => sum + p.rating, 0) / loDivision.length)
      : 0;
  const hiTotalPoints = hiDivision.reduce((sum, p) => sum + p.points, 0);
  const loTotalPoints = loDivision.reduce((sum, p) => sum + p.points, 0);

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">📊 Division Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-sm font-semibold text-yellow-400 mb-2">600+ KILLERS</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Players:</span>
                <span className="text-white font-semibold">{hiDivision.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Rating:</span>
                <span className="text-white font-semibold">{hiAvgRating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Points:</span>
                <span className="text-white font-semibold">{hiTotalPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent/20 to-accent/40 border border-accent/30 rounded-lg p-3">
            <div className="text-sm font-semibold text-accent mb-2">599 & UNDER</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Players:</span>
                <span className="text-white font-semibold">{loDivision.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Rating:</span>
                <span className="text-white font-semibold">{loAvgRating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Points:</span>
                <span className="text-white font-semibold">{loTotalPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Ladder() {
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const hiDivisionPlayers = players.filter(p => p.rating >= 600);
  const loDivisionPlayers = players.filter(p => p.rating < 600);

  return (
    <div className="space-y-6">
      {/* AI Strategy Section */}
      <AILadderSection players={players} />

      {/* Division Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DivisionStats players={players} />
        <LadderRules />
      </div>

      {/* Ladder Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LadderTable players={hiDivisionPlayers} title="600+ Division" division="HI" />
        <LadderTable players={loDivisionPlayers} title="599 & Below Division" division="LO" />
      </div>
    </div>
  );
}
