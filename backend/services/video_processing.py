import os
import sys
from pydub import AudioSegment

def create_video_with_new_audio(video_path, audio_path, output_path):
    """
    Creates a new video with the audio from audio_path.
    
    Args:
        video_path: Path to the video file
        audio_path: Path to the audio file
        output_path: Path to save the resulting video
        
    Returns:
        Path to the created video
    """
    try:
        # Import moviepy components explicitly within the function to avoid any import issues
        #from moviepy.editor import VideoFileClip, AudioFileClip
        from moviepy.video.io.VideoFileClip import VideoFileClip
        from moviepy.audio.io.AudioFileClip import AudioFileClip
        
        print(f"Loading video from: {video_path}")
        # Check if file exists
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        # Load the video
        video_clip = VideoFileClip(video_path)
        
        print(f"Loading audio from: {audio_path}")
        # Check if file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Load the audio
        audio_clip = AudioFileClip(audio_path)
        
        # Create the output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Set the audio to the video
        print("Adding audio to video...")
        try:
            # Try with set_audio first
            dubbed_video = video_clip.set_audio(audio_clip)
            print("Used set_audio method")
        except Exception as e1:
            print(f"set_audio failed: {str(e1)}")
            try:
                # Fall back to with_audio
                dubbed_video = video_clip.with_audio(audio_clip)
                print("Used with_audio method")
            except Exception as e2:
                print(f"with_audio failed: {str(e2)}")
                # Direct method
                video_clip.audio = audio_clip
                dubbed_video = video_clip
                print("Used direct audio assignment")
        
        # Write the resulting video
        print(f"Writing video to: {output_path}")
        dubbed_video.write_videofile(output_path, codec='libx264', audio_codec='aac')
        
        # Close the clips to release resources
        video_clip.close()
        audio_clip.close()
        if dubbed_video is not video_clip:
            dubbed_video.close()
        
        return output_path
    except NameError as ne:
        print(f"Name error: {ne}")
        print("Attempting alternative approach with moviepy...")
        
        # Try a different approach with subprocess
        try:
            import subprocess
            print("Using FFmpeg directly via subprocess")
            
            # Use ffmpeg directly
            cmd = [
                'ffmpeg', '-y',
                '-i', video_path,  # Input video
                '-i', audio_path,  # Input audio
                '-c:v', 'copy',    # Copy video codec
                '-c:a', 'aac',     # AAC audio codec
                '-map', '0:v',     # Use video from first input
                '-map', '1:a',     # Use audio from second input
                '-shortest',       # Finish encoding when the shortest input stream ends
                output_path        # Output file
            ]
            
            print(f"Running command: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)
            return output_path
            
        except Exception as sub_e:
            print(f"Subprocess approach failed: {sub_e}")
            raise
            
    except Exception as e:
        print(f"Error creating video with new audio: {e}")
        import traceback
        traceback.print_exc()
        raise
