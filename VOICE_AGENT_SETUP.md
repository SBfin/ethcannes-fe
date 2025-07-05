# Voice Agent Setup with Deepgram

This app now includes a Deepgram-powered voice agent that allows users to control the scratcher game using voice commands!

## Features

- **Speech-to-Text**: Real-time voice command recognition
- **Text-to-Speech**: Voice responses and game narration
- **Game Control**: Voice commands for all game actions
- **Smart Recognition**: High-confidence command filtering

## Setup Instructions

### 1. Get a Deepgram API Key

1. Visit [console.deepgram.com](https://console.deepgram.com/)
2. Sign up for a free account
3. Create a new project
4. Generate an API key
5. Copy your API key

### 2. Configure the Voice Agent

1. Click the "🎤 Voice Agent" button in the top-right corner
2. Enter your Deepgram API key
3. Click "Activate"
4. Grant microphone permissions when prompted

### 3. Start Using Voice Commands

Click "🎤 Start Listening" and try these commands:

- **"Play"** or **"Start game"** - Start a new scratcher game
- **"Scratch"** or **"Reveal"** - Reveal all cells on the card
- **"Again"** or **"Play another"** - Start another game
- **"Balance"** - Check your current USDC balance

## Voice Commands

| Command | Aliases | Action |
|---------|---------|---------|
| Play | "start", "game" | Starts a new game |
| Scratch | "reveal" | Reveals the scratcher card |
| Again | "more", "another" | Plays another game |
| Balance | "money", "funds" | Announces current balance |

## Technical Details

### Speech Recognition
- Uses Deepgram Nova-2 model for high accuracy
- Real-time streaming with 300ms silence detection
- Confidence threshold of 70% for command execution
- Smart formatting and punctuation

### Voice Synthesis
- Uses Web Speech API for text-to-speech
- Automatically selects best available voice
- Provides game state announcements
- Win/lose narration

### Privacy
- Audio is processed in real-time
- No audio recordings are stored
- API key is stored locally in browser
- Connection secured with WSS

## Troubleshooting

**Microphone not working?**
- Check browser permissions
- Ensure HTTPS connection
- Try refreshing the page

**Commands not recognized?**
- Speak clearly and at normal pace
- Ensure quiet environment
- Check confidence scores in the UI

**API errors?**
- Verify your API key is correct
- Check Deepgram account limits
- Try resetting the API key

## Advanced Configuration

You can customize the voice agent behavior by modifying the `useDeepgramAgent` hook:

- **Model**: Change from 'nova-2' to other Deepgram models
- **Language**: Support multiple languages
- **Confidence**: Adjust threshold for command recognition
- **Commands**: Add custom voice commands

## Cost Considerations

Deepgram offers:
- **Free Tier**: $200 in credits
- **Pay-as-you-go**: $0.0043 per minute
- Typical scratcher session: ~$0.01-0.05

The voice agent is designed to be cost-efficient with smart silence detection and minimal continuous processing.

## Browser Compatibility

**Supported:**
- Chrome 25+
- Firefox 44+
- Safari 14+
- Edge 79+

**Requirements:**
- HTTPS connection
- Microphone access
- Modern Web APIs support

Enjoy your voice-controlled scratcher experience! 🎤🎰 