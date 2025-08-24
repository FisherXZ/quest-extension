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
});

    // Inject content script into Quest website
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('myquestspace.com') || tab.url.includes('quest-api-edz1.onrender.com'))) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
        }).catch(err => console.log('Content script injection failed:', err));
    }
}); 