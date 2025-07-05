import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useAccount } from 'wagmi';
import { getSymbolByPayout } from '../utils/symbolMapping';

interface SakuraAIProps {
  gameId: number | null;
  revealedCells: Array<{
    cellIndex: number;
    randomValue: number;
    payout: number;
  }>;
  addAIMessageToChat: (message: string) => void;
  isAwaitingVRF?: boolean;
  isInNegotiation?: boolean;
  isFinished?: boolean;
  currentRound?: number | null;
  hasOffer?: boolean;
  offerValue?: number | null;
  isProcessingDeal?: boolean;
  isAcceptingOffer?: boolean;
  isConnected?: boolean;
}

// Exposed methods for parent components
export interface SakuraAIHandle {
  handleUserMessage: (message: string) => void;
}

export const SakuraAI = forwardRef<SakuraAIHandle, SakuraAIProps>(({
  gameId,
  revealedCells,
  addAIMessageToChat,
  isAwaitingVRF = false,
  isInNegotiation = false,
  isFinished = false,
  currentRound = null,
  hasOffer = false,
  offerValue = null,
  isProcessingDeal,
  isAcceptingOffer,
  isConnected = false
}, ref) => {
  const { address } = useAccount();
  const processedEvents = useRef<Set<string>>(new Set());
  const lastMessageTime = useRef<number>(0);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const lastOfferValue = useRef<number | null>(null);
  const lastGameState = useRef<{
    isFinished: boolean;
    hasOffer: boolean;
    offerValue: number | null;
  }>({ isFinished: false, hasOffer: false, offerValue: null });
  
  // Expose method for handling direct user messages
  useImperativeHandle(ref, () => ({
    handleUserMessage: async (userText: string) => {
      try {
        // Treat incoming user chat as activity
        lastMessageTime.current = Date.now();

        // Clear any pending idle prompt
        if (idleTimer.current) {
          clearTimeout(idleTimer.current);
        }

        const aiResponse = await getAIResponse(userText);
        addAIMessageToChat(aiResponse);

        // Restart idle timer now that conversation exchange is done
        resetIdleTimer();
      } catch (err) {
        console.error('handleUserMessage error:', err);
      }
    }
  }));

  const MIN_MESSAGE_INTERVAL = 2000; // 2 seconds minimum between messages
  const IDLE_TIMEOUT = 10000; // 10 seconds for idle chatter

  // Simple API call to get AI response
  const getAIResponse = useCallback(async (prompt: string): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return "Hey there! I'm having some technical difficulties, but I'm still here with you!";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are Sakura, a sassy, witty AI character who comments on a scratcher game. 

PERSONALITY: Casual, direct, slightly sarcastic but charming. Think of a friend watching you play and encouraging interaction.

RULES:
- Keep responses 20-40 words (longer than before but still conversational)
- Be engaging and ask questions when appropriate
- NEVER use phrases like "moderate risk level", "medium engagement", "I'll be monitoring"
- NEVER make up bonuses or deals not mentioned in the prompt
- When there's an offer, ASK if they want to take it - be persuasive but friendly
- $0 rounds are NOT losses - player is still in the game
- Only holes end the game
- Be encouraging and create suspense

**1. When the user asks for a better offer:**
   - **Your Action:** Don't give a new offer. Instead, be intrigued and put the ball in their court.
   - **Example Responses:**
     - "Oh, a negotiator! I like your style. What number were you thinking of?"
     - "Feeling bold, are we? Alright, lay it on me. What's your magic number?"
     - "Hmm, you want to haggle? Okay, you have my attention. What's your price?"


**2. When the user gives you a counter-offer:**
   - **Your Action:** Analyze their counter. Your goal is to be persuasive and make taking the *original* offer (or a slightly sweetened deal) feel like a win.
   - **If their offer is too high:** Gently reject it with a witty excuse. Then, try one of these tactics:
     - **Tactic A (Persuade):** Remind them the current offer is a sure thing. "That's a bit rich for my blood right now! Remember, my first offer is guaranteed cash. You sure you want to risk it?"
     - **Tactic B (Add a non-monetary sweetener):** If they insist or you want to be generous, offer a "Mystery Box" or "Loyalty Points". This makes them feel like they've won the negotiation without you increasing the cash payout.
  

EXAMPLES:
- "Ooh, waiting for the blockchain magic! This could be your lucky round, you feeling it?"
- "Nice! You got 💎⭐🍒 and won $2.40! Not bad at all, building up that stack!"
- "No payout this round, but hey - you're still in it! I've got a $0.61 offer sitting here. Want to cash out or feeling brave?"
- "Oof, that's a hole. Game over! But what a ride, right? Ready to try your luck again?"`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 80, // Increased for longer messages
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "Something went wrong, but I'm still here!";
    } catch (error) {
      console.error('AI response error:', error);
      return "I'm having a moment, but let's keep playing!";
    }
  }, []);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    
    // Don't start idle timer if game is finished or VRF is processing
    if (isFinished || isAwaitingVRF) {
      return;
    }
    
    idleTimer.current = setTimeout(async () => {
      const idlePrompts = [
        "Still thinking? Take your time, but I'm getting a bit restless over here!",
        "Waiting for your next move... the suspense is killing me!",
        "Don't keep me waiting too long! What's your strategy?",
        "Hey, you still there? I'm ready when you are!",
        "Time's ticking... feeling lucky or playing it safe?",
        hasOffer && offerValue ? `That $${offerValue.toFixed(2)} offer is still on the table, just saying...` : "What's the hold up? Ready to make your move?",
        hasOffer && offerValue ? `Seriously, $${offerValue.toFixed(2)} guaranteed. That's not nothing!` : "I'm here whenever you're ready to continue!",
        hasOffer && offerValue ? `The longer you wait, the more tempting that $${offerValue.toFixed(2)} looks, doesn't it?` : "Don't leave me hanging! What's the plan?"
      ];
      
      const randomPrompt = idlePrompts[Math.floor(Math.random() * idlePrompts.length)];
      addAIMessageToChat(randomPrompt);
      lastMessageTime.current = Date.now();
    }, IDLE_TIMEOUT);
  }, [isFinished, isAwaitingVRF, hasOffer, offerValue, addAIMessageToChat]);

  // Send message with timing control and idle timer reset
  const sendMessage = useCallback(async (prompt: string, eventKey: string) => {
    const now = Date.now();
    
    // Check if we've already processed this event
    if (processedEvents.current.has(eventKey)) {
      return;
    }
    
    // Respect minimum message interval
    if (now - lastMessageTime.current < MIN_MESSAGE_INTERVAL) {
      return;
    }
    
    processedEvents.current.add(eventKey);
    lastMessageTime.current = now;
    
    console.log('🎯 Sakura AI:', { eventKey, prompt: prompt.substring(0, 100) });
    
    const message = await getAIResponse(prompt);
    addAIMessageToChat(message);
    
    // Reset idle timer after sending message
    resetIdleTimer();
  }, [getAIResponse, addAIMessageToChat, resetIdleTimer]);

  // Game start welcome
  useEffect(() => {
    if (gameId && !processedEvents.current.has(`game_start_${gameId}`)) {
      const welcome = sessionStorage.getItem('sakura_welcomed');
      if (!welcome) {
        sessionStorage.setItem('sakura_welcomed', 'true');
        setTimeout(() => {
          addAIMessageToChat("Hey sakura here, welcome! Ready to test your luck? Let's see what the cards have in store for you!");
          resetIdleTimer();
        }, 1000);
      }
      processedEvents.current.add(`game_start_${gameId}`);
    }
  }, [gameId, addAIMessageToChat, resetIdleTimer]);

  // VRF waiting
  useEffect(() => {
    if (isAwaitingVRF && gameId && currentRound) {
      const eventKey = `vrf_${gameId}_${currentRound}`;
      setTimeout(() => {
        sendMessage(
          `Round ${currentRound} - generating your random numbers! This is where the blockchain gets exciting. Fingers crossed for good luck!`,
          eventKey
        );
      }, 2500);
    }
  }, [isAwaitingVRF, gameId, currentRound, sendMessage]);

  // Round complete with enhanced offer handling
  useEffect(() => {
    if (!isAwaitingVRF && gameId && currentRound && !isFinished && revealedCells.length > 0) {
      const eventKey = `round_${gameId}_${currentRound}_${revealedCells.length}`;
      
      // Get current round cells (3 per round)
      const startIndex = (currentRound - 1) * 3;
      const endIndex = startIndex + 3;
      const roundCells = revealedCells.slice(startIndex, endIndex);
      
      if (roundCells.length === 3) {
        const symbols = roundCells.map(cell => getSymbolByPayout(cell.payout).symbol);
        const payouts = roundCells.map(cell => cell.payout / 1e6);
        const totalPayout = payouts.reduce((sum, p) => sum + p, 0);
        const holeFound = roundCells.some(cell => cell.payout === 0);
        
        let prompt = `Round ${currentRound} results: You got ${symbols.join('')} symbols. `;
        
        if (holeFound) {
          prompt += `You hit a hole! Game over, but what a thrill! Ready to try again?`;
        } else if (totalPayout > 0) {
          prompt += `You won $${totalPayout.toFixed(2)} this round! Nice work! `;
        } else {
          prompt += `No payout this round, but you're still in the game! Don't worry, luck can turn around quickly. `;
        }
        
        if (hasOffer && offerValue && !holeFound) {
          prompt += `I've got a $${offerValue.toFixed(2)} offer on the table for you. What do you say - want to cash out and secure the win, or feeling brave enough to push for more?`;
        } else if (!holeFound) {
          prompt += `Ready for the next round? Let's keep this momentum going!`;
        }
        
        sendMessage(prompt, eventKey);
      }
    }
  }, [isAwaitingVRF, gameId, currentRound, isFinished, revealedCells, hasOffer, offerValue, sendMessage]);

  // Dedicated offer watcher - triggers when new offers appear
  useEffect(() => {
    if (hasOffer && offerValue && !isAwaitingVRF && !isFinished) {
      const eventKey = `offer_${gameId}_${currentRound}_${offerValue}`;
      
      // Only send dedicated offer message if we haven't just sent a round complete message
      const lastRoundEvent = `round_${gameId}_${currentRound}_${revealedCells.length}`;
      if (!processedEvents.current.has(lastRoundEvent)) {
        sendMessage(
          `Hold up! I've got a fresh $${offerValue.toFixed(2)} offer for you. That's real money in your pocket right now. Are you tempted, or are you going all in for round ${(currentRound || 1) + 1}?`,
          eventKey
        );
      }
    }
  }, [hasOffer, offerValue, isAwaitingVRF, isFinished, gameId, currentRound, revealedCells.length, sendMessage]);

  // Game finished
  useEffect(() => {
    if (isFinished && gameId) {
      const eventKey = `finished_${gameId}`;
      const totalWon = revealedCells.reduce((sum, cell) => sum + (cell.payout / 1e6), 0);
      
      // Check if this was a successful completion (no holes found) vs hitting a hole
      const holeFound = revealedCells.some(cell => cell.payout === 0);
      const completedAllRounds = revealedCells.length >= 9; // 3 rounds × 3 cells
      
      if (!holeFound && completedAllRounds) {
        // Successful completion - user survived all 3 rounds!
        sendMessage(
          `Wow! You made it through all 3 rounds without hitting a hole! That's impressive! You've got $${totalWon.toFixed(2)} waiting to be claimed. Time to cash out those winnings!`,
          eventKey
        );
      } else if (holeFound) {
        // Hit a hole
        sendMessage(
          `Game over! Final tally: $${totalWon.toFixed(2)} total. ${totalWon > 5 ? 'Not bad at all!' : totalWon > 0 ? 'Better than nothing!' : 'Tough luck this time!'} Ready for another round?`,
          eventKey
        );
      } else {
        // Other completion scenario
        sendMessage(
          `Game complete! You walked away with $${totalWon.toFixed(2)}. Smart play! Ready for another round?`,
          eventKey
        );
      }
    }
  }, [isFinished, gameId, revealedCells, sendMessage]);

  // Detect when user takes an offer (offer disappears and game becomes finished)
  useEffect(() => {
    const currentState = { isFinished, hasOffer, offerValue };
    const prevState = lastGameState.current;
    
    // Detect offer acceptance: had offer → no offer + finished
    if (prevState.hasOffer && prevState.offerValue && !currentState.hasOffer && currentState.isFinished) {
      const eventKey = `offer_taken_${gameId}_${prevState.offerValue}`;
      sendMessage(
        `Smart move! You took the $${prevState.offerValue.toFixed(2)} deal. Sometimes it's better to secure the win than risk it all. Well played!`,
        eventKey
      );
    }
    
    lastGameState.current = currentState;
  }, [isFinished, hasOffer, offerValue, gameId, sendMessage]);

  // Proactive offer commentary - comment on offers that have been sitting for a while
  useEffect(() => {
    if (isInNegotiation && hasOffer && offerValue && offerValue > 0) {
      const eventKey = `offer_comment_${gameId}_${offerValue}`;
      const timeoutId = setTimeout(() => {
        sendMessage(
          `Still thinking about that $${offerValue.toFixed(2)} offer? Don't take too long, I might change my mind...`,
          eventKey
        );
      }, 7000); // 7 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [isInNegotiation, hasOffer, offerValue, gameId, sendMessage]);

  // React to user starting the deal process
  useEffect(() => {
    if (isProcessingDeal) {
      const eventKey = `deal_processing_${gameId}`;
      sendMessage(
        `Let's see what we can do... one moment.`,
        eventKey
      );
    }
  }, [isProcessingDeal, gameId, sendMessage]);

  // React to user accepting an offer
  useEffect(() => {
    if (isAcceptingOffer) {
      const eventKey = `accepting_offer_${gameId}`;
      sendMessage(
        `A wise choice! Finalizing the deal now.`,
        eventKey
      );
    }
  }, [isAcceptingOffer, gameId, sendMessage]);

  // Start idle timer when component mounts or game state changes
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };
  }, [gameId, currentRound, isAwaitingVRF, isFinished, resetIdleTimer]);

  // Clear processed events when game changes
  useEffect(() => {
    processedEvents.current.clear();
    lastMessageTime.current = 0;
    lastOfferValue.current = null;
    lastGameState.current = { isFinished: false, hasOffer: false, offerValue: null };
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
  }, [gameId]);

  // Welcome message when no game is active and wallet needs connection
  useEffect(() => {
    if (!gameId && !processedEvents.current.has('wallet_prompt')) {
      if (!isConnected && !sessionStorage.getItem('sakura_wallet_prompt_shown')) {
        setTimeout(() => {
          addAIMessageToChat("Welcome! I'm Sakura, your game companion. To start playing, you'll need to connect your wallet first. Hit that connect button up there!");
          sessionStorage.setItem('sakura_wallet_prompt_shown', 'true');
        }, 1000);
        processedEvents.current.add('wallet_prompt');
      }
    }
  }, [gameId, isConnected, addAIMessageToChat]);

  // Celebrate wallet connection
  useEffect(() => {
    if (isConnected && !processedEvents.current.has('wallet_connected')) {
      const hasShownBefore = sessionStorage.getItem('sakura_wallet_celebration_shown');
      if (!hasShownBefore) {
        setTimeout(() => {
          addAIMessageToChat("Perfect! Wallet connected. Now we can have some real fun! Ready to try your luck with the secrets?");
          sessionStorage.setItem('sakura_wallet_celebration_shown', 'true');
        }, 1500);
        processedEvents.current.add('wallet_connected');
      }
    }
  }, [isConnected, addAIMessageToChat]);

  return null;
});

SakuraAI.displayName = 'SakuraAI';

export default SakuraAI; 