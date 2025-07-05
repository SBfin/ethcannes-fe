import React, { useRef, useCallback, useEffect } from 'react';
import styles from '../styles/SakuraAvatar.module.css';

interface SakuraAvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

const SakuraAvatar: React.FC<SakuraAvatarProps> = ({ 
  size = 'medium',
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const playSakuraVideo = useCallback(() => {
    try {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Error playing Sakura video:', error);
    }
  }, []);

  const handleVideoLoad = () => {
    console.log('Sakura avatar video loaded successfully');
  };

  const handleVideoError = (e: any) => {
    console.error('Error loading Sakura avatar video:', e);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && videoRef.current) {
      videoRef.current.volume = 0;
      videoRef.current.muted = true;
      
      setTimeout(() => {
        playSakuraVideo();
      }, 1000);
    }
  }, [playSakuraVideo]);

  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
    xlarge: styles.xlarge
  }[size];

  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${className}`}>
      <div className={styles.avatarCircle}>
        <div className={styles.sakuraAvatar}>
          <video
            ref={videoRef}
            className={styles.sakuraVideo}
            src="/sounds/sakura-reel.mp4"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            loop
          />
        </div>
      </div>
    </div>
  );
};

export default SakuraAvatar; 