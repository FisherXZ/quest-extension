// STT Service Module - OpenAI Whisper Integration
// Simple direct API implementation for testing

/**
 * Transcribe audio using OpenAI Whisper API (direct integration)
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeAudioWithWhisper(audioBlob) {
    try {
        console.log('🎤 Starting Whisper transcription...');
        
        // Get OpenAI API key from config file
        const openai_api_key = window.CONFIG?.OPENAI_API_KEY;
        
        if (!openai_api_key) {
            throw new Error('OpenAI API key not found in config. Please check config.js file.');
        }
        
        // Create FormData for OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'whisper-1');  // OpenAI's hosted Whisper model
        // Omit language to enable auto-detection (supports 100+ languages)
        formData.append('response_format', 'json');
        
        console.log('🔄 Sending audio to OpenAI Whisper API...', {
            audioSize: audioBlob.size,
            audioType: audioBlob.type
        });
        
        // Call OpenAI Whisper API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openai_api_key}`
                // Don't set Content-Type - browser handles FormData automatically
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Request failed'}`);
        }
        
        const result = await response.json();
        const transcribedText = result.text;
        
        console.log('✅ Whisper transcription successful:', transcribedText);
        
        return transcribedText;
        
    } catch (error) {
        console.error('❌ Whisper transcription failed:', error);
        throw error; // Re-throw for caller to handle
    }
}

// Export functions for use in popup.js
window.STTService = {
    transcribeAudioWithWhisper
}; 