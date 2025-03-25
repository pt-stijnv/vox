from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class Segment(BaseModel):
    id: int
    start: float
    end: float
    original_text: str
    translated_text: str

class DubbingRequest(BaseModel):
    segments: List[Segment]
    upload_id: str
    video_filename: str
    language: str
    voice: Optional[str] = None
    voice_style: Optional[str] = None

class FinalDubbingRequest(BaseModel):
    adjusted_segments: List[Segment]
    upload_id: str
    video_filename: str
    language: str
    voice: Optional[str] = None
    voice_style: Optional[str] = None
    background_music: Optional[str] = None
    music_volume: Optional[float] = 0.3

class GlossaryStats(BaseModel):
    terms_count: int
    language_pairs: int
    coverage: List[Dict[str, Any]]
