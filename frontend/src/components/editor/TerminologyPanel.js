import React from 'react';

/**
 * Terminology information panel component
 * @param {Object} props - Component props
 * @param {Object} props.glossaryStats - Glossary statistics
 * @param {Function} props.onClose - Handler for close button click
 * @returns {JSX.Element} - Terminology panel component
 */
const TerminologyPanel = ({ glossaryStats, onClose }) => {
    if (!glossaryStats) {
        return null;
    }

    return (
        <div className="terminology-info-panel">
            <div className="terminology-info-header">
                <h3>Translation Terminology</h3>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="terminology-info-content">
                <p>Your translation is using <strong>{glossaryStats.terms_count}</strong> terminology entries to ensure consistent translation of specific terms.</p>
                <div className="terminology-coverage">
                    <h4>Language Coverage:</h4>
                    <ul>
                        {glossaryStats.coverage.map((item, index) => (
                            <li key={index}>
                                <span className="language-pair">{item.from} → {item.to}:</span> {item.terms} terms
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TerminologyPanel;
