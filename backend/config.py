import os

# API Keys and credentials
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
AZURE_SPEECH_KEY = os.getenv('AZURE_SPEECH_KEY')
AZURE_SPEECH_REGION = os.getenv('AZURE_SPEECH_REGION')

# Directory setup
TEMP_DIR = "temp"
STATIC_DIR = "static"
MUSIC_DIR = "music"

# CORS settings
FRONTEND_ORIGIN = "http://localhost:3000"

# Ensure directories exist
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(MUSIC_DIR, exist_ok=True)

# Music tracks dictionary for local files
MUSIC_TRACKS = {
    'information': {
        'path': 'music/information.mp3',
        'name': 'Information',
        'category': 'Corporate'
    },
    'corporate1': {
        'path': 'music/corporate1.mp3',
        'name': 'Corporate Inspire',
        'category': 'Corporate'
    }
}
