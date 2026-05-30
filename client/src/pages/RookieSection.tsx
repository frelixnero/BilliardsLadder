import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target, Star, TrendingUp, Crown, Award, Clock, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RookieSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [challengerName, setChallengerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [game, setGame] = useState("");
  const [table, setTable] = useState("");
  const [time, setTime] = useState("");

  // Fetch rookie data
  const { data: rookieLeaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/rookie/leaderboard"],
  });

  const { data: rookieMatches = [] } = useQuery<any[]>({
    queryKey: ["/api/rookie/matches"],
  });

  const { data: rookieEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/rookie/events"],
  });

  // Create rookie match mutation
  const createMatchMutation = useMutation({
    mutationFn: (matchData: any) => apiRequest("POST", "/api/rookie/matches", matchData),
    onSuccess: () => {
      toast({
        title: "Rookie Match Scheduled",
        description: "Match created successfully with $8 fee and $2 operator commission",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rookie/matches"] });
      setChallengerName("");
      setOpponentName("");
      setGame("");
      setTable("");
      setTime("");
    },
  });

  // Complete match mutation
  const completeMatchMutation = useMutation({
    mutationFn: ({ matchId, winner }: { matchId: string; winner: string }) => 
      apiRequest("PUT", `/api/rookie/matches/${matchId}/complete`, { winner }),
    onSuccess: () => {
      toast({
        title: "Match Completed",
        description: "Points awarded and achievements checked!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rookie/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rookie/leaderboard"] });
    },
  });

  // Create rookie event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => apiRequest("POST", "/api/rookie/events", eventData),
    onSuccess: () => {
      toast({
        title: "Rookie Event Created",
        description: "New rookie-only event is now available!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rookie/events"] });
    },
  });

  // Subscribe to Rookie Pass mutation
  const subscribeRookiePassMutation = useMutation({
    mutationFn: (playerId: string) => apiRequest("POST", "/api/rookie/subscription", { playerId }),
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: () => {
      toast({
        title: "Subscription Error",
        description: "Unable to start subscription process. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleMatch = () => {
    if (!challengerName || !opponentName || !game || !table || !time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all match details",
        variant: "destructive",
      });
      return;
    }

    createMatchMutation.mutate({
      challenger: challengerName,
      opponent: opponentName,
      game,
      table,
      time: new Date(time),
      fee: 6000, // $60 in cents
      commission: 600, // $6 in cents
      pointsAwarded: 10,
    });
  };

  const handleCompleteMatch = (matchId: string, winner: string) => {
    completeMatchMutation.mutate({ matchId, winner });
  };

  const createRookieEvent = (type: string) => {
    const eventData = {
      name: type === "tournament" ? "Rookie Mini-Tournament" : "Break & Run Jackpot",
      type,
      buyIn: 6000, // $60
      maxPlayers: 8,
      prizeType: type === "tournament" ? "credit" : "voucher",
      description: type === "tournament" 
        ? "8-player elimination tournament for rookies only"
        : "Make a break and run to win the jackpot (max $50)",
    };
    createEventMutation.mutate(eventData);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neon-green mb-2">Rookie Section</h1>
          <p className="text-gray-400">Entry-level pool for players building their skills</p>
          <div className="mt-4 flex justify-center space-x-4">
            <div className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">💰 $60 challenger fee • $6 operator commission</p>
            </div>
            <div className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">🎯 10 points for win • 5 points for loss</p>
            </div>
            <div className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-400">🎓 Graduate at 100 points</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-felt-darker">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Target className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Star className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Crown className="w-4 h-4 mr-2" />
              Rookie Pass
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Award className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Rookie Leaderboard */}
          <TabsContent value="leaderboard">
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green flex items-center">
                  <Trophy className="w-6 h-6 mr-2" />
                  Rookie Leaderboard
                </CardTitle>
                <CardDescription>Points-based rankings for rookie players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rookieLeaderboard?.length > 0 ? (
                    rookieLeaderboard.map((player: any, index: number) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-neon-green/20"
                        data-testid={`rookie-leaderboard-player-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-neon-green text-black rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{player.name}</p>
                            <p className="text-sm text-gray-400">{player.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-neon-green">{player.rookiePoints || 0}</p>
                            <p className="text-xs text-gray-400">POINTS</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-white">{player.rookieWins || 0}W</p>
                            <p className="text-lg font-semibold text-gray-400">{player.rookieLosses || 0}L</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-orange-400">{player.rookieStreak || 0}</p>
                            <p className="text-xs text-gray-400">STREAK</p>
                          </div>
                          {(player.rookiePoints || 0) >= 100 && (
                            <Badge className="bg-purple-600 text-white">
                              <Crown className="w-4 h-4 mr-1" />
                              Ready to Graduate!
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No rookie players yet. Be the first to join!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rookie Matches */}
          <TabsContent value="matches" className="space-y-6">
            {/* Schedule New Match */}
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green">Schedule Rookie Match</CardTitle>
                <CardDescription>Create a new rookie match with $8 flat fee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="challenger">Challenger</Label>
                    <Input
                      id="challenger"
                      value={challengerName}
                      onChange={(e) => setChallengerName(e.target.value)}
                      className="bg-black/20 border-neon-green/30 text-white"
                      data-testid="input-challenger"
                    />
                  </div>
                  <div>
                    <Label htmlFor="opponent">Opponent</Label>
                    <Input
                      id="opponent"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      className="bg-black/20 border-neon-green/30 text-white"
                      data-testid="input-opponent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="game">Game</Label>
                    <Select value={game} onValueChange={setGame}>
                      <SelectTrigger className="bg-black/20 border-neon-green/30 text-white">
                        <SelectValue placeholder="Select game" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8-ball">8-Ball</SelectItem>
                        <SelectItem value="9-ball">9-Ball</SelectItem>
                        <SelectItem value="10-ball">10-Ball</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="table">Table</Label>
                    <Input
                      id="table"
                      value={table}
                      onChange={(e) => setTable(e.target.value)}
                      className="bg-black/20 border-neon-green/30 text-white"
                      placeholder="Table #"
                      data-testid="input-table"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="datetime-local"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-black/20 border-neon-green/30 text-white"
                      data-testid="input-time"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleScheduleMatch}
                  className="w-full bg-neon-green text-black hover:bg-neon-green/80"
                  disabled={createMatchMutation.isPending}
                  data-testid="button-schedule-match"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Schedule Match ($8 Fee)
                </Button>
              </CardContent>
            </Card>

            {/* Recent Matches */}
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green">Recent Rookie Matches</CardTitle>
                <CardDescription>Active and completed rookie matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rookieMatches?.length > 0 ? (
                    rookieMatches.map((match: any) => (
                      <div
                        key={match.id}
                        className="p-4 bg-black/20 rounded-lg border border-neon-green/20"
                        data-testid={`match-${match.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {match.challenger} vs {match.opponent}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.game} • Table {match.table} • {new Date(match.time).toLocaleString()}
                            </p>
                            <p className="text-sm text-neon-green">${(match.fee / 100).toFixed(2)} fee</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={match.status === "completed" ? "default" : "secondary"}
                              className={match.status === "completed" ? "bg-green-600" : "bg-yellow-600"}
                            >
                              {match.status}
                            </Badge>
                            {match.status === "scheduled" && (
                              <div className="space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteMatch(match.id, match.challenger)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  data-testid={`button-complete-${match.challenger}`}
                                >
                                  {match.challenger} Wins
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteMatch(match.id, match.opponent)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  data-testid={`button-complete-${match.opponent}`}
                                >
                                  {match.opponent} Wins
                                </Button>
                              </div>
                            )}
                            {match.status === "completed" && match.winner && (
                              <Badge className="bg-gold text-black">
                                Winner: {match.winner}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No matches scheduled yet. Create the first rookie match!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rookie Events */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-felt-darker border border-neon-green/30">
                <CardHeader>
                  <CardTitle className="text-neon-green">Create Rookie Event</CardTitle>
                  <CardDescription>Mini-tournaments and jackpots for rookies only</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => createRookieEvent("tournament")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-create-tournament"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Create Mini-Tournament ($60 buy-in)
                  </Button>
                  <Button
                    onClick={() => createRookieEvent("jackpot")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    data-testid="button-create-jackpot"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Create Break & Run Jackpot
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-felt-darker border border-neon-green/30">
                <CardHeader>
                  <CardTitle className="text-neon-green">Active Events</CardTitle>
                  <CardDescription>Current rookie-only events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rookieEvents?.length > 0 ? (
                      rookieEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="p-3 bg-black/20 rounded-lg border border-neon-green/20"
                          data-testid={`event-${event.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{event.name}</p>
                              <p className="text-sm text-gray-400">{event.description}</p>
                              <p className="text-sm text-neon-green">
                                ${(event.buyIn / 100).toFixed(2)} buy-in • {event.currentPlayers}/{event.maxPlayers} players
                              </p>
                            </div>
                            <Badge
                              variant={event.status === "open" ? "default" : "secondary"}
                              className={event.status === "open" ? "bg-green-600" : "bg-gray-600"}
                            >
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active events</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rookie Pass Subscription */}
          <TabsContent value="subscription">
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green flex items-center">
                  <Crown className="w-6 h-6 mr-2" />
                  Rookie Pass - $13.99/month
                </CardTitle>
                <CardDescription>Optional subscription for enhanced rookie experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-neon-green" />
                    <h3 className="font-semibold text-white">Unlimited Matches</h3>
                    <p className="text-sm text-gray-400">Play as many rookie matches as you want</p>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-neon-green" />
                    <h3 className="font-semibold text-white">Leaderboard Tracking</h3>
                    <p className="text-sm text-gray-400">Detailed stats and progress tracking</p>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <Star className="w-8 h-8 mx-auto mb-2 text-neon-green" />
                    <h3 className="font-semibold text-white">Exclusive Events</h3>
                    <p className="text-sm text-gray-400">Access to subscriber-only jackpots</p>
                  </div>
                </div>
                <div className="text-center">
                  <Button
                    onClick={() => subscribeRookiePassMutation.mutate("rookie-player-1")} // In real app, get from user context
                    disabled={subscribeRookiePassMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                    data-testid="button-subscribe-rookie-pass"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {subscribeRookiePassMutation.isPending ? "Processing..." : "Subscribe to Rookie Pass ($13.99/month)"}
                  </Button>
                  <p className="text-sm text-gray-400 mt-2">Secure payment via Stripe • Operator decides where fee goes</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements">
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green flex items-center">
                  <Award className="w-6 h-6 mr-2" />
                  Rookie Achievements
                </CardTitle>
                <CardDescription>Badges earned through rookie play</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <div className="text-4xl mb-2">🥇</div>
                    <h3 className="font-semibold text-white">First Win</h3>
                    <p className="text-sm text-gray-400">Win your first rookie match</p>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <div className="text-4xl mb-2">🔥</div>
                    <h3 className="font-semibold text-white">3-Win Streak</h3>
                    <p className="text-sm text-gray-400">Win 3 matches in a row</p>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg border border-neon-green/20">
                    <div className="text-4xl mb-2">🎓</div>
                    <h3 className="font-semibold text-white">Graduated</h3>
                    <p className="text-sm text-gray-400">Reached 100 points and joined main ladder</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">Graduation Path</h3>
                  <p className="text-sm text-gray-300">
                    Earn 100 Rookie Points to automatically graduate to the main ActionLadder. 
                    You'll keep your rookie badge as a mark of where you started your journey!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}