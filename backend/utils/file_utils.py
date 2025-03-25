import os
import uuid
from pathlib import Path
from fastapi import UploadFile
import config

async def save_upload_file(file: UploadFile, directory: str = config.TEMP_DIR) -> str:
    """
    Saves an uploaded file to the specified directory with a unique filename.
    
    Args:
        file: The uploaded file
        directory: Directory to save the file in
        
    Returns:
        The path to the saved file
    """
    # Generate a unique ID for this upload
    upload_id = str(uuid.uuid4())
    file_path = os.path.join(directory, f"{upload_id}_{file.filename}")
    
    # Ensure the directory exists
    os.makedirs(directory, exist_ok=True)
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    return file_path, upload_id

async def get_music_file_path(music_id: str) -> str:
    """
    Gets the absolute path to a local music file.
    
    Args:
        music_id: ID of the music track
        
    Returns:
        Absolute path to the local music file
    """
    if music_id not in config.MUSIC_TRACKS:
        raise ValueError(f"Unknown music track ID: {music_id}")
    
    # Get the relative path from the dictionary
    relative_path = config.MUSIC_TRACKS[music_id]['path']
    
    # Convert to absolute path using the current working directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level since we're in utils/
    base_dir = os.path.dirname(base_dir)
    absolute_path = os.path.join(base_dir, relative_path)
    
    print(f"Looking for music file at: {absolute_path}")
    
    # Check if file exists
    if not os.path.exists(absolute_path):
        # Try alternate locations if the first attempt fails
        alternate_locations = [
            os.path.join(os.getcwd(), relative_path),             # Current working directory
            os.path.join(os.path.dirname(os.getcwd()), relative_path)  # Parent directory
        ]
        
        for alt_path in alternate_locations:
            print(f"Trying alternate location: {alt_path}")
            if os.path.exists(alt_path):
                print(f"Found music file at alternate location: {alt_path}")
                return alt_path
                
        # If we get here, we couldn't find the file
        raise FileNotFoundError(f"Music file not found at {absolute_path} or any alternate locations")
    
    print(f"Found music file at: {absolute_path}")
    return absolute_path
