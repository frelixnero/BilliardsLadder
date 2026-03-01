import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { SafeText, SafeHeading } from "@/components/SafeText";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, TrendingUp, PieChart, BarChart3, CreditCard } from "lucide-react";

interface StakeholderEarnings {
  actionLadderTotal: number;
  operatorTotal: number;
  bonusFundTotal: number;
  playerWinnings: number;
  monthlyGrowth: number;
}

interface CommissionBreakdown {
  originalAmount: number;
  commissionRate: number;
  calculatedCommission: number;
  roundedCommission: number;
  actionLadderShare: number;
  operatorShare: number;
  bonusFundShare: number;
  prizePool: number;
}

interface MembershipTier {
  name: string;
  price: number;
  commissionRate: number;
  perks: string[];
  description: string;
}

export default function MonetizationDashboard() {
  // Mock user role - in production this would come from your auth system
  // For demo: "OWNER", "TRUSTEE", "OPERATOR", "PLAYER"
  const mockUser = { globalRole: "OWNER" }; // Change this to test different roles

  const [earnings, setEarnings] = useState<StakeholderEarnings>({
    actionLadderTotal: 0,
    operatorTotal: 0,
    bonusFundTotal: 0,
    playerWinnings: 0,
    monthlyGrowth: 0
  });
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);

  // Commission Calculator
  const [commissionAmount, setCommissionAmount] = useState(100);
  const [commissionTier, setCommissionTier] = useState("none");
  const [commission, setCommission] = useState<CommissionBreakdown | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load membership tiers
      const tierResponse = await fetch("/api/pricing/tiers");
      const tierData = await tierResponse.json();
      setTiers(tierData.tiers || []);

      // NEW PLAYER-FRIENDLY DISTRIBUTION MODEL
      setEarnings({
        actionLadderTotal: 25000, // $250 total: $90 owner + $80 trustee A + $80 trustee B
        operatorTotal: 45000,     // $450 total: 6 operators x $75 each = $4,500
        bonusFundTotal: 100000,   // $1,000+ monthly player bonus fund (35% of commission)
        playerWinnings: 120000,   // $1,200 monthly player winnings from matches
        monthlyGrowth: 18.5
      });

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const calculateCommissionBreakdown = async () => {
    try {
      const response = await fetch("/api/pricing/calculate-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: commissionAmount * 100, // Convert to cents
          membershipTier: commissionTier
        })
      });
      const data = await response.json();
      setCommission(data);
    } catch (error) {
      console.error("Failed to calculate commission:", error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Role-based access control - PRIVACY PROTECTION
  const isOwnerOrTrustee = mockUser?.globalRole === "OWNER" || mockUser?.globalRole === "TRUSTEE";
  const isOperator = mockUser?.globalRole === "OPERATOR";
  const isPlayer = mockUser?.globalRole === "PLAYER";

  // STRICT PRIVACY: Only owner/trustee can see Action Ladder earnings
  const canSeeActionLadderEarnings = isOwnerOrTrustee;
  const canSeeOperatorEarnings = isOwnerOrTrustee || isOperator;
  const canSeeAllData = isOwnerOrTrustee;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <SafeHeading className="text-3xl font-bold text-green-400">
              {canSeeAllData ? "Complete Revenue Dashboard" : "Your Earnings Dashboard"}
            </SafeHeading>
            <SafeText className="text-gray-400 mt-2">
              {canSeeAllData
                ? "Complete financial overview - Owner/Trustee Access"
                : `Financial overview for ${mockUser?.globalRole?.toLowerCase() || 'user'}`}
            </SafeText>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-400 border-green-400">
              Monthly Growth: +{formatPercent(earnings.monthlyGrowth)}
            </Badge>
            {canSeeActionLadderEarnings && (
              <Badge variant="outline" className="text-red-400 border-red-400">
                PRIVATE VIEW
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
              Stakeholder Overview
            </TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=active]:bg-green-600">
              Commission Calculator
            </TabsTrigger>
            <TabsTrigger value="tiers" className="data-[state=active]:bg-green-600">
              Membership Tiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Action Ladder (OWNER + TRUSTEE ONLY) */}
              {canSeeActionLadderEarnings && (
                <Card className="bg-gray-900 border-green-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Action Ladder (50%)
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Platform Revenue - PRIVATE
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(earnings.actionLadderTotal)}
                    </div>
                    <SafeText className="text-sm text-gray-400 mt-2">
                      Owner + Trustee Only
                    </SafeText>
                  </CardContent>
                </Card>
              )}

              {/* Operator Revenue */}
              {canSeeOperatorEarnings && (
                <Card className="bg-gray-900 border-blue-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {isOwnerOrTrustee ? "All Operators (30%)" : "Your Earnings (30%)"}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {isOwnerOrTrustee ? "Pool Hall Partners" : "Your Share"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(earnings.operatorTotal)}
                    </div>
                    <SafeText className="text-sm text-gray-400 mt-2">
                      {isOwnerOrTrustee ? "Total Operator Payouts" : "Your Operator Share"}
                    </SafeText>
                  </CardContent>
                </Card>
              )}

              {/* Bonus Fund */}
              <Card className="bg-gray-900 border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-400 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Bonus Fund (20%)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Community Rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.bonusFundTotal)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Player Incentives
                  </SafeText>
                </CardContent>
              </Card>

              {/* Player Benefits - Always visible */}
              <Card className="bg-gray-900 border-orange-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Player Benefits
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Total Monthly Player Value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(earnings.playerWinnings + earnings.bonusFundTotal)}
                  </div>
                  <SafeText className="text-sm text-gray-400 mt-2">
                    Prize Pools + Bonus Fund
                  </SafeText>
                  <SafeText className="text-xs text-green-400 mt-1">
                    $20-30 cheaper than leagues!
                  </SafeText>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Split Breakdown */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Split Model
                </CardTitle>
                <CardDescription>
                  How every dollar is distributed across stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Only show Action Ladder split to Owner/Trustee */}
                  {canSeeActionLadderEarnings && (
                    <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                      <h4 className="text-green-400 font-semibold">Action Ladder Platform</h4>
                      <p className="text-2xl font-bold text-white">35%</p>
                      <SafeText className="text-sm text-gray-400">
                        Reduced share - more money to players!
                      </SafeText>
                    </div>
                  )}
                  {canSeeOperatorEarnings && (
                    <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                      <h4 className="text-blue-400 font-semibold">Pool Hall Operators</h4>
                      <p className="text-2xl font-bold text-white">30%</p>
                      <SafeText className="text-sm text-gray-400">
                        Venue partnerships, local support
                      </SafeText>
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold">Bonus Pool Fund</h4>
                    <p className="text-2xl font-bold text-white">5-10%</p>
                    <SafeText className="text-sm text-gray-400">
                      King of the Hill, Hill-Hill Chaos, tournaments
                    </SafeText>
                  </div>
                </div>

                {/* Operator Revenue Examples */}
                {canSeeOperatorEarnings && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Operator + Trustee Revenue — 4-Month Season</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                        <h5 className="text-blue-400 font-semibold">15 Players @ $60</h5>
                        <p className="text-sm text-gray-300 mb-2">30 matches/month</p>
                        <p className="text-xl font-bold text-white">$3,600</p>
                        <SafeText className="text-xs text-gray-400">
                          Operator share per 4-month season
                        </SafeText>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                        <h5 className="text-purple-400 font-semibold">30 Players @ $100</h5>
                        <p className="text-sm text-gray-300 mb-2">60 matches/month</p>
                        <p className="text-xl font-bold text-white">$12,000</p>
                        <SafeText className="text-xs text-gray-400">
                          Operator share per 4-month season
                        </SafeText>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                        <h5 className="text-yellow-400 font-semibold">50 Players Mixed</h5>
                        <p className="text-sm text-gray-300 mb-2">100+ matches/month</p>
                        <p className="text-xl font-bold text-white">$17,000</p>
                        <SafeText className="text-xs text-gray-400">
                          Operator share per 4-month season
                        </SafeText>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Challenge Pools Section */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Challenge Pools
                </CardTitle>
                <CardDescription>
                  Lock in before the break - winner takes the pool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold">Individual Pools</h4>
                    <p className="text-sm text-gray-300 mb-2">$5 - $100,000 per side</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">Available Now</span>
                    </div>
                    <SafeText className="text-xs text-gray-400 mt-2">
                      Lock funds before first break, winner takes pool minus service fee
                    </SafeText>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-700/20 border border-gray-500/30">
                    <h4 className="text-gray-400 font-semibold">Team Challenge Pools</h4>
                    <p className="text-sm text-gray-300 mb-2">2-man, 3-man, 5-man teams</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 font-medium">Coming Soon</span>
                    </div>
                    <SafeText className="text-xs text-gray-400 mt-2">
                      Team pools with Pro membership requirements
                    </SafeText>
                  </div>
                </div>

                <div className="p-4 bg-green-900/10 rounded border border-green-500/20">
                  <h5 className="text-green-400 font-semibold mb-2">How Challenge Pools Work</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Players lock credits before match starts</li>
                    <li>• Winner receives pool minus small service fee (5-8.5%)</li>
                    <li>• Disputes must be filed within 12 hours</li>
                    <li>• Auto-resolution after dispute period expires</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-300">
                  <p>Additional monetization features coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Commission Calculator</CardTitle>
                <CardDescription>
                  Calculate revenue splits for any match amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Match Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Player Membership Tier</Label>
                    <Select value={commissionTier} onValueChange={setCommissionTier}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none">Non-Member (10%)</SelectItem>
                        <SelectItem value="rookie">Rookie $50 (10%)</SelectItem>
                        <SelectItem value="standard">Standard $70 (8%)</SelectItem>
                        <SelectItem value="premium">Premium $90 (5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={calculateCommissionBreakdown}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-calculate-commission"
                >
                  Calculate Commission Split
                </Button>

                {commission && (
                  <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Commission Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Prize Pool</p>
                        <p className="text-xl font-bold text-green-400">
                          {formatCurrency(commission.prizePool)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Action Ladder</p>
                        <p className="text-xl font-bold text-blue-400">
                          {formatCurrency(commission.actionLadderShare)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Operator</p>
                        <p className="text-xl font-bold text-purple-400">
                          {formatCurrency(commission.operatorShare)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bonus Fund</p>
                        <p className="text-xl font-bold text-orange-400">
                          {formatCurrency(commission.bonusFundShare)}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-3 bg-gray-600" />
                    <div className="text-sm text-gray-400">
                      <p>Commission Rate: {(commission.commissionRate / 100).toFixed(1)}%</p>
                      <p>Total Commission: {formatCurrency(commission.roundedCommission)} (rounded up)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.name} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(tier.price)}
                        <span className="text-sm font-normal text-gray-400">/month</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Commission: {(tier.commissionRate / 100).toFixed(1)}%
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Perks</h4>
                      <ul className="space-y-1">
                        {tier.perks.map((perk, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <SafeText>{perk.replace(/_/g, ' ')}</SafeText>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}