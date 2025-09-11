# 🎤 OpenAI Whisper STT Integration - Simplified Implementation Plan

## 📋 Focus: Two HIGH PRIORITY Action Items

Based on the comprehensive OpenAI Whisper research, here's our focused implementation plan:

---

## 🎯 **[HIGH PRIORITY] Action Item 1: Replace Simulation with Real STT Service**

### **Current Implementation Gap**
- **Location**: `popup.js` lines 967-969 and 1086-1111
- **Current Code**: Uses `simulateTranscription()` with hardcoded Lorem ipsum text
- **Gap**: No actual OpenAI Whisper API integration

### **OpenAI Whisper Implementation Requirements**

Based on the research articles, here are the specific implementation details:

#### **Option 1: Direct OpenAI Whisper API Integration (Recommended)**
```javascript
// Replace simulateTranscription() function at line 1086
async function transcribeAudioWithWhisper(audioBlob) {
    const commentTextarea = document.getElementById('insightComment');
    
    try {
        // Show processing state
        commentTextarea.placeholder = 'Processing transcription with Whisper...\nAny thoughts?';
        showMessage('Transcribing audio with OpenAI Whisper...', false);
        
        // Get OpenAI API key from secure storage
        const { openai_api_key } = await chrome.storage.local.get('openai_api_key');
        
        if (!openai_api_key) {
            throw new Error('OpenAI API key not configured. Please add your API key.');
        }
        
        // Create FormData for Whisper API (following OpenAI documentation)
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'whisper-1');  // OpenAI's hosted Whisper model
        formData.append('language', 'en');      // Optional: specify language or use auto-detect
        formData.append('response_format', 'json'); // Get structured response
        
        console.log('🔄 Sending audio to OpenAI Whisper API...');
        
        // Call OpenAI Whisper API directly
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openai_api_key}`
                // Don't set Content-Type for FormData - browser handles it
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI Whisper API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const result = await response.json();
        const transcribedText = result.text;
        
        console.log('✅ Whisper transcription successful:', transcribedText);
        
        // Append transcribed text to textarea (following existing pattern)
        const currentText = commentTextarea.value;
        if (currentText.trim()) {
            commentTextarea.value = currentText + '\n\n' + transcribedText;
        } else {
            commentTextarea.value = transcribedText;
        }
        
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
        showMessage('Transcription completed!', false);
        
    } catch (error) {
        console.error('❌ Whisper transcription error:', error);
        
        // Enhanced error handling based on OpenAI API patterns
        let errorMessage = 'Transcription failed: ';
        if (error.message.includes('API key')) {
            errorMessage = 'Please configure your OpenAI API key to use voice transcription.';
        } else if (error.message.includes('quota') || error.message.includes('billing')) {
            errorMessage = 'OpenAI API quota exceeded. Please check your billing.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
        } else {
            errorMessage += error.message;
        }
        
        showMessage(errorMessage, true);
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
    }
}
```

#### **Option 2: Backend Proxy Integration (More Secure)**
```javascript
// Alternative: Route through your backend to hide API keys
async function transcribeAudioViaBackend(audioBlob) {
    const commentTextarea = document.getElementById('insightComment');
    
    try {
        commentTextarea.placeholder = 'Processing transcription...\nAny thoughts?';
        showMessage('Transcribing audio...', false);
        
        // Get user session for backend authentication
        const session = await chrome.storage.local.get('quest_user_session');
        const accessToken = session.quest_user_session?.access_token;
        
        if (!accessToken) {
            throw new Error('Authentication required for transcription service');
        }
        
        // Create FormData following existing backend patterns
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.wav');
        formData.append('model', 'whisper-1');
        formData.append('language', 'auto'); // Let Whisper detect language
        
        console.log('🔄 Sending audio to backend Whisper service...');
        
        // Send to your backend STT endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/stt/transcribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
                // Backend handles OpenAI API key securely
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `STT service error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Expected backend response format (following your API patterns)
        if (!result.success) {
            throw new Error(result.message || 'STT processing failed');
        }
        
        const transcribedText = result.data.transcription || result.data.text;
        
        // Insert transcribed text following existing pattern
        const currentText = commentTextarea.value;
        if (currentText.trim()) {
            commentTextarea.value = currentText + '\n\n' + transcribedText;
        } else {
            commentTextarea.value = transcribedText;
        }
        
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
        showMessage('Transcription completed!', false);
        
        console.log('✅ Backend STT transcription successful');
        
    } catch (error) {
        console.error('❌ Backend STT processing failed:', error);
        
        const errorMessage = error.message.includes('Authentication') 
            ? 'Please log in to use voice transcription'
            : `Transcription failed: ${error.message}`;
            
        showMessage(errorMessage, true);
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
    }
}
```

### **Key Implementation Details from Research**

**OpenAI Whisper API Specifications:**
- **Endpoint**: `https://api.openai.com/v1/audio/transcriptions`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data` (FormData)
- **Authentication**: `Bearer ${api_key}` in Authorization header
- **File Size Limit**: 25MB maximum
- **Supported Formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Model**: `whisper-1` (OpenAI's hosted version)

**Required FormData Fields:**
- `file`: The audio file (required)
- `model`: `whisper-1` (required)
- `language`: ISO 639-1 code (optional, auto-detects if omitted)
- `response_format`: `json`, `text`, `srt`, `verbose_json`, `vtt` (optional)

---

## 🎯 **[HIGH PRIORITY] Action Item 2: Setup Backend STT Endpoint Integration**

### **Current Implementation Gap**
- **Location**: Backend API at `https://quest-api-edz1.onrender.com`
- **Current State**: No STT endpoint exists
- **Gap**: Need backend STT service endpoint that proxies to OpenAI Whisper

### **Backend Endpoint Specification**

Based on your existing API patterns and OpenAI Whisper requirements:

#### **Backend Implementation Requirements**

**Endpoint**: `POST /api/v1/stt/transcribe`

**Request Format:**
```javascript
// FormData structure the backend should expect
{
    audio_file: File,           // The recorded audio blob
    model: "whisper-1",         // OpenAI Whisper model
    language: "auto" | "en" | "es" | ..., // Language preference
    response_format: "json"     // Response format preference
}
```

**Response Format (Following Your API Patterns):**
```json
{
    "success": true,
    "message": "Transcription completed successfully",
    "data": {
        "transcription": "The transcribed text here...",
        "language": "en",
        "duration": 10.5,
        "model_used": "whisper-1"
    }
}
```

**Error Response Format:**
```json
{
    "success": false,
    "message": "Transcription failed: Invalid audio format",
    "error_code": "INVALID_AUDIO_FORMAT"
}
```

#### **Backend Security & Cost Considerations**

**API Key Management:**
- Store OpenAI API key securely in backend environment variables
- Never expose API key to frontend
- Implement rate limiting to control costs

**Authentication:**
- Use existing JWT Bearer token validation
- Ensure only authenticated users can access STT service

**File Handling:**
- Validate audio file size (max 25MB per OpenAI limits)
- Validate audio file formats
- Implement temporary file cleanup

**Cost Control:**
- Track usage per user for billing/limits
- Implement request rate limiting
- Consider caching for repeated audio (optional)

#### **Frontend Integration Code**

**Update mediaRecorder.onstop handler (line 963):**
```javascript
mediaRecorder.onstop = async () => {
    try {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('🎤 Recording stopped, processing with Whisper...');
        
        // Validate audio quality (from research: min 1KB, max 25MB)
        if (audioBlob.size < 1000) {
            throw new Error('Recording too short - please record for at least 1 second');
        }
        if (audioBlob.size > 25 * 1024 * 1024) {
            throw new Error('Recording too long - maximum 25MB supported');
        }
        
        // Choose implementation: direct API or backend proxy
        // await transcribeAudioWithWhisper(audioBlob);     // Option 1: Direct
        await transcribeAudioViaBackend(audioBlob);         // Option 2: Backend
        
    } catch (error) {
        console.error('❌ STT processing failed:', error);
        showMessage(`Transcription failed: ${error.message}`, true);
        
        // Reset UI state
        const commentTextarea = document.getElementById('insightComment');
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
        
    } finally {
        // Cleanup audio stream
        stream.getTracks().forEach(track => track.stop());
    }
};
```

---

## 🔧 **Implementation Strategy from Research**

### **Whisper Model Performance (from articles):**
- **tiny**: Fastest, lowest accuracy, good for real-time
- **base**: Default balance of speed/accuracy
- **small**: Better accuracy, moderate speed
- **medium**: High accuracy, slower
- **large**: Best accuracy, slowest

**Recommendation**: Use `whisper-1` (OpenAI's hosted model) which automatically optimizes performance.

### **Audio Optimization (from research):**
```javascript
// Enhanced audio recording settings for Whisper
const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
        sampleRate: 16000,        // Optimal for Whisper (from research)
        channelCount: 1,          // Mono reduces file size
        echoCancellation: true,   // Improve quality
        noiseSuppression: true,   // Reduce background noise
        autoGainControl: true     // Normalize volume
    }
});
```

### **Cost Considerations (from research):**
- OpenAI Whisper API pricing: $0.006 per minute
- File size limit: 25MB maximum
- Supported formats: wav, mp3, mp4, mpeg, mpga, m4a, webm

---

## 📋 **Implementation Checklist**

### **Frontend Changes:**
- [ ] Replace `simulateTranscription()` with `transcribeAudioWithWhisper()` or `transcribeAudioViaBackend()`
- [ ] Update `mediaRecorder.onstop` handler (line 963)
- [ ] Add audio quality validation
- [ ] Implement OpenAI API key storage (if using direct integration)
- [ ] Enhanced error handling for Whisper-specific errors

### **Backend Requirements (if using Option 2):**
- [ ] Create `POST /api/v1/stt/transcribe` endpoint
- [ ] Integrate OpenAI Whisper API
- [ ] Implement JWT authentication validation
- [ ] Add file upload handling (FormData/multipart)
- [ ] Implement error handling and response formatting
- [ ] Add rate limiting and cost controls

### **Testing Checklist:**
- [ ] Test with different audio formats (wav, mp3, webm)
- [ ] Test with various audio lengths (short, medium, long)
- [ ] Test error scenarios (network failures, invalid API key, file too large)
- [ ] Test multilingual audio (if needed)
- [ ] Test UI state management during processing

---

## 🚀 **Next Steps**

1. **Choose Implementation Approach:**
   - **Option 1 (Direct)**: Faster to implement, requires frontend API key management
   - **Option 2 (Backend)**: More secure, requires backend development

2. **Get OpenAI API Key:**
   - Sign up at https://platform.openai.com/
   - Generate API key from dashboard
   - Set up billing (Whisper API is pay-per-use)

3. **Implement & Test:**
   - Start with Option 1 for quick testing
   - Move to Option 2 for production security

4. **Deploy & Monitor:**
   - Track API usage and costs
   - Monitor transcription accuracy
   - Gather user feedback

**Ready to implement when you share the STT service repository!** 🎤 