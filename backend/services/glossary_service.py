# Dictionary to store the current glossary in memory
current_glossary = {}

def get_current_glossary():
    """Returns the current glossary dictionary"""
    return current_glossary

def set_current_glossary(glossary):
    """Sets the current glossary dictionary"""
    global current_glossary
    current_glossary = glossary

def process_glossary_data(glossary_data):
    """
    Process the glossary data into a more usable format.
    
    Args:
        glossary_data: Raw glossary data from JSON file
        
    Returns:
        Processed glossary dictionary and statistics
    """
    # Process the glossary into a more usable format
    processed_glossary = {}
    
    for entry in glossary_data:
        if 'id' in entry and 'translations' in entry:
            # Process each language pair
            translations = {}
            
            for source_lang, source_term in entry['translations'].items():
                # Skip empty translations
                if not source_term or not source_term.strip():
                    continue
                
                # Clean up language code (remove spaces, standardize format)
                source_lang = source_lang.strip()
                source_lang_base = source_lang.split('-')[0]  # Extract base language code
                
                # Add the source term to translations dict
                translations[source_lang_base] = source_term.strip()
            
            # Now create mappings between all language pairs
            for source_lang, source_term in translations.items():
                if source_lang not in processed_glossary:
                    processed_glossary[source_lang] = {}
                
                # Create mappings to all other languages
                for target_lang, target_term in translations.items():
                    if source_lang != target_lang:  # Skip self-mapping
                        if target_lang not in processed_glossary[source_lang]:
                            processed_glossary[source_lang][target_lang] = {}
                        
                        # Add the term mapping (preserve the original case)
                        processed_glossary[source_lang][target_lang][source_term.lower()] = target_term
    
    # Count the total number of terms across all language pairs
    total_terms = sum(
        len(terms) 
        for lang in processed_glossary.values() 
        for terms_dict in lang.values() 
        for terms in [terms_dict.keys()]
    )
    
    # Count number of language pairs
    lang_pairs = sum(len(target_langs) for target_langs in processed_glossary.values())
    
    # Generate a summary to return
    language_coverage = []
    for source_lang, target_dict in processed_glossary.items():
        for target_lang, terms in target_dict.items():
            language_coverage.append({
                "from": source_lang,
                "to": target_lang,
                "terms": len(terms)
            })
    
    # Create statistics summary
    stats = {
        "terms_count": total_terms,
        "language_pairs": lang_pairs,
        "coverage": language_coverage
    }
    
    return processed_glossary, stats

def apply_glossary_translations(text: str, source_language: str, target_language: str) -> str:
    """
    Apply glossary translations to a text based on specified source and target languages.
    
    Args:
        text: The text to process
        source_language: The source language code (e.g., 'en')
        target_language: The target language code (e.g., 'nl')
        
    Returns:
        Text with glossary terms replaced by their translations
    """
    global current_glossary
    
    # If no glossary is available or source and target languages are the same, return the original text
    if not current_glossary or source_language == target_language:
        return text
    
    # Check if we have translations for this language pair
    if source_language not in current_glossary or target_language not in current_glossary[source_language]:
        return text
    
    # Get the translations for this language pair
    translations = current_glossary[source_language][target_language]
    
    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Sort terms by length (descending) to replace longer terms first (prevents partial word replacements)
    terms = sorted(translations.keys(), key=len, reverse=True)
    
    # Find all terms in the text and store their positions and case information
    replacements = []
    for term in terms:
        start_pos = 0
        while True:
            # Find the term in the text (case-insensitive)
            pos = text_lower.find(term, start_pos)
            if pos == -1:
                break
                
            # Check if term is a whole word (has word boundaries)
            # Check before the term
            is_word_boundary_before = pos == 0 or not text_lower[pos-1].isalnum()
            # Check after the term
            end_pos = pos + len(term)
            is_word_boundary_after = end_pos >= len(text_lower) or not text_lower[end_pos].isalnum()
            
            if is_word_boundary_before and is_word_boundary_after:
                # Get the actual term from the original text to preserve case
                original_term = text[pos:pos + len(term)]
                
                # Determine replacement case
                if original_term.isupper():
                    # All uppercase
                    replacement = translations[term].upper()
                elif original_term[0].isupper() and not original_term.isupper():
                    # First letter capitalized
                    replacement = translations[term][0].upper() + translations[term][1:]
                else:
                    # Use as-is
                    replacement = translations[term]
                
                replacements.append((pos, end_pos, replacement))
            
            start_pos = pos + 1  # Continue search after current position
    
    # Apply replacements in reverse order (to prevent position shifts)
    replacements.sort(reverse=True)
    result = text
    for start, end, replacement in replacements:
        result = result[:start] + replacement + result[end:]
    
    return result
