import React, { useState, useRef } from 'react';
import { MUSIC_LIBRARY } from '../../utils/constants';
import { getMusicPreview } from '../../utils/api';

/**
 * Music selector component with inline play buttons
 * @param {Object} props - Component props
 * @param {Function} props.onMusicSelected - Handler for music selection
 * @param {string} props.selectedMusic - Currently selected music
 * @param {number} props.musicVolume - Music volume (0-1)
 * @param {Function} props.onVolumeChange - Handler for volume change
 * @returns {JSX.Element} - Music selector component
 */
const MusicSelector = ({ onMusicSelected, selectedMusic, musicVolume, onVolumeChange }) => {
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const audioRef = useRef(null);

    // Function to handle play/pause for preview
    const handlePlayPreview = async (trackId) => {
        // If the same track is clicked again, toggle play/pause
        if (playingTrackId === trackId) {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(err => console.error("Error playing audio:", err));
            } else {
                audioRef.current.pause();
            }
            return;
        }

        // Stop current playback if there is one
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }

        // Don't try to play "No Music" option
        if (trackId === 'none') {
            setPlayingTrackId(null);
            return;
        }

        try {
            // Request the preview from the backend
            const response = await getMusicPreview(trackId);
            const audioUrl = URL.createObjectURL(response.data);

            // Set new audio source and play
            audioRef.current.src = audioUrl;
            audioRef.current.volume = 0.8; // Set preview volume to 80%
            audioRef.current.load();
            await audioRef.current.play();
            setPlayingTrackId(trackId);

            // Handle when audio finishes playing
            audioRef.current.onended = () => {
                setPlayingTrackId(null);
            };
        } catch (err) {
            console.error("Error loading preview:", err);
            setPlayingTrackId(null);
        }
    };

    // Function to render the play button status
    const renderPlayButtonStatus = (trackId) => {
        // "No Music" option doesn't have a play button
        if (trackId === 'none') {
            return null;
        }

        return (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlayPreview(trackId);
                }}
                className="music-play-button"
                aria-label={playingTrackId === trackId ? "Pause" : "Play"}
            >
                {playingTrackId === trackId ? (
                    // Pause icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                ) : (
                    // Play icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                )}
            </button>
        );
    };

    return (
        <div className="voice-selector-container">
            <label htmlFor="music-select">Background Music:</label>
            <div className="music-select-container">
                <select
                    id="music-select"
                    value={selectedMusic}
                    onChange={(e) => onMusicSelected(e.target.value)}
                    className="voice-select"
                >
                    {MUSIC_LIBRARY.map(track => (
                        <option key={track.id} value={track.id} className="music-option">
                            {track.name}
                        </option>
                    ))}
                </select>
                
                {/* Music track play buttons displayed next to the select */}
                <div className="music-play-buttons">
                    {MUSIC_LIBRARY.find(track => track.id === selectedMusic) && 
                     selectedMusic !== 'none' && 
                     renderPlayButtonStatus(selectedMusic)}
                </div>
                
                {/* Hidden audio element for playing previews */}
                <audio ref={audioRef} />
            </div>

            {selectedMusic !== 'none' && (
                <div className="volume-preview-controls">
                    <div className="volume-control compact">
                        <span className="volume-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={musicVolume * 100}
                            onChange={(e) => onVolumeChange(e.target.value / 100)}
                            className="volume-slider"
                        />
                        <span className="volume-percentage">{Math.round(musicVolume * 100)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicSelector;
