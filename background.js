// Quest Extension Background Service Worker
console.log('🎯 Quest Extension Background Service Worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Quest Extension installed');
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
    // You can add other functionality here
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.action === 'getCurrentTab') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ tab: tabs[0] });
        });
        return true; // Keep message channel open
    }
    
    // Handle website login synchronization
    if (request.action === 'syncLogin') {
        console.log('Sync login status:', request.user);
        chrome.storage.local.set({
            quest_user_session: {
                user: request.user,
                timestamp: Date.now()
            }
        });
        sendResponse({ success: true });
        return true;
    }
    
    // Handle website logout synchronization
    if (request.action === 'syncLogout') {
        console.log('Sync logout status');
        chrome.storage.local.remove('quest_user_session');
        sendResponse({ success: true });
        return true;
    }
    
    // Handle microphone permission request
    if (request.action === 'requestMicrophonePermission') {
        console.log('Requesting microphone permission from background script');
        
        // Use async/await pattern for better error handling
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Microphone permission granted in background');
                stream.getTracks().forEach(track => track.stop());
                sendResponse({ success: true, permission: 'granted' });
            } catch (error) {
                console.error('Microphone permission denied in background:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        
        return true; // Keep message channel open
    }
    
    // Handle audio transcription via background script (for better security)
    if (request.action === 'transcribeAudio') {
        console.log('Processing audio transcription in background script');
        
        (async () => {
            try {
                // Get OpenAI API key from storage or config
                // Note: In production, consider storing API key more securely
                const config = await chrome.storage.local.get('openai_config');
                const apiKey = config.openai_config?.api_key || 'your-api-key-here';
                
                if (!apiKey || apiKey === 'your-api-key-here') {
                    throw new Error('OpenAI API key not configured in background script');
                }
                
                // Convert base64 back to blob
                const base64Data = request.audioData;
                const byteCharacters = atob(base64Data);
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
                
                const audioBlob = new Blob(byteArrays, { type: 'audio/wav' });
                
                // Create FormData for OpenAI API
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.wav');
                formData.append('model', 'whisper-1');
                formData.append('response_format', 'json');
                
                console.log('🔄 Background: Sending audio to OpenAI Whisper API...');
                
                // Call OpenAI Whisper API
                const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                    throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Request failed'}`);
                }
                
                const result = await response.json();
                const transcription = result.text?.trim();
                
                if (!transcription) {
                    throw new Error('No transcription text received from OpenAI API');
                }
                
                console.log('✅ Background transcription successful!');
                sendResponse({ transcription });
                
            } catch (error) {
                console.error('❌ Background transcription failed:', error);
                sendResponse({ error: error.message });
            }
        })();
        
        return true; // Keep message channel open
    }
});

    // Inject content script into ALL websites (for microphone recording)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
        }).catch(err => console.log('Content script injection failed:', err));
    }
}); 