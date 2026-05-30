// Flexible Revenue Configuration System
// This file contains all configurable revenue sharing percentages

export interface RevenueConfig {
  id: string;
  name: string;
  splitPercentages: {
    actionLadder: number;    // Trustees/Founders share
    operator: number;        // Operator share
    seasonPot: number;       // Player season Prize Pool
    monthlyOperations: number; // Platform operations
  };
  commissionRates: {
    nonMember: number;       // Basis points (100 = 1%)
    rookie: number;
    standard: number;
    premium: number;
  };
  membershipPricing: {
    rookie: number;          // Price in cents
    standard: number;
    premium: number;
  };
  settings: {
    roundUpEnabled: boolean;
    operatorMonthlyTarget: number;
    trusteeWeeklyTarget: number;
  };
  lastModified: Date;
  modifiedBy: string;
}

// Default configuration - current ActionLadder settings
export const DEFAULT_REVENUE_CONFIG: RevenueConfig = {
  id: "default",
  name: "ActionLadder Default Configuration", 
  splitPercentages: {
    actionLadder: 23,        // 23% to trustees/admin
    operator: 33,            // 33% to operators
    seasonPot: 43,           // 43% to season Prize Pool for players
    monthlyOperations: 1,    // 1% for monthly operations
  },
  commissionRates: {
    nonMember: 3000,         // 30% for non-members
    rookie: 1800,            // 18% for rookie members
    standard: 2400,          // 24% for standard members
    premium: 3400,           // 34% for premium members
  },
  membershipPricing: {
    rookie: 1399,            // $13.99/month
    standard: 2499,          // $24.99/month
    premium: 7499,           // $74.99/month (Elite)
  },
  settings: {
    roundUpEnabled: true,
    operatorMonthlyTarget: 50000,    // $500/month target
    trusteeWeeklyTarget: 17500,      // $175/week target
  },
  lastModified: new Date(),
  modifiedBy: "system"
};

// Alternative configurations for testing/comparison
export const ALTERNATIVE_CONFIGS: RevenueConfig[] = [
  {
    id: "operator_friendly", 
    name: "Operator-Friendly Split (Higher Operator %)",
    splitPercentages: {
      actionLadder: 20,        // Reduced trustee share
      operator: 40,            // Increased operator share
      seasonPot: 38,           // Reduced player Prize Pool
      monthlyOperations: 2,    // Slightly increased operations
    },
    commissionRates: {
      nonMember: 2800,         // Slightly reduced rates
      rookie: 1600,
      standard: 2200,
      premium: 3200,
    },
    membershipPricing: {
      rookie: 1399,
      standard: 2499,
      premium: 7499,
    },
    settings: {
      roundUpEnabled: true,
      operatorMonthlyTarget: 60000,    // Higher target $600/month
      trusteeWeeklyTarget: 15000,      // Lower trustee target
    },
    lastModified: new Date(),
    modifiedBy: "admin"
  },
  {
    id: "player_first",
    name: "Player-First Configuration (Max Player Benefits)",
    splitPercentages: {
      actionLadder: 18,        // Reduced platform share
      operator: 30,            // Reduced operator share  
      seasonPot: 50,           // Maximized player Prize Pool
      monthlyOperations: 2,    // Operations maintained
    },
    commissionRates: {
      nonMember: 2500,         // Lower commission rates
      rookie: 1500,
      standard: 2000,
      premium: 2800,
    },
    membershipPricing: {
      rookie: 1299,            // Reduced pricing
      standard: 2299,
      premium: 6999,
    },
    settings: {
      roundUpEnabled: false,   // No round-up for player benefit
      operatorMonthlyTarget: 45000,    // Lower operator target
      trusteeWeeklyTarget: 12500,      // Lower trustee target
    },
    lastModified: new Date(),
    modifiedBy: "admin"
  }
];

// Configuration validation
export function validateRevenueConfig(config: RevenueConfig): string[] {
  const errors: string[] = [];
  
  // Check that percentages add up to 100%
  const totalPercentage = config.splitPercentages.actionLadder + 
                         config.splitPercentages.operator + 
                         config.splitPercentages.seasonPot + 
                         config.splitPercentages.monthlyOperations;
  
  if (totalPercentage !== 100) {
    errors.push(`Split percentages must add up to 100%, currently: ${totalPercentage}%`);
  }
  
  // Validate individual percentage ranges
  Object.entries(config.splitPercentages).forEach(([key, value]) => {
    if (value < 0 || value > 100) {
      errors.push(`${key} percentage must be between 0-100%, currently: ${value}%`);
    }
  });
  
  // Validate commission rates (in basis points)
  Object.entries(config.commissionRates).forEach(([key, value]) => {
    if (value < 0 || value > 5000) { // Max 50% commission
      errors.push(`${key} commission rate must be between 0-5000 basis points, currently: ${value}`);
    }
  });
  
  // Validate pricing is positive
  Object.entries(config.membershipPricing).forEach(([key, value]) => {
    if (value <= 0) {
      errors.push(`${key} pricing must be positive, currently: ${value} cents`);
    }
  });
  
  return errors;
}

// Note: Active configuration is now managed by RevenueConfigService
// These functions are kept for backward compatibility and delegate to the service

import { getActiveConfig as getActiveConfigFromService } from "../services/revenueConfigService";

// Get current active configuration (delegates to service)
export function getActiveConfig(): RevenueConfig {
  try {
    return getActiveConfigFromService();
  } catch (error) {
    console.warn("Failed to get active config from service, using default:", error);
    return { ...DEFAULT_REVENUE_CONFIG };
  }
}

// Legacy function - use RevenueConfigService.setActiveConfig instead
export function setActiveConfig(newConfig: RevenueConfig): { success: boolean; errors?: string[] } {
  const errors = validateRevenueConfig(newConfig);
  return errors.length > 0 ? { success: false, errors } : { success: true };
}

// Get all available configurations (includes preset alternatives)
export function getAllConfigs(): RevenueConfig[] {
  return [DEFAULT_REVENUE_CONFIG, ...ALTERNATIVE_CONFIGS];
}

// Create custom configuration
export function createCustomConfig(
  name: string, 
  config: Partial<RevenueConfig>, 
  modifiedBy: string = "admin"
): { success: boolean; config?: RevenueConfig; errors?: string[] } {
  
  const newConfig: RevenueConfig = {
    id: `custom_${Date.now()}`,
    name,
    splitPercentages: config.splitPercentages || DEFAULT_REVENUE_CONFIG.splitPercentages,
    commissionRates: config.commissionRates || DEFAULT_REVENUE_CONFIG.commissionRates,
    membershipPricing: config.membershipPricing || DEFAULT_REVENUE_CONFIG.membershipPricing,
    settings: config.settings || DEFAULT_REVENUE_CONFIG.settings,
    lastModified: new Date(),
    modifiedBy
  };
  
  const errors = validateRevenueConfig(newConfig);
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, config: newConfig };
}