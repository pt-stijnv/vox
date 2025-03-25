from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
from services import transcription, translation, glossary_service
from services.audio_processing import extract_audio_from_video
from utils.file_utils import save_upload_file

router = APIRouter()

@router.post("/upload")
async def upload_video(
    video: UploadFile = File(...), 
    language: str = Form(...),
    use_glossary: str = Form(default="false")  # Add new parameter with default value
):
    print("Reached the /upload endpoint!")
    print(f"Filename received: {video.filename}")
    print(f"Language received: {language}")
    print(f"Use glossary: {use_glossary}")

    # Convert string 'true'/'false' to boolean
    use_glossary_bool = use_glossary.lower() == 'true'
    print(f"Use glossary (boolean): {use_glossary_bool}")

    try:
        # Save the uploaded video
        video_path, upload_id = await save_upload_file(video)
        print(f"Video saved to: {video_path}")
    except Exception as e:
        print(f"Error saving video file: {e}")
        return {"error": "Failed to save video", "details": str(e)}

    # Extract audio from video
    audio_path = f"temp/audio_{upload_id}.wav"
    print(f"Extracting audio to: {audio_path}")
    try:
        extract_audio_from_video(video_path, audio_path)
        print("Audio extraction complete.")
    except Exception as e:
        print(f"Error during audio extraction: {e}")
        return {"error": "Audio extraction failed", "details": str(e)}

    # Transcribe audio using OpenAI Whisper API with retry mechanism
    print("Starting OpenAI Transcription with retry mechanism...")
    success, transcription_result, error_message = await transcription.transcribe_audio_with_retry(audio_path)
    
    if not success:
        print(f"All transcription attempts failed: {error_message}")
        return {"error": "Transcription failed", "details": error_message}
    
    print("OpenAI Transcription complete.")
    segments = transcription_result.segments
    print(f"Number of segments transcribed: {len(segments)}")

    # Determine the source language (assuming English for now, but could be detected from Whisper)
    source_language = "en"  # Could be dynamic based on Whisper's language detection
    
    # Translate each segment using GPT-4 with glossary support
    translated_segments = []
    print("Starting Translation of Segments...")
    
    # Only use the glossary if the toggle is enabled
    current_glossary = glossary_service.get_current_glossary()
    has_glossary = bool(current_glossary) and use_glossary_bool
    
    for idx, segment in enumerate(segments):
        text = segment.text
        print(f"Translating segment {idx+1}/{len(segments)}: '{text}'")
        try:
            # Check if we have a glossary for this language pair
            glossary_available = (has_glossary and 
                                 source_language in current_glossary and 
                                 language in current_glossary[source_language] and 
                                 len(current_glossary[source_language][language]) > 0)
            
            # Apply glossary translations only if the toggle is enabled
            glossary_applied_text = glossary_service.apply_glossary_translations(text, source_language, language) if glossary_available else text
            
            # Translate the text
            translated_text = await translation.translate_text(
                text=text,
                source_language=source_language,
                target_language=language,
                glossary_applied_text=glossary_applied_text,
                glossary_available=glossary_available
            )
            
            print(f"Translation for segment {idx+1}: '{translated_text}'")
            translated_segments.append({
                "id": idx,
                "start": segment.start,
                "end": segment.end,
                "original_text": text,
                "translated_text": translated_text
            })
        except Exception as e:
            print(f"Error during Translation of segment {idx+1}: {e}")
            return {"error": "Translation failed", "details": str(e)}

    print("Translation of all segments complete.")

    # Return segments and metadata to frontend
    print("Returning segments to frontend.")
    return {
        "segments": translated_segments,
        "upload_id": upload_id,
        "video_filename": video.filename
    }
