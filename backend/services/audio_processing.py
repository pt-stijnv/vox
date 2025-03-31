# --- START OF FILE services/audio_processing.py ---

from pydub import AudioSegment
import os
import librosa
import numpy as np
# Ensure moviepy is imported if needed for extract_audio_from_video
try:
    from moviepy.editor import VideoFileClip
except ImportError:
    print("Warning: moviepy not found. Audio extraction from video might fail.")
    VideoFileClip = None # Define as None if import fails

def add_background_music(speech_audio, music_path, volume=0.3):
    """
    Adds background music to a speech audio track with intelligent volume ducking

    Args:
        speech_audio: The speech audio (pydub AudioSegment)
        music_path: Path to the music file
        volume: Music volume level (0.0 to 1.0)

    Returns:
        Mixed audio track
    """
    try:
        # Load the music
        music = AudioSegment.from_file(music_path)

        # Normalize both audio tracks
        target_dBFS = -20
        speech_audio = speech_audio.normalize(headroom=0.1)
        music = music.normalize(headroom=0.1)

        # Apply the user's volume preference to the music
        # Convert volume (0-1) to decibel reduction
        # At volume=1.0, apply -5dB reduction from normalized level
        # At volume=0.0, apply -30dB reduction from normalized level
        volume_db_reduction = -5 - ((1.0 - volume) * 25)
        music = music.apply_gain(volume_db_reduction)

        # Loop the music if needed
        if len(music) < len(speech_audio):
            # Calculate how many complete loops we need
            loops_needed = int(len(speech_audio) / len(music)) + 1
            looped_music = music * loops_needed
            # Trim to match speech length exactly
            music = looped_music[:len(speech_audio)]
        else:
            # Trim music to match speech length
            music = music[:len(speech_audio)]

        # Create a new silent audio segment to build the result
        mixed_audio = speech_audio.overlay(music)

        return mixed_audio

    except Exception as e:
        print(f"Error adding background music: {e}")
        # Return original speech if there's an error
        return speech_audio

def time_stretch_audio(audio_path, factor, output_path=None):
    """
    Time stretches audio using librosa.

    Args:
        audio_path: Path to the audio file
        factor: Stretch factor (>1 makes audio slower, <1 makes it faster)
        output_path: Optional path to save the stretched audio

    Returns:
        Path to the stretched audio file, or the audio data if output_path is None
    """
    # Load the audio file
    y, sr = librosa.load(audio_path, sr=None)

    # Apply time stretching
    y_stretched = librosa.effects.time_stretch(y, rate=factor)

    # If output path is provided, save the file
    if output_path:
        import soundfile as sf
        sf.write(output_path, y_stretched, sr)
        return output_path

    return y_stretched, sr

def extract_audio_from_video(video_path, audio_path):
    """
    Extracts audio from a video file using moviepy and saves as MP3.

    Args:
        video_path: Path to the video file
        audio_path: Path to save the extracted audio file (should end in .mp3)

    Returns:
        Path to the extracted audio file
    """
    if VideoFileClip is None:
         raise ImportError("moviepy is required for audio extraction but is not installed.")

    try:
        print(f"Extracting audio from '{video_path}' to '{audio_path}' using MP3 codec.")
        video_clip = VideoFileClip(video_path)
        # Ensure the directory exists
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        # Write audio using libmp3lame codec for MP3 format
        video_clip.audio.write_audiofile(audio_path, codec='libmp3lame')
        video_clip.close() # Close the clip to release resources
        print(f"Audio successfully extracted to {audio_path}")
        return audio_path
    except Exception as e:
        print(f"Error extracting audio: {e}")
        import traceback
        traceback.print_exc()
        # Attempt to close clip if it exists and an error occurred
        if 'video_clip' in locals() and video_clip:
            try:
                video_clip.close()
            except Exception as close_err:
                print(f"Error closing video clip during error handling: {close_err}")
        raise

# --- END OF FILE services/audio_processing.py ---