import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import HallBattlesAdmin from "@/components/hall-battles-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, DollarSign, Shield, TrendingUp, Trophy, Settings, Gift, Ban, ShieldOff, ShieldCheck, MessageSquare, Check, X } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  globalRole: string;
  payoutShareBps?: number;
  onboardingComplete: boolean;
  stripeConnectId?: string;
}

interface PayoutTransfer {
  id: string;
  invoiceId: string;
  stripeTransferId: string;
  amount: number;
  shareType: string;
  recipientName?: string;
  recipientEmail?: string;
  createdAt: string;
}

interface OperatorSettings {
  id: string;
  operatorUserId: string;
  cityName: string;
  areaName: string;
  customBranding?: string;
  hasFreeMonths: boolean;
  freeMonthsCount: number;
  freeMonthsGrantedBy?: string;
  freeMonthsGrantedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name?: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [shareBps, setShareBps] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get staff members
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ["/api/admin/staff"],
    enabled: true
  });

  // Get payout history
  const { data: payoutsData, isLoading: loadingPayouts } = useQuery({
    queryKey: ["/api/admin/payouts"],
    enabled: true
  });

  // Get organizations
  const { data: orgData, isLoading: loadingOrgs } = useQuery({
    queryKey: ["/api/admin/organizations"],
    enabled: true
  });

  // Get operator settings
  const { data: operatorsData, isLoading: loadingOperators } = useQuery({
    queryKey: ["/api/admin/operators"],
    enabled: true
  });

  // Invite staff mutation
  const inviteStaffMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; shareBps: number }) => {
      const response = await apiRequest("POST", "/api/admin/staff/invite", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Staff Invited Successfully",
        description: `Onboarding link generated. Share this with ${inviteEmail}: ${data.onboardingUrl}`,
      });
      setInviteEmail("");
      setInviteName("");
      setShareBps("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update share mutation
  const updateShareMutation = useMutation({
    mutationFn: async (data: { userId: string; shareBps: number }) => {
      const response = await apiRequest("POST", "/api/admin/staff/share", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Share Updated",
        description: "Payout percentage updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle free months mutation
  const toggleFreeMonthsMutation = useMutation({
    mutationFn: async (data: { operatorUserId: string; hasFreeMonths: boolean; freeMonthsCount?: number }) => {
      const response = await apiRequest("POST", `/api/admin/operators/${data.operatorUserId}/free-months`, {
        hasFreeMonths: data.hasFreeMonths,
        freeMonthsCount: data.freeMonthsCount
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Free Months Updated",
        description: "Operator free months status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInviteStaff = () => {
    if (!inviteEmail || !shareBps) {
      toast({
        title: "Missing Information",
        description: "Please provide email and share percentage",
        variant: "destructive",
      });
      return;
    }

    const shareBpsNum = Number(shareBps);
    if (shareBpsNum <= 0 || shareBpsNum > 10000) {
      toast({
        title: "Invalid Share",
        description: "Share must be between 0.01% and 100%",
        variant: "destructive",
      });
      return;
    }

    inviteStaffMutation.mutate({
      email: inviteEmail,
      name: inviteName,
      shareBps: shareBpsNum,
    });
  };

  const staff: User[] = (staffData as any)?.staff || [];
  const transfers: PayoutTransfer[] = (payoutsData as any)?.transfers || [];
  const organizations: any[] = (orgData as any)?.organizations || [];
  const operators: OperatorSettings[] = (operatorsData as any) || [];

  // Calculate total payouts by user
  const payoutsByUser = transfers.reduce((acc: any, transfer: PayoutTransfer) => {
    if (!acc[transfer.recipientEmail || "Unknown"]) {
      acc[transfer.recipientEmail || "Unknown"] = 0;
    }
    acc[transfer.recipientEmail || "Unknown"] += transfer.amount;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Admin Dashboard</h1>
        <p className="text-gray-300">Manage staff and automatic revenue splitting</p>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 bg-black/40">
          <TabsTrigger value="staff" className="data-[state=active]:bg-green-600">
            <Users className="w-4 h-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="user-management" className="data-[state=active]:bg-green-600" data-testid="tab-user-management">
            <Ban className="w-4 h-4 mr-2" />
            Users & Bans
          </TabsTrigger>
          <TabsTrigger value="appeals" className="data-[state=active]:bg-green-600" data-testid="tab-appeals">
            <MessageSquare className="w-4 h-4 mr-2" />
            Appeals
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-green-600">
            <Shield className="w-4 h-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="hall-battles" className="data-[state=active]:bg-green-600">
            <Trophy className="w-4 h-4 mr-2" />
            Hall Battles
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-green-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="operators" className="data-[state=active]:bg-green-600">
            <Settings className="w-4 h-4 mr-2" />
            Operators
          </TabsTrigger>
          <TabsTrigger value="free-months" className="data-[state=active]:bg-green-600">
            <Gift className="w-4 h-4 mr-2" />
            Free Months
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          {/* Invite Staff Card */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Invite Trusted Staff
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add trusted friends to receive automatic revenue splits from all payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-invite-email"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-name">Name (Optional)</Label>
                  <Input
                    id="invite-name"
                    placeholder="Friend's Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-invite-name"
                  />
                </div>
                <div>
                  <Label htmlFor="share-bps">Share % (e.g. 3000 = 30%)</Label>
                  <Input
                    id="share-bps"
                    type="number"
                    placeholder="3000"
                    value={shareBps}
                    onChange={(e) => setShareBps(e.target.value)}
                    className="bg-black/40 border-green-600/50"
                    data-testid="input-share-bps"
                  />
                </div>
              </div>
              <Button
                onClick={handleInviteStaff}
                disabled={inviteStaffMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-black font-semibold"
                data-testid="button-invite-staff"
              >
                {inviteStaffMutation.isPending ? "Sending..." : "Invite & Generate Onboarding Link"}
              </Button>
            </CardContent>
          </Card>

          {/* Current Staff */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Current Staff</CardTitle>
              <CardDescription className="text-gray-300">
                Your trusted team members receiving automatic payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <p className="text-gray-400">Loading staff...</p>
              ) : staff.length === 0 ? (
                <p className="text-gray-400">No staff members yet. Invite your trusted friends above.</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member: User) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-green-600/20"
                      data-testid={`staff-member-${member.id}`}
                    >
                      <div>
                        <div className="font-semibold text-green-400">
                          {member.name || member.email}
                        </div>
                        <div className="text-sm text-gray-400">{member.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={member.globalRole === "OWNER" ? "default" : "secondary"}
                            className={
                              member.globalRole === "OWNER"
                                ? "bg-yellow-600 text-black"
                                : "bg-green-600 text-black"
                            }
                          >
                            {member.globalRole}
                          </Badge>
                          <Badge
                            variant={member.onboardingComplete ? "default" : "destructive"}
                            className={
                              member.onboardingComplete
                                ? "bg-green-600 text-black"
                                : "bg-red-600 text-white"
                            }
                          >
                            {member.onboardingComplete ? "Verified" : "Pending Verification"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {((member.payoutShareBps || 0) / 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Share</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-management" className="space-y-6">
          <UserManagementPanel />
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <AppealsPanel />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Organization Management</CardTitle>
              <CardDescription className="text-gray-300">
                Manage customer subscriptions and seat allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrgs ? (
                <p className="text-gray-400">Loading organizations...</p>
              ) : organizations.length === 0 ? (
                <p className="text-gray-400">No organizations found.</p>
              ) : (
                <div className="space-y-4">
                  {organizations.map((org: any) => (
                    <OrganizationCard key={org.id} organization={org} onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
                    }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hall-battles" className="space-y-6">
          <HallBattlesAdmin />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Payout History</CardTitle>
              <CardDescription className="text-gray-300">
                Automatic revenue splits from all subscription payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayouts ? (
                <p className="text-gray-400">Loading payouts...</p>
              ) : transfers.length === 0 ? (
                <p className="text-gray-400">No payouts yet. Payouts happen automatically when customers pay.</p>
              ) : (
                <div className="space-y-4">
                  {transfers.slice(0, 10).map((transfer: PayoutTransfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-green-600/20"
                      data-testid={`payout-${transfer.id}`}
                    >
                      <div>
                        <div className="font-semibold text-green-400">
                          {transfer.recipientName || transfer.recipientEmail}
                        </div>
                        <div className="text-sm text-gray-400">
                          Invoice: {transfer.invoiceId}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          ${(transfer.amount / 100).toFixed(2)}
                        </div>
                        <Badge className="bg-green-600 text-black">
                          {transfer.shareType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-total-staff">
                  {staff.length}
                </div>
                <p className="text-xs text-gray-400">
                  Active revenue-sharing partners
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Payouts</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-total-payouts">
                  ${(transfers.reduce((sum: number, t: PayoutTransfer) => sum + t.amount, 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-gray-400">
                  All-time automatic payouts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-600/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Revenue Share</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400" data-testid="text-revenue-share">
                  {((staff.reduce((sum: number, s: User) => sum + (s.payoutShareBps || 0), 0)) / 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-400">
                  Total allocated to staff
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Split Breakdown */}
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400">Revenue Split Configuration</CardTitle>
              <CardDescription className="text-gray-300">
                Current automatic payout allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((member: User) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 border-b border-green-600/20 last:border-b-0"
                  >
                    <span className="text-gray-300">
                      {member.name || member.email} ({member.globalRole})
                    </span>
                    <span className="font-semibold text-green-400">
                      {((member.payoutShareBps || 0) / 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-green-600/40">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-green-400">Platform Keeps</span>
                    <span className="text-green-400">
                      {(100 - (staff.reduce((sum: number, s: User) => sum + (s.payoutShareBps || 0), 0) / 100)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Operator Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                View and manage all operators in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOperators ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading operators...</p>
                </div>
              ) : operators.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No operators found</p>
              ) : (
                <div className="space-y-4">
                  {operators.map((operator) => (
                    <div key={operator.id} className="bg-black/40 rounded-lg p-4 border border-green-600/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-green-400 font-semibold">
                            {operator.user?.name || operator.user?.email || "Unknown Operator"}
                          </h3>
                          <p className="text-gray-400 text-sm">{operator.user?.email}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p><span className="text-gray-400">City:</span> <span className="text-green-400">{operator.cityName}</span></p>
                            <p><span className="text-gray-400">Area:</span> <span className="text-green-400">{operator.areaName}</span></p>
                            {operator.customBranding && (
                              <p><span className="text-gray-400">Custom Branding:</span> <span className="text-green-400">{operator.customBranding}</span></p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={operator.hasFreeMonths ? "default" : "secondary"}
                            className={operator.hasFreeMonths ? "bg-green-600 text-black" : "bg-gray-600 text-white"}
                          >
                            {operator.hasFreeMonths ? `${operator.freeMonthsCount} Free Months` : "No Free Months"}
                          </Badge>
                          {operator.hasFreeMonths && operator.freeMonthsGrantedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Granted: {new Date(operator.freeMonthsGrantedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Free Months Management Tab */}
        <TabsContent value="free-months" className="space-y-6">
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Free Months Management
              </CardTitle>
              <CardDescription className="text-gray-300">
                Grant or revoke free months for operators (Trustee Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOperators ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading operators...</p>
                </div>
              ) : operators.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No operators found</p>
              ) : (
                <div className="space-y-4">
                  {operators.map((operator) => (
                    <div key={operator.id} className="bg-black/40 rounded-lg p-4 border border-green-600/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-green-400 font-semibold">
                            {operator.user?.name || operator.user?.email || "Unknown Operator"}
                          </h3>
                          <p className="text-gray-400 text-sm">{operator.user?.email}</p>
                          <p className="text-gray-400 text-sm">{operator.cityName}, {operator.areaName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge 
                              variant={operator.hasFreeMonths ? "default" : "secondary"}
                              className={operator.hasFreeMonths ? "bg-green-600 text-black" : "bg-gray-600 text-white"}
                            >
                              {operator.hasFreeMonths ? `${operator.freeMonthsCount} Free Months` : "No Free Months"}
                            </Badge>
                            {operator.hasFreeMonths && operator.freeMonthsGrantedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Granted: {new Date(operator.freeMonthsGrantedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!operator.hasFreeMonths ? (
                              <Button
                                onClick={() => toggleFreeMonthsMutation.mutate({
                                  operatorUserId: operator.operatorUserId,
                                  hasFreeMonths: true,
                                  freeMonthsCount: 1
                                })}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-black font-semibold"
                                disabled={toggleFreeMonthsMutation.isPending}
                                data-testid={`button-grant-free-months-${operator.operatorUserId}`}
                              >
                                Grant 1 Month
                              </Button>
                            ) : (
                              <Button
                                onClick={() => toggleFreeMonthsMutation.mutate({
                                  operatorUserId: operator.operatorUserId,
                                  hasFreeMonths: false
                                })}
                                size="sm"
                                variant="destructive"
                                disabled={toggleFreeMonthsMutation.isPending}
                                data-testid={`button-revoke-free-months-${operator.operatorUserId}`}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Organization card component for seat management
function OrganizationCard({ organization, onUpdate }: { organization: any; onUpdate: () => void }) {
  const [newQuantity, setNewQuantity] = useState(organization.seatLimit?.toString() || "1");
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const { toast } = useToast();

  // Load subscription details
  useEffect(() => {
    const loadSubscription = async () => {
      if (!organization.stripeSubscriptionId) return;
      
      setLoadingSubscription(true);
      try {
        const response = await apiRequest("GET", `/api/admin/organizations/${organization.id}/subscription`);
        const data = await response.json();
        if (data.status === "active") {
          setSubscription(data.subscription);
          setNewQuantity(data.subscription.quantity?.toString() || "1");
        }
      } catch (error) {
        console.error("Failed to load subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, [organization.id, organization.stripeSubscriptionId]);

  const updateSeats = async () => {
    const quantity = Number(newQuantity);
    if (quantity < 1 || isNaN(quantity)) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid number of seats (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", `/api/admin/organizations/${organization.id}/seats`, {
        quantity
      });
      const result = await response.json();
      
      toast({
        title: "Seats Updated",
        description: result.message,
      });
      
      onUpdate();
      
      // Reload subscription info
      const subResponse = await apiRequest("GET", `/api/admin/organizations/${organization.id}/subscription`);
      const subData = await subResponse.json();
      if (subData.status === "active") {
        setSubscription(subData.subscription);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-black/40 rounded-lg border border-green-600/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-green-400">{organization.name}</h3>
          <p className="text-sm text-gray-400">
            Current limit: {organization.seatLimit} seats
          </p>
          {organization.stripeCustomerId && (
            <p className="text-xs text-gray-500">
              Customer ID: {organization.stripeCustomerId}
            </p>
          )}
        </div>
        <Badge 
          className={
            organization.stripeSubscriptionId 
              ? "bg-green-600 text-black" 
              : "bg-gray-600 text-white"
          }
        >
          {organization.stripeSubscriptionId ? "Active" : "No Subscription"}
        </Badge>
      </div>

      {loadingSubscription ? (
        <p className="text-gray-400 text-sm">Loading subscription details...</p>
      ) : subscription ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2 text-green-400 capitalize">{subscription.status}</span>
            </div>
            <div>
              <span className="text-gray-400">Current Seats:</span>
              <span className="ml-2 text-green-400">{subscription.quantity}</span>
            </div>
            <div>
              <span className="text-gray-400">Monthly Cost:</span>
              <span className="ml-2 text-green-400">
                ${((subscription.amount * subscription.quantity) / 100).toFixed(2)} {subscription.currency?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Billing Cycle:</span>
              <span className="ml-2 text-green-400 capitalize">{subscription.interval}ly</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-green-600/20">
            <Label htmlFor={`seats-${organization.id}`} className="text-gray-300">
              Update Seats:
            </Label>
            <Input
              id={`seats-${organization.id}`}
              type="number"
              min="1"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-20 bg-black/40 border-green-600/50"
              data-testid={`input-seats-${organization.id}`}
            />
            <Button
              onClick={updateSeats}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-black font-semibold"
              data-testid={`button-update-seats-${organization.id}`}
            >
              Update
            </Button>
          </div>
        </div>
      ) : organization.stripeSubscriptionId ? (
        <p className="text-yellow-400 text-sm">Subscription found but details unavailable</p>
      ) : (
        <p className="text-gray-400 text-sm">No active subscription</p>
      )}
    </div>
  );
}

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  globalRole: string;
  accountStatus: string;
  banReason?: string;
  bannedAt?: string;
  banExpiresAt?: string;
  createdAt?: string;
}

function UserManagementPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "banned">("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banType, setBanType] = useState<"ban" | "suspend">("ban");
  const [banReason, setBanReason] = useState("");
  const [banExpiresAt, setBanExpiresAt] = useState("");
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allUsers, isLoading: loadingUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: bannedUsers, isLoading: loadingBanned } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/bans"],
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest("/api/admin/users/" + userId + "/ban", {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast({ title: "User Banned", description: "The user has been banned and notified." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bans"] });
      closeBanDialog();
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Failed to ban user", variant: "destructive" });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason, expiresAt }: { userId: string; reason: string; expiresAt: string }) => {
      return apiRequest("/api/admin/users/" + userId + "/suspend", {
        method: "POST",
        body: JSON.stringify({ reason, expiresAt }),
      });
    },
    onSuccess: () => {
      toast({ title: "User Suspended", description: "The user has been suspended and notified." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bans"] });
      closeBanDialog();
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Failed to suspend user", variant: "destructive" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("/api/admin/users/" + userId + "/unban", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({ title: "User Reinstated", description: "The user's account has been reactivated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bans"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Failed to reinstate user", variant: "destructive" });
    },
  });

  function openBanDialog(user: AdminUser, type: "ban" | "suspend") {
    setTargetUser(user);
    setBanType(type);
    setBanReason("");
    setBanExpiresAt("");
    setBanDialogOpen(true);
  }

  function closeBanDialog() {
    setBanDialogOpen(false);
    setTargetUser(null);
    setBanReason("");
    setBanExpiresAt("");
  }

  function handleBanSubmit() {
    if (!targetUser || !banReason.trim()) return;
    if (banType === "ban") {
      banMutation.mutate({ userId: targetUser.id, reason: banReason });
    } else {
      if (!banExpiresAt) return;
      suspendMutation.mutate({ userId: targetUser.id, reason: banReason, expiresAt: banExpiresAt });
    }
  }

  const filteredUsers = (allUsers || []).filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      u.globalRole.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    if (status === "banned") return <Badge className="bg-red-900/60 text-red-300 border-red-500/30">Banned</Badge>;
    if (status === "suspended") return <Badge className="bg-yellow-900/60 text-yellow-300 border-yellow-500/30">Suspended</Badge>;
    return <Badge className="bg-green-900/60 text-green-300 border-green-500/30">Active</Badge>;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      OWNER: "bg-purple-900/60 text-purple-300 border-purple-500/30",
      STAFF: "bg-blue-900/60 text-blue-300 border-blue-500/30",
      OPERATOR: "bg-cyan-900/60 text-cyan-300 border-cyan-500/30",
      PLAYER: "bg-gray-800/60 text-gray-300 border-gray-500/30",
    };
    return <Badge className={colors[role] || colors.PLAYER}>{role}</Badge>;
  };

  return (
    <>
      <Card className="bg-black/60 border-green-600/30">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Ban className="w-5 h-5" />
            User Management & Bans
          </CardTitle>
          <CardDescription className="text-gray-300">
            View all users, ban or suspend accounts, and manage banned users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={activeSubTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSubTab("all")}
                className={activeSubTab === "all" ? "bg-green-600 hover:bg-green-700 text-black" : "border-gray-600 text-gray-300"}
                data-testid="button-tab-all-users"
              >
                All Users ({allUsers?.length || 0})
              </Button>
              <Button
                variant={activeSubTab === "banned" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSubTab("banned")}
                className={activeSubTab === "banned" ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-600 text-gray-300"}
                data-testid="button-tab-banned-users"
              >
                Banned / Suspended ({bannedUsers?.length || 0})
              </Button>
            </div>
            {activeSubTab === "all" && (
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm bg-black/40 border-gray-600 text-white"
                data-testid="input-user-search"
              />
            )}
          </div>

          {activeSubTab === "all" && (
            <div className="space-y-2">
              {loadingUsers ? (
                <p className="text-gray-400">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-gray-400">No users found.</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50" data-testid={`row-user-${user.id}`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-medium">{user.name || "Unnamed"}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        {roleBadge(user.globalRole)}
                        {statusBadge(user.accountStatus || "active")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.globalRole !== "OWNER" && (user.accountStatus === "active" || !user.accountStatus) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            onClick={() => openBanDialog(user, "suspend")}
                            data-testid={`button-suspend-${user.id}`}
                          >
                            <ShieldOff className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => openBanDialog(user, "ban")}
                            data-testid={`button-ban-${user.id}`}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban
                          </Button>
                        </>
                      )}
                      {(user.accountStatus === "banned" || user.accountStatus === "suspended") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => unbanMutation.mutate(user.id)}
                          disabled={unbanMutation.isPending}
                          data-testid={`button-unban-${user.id}`}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Reinstate
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === "banned" && (
            <div className="space-y-2">
              {loadingBanned ? (
                <p className="text-gray-400">Loading banned users...</p>
              ) : (bannedUsers || []).length === 0 ? (
                <p className="text-gray-400">No banned or suspended users.</p>
              ) : (
                (bannedUsers || []).map((user) => (
                  <div key={user.id} className="p-4 bg-black/30 rounded-lg border border-red-500/20" data-testid={`row-banned-${user.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-white font-medium">{user.name || "Unnamed"}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {roleBadge(user.globalRole)}
                          {statusBadge(user.accountStatus)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => unbanMutation.mutate(user.id)}
                        disabled={unbanMutation.isPending}
                        data-testid={`button-unban-banned-${user.id}`}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Reinstate
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-red-300"><span className="text-gray-400">Reason:</span> {user.banReason}</p>
                      {user.bannedAt && (
                        <p className="text-gray-400">Banned on: {new Date(user.bannedAt).toLocaleDateString()}</p>
                      )}
                      {user.banExpiresAt && (
                        <p className="text-yellow-400">Expires: {new Date(user.banExpiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className={banType === "ban" ? "text-red-400" : "text-yellow-400"}>
              {banType === "ban" ? "Ban User" : "Suspend User"}
            </DialogTitle>
          </DialogHeader>
          {targetUser && (
            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
                <p className="text-white font-medium">{targetUser.name || "Unnamed"}</p>
                <p className="text-gray-400 text-sm">{targetUser.email}</p>
                <div className="mt-1">{roleBadge(targetUser.globalRole)}</div>
              </div>

              {banType === "suspend" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Suspension Type</Label>
                  <Select value={banType} onValueChange={(v) => setBanType(v as "ban" | "suspend")}>
                    <SelectTrigger className="bg-black/40 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suspend">Temporary Suspension</SelectItem>
                      <SelectItem value="ban">Permanent Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-300">Reason *</Label>
                <Textarea
                  placeholder="Explain why this user is being banned or suspended..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-black/40 border-gray-600 text-white min-h-[100px]"
                  data-testid="input-ban-reason"
                />
              </div>

              {banType === "suspend" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Suspension Expires *</Label>
                  <Input
                    type="date"
                    value={banExpiresAt}
                    onChange={(e) => setBanExpiresAt(e.target.value)}
                    className="bg-black/40 border-gray-600 text-white"
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    data-testid="input-ban-expiry"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeBanDialog} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleBanSubmit}
              disabled={!banReason.trim() || (banType === "suspend" && !banExpiresAt) || banMutation.isPending || suspendMutation.isPending}
              className={banType === "ban" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-yellow-600 hover:bg-yellow-700 text-black"}
              data-testid="button-confirm-ban"
            >
              {banMutation.isPending || suspendMutation.isPending ? "Processing..." : banType === "ban" ? "Ban User" : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Appeal {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  reason: string;
  supportingContext?: string;
  status: string;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  userAccountStatus?: string;
  userGlobalRole?: string;
}

function AppealsPanel() {
  const [activeFilter, setActiveFilter] = useState<"pending" | "all">("pending");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingAppeals, isLoading: loadingPending } = useQuery<Appeal[]>({
    queryKey: ["/api/admin/appeals", "pending"],
    queryFn: () => apiRequest("/api/admin/appeals?status=pending"),
  });

  const { data: allAppeals, isLoading: loadingAll } = useQuery<Appeal[]>({
    queryKey: ["/api/admin/appeals", "all"],
    queryFn: () => apiRequest("/api/admin/appeals"),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ appealId, action, response }: { appealId: string; action: "approve" | "deny"; response: string }) => {
      return apiRequest("/api/admin/appeals/" + appealId + "/review", {
        method: "POST",
        body: JSON.stringify({ action, adminResponse: response }),
      });
    },
    onSuccess: (_: any, variables: { appealId: string; action: "approve" | "deny"; response: string }) => {
      const actionText = variables.action === "approve" ? "approved" : "denied";
      toast({ title: `Appeal ${actionText}`, description: `The appeal has been ${actionText} and the user has been notified.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/appeals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bans"] });
      closeReviewDialog();
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Failed to review appeal", variant: "destructive" });
    },
  });

  function openReviewDialog(appeal: Appeal) {
    setSelectedAppeal(appeal);
    setAdminResponse("");
    setReviewDialogOpen(true);
  }

  function closeReviewDialog() {
    setReviewDialogOpen(false);
    setSelectedAppeal(null);
    setAdminResponse("");
  }

  const appeals = activeFilter === "pending" ? pendingAppeals : allAppeals;
  const isLoading = activeFilter === "pending" ? loadingPending : loadingAll;

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-amber-900/60 text-amber-300 border-amber-500/30">Pending</Badge>;
    if (status === "approved") return <Badge className="bg-green-900/60 text-green-300 border-green-500/30">Approved</Badge>;
    if (status === "denied") return <Badge className="bg-red-900/60 text-red-300 border-red-500/30">Denied</Badge>;
    return <Badge className="bg-gray-800/60 text-gray-300 border-gray-500/30">{status}</Badge>;
  };

  return (
    <>
      <Card className="bg-black/60 border-green-600/30">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ban Appeals
          </CardTitle>
          <CardDescription className="text-gray-300">
            Review and respond to ban/suspension appeals from users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("pending")}
              className={activeFilter === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-gray-600 text-gray-300"}
              data-testid="button-filter-pending-appeals"
            >
              Pending ({pendingAppeals?.length || 0})
            </Button>
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "bg-green-600 hover:bg-green-700 text-black" : "border-gray-600 text-gray-300"}
              data-testid="button-filter-all-appeals"
            >
              All Appeals ({allAppeals?.length || 0})
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-gray-400">Loading appeals...</p>
            ) : !appeals || appeals.length === 0 ? (
              <p className="text-gray-400" data-testid="text-no-appeals">
                {activeFilter === "pending" ? "No pending appeals." : "No appeals found."}
              </p>
            ) : (
              appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className="p-4 bg-black/30 rounded-lg border border-gray-700/50"
                  data-testid={`row-appeal-${appeal.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-medium">{appeal.userName || "Unknown User"}</p>
                        <p className="text-gray-400 text-sm">{appeal.userEmail}</p>
                      </div>
                      <div className="flex gap-2">
                        {statusBadge(appeal.status)}
                        {appeal.userAccountStatus && (
                          <Badge className={
                            appeal.userAccountStatus === "banned"
                              ? "bg-red-900/60 text-red-300 border-red-500/30"
                              : appeal.userAccountStatus === "suspended"
                              ? "bg-yellow-900/60 text-yellow-300 border-yellow-500/30"
                              : "bg-green-900/60 text-green-300 border-green-500/30"
                          }>
                            {appeal.userAccountStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {appeal.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => openReviewDialog(appeal)}
                          data-testid={`button-review-appeal-${appeal.id}`}
                        >
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="p-3 bg-black/40 rounded border border-gray-700/30">
                      <p className="text-gray-400 text-xs mb-1">Appeal Reason:</p>
                      <p className="text-gray-200">{appeal.reason}</p>
                    </div>
                    {appeal.supportingContext && (
                      <div className="p-3 bg-black/40 rounded border border-gray-700/30">
                        <p className="text-gray-400 text-xs mb-1">Supporting Context:</p>
                        <p className="text-gray-300">{appeal.supportingContext}</p>
                      </div>
                    )}
                    {appeal.adminResponse && (
                      <div className="p-3 bg-black/40 rounded border border-gray-700/30">
                        <p className="text-gray-400 text-xs mb-1">Admin Response:</p>
                        <p className="text-gray-300">{appeal.adminResponse}</p>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs">
                      Submitted: {new Date(appeal.createdAt).toLocaleString()}
                      {appeal.reviewedAt && ` | Reviewed: ${new Date(appeal.reviewedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Review Appeal</DialogTitle>
          </DialogHeader>
          {selectedAppeal && (
            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
                <p className="text-white font-medium">{selectedAppeal.userName || "Unknown User"}</p>
                <p className="text-gray-400 text-sm">{selectedAppeal.userEmail}</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Appeal Reason:</p>
                <p className="text-gray-200 text-sm">{selectedAppeal.reason}</p>
              </div>
              {selectedAppeal.supportingContext && (
                <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Supporting Context:</p>
                  <p className="text-gray-300 text-sm">{selectedAppeal.supportingContext}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300">Response to User (optional)</Label>
                <Textarea
                  placeholder="Provide a response to the user explaining your decision..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="bg-black/40 border-gray-600 text-white min-h-[100px]"
                  data-testid="input-appeal-admin-response"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeReviewDialog} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={() => selectedAppeal && reviewMutation.mutate({ appealId: selectedAppeal.id, action: "deny", response: adminResponse })}
              disabled={reviewMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-deny-appeal"
            >
              <X className="w-4 h-4 mr-1" />
              {reviewMutation.isPending ? "Processing..." : "Deny"}
            </Button>
            <Button
              onClick={() => selectedAppeal && reviewMutation.mutate({ appealId: selectedAppeal.id, action: "approve", response: adminResponse })}
              disabled={reviewMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-approve-appeal"
            >
              <Check className="w-4 h-4 mr-1" />
              {reviewMutation.isPending ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}