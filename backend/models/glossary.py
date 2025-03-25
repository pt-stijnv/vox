from pydantic import BaseModel
from typing import Dict, List, Any, Optional

class GlossaryEntry(BaseModel):
    id: str
    translations: Dict[str, str]

class GlossaryUploadResponse(BaseModel):
    message: str
    terms_count: int
    language_pairs: int
    coverage: List[Dict[str, Any]]

class LanguagePair(BaseModel):
    from_lang: str
    to_lang: str
    terms: int
