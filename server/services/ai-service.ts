import OpenAI from 'openai';
import { storage } from '../storage';
import type { Player, Match } from '@shared/schema';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Helper functions for gathering billiards data
async function getPlayerStats(playerId: string): Promise<string> {
  try {
    const player = await storage.getPlayer(playerId);
    if (!player) return 'Player not found';
    return `Player: ${player.name}, Rating: ${player.rating}, Points: ${player.points}, Streak: ${player.streak}, Respect Points: ${player.respectPoints}`;
  } catch {
    return 'Error retrieving player stats';
  }
}

async function getRecentMatches(limit: number = 5): Promise<string> {
  try {
    const matches = await storage.getAllMatches();
    const recent = matches
      .filter(m => m.status === 'reported')
      .sort((a, b) => new Date(b.reportedAt || '').getTime() - new Date(a.reportedAt || '').getTime())
      .slice(0, limit);
    
    return recent.map(m => 
      `${m.challenger} vs ${m.opponent} - ${m.game} on ${m.table} - Winner: ${m.winner} ($${m.stake} stake)`
    ).join('\n');
  } catch {
    return 'Error retrieving recent matches';
  }
}

async function getPlayerRankings(limit: number = 10): Promise<string> {
  try {
    const players = await storage.getAllPlayers();
    const ranked = players
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
    
    return ranked.map((p, i) => 
      `#${i + 1}: ${p.name} (${p.rating} rating, ${p.points} pts)`
    ).join('\n');
  } catch {
    return 'Error retrieving player rankings';
  }
}

async function callOpenAI(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
  if (!openai) {
    return 'AI insights are currently unavailable. Please try again later.';
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    return completion.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'AI service temporarily unavailable';
  }
}

// AI System Prompts for different purposes
const MATCH_COMMENTARY_PROMPT = `You are a professional billiards match commentator with deep knowledge of pool, 8-ball, 9-ball, and straight pool. 

Your style:
- Gritty, street-smart commentary that fits the "respect is earned in racks, not words" mentality
- Technical analysis mixed with psychological insights
- Reference classic pool terminology and famous players
- Keep energy high during exciting moments
- Analyze player positioning, shot selection, and mental game

Generate engaging commentary for live matches based on the data provided. Focus on:
- Player strengths and weaknesses
- Current momentum and psychological state
- Strategic shot choices
- Stakes and tournament implications`;

const MATCHMAKING_PROMPT = `You are an expert at creating fair and exciting billiards matches. 

Consider these factors:
- Player skill ratings and recent performance
- Playing styles and game preferences
- Current streaks and momentum
- Geographical location (Seguin, San Marcos, New Braunfels)
- Member status and respect points
- Historical matchup data

Suggest 3-5 potential opponents with reasoning for each suggestion. 
Include recommended stakes based on skill differential and excitement factor.`;

const PERFORMANCE_ANALYSIS_PROMPT = `You are a professional pool coach and performance analyst.

Analyze player performance with:
- Statistical trends (win rate, average stakes, opponent quality)
- Strengths and improvement areas
- Comparison to similar-rated players
- Mental game and consistency patterns
- Specific recommendations for advancement

Provide actionable insights that help players understand their game and improve their ladder position.`;

const MATCH_PREDICTION_PROMPT = `You are a billiards analytics expert who predicts match outcomes.

Factors to analyze:
- Current player ratings and form
- Head-to-head history
- Recent performance trends
- Game type advantages (8-ball vs 9-ball vs straight pool)
- Psychological factors (streaks, pressure, stakes)
- Home table advantage

Provide percentage-based predictions with confidence levels and key factors that could swing the match.`;

const COACHING_PROMPT = `You are a master pool instructor with decades of experience teaching players at all levels.

Provide coaching based on:
- Player's current skill level and recent performance
- Common weaknesses in their game type preferences
- Specific drills and practice routines
- Mental game and pressure handling
- Table positioning and safety play
- Competition strategy and opponent reading

Give practical, actionable advice that players can implement immediately to improve their game.`;

const COMMUNITY_PROMPT = `You are the friendly assistant for the ActionLadder billiards community.

Help with:
- Tournament rules and regulations
- Ladder system explanation
- Scheduling and location information
- Community events and special nights
- Player support programs (birthday bonuses, charity nights, family assistance)
- Respect points system
- Membership benefits

Maintain the community's "respect is earned in racks, not words" ethos while being helpful and informative.`;

// AI Service functions
export class AIService {
  static async generateMatchCommentary(matchData: any): Promise<string> {
    const playerStats = await Promise.all([
      getPlayerStats(matchData.challenger),
      getPlayerStats(matchData.opponent)
    ]);
    const recentMatches = await getRecentMatches(3);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: MATCH_COMMENTARY_PROMPT },
      { 
        role: 'user', 
        content: `Generate live commentary for this billiards match:
        Player 1: ${matchData.challenger}
        Player 2: ${matchData.opponent}
        Game: ${matchData.game}
        Table: ${matchData.table}
        Stakes: $${matchData.stake}
        Current status: ${matchData.status}
        
        Player Stats:
        ${playerStats.join('\n')}
        
        Recent matches context:
        ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  static async suggestOpponents(playerId: string): Promise<string> {
    const playerStats = await getPlayerStats(playerId);
    const rankings = await getPlayerRankings(15);
    const recentMatches = await getRecentMatches(5);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: MATCHMAKING_PROMPT },
      { 
        role: 'user', 
        content: `Find the best opponent matches for player ID: ${playerId}. Consider skill level, recent activity, and exciting matchup potential.
        
        Target Player Stats:
        ${playerStats}
        
        Current Rankings:
        ${rankings}
        
        Recent Activity:
        ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  static async analyzePlayerPerformance(playerId: string): Promise<string> {
    const playerStats = await getPlayerStats(playerId);
    const rankings = await getPlayerRankings(10);
    const recentMatches = await getRecentMatches(10);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: PERFORMANCE_ANALYSIS_PROMPT },
      { 
        role: 'user', 
        content: `Provide a comprehensive performance analysis for player ID: ${playerId}. Include strengths, weaknesses, trends, and improvement recommendations.
        
        Player Stats:
        ${playerStats}
        
        Current Rankings Context:
        ${rankings}
        
        Recent Match History:
        ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  static async predictMatchOutcome(challengerId: string, opponentId: string, gameType: string): Promise<string> {
    const playerStats = await Promise.all([
      getPlayerStats(challengerId),
      getPlayerStats(opponentId)
    ]);
    const recentMatches = await getRecentMatches(5);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: MATCH_PREDICTION_PROMPT },
      { 
        role: 'user', 
        content: `Predict the outcome of a ${gameType} match between player ${challengerId} and player ${opponentId}. Provide percentage odds and key factors.
        
        Player Stats:
        ${playerStats.join('\n')}
        
        Recent Match Context:
        ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  static async getCoachingAdvice(playerId: string, topic?: string): Promise<string> {
    const playerStats = await getPlayerStats(playerId);
    const recentMatches = await getRecentMatches(5);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: COACHING_PROMPT },
      { 
        role: 'user', 
        content: topic ? 
          `Provide coaching advice for player ID: ${playerId} specifically about: ${topic}
          
          Player Stats:
          ${playerStats}
          
          Recent Performance:
          ${recentMatches}` :
          `Provide general coaching advice for player ID: ${playerId} based on their recent performance and skill level.
          
          Player Stats:
          ${playerStats}
          
          Recent Performance:
          ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  static async answerCommunityQuestion(question: string): Promise<string> {
    const rankings = await getPlayerRankings(5);
    const recentMatches = await getRecentMatches(3);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: COMMUNITY_PROMPT },
      { 
        role: 'user', 
        content: `Answer this question about the ActionLadder billiards community: ${question}
        
        Current community context:
        Top Players: ${rankings}
        Recent Activity: ${recentMatches}` 
      }
    ];
    
    return await callOpenAI(messages);
  }

  /**
   * General content generation method for poster creation
   */
  static async generateContent(prompt: string): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt }
    ];
    
    return await callOpenAI(messages);
  }
}
