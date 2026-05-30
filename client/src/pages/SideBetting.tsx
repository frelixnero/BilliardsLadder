import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, History, Plus } from "lucide-react";

interface Wallet {
  userId: string;
  balanceCredits: number;
  balanceLockedCredits: number;
  createdAt: string;
}

interface SidePot {
  id: string;
  matchId?: string;
  creatorId: string;
  sideALabel?: string;
  sideBLabel?: string;
  stakePerSide: number;
  feeBps: number;
  status: string;
  lockCutoffAt?: string;
  description?: string; // Custom challenge description
  customCreatedBy?: string; // Who created this custom challenge
  createdAt: string;
  disputeDeadline?: string;
  disputeStatus?: string;
  autoResolvedAt?: string;
  winningSide?: string;
}

interface SideBet {
  id: string;
  challengePoolId: string;
  userId: string;
  side?: string;
  amount: number;
  status: string;
  fundedAt?: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  userId: string;
  type?: string;
  amount?: number;
  refId?: string;
  metaJson?: string;
  createdAt?: string;
}

export default function ChallengePools() {
  const [userId] = useState("user-123"); // This would come from auth context
  const [topUpAmount, setTopUpAmount] = useState("");
  const [newPotStake, setNewPotStake] = useState("");
  const [sideALabel, setSideALabel] = useState("");
  const [sideBLabel, setSideBLabel] = useState("");
  const [description, setDescription] = useState(""); // Custom challenge description
  const [betType, setBetType] = useState("yes_no");
  const [verificationSource, setVerificationSource] = useState("Official Stream");
  const [showHighStakeWarning, setShowHighStakeWarning] = useState(false);
  const [isDescriptionValid, setIsDescriptionValid] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-resolution check mutation
  const checkAutoResolveMutation = useMutation({
    mutationFn: async () => await apiRequest("/api/side-pots/check-auto-resolve", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Auto-Resolution Check Complete",
        description: `${data.autoResolvedCount} pots auto-resolved after dispute period expired.`,
        variant: "default"
      });
      // Refetch side pots to show updated status
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
    },
    onError: (error) => {
      toast({
        title: "Auto-Resolution Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet", userId],
  });

  // Fetch challenge pools
  const { data: sidePots = [], isLoading: poolsLoading } = useQuery<SidePot[]>({
    queryKey: ["/api/challenge-pools"],
  });

  // Fetch user's entries
  const { data: userBets = [], isLoading: betsLoading } = useQuery<SideBet[]>({
    queryKey: ["/api/challenge-entries/user", userId],
  });

  // Fetch transaction history
  const { data: ledger = [], isLoading: ledgerLoading } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/wallet", userId, "ledger"],
  });

  // Wallet top-up mutation
  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest(`/api/wallet/${userId}/topup`, { method: "POST", body: JSON.stringify({ amount }) });

      // Simulate Stripe payment completion for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      return apiRequest(`/api/wallet/${userId}/topup/complete`, {
        method: "POST",
        body: JSON.stringify({ 
          paymentIntentId: `pi_demo_${Date.now()}`, 
          amount 
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId, "ledger"] });
      toast({
        title: "Wallet Topped Up",
        description: "Credits added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to top up wallet",
        variant: "destructive",
      });
    },
  });

  // Create challenge pool mutation
  const createPotMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/side-pots", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Challenge Pool Created",
        description: "The pool is locked once both sides are in",
      });
      setNewPotStake("");
      setSideALabel("");
      setSideBLabel("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge pool",
        variant: "destructive",
      });
    },
  });

  // Place entry mutation
  const placeBetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/side-bets", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenge-entries/user", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/side-pots"] });
      toast({
        title: "Joined Challenge Pool",
        description: "Your credits are locked until result",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place entry",
        variant: "destructive",
      });
    },
  });

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (amount >= 5) {
      topUpMutation.mutate(amount);
      setTopUpAmount("");
    }
  };

  const validateDescription = (desc: string) => {
    const trimmed = desc.trim();
    return trimmed.length >= 5 && trimmed.length <= 200;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    setIsDescriptionValid(validateDescription(value));
  };

  const handleCreatePot = () => {
    const stake = parseFloat(newPotStake);
    const trimmedDesc = description.trim();

    // Validation
    if (stake < 5) {
      toast({ title: "Error", description: "Minimum challenge is 500 credits ($5)", variant: "destructive" });
      return;
    }

    if (!validateDescription(trimmedDesc)) {
      toast({ title: "Error", description: "Description must be 5-200 characters and objective", variant: "destructive" });
      return;
    }

    if (!sideALabel || !sideBLabel) {
      toast({ title: "Error", description: "Both side labels are required", variant: "destructive" });
      return;
    }

    // Check elite subscription requirement for stakes over $300
    if (stake > 300) {
      toast({ 
        title: "Elite Subscription Required", 
        description: "Stakes over $300 require Elite subscription ($74.99/month). Upgrade to unlock higher stakes.",
        variant: "destructive" 
      });
      return;
    }

    if (stake >= 5 && stake <= 100000 && sideALabel && sideBLabel && validateDescription(trimmedDesc)) {
      // Show warning for high stakes to prevent mistakes
      if (stake >= 1000 && !showHighStakeWarning) {
        setShowHighStakeWarning(true);
        return;
      }

      // Calculate service fee based on total prize pool
      const totalPool = stake * 2;
      const serviceFeePercent = totalPool > 500 ? 5 : 8.5;

      // Calculate lock cutoff (T-5 minutes default)
      const lockCutoffAt = new Date();
      lockCutoffAt.setMinutes(lockCutoffAt.getMinutes() + 5);

      createPotMutation.mutate({
        creatorId: userId,
        sideALabel,
        sideBLabel,
        stakePerSide: stake * 100, // Convert to cents
        description: trimmedDesc,
        betType,
        verificationSource,
        lockCutoffAt: lockCutoffAt.toISOString(),
        status: "open",
      });
      setShowHighStakeWarning(false);
    }
  };

  const confirmHighStake = () => {
    setShowHighStakeWarning(false);
    const stake = parseFloat(newPotStake);
    const trimmedDesc = description.trim();

    // Calculate lock cutoff (T-5 minutes default)
    const lockCutoffAt = new Date();
    lockCutoffAt.setMinutes(lockCutoffAt.getMinutes() + 5);

    createPotMutation.mutate({
      creatorId: userId,
      sideALabel,
      sideBLabel,
      stakePerSide: stake * 100, // Convert to cents
      description: trimmedDesc,
      betType,
      verificationSource,
      lockCutoffAt: lockCutoffAt.toISOString(),
      status: "open",
    });
  };

  const calculateServiceFee = (stakePerSide: number) => {
    const totalPot = stakePerSide * 2;
    return totalPot > 500 ? 5 : 8.5;
  };

  const handlePlaceBet = (challengePoolId: string, side: string, amount: number) => {
    placeBetMutation.mutate({
      challengePoolId,
      userId,
      side,
      amount: amount * 100, // Convert to cents
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (walletLoading || poolsLoading || betsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Challenge Pools</h1>
        <p className="text-green-400">Lock into the challenge pool before the break</p>
      </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallet" data-testid="tab-wallet">
            <Coins className="mr-2 h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="pots" data-testid="tab-side-pots">
            <TrendingUp className="mr-2 h-4 w-4" />
            Challenge Pools
          </TabsTrigger>
          <TabsTrigger value="bets" data-testid="tab-my-bets">My Entries</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card data-testid="wallet-balance-card">
            <CardHeader>
              <CardTitle>Challenge Credits</CardTitle>
              <CardDescription>Your credits for joining match pools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Available Credits</Label>
                  <div className="text-2xl font-bold text-green-400" data-testid="available-credits">
                    {formatCurrency(wallet?.balanceCredits || 0)}
                  </div>
                </div>
                <div>
                  <Label>Credits Locked Until Result</Label>
                  <div className="text-2xl font-bold text-yellow-400" data-testid="locked-credits">
                    {formatCurrency(wallet?.balanceLockedCredits || 0)}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="topup-amount">Top Up Amount ($)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="topup-amount"
                    data-testid="input-topup-amount"
                    type="number"
                    min="5"
                    step="1"
                    placeholder="Minimum $5"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleTopUp}
                    disabled={topUpMutation.isPending || parseFloat(topUpAmount) < 5}
                    data-testid="button-topup"
                  >
                    {topUpMutation.isPending ? "Processing..." : "Top Up"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pots" className="space-y-4">
          <Card data-testid="create-pot-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  <Plus className="mr-2 h-5 w-5 inline" />
                  Create Challenge Pool
                </CardTitle>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => checkAutoResolveMutation.mutate()}
                  disabled={checkAutoResolveMutation.isPending}
                  data-testid="button-check-auto-resolve"
                >
                  {checkAutoResolveMutation.isPending ? "Checking..." : "Check Auto-Resolve"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description" className="flex items-center gap-2">
                  Challenge Description (required)
                  <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="description"
                  data-testid="input-description"
                  className={`w-full border rounded p-2 bg-background text-foreground resize-none ${!isDescriptionValid && description ? 'border-red-500' : ''}`}
                  rows={3}
                  placeholder="e.g., Tyga breaks and runs the first rack, Match goes hill-hill, Player scratches on the 8-ball"
                  value={description}
                  onChange={handleDescriptionChange}
                  maxLength={200}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">
                    Make it objective. If we can't verify, operators will void.
                  </span>
                  <span className={`${!isDescriptionValid && description ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {description.length}/200
                  </span>
                </div>
                {!isDescriptionValid && description && (
                  <p className="text-red-500 text-xs mt-1">Description must be 5-200 characters</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="challenge-type">Challenge Type</Label>
                  <Select value={betType} onValueChange={setBetType} data-testid="select-challenge-type">
                    <SelectTrigger>
                      <SelectValue placeholder="Select challenge type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes_no">Yes / No (Proposition)</SelectItem>
                      <SelectItem value="over_under">Over / Under (Numeric)</SelectItem>
                      <SelectItem value="player_prop">Side A / Side B (Player Event)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="verification-source">Verification Source</Label>
                  <Select value={verificationSource} onValueChange={setVerificationSource} data-testid="select-verification-source">
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Official Stream">Official Stream</SelectItem>
                      <SelectItem value="Table Referee">Table Referee</SelectItem>
                      <SelectItem value="Score App Screenshot">Score App Screenshot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="side-a-label">
                    {betType === 'yes_no' ? 'Yes Label' : 
                     betType === 'over_under' ? 'Over Label' : 'Side A Label'}
                  </Label>
                  <Input
                    id="side-a-label"
                    data-testid="input-side-a-label"
                    placeholder={betType === 'yes_no' ? 'Yes' : 
                               betType === 'over_under' ? 'Over' : 'Player 1'}
                    value={sideALabel}
                    onChange={(e) => setSideALabel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="side-b-label">
                    {betType === 'yes_no' ? 'No Label' : 
                     betType === 'over_under' ? 'Under Label' : 'Side B Label'}
                  </Label>
                  <Input
                    id="side-b-label"
                    data-testid="input-side-b-label"
                    placeholder={betType === 'yes_no' ? 'No' : 
                               betType === 'over_under' ? 'Under' : 'Player 2'}
                    value={sideBLabel}
                    onChange={(e) => setSideBLabel(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stake-amount">
                  Challenge Credits Per Side (500 - 30,000)
                  <span className="text-amber-400 text-xs ml-2">
                    Stakes over $300 require Elite subscription
                  </span>
                </Label>

                {/* Preset Amount Buttons */}
                <div className="flex gap-2 mt-2 mb-3 flex-wrap">
                  {[25, 50, 100, 250, 300].map(amount => (
                    <Button 
                      key={amount}
                      variant="outline" 
                      size="sm"
                      onClick={() => setNewPotStake(amount.toString())}
                      data-testid={`preset-${amount}`}
                      className={amount > 300 ? "border-amber-500 text-amber-400" : ""}
                    >
                      ${amount}
                      {amount > 300 && <span className="ml-1 text-xs">*</span>}
                    </Button>
                  ))}
                </div>

                {newPotStake && parseFloat(newPotStake) >= 5 && (
                  <div className={`text-sm p-3 rounded border mb-3 ${parseFloat(newPotStake) > 300 ? 'bg-amber-900/30 border-amber-600' : 'bg-muted/30'}`}>
                    <div className={`font-medium mb-1 ${parseFloat(newPotStake) > 300 ? 'text-amber-400' : 'text-green-600'}`}>
                      {parseFloat(newPotStake) > 300 ? 'Elite Required - Challenge Pool Summary:' : 'Challenge Pool Summary:'}
                    </div>
                    {parseFloat(newPotStake) > 300 && (
                      <div className="text-amber-300 text-xs mb-2 p-2 bg-amber-900/50 rounded">
                        ⚡ Stakes over $300 require Elite subscription ($74.99/month)
                        <button 
                          className="ml-2 text-amber-400 underline hover:text-amber-300"
                          onClick={() => {
                            // TODO: Navigate to elite subscription page
                            toast({ title: "Elite Upgrade", description: "Redirecting to Elite subscription..." });
                          }}
                        >
                          Upgrade Now
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Each side puts up: <span className="font-mono">${parseFloat(newPotStake).toLocaleString()}</span></div>
                      <div>Total prize pool: <span className="font-mono">${(parseFloat(newPotStake) * 2).toLocaleString()}</span></div>
                      <div>Service fee: <span className="font-mono">{calculateServiceFee(parseFloat(newPotStake))}%</span></div>
                      <div className="text-green-600 font-semibold">Winner receives the prize pool minus service fee: <span className="font-mono">${((parseFloat(newPotStake) * 2) * (1 - calculateServiceFee(parseFloat(newPotStake)) / 100)).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    id="stake-amount"
                    data-testid="input-stake-amount"
                    type="number"
                    min="5"
                    max="30000"
                    step="1"
                    placeholder="Custom amount (max $300 without Elite)"
                    value={newPotStake}
                    onChange={(e) => setNewPotStake(e.target.value)}
                    className={parseFloat(newPotStake || "0") > 300 ? "border-amber-500" : ""}
                  />
                  <Button 
                    onClick={handleCreatePot}
                    disabled={createPotMutation.isPending || !sideALabel || !sideBLabel || !newPotStake || parseFloat(newPotStake) < 5 || parseFloat(newPotStake) > 30000 || !validateDescription(description.trim())}
                    data-testid="button-create-pool"
                  >
                    {createPotMutation.isPending ? "Creating..." : "Lock Into Challenge Pool"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {sidePots.map((pot) => (
              <Card key={pot.id} data-testid={`challenge-pool-${pot.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {pot.sideALabel} vs {pot.sideBLabel}
                      </CardTitle>
                      <CardDescription>
                        Each side puts up {formatCurrency(pot.stakePerSide)} • Winner receives the challenge pool minus service fee ({(pot.feeBps / 100).toFixed(1)}%)
                      </CardDescription>

                      {/* Dispute Period Indicator */}
                      {pot.status === "resolved" && pot.disputeDeadline && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-600 dark:text-yellow-400">⏰</span>
                            <span className="font-medium">Dispute Period Active</span>
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Expires: {new Date(pot.disputeDeadline).toLocaleString()}
                          </div>
                          {pot.disputeStatus === "pending" && (
                            <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                              ⚠️ Dispute Filed - Payouts on Hold
                            </div>
                          )}
                        </div>
                      )}

                      {/* Auto-Resolution Indicator */}
                      {pot.autoResolvedAt && (
                        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 dark:text-green-400">✅</span>
                            <span className="font-medium">Auto-Resolved</span>
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Completed: {new Date(pot.autoResolvedAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={pot.status === "open" ? "default" : pot.status === "resolved" ? "destructive" : "secondary"}
                      data-testid={`pot-status-${pot.id}`}
                    >
                      {pot.status === "open" ? "Coming Soon" : pot.status === "resolved" ? "Resolved" : "Locked"}
                      {pot.winningSide && ` (${pot.winningSide} wins)`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {pot.description && (
                    <div className="mb-4 p-3 bg-muted/30 rounded border-l-4 border-l-green-500">
                      <p className="text-sm text-muted-foreground italic" data-testid={`pot-description-${pot.id}`}>
                        "{pot.description}"
                      </p>
                    </div>
                  )}
                  {pot.status === "open" && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handlePlaceBet(pot.id, "A", pot.stakePerSide / 100)}
                        disabled={placeBetMutation.isPending}
                        data-testid={`button-bet-side-a-${pot.id}`}
                      >
                        {pot.sideALabel} - {formatCurrency(pot.stakePerSide)}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePlaceBet(pot.id, "B", pot.stakePerSide / 100)}
                        disabled={placeBetMutation.isPending}
                        data-testid={`button-bet-side-b-${pot.id}`}
                      >
                        {pot.sideBLabel} - {formatCurrency(pot.stakePerSide)}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bets" className="space-y-4">
          <Card data-testid="my-bets-card">
            <CardHeader>
              <CardTitle>My Pool Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {userBets.length === 0 ? (
                <p className="text-muted-foreground" data-testid="no-bets-message">No pool entries</p>
              ) : (
                <div className="space-y-2">
                  {userBets.map((bet) => (
                    <div 
                      key={bet.id} 
                      className="flex justify-between items-center p-3 border rounded"
                      data-testid={`bet-${bet.id}`}
                    >
                      <div>
                        <div className="font-medium">Side {bet.side}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(bet.amount)}
                        </div>
                      </div>
                      <Badge variant={bet.status === "funded" ? "default" : "secondary"} data-testid={`bet-status-${bet.id}`}>
                        {bet.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card data-testid="transaction-history-card">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <p>Loading transactions...</p>
              ) : ledger.length === 0 ? (
                <p className="text-muted-foreground" data-testid="no-transactions-message">No transactions</p>
              ) : (
                <div className="space-y-2">
                  {ledger.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex justify-between items-center p-3 border rounded"
                      data-testid={`transaction-${entry.id}`}
                    >
                      <div>
                        <div className="font-medium">{entry.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.createdAt && new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-bold ${(entry.amount || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(entry.amount || 0) > 0 ? '+' : ''}{formatCurrency(entry.amount || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* High Stake Confirmation Dialog */}
      <AlertDialog open={showHighStakeWarning} onOpenChange={setShowHighStakeWarning}>
        <AlertDialogContent data-testid="high-stake-warning">
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ High Stakes Warning</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You're about to create a pool with <strong className="text-yellow-600">${parseFloat(newPotStake || "0").toLocaleString()}</strong> per side.</p>
              <p className="text-sm text-muted-foreground">
                Total pool: <span className="font-mono">${(parseFloat(newPotStake || "0") * 2).toLocaleString()}</span><br/>
                Winner receives: <span className="font-mono text-green-600">${((parseFloat(newPotStake || "0") * 2) * (1 - calculateServiceFee(parseFloat(newPotStake || "0")) / 100)).toLocaleString()}</span>
              </p>
              <p className="text-red-600 font-medium">⚡ Once created, this cannot be canceled!</p>
              <p className="text-sm">Disputes must be filed within 12 hours or the winner automatically takes the pool.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-high-stake">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmHighStake}
              data-testid="confirm-high-stake"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create ${parseFloat(newPotStake || "0").toLocaleString()} Pool
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}