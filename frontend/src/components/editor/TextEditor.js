import React, { useState, useRef, useEffect } from 'react';
import { parseTime, autoResizeTextarea } from '../../utils/formatters';
import { createDubbedVideo, createFinalDubbedVideo, downloadDubbedVideo } from '../../utils/api';
import { VOICE_OPTIONS } from '../../utils/constants';
import Segment from './Segment';
import VoiceSelector from './VoiceSelector';
import TerminologyPanel from './TerminologyPanel';
import MusicSelector from '../music/MusicSelector';
import ProgressBar from '../common/ProgressBar';

/**
 * Main text editor component
 * @param {Object} props - Component props
 * @param {Array} props.segments - Transcription segments
 * @param {string} props.uploadId - Upload ID
 * @param {string} props.videoFilename - Video filename
 * @param {string} props.language - Target language
 * @param {Object} props.glossaryStats - Glossary statistics
 * @returns {JSX.Element} - Text editor component
 */
const TextEditor = ({ segments, uploadId, videoFilename, language, glossaryStats }) => {
    const [editedSegments, setEditedSegments] = useState(segments);
    const [dubbing, setDubbing] = useState(false);
    const [dubbedVideoUrl, setDubbedVideoUrl] = useState(null);
    const textEditorRef = useRef(null);
    const [currentSegment, setCurrentSegment] = useState(0);
    // Progress tracking
    const downloadLinkRef = useRef(null);
    const [dubbingProgress, setDubbingProgress] = useState(0);
    const [dubbingStage, setDubbingStage] = useState('');
    const [dubbingDetailedStage, setDubbingDetailedStage] = useState('');
    // Segment progress tracking
    const [currentProcessingSegment, setCurrentProcessingSegment] = useState(0);
    const [totalSegments, setTotalSegments] = useState(0);
    // Voice selection
    const [selectedVoice, setSelectedVoice] = useState(
        language && VOICE_OPTIONS[language] ? VOICE_OPTIONS[language][0].value : 'en-US-JennyNeural'
    );
    // Terminology panel state
    const [showTerminologyInfo, setShowTerminologyInfo] = useState(false);
    // Music selection
    const [backgroundMusic, setBackgroundMusic] = useState('none');
    const [musicVolume, setMusicVolume] = useState(0.3); // 30% volume default

    // Update selected voice when language changes
    useEffect(() => {
        if (language && VOICE_OPTIONS[language] && VOICE_OPTIONS[language].length > 0) {
            setSelectedVoice(VOICE_OPTIONS[language][0].value);
        }
    }, [language]);

    const handleConfirm = async () => {
        setDubbing(true);
        setDubbingProgress(0);
        setDubbingStage('Creating translation');
        setDubbingDetailedStage('Processing content');
        setTotalSegments(editedSegments.length);

        try {
            // Define progress distribution for dubbing process
            // Initialization: 0-5%, First Phase: 5-50%, Second Phase: 50-95%, Finalization: 95-100%
            const progressPhases = {
                init: { start: 0, end: 5 },
                firstPhase: { start: 5, end: 50 },
                secondPhase: { start: 50, end: 95 },
                finalization: { start: 95, end: 100 }
            };

            // Initialize
            setDubbingProgress(progressPhases.init.end);
            await new Promise(resolve => setTimeout(resolve, 500)); // Short delay for UI update

            // PASS 1: First phase (more general terminology)
            setDubbingStage('Processing content');
            setDubbingDetailedStage('Preparing audio and video');

            // Simulate first phase progress
            const totalSegmentSteps = editedSegments.length;
            const progressPerSegment =
                (progressPhases.firstPhase.end - progressPhases.firstPhase.start) / totalSegmentSteps;

            for (let i = 0; i < totalSegmentSteps; i++) {
                setCurrentProcessingSegment(i + 1);
                const currentProgress = progressPhases.firstPhase.start + (progressPerSegment * i);
                setDubbingProgress(Math.floor(currentProgress));
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Add background music message if applicable
            if (backgroundMusic !== 'none') {
                setDubbingDetailedStage('Adding background music');
                // Small delay to show this stage
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Actual API call for PASS 1
            const pass1Response = await createDubbedVideo({
                segments: editedSegments,
                upload_id: uploadId,
                video_filename: videoFilename,
                language: language,
                voice: selectedVoice
            });

            const adjustedSegments = pass1Response.data.adjusted_segments;
            setDubbingProgress(progressPhases.firstPhase.end);

            // PASS 2: Second phase
            setDubbingStage('Creating final video');
            setDubbingDetailedStage('Synchronizing audio and video');

            // Simulate second phase progress
            const progressPerSegmentPhase2 =
                (progressPhases.secondPhase.end - progressPhases.secondPhase.start) / adjustedSegments.length;

            for (let i = 0; i < adjustedSegments.length; i++) {
                setCurrentProcessingSegment(i + 1);
                const currentProgress = progressPhases.secondPhase.start + (progressPerSegmentPhase2 * i);
                setDubbingProgress(Math.floor(currentProgress));
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Actual API call for PASS 2
            const pass2Response = await createFinalDubbedVideo({
                adjusted_segments: adjustedSegments,
                upload_id: uploadId,
                video_filename: videoFilename,
                language: language,
                voice: selectedVoice,
                background_music: backgroundMusic !== 'none' ? backgroundMusic : null,
                music_volume: musicVolume
            });

            setDubbingProgress(progressPhases.finalization.start);
            setDubbingStage('Finalizing');
            setDubbingDetailedStage('Preparing video for playback');

            // Set the video URL
            setDubbedVideoUrl(pass2Response.data.dubbed_video_url);
            setDubbingProgress(progressPhases.finalization.end);
            setDubbingStage('Complete');
            setDubbingDetailedStage('Your video is ready');

        } catch (error) {
            console.error("Dubbing failed:", error);
            alert("An error occurred while creating the dubbed video.");
        } finally {
            setTimeout(() => {
                setDubbing(false);
                setDubbingProgress(0);
                setDubbingStage('');
                setDubbingDetailedStage('');
                setCurrentProcessingSegment(0);
            }, 1000); // Keep progress bar visible slightly longer
        }
    };

    // Enhanced download function to force download instead of browser playback
    const handleDownload = async () => {
        if (dubbedVideoUrl) {
            try {
                // Get the video blob
                const blob = await downloadDubbedVideo(dubbedVideoUrl, uploadId);
                
                // Create a temporary URL for the blob
                const url = window.URL.createObjectURL(blob);

                // Set the download link's href to the blob URL
                downloadLinkRef.current.href = url;

                // Set the download attribute with filename
                downloadLinkRef.current.download = `dubbed_${uploadId}.mp4`;

                // Trigger the download
                downloadLinkRef.current.click();

                // Clean up the temporary URL
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            } catch (error) {
                console.error("Download failed:", error);
                alert("Failed to download the video. Please try again.");
            }
        }
    };

    const handleTextareaChange = (e, index) => {
        const newSegments = [...editedSegments];
        newSegments[index].translated_text = e.target.value;
        setEditedSegments(newSegments);
    };

    const handleTimeChange = (e, index, type) => {
        const newSegments = [...editedSegments];
        const timeValue = e.target.value;
        if (timeValue && /^\d{2}:\d{2}\.\d{3}$/.test(timeValue)) { // Basic time format validation
            const parsedTime = parseTime(timeValue);
            if (type === 'start') {
                newSegments[index].start = parsedTime;
            } else if (type === 'end') {
                newSegments[index].end = parsedTime;
            }
            setEditedSegments(newSegments);
        } else if (timeValue === "") {
            // Allow clearing the time, you might want to handle this differently
            if (type === 'start') {
                newSegments[index].start = 0; // Or null, or previous value, depending on your logic
            } else if (type === 'end') {
                newSegments[index].end = 0; // Or null, or previous value
            }
            setEditedSegments(newSegments);
        }
        // Optionally handle invalid format input - maybe revert to previous value or show an error
    };

    const toggleTerminologyInfo = () => {
        setShowTerminologyInfo(!showTerminologyInfo);
    };

    useEffect(() => {
        if (textEditorRef.current) {
            const textareas = textEditorRef.current.querySelectorAll('.segment textarea');
            textareas.forEach(textarea => {
                autoResizeTextarea(textarea);
            });
        }
    }, []);

    return (
        <div className="editor-container">
            <div className="editor-header">
                <h2 className="editor-title">Edit Translated Text</h2>

                <div className="editor-controls">
                    <VoiceSelector
                        selectedVoice={selectedVoice}
                        language={language}
                        disabled={dubbing}
                        onVoiceChange={setSelectedVoice}
                    />

                    {/* Terminology badge next to voice selector */}
                    {glossaryStats && (
                        <div className="terminology-indicator" onClick={toggleTerminologyInfo}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="terminology-indicator-icon">
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                            </svg>
                            <span>{glossaryStats.terms_count} terms active</span>
                        </div>
                    )}

                    {/* Add the MusicSelector inline with the voice selector */}
                    <MusicSelector
                        onMusicSelected={setBackgroundMusic}
                        selectedMusic={backgroundMusic}
                        musicVolume={musicVolume}
                        onVolumeChange={setMusicVolume}
                    />
                </div>
            </div>

            {showTerminologyInfo && glossaryStats && (
                <TerminologyPanel 
                    glossaryStats={glossaryStats} 
                    onClose={toggleTerminologyInfo} 
                />
            )}

            <div className="editor-content-area">
                <div className="editor-text-area" ref={textEditorRef}>
                    {editedSegments.map((segment, idx) => (
                        <Segment
                            key={idx}
                            segment={segment}
                            index={idx}
                            isActive={idx === currentSegment}
                            onSegmentClick={setCurrentSegment}
                            onSegmentTextChange={handleTextareaChange}
                            onSegmentTimeChange={handleTimeChange}
                        />
                    ))}
                </div>
                <div className="editor-video-area">
                    {dubbedVideoUrl ? (
                        <video
                            src={`http://localhost:8000${dubbedVideoUrl}`}
                            controls
                            width="100%"
                            height="auto"
                        />
                    ) : (
                        <div className="video-placeholder">
                            {dubbing ? (
                                <div className="dubbing-progress-container">
                                    <ProgressBar
                                        progress={dubbingProgress}
                                        stage={dubbingStage}
                                        detailedStage={dubbingDetailedStage}
                                        currentSegment={currentProcessingSegment}
                                        totalSegments={totalSegments}
                                    />
                                </div>
                            ) : (
                                <p>Video will appear here after dubbing</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="editor-button-container">
                {dubbedVideoUrl ? (
                    <>
                        <button className="translate-button download-button" onClick={handleDownload}>
                            Download Video
                        </button>
                        <a
                            ref={downloadLinkRef}
                            href="#"
                            style={{ display: 'none' }}
                        >
                            Download
                        </a>
                    </>
                ) : (
                    <button className="translate-button" onClick={handleConfirm} disabled={dubbing}>
                        {dubbing ? "Processing..." : "Confirm and Dub"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TextEditor;
