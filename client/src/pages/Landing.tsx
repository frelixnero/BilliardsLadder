import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Users, 
  Settings, 
  Crown, 
  Target, 
  Trophy, 
  Zap,
  Shield,
  Star,
  ChevronRight
} from "lucide-react";
const logoBackground = "/images/logo-background.png";

export default function Landing() {
  const playerFeatures = [
    { icon: Target, title: "Ladder Rankings", desc: "Climb the Big Dog Throne" },
    { icon: Trophy, title: "Tournament Play", desc: "Compete for prizes and glory" },
    { icon: Zap, title: "Special Games", desc: "Money Ball, Kelly Pool & more" },
    { icon: Users, title: "Team Battles", desc: "2v2 and 3v3 team competitions (Coming Soon)" },
  ];

  const operatorFeatures = [
    { icon: Settings, title: "Hall Management", desc: "Complete pool hall operations" },
    { icon: Users, title: "Player Analytics", desc: "Track performance & engagement" },
    { icon: Crown, title: "Tournament Control", desc: "Create and manage events" },
    { icon: Shield, title: "Financial Security", desc: "Secure payment processing" },
  ];

  return (
    <div className="min-h-screen bg-felt-dark text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${logoBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'hue-rotate(90deg) saturate(3) brightness(0.7) contrast(1.4) sepia(0.3)',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/25 via-felt-dark/80 to-felt-dark/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="bg-emerald-900/40 text-emerald-300 px-6 py-2 text-sm font-semibold border border-emerald-500/30 rounded-full mb-6 inline-block">
                Professional Pool League Management
              </Badge>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tight">
              POOL. POINTS. PRIDE.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
              In here, respect is earned in racks, not words. Around here you want it, you need to earn it.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Badge variant="outline" className="bg-gray-900/50 text-emerald-300 border-emerald-500/30 px-4 py-2">
                APA/BCA Style Leagues
              </Badge>
              <Badge variant="outline" className="bg-gray-900/50 text-blue-300 border-blue-500/30 px-4 py-2">
                Skill-Based Competition
              </Badge>
              <Badge variant="outline" className="bg-gray-900/50 text-yellow-300 border-yellow-500/30 px-4 py-2">
                Secure Payment Processing
              </Badge>
            </div>
          </div>
        </section>

        {/* Sign-Up Options */}
        <section className="py-20 px-6 bg-gradient-to-b from-gray-900/20 to-gray-900/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Choose Your Path
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Join as a player to compete in tournaments and climb the rankings, or as an operator to manage your pool hall with professional-grade tools
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Player Sign-Up */}
              <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-emerald-500/10 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 p-6 bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 rounded-2xl w-fit border border-emerald-500/30">
                    <Users className="h-16 w-16 text-emerald-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-emerald-400 mb-3">Join as Player</CardTitle>
                  <CardDescription className="text-gray-300 text-lg leading-relaxed">
                    Compete in ladder rankings, tournaments, and special events to build your reputation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4">
                    {playerFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-emerald-500/30 transition-colors">
                        <div className="p-2 bg-emerald-900/30 rounded-lg flex-shrink-0 mt-1">
                          <feature.icon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{feature.title}</div>
                          <div className="text-gray-400 mt-1">{feature.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => window.location.href = "/app?tab=player-subscription"}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all duration-200"
                    data-testid="button-signup-player"
                  >
                    Sign Up as Player
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <Badge className="bg-emerald-900/40 text-emerald-300 px-4 py-2 border border-emerald-500/30 rounded-full">
                      Free Registration • Start Competing Today
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Operator Sign-Up */}
              <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-2xl w-fit border border-blue-500/30">
                    <Settings className="h-16 w-16 text-blue-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-blue-400 mb-3">Join as Operator</CardTitle>
                  <CardDescription className="text-gray-300 text-lg leading-relaxed">
                    Manage your pool hall with professional tournament software and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4">
                    {operatorFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                        <div className="p-2 bg-blue-900/30 rounded-lg flex-shrink-0 mt-1">
                          <feature.icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{feature.title}</div>
                          <div className="text-gray-400 mt-1">{feature.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => window.location.href = "/app?tab=operator-settings"}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                    data-testid="button-signup-operator"
                  >
                    Sign Up as Operator
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <Badge className="bg-blue-900/40 text-blue-300 px-4 py-2 border border-blue-500/30 rounded-full">
                      Professional Tools • Subscription Based
                    </Badge>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>


        {/* Features Overview */}
        <section className="py-20 px-6 bg-gradient-to-b from-gray-900/40 to-gray-900/60">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Action Ladder?
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Built by pool players, for pool players. Experience the difference professional management makes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center group">
                <div className="mx-auto mb-8 p-6 bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 rounded-2xl w-fit border border-emerald-500/30 group-hover:border-emerald-400/50 transition-all duration-300">
                  <Target className="h-20 w-20 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Skill-Based Competition</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Legitimate pool leagues following APA/BCA models with performance credits, challenge fees, and prize pools that reward true skill.
                </p>
              </div>

              <div className="text-center group">
                <div className="mx-auto mb-8 p-6 bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-2xl w-fit border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                  <Shield className="h-20 w-20 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Secure Operations</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Enterprise-grade security with Stripe payment processing, encrypted data management, and professional operational standards.
                </p>
              </div>

              <div className="text-center group">
                <div className="mx-auto mb-8 p-6 bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-2xl w-fit border border-yellow-500/30 group-hover:border-yellow-400/50 transition-all duration-300">
                  <Star className="h-20 w-20 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Community Driven</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Respect points, charity events, and player support programs that build authentic pool hall community and lasting relationships.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-800/50 bg-gray-900/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/billiards-logo.svg"
                  alt="Action Ladder Billiards Logo"
                  className="h-10 w-10 rounded-lg object-cover border border-emerald-400/30"
                />
                <span className="font-bold text-emerald-300 text-lg">
                  ACTIONLADDER
                </span>
              </div>
              
              <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                Professional pool league management platform built for the billiards community.
                Where respect is earned in racks, not words.
              </p>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <a href="/terms" className="text-gray-400 hover:text-emerald-400 transition-colors font-medium">Terms of Service</a>
                <a href="/privacy" className="text-gray-400 hover:text-emerald-400 transition-colors font-medium">Privacy Policy</a>
                <a href="/acceptable-use" className="text-gray-400 hover:text-emerald-400 transition-colors font-medium">Acceptable Use</a>
              </div>
              
              <div className="pt-6 border-t border-gray-800/50 w-full">
                <p className="text-gray-500 text-sm">
                  © 2025 Action Ladder Billiards. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}