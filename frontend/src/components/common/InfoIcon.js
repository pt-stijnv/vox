import React from 'react';

/**
 * Info icon component with tooltip
 * @param {Object} props - Component props
 * @param {string} props.tooltip - Tooltip text
 * @returns {JSX.Element} - Info icon with tooltip
 */
const InfoIcon = ({ tooltip }) => (
    <div className="info-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="info-icon">
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
        <span className="tooltip">{tooltip}</span>
    </div>
);

export default InfoIcon;
