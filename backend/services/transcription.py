from typing import Tuple, Any
import time
import random
from openai import OpenAI
import config

# Initialize OpenAI client with your API key
client = OpenAI(api_key=config.OPENAI_API_KEY)

async def transcribe_audio_with_retry(audio_path: str, max_retries: int = 3) -> Tuple[bool, Any, str]:
    """
    Transcribe audio using OpenAI's Whisper API with retry mechanism.
    
    Args:
        audio_path: Path to the audio file
        max_retries: Maximum number of retry attempts
        
    Returns:
        Tuple containing:
            - Success status (bool)
            - Transcription result or None
            - Error message if failed (empty string if successful)
    """
    # Start with attempt 1
    attempt = 1
    last_error = ""
    
    while attempt <= max_retries:
        try:
            print(f"Transcription attempt {attempt}/{max_retries}...")
            
            with open(audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            
            print(f"Transcription successful on attempt {attempt}")
            return True, transcription, ""
            
        except Exception as e:
            last_error = str(e)
            error_type = type(e).__name__
            
            print(f"Transcription attempt {attempt} failed with {error_type}: {last_error}")
            
            if attempt < max_retries:
                # Calculate backoff time: 2^attempt * (0.5-1.5 seconds) to add jitter
                backoff_time = (2 ** attempt) * (0.5 + random.random())
                backoff_time = min(backoff_time, 15)  # Cap at 15 seconds max wait
                
                print(f"Retrying in {backoff_time:.2f} seconds...")
                time.sleep(backoff_time)
                attempt += 1
            else:
                print(f"All {max_retries} transcription attempts failed")
                return False, None, f"Transcription failed after {max_retries} attempts: {last_error}"
    
    # This should never be reached, but just in case
    return False, None, f"Transcription failed: {last_error}"
