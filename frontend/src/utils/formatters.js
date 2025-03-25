/**
 * Format time in MM:SS.ms
 * @param {number} timeInSeconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds - Math.floor(timeInSeconds)) * 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

/**
 * Parse time string back to seconds
 * @param {string} timeString - Time string in MM:SS.ms format
 * @returns {number} - Time in seconds
 */
export const parseTime = (timeString) => {
    const parts = timeString.split(':');
    const minutes = parseInt(parts[0], 10);
    const secondsAndMs = parts[1].split('.');
    const seconds = parseInt(secondsAndMs[0], 10);
    const milliseconds = parseInt(secondsAndMs[1], 10);
    return minutes * 60 + seconds + milliseconds / 1000;
};

/**
 * Auto resize textarea to fit content
 * @param {HTMLTextAreaElement} textarea - The textarea element to resize
 */
export const autoResizeTextarea = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
};
