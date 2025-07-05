/**
 * Negotiation Logic for Turn-Based Scratcher Game
 * 
 * Contains the house's proposal strategy based on player's expected value.
 */

import { calculateExpectedValue } from './expectedValue';

export interface ProposalResult {
  offer: number;
  playerEV: number;
  offerPercentage: number;
  strategy: 'HIGH_EV_CONSERVATIVE' | 'NORMAL_EV_VARIABLE';
  reasoning: string;
}

/**
 * Generate a house proposal based on player's current game state
 * 
 * @param currentPayout - Player's current total payout
 * @param cellsScratched - Number of cells already scratched (3, 6, or 9)
 * @returns ProposalResult with offer amount and strategy details
 */
export const generateHouseProposal = (
  currentPayout: number,
  cellsScratched: number
): ProposalResult => {
  // Calculate player's expected value
  const gameState = calculateExpectedValue(currentPayout, cellsScratched);
  const playerEV = gameState.expectedValue;
  
  let offer: number;
  let strategy: 'HIGH_EV_CONSERVATIVE' | 'NORMAL_EV_VARIABLE';
  let reasoning: string;
  let offerPercentage: number;

  if (playerEV > 0.98) {
    // High EV scenario: offer 70-90% of EV
    const minPercent = 70;
    const maxPercent = 90;
    offerPercentage = getRandomBetween(minPercent, maxPercent);
    offer = (playerEV * offerPercentage) / 100;
    strategy = 'HIGH_EV_CONSERVATIVE';
    reasoning = `High EV (>${0.98}) detected. Conservative offer at ${offerPercentage}% of EV.`;
  } else {
    // Normal EV scenario: offer 80-120% of EV
    const minPercent = 80;
    const maxPercent = 120;
    offerPercentage = getRandomBetween(minPercent, maxPercent);
    offer = (playerEV * offerPercentage) / 100;
    strategy = 'NORMAL_EV_VARIABLE';
    reasoning = `Normal EV (<=${0.98}). Variable offer at ${offerPercentage}% of EV.`;
  }

  // Round to nearest cent
  offer = Math.round(offer * 100) / 100;

  return {
    offer,
    playerEV,
    offerPercentage,
    strategy,
    reasoning
  };
};

/**
 * Get a random number between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number between min and max
 */
const getRandomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Get a random integer between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer between min and max
 */
export const getRandomIntBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Analyze if the house proposal is favorable for the player
 * 
 * @param proposal - The proposal result from generateHouseProposal
 * @returns Analysis of whether player should accept
 */
export const analyzeProposal = (proposal: ProposalResult) => {
  const isGoodForPlayer = proposal.offer > proposal.playerEV;
  const advantage = proposal.offer - proposal.playerEV;
  
  return {
    shouldAccept: isGoodForPlayer,
    playerAdvantage: advantage,
    analysis: isGoodForPlayer 
      ? `Good offer! ${advantage.toFixed(2)} above EV`
      : `Below EV by ${Math.abs(advantage).toFixed(2)}`
  };
};

/**
 * Format proposal details for display
 * 
 * @param proposal - The proposal result
 * @returns Formatted string for UI display
 */
export const formatProposal = (proposal: ProposalResult): string => {
  return `
💰 Sakura Offer: $${proposal.offer.toFixed(2)}
`.trim();
};

// Constants for reference
export const NEGOTIATION_CONSTANTS = {
  HIGH_EV_THRESHOLD: 0.98,
  HIGH_EV_MIN_PERCENT: 70,
  HIGH_EV_MAX_PERCENT: 90,
  NORMAL_EV_MIN_PERCENT: 80,
  NORMAL_EV_MAX_PERCENT: 120,
} as const; 