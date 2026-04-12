import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateQRCodeUrl, generateJoinUrl } from "@/lib/qr-generator";
import { generateFightNightPoster } from "@/lib/poster-generator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Brain, TrendingUp, Zap, Settings, Users, Shield, Crown, Star, AlertCircle, Building2, Rocket, CheckCircle2 } from "lucide-react";
import type {
  Player,
  Match,
  Tournament,
  CharityEvent,
  KellyPool,
} from "@shared/schema";

function StatsCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-6 shadow-felt">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold text-neon-green">{value}</div>
      <div className="text-sm text-gray-400">{subtitle}</div>
    </div>
  );
}

function AIInsightsSection({
  players,
  matches,
}: {
  players: Player[];
  matches: Match[];
}) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [ladderAdvice, setLadderAdvice] = useState<string | null>(null);
  const { toast } = useToast();

  const getAIInsightsMutation = useMutation({
    mutationFn: () =>
      fetch("/api/ai/community-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:
            "Analyze the current ladder trends, player activity, and provide insights about the overall state of competition in the ActionLadder billiards community.",
        }),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      setAiInsights(data.answer);
      toast({
        title: "AI Insights Generated!",
        description: "Current ladder analysis is ready.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to generate insights at this time.",
        variant: "destructive",
      });
    },
  });

  const getLadderAdviceMutation = useMutation({
    mutationFn: () =>
      fetch("/api/ai/community-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:
            "What strategies should players use to climb the ladder effectively? Consider rating differences, match selection, and tournament participation.",
        }),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      setLadderAdvice(data.answer);
      toast({
        title: "Strategy Guide Ready!",
        description: "AI ladder climbing advice generated.",
      });
    },
    onError: () => {
      toast({
        title: "Strategy Failed",
        description: "Unable to generate strategy at this time.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <Brain className="mr-3 text-green-400" />
          AI Ladder Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => getAIInsightsMutation.mutate()}
            disabled={getAIInsightsMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-ai-insights"
          >
            {getAIInsightsMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Analyze Current Trends
          </Button>
          <Button
            onClick={() => getLadderAdviceMutation.mutate()}
            disabled={getLadderAdviceMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-ladder-advice"
          >
            {getLadderAdviceMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Get Climbing Strategy
          </Button>
        </div>

        {aiInsights && (
          <div className="bg-green-900/20 border border-green-600/30 rounded p-4">
            <h4 className="font-semibold text-green-300 mb-2">
              📊 Community Analysis
            </h4>
            <p className="text-sm text-green-200">{aiInsights}</p>
          </div>
        )}

        {ladderAdvice && (
          <div className="bg-green-900/20 border border-green-600/30 rounded p-4">
            <h4 className="font-semibold text-green-300 mb-2">
              🎯 Strategy Guide
            </h4>
            <p className="text-sm text-green-200">{ladderAdvice}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionStatus() {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const { data: billingStatus, isLoading } = useQuery<{
    hasSubscription: boolean;
    tier: string | null;
    status: string;
    tierInfo?: { name: string; monthlyPrice: number };
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    monthlyPrice?: number;
    perks?: string[];
  }>({
    queryKey: ["/api/player-billing/status"],
    enabled: !!user,
  });

  const hasActive = billingStatus?.hasSubscription && billingStatus?.status === "active";
  const tierKey = billingStatus?.tier || null;

  const tierConfig: Record<string, { icon: typeof Users; color: string; label: string }> = {
    rookie: { icon: Users, color: "text-blue-400", label: "Rookie" },
    standard: { icon: Star, color: "text-purple-400", label: "Standard" },
    basic: { icon: Star, color: "text-purple-400", label: "Standard" },
    premium: { icon: Crown, color: "text-yellow-400", label: "Premium" },
    pro: { icon: Crown, color: "text-yellow-400", label: "Premium" },
  };

  const inactiveIconConfig = { icon: AlertCircle, color: "text-red-400", label: "No Active Plan" };
  const inactiveColors = { borderColor: "rgba(248,113,113,0.5)", hoverBorderColor: "rgba(248,113,113,0.8)", shadowColor: "rgba(239,68,68,0.2)", hoverShadowColor: "rgba(239,68,68,0.4)" };

  const tierColors: Record<string, { borderColor: string; hoverBorderColor: string; shadowColor: string; hoverShadowColor: string }> = {
    rookie: { borderColor: "rgba(96,165,250,0.5)", hoverBorderColor: "rgba(96,165,250,0.8)", shadowColor: "rgba(59,130,246,0.2)", hoverShadowColor: "rgba(59,130,246,0.4)" },
    standard: { borderColor: "rgba(192,132,252,0.5)", hoverBorderColor: "rgba(192,132,252,0.8)", shadowColor: "rgba(168,85,247,0.2)", hoverShadowColor: "rgba(168,85,247,0.4)" },
    basic: { borderColor: "rgba(192,132,252,0.5)", hoverBorderColor: "rgba(192,132,252,0.8)", shadowColor: "rgba(168,85,247,0.2)", hoverShadowColor: "rgba(168,85,247,0.4)" },
    premium: { borderColor: "rgba(250,204,21,0.5)", hoverBorderColor: "rgba(250,204,21,0.8)", shadowColor: "rgba(234,179,8,0.2)", hoverShadowColor: "rgba(234,179,8,0.4)" },
    pro: { borderColor: "rgba(250,204,21,0.5)", hoverBorderColor: "rgba(250,204,21,0.8)", shadowColor: "rgba(234,179,8,0.2)", hoverShadowColor: "rgba(234,179,8,0.4)" },
  };

  const config = hasActive && tierKey ? (tierConfig[tierKey] || inactiveIconConfig) : inactiveIconConfig;
  const colors = hasActive && tierKey ? (tierColors[tierKey] || inactiveColors) : inactiveColors;
  const IconComponent = config.icon;

  if (isLoading) {
    return (
      <div className="w-44 h-20 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
        <LoadingSpinner size="sm" color="neon" />
      </div>
    );
  }

  return (
    <div
      className="w-44 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 px-4 py-3 transition-all duration-300 ease-out"
      style={{
        background: "rgba(255,255,255,0.05)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${isHovered ? colors.hoverBorderColor : colors.borderColor}`,
        boxShadow: isHovered
          ? `0 10px 25px -5px ${colors.hoverShadowColor}, 0 8px 10px -6px ${colors.hoverShadowColor}`
          : `0 4px 15px -3px ${colors.shadowColor}, 0 2px 6px -4px ${colors.shadowColor}`,
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = "/app?tab=player-subscription"}
      data-testid="subscription-status-card"
    >
      <IconComponent className={`h-6 w-6 ${config.color}`} />
      <span className={`text-sm font-semibold ${config.color} text-center leading-tight`}>
        {config.label}
      </span>
    </div>
  );
}

function DashboardSubscriptionStatus() {
  const { user } = useAuth();
  const role = user?.globalRole;

  if (role === "OPERATOR" || role === "OWNER" || role === "TRUSTEE") {
    return <OperatorSubscriptionStatus />;
  }
  return <SubscriptionStatus />;
}

function OperatorSubscriptionStatus() {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const { data: currentSubscription, isLoading } = useQuery<{
    hasSubscription: boolean;
    tier?: string;
    status?: string;
    hallName?: string;
  }>({
    queryKey: ["/api/operator-subscriptions", user?.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/operator-subscriptions/${user?.id}`, { credentials: "include" });
        if (!res.ok) return { hasSubscription: false };
        const sub = await res.json();
        if (sub && sub.id) {
          return { hasSubscription: true, tier: sub.tier, status: sub.status, hallName: sub.hallName };
        }
        return { hasSubscription: false };
      } catch {
        return { hasSubscription: false };
      }
    },
    enabled: !!user,
  });

  const hasActive = currentSubscription?.hasSubscription && currentSubscription?.status === "active";
  const tierKey = currentSubscription?.tier || null;

  const tierConfig: Record<string, { icon: typeof Building2; color: string; label: string; price: number }> = {
    small: { icon: Building2, color: "text-green-400", label: "Small Hall", price: 199 },
    medium: { icon: Star, color: "text-blue-400", label: "Medium Hall", price: 299 },
    large: { icon: Crown, color: "text-purple-400", label: "Large Hall", price: 399 },
    mega: { icon: Rocket, color: "text-yellow-400", label: "Mega Hall", price: 799 },
  };

  const tierColors: Record<string, { borderColor: string; hoverBorderColor: string; shadowColor: string; hoverShadowColor: string }> = {
    small: { borderColor: "rgba(74,222,128,0.5)", hoverBorderColor: "rgba(74,222,128,0.8)", shadowColor: "rgba(34,197,94,0.2)", hoverShadowColor: "rgba(34,197,94,0.4)" },
    medium: { borderColor: "rgba(96,165,250,0.5)", hoverBorderColor: "rgba(96,165,250,0.8)", shadowColor: "rgba(59,130,246,0.2)", hoverShadowColor: "rgba(59,130,246,0.4)" },
    large: { borderColor: "rgba(192,132,252,0.5)", hoverBorderColor: "rgba(192,132,252,0.8)", shadowColor: "rgba(168,85,247,0.2)", hoverShadowColor: "rgba(168,85,247,0.4)" },
    mega: { borderColor: "rgba(250,204,21,0.5)", hoverBorderColor: "rgba(250,204,21,0.8)", shadowColor: "rgba(234,179,8,0.2)", hoverShadowColor: "rgba(234,179,8,0.4)" },
  };

  const inactiveIconConfig = { icon: AlertCircle, color: "text-red-400", label: "No Active Plan", price: 0 };
  const inactiveColors = { borderColor: "rgba(248,113,113,0.5)", hoverBorderColor: "rgba(248,113,113,0.8)", shadowColor: "rgba(239,68,68,0.2)", hoverShadowColor: "rgba(239,68,68,0.4)" };

  const config = hasActive && tierKey ? (tierConfig[tierKey] || inactiveIconConfig) : inactiveIconConfig;
  const colors = hasActive && tierKey ? (tierColors[tierKey] || inactiveColors) : inactiveColors;
  const IconComponent = config.icon;

  if (isLoading) {
    return (
      <div className="w-44 h-20 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
        <LoadingSpinner size="sm" color="neon" />
      </div>
    );
  }

  return (
    <div
      className="w-44 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 px-4 py-3 transition-all duration-300 ease-out"
      style={{
        background: "rgba(255,255,255,0.05)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${isHovered ? colors.hoverBorderColor : colors.borderColor}`,
        boxShadow: isHovered
          ? `0 10px 25px -5px ${colors.hoverShadowColor}, 0 8px 10px -6px ${colors.hoverShadowColor}`
          : `0 4px 15px -3px ${colors.shadowColor}, 0 2px 6px -4px ${colors.shadowColor}`,
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = "/app?tab=operator-subscriptions"}
      data-testid="operator-subscription-status-card"
    >
      <IconComponent className={`h-6 w-6 ${config.color}`} />
      <span className={`text-sm font-semibold ${config.color} text-center leading-tight`}>
        {config.label}
      </span>
      {hasActive && tierKey && (
        <span className="text-xs text-gray-400">${config.price}/mo</span>
      )}
    </div>
  );
}

function KingsOfTheHill({ players }: { players: Player[] }) {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const hiDivision = sortedPlayers.filter((p) => p.rating >= 600);
  const loDivision = sortedPlayers.filter((p) => p.rating < 600);
  const kingHI = hiDivision[0];
  const kingLO = loDivision[0];

  return (
    <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <span className="mr-3">👑</span>
          Kings of the Hill
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 600+ Division King */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-yellow-400">
                600+ KILLERS
              </span>
              <Badge className="bg-yellow-500/20 text-yellow-300">
                DIVISION 1
              </Badge>
            </div>
            {kingHI ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-yellow-900">
                      {kingHI.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{kingHI.name}</div>
                    <div className="text-sm text-gray-400">
                      {kingHI.city} • {kingHI.points} pts
                    </div>
                    <div className="text-xs text-yellow-400">
                      🔥 {kingHI.streak}-game streak
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    data-testid="challenge-king-hi"
                  >
                    Challenge King
                  </Button>
                  <span className="text-xs text-yellow-400">
                    Auto-bounty: $50
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No players in division</div>
            )}
          </div>

          {/* 599 & Under Division King */}
          <div className="bg-gradient-to-br from-accent/20 to-accent/40 border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-accent">
                599 & UNDER
              </span>
              <Badge className="bg-accent/20 text-accent">DIVISION 2</Badge>
            </div>
            {kingLO ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {kingLO.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{kingLO.name}</div>
                    <div className="text-sm text-gray-400">
                      {kingLO.city} • {kingLO.points} pts
                    </div>
                    <div className="text-xs text-accent">
                      🔥 {kingLO.streak}-game streak
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    data-testid="challenge-king-lo"
                  >
                    Challenge King
                  </Button>
                  <span className="text-xs text-accent">Auto-bounty: $25</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No players in division</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QRCodeSection() {
  const { toast } = useToast();
  const joinUrl = generateJoinUrl();
  const qrCodeUrl = generateQRCodeUrl(joinUrl);

  const handleGeneratePoster = async () => {
    try {
      toast({
        title: "Generating Poster",
        description: "Creating fight night poster with top 2 players...",
      });

      // This would normally use real player data
      const posterData = {
        player1: { name: "Tyga Hoodz", rating: 620, city: "San Marcos" },
        player2: { name: "Jesse — The Spot", rating: 605, city: "Seguin" },
        event: {
          title: "Friday Night Fights",
          date: "This Friday 8PM",
          location: "ActionLadder",
          stakes: "$150",
        },
      };

      const posterUrl = await generateFightNightPoster(posterData);

      // Create download link
      const link = document.createElement("a");
      link.href = posterUrl;
      link.download = "fight-night-poster.png";
      link.click();

      toast({
        title: "Poster Generated",
        description: "Fight night poster has been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate poster",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">
          📱 Quick Join
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <img
            src={qrCodeUrl}
            alt="QR Code to join ladder"
            className="w-32 h-32 mx-auto"
            data-testid="qr-code"
          />
        </div>
        <div className="text-center text-sm text-gray-400 mb-4">
          Scan to join ActionLadder instantly
        </div>

        {/* Fight Night Poster Generator */}
        <div className="bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/30 rounded-lg p-4">
          <div className="font-semibold text-white mb-2">
            🥊 Fight Night Poster
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Auto-generate with top 2 players
          </div>
          <Button
            onClick={handleGeneratePoster}
            className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-400"
            data-testid="button-generate-poster"
          >
            Generate Poster
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentMatches({
  matches,
  players,
}: {
  matches: Match[];
  players: Player[];
}) {
  const recentMatches = matches
    .filter((m) => m.status === "reported")
    .sort(
      (a, b) =>
        new Date(b.reportedAt || 0).getTime() -
        new Date(a.reportedAt || 0).getTime(),
    )
    .slice(0, 5);

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || "Unknown Player";
  };

  if (recentMatches.length === 0) {
    return (
      <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            🔥 Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">No matches reported yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">
          🔥 Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentMatches.map((match) => {
            const winner = getPlayerName(match.winner || "");
            const loser = getPlayerName(
              match.winner === match.challenger
                ? match.opponent
                : match.challenger,
            );

            return (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-felt-dark">W</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {winner} defeated {loser}
                    </div>
                    <div className="text-sm text-gray-400">
                      {match.game} • ${match.stake} entry fee • {match.table}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-neon-green font-semibold">
                    +{match.stake} pts
                  </div>
                  <div className="text-xs text-gray-400">
                    {match.reportedAt
                      ? new Date(match.reportedAt).toLocaleTimeString()
                      : "Recently"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      const sessionId = params.get("session_id");
      const verifyAndShow = async () => {
        let verified = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!verified && sessionId && attempts < maxAttempts) {
          attempts += 1;
          try {
            console.log(`[subscription-verify] attempt ${attempts}/${maxAttempts} for session ${sessionId}`);
            const resp = await fetch("/api/player-billing/verify-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sessionId }),
            });

            const data = await resp.json();
            console.log(`[subscription-verify] response status=${resp.status}`, data);
            if (resp.ok && data.hasSubscription === true) {
              verified = true;

              // Prime the cache immediately so the status card updates without waiting on another round-trip.
              queryClient.setQueryData(["/api/player-billing/status"], {
                hasSubscription: true,
                tier: data.tier,
                status: data.status || "active",
                tierInfo: data.tierInfo,
              });
              break;
            }

            if (!resp.ok || data.hasSubscription !== true) {
              console.warn(`[subscription-verify] verify did not confirm active subscription on attempt ${attempts}`);
            }
          } catch (error) {
            console.error(`[subscription-verify] request failed on attempt ${attempts}`, error);
          }

          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
        }

        // Avoid immediately overwriting the verified cache with a stale read.
        if (!verified) {
          await queryClient.refetchQueries({ queryKey: ["/api/player-billing/status"], type: "all" });
          await queryClient.refetchQueries({ queryKey: ["/api/operator-subscriptions", user?.id], type: "all" });
        }

        if (verified || sessionId) {
          setShowSuccessBanner(true);
          toast({
            title: "Subscription Activated!",
            description: verified
              ? "Your membership is now active. Welcome to the ladder!"
              : "Payment completed. Subscription status may take a few seconds to update.",
          });
        }

        // Clear URL params only after verification attempts complete.
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      };

      void verifyAndShow();
    }
  }, []);

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<
    Tournament[]
  >({
    queryKey: ["/api/tournaments"],
  });

  const { data: kellyPools = [], isLoading: kellyPoolsLoading } = useQuery<
    KellyPool[]
  >({
    queryKey: ["/api/kelly-pools"],
  });

  const { data: jackpotData, isLoading: jackpotLoading } = useQuery<{
    jackpot: number;
  }>({
    queryKey: ["/api/jackpot"],
  });

  if (
    playersLoading ||
    matchesLoading ||
    tournamentsLoading ||
    kellyPoolsLoading ||
    jackpotLoading
  ) {
    return (
      <div className="space-y-8">
        {showSuccessBanner && (
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-xl border"
            style={{
              background: "rgba(16,185,129,0.1)",
              borderColor: "rgba(16,185,129,0.4)",
            }}
            data-testid="subscription-success-banner"
          >
            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-400 font-semibold">Subscription Activated!</p>
              <p className="text-gray-300 text-sm">Your membership is now active. Your subscription status has been updated below.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-gray-400 hover:text-white"
              onClick={() => setShowSuccessBanner(false)}
              data-testid="button-dismiss-success"
            >
              Dismiss
            </Button>
          </div>
        )}

        <DashboardSubscriptionStatus />

        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" color="neon" />
        </div>
      </div>
    );
  }

  const completedMatches = matches.filter(
    (m) => m.status === "reported",
  ).length;
  const upcomingMatches = matches.filter(
    (m) => m.status === "scheduled",
  ).length;
  const totalStakes = matches
    .filter((m) => m.status === "reported")
    .reduce((sum, match) => sum + match.stake, 0);
  const activePlayers = players.length;
  const liveMatches = 3; // This would come from live streaming data

  return (
    <div className="space-y-8">
      {showSuccessBanner && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl border"
          style={{
            background: "rgba(16,185,129,0.1)",
            borderColor: "rgba(16,185,129,0.4)",
          }}
          data-testid="subscription-success-banner"
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-semibold">Subscription Activated!</p>
            <p className="text-gray-300 text-sm">Your membership is now active. Your subscription status has been updated below.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-gray-400 hover:text-white"
            onClick={() => setShowSuccessBanner(false)}
            data-testid="button-dismiss-success"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Subscription Status */}
      <DashboardSubscriptionStatus />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Break & Run Jackpot"
          value={`$${jackpotData?.jackpot || 847}`}
          subtitle="2% of entry fees feed this"
          icon="💰"
        />
        <StatsCard
          title="Active Players"
          value={activePlayers}
          subtitle="Two divisions"
          icon="👥"
        />
        <StatsCard
          title="Live Matches"
          value={liveMatches}
          subtitle={`${upcomingMatches} upcoming`}
          icon="🎯"
        />
        <StatsCard
          title="Total Stakes"
          value={`$${totalStakes.toLocaleString()}`}
          subtitle={`${completedMatches} completed`}
          icon="💵"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KingsOfTheHill players={players} />
        <QRCodeSection />
      </div>

      {/* AI Insights Section */}
      <AIInsightsSection players={players} matches={matches} />

      {/* Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentMatches matches={matches} players={players} />
      </div>

      {/* Footer Stats */}
      <Card className="bg-gradient-to-r from-felt-green/20 to-transparent border border-neon-green/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neon-green">
                {completedMatches}
              </div>
              <div className="text-sm text-gray-400">Total Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-dollar-green">
                ${totalStakes.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Stakes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {activePlayers}
              </div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">3</div>
              <div className="text-sm text-gray-400">Cities</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400 mb-2">
              Pool. Points. Pride.
            </div>
            <div className="text-xs text-gray-500">
              In here, respect is earned in racks, not words
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
