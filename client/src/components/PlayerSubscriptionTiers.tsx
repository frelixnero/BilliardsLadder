import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, DollarSign, TrendingDown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionTier {
  tier: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  traditionalLeagueCost: number;
  monthlySavings: number;
  yearlySavings: number;
  challengerFee: number;
  perks: string[];
  commissionRate: number;
  description: string;
}

interface SubscriptionTiersData {
  tiers: SubscriptionTier[];
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  tier?: string;
  status?: string;
  commissionRate?: number;
  cancelAtPeriodEnd?: boolean;
  tierInfo?: {
    name: string;
    tier: string;
  };
}

interface PlayerSubscriptionTiersProps {
  userId: string;
  currentUserRole?: string;
}

export function PlayerSubscriptionTiers({ userId, currentUserRole }: PlayerSubscriptionTiersProps) {
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery<SubscriptionTiersData>({
    queryKey: ["/api/player-billing/tiers"],
    enabled: !!userId,
  });

  // Fetch current subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/player-billing/status", userId],
    enabled: !!userId,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ tier, billingPeriod }: { tier: string; billingPeriod: string }) => {
      const response = await fetch("/api/player-billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingPeriod, userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/player-billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel subscription");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player-billing/status", userId] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manage billing portal
  const manageBillingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/player-billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to open billing portal");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Billing Portal Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (tier: string) => {
    subscribeMutation.mutate({ tier, billingPeriod: selectedBilling });
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "rookie": return <Users className="w-6 h-6 text-blue-500" />;
      case "standard": return <Star className="w-6 h-6 text-purple-500" />;
      case "premium": return <Crown className="w-6 h-6 text-yellow-500" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(0);
  };

  if (tiersLoading || statusLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-gray-800">
            <CardHeader className="space-y-4">
              <div className="h-6 bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-700 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const tiers = tiersData?.tiers || [];
  const hasActiveSubscription = subscriptionStatus?.hasSubscription;
  const currentTier = subscriptionStatus?.tier;

  return (
    <div className="space-y-8">
      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setSelectedBilling("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedBilling === "monthly"
                ? "bg-emerald-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
            data-testid="button-monthly-billing"
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedBilling("yearly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedBilling === "yearly"
                ? "bg-emerald-600 text-white"
                : "text-gray-300 hover:text-white"
            }`}
            data-testid="button-yearly-billing"
          >
            Yearly
            <Badge className="ml-2 bg-green-500 text-black">Save up to $149</Badge>
          </button>
        </div>
      </div>

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Card className="bg-emerald-900/20 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Active Subscription
            </CardTitle>
            <CardDescription>
              You're currently subscribed to {subscriptionStatus.tierInfo?.name} tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-300">
                  Commission Rate: {subscriptionStatus?.commissionRate ? (subscriptionStatus.commissionRate / 100) : 0}%
                </p>
                <p className="text-sm text-gray-300">
                  Status: {subscriptionStatus.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => manageBillingMutation.mutate()}
                  disabled={manageBillingMutation.isPending}
                  data-testid="button-manage-billing"
                >
                  Manage Billing
                </Button>
                {!subscriptionStatus.cancelAtPeriodEnd && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isCurrentTier = currentTier === tier.tier;
          const price = selectedBilling === "yearly" ? tier.yearlyPrice : tier.monthlyPrice;
          const savings = selectedBilling === "yearly" ? tier.yearlySavings : tier.monthlySavings;
          const isPopular = tier.tier === "standard";

          return (
            <Card
              key={tier.tier}
              className={`relative ${
                isCurrentTier
                  ? "ring-2 ring-emerald-500 bg-emerald-900/10"
                  : isPopular
                  ? "ring-2 ring-purple-500 bg-purple-900/10"
                  : "bg-gray-900 border-gray-700"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">{getTierIcon(tier.tier)}</div>
                <div>
                  <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {tier.description}
                  </CardDescription>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-white">
                    ${formatPrice(price)}
                    <span className="text-lg text-gray-400">
                      /{selectedBilling === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  
                  {/* Cost Comparison */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <span className="line-through">
                        Traditional leagues: ${formatPrice(tier.traditionalLeagueCost)}/month
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-green-400 font-semibold">
                      <TrendingDown className="w-4 h-4" />
                      Save ${formatPrice(savings)}{selectedBilling === "yearly" ? "/year" : "/month"}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    {tier.commissionRate / 100}% commission rate
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-medium ${tier.challengerFee === 0 ? "text-green-400" : "text-yellow-400"}`}>
                    <DollarSign className="w-4 h-4" />
                    {tier.challengerFee === 0 ? "No challenger fee" : `$${(tier.challengerFee / 100).toFixed(0)} challenger fee per match`}
                  </div>
                </div>

                <div className="space-y-3">
                  {tier.perks.map((perk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{perk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                {isCurrentTier ? (
                  <Button disabled className="w-full" data-testid={`button-current-${tier.tier}`}>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(tier.tier)}
                    disabled={subscribeMutation.isPending}
                    className={`w-full ${
                      isPopular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    data-testid={`button-subscribe-${tier.tier}`}
                  >
                    {subscribeMutation.isPending ? "Processing..." : `Choose ${tier.name}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Value Proposition */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-white">
            Why Choose Action Ladder Over Traditional Leagues?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <TrendingDown className="w-8 h-8 text-green-400 mx-auto" />
              <h3 className="font-semibold text-white">Save Money</h3>
              <p className="text-sm text-gray-300">
                Save $21-$41+ per month compared to traditional $80+ league fees
              </p>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-purple-400 mx-auto" />
              <h3 className="font-semibold text-white">Modern Platform</h3>
              <p className="text-sm text-gray-300">
                Advanced analytics, live streaming, AI coaching, and digital tournaments
              </p>
            </div>
            <div className="space-y-2">
              <Users className="w-8 h-8 text-blue-400 mx-auto" />
              <h3 className="font-semibold text-white">Flexible Competition</h3>
              <p className="text-sm text-gray-300">
                Play when you want, challenge who you want, across multiple skill divisions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}