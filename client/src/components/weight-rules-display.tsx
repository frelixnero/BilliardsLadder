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
        description: 'You\'ve lost 3+ in a row to a higher-ranked player. The system now requires them to give you a bigger edge — either a more favorable ball spot or they pay 1.5x the normal entry fee.',
        multiplier: '1.5× entry'
      };
    } else if (consecutiveLosses >= 2) {
      return {
        status: 'Handicap Owed',
        color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
        icon: <Scale className="w-5 h-5" />,
        description: 'You\'ve lost 2 in a row to the same higher-ranked opponent. They now owe you a handicap advantage — this means they must spot you balls or give you games on the wire to keep the match fair.',
        multiplier: '1.2× handicap'
      };
    } else {
      return {
        status: 'Even Match',
        color: 'bg-green-600/20 text-green-400 border-green-500/30',
        icon: <TrendingUp className="w-5 h-5" />,
        description: 'No handicap in effect. Standard match conditions apply — both players compete on equal terms.',
        multiplier: '1.0× normal'
      };
    }
  };

  const status = getWeightStatus();

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border shadow-felt ${status.color}`} data-testid="card-challenger-handicap">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {status.icon}
          Challenger Handicap Status
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

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">How the Challenger Handicap Works</h4>
            <p className="text-xs text-gray-400">
              The handicap system keeps competition fair when a lower-ranked player repeatedly challenges a higher-ranked opponent. 
              It prevents top players from farming easy wins off challengers and makes sure every match stays competitive.
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 flex-shrink-0">●</span>
                <span><strong className="text-gray-300">First challenge:</strong> Both players compete on even terms — no handicap applies</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">●</span>
                <span><strong className="text-gray-300">2 losses in a row</strong> to the same higher-ranked player: They must now give you a handicap — spot you balls or give you games on the wire (e.g., you start ahead in a race)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">●</span>
                <span><strong className="text-gray-300">3+ losses in a row:</strong> The handicap increases — the higher-ranked player must either give a bigger spot or pay 1.5x the normal entry fee to keep the match going</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">●</span>
                <span><strong className="text-gray-300">Resets on a win:</strong> If you beat the higher-ranked player, the handicap counter resets and the next match starts fresh</span>
              </div>
            </div>
          </div>

          <div className="bg-green-900/10 rounded p-3 border border-green-800/20">
            <p className="text-xs text-green-400 font-medium">
              Fair play enforcement — The system tracks all matches automatically. Handicaps are applied before the match starts so both players know the terms up front.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
