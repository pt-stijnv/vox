import React from 'react';
import { formatTime, parseTime, autoResizeTextarea } from '../../utils/formatters';

/**
 * Individual segment component
 * @param {Object} props - Component props
 * @param {Object} props.segment - Segment data
 * @param {number} props.index - Segment index
 * @param {boolean} props.isActive - Whether segment is currently active
 * @param {Function} props.onSegmentClick - Handler for segment click
 * @param {Function} props.onSegmentTextChange - Handler for segment text change
 * @param {Function} props.onSegmentTimeChange - Handler for segment time change
 * @returns {JSX.Element} - Segment component
 */
const Segment = ({ segment, index, isActive, onSegmentClick, onSegmentTextChange, onSegmentTimeChange }) => {
    const handleTextareaChange = (e) => {
        autoResizeTextarea(e.target);
        onSegmentTextChange(e, index);
    };

    const handleTimeChange = (e, type) => {
        onSegmentTimeChange(e, index, type);
    };

    return (
        <div
            className={`segment ${isActive ? 'current' : ''}`}
            onClick={() => onSegmentClick(index)}
        >
            <div className="segment-time-edit">
                <input
                    type="text"
                    className="time-input"
                    value={formatTime(segment.start)}
                    onChange={(e) => handleTimeChange(e, 'start')}
                    placeholder="00:00.000"
                />
                -
                <input
                    type="text"
                    className="time-input"
                    value={formatTime(segment.end)}
                    onChange={(e) => handleTimeChange(e, 'end')}
                    placeholder="00:00.000"
                />
            </div>

            <div className="segment-text-columns">
                <div className="segment-original-text">
                    <p>{segment.original_text}</p>
                </div>
                <div className="segment-translated-text">
                    <textarea
                        value={segment.translated_text}
                        onChange={handleTextareaChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Segment;
