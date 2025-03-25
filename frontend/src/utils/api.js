import axios from 'axios';
import { API_BASE_URL } from './constants';

/**
 * Upload a video file for translation
 * @param {File} video - The video file to upload
 * @param {string} language - The target language
 * @param {boolean} useGlossary - Whether to use the glossary for translation
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - API response with segments, upload_id, and video_filename
 */
export const uploadVideo = async (video, language, useGlossary, onProgress) => {
    const formData = new FormData();
    formData.append('video', video);
    formData.append('language', language);
    formData.append('use_glossary', useGlossary ? 'true' : 'false');

    return await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
    });
};

/**
 * Upload a glossary file
 * @param {File} glossaryFile - The glossary file to upload
 * @returns {Promise} - API response with glossary statistics
 */
export const uploadGlossary = async (glossaryFile) => {
    const formData = new FormData();
    formData.append('glossary_file', glossaryFile);

    return await axios.post(`${API_BASE_URL}/upload-glossary`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Get a preview of a music track
 * @param {string} trackId - The ID of the music track
 * @returns {Promise} - API response with the preview audio
 */
export const getMusicPreview = async (trackId) => {
    return await axios.get(`${API_BASE_URL}/music-preview/${trackId}`, {
        responseType: 'blob'
    });
};

/**
 * Create a dubbed video (first pass)
 * @param {Object} data - The dubbing request data
 * @returns {Promise} - API response with adjusted segments
 */
export const createDubbedVideo = async (data) => {
    return await axios.post(`${API_BASE_URL}/dub`, data);
};

/**
 * Create the final dubbed video
 * @param {Object} data - The final dubbing request data
 * @returns {Promise} - API response with dubbed video URL
 */
export const createFinalDubbedVideo = async (data) => {
    return await axios.post(`${API_BASE_URL}/dub_final`, data);
};

/**
 * Download the dubbed video
 * @param {string} videoUrl - The URL of the dubbed video
 * @param {string} uploadId - The upload ID
 * @returns {Promise} - Blob of the video file
 */
export const downloadDubbedVideo = async (videoUrl, uploadId) => {
    const response = await fetch(`${API_BASE_URL}${videoUrl}`);
    const blob = await response.blob();
    return blob;
};
