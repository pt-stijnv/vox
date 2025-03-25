from typing import Optional

def get_voice_for_language(language_code: str, voice_style: Optional[str] = None) -> str:
    """
    Maps language codes to appropriate Azure voices.
    
    Args:
        language_code: ISO language code (e.g., 'en', 'es', 'fr')
        voice_style: Optional voice style/gender preference
        
    Returns:
        Azure voice name
    """
    # Default voices for each language (you can expand this list)
    voice_map = {
        'en': {
            'female1': 'en-US-JennyNeural',
            'female2': 'en-US-AriaNeural',
            'male1': 'en-US-GuyNeural',
            'male2': 'en-US-DavisNeural',
            'default': 'en-US-JennyNeural'
        },
        'es': {
            'female1': 'es-ES-ElviraNeural',
            'female2': 'es-ES-AbrilNeural',
            'male1': 'es-ES-AlvaroNeural',
            'male2': 'es-ES-ArnauNeural',
            'default': 'es-ES-ElviraNeural'
        },
        'fr': {
            'female1': 'fr-FR-DeniseNeural',
            'female2': 'fr-FR-EloiseNeural',
            'male1': 'fr-FR-HenriNeural',
            'male2': 'fr-FR-AlainNeural',
            'default': 'fr-FR-DeniseNeural'
        },
        'nl': {
            'female1': 'nl-NL-ColetteNeural',
            'female2': 'nl-NL-FennaNeural',
            'male1': 'nl-NL-MaartenNeural',
            'default': 'nl-NL-ColetteNeural'
        }
    }
    
    # Get voice map for the requested language, or default to English
    language_voices = voice_map.get(language_code, voice_map['en'])
    
    # Return the requested voice style or default
    if voice_style and voice_style in language_voices:
        return language_voices[voice_style]
    
    return language_voices['default']
