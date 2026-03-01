// DEV NOTE: "Kiddie Box King" is a humorous/playful name for the 7ft table division.
// It's a tongue-in-cheek joke about the smaller table size — nothing more.
// It has NO relationship to children, kids, or any children's subscription tier.
// The name is purely branding personality for the 7ft barbox ladder.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Player, Match, Bounty } from '../../../shared/schema';
import { WeightRulesDisplay } from '@/components/weight-rules-display';

interface PlayerWithRank extends Player {
  rank: number;
}

const BarboxLadderPage: React.FC = () => {
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
  });

  const { data: bounties = [] } = useQuery<Bounty[]>({
    queryKey: ['/api/bounties'],
  });

  const rankedPlayers = React.useMemo(() => {
    return players
      .sort((a, b) => b.points - a.points)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [players]);

  const topPlayers = rankedPlayers.slice(0, 3);
  const activeBounties = bounties.filter(b => b.active);
  
  const barboxContenders = rankedPlayers.filter(p => p.rating <= 599);
  const barboxElite = rankedPlayers.filter(p => p.rating >= 600);

  if (playersLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-green-400 text-xl">Loading barbox ladder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 felt-bg rounded-lg border border-green-700/30">
        <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
          KIDDIE BOX KING
        </h1>
        <p className="text-green-500 text-xl mb-2">
          📐 7ft Tables Only
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
      <div className="max-w-4xl mx-auto" data-testid="section-challenger-handicap-7ft">
        <WeightRulesDisplay 
          weightOwed={false}
          consecutiveLosses={3}
          weightMultiplier={1.5}
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
            data-testid={`barbox-podium-rank-${player.rank}`}
          >
            <div className="text-4xl mb-2">
              {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
            </div>
            <div className="text-2xl font-bold mb-1">{player.name}</div>
            <div className="text-sm text-green-500 mb-2">{player.city}</div>
            <div className="text-3xl font-bold cash-glow">${player.points}</div>
            <div className="text-xs mt-2">
              {player.rookieWins || 0}W - {player.rating} Rating
            </div>
            {(player.respectPoints || 0) > 0 && (
              <div className="badge-respect mt-2">
                {player.respectPoints || 0} Respect
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divisions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tier 1: Barbox Contenders */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            🎯 Tier 1: Barbox Contenders
          </h2>
          <p className="text-green-500 mb-4">599 Fargo & Under</p>
          
          <div className="space-y-3">
            {barboxContenders.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`barbox-contender-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-green-600">{player.city} • {player.rating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${player.points}</div>
                  <div className="text-xs text-green-600">{player.rookieWins || 0}W</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2: Barbox Elite */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            ⭐ Tier 2: Barbox Elite
          </h2>
          <p className="text-green-500 mb-4">600+ Fargo</p>
          
          <div className="space-y-3">
            {barboxElite.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`barbox-elite-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-green-600">{player.city} • {player.rating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${player.points}</div>
                  <div className="text-xs text-green-600">{player.rookieWins || 0}W</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barbox Rookie Section */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🌟 Barbox Rookie Division (7ft Tables Only)
        </h2>
        <p className="text-green-500 text-center mb-8">
          New to barbox play? Start here! Under 400 Fargo Rating • 7ft Tables Only
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rookie Leaderboard */}
          <div className="bg-black/30 rounded border border-green-800/30 p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              🏆 Rookie Barbox Leaders
            </h3>
            <div className="space-y-3">
              {rankedPlayers
                .filter(p => p.isRookie && p.rating < 400)
                .slice(0, 8)
                .map((player, index) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 bg-green-900/10 rounded border border-green-800/20"
                  data-testid={`barbox-rookie-${player.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-bold w-6">#{index + 1}</span>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {player.name}
                        {player.rookiePassActive && (
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">PASS</span>
                        )}
                      </div>
                      <div className="text-xs text-green-600">{player.rating} Rating • {player.city}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">${player.rookiePoints || 0}</div>
                    <div className="text-xs text-green-600">{player.rookieWins || 0}W-{player.rookieLosses || 0}L</div>
                  </div>
                </div>
              ))}
              {rankedPlayers.filter(p => p.isRookie && p.rating < 400).length === 0 && (
                <div className="text-green-600 text-center py-8">
                  No rookie barbox players yet. Be the first to join!
                </div>
              )}
            </div>
          </div>

          {/* Rookie Features */}
          <div className="space-y-4">
            <div className="bg-black/30 rounded border border-green-800/30 p-4">
              <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                📐 Barbox Rookie Rules
              </h3>
              <ul className="text-green-500 text-sm space-y-2">
                <li>• 7ft tables exclusively</li>
                <li>• Under 400 Fargo rating only</li>
                <li>• $60 challenger fee per match</li>
                <li>• Winner takes $54, operator gets $6</li>
                <li>• Graduate at 400+ rating</li>
              </ul>
            </div>
            
            <div className="bg-black/30 rounded border border-green-800/30 p-4">
              <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                🎯 Rookie Barbox Games
              </h3>
              <ul className="text-green-500 text-sm space-y-2">
                <li>• BCA 8-Ball</li>
                <li>• 9-Ball</li>
                <li>• Fast 8</li>
                <li>• One Ball</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Rookie Quick Actions */}
        <div className="mt-6 text-center">
          <div className="flex justify-center gap-4 flex-wrap">
            <button 
              className="bg-green-600 hover:bg-green-700 text-black font-bold px-4 py-2 rounded text-sm transition-colors"
              data-testid="button-join-rookie-barbox"
            >
              Join Rookie Barbox
            </button>
            <button 
              className="border border-green-600 text-green-400 hover:bg-green-600/20 font-bold px-4 py-2 rounded text-sm transition-colors"
              data-testid="button-schedule-barbox-match"
            >
              Schedule Match
            </button>
          </div>
        </div>
      </div>

      {/* Games in Rotation */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🎮 Barbox (7') Games
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">BCA 8-Ball (classic)</h3>
            <p className="text-green-600 text-sm">Traditional barbox 8-ball</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">Fast 8</h3>
            <p className="text-green-600 text-sm">Speed variation of 8-ball</p>
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
            <h3 className="text-green-400 font-bold mb-2">Banks / 9-Ball Banks</h3>
            <p className="text-green-600 text-sm">Banking variations</p>
          </div>
          
          <div className="bg-black/30 rounded border border-green-800/30 p-4">
            <h3 className="text-green-400 font-bold mb-2">One Ball (One & Done)</h3>
            <p className="text-green-600 text-sm">Single ball elimination</p>
          </div>
        </div>
      </div>

      {/* Shared Rules */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          ⚖️ Shared Rules (Both Ladders)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-black/30 rounded border border-green-800/30 p-4">
              <h3 className="text-green-400 font-bold mb-2">Challenge System</h3>
              <p className="text-green-500 text-sm">Challenger pays entry / bonus pool → Money = Points = Pride.</p>
            </div>
            
            <div className="bg-black/30 rounded border border-green-800/30 p-4">
              <h3 className="text-green-400 font-bold mb-2">Defense Requirement</h3>
              <p className="text-green-500 text-sm">Must defend challenges within time limit.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-black/30 rounded border border-green-800/30 p-4">
              <h3 className="text-green-400 font-bold mb-2">Separate Leaderboards</h3>
              <ul className="text-green-500 text-sm space-y-1">
                <li>• 9ft Champion (599 & Under / 600+)</li>
                <li>• Barbox King (599 & Under / 600+)</li>
              </ul>
            </div>
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
            data-testid="button-barbox-lock-in"
          >
            Lock Into Action
          </button>
          <button 
            className="border border-green-600 text-green-400 hover:bg-green-600/20 font-bold px-6 py-3 rounded transition-colors"
            data-testid="button-barbox-view-pools"
          >
            View Match Pools
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarboxLadderPage;
