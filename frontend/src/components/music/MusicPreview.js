import React, { useState, useRef, useEffect } from 'react';
import { getMusicPreview } from '../../utils/api';

/**
 * Music preview modal component
 * @param {Object} props - Component props
 * @param {string} props.trackId - ID of the music track to preview
 * @param {Function} props.onClose - Handler for close button click
 * @returns {JSX.Element} - Music preview modal component
 */
const MusicPreview = ({ trackId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                setLoading(true);
                // Request the preview from the backend
                const response = await getMusicPreview(trackId);
                const audioUrl = URL.createObjectURL(response.data);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.load();
                    audioRef.current.play().catch(e => {
                        console.error("Error playing audio:", e);
                        setError("Couldn't play audio. Please try again.");
                    });
                }
            } catch (err) {
                console.error("Error loading preview:", err);
                setError(`Failed to load music preview: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadPreview();

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, [trackId]);

    return (
        <div className="music-preview-modal">
            <div className="music-preview-content">
                <div className="music-preview-header">
                    <h4>Music Preview</h4>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="music-preview-body">
                    {loading ? (
                        <div className="preview-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading preview...</span>
                        </div>
                    ) : error ? (
                        <div className="preview-error">{error}</div>
                    ) : (
                        <div className="preview-player">
                            <audio ref={audioRef} controls className="audio-player">
                                Your browser does not support the audio element.
                            </audio>
                            <p className="preview-note">This is a 15-second preview of the full track.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicPreview;
