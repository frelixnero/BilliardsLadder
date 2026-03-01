import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, TrendingUp, AlertTriangle } from "lucide-react";

interface WeightRulesDisplayProps {
  weightOwed?: boolean;
  consecutiveLosses?: number;
  weightMultiplier?: number;
}

export function WeightRulesDisplay({
  weightOwed = false,
  consecutiveLosses = 0,
  weightMultiplier = 1.0
}: WeightRulesDisplayProps) {
  const getWeightStatus = () => {
    if (consecutiveLosses >= 3) {
      return {
        status: 'High Challenge',
        color: 'bg-red-600/20 text-red-400 border-red-500/30',
        icon: <AlertTriangle className="w-5 h-5" />,
        description: '3+ losses → 1.5× the normal entry fee or more handicap',
        multiplier: '1.5× entry'
      };
    } else if (consecutiveLosses >= 2) {
      return {
        status: 'Handicap Owed',
        color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
        icon: <Scale className="w-5 h-5" />,
        description: '2 losses in a row → opponent owes you handicap advantage',
        multiplier: '1.2× handicap'
      };
    } else {
      return {
        status: 'Even Match',
        color: 'bg-green-600/20 text-green-400 border-green-500/30',
        icon: <TrendingUp className="w-5 h-5" />,
        description: 'Standard match conditions',
        multiplier: '1.0× normal'
      };
    }
  };

  const status = getWeightStatus();

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border shadow-felt ${status.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {status.icon}
          Challenge Handicap Status
          <Badge className={status.color}>
            {status.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{consecutiveLosses}</div>
              <div className="text-xs text-gray-400">Consecutive Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.multiplier}</div>
              <div className="text-xs text-gray-400">Next Match</div>
            </div>
          </div>
          <div className="bg-black/20 rounded p-3">
            <p className="text-sm text-gray-300">{status.description}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Challenge Handicap System</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• Lose 2 in a row to same higher-ranked player → they owe you handicap points</div>
              <div>• Lose 3 in a row → handicap points or 1.5× the normal entry fee</div>
              <div>• Challenger Rule: receive handicap advantage or opponent pays 1.5× entry fee</div>
              <div>• Fair play enforcement</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
