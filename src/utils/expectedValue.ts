/**
 * Expected Value Calculator for Turn-Based Scratcher Game
 * 
 * Simple utility to calculate expected value based on current payout and game state.
 */

export interface GameStateEV {
  currentPayout: number;
  expectedValue: number;
  remainingRounds: number;
  cellsScratched: number;
}

/**
 * Calculate expected value based on current game state
 * 
 * @param currentPayout - Total USDC payout accumulated so far
 * @param cellsScratched - Number of cells already scratched (3, 6, or 9)
 * @returns GameStateEV object with calculated expected value
 */
export const calculateExpectedValue = (
  currentPayout: number,
  cellsScratched: number
): GameStateEV => {
  let expectedValue: number;
  let remainingRounds: number;

  switch (cellsScratched) {
    case 3:
      // After first round (3 cells scratched)
      expectedValue = currentPayout + 0.61;
      remainingRounds = 2;
      break;
    
    case 6:
      // After second round (6 cells scratched)
      expectedValue = currentPayout + 0.60;
      remainingRounds = 1;
      break;
    
    case 9:
      // Game complete (all 9 cells scratched)
      expectedValue = currentPayout;
      remainingRounds = 0;
      break;
    
    default:
      throw new Error(`Invalid number of cells scratched: ${cellsScratched}. Must be 3, 6, or 9.`);
  }

  return {
    currentPayout,
    expectedValue,
    remainingRounds,
    cellsScratched
  };
};

/**
 * Get the expected value bonus for remaining rounds
 * 
 * @param cellsScratched - Number of cells already scratched
 * @returns Expected value bonus for continuing the game
 */
export const getEVBonus = (cellsScratched: number): number => {
  switch (cellsScratched) {
    case 3:
      return 0.61; // Two rounds remaining
    case 6:
      return 0.60; // One round remaining
    case 9:
      return 0;    // Game complete
    default:
      throw new Error(`Invalid number of cells scratched: ${cellsScratched}. Must be 3, 6, or 9.`);
  }
};

// Constants for reference
export const EV_CONSTANTS = {
  // Expected value increase per remaining round scenario
  ROUND_2_AND_3_EV: 0.61, // After 3 cells (2 rounds remaining)
  ROUND_3_EV: 0.60,       // After 6 cells (1 round remaining)
} as const; 