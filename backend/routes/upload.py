# --- START OF FILE routes/upload.py ---

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
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    # Define audio path with .mp3 extension
    audio_path = f"temp/audio_{upload_id}.mp3"
    print(f"Extracting audio to: {audio_path}")
    try:
        # Extract audio using the updated function (will save as MP3)
        extract_audio_from_video(video_path, audio_path)
        print("Audio extraction complete.")
    except Exception as e:
        print(f"Error during audio extraction: {e}")
        # Clean up saved video if audio extraction fails
        if os.path.exists(video_path):
            os.remove(video_path)
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")

    # Check if the extracted audio file exists before transcription
    if not os.path.exists(audio_path):
        print(f"Audio file {audio_path} not found after extraction attempt.")
        if os.path.exists(video_path):
             os.remove(video_path)
        raise HTTPException(status_code=500, detail="Audio extraction process did not create the expected file.")

    # Transcribe audio using OpenAI Whisper API with retry mechanism
    print(f"Starting OpenAI Transcription with retry mechanism for {audio_path}...")
    success, transcription_result, error_message = await transcription.transcribe_audio_with_retry(audio_path)

    if not success:
        print(f"All transcription attempts failed: {error_message}")
        # Clean up files if transcription fails
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {error_message}")

    print("OpenAI Transcription complete.")
    segments = transcription_result.segments
    print(f"Number of segments transcribed: {len(segments)}")

    # Determine the source language (assuming English for now, but could be detected from Whisper)
    # Whisper returns a language attribute in the transcription result
    source_language = transcription_result.language if hasattr(transcription_result, 'language') else "en"
    print(f"Detected source language: {source_language}")

    # Translate each segment using GPT-4 with glossary support
    translated_segments = []
    print("Starting Translation of Segments...")

    # Only use the glossary if the toggle is enabled
    current_glossary = glossary_service.get_current_glossary()
    has_glossary = bool(current_glossary) and use_glossary_bool

    for idx, segment_data in enumerate(segments):
        # Ensure we handle the segment data correctly (Whisper returns dict-like objects or Pydantic models)
        text = segment_data['text'] if isinstance(segment_data, dict) else segment_data.text
        start_time = segment_data['start'] if isinstance(segment_data, dict) else segment_data.start
        end_time = segment_data['end'] if isinstance(segment_data, dict) else segment_data.end

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
                "start": start_time,
                "end": end_time,
                "original_text": text,
                "translated_text": translated_text
            })
        except Exception as e:
            print(f"Error during Translation of segment {idx+1}: {e}")
            # Clean up files on error
            if os.path.exists(video_path):
                os.remove(video_path)
            if os.path.exists(audio_path):
                os.remove(audio_path)
            raise HTTPException(status_code=500, detail=f"Translation failed for segment {idx+1}: {str(e)}")

    print("Translation of all segments complete.")

    # Optionally remove the temporary audio file after successful processing
    # if os.path.exists(audio_path):
    #     try:
    #         os.remove(audio_path)
    #         print(f"Removed temporary audio file: {audio_path}")
    #     except OSError as e:
    #         print(f"Error removing temporary audio file {audio_path}: {e}")


    # Return segments and metadata to frontend
    print("Returning segments to frontend.")
    return {
        "segments": translated_segments,
        "upload_id": upload_id,
        "video_filename": video.filename
        # Optionally return source language if needed by frontend
        # "source_language": source_language
    }

# --- END OF FILE routes/upload.py ---