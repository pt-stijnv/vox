from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pydub import AudioSegment
import config
from utils.file_utils import get_music_file_path

router = APIRouter()

@router.get("/music-preview/{track_id}")
async def get_music_preview(track_id: str):
    """
    Returns a 15-second preview of the specified local music track.
    
    Args:
        track_id: ID of the music track
        
    Returns:
        Audio file of the preview
    """
    if track_id not in config.MUSIC_TRACKS:
        raise HTTPException(status_code=404, detail=f"Music track ID not found: {track_id}")
    
    try:
        # Get the local music file path with absolute path
        music_path = await get_music_file_path(track_id)
        
        print(f"Creating preview for music file: {music_path}")
        
        # Create a 15-second preview
        preview_path = f"temp/preview_{track_id}.mp3"
        
        # Make sure the preview path is also absolute
        if not os.path.isabs(preview_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up one level since we're in routes/
            base_dir = os.path.dirname(base_dir)
            preview_path = os.path.join(base_dir, preview_path)
            
        print(f"Preview will be saved to: {preview_path}")
        
        # Ensure the temp directory exists
        os.makedirs(os.path.dirname(preview_path), exist_ok=True)
        
        # Load the music and take the first 15 seconds
        audio = AudioSegment.from_file(music_path)
        preview_duration = min(15000, len(audio))  # 15 seconds or the full track if shorter
        preview = audio[:preview_duration]
        
        # Add a fade out at the end
        preview = preview.fade_out(2000)  # 2-second fade out
        
        # Export the preview
        preview.export(preview_path, format="mp3")
        print(f"Preview created successfully at: {preview_path}")
        
        # Return the preview file
        return FileResponse(
            preview_path,
            media_type="audio/mpeg",
            filename=f"preview_{track_id}.mp3"
        )
        
    except FileNotFoundError as e:
        print(f"Music file not found error: {e}")
        raise HTTPException(status_code=404, detail=f"Music file not found: {str(e)}")
    except Exception as e:
        print(f"Error creating music preview: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create music preview: {str(e)}")
