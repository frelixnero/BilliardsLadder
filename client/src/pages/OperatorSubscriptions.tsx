import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  Check,
  Crown,
  Layers,
  Rocket,
  Shield,
  Star,
  Users,
  Zap
} from "lucide-react";

interface HallTier {
  key: string;
  name: string;
  price: number;
  playerLimit: string;
  description: string;
  icon: typeof Building2;
  color: string;
  ringColor: string;
  bgColor: string;
  btnColor: string;
  btnHover: string;
  borderColor: string;
  hoverBorderColor: string;
  hoverShadow: string;
  priceId: string;
  perks: string[];
}

const HALL_TIERS: HallTier[] = [
  {
    key: "small",
    name: "Small Hall",
    price: 199,
    playerLimit: "Up to 15 players",
    description: "Perfect for neighborhood pool halls just getting started",
    icon: Building2,
    color: "text-green-400",
    ringColor: "ring-green-500",
    bgColor: "bg-green-900/10",
    btnColor: "bg-green-600",
    btnHover: "hover:bg-green-700",
    borderColor: "rgba(74,222,128,0.35)",
    hoverBorderColor: "rgba(74,222,128,0.8)",
    hoverShadow: "0 10px 30px -5px rgba(34,197,94,0.3)",
    priceId: "price_1THmiLDvTG8XWAaKhXE4JvZq",
    perks: [
      "Up to 15 active players",
      "Full ladder management system",
      "Basic analytics dashboard",
      "Email + chat support",
      "QR registration system",
    ],
  },
  {
    key: "medium",
    name: "Medium Hall",
    price: 299,
    playerLimit: "Up to 25 players",
    description: "Growing halls with regular crowds and weekly events",
    icon: Star,
    color: "text-blue-400",
    ringColor: "ring-blue-500",
    bgColor: "bg-blue-900/10",
    btnColor: "bg-blue-600",
    btnHover: "hover:bg-blue-700",
    borderColor: "rgba(96,165,250,0.35)",
    hoverBorderColor: "rgba(96,165,250,0.8)",
    hoverShadow: "0 10px 30px -5px rgba(59,130,246,0.3)",
    priceId: "price_1THmiPDvTG8XWAaKkeveuEqq",
    perks: [
      "Up to 25 active players",
      "Full ladder management system",
      "Advanced analytics",
      "Priority support",
      "Tournament hosting tools",
      "Custom poster generator",
    ],
  },
  {
    key: "large",
    name: "Large Hall",
    price: 399,
    playerLimit: "Up to 40 players",
    description: "Established venues with a big competitive player base",
    icon: Crown,
    color: "text-purple-400",
    ringColor: "ring-purple-500",
    bgColor: "bg-purple-900/10",
    btnColor: "bg-purple-600",
    btnHover: "hover:bg-purple-700",
    borderColor: "rgba(192,132,252,0.35)",
    hoverBorderColor: "rgba(192,132,252,0.8)",
    hoverShadow: "0 10px 30px -5px rgba(168,85,247,0.3)",
    priceId: "price_1THmiRDvTG8XWAaK39Gg3Nb9",
    perks: [
      "Up to 40 active players",
      "Full ladder management system",
      "Advanced analytics + ROI reports",
      "Priority support + training",
      "Free tournament entry for members",
      "Live streaming integration",
      "Multiple ladder divisions",
    ],
  },
  {
    key: "mega",
    name: "Mega Hall",
    price: 799,
    playerLimit: "41+ players (unlimited)",
    description: "Major venues, multi-location operations, and tournament centers",
    icon: Rocket,
    color: "text-yellow-400",
    ringColor: "ring-yellow-500",
    bgColor: "bg-yellow-900/10",
    btnColor: "bg-yellow-600",
    btnHover: "hover:bg-yellow-700",
    borderColor: "rgba(250,204,21,0.35)",
    hoverBorderColor: "rgba(250,204,21,0.8)",
    hoverShadow: "0 10px 30px -5px rgba(234,179,8,0.3)",
    priceId: "price_1THmiUDvTG8XWAaKa43Y9Bm9",
    perks: [
      "Unlimited active players",
      "Multi-hall dashboard",
      "White-label branding options",
      "Dedicated account representative",
      "Free tournament entry for all members",
      "Live streaming integration",
      "Unlimited ladder divisions",
      "AI coaching access for players",
      "Revenue share optimization tools",
    ],
  },
];

const ADDON_ITEMS = [
  { label: "Extra Ladder / Division", price: "$100/mo", description: "Add additional competitive divisions beyond what your tier includes" },
  { label: "Rookie Module", price: "$50/mo", description: "Onboarding system for new players with guided matchmaking" },
  { label: "Rookie Pass (per pass)", price: "$15/mo", description: "Individual passes for rookies to join ladders at a discount" },
  { label: "Extra Players (per player)", price: "$8/mo", description: "Add players beyond your tier limit individually" },
  { label: "Extra Player Bundle (10 pack)", price: "$50/mo", description: "Bulk discount — add 10 extra players at a reduced rate" },
];

export default function OperatorSubscriptions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: currentSubscription } = useQuery<{
    hasSubscription: boolean;
    tier?: string;
    status?: string;
    hallName?: string;
  }>({
    queryKey: ["/api/operator-subscriptions", user?.id],
    queryFn: async () => {
      try {
        const sub = await apiRequest(`/api/operator-subscriptions/${user?.id}`);
        if (sub && (sub as any).id) {
          return { hasSubscription: true, tier: (sub as any).tier, status: (sub as any).status, hallName: (sub as any).hallName };
        }
        return { hasSubscription: false };
      } catch {
        return { hasSubscription: false };
      }
    },
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: (tierKey: string) => {
      const tier = HALL_TIERS.find(t => t.key === tierKey);
      if (!tier) throw new Error("Invalid tier");
      return apiRequest("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          priceIds: [tier.priceId],
          mode: "subscription",
          userId: user?.id,
          metadata: {
            hallId: user?.id,
            operatorId: user?.id,
            tier: tier.key,
            productType: "operator_subscription",
          },
        }),
      });
    },
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Subscription Created",
          description: "Your operator subscription has been set up",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/operator-subscriptions"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const currentTierKey = currentSubscription?.tier || null;
  const hasActive = currentSubscription?.hasSubscription && currentSubscription?.status === "active";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent mb-3" data-testid="text-operator-subscriptions-title">
          Operator Hall Plans
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Choose the plan that fits your venue. Every tier includes full ladder management, player rankings, and the tools to run competitive billiards.
        </p>
      </div>

      {hasActive && currentTierKey && (
        <Card className="mb-8 ring-2 ring-emerald-500 bg-emerald-900/10 border-emerald-700/50" data-testid="card-current-operator-plan">
          <CardContent className="py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-emerald-400" />
                <div>
                  <span className="text-emerald-400 font-semibold text-lg">
                    Current Plan: {HALL_TIERS.find(t => t.key === currentTierKey)?.name || currentTierKey}
                  </span>
                  {currentSubscription?.hallName && (
                    <p className="text-gray-400 text-sm">{currentSubscription.hallName}</p>
                  )}
                </div>
                <Badge className="bg-emerald-600 ml-2">Active</Badge>
              </div>
              <Button
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30"
                onClick={() => window.location.href = "/app?tab=checkout"}
                data-testid="button-manage-operator-billing"
              >
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {HALL_TIERS.map((tier) => {
          const isCurrentTier = hasActive && currentTierKey === tier.key;
          const TierIcon = tier.icon;

          return (
            <TierCard key={tier.key} tier={tier} isCurrentTier={isCurrentTier}>
              <CardHeader className="text-center space-y-3 pb-2">
                <div className="flex justify-center">
                  <div className={`p-3 rounded-full ${tier.bgColor}`}>
                    <TierIcon className={`h-8 w-8 ${tier.color}`} />
                  </div>
                </div>
                <div>
                  <CardTitle className={`text-2xl ${tier.color}`}>{tier.name}</CardTitle>
                  <CardDescription className="text-gray-400 mt-1">
                    {tier.description}
                  </CardDescription>
                </div>
                <div className="pt-2">
                  <div className="text-4xl font-bold text-white">
                    ${tier.price}
                    <span className="text-lg text-gray-400">/mo</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{tier.playerLimit}</div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-2">
                <Separator className="bg-gray-700 mb-4" />
                <div className="space-y-3">
                  {tier.perks.map((perk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                      <span className="text-sm text-gray-300">{perk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                {isCurrentTier ? (
                  <Button disabled className="w-full" data-testid={`button-current-${tier.key}`}>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => checkoutMutation.mutate(tier.key)}
                    disabled={checkoutMutation.isPending}
                    className={`w-full ${tier.btnColor} ${tier.btnHover}`}
                    data-testid={`button-choose-${tier.key}`}
                  >
                    {checkoutMutation.isPending ? "Processing..." : `Choose ${tier.name}`}
                  </Button>
                )}
              </CardFooter>
            </TierCard>
          );
        })}
      </div>

      <Card className="mb-8 bg-gray-900/50 border-gray-700" data-testid="card-addons-section">
        <CardHeader>
          <CardTitle className="text-xl text-green-400 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Available Add-Ons
          </CardTitle>
          <CardDescription>
            Enhance any plan with additional features and capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADDON_ITEMS.map((addon, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white text-sm">{addon.label}</span>
                  <Badge variant="outline" className="text-green-400 border-green-500/50">{addon.price}</Badge>
                </div>
                <p className="text-xs text-gray-400">{addon.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-white">
            Why Run Your Hall on BilliardsLadder?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Users className="w-8 h-8 text-green-400 mx-auto" />
              <h3 className="font-semibold text-white">Grow Your Player Base</h3>
              <p className="text-sm text-gray-300">
                Automated rankings, matchmaking, and challenges keep players coming back every week
              </p>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-blue-400 mx-auto" />
              <h3 className="font-semibold text-white">Streamline Operations</h3>
              <p className="text-sm text-gray-300">
                QR registration, digital scorecards, and automated tournament brackets save hours of manual work
              </p>
            </div>
            <div className="space-y-2">
              <Crown className="w-8 h-8 text-yellow-400 mx-auto" />
              <h3 className="font-semibold text-white">Increase Revenue</h3>
              <p className="text-sm text-gray-300">
                Player subscriptions, tournament entry fees, and bounty systems create new income streams
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TierCard({ tier, isCurrentTier, children }: { tier: HallTier; isCurrentTier: boolean; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-xl transition-all duration-300 ease-out"
      style={{
        border: `1px solid ${isHovered ? tier.hoverBorderColor : isCurrentTier ? "rgba(16,185,129,0.6)" : tier.borderColor}`,
        boxShadow: isHovered ? tier.hoverShadow : "none",
        transform: isHovered ? "scale(1.03)" : "scale(1)",
        background: isCurrentTier ? "rgba(16,185,129,0.05)" : "rgb(17,24,39)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-tier-${tier.key}`}
    >
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-emerald-500 text-white px-3">Current Plan</Badge>
        </div>
      )}
      {children}
    </div>
  );
}