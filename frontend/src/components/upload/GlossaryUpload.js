import React, { useState, useRef } from 'react';
import { uploadGlossary } from '../../utils/api';

/**
 * Glossary upload component - Auto-upload on file selection
 * @param {Object} props - Component props
 * @param {Function} props.onGlossaryUploaded - Callback when glossary is uploaded
 * @returns {JSX.Element} - Glossary upload component
 */
const GlossaryUpload = ({ onGlossaryUploaded }) => {
    const [glossaryFile, setGlossaryFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleGlossaryUpload = async (file) => {
        if (!file) {
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading terminology...');

        try {
            const response = await uploadGlossary(file);
            setUploadStatus('Terminology uploaded successfully!');

            // Notify parent component that glossary was uploaded successfully
            if (onGlossaryUploaded) {
                onGlossaryUploaded(response.data);
            }
        } catch (error) {
            console.error("Terminology upload failed:", error);
            setUploadStatus(`Upload failed: ${error.response?.data?.detail || error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setGlossaryFile(selectedFile);
            handleGlossaryUpload(selectedFile);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="glossary-upload-container">
            <div className="glossary-upload-area" onClick={triggerFileInput}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '2.5em', height: '2.5em' }}>
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <p>{uploading ? "Uploading..." : "Click to select a terminology file"}</p>
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="upload-input"
                    ref={fileInputRef}
                    disabled={uploading}
                />
                {glossaryFile && <div className="file-name">{glossaryFile.name}</div>}
            </div>

            {uploadStatus && (
                <div className={`glossary-status ${uploadStatus.includes('failed') ? 'error' : 'success'}`}>
                    {uploadStatus}
                </div>
            )}
        </div>
    );
};

export default GlossaryUpload;
