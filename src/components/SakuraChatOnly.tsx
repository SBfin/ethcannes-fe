import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/SakuraChatOnly.module.css';
import { FaPaperPlane } from 'react-icons/fa';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isAIGenerated?: boolean;
  isStreaming?: boolean;
}

interface SakuraChatOnlyProps {
  lastGameResult?: any;
  gameState: string;
  userBalance: string;
  enhancedAIEnabled?: boolean;
  onInitializeAI?: (addMessage: (text: string) => void) => void;
  onUserMessage?: (text: string) => void;
}

const SakuraChatOnly: React.FC<SakuraChatOnlyProps> = ({
  lastGameResult,
  gameState,
  userBalance,
  enhancedAIEnabled = false,
  onInitializeAI,
  onUserMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAudioUrl = useRef<string | null>(null);

  // Deepgram Text-to-Speech function
  const speakText = useCallback(async (text: string) => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      console.warn('Deepgram API key not found');
      return;
    }

    try {
      const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-luna-en', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        
        // Clean up previous audio URL
        if (currentAudioUrl.current) {
          URL.revokeObjectURL(currentAudioUrl.current);
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudioUrl.current = audioUrl;
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.volume = 1.0; // Set volume to 100% for Sakura's voice
          audioRef.current.play().catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error with Deepgram TTS:', error);
    }
  }, []);

  const addMessage = useCallback((text: string, isUser: boolean, isAIGenerated = false, isStreaming = false) => {
    const newMessage: Message = {
      id: Date.now(),
      text: text,
      isUser: isUser,
      timestamp: new Date(),
      isAIGenerated,
      isStreaming,
    };
    
    setMessages(prev => [...prev, newMessage]);

    // If it's a Sakura message, make her speak it
    if (!isUser) {
      speakText(text);
    }

    if (isStreaming) {
      const words = text.split(' ').length;
      const animationDuration = words * 100 + 1000;
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, isStreaming: false } : m));
      }, animationDuration);
    }
  }, [speakText]);

  const addEnhancedAIMessage = useCallback((text: string) => {
    addMessage(text, false, true);
  }, [addMessage]);

  React.useEffect(() => {
    if (onInitializeAI) {
      onInitializeAI(addEnhancedAIMessage);
    }
  }, [onInitializeAI, addEnhancedAIMessage]);

  const generateSakuraResponse = useCallback(async (input: string): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      const fallbackResponses = [
        "Need that API key to chat properly...",
        "Set up OpenAI API to unlock my full personality!",
        "I'm more fun with the API key configured."
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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
              content: `You are Sakura, a sarcastic but charming AI companion for a blockchain scratch game. 
              Your personality: Witty, slightly sarcastic, but ultimately supportive. You make jokes about crypto, 
              gambling, and life in general. Keep responses short (1-2 sentences max) and conversational.
              Current game state: ${gameState}
              User balance: ${userBalance}
              Enhanced AI: ${enhancedAIEnabled ? 'enabled' : 'disabled'}`
            },
            {
              role: 'user',
              content: input
            }
          ],
          max_tokens: 100,
          temperature: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm thinking... give me a moment.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      const fallbackResponses = [
        "My AI brain is having a moment... typical.",
        "API's down? Great. Just great.",
        "Technical difficulties. How exciting.",
        "Well, this is awkward. Try again?",
        "Even I can't fix everything, darling."
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }, [gameState, userBalance, enhancedAIEnabled]);

  useEffect(() => {
    // Welcome message for new users (only once)
    if (messages.length === 0 && !sessionStorage.getItem('sakura-welcomed')) {
      addMessage("Hey sakura here, welcome. Ready to play?", false, false, true);
      sessionStorage.setItem('sakura-welcomed', 'true');
    }
  }, [addMessage, messages.length]);

  useEffect(() => {
    if (lastGameResult) {
      setTimeout(async () => {
        const prizeAmount = parseFloat(lastGameResult.prizeFormatted || '0');
        const symbols = lastGameResult.symbols?.join(', ') || 'mystery symbols';
        
        let gameResultInput = '';
        if (prizeAmount > 0) {
          gameResultInput = `Player just won ${lastGameResult.prizeFormatted} USDC! Symbols were: ${symbols}. React to this big win!`;
        } else {
          gameResultInput = `Player lost this round. Symbols were: ${symbols}. Encourage them to try again but be sarcastic about it.`;
        }
        
        const resultMessage = await generateSakuraResponse(gameResultInput);
        addMessage(resultMessage, false, false, true);
      }, 1500);
    }
  }, [lastGameResult, generateSakuraResponse, addMessage]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user's message to chat
    addMessage(inputText, true);

    if (onUserMessage) {
      // Let the central SakuraAI handle the response
      onUserMessage(inputText);
    } else {
      // Fallback to local OpenAI call if no handler provided (keeps old behaviour)
      const response = await generateSakuraResponse(inputText);
      addMessage(response, false, false, true);
    }

    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (currentAudioUrl.current) {
        URL.revokeObjectURL(currentAudioUrl.current);
      }
    };
  }, []);

  return (
    <div className={styles.chatOnlyContainer}>
      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.isUser ? styles.userMessage : styles.sakuraMessage}`}
          >
            <div className={styles.messageContent}>
              {message.isStreaming ? (
                message.text.split(' ').map((word, index) => (
                  <span 
                    key={index} 
                    className={styles.streamingWord} 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {word}{' '}
                  </span>
                ))
              ) : (
                message.text
              )}
            </div>
            <div className={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    
      <div className={styles.chatInputContainer}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message to Sakura..."
          className={styles.chatInput}
        />
        <button
          onClick={handleSendMessage}
          className={styles.sendButton}
          disabled={!inputText.trim()}
        >
          <FaPaperPlane />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default SakuraChatOnly; 