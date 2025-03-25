// API Endpoints
export const API_BASE_URL = 'http://localhost:8000';

// Define voice options for different languages
export const VOICE_OPTIONS = {
    en: [
        { value: 'en-US-JennyNeural', label: 'Jenny (Female)' },
        { value: 'en-US-AriaNeural', label: 'Aria (Female)' },
        { value: 'en-US-GuyNeural', label: 'Guy (Male)' },
        { value: 'en-US-DavisNeural', label: 'Davis (Male)' }
    ],
    es: [
        { value: 'es-ES-ElviraNeural', label: 'Elvira (Female)' },
        { value: 'es-ES-AbrilNeural', label: 'Abril (Female)' },
        { value: 'es-ES-AlvaroNeural', label: 'Alvaro (Male)' },
        { value: 'es-ES-ArnauNeural', label: 'Arnau (Male)' }
    ],
    fr: [
        { value: 'fr-FR-DeniseNeural', label: 'Denise (Female)' },
        { value: 'fr-FR-EloiseNeural', label: 'Eloise (Female)' },
        { value: 'fr-FR-HenriNeural', label: 'Henri (Male)' },
        { value: 'fr-FR-AlainNeural', label: 'Alain (Male)' }
    ],
    nl: [
        { value: 'nl-NL-ColetteNeural', label: 'Colette (Female)' },
        { value: 'nl-NL-FennaNeural', label: 'Fenna (Female)' },
        { value: 'nl-NL-MaartenNeural', label: 'Maarten (Male)' }
    ]
};

// Available languages
export const LANGUAGES = [
    { value: '', label: 'Select Language' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'en', label: 'English' },
    { value: 'nl', label: 'Dutch' }
];

// Music library using local files
export const MUSIC_LIBRARY = [
    { id: 'none', name: 'No Music', category: 'None' },
    { id: 'information', name: 'Information', category: 'Corporate' },
    { id: 'corporate1', name: 'Corporate Inspire', category: 'Corporate' },
    { id: 'ambient1', name: 'Calm Atmosphere', category: 'Ambient' },
    { id: 'technology1', name: 'Tech Innovation', category: 'Technology' }
];
