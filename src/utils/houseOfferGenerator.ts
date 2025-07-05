/**
 * House Offer Generator
 * 
 * Automatically generates house offers based on game state using existing negotiation logic.
 */

import { generateHouseProposal } from './negotiationLogic';
import { formatUSDC } from '../contracts/config';

export interface HouseOffer {
  amount: number;
  formattedAmount: string;
  reasoning: string;
  strategy: string;
}

/**
 * Generate a house offer for the current game state
 * 
 * @param currentPayout - Current total payout in USDC (as bigint from contract)
 * @param currentRound - Current round (1, 2, or 3)
 * @param revealedCells - Number of cells revealed so far
 * @returns HouseOffer with amount and details
 */
export const generateHouseOffer = (
  currentPayout: bigint,
  currentRound: number,
  revealedCells: number
): HouseOffer => {
  // Convert bigint payout to number for calculations
  const currentPayoutNumber = parseFloat(formatUSDC(currentPayout));
  
  // Calculate cells scratched based on round
  const cellsScratched = currentRound * 3;
  
  // Generate proposal using existing negotiation logic
  const proposal = generateHouseProposal(currentPayoutNumber, cellsScratched);
  
  return {
    amount: proposal.offer,
    formattedAmount: `$${proposal.offer.toFixed(2)}`,
    reasoning: proposal.reasoning,
    strategy: proposal.strategy,
  };
};

/**
 * Generate a house offer from a number-based payout
 * (avoids bigint conversions in the frontend)
 * 
 * @param currentPayoutNumber - Current total payout as a number
 * @param currentRound - Current round (1, 2, or 3)
 * @param revealedCells - Number of cells revealed so far
 * @returns HouseOffer with amount and details
 */
export const generateHouseOfferFromNumber = (
  currentPayoutNumber: number,
  currentRound: number,
  revealedCells: number
): HouseOffer => {
  const cellsScratched = currentRound * 3;
  const proposal = generateHouseProposal(currentPayoutNumber, cellsScratched);
  
  return {
    amount: proposal.offer,
    formattedAmount: `$${proposal.offer.toFixed(2)}`,
    reasoning: proposal.reasoning,
    strategy: proposal.strategy,
  };
};

/**
 * Get the minimum offer amount for a round
 * 
 * @param currentRound - Current round (1, 2, or 3)
 * @returns Minimum offer amount in USDC
 */
export const getMinimumOffer = (currentRound: number): number => {
  switch (currentRound) {
    case 1:
      return 0.50; // $0.50 minimum for round 1
    case 2:
      return 1.00; // $1.00 minimum for round 2
    case 3:
      return 1.50; // $1.50 minimum for round 3
    default:
      return 0.50;
  }
};

/**
 * Check if an offer is reasonable for the current game state
 * 
 * @param offer - The offer amount
 * @param currentPayout - Current total payout
 * @param currentRound - Current round
 * @returns Whether the offer is reasonable
 */
export const isReasonableOffer = (
  offer: number,
  currentPayout: bigint,
  currentRound: number
): boolean => {
  const currentPayoutNumber = parseFloat(formatUSDC(currentPayout));
  const minimumOffer = getMinimumOffer(currentRound);
  
  // Offer should be at least the minimum for the round
  if (offer < minimumOffer) return false;
  
  // Offer should be at least 50% of current payout (if any)
  if (currentPayoutNumber > 0 && offer < currentPayoutNumber * 0.5) return false;
  
  return true;
}; 