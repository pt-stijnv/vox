import React, { useState } from 'react';
import './styles/index.css';
import Upload from './components/upload/Upload';
import TextEditor from './components/editor/TextEditor'; // You'll create this next

function App() {
    const [step, setStep] = useState('upload');
    const [segments, setSegments] = useState(null);
    const [uploadId, setUploadId] = useState(null);
    const [videoFilename, setVideoFilename] = useState(null);
    const [language, setLanguage] = useState('');
    const [glossaryStats, setGlossaryStats] = useState(null);

    const handleUpload = (segments, uploadId, videoFilename, language, glossaryStats) => {
        setSegments(segments);
        setUploadId(uploadId);
        setVideoFilename(videoFilename);
        setLanguage(language);
        setGlossaryStats(glossaryStats);
        setStep('editor');
    };

    return (
        <div className="app">
            {step === 'upload' && <Upload onUpload={handleUpload} />}
            {step === 'editor' && (
                <TextEditor
                    segments={segments}
                    uploadId={uploadId}
                    videoFilename={videoFilename}
                    language={language}
                    glossaryStats={glossaryStats}
                />
            )}
        </div>
    );
}

export default App;
