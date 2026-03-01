import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, DollarSign, Calendar, Users } from "lucide-react";

interface TutoringSystemProps {
  isPro?: boolean;
  fargoRating?: number;
  monthlySessions?: number;
  availableCredits?: number;
  onScheduleSession?: () => void;
}

export function TutoringSystem({
  isPro = false,
  fargoRating = 0,
  monthlySessions = 0,
  availableCredits = 0,
  onScheduleSession
}: TutoringSystemProps): JSX.Element {
  const canTutor = isPro && fargoRating >= 580;
  const monthlyDiscount = monthlySessions * 10; // $10 per session
  const effectiveCost = Math.max(0, 60 - monthlyDiscount);

  if (!canTutor) {
    return (
      <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-600/30 shadow-felt">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gray-400" />
            Tutoring System
            <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30">
              Pro Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">
              Tutoring available for Pro members (580+ Fargo)
            </p>
            <div className="text-sm text-gray-500">
              • Earn $10 credit per 30-minute session<br />
              • Reduce membership cost to $50/month<br />
              • Help grow the pool community
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-amber-900/20 backdrop-blur-sm border border-amber-600/30 shadow-felt">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-amber-400" />
          Tutor Bonus System
          <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{monthlySessions}</div>
              <div className="text-xs text-gray-400">Sessions This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">${monthlyDiscount}</div>
              <div className="text-xs text-gray-400">Monthly Discount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${effectiveCost}</div>
              <div className="text-xs text-gray-400">Effective Cost</div>
            </div>
          </div>
          <div className="bg-black/20 rounded p-3">
            <h4 className="text-sm font-semibold text-amber-400 mb-2">How It Works:</h4>
            <div className="space-y-1 text-xs text-gray-300">
              <div>• Pay $60/month upfront</div>
              <div>• Tutor Rookies for 30+ minutes each</div>
              <div>• Earn $10 credit per confirmed session</div>
              <div>• Complete 2+ sessions → $50 effective cost</div>
            </div>
          </div>
          {availableCredits > 0 && (
            <div className="bg-green-900/20 rounded p-3 border border-green-600/30">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-semibold">Available Credits</span>
                <span className="text-green-400 font-bold">${availableCredits}</span>
              </div>
              <div className="text-xs text-green-300 mt-1">
                Apply to next membership or challenge fee
              </div>
            </div>
          )}
          <Button
            onClick={onScheduleSession}
            className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold"
            data-testid="button-schedule-tutoring"
          >
            <Users className="w-4 h-4 mr-2" />
            Schedule Tutoring Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
