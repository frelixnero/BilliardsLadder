import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Player, Match, Bounty } from '../../../shared/schema';
import { WeightRulesDisplay } from '@/components/weight-rules-display';

interface PlayerWithRank extends Player {
  rank: number;
  wins?: number;
  specialStatus?: string;
  achievements?: string[];
}

const LadderPage: React.FC = () => {
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
      .map((player, index) => ({ ...player, rank: index + 1 } as PlayerWithRank));
  }, [players]);

  const topPlayers = rankedPlayers.slice(0, 3);
  const activeBounties = bounties.filter(b => b.active);

  const nineFootContenders = rankedPlayers.filter(p => p.rating <= 650);
  const nineFootElite = rankedPlayers.filter(p => p.rating >= 651);

  if (playersLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-green-400 text-xl">Loading ladder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 felt-bg rounded-lg border border-green-700/30">
        <h1 className="text-5xl font-bold text-green-400 neon-glow mb-4">
          BIG DOG THRONE
        </h1>
        <p className="text-green-500 text-xl mb-2">
          📏 9ft Tables Only
        </p>
        <p className="text-green-500 text-xl mb-4">
          Where legends are made and wallets are emptied
        </p>
        <p className="text-green-600 text-sm mb-8">
          First rule of the hustle: You don't tell 'em where the bread came from. just eat
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
      <div className="max-w-4xl mx-auto" data-testid="section-challenger-handicap-9ft">
        <WeightRulesDisplay 
          weightOwed={false}
          consecutiveLosses={0}
          weightMultiplier={1.0}
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
            data-testid={`podium-rank-${player.rank}`}
          >
            <div className="text-4xl mb-2">
              {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
            </div>
            <div className="text-2xl font-bold mb-1">{player.name}</div>
            <div className="text-sm text-green-500 mb-2">{player.city}</div>
            <div className="text-3xl font-bold cash-glow">${player.points}</div>
            <div className="text-xs mt-2">
              {player.wins ?? 0}W - {player.rating} Rating
            </div>
            {(player.respectPoints ?? 0) > 0 && (
              <div className="badge-respect mt-2">
                {player.respectPoints} Respect
              </div>
            )}
            {player.specialStatus !== 'none' && (
              <div className={`mt-2 badge-${player.specialStatus}`}>
                {player.specialStatus === 'birthday' && '🎂 Birthday Month'}
                {player.specialStatus === 'family_support' && '❤️ Family Support'}
                {player.specialStatus === 'free_pass' && '🛑 Free Pass'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divisions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tier 1: 9ft Contenders */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            🎯 Tier 1: 9ft Contenders
          </h2>
          <p className="text-green-500 mb-4">650 Fargo & Under</p>
          
          <div className="space-y-3">
            {nineFootContenders.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`ninefoot-contender-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                    </div>
                    <div className="text-xs text-green-600">{player.city} • {player.rating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${player.points}</div>
                  <div className="text-xs text-green-600">{player.wins ?? 0}W</div>
                </div>
              </div>
            ))}
            {nineFootContenders.length === 0 && (
              <div className="text-green-600 text-center py-8">
                No 9ft contenders yet. Be the first to join!
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: 9ft Elite */}
        <div className="felt-bg rounded-lg border border-green-700/30 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
            ⭐ Tier 2: 9ft Elite
          </h2>
          <p className="text-green-500 mb-4">651+ Fargo</p>
          
          <div className="space-y-3">
            {nineFootElite.slice(0, 10).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-black/30 rounded border border-green-800/30"
                data-testid={`ninefoot-elite-${player.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-6">#{player.rank}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {player.member && <span className="text-green-500 text-xs">★</span>}
                    </div>
                    <div className="text-xs text-green-600">{player.city} • {player.rating} Rating</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${player.points}</div>
                  <div className="text-xs text-green-600">{player.wins ?? 0}W</div>
                </div>
              </div>
            ))}
            {nineFootElite.length === 0 && (
              <div className="text-green-600 text-center py-8">
                No 9ft elite players yet. Be the first to join!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>⚡</span>
          Recent Action
        </h3>
        <div className="space-y-3">
          {matches.slice(0, 5).map((match) => {
            const winner = players.find(p => p.id === match.winner);
            const p1 = players.find(p => p.id === match.challenger);
            const p2 = players.find(p => p.id === match.opponent);
            const loser = winner?.id === p1?.id ? p2 : p1;
            
            return (
              <div
                key={match.id}
                className="flex justify-between items-center bg-green-800/10 p-3 rounded border border-green-700/20"
                data-testid={`recent-match-${match.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-green-400 font-bold">{winner?.name}</div>
                  <div className="text-gray-500">defeated</div>
                  <div className="text-red-400">{loser?.name}</div>
                  <div className="text-xs bg-gray-800 px-2 py-1 rounded">{match.game}</div>
                </div>
                <div className="text-yellow-400 font-bold cash-glow">+${match.stake}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Games in Rotation */}
      <div className="felt-bg rounded-lg border border-green-700/30 p-6">
        <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
          🎮 Main 9-Foot Table Games (Action Ladder Core)
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
            <h3 className="text-green-400 font-bold mb-2">1-Pocket (9ft only)</h3>
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

      {/* Special / Gambling Style Games */}
      <div className="felt-bg rounded-lg border border-amber-700/30 p-6">
        <h2 className="text-3xl font-bold text-amber-400 mb-6 text-center">
          🎰 Special / Gambling Style Games
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">Money Ball</h3>
            <p className="text-green-600 text-sm">Cue ball lands on cash</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">Object Ball Carom</h3>
            <p className="text-green-600 text-sm">Hit object → carom cue ball</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">Poolhall vs. Poolhall</h3>
            <p className="text-green-600 text-sm">Team vs team matches</p>
          </div>
          
          <div className="bg-black/30 rounded border border-amber-800/30 p-4">
            <h3 className="text-amber-400 font-bold mb-2">Game of the Month</h3>
            <p className="text-green-600 text-sm">Voting system for featured game</p>
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
            className="btn-gritty"
            data-testid="button-join-queue"
          >
            🎯 Join the Queue
          </button>
          <button 
            className="btn-gold"
            data-testid="button-challenge-player"
          >
            ⚔️ Challenge a Player
          </button>
        </div>
      </div>
    </div>
  );
};

export default LadderPage;
