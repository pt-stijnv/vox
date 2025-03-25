from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import os
import numpy as np
from pydub import AudioSegment

# Import explicitly to ensure imports are available
from moviepy.editor import VideoFileClip, AudioFileClip

from models.request_models import DubbingRequest, FinalDubbingRequest
from services.speech import generate_speech_with_azure
from services.audio_processing import add_background_music
from services.video_processing import create_video_with_new_audio
from utils.voice_mapping import get_voice_for_language
from utils.file_utils import get_music_file_path
import config

router = APIRouter()

# Helper function to use a more flexible librosa import
def get_librosa():
    try:
        import librosa
        return librosa
    except ImportError as e:
        # If the specific pkg_resources error occurs
        if "pkg_resources" in str(e):
            print("WARNING: librosa import failed due to missing pkg_resources.")
            print("Attempting to install setuptools...")
            import subprocess
            try:
                subprocess.check_call(["pip", "install", "setuptools>=65.5.1"])
                import librosa
                return librosa
            except Exception as setup_error:
                print(f"Failed to install setuptools: {setup_error}")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to load required libraries. Please run 'pip install setuptools>=65.5.1' and try again."
                )
        else:
            # For other import errors
            print(f"Error importing librosa: {e}")
            raise HTTPException(status_code=500, detail=f"Error importing librosa: {str(e)}")

@router.post("/dub")
async def create_dubbed_video(data: Dict[str, Any]):
    """
    PASS 1: Create time-stretched audio segments for timing analysis. Returns time-adjusted segments, guaranteeing ABSOLUTELY NO overlap.
    """
    segments = data['segments']
    upload_id = data['upload_id']
    video_filename = data['video_filename']

    # Get librosa with error handling
    librosa = get_librosa()

    adjusted_segments = [] # To store time-adjusted segment data
    previous_segment_end = 0 # Track end time of previous segment

    # Process each segment for timing analysis (time-stretching)
    for i, segment in enumerate(segments): # Use index 'i' for lookahead
        start = segment['start'] * 1000  # Convert to ms
        end = segment['end'] * 1000
        dur_original = end - start
        translated_text = segment['translated_text']

        # Generate TTS audio (for timing analysis, we still need TTS duration info)
        # We'll use Azure TTS here instead of OpenAI
        voice_name = data.get('voice', get_voice_for_language(data.get('language', 'en'), data.get('voice_style', 'default')))
        tts_path = f"temp/tts_{upload_id}_{segment['id']}.mp3"
        
        success = generate_speech_with_azure(translated_text, tts_path, voice_name)
        if not success:
            return {"error": "TTS generation failed", "details": "Failed to generate speech for timing analysis"}

        # Load TTS audio using librosa for duration calculation and time stretching
        try:
            tts_audio_np, sr = librosa.load(tts_path, sr=None)
            dur_tts = librosa.get_duration(y=tts_audio_np, sr=sr) * 1000
        except Exception as e:
            print(f"Error processing audio with librosa: {e}")
            return {"error": "Audio processing failed", "details": f"Failed to analyze audio: {str(e)}"}

        adjusted_start = max(previous_segment_end, start) # Ensure segment starts AFTER previous segment ends
        adjusted_end = adjusted_start + dur_tts # Initial adjusted_end is WITHOUT stretching

        # FORCE ABSOLUTE Non-Overlap Time Stretching
        if i < len(segments) - 1:
            next_segment = segments[i+1]
            next_segment_start = next_segment['start'] * 1000
            max_allowed_end_time = next_segment_start # ABSOLUTE max end time - segment MUST end BEFORE next starts
            max_allowed_dur = max(0, max_allowed_end_time - adjusted_start) # Max duration to avoid overlap

            if dur_tts > max_allowed_dur and max_allowed_dur > 0: # Time stretch needed
                factor = dur_tts / max_allowed_dur
                factor = min(factor, 2.0) # Limit max stretch factor to 2.0 (adjust if needed)
                adjusted_tts_audio_np = librosa.effects.time_stretch(tts_audio_np, rate=factor)
                adjusted_dur_tts_stretched = librosa.get_duration(y=adjusted_tts_audio_np, sr=sr) * 1000
                adjusted_end = adjusted_start + adjusted_dur_tts_stretched # Update adjusted_end to stretched duration
                print(f"Segment {i+1} FORCED time-stretched by factor: {factor:.2f}, adjusted_end: {adjusted_end/1000:.2f}s")
            else:
                adjusted_end = adjusted_start + dur_tts # No stretch needed

            adjusted_end = min(adjusted_end, next_segment_start) # IMPORTANT: Clip adjusted_end to NEVER exceed next segment start


        adjusted_segments.append({ # Store adjusted timings
            "id": segment['id'],
            "start": adjusted_start / 1000, # Store in seconds
            "end": adjusted_end / 1000,     # Store in seconds
            "original_text": segment['original_text'],
            "translated_text": segment['translated_text']
        })
        previous_segment_end = adjusted_end # Update previous segment end time for next segment


    print("PASS 1: Time-adjusted segments generated (ABSOLUTE NON-OVERLAP GUARANTEED).")
    return {
        "message": "Time-adjusted segments generated (Pass 1)", 
        "adjusted_segments": adjusted_segments, 
        "upload_id": upload_id, 
        "video_filename": video_filename
    } # Return adjusted segments

@router.post("/dub_final")
async def create_final_dubbed_video(data: Dict[str, Any]):
    """
    PASS 2: Create the final dubbed video with natural TTS audio from Azure,
    using time-adjusted segments from Pass 1, with optional background music.
    """
    adjusted_segments = data['adjusted_segments']
    upload_id = data['upload_id']
    video_filename = data['video_filename']
    language = data.get('language', 'en')
    voice_style = data.get('voice_style', 'default')
    
    # Get background music settings
    background_music_id = data.get('background_music')
    music_volume = data.get('music_volume', 0.3)  # Default to 30% volume
    
    print(f"Background music ID: {background_music_id}")
    print(f"Music volume: {music_volume}")
    
    # Get specific voice name if provided, otherwise use the voice style
    voice_name = data.get('voice', get_voice_for_language(language, voice_style))
    
    # Make sure the video path is absolute
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level since we're in routes/
    base_dir = os.path.dirname(base_dir)
    video_path = os.path.join(base_dir, f"temp/{upload_id}_{video_filename}")
    
    print(f"Video path: {video_path}")

    # Load video to get total duration
    try:
        # Import only when needed to avoid potential circular imports
        from moviepy.editor import VideoFileClip
        video_clip = VideoFileClip(video_path)
        total_duration = video_clip.duration * 1000  # Convert to milliseconds
        # Close the clip to free up resources
        video_clip.close()
    except Exception as e:
        print(f"Error loading video: {e}")
        return {"error": "Video loading failed", "details": str(e)}
        
    silent_audio = AudioSegment.silent(duration=int(total_duration))

    # Process each segment using time-adjusted timings with Azure TTS
    for segment in adjusted_segments:
        start = int(segment['start'] * 1000)  # Use adjusted start time from Pass 1
        translated_text = segment['translated_text']

        # Generate TTS audio using Azure Speech Services
        tts_path = os.path.join(base_dir, f"temp/tts_{upload_id}_{segment['id']}.mp3")
        
        # Generate speech with Azure
        success = generate_speech_with_azure(translated_text, tts_path, voice_name)
        if not success:
            return {"error": "Failed to generate speech with Azure", "details": f"Segment {segment['id']} failed"}

        # Load TTS audio using pydub
        try:
            tts_audio = AudioSegment.from_file(tts_path)
        except Exception as e:
            print(f"Error loading TTS audio: {e}")
            return {"error": "Failed to load TTS audio", "details": str(e)}

        # Overlay TTS audio onto silent track using ADJUSTED START TIME from Pass 1
        silent_audio = silent_audio.overlay(tts_audio, position=start)

    # If background music is specified, add it now
    if background_music_id and background_music_id != 'none':
        try:
            print(f"Adding background music: {background_music_id}")
            
            # Get the local music file path (now with absolute path)
            music_path = await get_music_file_path(background_music_id)
            print(f"Music path resolved to: {music_path}")
            
            # Add background music with volume control
            print(f"Adding background music with volume {music_volume}")
            silent_audio = add_background_music(silent_audio, music_path, volume=float(music_volume))
            print("Background music added successfully")
            
        except Exception as e:
            print(f"Failed to add background music: {e}")
            import traceback
            traceback.print_exc()
            # Continue without music if there's an error
    else:
        print("No background music specified or 'none' was selected")
    
    # Export combined audio - make sure path is absolute
    combined_audio_path = os.path.join(base_dir, f"temp/combined_audio_{upload_id}.ogg")
    print(f"Exporting combined audio to: {combined_audio_path}")
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(combined_audio_path), exist_ok=True)
    
    try:
        # Change format to ogg
        silent_audio.export(combined_audio_path, format="ogg")
    except Exception as e:
        print(f"Error exporting combined audio: {e}")
        return {"error": "Failed to export combined audio", "details": str(e)}

    # Create dubbed video - make sure path is absolute
    dubbed_video_path = os.path.join(base_dir, f"static/dubbed_{upload_id}.mp4")
    print(f"Creating dubbed video at: {dubbed_video_path}")
    
    try:
        # Use the video processing service to create the dubbed video
        create_video_with_new_audio(video_path, combined_audio_path, dubbed_video_path)
        
        # Return URL to the dubbed video
        return {"dubbed_video_url": f"/static/dubbed_{upload_id}.mp4"}
    except Exception as e:
        print(f"Error creating dubbed video: {e}")
        import traceback
        traceback.print_exc()
        return {"error": "Failed to create dubbed video", "details": str(e)}
