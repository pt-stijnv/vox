import React, { createContext, useState, useRef, useContext } from 'react';
import { getMusicPreview } from '../utils/api';

// Create the context
const AudioContext = createContext();

/**
 * Audio provider component for managing audio playback across components
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - Audio provider component
 */
export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // Initialize audio element
  if (!audioRef.current) {
    audioRef.current = new Audio();
    
    // Add event listeners
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentTrackId(null);
    };
    
    audioRef.current.onpause = () => {
      setIsPlaying(false);
    };
    
    audioRef.current.onplay = () => {
      setIsPlaying(true);
    };
    
    audioRef.current.onerror = () => {
      setError("Error playing audio");
      setIsPlaying(false);
    };
  }

  /**
   * Play a music track
   * @param {string} trackId - ID of the track to play
   * @param {number} volume - Volume level (0-1)
   * @returns {Promise} - Play result
   */
  const playTrack = async (trackId, volume = 0.8) => {
    // Don't try to play "No Music" option
    if (trackId === 'none') {
      stopPlayback();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Stop current playback if there is one
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // If it's the same track that's already selected, just toggle play/pause
      if (trackId === currentTrackId && audioRef.current.src) {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
        return;
      }

      // Request the preview from the backend
      const response = await getMusicPreview(trackId);
      const audioUrl = URL.createObjectURL(response.data);

      // Set new audio source and play
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.load();
      await audioRef.current.play();
      
      setCurrentTrackId(trackId);
    } catch (err) {
      console.error("Error loading or playing audio:", err);
      setError(`Failed to play audio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Stop current playback
   */
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
      setCurrentTrackId(null);
    }
  };

  /**
   * Set the volume level
   * @param {number} level - Volume level (0-1)
   */
  const setVolume = (level) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, level));
    }
  };

  // Context value
  const value = {
    isPlaying,
    currentTrackId,
    loading,
    error,
    playTrack,
    stopPlayback,
    setVolume
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Custom hook for using the audio context
 * @returns {Object} - Audio context value
 */
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;
