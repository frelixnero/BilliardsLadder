// Revenue sharing and pricing configuration
import { getActiveConfig } from "../config/revenueConfig";

// Get current configuration dynamically
function getCurrentConfig() {
  return getActiveConfig();
}

// Player-friendly pricing: $20-40 vs $43+ leagues (half the cost!)
export const MEMBERSHIP_TIERS = {
  get ROOKIE() {
    const config = getCurrentConfig();
    return {
      name: "Rookie",
      price: config.membershipPricing.rookie,
      commissionRate: config.commissionRates.rookie,
      challengerFee: 0,
      maxChallengerFee: 0,
      perks: ["entry_tier", "3_4_matches_included", "local_ladder_access"],
      description: "Entry tier - Half the cost of APA! 3-4 matches included",
    };
  },
  get STANDARD() {
    const config = getCurrentConfig();
    return {
      name: "Standard",
      price: config.membershipPricing.standard,
      commissionRate: config.commissionRates.standard,
      challengerFee: 6000,
      maxChallengerFee: 50000,
      perks: ["$60+_up_to_$500_challenger_fee", "unlimited_local_ladder", "priority_matching", "weekly_bonus_eligible"],
      description: "Unlimited local ladder with $60+ up to $500 challenger fee per match",
    };
  },
  get PREMIUM() {
    const config = getCurrentConfig();
    return {
      name: "Premium",
      price: config.membershipPricing.premium,
      commissionRate: config.commissionRates.premium,
      challengerFee: 6000,
      maxChallengerFee: 100000,
      perks: ["$60+_up_to_$1000_challenger_fee_(with_approval)", "unlimited_all_ladders", "hall_city_state_access", "stream_perks", "priority_support"],
      description: "All ladders + stream perks with $60+ up to $1,000 challenger fee (with approval)",
    };
  },
} as const;

// Revenue splits based on Prize Pool cuts (not membership fees) - now dynamic
export const COMMISSION_CONFIG = {
  get BASE_RATE() { return getCurrentConfig().commissionRates.nonMember; },
  get MEMBER_RATE() { return getCurrentConfig().commissionRates.rookie; },
  get ROOKIE_RATE() { return getCurrentConfig().commissionRates.rookie; },
  get STANDARD_RATE() { return getCurrentConfig().commissionRates.standard; },
  get PREMIUM_RATE() { return getCurrentConfig().commissionRates.premium; },
  get ROUND_UP_ENABLED() { return getCurrentConfig().settings.roundUpEnabled; },
  // Revenue splits from Prize Pool cuts - now dynamic
  get SPLIT_PERCENTAGES() {
    const config = getCurrentConfig();
    return {
      ACTION_LADDER: config.splitPercentages.actionLadder,
      OPERATOR: config.splitPercentages.operator,
      SEASON_POT: config.splitPercentages.seasonPot,
      MONTHLY_OPERATIONS: config.splitPercentages.monthlyOperations,
    };
  },
} as const;

// Monthly distribution targets (50 Standard players × 4 months example) - now dynamic
export const MONTHLY_TARGETS = {
  get OPERATOR_MONTHLY_TARGET() { return getCurrentConfig().settings.operatorMonthlyTarget; },
  get TRUSTEE_WEEKLY_TARGET() { return getCurrentConfig().settings.trusteeWeeklyTarget; },
  get SEASON_POT_PERCENTAGE() { return getCurrentConfig().splitPercentages.seasonPot; },
  get PLAYER_MEMBERSHIP_COST() { return getCurrentConfig().membershipPricing.standard; },
  get TOTAL_SEASON_EXAMPLE() { return 600000; }, // Example calculation
  get SEASON_POT_EXAMPLE() { return Math.floor(600000 * (getCurrentConfig().splitPercentages.seasonPot / 100)); },
} as const;

/**
 * Calculate commission with round-up profit margin
 * Example: $100 challenge → $90 Prize Pool + $10 fee
 * Split: $5 Action Ladder + $3 operator + $2 bonus fund
 */
export function calculateCommission(amount: number, membershipTier: string = "none"): {
  originalAmount: number;
  commissionRate: number;
  calculatedCommission: number;
  roundedCommission: number;
  actionLadderShare: number;
  operatorShare: number;
  bonusFundShare: number;
  prizePool: number;
} {
  const commissionRate = getCommissionRate(membershipTier);
  const calculatedCommission = Math.ceil(amount * (commissionRate / 10000));

  // Round up to nearest $1 for extra profit
  const roundedCommission = COMMISSION_CONFIG.ROUND_UP_ENABLED
    ? Math.ceil(calculatedCommission / 100) * 100
    : calculatedCommission;

  // Split commission according to percentages
  const actionLadderShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.ACTION_LADDER / 100));
  const operatorShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.OPERATOR / 100));
  const bonusFundShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.SEASON_POT / 100));

  const prizePool = amount - roundedCommission;

  return {
    originalAmount: amount,
    commissionRate,
    calculatedCommission,
    roundedCommission,
    actionLadderShare,
    operatorShare,
    bonusFundShare,
    prizePool,
  };
}

/**
 * Get commission rate based on membership tier
 */
export function getCommissionRate(membershipTier: string): number {
  switch (membershipTier.toLowerCase()) {
    case "rookie":
      return COMMISSION_CONFIG.ROOKIE_RATE;
    case "standard":
      return COMMISSION_CONFIG.STANDARD_RATE;
    case "premium":
      return COMMISSION_CONFIG.PREMIUM_RATE;
    default:
      return COMMISSION_CONFIG.BASE_RATE; // Non-members pay full rate
  }
}

/**
 * Calculate membership savings vs APA/BCA leagues - NEW COMPETITIVE PRICING
 */
export function calculateSavings(tier: string, monthlyMatches: number): {
  actionLadderCost: number;
  competitorCost: number;
  monthlySavings: number;
  annualSavings: number;
  bonusFundValue: number;
} {
  const tierConfig = MEMBERSHIP_TIERS[tier.toUpperCase() as keyof typeof MEMBERSHIP_TIERS];
  if (!tierConfig) {
    throw new Error("Invalid membership tier");
  }

  // Real league costs: APA/BCA $43-45/month + $25 annual fee, Bar leagues $32-34/month
  const competitorMonthlyCost = 4300; // $43/month APA average (+ annual fees)
  const competitorMatchFee = 1000; // $10/match

  const actionLadderMonthlyCost = tierConfig.price;
  const actionLadderMatchFee = 600; // $6/match average with new commission structure

  const actionLadderTotal = actionLadderMonthlyCost + (actionLadderMatchFee * monthlyMatches);
  const competitorTotal = competitorMonthlyCost + (competitorMatchFee * monthlyMatches);

  const monthlySavings = competitorTotal - actionLadderTotal;
  const annualSavings = monthlySavings * 12;

  // Add bonus fund value players get back
  const bonusFundValue = Math.floor(MONTHLY_TARGETS.SEASON_POT_EXAMPLE / 60); // Season Prize Pool distributed to players

  return {
    actionLadderCost: actionLadderTotal,
    competitorCost: competitorTotal,
    monthlySavings,
    annualSavings,
    bonusFundValue,
  };
}

/**
 * Calculate player-first bonus fund activities
 */
export function calculateBonusFundActivities(monthlyBonusFund: number): {
  weeklyBonusMatches: number;
  monthlyPrizePool: number;
  eventNights: number;
  specialTournaments: number;
} {
  return {
    weeklyBonusMatches: Math.floor(monthlyBonusFund * 0.3), // 30% for weekly bonuses
    monthlyPrizePool: Math.floor(monthlyBonusFund * 0.4), // 40% for monthly prizes
    eventNights: Math.floor(monthlyBonusFund * 0.2), // 20% for event nights
    specialTournaments: Math.floor(monthlyBonusFund * 0.1), // 10% for special tournaments
  };
}