import React from 'react';

/**
 * Progress bar component
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.stage - Current processing stage
 * @param {string} props.detailedStage - Detailed description of current stage
 * @param {number} props.currentSegment - Current segment being processed
 * @param {number} props.totalSegments - Total number of segments
 * @returns {JSX.Element} - Progress bar with stage information
 */
const ProgressBar = ({ progress, stage, detailedStage, currentSegment = 0, totalSegments = 0 }) => {
    return (
        <div className="progress-container">
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            {stage && <div className="progress-stage">{stage}</div>}
            {detailedStage && <div className="progress-text">{detailedStage}</div>}
            {totalSegments > 0 && currentSegment > 0 && (
                <div className="progress-segment">
                    Processing: {currentSegment}/{totalSegments}
                </div>
            )}
            <div className="progress-percentage">{progress}%</div>
        </div>
    );
};

export default ProgressBar;
