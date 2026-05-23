import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Trophy } from "lucide-react";
import type { Tournament, InsertTournament } from "@shared/schema";

const tournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  entry: z.number().min(1, "Entry fee must be at least $1"),
  format: z.string().min(1, "Format is required"),
  game: z.string().min(1, "Game type is required"),
  maxPlayers: z.number().min(2, "Must allow at least 2 players"),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

const gameTypes = [
  "8-Ball",
  "9-Ball", 
  "10-Ball",
  "Straight Pool",
  "One Pocket",
  "Bank Pool",
  "Rotation",
  "Cut Throat"
];

const formats = [
  "Single Elimination",
  "Double Elimination", 
  "Round Robin",
  "Swiss System",
  "Race Format"
];

function CreateTournamentDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      entry: 25,
      format: "Double Elimination",
      game: "9-Ball",
      maxPlayers: 16,
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: (data: InsertTournament) => apiRequest("POST", "/api/tournaments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Created",
        description: "New tournament has been successfully created!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    const tournamentData: InsertTournament = {
      ...data,
      prizePool: data.entry * data.maxPlayers * 0.9, // 90% of total entries as prize pool
      currentPlayers: 0,
      status: "open",
      stripeProductId: null,
    };
    createTournamentMutation.mutate(tournamentData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/50"
          data-testid="button-create-tournament"
        >
          Create Tournament
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Tournament</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Tournament Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Friday Night Fights"
                      data-testid="input-tournament-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Entry Fee ($)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-tournament-entry"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Max Players</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-tournament-max-players"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="game"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Game Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tournament-game">
                          <SelectValue placeholder="Select game" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[120]">
                        {gameTypes.map((game) => (
                          <SelectItem key={game} value={game}>
                            {game}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tournament-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[120]">
                        {formats.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={createTournamentMutation.isPending}
              data-testid="button-submit-tournament"
            >
              {createTournamentMutation.isPending ? <LoadingSpinner /> : "Create Tournament"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { toast } = useToast();
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [showAiContent, setShowAiContent] = useState(false);

  const handleJoinTournament = async () => {
    toast({
      title: "Joining Tournament",
      description: "Redirecting to payment...",
    });
    // This would normally create a Stripe payment intent and redirect
    window.location.href = `/checkout?type=tournament&id=${tournament.id}&amount=${tournament.entry}`;
  };

  const getTournamentPredictionMutation = useMutation({
    mutationFn: () => fetch('/api/ai/community-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: `Analyze this tournament: ${tournament.name} (${tournament.format} ${tournament.game}). Entry: $${tournament.entry}, Max Players: ${tournament.maxPlayers}, Current: ${tournament.currentPlayers || 0}. Predict likely winners, bracket outcomes, and key factors that will determine success.`
      })
    }).then(res => res.json()),
    onSuccess: (data) => {
      setAiPrediction(data.answer);
      setShowAiContent(true);
      toast({
        title: "Tournament Analysis Ready!",
        description: "AI predictions and insights generated."
      });
    },
    onError: () => {
      toast({
        title: "Prediction Failed",
        description: "Unable to generate tournament analysis.",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-neon-green/20 text-neon-green";
      case "in_progress": return "bg-yellow-500/20 text-yellow-400";
      case "completed": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const progressPercentage = tournament.maxPlayers > 0 
    ? ((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-r from-dollar-green/20 to-transparent border border-dollar-green/30 card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{tournament.name}</CardTitle>
          <Badge className={getStatusColor(tournament.status || 'open')}>
            {tournament.status === "open" ? `$${tournament.entry} Entry` : tournament.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            {tournament.format} • {tournament.game} • Prize Pool: ${tournament.prizePool}
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Players:</span>
              <span className="text-neon-green font-semibold">
                {tournament.currentPlayers || 0}/{tournament.maxPlayers}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-neon-green to-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {tournament.status === "open" && (
            <Button
              onClick={handleJoinTournament}
              className="w-full bg-dollar-green/20 hover:bg-dollar-green/40 text-dollar-green"
              data-testid={`button-join-tournament-${tournament.id}`}
            >
              Join (${tournament.entry})
            </Button>
          )}

          {tournament.status === "in_progress" && (
            <div className="text-center text-yellow-400 font-semibold">
              Tournament in Progress
            </div>
          )}

          {tournament.status === "completed" && (
            <div className="text-center text-gray-400">
              Tournament Completed
            </div>
          )}

          {/* AI Tournament Analysis */}
          <div className="border-t border-green-500/20 pt-3 mt-3">
            <Button
              onClick={() => getTournamentPredictionMutation.mutate()}
              disabled={getTournamentPredictionMutation.isPending}
              size="sm"
              variant="outline"
              className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
              data-testid={`button-ai-tournament-${tournament.id}`}
            >
              {getTournamentPredictionMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  AI Tournament Analysis
                </>
              )}
            </Button>

            {/* AI Prediction Display */}
            {showAiContent && aiPrediction && (
              <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-3 mt-3">
                <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  AI Tournament Predictions
                </h4>
                <div className="text-xs text-gray-300 whitespace-pre-wrap">
                  {aiPrediction}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StripeIntegrationInfo() {
  return (
    <Card className="bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.75 8.25h18.5a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5zm0 4h18.5a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5z"/>
          </svg>
          <span className="text-sm text-blue-400 font-semibold">Secure Payment via Stripe</span>
        </div>
        <div className="text-xs text-gray-400">
          All tournament entries processed securely. Instant confirmation.
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tournaments() {
  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const openTournaments = tournaments.filter(t => t.status === "open");
  const activeTournaments = tournaments.filter(t => t.status === "in_progress");
  const completedTournaments = tournaments.filter(t => t.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🏆 Tournaments</h1>
          <p className="text-gray-400">Compete for prizes and glory</p>
        </div>
        <CreateTournamentDialog />
      </div>

      {/* Stripe Integration Info */}
      <StripeIntegrationInfo />

      {/* Open Tournaments */}
      {openTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Open for Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">In Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tournaments */}
      {completedTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTournaments.slice(0, 6).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No tournaments yet</div>
            <CreateTournamentDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}