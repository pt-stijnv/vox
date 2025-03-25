import React from 'react';
import { VOICE_OPTIONS } from '../../utils/constants';

/**
 * Voice selector component
 * @param {Object} props - Component props
 * @param {string} props.selectedVoice - Currently selected voice
 * @param {string} props.language - Current language
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {Function} props.onVoiceChange - Handler for voice change
 * @returns {JSX.Element} - Voice selector component
 */
const VoiceSelector = ({ selectedVoice, language, disabled, onVoiceChange }) => {
    const voicesForLanguage = VOICE_OPTIONS[language] || VOICE_OPTIONS.en;
    
    return (
        <div className="voice-selector-container">
            <label htmlFor="voice-select">Select Voice:</label>
            <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                disabled={disabled}
                className="voice-select"
            >
                {voicesForLanguage.map(voice => (
                    <option key={voice.value} value={voice.value}>
                        {voice.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default VoiceSelector;
