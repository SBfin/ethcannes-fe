import { useCallback, useEffect, useRef, useState } from 'react';

export type SoundEffect = 'start-play' | 'scratch' | 'lose' | 'medium-win' | 'big-win' | 'loading-vrf';

interface AudioManager {
  playSound: (sound: SoundEffect, loop?: boolean, customVolume?: number) => void;
  stopSound: (sound: SoundEffect) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  isLoaded: boolean;
  isMuted: boolean;
  volume: number;
}

export const useAudio = (): AudioManager => {
  const audioCache = useRef<Map<SoundEffect, HTMLAudioElement>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.3); // Reduced default volume to 30%

  const handleLoad = useCallback(() => {
    // This function can be simplified as we only care about the final load
    const sounds: SoundEffect[] = ['start-play', 'scratch', 'lose', 'medium-win', 'big-win', 'loading-vrf'];
    const allLoaded = sounds.every(s => audioCache.current.get(s)?.readyState === 4);
    if (allLoaded && !isLoaded) {
      setIsLoaded(true);
      console.log('🔊 All audio files loaded successfully');
    }
  }, [isLoaded]);

  const handleError = useCallback((sound: SoundEffect) => (error: Event) => {
    console.warn(`⚠️ Failed to load audio: ${sound}`, error);
  }, []);

  // Preload all audio files
  useEffect(() => {
    const sounds: SoundEffect[] = ['start-play', 'scratch', 'lose', 'medium-win', 'big-win', 'loading-vrf'];
    const localAudioCache = new Map<SoundEffect, HTMLAudioElement>();

    sounds.forEach((sound) => {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = volume;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', handleLoad);
      audio.addEventListener('error', handleError(sound));
      
      audio.load();
      
      localAudioCache.set(sound, audio);
    });
    audioCache.current = localAudioCache;

    return () => {
      // Cleanup
      localAudioCache.forEach((audio, sound) => {
        if (audio) {
          audio.removeEventListener('canplaythrough', handleLoad);
          audio.removeEventListener('error', handleError(sound));
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
        }
      });
    };
  }, [volume, handleLoad, handleError]);

  const playSound = useCallback((sound: SoundEffect, loop: boolean = false, customVolume?: number) => {
    if (isMuted) return;

    const audio = audioCache.current.get(sound);
    if (!audio) {
      console.warn(`⚠️ Audio not found: ${sound}`);
      return;
    }

    try {
      // Reset audio to beginning
      audio.currentTime = 0;
      audio.volume = customVolume !== undefined ? Math.max(0, Math.min(1, customVolume)) : volume;
      audio.loop = loop;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`⚠️ Audio play failed for ${sound}:`, error);
          // This is expected on mobile browsers without user interaction
        });
      }
    } catch (error) {
      console.warn(`⚠️ Error playing audio ${sound}:`, error);
    }
  }, [isMuted, volume]);

  const stopSound = useCallback((sound: SoundEffect) => {
    const audio = audioCache.current.get(sound);
    if (!audio) {
      console.warn(`⚠️ Audio not found: ${sound}`);
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    } catch (error) {
      console.warn(`⚠️ Error stopping audio ${sound}:`, error);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    // Update all audio elements
    audioCache.current.forEach((audio) => {
      audio.volume = clampedVolume;
    });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  return {
    playSound,
    stopSound,
    setVolume,
    setMuted,
    isLoaded,
    isMuted,
    volume,
  };
}; 