// STT Service Module - OpenAI Whisper API Integration
// Direct API implementation optimized for Chrome extensions
// Based on proven local implementation and best practices

/**
 * Convert Base64 data URL to Blob
 * @param {string} base64Data - Base64 data URL (data:audio/wav;base64,...)
 * @param {string} mimeType - MIME type of the blob
 * @returns {Blob} - Audio blob
 */
function base64ToBlob(base64Data, mimeType) {
    // Remove data URL prefix if present
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    const byteCharacters = atob(base64String);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
}

/**
 * Convert Blob to Base64 data URL
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} - Base64 data URL
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Create FormData for OpenAI Whisper API
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {FormData} - Properly formatted FormData for API
 */
function createWhisperFormData(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    // Omit language parameter for auto-detection (supports 100+ languages)
    return formData;
}

/**
 * Validate audio file for Whisper API requirements
 * @param {Blob} audioBlob - The recorded audio blob
 * @throws {Error} - If validation fails
 */
function validateAudioFile(audioBlob) {
    if (!audioBlob) {
        throw new Error('Audio blob is required');
    }
    
    if (audioBlob.size === 0) {
        throw new Error('Audio file is empty');
    }
    
    // OpenAI Whisper API has a 25MB file size limit
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxSizeBytes) {
        const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
        throw new Error(`Audio file size (${sizeMB}MB) exceeds 25MB limit for OpenAI Whisper API`);
    }
    
    console.log('✅ Audio validation passed:', {
        size: `${(audioBlob.size / 1024).toFixed(2)}KB`,
        type: audioBlob.type || 'unknown'
    });
}

/**
 * Transcribe audio using OpenAI Whisper API (direct integration)
 * Enhanced version based on proven local implementation
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeAudioWithWhisper(audioBlob) {
    try {
        console.log('🎤 Starting Whisper transcription with direct API...');
        
        // Validate input
        validateAudioFile(audioBlob);
        
        // Get OpenAI API key from config file
        const openai_api_key = window.CONFIG?.OPENAI_API_KEY;
        
        if (!openai_api_key) {
            throw new Error('OpenAI API key not found in config. Please check config.js file.');
        }
        
        if (!openai_api_key.startsWith('sk-')) {
            throw new Error('Invalid OpenAI API key format. Key should start with "sk-"');
        }
        
        // Create FormData for OpenAI Whisper API (same pattern as local implementation)
        const formData = createWhisperFormData(audioBlob);
        
        console.log('🔄 Sending audio to OpenAI Whisper API...', {
            audioSize: `${(audioBlob.size / 1024).toFixed(2)}KB`,
            audioType: audioBlob.type || 'unknown',
            model: 'whisper-1',
            apiKeyPrefix: openai_api_key.substring(0, 8) + '...'
        });
        
        // Call OpenAI Whisper API (same endpoint as local implementation)
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openai_api_key}`
                // Don't set Content-Type - browser handles FormData automatically
            },
            body: formData
        });
        
        console.log('📥 API Response status:', response.status);
        
        if (!response.ok) {
            let errorMessage = 'Unknown API error';
            let errorDetails = null;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorData.message || errorMessage;
                errorDetails = errorData.error;
            } catch (parseError) {
                console.warn('Could not parse error response:', parseError);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            // Enhanced error handling based on local implementation
            console.error('❌ OpenAI API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                message: errorMessage,
                details: errorDetails
            });
            
            // Provide helpful error messages
            if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your API key in config.js');
            } else if (response.status === 429) {
                throw new Error('OpenAI API rate limit exceeded. Please try again later');
            } else if (response.status === 413) {
                throw new Error('Audio file too large. Maximum size is 25MB');
            } else {
                throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
            }
        }
        
        const result = await response.json();
        
        if (!result.text) {
            throw new Error('No transcription text received from OpenAI API');
        }
        
        const transcribedText = result.text.trim();
        
        console.log('✅ Whisper transcription successful!', {
            textLength: transcribedText.length,
            duration: result.duration || 'unknown',
            language: result.language || 'auto-detected'
        });
        
        console.log('📝 Transcribed text preview:', transcribedText.substring(0, 100) + (transcribedText.length > 100 ? '...' : ''));
        
        return transcribedText;
        
    } catch (error) {
        console.error('❌ Whisper transcription failed:', error);
        
        // Re-throw with enhanced error context
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Could not connect to OpenAI API. Please check your internet connection.');
        } else if (error.message.includes('API key')) {
            throw new Error(`Configuration error: ${error.message}`);
        } else {
            throw error; // Re-throw original error with context preserved
        }
    }
}

/**
 * Alternative: Transcribe via background script (for better security)
 * This approach moves the API key handling to the background script
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeAudioViaBackground(audioBlob) {
    try {
        console.log('🎤 Starting Whisper transcription via background script...');
        
        // Validate input
        validateAudioFile(audioBlob);
        
        // Convert blob to base64 for message passing
        const base64Audio = await blobToBase64(audioBlob);
        
        console.log('🔄 Sending audio to background script for API processing...');
        
        // Send to background script for API call
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'transcribeAudio',
                audioData: base64Audio,
                audioSize: audioBlob.size,
                audioType: audioBlob.type
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                
                if (response.transcription) {
                    console.log('✅ Background transcription successful!');
                    resolve(response.transcription);
                } else {
                    reject(new Error('No transcription received from background script'));
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Background transcription failed:', error);
        throw error;
    }
}

// Export functions for use in popup.js
window.STTService = {
    transcribeAudioWithWhisper,
    transcribeAudioViaBackground,
    
    // Utility functions (for advanced usage)
    base64ToBlob,
    blobToBase64,
    validateAudioFile
}; 