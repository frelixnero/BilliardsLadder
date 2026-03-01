/**
 * PlayerCareerDashboard.tsx
 *
 * DROP-IN PAGE — "Your Pool Career"
 *
 * Route: Add to your router as /career  (or /player/career)
 * Role:  PLAYER (and PRO PLAYER once you add that tier)
 *
 * What it does:
 *  - Reframes the player's relationship with the platform from
 *    "I play pool here" → "I work here and get paid on Fridays"
 *  - Shows every service SKU they can sell (coaching, exhibitions,
 *    clinics, content, tips, appearances) as bookable "gigs"
 *  - Shows pending / available / paid-out earnings (the "paycheck")
 *  - Shows their Stripe Connect onboarding status + KYC gate
 *  - Shows ladder rank as a career metric ("your reputation score")
 *  - Friday payout countdown
 *  - Quick-launch buttons for every service type
 *
 * Dependencies (already in your repo):
 *  @tanstack/react-query, lucide-react, shadcn/ui cards/badges/buttons/tabs,
 *  your existing SafeText component, /api/* endpoints you already have
 *
 * New API endpoints needed (listed at bottom of file):
 *  GET /api/player/career-stats
 *  GET /api/player/services
 *  POST /api/player/services  (create a new service listing)
 *  GET /api/player/earnings
 *  GET /api/connect/account/status  (already in your spec)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, Briefcase, Star, Clock, ChevronRight,
  BookOpen, Video, Users, Zap, Trophy, TrendingUp,
  Wallet, Calendar, CheckCircle2, AlertCircle,
  ArrowUpRight, Timer, Gift, Sparkles, Target,
  CreditCard, BarChart3, Award, Shield
} from "lucide-react";
import SafeText from "@/components/SafeText";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CareerStats {
  playerName: string;
  careerLevel: "ROOKIE" | "HUSTLER" | "PRO" | "LEGEND";
  fargoRating: number;
  ladderRank: number;
  reliabilityScore: number;       // 0–100: no-show/drama history
  totalServicesDelivered: number;
  fiveStarReviews: number;
  activeBookings: number;
  followerCount: number;
}

interface EarningsLedger {
  pendingCents: number;           // delivered but in 3–7 day buffer
  availableCents: number;         // ready to transfer Friday
  paidOutThisMonthCents: number;
  allTimeEarnedCents: number;
  nextPayoutDate: string;         // ISO date string (next Friday)
  connectStatus: "not_started" | "pending" | "active" | "restricted";
}

interface ServiceListing {
  id: string;
  serviceType: "COACHING" | "EXHIBITION" | "CLINIC" | "CONTENT_SUB" | "TIP" | "APPEARANCE";
  title: string;
  description: string;
  priceCents: number;
  durationMinutes?: number;
  status: "draft" | "active" | "paused";
  bookingsCount: number;
  totalEarnedCents: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_META: Record<string, {
  icon: React.ElementType;
  color: string;
  borderColor: string;
  label: string;
  description: string;
  defaultPrice: number;
  cta: string;
}> = {
  COACHING: {
    icon: BookOpen,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    label: "Coaching Session",
    description: "1-on-1 lessons. 30, 60, or 90 min slots on your calendar.",
    defaultPrice: 6000,
    cta: "Set Up Lessons",
  },
  EXHIBITION: {
    icon: Trophy,
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    label: "Exhibition Match",
    description: "Fans pay to watch you play a featured set, live or streamed.",
    defaultPrice: 2500,
    cta: "Schedule a Show",
  },
  CLINIC: {
    icon: Users,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    label: "Group Clinic",
    description: "Teach a group session. Sell tickets. You're the instructor.",
    defaultPrice: 3500,
    cta: "Create a Clinic",
  },
  CONTENT_SUB: {
    icon: Video,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    label: "Content Subscription",
    description: "Monthly membership to your drills, breakdowns & behind-the-scenes.",
    defaultPrice: 999,
    cta: "Launch Subscription",
  },
  APPEARANCE: {
    icon: Sparkles,
    color: "text-orange-400",
    borderColor: "border-orange-500/30",
    label: "Sponsored Appearance",
    description: "Operators & sponsors book you for events. Show up, perform, get paid.",
    defaultPrice: 15000,
    cta: "Open for Bookings",
  },
  TIP: {
    icon: Gift,
    color: "text-pink-400",
    borderColor: "border-pink-500/30",
    label: "Fan Tips",
    description: "Fans tip you after a match or content drop. Always on.",
    defaultPrice: 0,
    cta: "Tips Already Enabled",
  },
};

const LEVEL_META = {
  ROOKIE: { label: "Rookie", color: "bg-gray-700 text-gray-300", next: "HUSTLER", nextAt: "Fargo 500 + 5 services" },
  HUSTLER: { label: "Hustler", color: "bg-emerald-900 text-emerald-300", next: "PRO", nextAt: "Fargo 600 + 20 services" },
  PRO: { label: "Pro", color: "bg-yellow-900 text-yellow-300", next: "LEGEND", nextAt: "Fargo 700 + 50 services" },
  LEGEND: { label: "Legend", color: "bg-purple-900 text-purple-300", next: null, nextAt: null },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaycheckWidget({ earnings }: { earnings: EarningsLedger }) {
  const available = (earnings.availableCents / 100).toFixed(2);
  const pending = (earnings.pendingCents / 100).toFixed(2);
  const paidMonth = (earnings.paidOutThisMonthCents / 100).toFixed(2);

  const nextFriday = new Date(earnings.nextPayoutDate);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((nextFriday.getTime() - today.getTime()) / 86400000));

  const isConnected = earnings.connectStatus === "active";
  const isRestricted = earnings.connectStatus === "restricted";

  return (
    <Card className="bg-gradient-to-br from-emerald-950 via-black to-emerald-900/20 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Your Paycheck
          </CardTitle>
          {isConnected ? (
            <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Bank Connected
            </Badge>
          ) : (
            <Badge className="bg-yellow-900/60 text-yellow-300 border-yellow-500/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              {earnings.connectStatus === "not_started" ? "Setup Required" : "Verification Pending"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Available now */}
        <div className="mb-4">
          <div className="text-5xl font-black text-emerald-400 tracking-tight">
            ${available}
          </div>
          <div className="text-sm text-gray-400 mt-1">Available to pay out</div>
        </div>

        {/* Pending buffer */}
        <div className="flex justify-between text-sm mb-4 p-3 rounded-lg bg-black/40 border border-gray-800">
          <div>
            <div className="text-gray-400 text-xs">Pending (3–7 day buffer)</div>
            <div className="text-white font-semibold">${pending}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Paid out this month</div>
            <div className="text-white font-semibold">${paidMonth}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Next auto-payout</div>
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {daysLeft === 0 ? "Today (Friday!)" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        {/* Payout explanation */}
        <div className="text-xs text-gray-500 mb-4 leading-relaxed">
          Every Friday, your available balance transfers to your bank. Auto-payout above $10 minimum.
          You can also withdraw manually anytime.
        </div>

        {!isConnected && !isRestricted && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={() => window.location.href = "/api/connect/account"}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Connect Your Bank to Get Paid
          </Button>
        )}

        {isConnected && (
          <Button
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30"
            disabled={earnings.availableCents < 1000}
            onClick={() => apiRequest("POST", "/api/player/withdraw")}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            {earnings.availableCents >= 1000 ? `Withdraw $${available} Now` : "Need $10 minimum to withdraw"}
          </Button>
        )}

        {isRestricted && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-500/20 rounded p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Stripe needs more info. Check your email or visit your Connect dashboard.
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function CareerLevelCard({ stats }: { stats: CareerStats }) {
  const level = LEVEL_META[stats.careerLevel];
  const progressMap = { ROOKIE: 15, HUSTLER: 40, PRO: 70, LEGEND: 100 };
  const progress = progressMap[stats.careerLevel];

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          Career Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${level.color} text-sm font-bold px-3 py-1`}>
            {level.label}
          </Badge>
          <span className="text-gray-400 text-xs">Fargo {stats.fargoRating}</span>
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        {level.nextAt && (
          <p className="text-xs text-gray-500">
            Next: <span className="text-gray-300">{LEVEL_META[level.next as keyof typeof LEVEL_META]?.label}</span> — {level.nextAt}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


function ReliabilityCard({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const label = score >= 80 ? "Reliable Pro" : score >= 60 ? "Getting There" : "Needs Work";
  const tip = score >= 80
    ? "High scores unlock premium bookings and operator appearances."
    : "No-shows and cancellations lower this. Show up, and it climbs fast.";

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Reliability Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-black ${color} mb-1`}>{score}</div>
        <Badge variant="outline" className={`${color.replace("text-", "border-")} ${color} text-xs mb-2`}>
          {label}
        </Badge>
        <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
      </CardContent>
    </Card>
  );
}


function ServiceCard({
  serviceType,
  listing,
  onActivate,
}: {
  serviceType: string;
  listing?: ServiceListing;
  onActivate: (type: string) => void;
}) {
  const meta = SERVICE_META[serviceType];
  const Icon = meta.icon;
  const isActive = listing?.status === "active";
  const isDraft = listing?.status === "draft";
  const isTip = serviceType === "TIP";

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border ${meta.borderColor} hover:border-opacity-70 transition-all group`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-black/40 ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {isActive && (
            <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-500/20 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          )}
          {isDraft && (
            <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
              Draft
            </Badge>
          )}
          {!listing && !isTip && (
            <Badge variant="outline" className="text-gray-500 border-gray-700 text-xs">
              Not set up
            </Badge>
          )}
          {isTip && (
            <Badge className="bg-pink-900/50 text-pink-300 border-pink-500/20 text-xs">
              Always on
            </Badge>
          )}
        </div>

        <h3 className={`font-bold text-white mb-1`}>{meta.label}</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{meta.description}</p>

        {listing && (
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>{listing.bookingsCount} bookings</span>
            <span className="text-emerald-400">${(listing.totalEarnedCents / 100).toFixed(0)} earned</span>
          </div>
        )}

        {!isTip && (
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            className={
              isActive
                ? `w-full border ${meta.borderColor} ${meta.color} hover:bg-black/40 text-xs`
                : `w-full bg-gray-800 hover:bg-gray-700 text-white text-xs`
            }
            onClick={() => onActivate(serviceType)}
          >
            {isActive ? "Manage Listing" : meta.cta}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


function EarningsHistory() {
  // Mock transaction history — replace with real /api/player/earnings query
  const transactions = [
    { date: "Feb 21", type: "Coaching Session", from: "Marcus T.", amountCents: 5400, status: "paid" },
    { date: "Feb 19", type: "Fan Tip", from: "Anonymous", amountCents: 1000, status: "paid" },
    { date: "Feb 18", type: "Exhibition Fee", from: "Action Arena", amountCents: 2250, status: "available" },
    { date: "Feb 17", type: "Clinic Ticket × 4", from: "4 fans", amountCents: 12000, status: "pending" },
    { date: "Feb 14", type: "Content Sub", from: "3 new subs", amountCents: 2997, status: "paid" },
    { date: "Feb 12", type: "Appearance Fee", from: "Rack Attack Hall", amountCents: 15000, status: "paid" },
  ];

  const statusStyle = {
    paid: "text-emerald-400 bg-emerald-900/30",
    available: "text-blue-400 bg-blue-900/30",
    pending: "text-yellow-400 bg-yellow-900/30",
  };

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
              {tx.date.split(" ")[1]}
            </div>
            <div>
              <div className="text-white text-sm font-medium">{tx.type}</div>
              <div className="text-gray-500 text-xs">{tx.from}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-sm">
              +${(tx.amountCents / 100).toFixed(2)}
            </div>
            <Badge className={`text-xs border-0 ${statusStyle[tx.status as keyof typeof statusStyle]}`}>
              {tx.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}


function HowYouGetPaid() {
  const steps = [
    {
      icon: Briefcase,
      title: "List a service",
      detail: "Coaching, clinics, exhibitions, content subs — each one is a real SKU with a deliverable.",
      color: "text-emerald-400",
    },
    {
      icon: DollarSign,
      title: "Fan or operator pays",
      detail: "They book + pay through the platform. Funds land in your pending balance.",
      color: "text-blue-400",
    },
    {
      icon: CheckCircle2,
      title: "You deliver",
      detail: "Show up, teach, play, post. After a 3–7 day buffer, earnings move to Available.",
      color: "text-yellow-400",
    },
    {
      icon: Wallet,
      title: "Friday — it hits your bank",
      detail: "Every Friday your available balance auto-transfers to your connected bank account.",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="flex gap-3 p-4 rounded-lg bg-black/40 border border-gray-800">
            <div className={`mt-0.5 ${step.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm mb-1">
                <span className="text-gray-500 mr-2">{i + 1}.</span>{step.title}
              </div>
              <div className="text-gray-400 text-xs leading-relaxed">{step.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function LadderAsResume({ stats }: { stats: CareerStats }) {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Your Reputation (Shown to Clients)
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          This is your professional profile — what operators and fans see when they book you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Ladder Rank", value: `#${stats.ladderRank}`, sub: "in your division", color: "text-yellow-400" },
            { label: "Fargo Rating", value: stats.fargoRating, sub: "skill verification", color: "text-emerald-400" },
            { label: "Services Done", value: stats.totalServicesDelivered, sub: "deliverables completed", color: "text-blue-400" },
            { label: "5-Star Reviews", value: stats.fiveStarReviews, sub: "from clients", color: "text-purple-400" },
          ].map((item, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-gray-900/50">
              <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
              <div className="text-white text-xs font-medium mt-1">{item.label}</div>
              <div className="text-gray-500 text-xs">{item.sub}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerCareerDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // ── Data fetching ──

  const { data: stats, isLoading: statsLoading } = useQuery<CareerStats>({
    queryKey: ["/api/player/career-stats"],
    // Remove mock data once API is live:
    placeholderData: {
      playerName: "Marcus T.",
      careerLevel: "HUSTLER",
      fargoRating: 562,
      ladderRank: 7,
      reliabilityScore: 88,
      totalServicesDelivered: 23,
      fiveStarReviews: 19,
      activeBookings: 3,
      followerCount: 142,
    },
  });

  const { data: earnings } = useQuery<EarningsLedger>({
    queryKey: ["/api/player/earnings"],
    placeholderData: {
      pendingCents: 6250,
      availableCents: 18740,
      paidOutThisMonthCents: 42000,
      allTimeEarnedCents: 143500,
      nextPayoutDate: (() => {
        // Next Friday
        const d = new Date();
        const daysUntilFri = (5 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilFri);
        return d.toISOString();
      })(),
      connectStatus: "active",
    },
  });

  const { data: services } = useQuery<ServiceListing[]>({
    queryKey: ["/api/player/services"],
    placeholderData: [
      {
        id: "1",
        serviceType: "COACHING",
        title: "1-on-1 Pool Coaching",
        description: "60 min session",
        priceCents: 6000,
        durationMinutes: 60,
        status: "active",
        bookingsCount: 14,
        totalEarnedCents: 75600,
      },
      {
        id: "2",
        serviceType: "EXHIBITION",
        title: "Featured Set",
        description: "Watch me run a rack live",
        priceCents: 2500,
        status: "active",
        bookingsCount: 6,
        totalEarnedCents: 13500,
      },
    ],
  });

  // ── Mutation: create/activate service ──
  const activateService = useMutation({
    mutationFn: (serviceType: string) =>
      apiRequest("POST", "/api/player/services", { serviceType }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/player/services"] }),
  });

  const handleActivateService = (type: string) => {
    const existing = services?.find((s) => s.serviceType === type);
    if (existing) {
      queryClient.invalidateQueries({ queryKey: ["/api/player/services"] });
    } else {
      activateService.mutate(type);
    }
  };

  if (statsLoading || !stats || !earnings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 flex items-center justify-center">
        <div className="text-emerald-400 animate-pulse">Loading your career…</div>
      </div>
    );
  }

  const serviceMap = Object.fromEntries((services || []).map((s) => [s.serviceType, s]));
  const allTimeEarned = ((earnings.allTimeEarnedCents) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10">
      <div className="max-w-6xl mx-auto p-6">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">
              <SafeText>{stats.playerName}'s Pool Career</SafeText>
            </h1>
            <Badge className={`${LEVEL_META[stats.careerLevel].color} ml-2`}>
              {LEVEL_META[stats.careerLevel].label}
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Your pool game is a job. Every session you teach, every match you play, every clip you post
            — it pays out. Friday is payday.
          </p>
        </div>

        {/* ── All-time callout banner ── */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950 to-black border border-emerald-500/20 mb-8">
          <TrendingUp className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-emerald-400 text-xs font-mono uppercase tracking-wider">Career Earnings</div>
            <div className="text-4xl font-black text-white">${allTimeEarned}</div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <div className="text-gray-500 text-xs">Active bookings</div>
            <div className="text-white text-2xl font-bold">{stats.activeBookings}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-gray-500 text-xs">Followers</div>
            <div className="text-white text-2xl font-bold">{stats.followerCount}</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/60 border border-gray-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-300">
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-300">
              My Services
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-300">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="howItWorks" className="data-[state=active]:bg-emerald-900/40 data-[state=active]:text-emerald-300">
              How It Works
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Paycheck — takes 2 cols */}
              <div className="lg:col-span-2">
                <PaycheckWidget earnings={earnings} />
              </div>
              {/* Side cards */}
              <div className="space-y-4">
                <CareerLevelCard stats={stats} />
                <ReliabilityCard score={stats.reliabilityScore} />
              </div>
            </div>

            {/* Reputation / resume */}
            <LadderAsResume stats={stats} />

            {/* Quick-launch services */}
            <div>
              <h2 className="text-white font-bold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Quick Launch a Service
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.keys(SERVICE_META).map((type) => (
                  <ServiceCard
                    key={type}
                    serviceType={type}
                    listing={serviceMap[type]}
                    onActivate={handleActivateService}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── SERVICES TAB ── */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-white font-bold text-lg">Your Service Listings</h2>
                <p className="text-gray-400 text-sm">Every listing is a real SKU — fans and operators can book and pay directly.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(SERVICE_META).map((type) => (
                <ServiceCard
                  key={type}
                  serviceType={type}
                  listing={serviceMap[type]}
                  onActivate={handleActivateService}
                />
              ))}
            </div>

            {/* Rate card explainer */}
            <Card className="bg-black/60 border border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  Platform Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "Platform fee", value: "10%", note: "Covers payments, support, KYC" },
                    { label: "Venue fee (if at a hall)", value: "0–3%", note: "Only when operator provides venue/admin" },
                    { label: "You keep", value: "~87–90%", note: "Net after Stripe processing" },
                  ].map((row, i) => (
                    <div key={i} className="p-3 rounded bg-gray-900/50">
                      <div className="text-gray-400 text-xs">{row.label}</div>
                      <div className="text-white font-bold text-lg">{row.value}</div>
                      <div className="text-gray-500 text-xs">{row.note}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── EARNINGS TAB ── */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-black/60 border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EarningsHistory />
                  </CardContent>
                </Card>
              </div>
              <div>
                <PaycheckWidget earnings={earnings} />
              </div>
            </div>

            {/* Payout schedule explainer */}
            <Card className="bg-black/60 border border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Payout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-2">
                <p><span className="text-white font-semibold">Buffer period:</span> 3–7 days after payment succeeds before funds move to Available. This protects against chargebacks.</p>
                <p><span className="text-white font-semibold">Auto-Friday payout:</span> Every Friday, your full Available balance (above $10) transfers to your Stripe Connect account, then on to your bank within 1–2 business days.</p>
                <p><span className="text-white font-semibold">Instant withdraw:</span> Hit "Withdraw Now" any time once funds are Available. Instant Payout costs a small Stripe fee (~1.5%).</p>
                <p><span className="text-white font-semibold">First payout:</span> Stripe holds your first live payout for 7–14 days (their standard new-account policy). After that, it's weekly.</p>
                <p><span className="text-white font-semibold">1099 reporting:</span> Once you earn $600+ in a calendar year, Stripe Connect issues your 1099-K automatically. You're earning as an independent contractor.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HOW IT WORKS TAB ── */}
          <TabsContent value="howItWorks" className="space-y-6">
            <Card className="bg-black/60 border border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Pool isn't just a hobby anymore — it's your side hustle, or your whole job.
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Here's how the platform turns the game you love into real income, legally and reliably.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <HowYouGetPaid />

                {/* Gig types breakdown */}
                <div>
                  <h3 className="text-white font-semibold mb-3 text-sm">
                    Every way you can earn
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(SERVICE_META).map(([type, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <div key={type} className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/40 border border-gray-800">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.color}`} />
                          <div>
                            <span className="text-white font-medium text-sm">{meta.label} — </span>
                            <span className="text-gray-400 text-sm">{meta.description}</span>
                          </div>
                          {type !== "TIP" && (
                            <div className="ml-auto text-right flex-shrink-0">
                              <div className="text-gray-500 text-xs">starting from</div>
                              <div className="text-white text-sm font-semibold">
                                ${(meta.defaultPrice / 100).toFixed(0)}{type === "CONTENT_SUB" ? "/mo" : ""}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ladder + competition explainer */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-900 to-black border border-gray-700">
                  <h3 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    The Ladder Makes You Worth More
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Your ladder rank, Fargo rating, and win streaks aren't just for bragging rights —
                    they're your professional résumé. A Rank #3 player commands higher coaching rates.
                    A player on a 10-game streak gets more exhibition bookings.
                    Your reputation is a product. Protect it.
                  </p>
                </div>

                {/* No gambling disclaimer */}
                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20">
                  <h3 className="text-blue-300 font-semibold mb-2 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    How This Works (The Legal Part)
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    You're paid for <span className="text-white">services delivered</span> — coaching,
                    appearances, content, clinics. This is the same model as any gig marketplace.
                    Competition results determine your rank and reputation, not your paycheck.
                    This keeps everything clean with payment processors and regulators.
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

// ─────────────────────────────────────────────────────────────────────────────
// NEW API ENDPOINTS NEEDED
// Add these to your server/routes or server/controllers/
// ─────────────────────────────────────────────────────────────────────────────
//
// GET /api/player/career-stats
//   Returns: CareerStats (see type above)
//   Auth: session — player only
//   Reads: players table + users table + aggregate from service_listings +
//          matches for ranking
//
// GET /api/player/earnings
//   Returns: EarningsLedger (see type above)
//   Auth: session — player only
//   Reads: player_credit_balance / pending ledger + connect account status
//          nextPayoutDate = next Friday from now()
//
// GET /api/player/services
//   Returns: ServiceListing[]
//   Auth: session — player only
//
// POST /api/player/services
//   Body: { serviceType: string, title?: string, priceCents?: number }
//   Creates a new ServiceListing in draft status
//   Returns: { id, serviceType, status }
//
// POST /api/player/withdraw
//   Auth: session — player only
//   Triggers immediate transfer of available_cents to Stripe Connect balance
//   Returns: { transferId, amountCents, status }
//
// NEW TABLE: service_listings
//   id, player_user_id, service_type ENUM, title, description,
//   price_cents, duration_minutes, status ENUM('draft','active','paused'),
//   bookings_count, total_earned_cents, stripe_product_id, stripe_price_id,
//   created_at, updated_at
//   Index: (player_user_id, status), (service_type, status)
