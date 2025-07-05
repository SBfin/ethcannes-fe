import * as React from 'react';
import { useState, forwardRef, useImperativeHandle, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/TurnBasedScratcher.module.css';
import { ErrorMessage } from './ErrorMessage';
import { GameGrid } from './GameGrid';
import { WinningMessage } from './WinningMessage';
import { HoleFoundMessage } from './HoleFoundMessage';
import { AcceptedOfferMessage } from './AcceptedOfferMessage';
import { useRevealedCells } from '../hooks/turn-based-scratcher/useRevealedCells';
import { useGameWatcher } from '../hooks/turn-based-scratcher/useGameWatcher';
import { usePlayRound } from '../hooks/turn-based-scratcher/usePlayRound';
import { useGameManager } from '../hooks/turn-based-scratcher/useGameManager';
import { useHouseSetOfferAPI } from '../hooks/turn-based-scratcher/useHouseSetOfferAPI';
import { useAcceptOffer } from '../hooks/turn-based-scratcher/useAcceptOffer';
import { useGameOffers } from '../hooks/turn-based-scratcher/useGameOffers';
import { generateHouseOfferFromNumber } from '../utils/houseOfferGenerator';
import { usePrevious } from '../hooks/usePrevious';
import { useClaimPayout } from '../hooks/turn-based-scratcher/useClaimPayout';
import { useAudio } from '../hooks/useAudio';
import USDCLogo from './USDCLogo';

interface RevealedCell {
  symbolId: number;
  payout: number;
}

interface TurnBasedScratcherProps {
  onStartGame: (selectedIndexes: number[]) => void;
  isLoading: boolean;
  needsApproval: boolean;
  isApproving: boolean;
  onApproveMax: () => void;
  gameId?: number | null;
  onResetGame?: () => void;
  isConnected: boolean;
  onConnectWallet: () => void;
  isMobile: boolean;
}

export interface TurnBasedScratcherRef {
  getSelectedCells: () => number[];
  getCalculatedOffer: () => number | null;
  isProcessingDeal: () => boolean;
  isAcceptingOffer: () => boolean;
}

const TurnBasedScratcher = forwardRef<TurnBasedScratcherRef, TurnBasedScratcherProps>(
  ({ 
    onStartGame, 
    isLoading, 
    needsApproval, 
    isApproving, 
    onApproveMax, 
    gameId, 
    onResetGame,
    isConnected,
    onConnectWallet,
    isMobile
  }, ref) => {
    const [selectedCells, setSelectedCells] = useState<number[]>([]);
    const [revealedContent, setRevealedContent] = useState<(RevealedCell | null)[]>(Array(9).fill(null));
    const [canSelect, setCanSelect] = useState(true);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [showHoleMessage, setShowHoleMessage] = useState(false);
    const [isProcessingDeal, setIsProcessingDeal] = useState(false);
    const [acceptedOfferInfo, setAcceptedOfferInfo] = useState<{ amount: number; gameId: number } | null>(null);
    const [claimSuccessInfo, setClaimSuccessInfo] = useState<{ amount: bigint; gameId: number } | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const { revealedCells } = useRevealedCells(gameId || null);
    const { gameData, gameState, currentRound, isInNegotiation, isFinished, isAwaitingVRF } = useGameWatcher(gameId || null);
    const { playRound, isLoading: isPlayingRound, error: playRoundError, isAwaitingConfirmation } = usePlayRound(gameId || null);
    const { claimPayout, isLoading: isClaimingPayout, error: claimError, isConfirmed: isClaimConfirmed } = useClaimPayout();
    const { setHouseOffer, isLoading: isSettingOffer, error: setOfferError } = useHouseSetOfferAPI();
    const { acceptOffer, isLoading: isAcceptingOffer, error: acceptOfferError, isConfirmed: isOfferAccepted } = useAcceptOffer();
    const { offers: gameOffers, isLoading: isLoadingOffers, error: offersError } = useGameOffers(gameId || null);
    const { playSound, stopSound } = useAudio();

    const prevGameId = usePrevious(gameId);
    const prevIsFinished = usePrevious(isFinished);
    const prevIsInNegotiation = usePrevious(isInNegotiation);

    const toggleCell = (index: number) => {
      const canSelectCells = !isLoading && !isPlayingRound && !isAwaitingConfirmation && !isClaimingPayout && (isNewGame || isInNegotiation);
      
      if (!canSelectCells) return;
      
      setInternalError(null);
      
      setSelectedCells(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        } else {
          if (prev.length < 3) {
            playSound('scratch', false, 0.1); // Play scratch sound at 10% volume
            return [...prev, index];
          }
        }
        return prev;
      });
    };

    useImperativeHandle(ref, () => ({
      getSelectedCells: () => selectedCells,
      getCalculatedOffer: () => calculatedOffer,
      isProcessingDeal: () => isProcessingDeal,
      isAcceptingOffer: () => isAcceptingOffer,
    }));
    
    const canStart = selectedCells.length === 3;

    // Determine if we're starting a new game or playing a subsequent round  
    const isNewGame = !gameId || gameState === null;
    const canPlayNextRound = gameId && isInNegotiation && !isFinished && gameState !== 'Finished';
    const holeFound = gameState === 'FinishedByHole';
    const canClaimPayout = gameState === 'Finished';

    // Determine current offer based on game state
    const getCurrentOffer = () => {
      if (!gameOffers || !currentRound) return null;
      
      switch (currentRound) {
        case 1:
          return gameOffers.round1;
        case 2:
          return gameOffers.round2;
        case 3:
          return gameOffers.round3;
        default:
          return null;
      }
    };

    const currentOffer = getCurrentOffer();
    const hasOffer = currentOffer !== null;
    const isInNegotiationWithOffer = isInNegotiation && hasOffer;

    const totalPayoutFromRevealedCells = useMemo(() => {
      if (!revealedCells || revealedCells.length === 0) return 0;
      // The payout from the hook is a raw bigint string (e.g., 500000 for $0.50).
      // Sum them up and then divide to get the total dollar value.
      const totalMicroUSDC = revealedCells.reduce((acc, cell) => acc + (cell.payout || 0), 0);
      return totalMicroUSDC / 1_000_000;
    }, [revealedCells]);

    const totalPayoutFromRevealedCellsBigInt = useMemo(() => {
        if (!revealedCells || revealedCells.length === 0) return BigInt(0);
        return revealedCells.reduce((acc, cell) => acc + BigInt(cell.payout || 0), BigInt(0));
    }, [revealedCells]);

    // Pre-calculate offer value for rounds 2 and 3 during negotiation (calculated once per phase)
    const calculatedOffer = useMemo(() => {
      if (!gameId || !currentRound || !isInNegotiation) return null;
      
      // Show deals when we can play round 2 or round 3 (i.e., after completing round 1 or 2)
      const nextRound = currentRound + 1;
      if (nextRound < 2 || nextRound > 3) return null;
      
      try {
        const houseOffer = generateHouseOfferFromNumber(
          totalPayoutFromRevealedCells,
          currentRound,
          revealedCells.length
        );
        return houseOffer.amount;
      } catch (err) {
        console.error('Error calculating offer:', err);
        return null;
      }
    }, [gameId, currentRound, isInNegotiation, totalPayoutFromRevealedCells, revealedCells.length]);

    // Show hole message when hole is found
    React.useEffect(() => {
      if (holeFound && gameId) {
        setShowHoleMessage(true);
        playSound('lose', false, 0.1); // Play lose sound at 10% volume
      }
    }, [holeFound, gameId, playSound]);

    // When an offer is accepted successfully, show the confirmation message
    React.useEffect(() => {
      if (isOfferAccepted && gameId && currentOffer) {
        setAcceptedOfferInfo({ amount: parseFloat(currentOffer), gameId });
        // Play appropriate win sound based on amount at 10% volume
        const amount = parseFloat(currentOffer);
        if (amount >= 2.0) {
          playSound('big-win', false, 0.1);
        } else {
          playSound('medium-win', false, 0.1);
        }
      }
    }, [isOfferAccepted, gameId, currentOffer, playSound]);

    // When the final payout is claimed successfully, show the confirmation message
    React.useEffect(() => {
      if (isClaimConfirmed && gameId) {
        setClaimSuccessInfo({ amount: totalPayoutFromRevealedCellsBigInt, gameId });
        // Play appropriate win sound based on total payout at 10% volume
        const totalUSDC = Number(totalPayoutFromRevealedCellsBigInt) / 1_000_000;
        if (totalUSDC >= 5.0) {
          playSound('big-win', false, 0.1);
        } else if (totalUSDC > 0) {
          playSound('medium-win', false, 0.1);
        }
      }
    }, [isClaimConfirmed, gameId, totalPayoutFromRevealedCellsBigInt, playSound]);

    // Play VRF loading sound when awaiting randomness
    React.useEffect(() => {
      if (isAwaitingVRF) {
        playSound('loading-vrf', true, 0.03); // Loop the loading sound at 3% volume to not cover Sakura
      } else {
        stopSound('loading-vrf'); // Stop the loading sound when VRF completes
      }
    }, [isAwaitingVRF, playSound, stopSound]);

    // Clear processing deal state when offer is detected
    React.useEffect(() => {
      if (hasOffer && isProcessingDeal) {
        setIsProcessingDeal(false);
      }
    }, [hasOffer, isProcessingDeal]);

    // Handle play again after winning or hole
    const handlePlayAgain = useCallback(() => {
      // Stop any playing winning sounds
      stopSound('big-win');
      stopSound('medium-win');
      
      setClaimSuccessInfo(null);
      setAcceptedOfferInfo(null);
      setShowHoleMessage(false);
      setSelectedCells([]);
      setInternalError(null);
      setIsProcessingDeal(false);
      if (onResetGame) {
        onResetGame();
      }
    }, [onResetGame, stopSound]);

    // Handle taking the deal (set offer using house key, then user accepts)
    const handleTakeDeal = async () => {
      if (!gameId || !calculatedOffer) return;
      
      try {
        setIsProcessingDeal(true);
        playSound('start-play', false, 0.1); // Play sound when taking a deal at 10% volume
        // House sets the offer using private key
        await setHouseOffer(gameId, calculatedOffer);
        // After offer is set, the UI will automatically show "Claim Offer" button
        // because hasOffer will become true and isInNegotiationWithOffer will be true
      } catch (err) {
        console.error('Error taking deal:', err);
        setInternalError('Failed to prepare the offer');
        setIsProcessingDeal(false); // Only clear on error
      }
      // Don't clear isProcessingDeal on success - let it clear when offer is detected
    };

    // Manual house offer setting (for development)
    const handleSetHouseOffer = async () => {
      if (!gameId || !currentRound) return;
      
      try {
        // Generate offer using the utility
        const houseOffer = generateHouseOfferFromNumber(
          totalPayoutFromRevealedCells,
          currentRound,
          revealedCells.length
        );
        
        // Set the offer on the contract
        await setHouseOffer(gameId, houseOffer.amount);
      } catch (err) {
        console.error('Error setting house offer:', err);
      }
    };

    // Get the appropriate button text and action
    const getButtonText = () => {
      if (!isConnected) return 'Connect wallet to play';
      if (isLoading) return 'Starting...';
      if (isPlayingRound || isAwaitingConfirmation) return 'Waiting for confirmation...';
      if (isClaimingPayout) return 'Claiming...';
      if (isSettingOffer) return 'Preparing Offer...';
      if (isAcceptingOffer) return 'Accepting Offer...';
      if (isAwaitingVRF) return 'Generating random numbers...';
      
      if (isNewGame) {
        return (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Play (1 <USDCLogo width={16} height={16} />)
          </span>
        );
      } else if (holeFound) {
        return 'Game Over - Hole Found';
      } else if (canClaimPayout) {
        return 'Claim Payout';
      } else if (isInNegotiationWithOffer) {
        return `Accept Offer $${currentOffer}`;
      } else if (canPlayNextRound && currentRound && currentRound < 3) {
        // Show the next round to play, but only if it's not the last round
        const nextRound = currentRound + 1;
        return `Play Round ${nextRound}`;
      } else if (isFinished) {
        return 'Game Finished';
      }
      
      return 'Waiting...';
    };

    const handleButtonClick = async () => {
      if (!isConnected) {
        onConnectWallet();
        return;
      }

      if (isNewGame) {
        if (!canStart) return;
        playSound('start-play', false, 0.1); // Play start sound when starting a new game at 10% volume
        onStartGame(selectedCells);
      } else if (gameId) {
        // Logic for subsequent rounds (assuming a function exists to play next round)
        if (canPlayNextRound) {
          if (selectedCells.length !== 3) return;
          playSound('start-play', false, 0.1); // Play start sound when playing a round at 10% volume
          await playRound(selectedCells);
        } else if (canClaimPayout) {
          claimPayout(gameId);
        } else if (isInNegotiationWithOffer) {
          acceptOffer(gameId);
        }
      }
    };

    const isButtonDisabled = 
      !!((isLoading || isPlayingRound || isAwaitingConfirmation || isClaimingPayout || isSettingOffer || isAcceptingOffer) || // Loading states
      holeFound || // Disable when hole is found (modal handles play again)
      (isFinished && !canClaimPayout) || // Game finished (but allow claim if can claim)
      (canPlayNextRound && selectedCells.length !== 3)); // Disable if playing next round without 3 cells

    // Show play round error, claim error, offer errors, or general error
    const displayError = internalError || playRoundError || claimError || setOfferError || acceptOfferError || offersError;

    // When we enter a negotiation phase, clear the selected cells to prepare for the next round.
    useEffect(() => {
      if (isInNegotiation && !prevIsInNegotiation) {
        setSelectedCells([]);
      }
    }, [isInNegotiation, prevIsInNegotiation]);

    // Effect to reset component state when gameId changes to null (new game starts)
    useEffect(() => {
      if (gameId === null) {
        setSelectedCells([]);
        setInternalError(null);
        setCanSelect(true);
      }
    }, [gameId]);

    useEffect(() => {
      // The portal target is in a different component, so we wait until this component
      // has mounted, then we can safely look for the target div in the document.
      setIsMounted(true);
      const target = document.getElementById('mobile-footer-target');
      setPortalContainer(target);
    }, [isMobile]);

    // Automatically start a new game a few seconds after successful claim
    useEffect(() => {
      if (claimSuccessInfo) {
        const timer = setTimeout(() => {
          handlePlayAgain();
        }, 4000); // 4-second display before resetting
        return () => clearTimeout(timer);
      }
    }, [claimSuccessInfo, handlePlayAgain]);

    // Automatically start a new game after offer is accepted
    useEffect(() => {
      if (acceptedOfferInfo) {
        const timer = setTimeout(() => {
          handlePlayAgain();
        }, 4000);
        return () => clearTimeout(timer);
      }
    }, [acceptedOfferInfo, handlePlayAgain]);

    const buttonContainer = (
      <div className={styles.buttonContainer}>
        {/* Check if we have multiple buttons to show */}
        {isInNegotiation && !hasOffer && calculatedOffer && currentRound && !isProcessingDeal && !isInNegotiationWithOffer ? (
          // Multiple buttons: wrap in buttonRow for side-by-side layout
          <div className={styles.buttonRow}>
            <button
              className={styles.playButton}
              onClick={handleButtonClick}
              disabled={isButtonDisabled}
            >
              {getButtonText()}
            </button>
            
            <button
              className={styles.dealButton}
              onClick={handleTakeDeal}
              disabled={isSettingOffer || isAcceptingOffer}
            >
              {isSettingOffer ? 'Processing deal...' : `Take the deal ($${calculatedOffer.toFixed(2)})`}
            </button>
          </div>
        ) : (
          // Single button: show normally
          <>
            {isInNegotiationWithOffer && gameId ? (
              // When an offer is available, show a dedicated "Accept Offer" button
              <button
                className={styles.dealButton}
                onClick={() => acceptOffer(gameId)}
                disabled={isAcceptingOffer || isSettingOffer}
              >
                {isAcceptingOffer ? 'Accepting...' : `Accept Offer ($${currentOffer})`}
              </button>
            ) : (
              // Default action button
              <button
                className={styles.playButton}
                onClick={handleButtonClick}
                disabled={isButtonDisabled}
              >
                {getButtonText()}
              </button>
            )}
          </>
        )}
        
        {/* Debug info - temporary */}
        {process.env.NODE_ENV === 'development' && !isMobile && (
          <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
            Debug: Round={currentRound}, Negotiation={isInNegotiation ? 'yes' : 'no'}, 
            HasOffer={hasOffer ? 'yes' : 'no'}, CalcOffer={calculatedOffer ? calculatedOffer.toFixed(2) : 'null'}
          </div>
        )}
      </div>
    );

    return (
      <>
        {/* Show winning message overlay when claim is successful */}
        {claimSuccessInfo && (
          <WinningMessage
            amount={claimSuccessInfo.amount}
            gameId={claimSuccessInfo.gameId}
            onPlayAgain={handlePlayAgain}
          />
        )}
        
        {/* Show hole found message overlay when hole is found */}
        {showHoleMessage && gameId && (
          <HoleFoundMessage
            gameId={gameId}
            onPlayAgain={handlePlayAgain}
          />
        )}
        
        {/* Show accepted offer message overlay when offer is accepted */}
        {acceptedOfferInfo && (
          <AcceptedOfferMessage
            amount={BigInt(Math.floor(acceptedOfferInfo.amount * 1_000_000))}
            gameId={acceptedOfferInfo.gameId}
            onPlayAgain={handlePlayAgain}
          />
        )}
        
        <div className={styles.scratcherContainer}>
          <h2 className={styles.title}>Pick 3 secrets to unlock</h2>
          
          <GameGrid
            selectedCells={selectedCells}
            revealedCells={revealedCells}
            onCellClick={toggleCell}
            disabled={!(!isLoading && !isPlayingRound && !isAwaitingConfirmation && !isClaimingPayout && (isNewGame || isInNegotiation))}
            size="medium"
            showCellNumbers={true}
            isAwaitingVRF={isAwaitingVRF}
          />
          
          {displayError && (
            <ErrorMessage 
              error={displayError} 
              onDismiss={() => {
                setInternalError(null);
                // Note: playRoundError and claimError are managed by their respective hooks
              }} 
            />
          )}

          {!isMobile && (
            needsApproval ? (
              <div className={styles.buttonContainer}>
                <button
                  className={styles.playButton}
                  onClick={onApproveMax}
                  disabled={isApproving}
                >
                  {isApproving ? 'Approving...' : 'Approve Forever'}
                </button>
              </div>
            ) : (
              buttonContainer
            )
          )}
        </div>

        {isMounted && portalContainer && isMobile && (
          needsApproval ? createPortal(
            <div className={styles.buttonContainer}>
              <button
                className={styles.playButton}
                onClick={onApproveMax}
                disabled={isApproving}
              >
                {isApproving ? 'Approving...' : 'Approve Forever'}
              </button>
            </div>,
            portalContainer
          ) : (claimSuccessInfo || showHoleMessage || acceptedOfferInfo) ? createPortal(
            <div className={styles.buttonContainer}>
              <button
                className={styles.playButton}
                onClick={handlePlayAgain}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  minHeight: '36px',
                }}
              >
                🎮 Play Again
              </button>
            </div>,
            portalContainer
          ) : createPortal(
            buttonContainer,
            portalContainer
          )
        )}
      </>
    );
  }
);

TurnBasedScratcher.displayName = 'TurnBasedScratcher';
export default TurnBasedScratcher;