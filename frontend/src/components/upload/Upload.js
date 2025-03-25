import React, { useState, useRef, useCallback } from 'react';
import { LANGUAGES } from '../../utils/constants';
import { uploadVideo } from '../../utils/api';
import UploadIcon from './UploadIcon';
import GlossaryUpload from './GlossaryUpload';
import InfoIcon from '../common/InfoIcon';
import ProgressBar from '../common/ProgressBar';

/**
 * Main upload component
 * @param {Object} props - Component props
 * @param {Function} props.onUpload - Callback when upload is complete
 * @returns {JSX.Element} - Upload component
 */
const Upload = ({ onUpload }) => {
    const [video, setVideo] = useState(null);
    const [language, setLanguage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [totalProgress, setTotalProgress] = useState(0);
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [useGlossary, setUseGlossary] = useState(false);
    const [glossaryStats, setGlossaryStats] = useState(null);

    const handleSubmit = async (event) => {
        if (event) {
            event.stopPropagation();
        }

        if (!video || !language) {
            alert("Please select a video and language.");
            return;
        }

        setUploading(true);
        setTotalProgress(0);
        setProcessingStage('Processing');

        try {
            // Define progress distribution for each stage
            // Upload: 0-15%, Processing: 15-40%, Analysis: 40-60%, Translation: 60-95%, Finalizing: 95-100%
            const progressPhases = {
                upload: { start: 0, end: 15 },
                processing: { start: 15, end: 40 },
                analysis: { start: 40, end: 60 },
                translation: { start: 60, end: 95 },
                finalizing: { start: 95, end: 100 }
            };

            // Handle upload progress
            const handleProgress = (progressEvent) => {
                // Calculate upload progress percentage
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

                // Map the upload progress to the first phase (0-15%)
                const mappedProgress = Math.min(
                    progressPhases.upload.start +
                    (percentCompleted / 100) * (progressPhases.upload.end - progressPhases.upload.start),
                    progressPhases.upload.end
                );

                setTotalProgress(Math.floor(mappedProgress));

                // At 100% upload, update to processing phase
                if (percentCompleted === 100) {
                    setProcessingStage('Processing');

                    // Simulate progress for remaining phases
                    let currentPhase = 'processing';
                    let currentProgress = progressPhases.processing.start;

                    const simulateProgress = () => {
                        if (currentProgress >= 95) {
                            clearInterval(progressInterval);
                            return;
                        }

                        currentProgress += 0.5;

                        // Phase transitions - standard progression without retry messaging
                        if (currentProgress >= progressPhases.processing.end && currentPhase === 'processing') {
                            currentPhase = 'analysis';
                            setProcessingStage('Analyzing content');
                        } else if (currentProgress >= progressPhases.analysis.end && currentPhase === 'analysis') {
                            currentPhase = 'translation';
                            setProcessingStage('Translating content');
                        } else if (currentProgress >= progressPhases.translation.end && currentPhase === 'translation') {
                            currentPhase = 'finalizing';
                            setProcessingStage('Finalizing');
                        }

                        setTotalProgress(Math.floor(currentProgress));
                    };

                    const progressInterval = setInterval(simulateProgress, 100);
                }
            };

            // Upload video
            const response = await uploadVideo(video, language, useGlossary, handleProgress);

            // Set final progress
            setTotalProgress(100);
            setProcessingStage('Complete');

            // Pass data to parent component with the selected language
            onUpload(response.data.segments, response.data.upload_id, response.data.video_filename, language, glossaryStats);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("An error occurred during upload.");
        } finally {
            setUploading(false);
            setTotalProgress(0);
            setProcessingStage('');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setVideo(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            setVideo(droppedFile);
            setFileName(droppedFile.name);
        }
    }, []);

    const handleGlossaryUploaded = (stats) => {
        setGlossaryStats(stats);
    };

    const handleToggleGlossary = (e) => {
        e.stopPropagation(); // Prevent triggering file dialog
        setUseGlossary(!useGlossary);
    };

    return (
        <div
            className={`upload-container ${isDragging ? 'dragging' : ''}`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <h1 className="app-title">Video Translation Tool</h1>
            <UploadIcon className="upload-icon" />
            <h2 className="upload-title">Upload your video</h2>
            <p className="upload-description">Drag & drop a video file here or click to browse</p>
            <p className="upload-description">Supported formats: .mp4, .mov, .mp3, .wav, .aac (5 seconds to 10 minutes, single language speech)</p>

            <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="upload-input"
                ref={fileInputRef}
            />
            {fileName && <div className="file-name">{fileName}</div>}

            {uploading && (
                <ProgressBar
                    progress={totalProgress}
                    stage=""
                    detailedStage={processingStage}
                />
            )}

            <div className="upload-configuration">
                <div className="upload-buttons-container">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={uploading}
                        className="language-select"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={(e) => handleSubmit(e)}
                        className="translate-button"
                        disabled={uploading || !video || !language}
                    >
                        {uploading ? "Processing..." : "Translate"}
                    </button>
                </div>

                <div className="terminology-toggle-container" onClick={(e) => e.stopPropagation()}>
                    <label className="terminology-switch">
                        <input
                            type="checkbox"
                            checked={useGlossary}
                            onChange={handleToggleGlossary}
                            disabled={uploading}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="terminology-label">
                        Use Translation Terminology
                        <InfoIcon tooltip="Ensure specific terms are translated consistently and according to your organization's standards." />
                    </span>
                </div>

                {useGlossary && (
                    <div className="terminology-section" onClick={(e) => e.stopPropagation()}>
                        <GlossaryUpload onGlossaryUploaded={handleGlossaryUploaded} />
                    </div>
                )}

                {/* Terminology Status Badge - shows when terminology is active */}
                {glossaryStats && (
                    <div className="terminology-badge" onClick={(e) => e.stopPropagation()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="terminology-badge-icon">
                            <path d="M0 0h24v24H0z" fill="none" />
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>{glossaryStats.terms_count} terms active</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
