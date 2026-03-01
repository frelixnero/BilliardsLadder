import { useQuery } from "@tanstack/react-query";
import { WeightRulesDisplay } from '@/components/weight-rules-display';
import { TutoringSystem } from '@/components/tutoring-system';

interface Player {
  id: string;
  name: string;
  city: string;
  points: number;
  rating: number;
  wins: number;
  rank: number;
  streak: number;
  respectPoints: number;
  member: boolean;
  specialStatus?: "birthday" | "family_support" | "free_pass";
  achievements: string[];
  eightFootRating?: number;
  eightFootWins?: number;
  eightFootLosses?: number;
  eightFootPoints?: number;
  eightFootPassActive?: boolean;
}

interface Bounty {
  id: string;
  type: "onRank" | "onPlayer";
  rank?: number;
  playerId?: string;
  prize: number;
}

export default function EightFootLadderPage() {
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: bounties = [] } = useQuery<Bounty[]>({
    queryKey: ["/api/bounties"],
  });

  const activeBounties = bounties.filter((b: Bounty) => b.prize > 0);

  const rankedPlayers = players
    .map((player, index) => ({
      ...player,
      eightFootRating: player.eightFootRating || player.rating,
      eightFootPoints: player.eightFootPoints || Math.floor(player.points * 0.8),
      eightFootWins: player.eightFootWins || Math.floor(player.wins * 0.7),
      eightFootLosses: player.eightFootLosses || Math.floor((player.rating - player.wins) * 0.7),
      rank: index + 1
    }))
    .sort((a, b) => (b.eightFootPoints || 0) - (a.eightFootPoints || 0))
    .map((player, index) => ({ ...player, rank: index + 1 }));

  const topPlayers = rankedPlayers.slice(0, 3);

  const eightFootContenders = rankedPlayers.filter(p => (p.eightFootRating || 0) <= 650);
  const eightFootElite = rankedPlayers.filter(p => (p.eightFootRating || 0) >= 651);

  if (playersLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-green-400 text-xl">Loading 8ft ladder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 felt-bg rounded-lg border border-green-700/30">
        <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
          ALMOST BIG TIME
        </h1>
        <p className="text-green-500 text-xl mb-2">
          📏 8ft Tables Only
        </p>
        <p className="text-green-600 text-sm mb-8">
          Lock into the bonus pool before the break
        </p>
        
        {/* Live Bounties */}
        {activeBounties.length > 0 && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-red-400 font-bold mb-2 flex items-center justify-center gap-2">
              <span className="live-pulse w-3 h-3 bg-red-500 rounded-full"></span>
              ACTIVE BOUNTIES
            </h3>
            <div className="space-y-2">
              {activeBounties.map((bounty) => (
                <div key={bounty.id} className="text-red-300 text-sm">
                  ${bounty.prize} bounty on {bounty.type === 'onRank' ? `Rank #${bounty.rank}` : 'targeted player'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Challenger Handicap */}
      <div className="max-w-4xl mx-auto" data-testid="section-challenger-handicap-8ft">
        <WeightRulesDisplay 
          weightOwed={true}
          consecutiveLosses={2}
          weightMultiplier={1.2}
        />
      </div>

      {/* Tutoring System for Pro Members */}
      <div className="max-w-2xl mx-auto mb-8">
        <TutoringSystem 
          isPro={true}
          fargoRating={650}
          monthlySessions={1}
          availableCredits={15}
          onScheduleSession={() => console.log('Schedule tutoring session')}
        />
      </div>

      {/* Top 3 Podium */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {topPlayers.map((player) => (
          <div
            key={player.id}
            className={`text-center p-6 rounded-lg border ${
              player.rank === 1
                ? 'bg-yellow-900/20 border-yellow-600/50 rank-1'
                : player.rank === 2
                ? 'bg-gray-900/20 border-gray-600/50 rank-2'
                : 'bg-amber-900/20 border-amber-600/50 rank-3'
            }`}
            data-testid={`eightfoot-podium-rank-${player.rank}`}
          >
            <div className="text-4xl mb-2">
              {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
            </div>
            <div className="text-2xl font-bold mb-1">{player.name}</div>
            <div className="text-sm text-green-500 mb-2">{player.city}</div>
            <div className="text-3xl font-bold cash-glow">${player.eightFootPoints}</div>
            <div className="text-xs mt-2">
              {player.eightFootWins}W-{player.eightFootLosses}L • {player.eightFootRating} Rating
            </div>
            {player.respectPoints > 0 && (
              <div className="badge-respect mt-2">
                {player.respectPoints} Respect
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divisions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tier 1: 8ft Contenders */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            🎯 Tier 1: 8ft Contenders
          </h2>
          <p className="text-green-500 mb-4">650 Fargo & Under</p>
          
          <div className="space-y-3">
            {eightFootContenders.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`eightfoot-contender-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                      {player.eightFootPassActive && (
                        <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">8FT</span>
                      )}
                    </div>
                    <div className="text-xs text-green-600">{player.city} • {player.eightFootRating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${(player.eightFootPoints || 0).toLocaleString()}</div>
                  <div className="text-xs text-green-600">{player.eightFootWins}W-{player.eightFootLosses}L</div>
                </div>
              </div>
            ))}
            {eightFootContenders.length === 0 && (
              <div className="text-green-600 text-center py-8">
                No 8ft contenders yet. Be the first to join!
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: 8ft Elite */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            ⭐ Tier 2: 8ft Elite
          </h2>
          <p className="text-green-500 mb-4">651+ Fargo</p>
          
          <div className="space-y-3">
            {eightFootElite.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`eightfoot-elite-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                      {player.eightFootPassActive && (
                        <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">8FT</span>
                      )}
                    </div>
                    <div className="text-xs text-green-600">{player.city} • {player.eightFootRating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${(player.eightFootPoints || 0).toLocaleString()}</div>
                  <div className="text-xs text-green-600">{player.eightFootWins}W-{player.eightFootLosses}L</div>
                </div>
              </div>
            ))}
            {eightFootElite.length === 0 && (
              <div className="text-green-600 text-center py-8">
                No 8ft elite players yet. Be the first to join!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Games in Rotation */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🎮 Main 8-Foot Table Games
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Straight 8 (Open)</h3>
            <p className="text-green-600 text-sm">Open table 8-ball format</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">BCA 8-Ball</h3>
            <p className="text-green-600 text-sm">Official tournament rules</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Fast 8</h3>
            <p className="text-green-600 text-sm">Speed variation of 8-ball</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">14.1 (Straight Pool)</h3>
            <p className="text-green-600 text-sm">Continuous rack format</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Saratoga</h3>
            <p className="text-green-600 text-sm">Regional specialty game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">9-Ball</h3>
            <p className="text-green-600 text-sm">Rotation game, low to high</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">10-Ball</h3>
            <p className="text-green-600 text-sm">Call shot rotation</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">1-Pocket</h3>
            <p className="text-green-600 text-sm">Strategic pocket game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Banks</h3>
            <p className="text-green-600 text-sm">All shots must bank</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">9-Ball Banks</h3>
            <p className="text-green-600 text-sm">Banking rotation game</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">1 Ball 1 Pocket</h3>
            <p className="text-green-600 text-sm">Single ball pocket game</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center py-8 felt-bg rounded-lg border border-green-700/30">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          Ready to Claim Your Throne?
        </h2>
        <p className="text-green-500 mb-6">
          The pool is locked once both sides are in. Each side puts up 100 credits.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            className="bg-green-600 hover:bg-green-700 text-black font-bold px-6 py-3 rounded transition-colors"
            data-testid="button-8ft-lock-in"
          >
            Lock Into Action
          </button>
          <button 
            className="border border-green-600 text-green-400 hover:bg-green-600/20 font-bold px-6 py-3 rounded transition-colors"
            data-testid="button-8ft-view-pools"
          >
            View Match Pools
          </button>
        </div>
      </div>
    </div>
  );
}
