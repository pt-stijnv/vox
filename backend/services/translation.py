from openai import OpenAI
import config

# Initialize OpenAI client with your API key
client = OpenAI(api_key=config.OPENAI_API_KEY)

async def translate_text(text: str, source_language: str, target_language: str, 
                        glossary_applied_text: str = None, glossary_available: bool = False) -> str:
    """
    Translates text using GPT-4o-mini with optional glossary support.
    
    Args:
        text: Original text to translate
        source_language: Source language code
        target_language: Target language code
        glossary_applied_text: Text with glossary terms already applied (if available)
        glossary_available: Whether a glossary is available for this language pair
        
    Returns:
        Translated text
    """
    # Prepare translation system prompt
    system_prompt = f"Translate the following text to {target_language}. Aim for a translation that is semantically accurate but also as concise as possible and similar in length to the original text, to help with video dubbing timing. Prioritize conciseness and timing-similarity where possible without sacrificing essential meaning."
    
    # Add glossary instructions if available
    if glossary_available:
        system_prompt += f" Use the specific terminology translations provided by the user when applicable, ensuring consistency with the approved translations. Check for both singular and plural forms of each term (e.g., in English, 'Policy, Policies' should be translated as 'Regel, Regels' in Dutch) and make this process case-insensitive. If a glossary is found, use it to guide the translation process, prioritizing the provided terms to ensure accuracy and uniformity."
    
    # For segments that had glossary terms applied, inform GPT that some terms have already been pre-translated
    user_prompt = text
    if glossary_applied_text and glossary_applied_text != text:
        user_prompt = f"Original: {text}\n\nSome terms have preferred translations that have already been applied: {glossary_applied_text}\n\nPlease provide the full translation incorporating these pre-translated terms."
    
    # Make the API call
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    # Extract and return the translated text
    translated_text = response.choices[0].message.content
    return translated_text
