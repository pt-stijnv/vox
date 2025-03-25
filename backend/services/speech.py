import os
import azure.cognitiveservices.speech as speechsdk
import config

def generate_speech_with_azure(text: str, output_path: str, voice_name: str) -> bool:
    """
    Generates speech using Azure Speech Services and saves to file.
    
    Args:
        text: Text to synthesize
        output_path: Path to save the output audio file
        voice_name: Azure voice name to use
        
    Returns:
        Boolean indicating success
    """
    try:
        # Configure Speech service
        speech_config = speechsdk.SpeechConfig(
            subscription=config.AZURE_SPEECH_KEY, 
            region=config.AZURE_SPEECH_REGION
        )
        
        # Set the voice
        speech_config.speech_synthesis_voice_name = voice_name
        
        # Configure audio output
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_path)
        
        # Create speech synthesizer
        speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, 
            audio_config=audio_config
        )
        
        # Generate speech
        result = speech_synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            print(f"Speech synthesized for text '{text}' and saved to '{output_path}'")
            return True
        else:
            print(f"Speech synthesis failed: {result.reason}")
            if result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = speechsdk.CancellationDetails(result)
                print(f"Speech synthesis canceled: {cancellation_details.reason}")
                print(f"Error details: {cancellation_details.error_details}")
            return False
    except Exception as e:
        print(f"Exception in TTS generation: {str(e)}")
        return False
