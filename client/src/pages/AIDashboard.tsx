import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Target, TrendingUp, MessageCircle, Zap, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Player } from '@shared/schema';

export default function AIDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for different AI features
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [coachingTopic, setCoachingTopic] = useState('');
  const [communityQuestion, setCommunityQuestion] = useState('');
  const [predictionChallenger, setPredictionChallenger] = useState('');
  const [predictionOpponent, setPredictionOpponent] = useState('');
  const [predictionGameType, setPredictionGameType] = useState('');

  // Fetch players for dropdowns
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    queryFn: () => fetch('/api/players').then(res => res.json())
  });

  // AI Feature mutations
  const opponentSuggestionMutation = useMutation({
    mutationFn: (playerId: string) => 
      fetch(`/api/ai/opponent-suggestions/${playerId}`).then(res => res.json()),
    onSuccess: () => {
      toast({ 
        title: "Opponent suggestions generated!", 
        description: "Check out the AI's recommendations below." 
      });
    }
  });

  const performanceAnalysisMutation = useMutation({
    mutationFn: (playerId: string) => 
      fetch(`/api/ai/performance-analysis/${playerId}`).then(res => res.json()),
    onSuccess: () => {
      toast({ 
        title: "Performance analysis complete!", 
        description: "Your detailed analysis is ready." 
      });
    }
  });

  const matchPredictionMutation = useMutation({
    mutationFn: ({ challengerId, opponentId, gameType }: { challengerId: string, opponentId: string, gameType: string }) =>
      fetch('/api/ai/match-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengerId, opponentId, gameType })
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ 
        title: "Match prediction ready!", 
        description: "AI has analyzed the potential matchup." 
      });
    }
  });

  const coachingAdviceMutation = useMutation({
    mutationFn: ({ playerId, topic }: { playerId: string, topic?: string }) =>
      fetch('/api/ai/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, topic })
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ 
        title: "Coaching advice generated!", 
        description: "Your personalized coaching tips are ready." 
      });
    }
  });

  const communityChatMutation = useMutation({
    mutationFn: (question: string) =>
      fetch('/api/ai/community-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ 
        title: "AI assistant responded!", 
        description: "Your question has been answered." 
      });
    }
  });

  return (
    <div className="container mx-auto py-8 px-4" data-testid="ai-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">AI-Powered Features</h1>
        <p className="text-gray-400">Enhance your billiards experience with artificial intelligence</p>
      </div>

      <Tabs defaultValue="matchmaking" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-black/50 p-1">
          <TabsTrigger value="matchmaking" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Target className="w-4 h-4" />
            Matchmaking
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <TrendingUp className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Brain className="w-4 h-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Zap className="w-4 h-4" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="commentary" className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Users className="w-4 h-4" />
            Commentary
          </TabsTrigger>
        </TabsList>

        {/* Smart Matchmaking */}
        <TabsContent value="matchmaking">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Smart Opponent Suggestions
              </CardTitle>
              <CardDescription className="text-gray-400">
                AI-powered matchmaking based on skill, playing style, and recent performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="player-select" className="text-white">Select Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger data-testid="select-player-matchmaking">
                    <SelectValue placeholder="Choose a player for opponent suggestions" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} (Rating: {player.rating})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => selectedPlayer && opponentSuggestionMutation.mutate(selectedPlayer)}
                disabled={!selectedPlayer || opponentSuggestionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-get-suggestions"
              >
                {opponentSuggestionMutation.isPending ? 'Analyzing...' : 'Get AI Suggestions'}
              </Button>

              {opponentSuggestionMutation.data && (
                <Card className="bg-gray-900/50 border-green-500/20">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold mb-2">AI Recommendations:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm">
                      {opponentSuggestionMutation.data.suggestions}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis */}
        <TabsContent value="analysis">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Performance Analysis
              </CardTitle>
              <CardDescription className="text-gray-400">
                Deep insights into playing patterns, strengths, and improvement areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="analysis-player" className="text-white">Select Player for Analysis</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger data-testid="select-player-analysis">
                    <SelectValue placeholder="Choose a player to analyze" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} (Rating: {player.rating})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => selectedPlayer && performanceAnalysisMutation.mutate(selectedPlayer)}
                disabled={!selectedPlayer || performanceAnalysisMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-analyze-performance"
              >
                {performanceAnalysisMutation.isPending ? 'Analyzing Performance...' : 'Get AI Analysis'}
              </Button>

              {performanceAnalysisMutation.data && (
                <Card className="bg-gray-900/50 border-green-500/20">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold mb-2">Performance Insights:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm">
                      {performanceAnalysisMutation.data.analysis}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match Predictions */}
        <TabsContent value="predictions">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Match Predictions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Advanced analytics to predict match outcomes and key factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="challenger" className="text-white">Challenger</Label>
                  <Select value={predictionChallenger} onValueChange={setPredictionChallenger}>
                    <SelectTrigger data-testid="select-challenger">
                      <SelectValue placeholder="Select challenger" />
                    </SelectTrigger>
                    <SelectContent className="z-[120]">
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="opponent" className="text-white">Opponent</Label>
                  <Select value={predictionOpponent} onValueChange={setPredictionOpponent}>
                    <SelectTrigger data-testid="select-opponent">
                      <SelectValue placeholder="Select opponent" />
                    </SelectTrigger>
                    <SelectContent className="z-[120]">
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="game-type" className="text-white">Game Type</Label>
                <Select value={predictionGameType} onValueChange={setPredictionGameType}>
                  <SelectTrigger data-testid="select-game-type">
                    <SelectValue placeholder="Select game type" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectItem value="8-ball">8-Ball</SelectItem>
                    <SelectItem value="9-ball">9-Ball</SelectItem>
                    <SelectItem value="straight-pool">Straight Pool</SelectItem>
                    <SelectItem value="10-ball">10-Ball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => {
                  if (predictionChallenger && predictionOpponent && predictionGameType) {
                    matchPredictionMutation.mutate({
                      challengerId: predictionChallenger,
                      opponentId: predictionOpponent,
                      gameType: predictionGameType
                    });
                  }
                }}
                disabled={!predictionChallenger || !predictionOpponent || !predictionGameType || matchPredictionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-predict-match"
              >
                {matchPredictionMutation.isPending ? 'Analyzing Matchup...' : 'Predict Match Outcome'}
              </Button>

              {matchPredictionMutation.data && (
                <Card className="bg-gray-900/50 border-green-500/20">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold mb-2">Match Prediction:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm">
                      {matchPredictionMutation.data.prediction}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Coaching */}
        <TabsContent value="coaching">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Pool Coach
              </CardTitle>
              <CardDescription className="text-gray-400">
                Personalized coaching advice and improvement strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="coaching-player" className="text-white">Select Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger data-testid="select-player-coaching">
                    <SelectValue placeholder="Choose player for coaching" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="coaching-topic" className="text-white">Specific Topic (Optional)</Label>
                <Input
                  id="coaching-topic"
                  value={coachingTopic}
                  onChange={(e) => setCoachingTopic(e.target.value)}
                  placeholder="e.g., break shots, safety play, mental game..."
                  className="bg-gray-800/50 border-gray-600 text-white"
                  data-testid="input-coaching-topic"
                />
              </div>
              
              <Button 
                onClick={() => {
                  if (selectedPlayer) {
                    coachingAdviceMutation.mutate({
                      playerId: selectedPlayer,
                      topic: coachingTopic || undefined
                    });
                  }
                }}
                disabled={!selectedPlayer || coachingAdviceMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-get-coaching"
              >
                {coachingAdviceMutation.isPending ? 'Generating Advice...' : 'Get AI Coaching'}
              </Button>

              {coachingAdviceMutation.data && (
                <Card className="bg-gray-900/50 border-green-500/20">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold mb-2">Coaching Advice:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm">
                      {coachingAdviceMutation.data.advice}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Chat */}
        <TabsContent value="community">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Community AI Assistant
              </CardTitle>
              <CardDescription className="text-gray-400">
                Ask questions about rules, tournaments, ladder system, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="community-question" className="text-white">Ask the AI Assistant</Label>
                <Textarea
                  id="community-question"
                  value={communityQuestion}
                  onChange={(e) => setCommunityQuestion(e.target.value)}
                  placeholder="e.g., How does the respect points system work? What are the membership benefits?"
                  className="bg-gray-800/50 border-gray-600 text-white min-h-[100px]"
                  data-testid="textarea-community-question"
                />
              </div>
              
              <Button 
                onClick={() => {
                  if (communityQuestion.trim()) {
                    communityChatMutation.mutate(communityQuestion);
                    setCommunityQuestion('');
                  }
                }}
                disabled={!communityQuestion.trim() || communityChatMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-ask-assistant"
              >
                {communityChatMutation.isPending ? 'AI is thinking...' : 'Ask AI Assistant'}
              </Button>

              {communityChatMutation.data && (
                <Card className="bg-gray-900/50 border-green-500/20">
                  <CardContent className="pt-6">
                    <h4 className="text-white font-semibold mb-2">AI Assistant:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm">
                      {communityChatMutation.data.answer}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Commentary */}
        <TabsContent value="commentary">
          <Card className="bg-black/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Live Match Commentary
              </CardTitle>
              <CardDescription className="text-gray-400">
                AI-generated commentary for ongoing matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-white font-semibold mb-2">Commentary Integration</h3>
                <p className="text-gray-400 mb-4">
                  AI commentary is automatically generated for live matches
                </p>
                <Badge variant="outline" className="border-green-500 text-green-400">
                  Available in Match Details
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}