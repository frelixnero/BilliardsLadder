import React, { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Camera, DollarSign, Users, Settings, LogOut } from "lucide-react";
import type { GlobalRole } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/dashboard";
import Ladder from "@/pages/LadderPage";
import Tournaments from "@/components/tournaments";
import Players from "@/components/players";
import Bounties from "@/components/bounties";
import Charity from "@/components/charity";
import LiveStream from "@/components/live-stream";
import HallBattles from "@/components/hall-battles";
import RookieSection from "@/pages/RookieSection";
import BarboxLadderPage from "@/pages/BarboxLadderPage";
import EightFootLadderPage from "@/pages/EightFootLadderPage";
import EscrowChallenges from "@/components/escrow-challenges";
import QRRegistration from "@/components/qr-registration";
import LeagueStandings from "@/components/league-standings";
import RealTimeNotifications from "@/components/real-time-notifications";
import PosterGenerator from "@/components/poster-generator";
import AIDashboard from "@/pages/AIDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import OperatorSettings from "@/pages/OperatorSettings";
import TournamentBrackets from "@/pages/TournamentBrackets";
import SpecialGames from "@/pages/SpecialGames";
import Checkout from "@/pages/checkout";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import AcceptableUse from "@/pages/AcceptableUse";
import TeamManagement from "@/pages/TeamManagement";
import TeamMatches from "@/pages/TeamMatches";
import TeamChallenges from "@/components/team-challenges";
import SportsmanshipSystem from "@/components/sportsmanship-system";
import MatchDivisions from "@/components/match-divisions";
import OperatorSubscriptions from "@/pages/OperatorSubscriptions";
import MonetizationDashboard from "@/pages/MonetizationDashboard";
import { FileManager } from "@/components/file-upload";
import JoinPage from "@/pages/JoinPage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthSuccess from "@/pages/AuthSuccess";
import Login from "@/pages/Login";
import OwnerLogin from "@/pages/OwnerLogin";
import TrusteeLogin from "@/pages/TrusteeLogin";
import Signup from "@/pages/Signup";
import SelectRole from "@/pages/SelectRole";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import BillingSuccess from "@/pages/BillingSuccess";
import BillingCancel from "@/pages/BillingCancel";
import { PlayerSubscription } from "@/pages/PlayerSubscription";
import { ChallengeCalendar } from "@/pages/ChallengeCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileNav } from "@/components/MobileNav";
import { WebVitals } from "@/components/WebVitals";
import RevenueAdmin from "@/pages/RevenueAdmin";
import HallLeaderboard from "@/pages/HallLeaderboard";
import TrainingSession from "@/pages/TrainingSession";
import CoachFeedback from "@/pages/CoachFeedback";
import AdminTrainingRewards from "@/pages/AdminTrainingRewards";
import PlayerCareerDashboard from "@/pages/PlayerCareerDashboard";
const logoBackground = "/images/logo-background.png";
// Auth-protected route component
function AppContent({ activeTab }: { activeTab: string }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Get current tab from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentTab = urlParams.get('tab') || activeTab;

  // List of tabs that require authentication
  const protectedTabs = [
    'dashboard', 'ladder', 'eightfoot-ladder', 'barbox-ladder', 'rookie-section',
    'escrow-challenges', 'challenge-calendar', 'hall-battles', 'tournaments',
    'tournament-brackets', 'special-games', 'league-standings', 'match-divisions',
    'ai-features', 'poster-generator', 'file-manager', 'player-subscription',
    'checkout', 'monetization', 'team-management', 'team-matches', 'team-challenges',
    'sportsmanship', 'bounties', 'qr-registration', 'operator-settings',
    'operator-subscriptions', 'revenue-admin', 'admin', 'admin-training-rewards'
  ];

  // If trying to access protected content and not authenticated, redirect to login
  if (!isLoading && protectedTabs.includes(currentTab) && !isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="py-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(${logoBackground})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'hue-rotate(90deg) saturate(2) brightness(0.8) contrast(1.3) sepia(0.4)',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-emerald-600/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              POOL. POINTS. PRIDE.
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              In here, respect is earned in racks, not words
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {currentTab === "dashboard" && <Dashboard />}
        {currentTab === "player-subscription" && <PlayerSubscription />}
        {currentTab === "ladder" && <Ladder />}
        {currentTab === "barbox-ladder" && <BarboxLadderPage />}
        {currentTab === "eightfoot-ladder" && <EightFootLadderPage />}
        {currentTab === "rookie-section" && <RookieSection />}
        {currentTab === "escrow-challenges" && <EscrowChallenges />}
        {currentTab === "hall-battles" && <HallBattles />}
        {currentTab === "league-standings" && <LeagueStandings />}
        {currentTab === "qr-registration" && <QRRegistration />}
        {currentTab === "poster-generator" && <PosterGenerator />}
        {currentTab === "live-stream" && <LiveStream />}
        {currentTab === "ai-features" && <AIDashboard />}
        {currentTab === "operator-settings" && <OperatorSettings />}
        {currentTab === "admin" && <AdminDashboard />}
        {currentTab === "tournaments" && <Tournaments />}
        {currentTab === "tournament-brackets" && <TournamentBrackets />}
        {currentTab === "special-games" && <SpecialGames />}
        {currentTab === "players" && <Players />}
        {currentTab === "bounties" && <Bounties />}
        {currentTab === "charity" && <Charity />}
        {currentTab === "team-management" && <TeamManagement />}
        {currentTab === "team-matches" && <TeamMatches />}
        {currentTab === "team-challenges" && <TeamChallenges />}
        {currentTab === "match-divisions" && <MatchDivisions />}
        {currentTab === "sportsmanship" && <SportsmanshipSystem />}
        {currentTab === "file-manager" && <FileManager />}
        {currentTab === "operator-subscriptions" && <OperatorSubscriptions />}
        {currentTab === "monetization" && <MonetizationDashboard />}
        {currentTab === "revenue-admin" && <RevenueAdmin />}
        {currentTab === "challenge-calendar" && <ChallengeCalendar />}
        {currentTab === "admin-training-rewards" && <AdminTrainingRewards />}
      </div>
      <RealTimeNotifications />
    </>
  );
}

function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Business-focused navigation structure (5 sections)
  const navigationGroups = [
    {
      id: "competition",
      label: "Competition",
      icon: Trophy,
      items: [
        { id: "dashboard", label: "📊 Dashboard", requiresAuth: true },
        // Ladders Section
        { id: "ladder", label: "🥇 Big Dog Throne (9ft)", requiresAuth: true },
        { id: "eightfoot-ladder", label: "🥈 Almost Big Time (8ft)", requiresAuth: true },
        // DEV NOTE: "Kiddie Box King" is a playful/humorous name for the 7ft table size — it's a joke about the smaller table, NOT related to children or kids in any way.
        { id: "barbox-ladder", label: "🥉 Kiddie Box King (7ft)", requiresAuth: true },
        { id: "rookie-section", label: "🔰 Rookie Section", requiresAuth: true },
        // Challenges Section  
        { id: "escrow-challenges", label: "⚔️ Challenge Matches", requiresAuth: true },
        { id: "challenge-calendar", label: "📅 Challenge Calendar", requiresAuth: true },
        { id: "hall-battles", label: "🏟️ Hall Battles", requiresAuth: true },
        // Tournaments Section
        { id: "tournaments", label: "🏆 Tournaments", requiresAuth: true },
        { id: "tournament-brackets", label: "🌲 Tournament Brackets", requiresAuth: true },
        { id: "special-games", label: "⭐ Special Games", requiresAuth: true },
        // Standings Section
        { id: "league-standings", label: "📈 League Standings", requiresAuth: true },
        { id: "match-divisions", label: "📊 Match Divisions", requiresAuth: true },
      ]
    },
    {
      id: "media",
      label: "Media",
      icon: Camera,
      items: [
        { id: "live-stream", label: "📺 Live Stream" },
        { id: "ai-features", label: "🤖 AI Features", requiresAuth: true },
        { id: "poster-generator", label: "🎨 Poster Generator", requiresAuth: true },
        { id: "file-manager", label: "📁 File Manager", requiresAuth: true },
      ]
    },
    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
      requiresAuth: true, // Entire finance section requires authentication
      items: [
        { id: "player-subscription", label: "💳 Subscription Plans", roles: ["PLAYER"] as GlobalRole[], requiresAuth: true },
        { id: "operator-subscriptions", label: "💼 Operator Subscriptions", roles: ["OWNER", "OPERATOR", "TRUSTEE"] as GlobalRole[], requiresAuth: true },
        { id: "checkout", label: "💰 Billing & Payments", requiresAuth: true },
        { id: "monetization", label: "📊 Revenue Dashboard", roles: ["OWNER", "OPERATOR", "TRUSTEE"] as GlobalRole[], requiresAuth: true },
      ]
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      items: [
        { id: "team-management", label: "👥 Team Management", requiresAuth: true },
        { id: "team-matches", label: "🤝 Team Matches", requiresAuth: true },
        { id: "team-challenges", label: "⚡ Team Challenges", requiresAuth: true },
        { id: "players", label: "🎯 Players" },
        { id: "sportsmanship", label: "🤝 Sportsmanship", requiresAuth: true },
        { id: "bounties", label: "💎 Bounties", requiresAuth: true },
        { id: "charity", label: "❤️ Charity" },
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: Settings,
      roles: ["OWNER", "OPERATOR", "TRUSTEE"] as GlobalRole[], // Role-based section visibility
      requiresAuth: true,
      items: [
        { id: "qr-registration", label: "📱 QR Registration", requiresAuth: true },
        { id: "operator-settings", label: "⚙️ Operator Settings", requiresAuth: true },
        { id: "revenue-admin", label: "💰 Revenue Configuration", roles: ["OWNER", "TRUSTEE"] as GlobalRole[], requiresAuth: true },
        { id: "admin-training-rewards", label: "🏆 Training Rewards", roles: ["OWNER", "OPERATOR", "STAFF"] as GlobalRole[], requiresAuth: true },
        { id: "admin", label: "🛡️ Admin Dashboard", requiresAuth: true },
      ]
    },
  ];

  // Get user role from authentication - default to PLAYER if not authenticated
  const userRole: GlobalRole = user?.globalRole || "PLAYER";

  // Filter groups based on user role (but show all to encourage signups)
  const visibleGroups = navigationGroups.filter(group => {
    // If group has role restrictions, check them (only for authenticated users)
    if (group.roles && isAuthenticated && userRole !== "OWNER" && !group.roles.includes(userRole)) {
      return false;
    }

    // Filter items within the group based on role (but not auth status)
    if (isAuthenticated) {
      group.items = group.items.filter(item => {
        if ((item as any).roles && userRole !== "OWNER" && !(item as any).roles.includes(userRole)) {
          return false;
        }
        return true;
      });
    }

    return true; // Show all groups to unauthenticated users
  });

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-[#0d1f12]/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-center">
          <div className="text-emerald-300">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0d1f12]/90 backdrop-blur border-b border-white/10">
      {/* Row 1: Brand (left) + Live + Join via QR (right) */}
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer"
          onClick={() => window.location.href = "/"}
        >
          <img
            src="/billiards-logo.svg"
            alt="Action Ladder Billiards Logo"
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover border border-emerald-400/30"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold tracking-wide text-emerald-300 text-sm md:text-lg">
              ACTIONLADDER
            </span>
            <span className="hidden sm:block text-xs text-emerald-200/70">
              In here, respect is earned in racks, not words
            </span>
          </div>
        </div>

        {/* Desktop Navigation Dropdowns */}
        <nav className="hidden md:flex items-center gap-2 flex-shrink-0 min-w-0">
          {visibleGroups.map(group => (
            <DropdownMenu key={group.id}>
              <DropdownMenuTrigger className="flex items-center gap-2 text-emerald-200/80 hover:text-white px-4 py-2.5 rounded-lg hover:bg-emerald-500/15 transition-all duration-200 whitespace-nowrap font-medium text-sm border border-transparent hover:border-emerald-500/20">
                <group.icon className="w-4 h-4" />
                {group.label}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="max-h-96 w-64 overflow-y-auto bg-gray-900 text-white border border-gray-700"
                align="start"
              >
                {group.items.map(item => (
                  <DropdownMenuItem
                    className="hover:bg-emerald-700 hover:text-white cursor-pointer px-3 py-2 text-sm whitespace-nowrap"
                    key={item.id}
                    onClick={() => {
                      if (item.requiresAuth && !isAuthenticated) {
                        window.location.href = "/login";
                      } else {
                        setActiveTab(item.id);
                        window.location.href = `/app?tab=${item.id}`;
                      }
                    }}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline rounded-full px-3 py-1 text-xs font-bold bg-red-900/40 text-red-300 ring-1 ring-red-500/40">
            ● LIVE NOW
          </span>
          <button
            onClick={() => { window.location.href = "/app?tab=qr-registration"; }}
            className="hidden sm:inline-flex btn-mobile whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold
                       ring-1 ring-emerald-400/50 bg-emerald-500/15 text-emerald-200
                       hover:bg-emerald-500/25 transition items-center"
            data-testid="button-join-qr"
          >
            Join via QR
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                  .then(() => { window.location.href = "/"; })
                  .catch(() => { window.location.href = "/"; });
              }}
              className="hidden md:inline-flex whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold
                         bg-emerald-600 hover:bg-emerald-700 text-white transition items-center gap-2"
              data-testid="button-logout-desktop"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          ) : (
            <>
              <button
                onClick={() => { window.location.href = "/login"; }}
                className="hidden md:inline-flex whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold
                           bg-emerald-600 hover:bg-emerald-700 text-white transition items-center"
                data-testid="button-login-desktop"
              >
                Log In
              </button>
              <button
                onClick={() => { window.location.href = "/signup"; }}
                className="hidden md:inline-flex whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold
                           ring-1 ring-emerald-400/50 bg-emerald-500/15 text-emerald-200
                           hover:bg-emerald-500/25 transition items-center"
                data-testid="button-signup-desktop"
              >
                Sign Up
              </button>
            </>
          )}
          <MobileNav
            navigationGroups={navigationGroups}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={userRole}
          />
        </div>
      </div>

    </header>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location] = useLocation();

  // Handle URL parameters to set active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-felt-dark text-white font-sans overflow-x-hidden">
          {/* Professional Logo Background */}
          <div className="fixed inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-8"
              style={{
                backgroundImage: `url(${logoBackground})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'hue-rotate(90deg) saturate(3) brightness(0.6) contrast(1.5) sepia(0.3)',
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-felt-dark/80 to-felt-dark/90"></div>
          </div>

          <ErrorBoundary>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </ErrorBoundary>

          <main className="relative z-10">
            <ErrorBoundary>
              <Switch>
                <Route path="/">
                  <Landing />
                </Route>
                <Route path="/auth-success">
                  <AuthSuccess />
                </Route>
                <Route path="/login">
                  <Login />
                </Route>
                <Route path="/owner-login">
                  <OwnerLogin />
                </Route>
                <Route path="/trustee-login">
                  <TrusteeLogin />
                </Route>
                <Route path="/signup">
                  <Signup />
                </Route>
                <Route path="/select-role">
                  <SelectRole />
                </Route>
                <Route path="/forgot-password">
                  <ForgotPassword />
                </Route>
                <Route path="/verify-email">
                  <VerifyEmail />
                </Route>
                <Route path="/billing/success">
                  <BillingSuccess />
                </Route>
                <Route path="/billing/cancel">
                  <BillingCancel />
                </Route>
                <Route path="/checkout">
                  <Checkout />
                </Route>
                <Route path="/terms">
                  <Terms />
                </Route>
                <Route path="/privacy">
                  <Privacy />
                </Route>
                <Route path="/refund">
                  <Refund />
                </Route>
                <Route path="/acceptable-use">
                  <AcceptableUse />
                </Route>
                <Route path="/join">
                  <JoinPage />
                </Route>
                <Route path="/home">
                  {() => { window.location.href = "/app?tab=dashboard"; return null; }}
                </Route>
                <Route path="/owner-dashboard">
                  {() => { window.location.href = "/app?tab=admin"; return null; }}
                </Route>
                <Route path="/trustee-dashboard">
                  {() => { window.location.href = "/app?tab=admin"; return null; }}
                </Route>
                <Route path="/operator-dashboard">
                  {() => { window.location.href = "/app?tab=operator-settings"; return null; }}
                </Route>
                <Route path="/training/leaderboard/:hallId?">
                  <HallLeaderboard />
                </Route>
                <Route path="/training/session">
                  <TrainingSession />
                </Route>
                <Route path="/player/career">
                  <PlayerCareerDashboard />
                </Route>
                <Route path="/training/insights/:sessionId">
                  <CoachFeedback />
                </Route>
                <Route path="/app">
                  <AppContent activeTab={activeTab} />
                </Route>
                <Route component={NotFound} />
              </Switch>
            </ErrorBoundary>
          </main>

          <Toaster />
          <WebVitals />

          {/* Footer with Policy Links */}
          <footer className="relative z-10 bg-black/80 border-t border-neon-green/20 py-8 mt-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-400">
                <a href="/terms" className="hover:text-neon-green transition-colors">Terms of Service</a>
                <a href="/privacy" className="hover:text-neon-green transition-colors">Privacy Policy</a>
                <a href="/refund" className="hover:text-neon-green transition-colors">Refund Policy</a>
                <a href="/acceptable-use" className="hover:text-neon-green transition-colors">Acceptable Use</a>
                <span className="text-neon-green">•</span>
                <span>© 2025 ActionLadder</span>
                <span className="text-neon-green">•</span>
                <span className="font-mono">v1.0.0</span>
              </div>
            </div>
          </footer>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
