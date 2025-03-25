from fastapi import APIRouter, UploadFile, File, HTTPException
import json
from services import glossary_service
from models.glossary import GlossaryUploadResponse

router = APIRouter()

@router.post("/upload-glossary", response_model=GlossaryUploadResponse)
async def upload_glossary(glossary_file: UploadFile = File(...)):
    """
    Uploads and processes a JSON terminology file.
    """
    try:
        # Read the glossary file
        content = await glossary_file.read()
        
        # Parse JSON content
        glossary_data = json.loads(content)
        
        # Process the glossary
        processed_glossary, stats = glossary_service.process_glossary_data(glossary_data)
        
        # Store the processed glossary
        glossary_service.set_current_glossary(processed_glossary)
        
        # Add a message to the stats
        stats["message"] = "Terminology uploaded successfully"
        
        return stats
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in the terminology file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing terminology: {str(e)}")
