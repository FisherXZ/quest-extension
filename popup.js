// Quest Extension - Simplified Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Quest Extension loaded');
    
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const insightsForm = document.getElementById('insightsForm');
    const userInfo = document.getElementById('userInfo');
    const messageDiv = document.getElementById('message');
    
    // Initialize state
    let currentUser = null;
    
    // Use new backend API endpoints
    const API_BASE_URL = 'https://quest-api-edz1.onrender.com';
    
    // Google OAuth configuration
    const GOOGLE_CLIENT_ID = '103202343935-5dkesvf5dp06af09o0d2373ji2ccd0rc.apps.googleusercontent.com';
    const GOOGLE_SCOPES = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];
    
    // Show message
    function showMessage(message, isError = false) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = isError ? 'message error' : 'message success';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
    
    // Check if user is already logged in
    async function checkUserSession() {
        try {
            const session = await chrome.storage.local.get('quest_user_session');
            if (session.quest_user_session && session.quest_user_session.user) {
                const sessionData = session.quest_user_session;
                const now = Date.now();
                const sessionAge = now - sessionData.timestamp;
                
                // Check if session is still valid (24 hours)
                if (sessionAge < 24 * 60 * 60 * 1000) {
                    currentUser = sessionData.user;
                    showUserInterface();
                    loadUserTags();
                } else {
                    // Session expired, clear it
                    await chrome.storage.local.remove('quest_user_session');
                    showLoginInterface();
                }
            } else {
                showLoginInterface();
            }
        } catch (error) {
            console.error('Error checking session:', error);
            showLoginInterface();
        }
    }
    
    // Show login interface
    function showLoginInterface() {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        insightsForm.style.display = 'none';
        userInfo.style.display = 'none';
        
        // Hide user avatar on login page
        const userAvatar = document.getElementById('userAvatar');
        userAvatar.style.display = 'none';
    }

    // Update form fields with current tab information
    function updateFormFields() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                document.getElementById('insightUrl').value = tabs[0].url;
                document.getElementById('insightTitle').value = tabs[0].title || '';
            }
        });
    }

    // Show user interface
    function showUserInterface() {
        loginForm.style.display = 'none';
        signupForm.style.display = 'none';
        insightsForm.style.display = 'block';
        userInfo.style.display = 'block';
        
        // Update form fields with current tab information
        updateFormFields();
        
        // Hide "Visit My Space" button initially
        document.getElementById('visitMySpaceBtn').style.display = 'none';
        
        if (currentUser) {
            // Show user avatar
            const userAvatar = document.getElementById('userAvatar');
            const nickname = currentUser.nickname || currentUser.email.split('@')[0];
            
            // If user has profile picture (Google user), use it
            if (currentUser.picture) {
                userAvatar.innerHTML = `<img src="${currentUser.picture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                console.log('📸 Using Google profile picture:', currentUser.picture);
            } else {
                // Otherwise show first letter of nickname
                userAvatar.textContent = nickname.charAt(0).toUpperCase();
                console.log('🔤 Using fallback letter:', nickname.charAt(0).toUpperCase());
            }
            userAvatar.style.display = 'flex';
            userAvatar.style.cursor = 'pointer';
            
            // Add avatar click event
            userAvatar.onclick = () => {
                if (confirm('Are you sure you want to logout?')) {
                    handleLogout();
                }
            };
            
            userInfo.innerHTML = `
                <div class="user-info">
                </div>
            `;
        } else {
            // If no user info, hide avatar
            const userAvatar = document.getElementById('userAvatar');
            userAvatar.style.display = 'none';
        }
    }
    
    // Handle login
    async function handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showMessage('Please fill in email and password', true);
            return;
        }

        try {
            console.log('🔐 Attempting login with email:', email);
            
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('📥 Login response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Login failed';
                showMessage(errorMessage, true);
                return;
            }

            const result = await response.json();
            console.log('✅ Parsed login response:', result);
            
            if (result.success && result.data.access_token) {
                currentUser = {
                    id: result.data.user_id,
                    email: result.data.email,
                    access_token: result.data.access_token
                };
                
                console.log('👤 Current user set:', currentUser);
                
                // Save session with token
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                        access_token: result.data.access_token,
                        timestamp: Date.now()
                    }
                });
                
                console.log('✅ Session saved successfully');
                showUserInterface();
                showMessage('Login successful!');
            } else {
                showMessage('Login failed: No access token received', true);
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            showMessage(`Login failed: ${error.message}`, true);
        }
    }
    
    // Handle signup
    async function handleSignup(event) {
        event.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const nickname = document.getElementById('signupNickname').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (!email || !nickname || !password || !confirmPassword) {
            showMessage('Please fill in all fields', true);
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', true);
            return;
        }

        try {
            console.log('🔐 Attempting signup with email:', email);
            
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    nickname
                })
            });

            console.log('📥 Signup response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Registration failed';
                showMessage(errorMessage, true);
                return;
            }

            const result = await response.json();
            console.log('✅ Parsed signup response:', result);
            
            if (result.success && result.data.access_token) {
                currentUser = {
                    id: result.data.user.id,
                    email: result.data.user.email,
                    nickname: result.data.user.nickname,
                    access_token: result.data.access_token
                };
                
                console.log('👤 Current user set:', currentUser);
                
                // Save session with token
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                        access_token: result.data.access_token,
                        timestamp: Date.now()
                    }
                });
                
                console.log('✅ Session saved successfully');
                showUserInterface();
                showMessage('Registration successful!');
            } else {
                showMessage('Registration failed: No user data received', true);
            }
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            showMessage(`Registration failed: ${error.message}`, true);
        }
    }

    // Handle logout
    async function handleLogout() {
        try {
            // Get access token from storage
            const session = await chrome.storage.local.get('quest_user_session');
            const accessToken = session.quest_user_session?.access_token;
            
            if (accessToken) {
                // Call the backend signout API
                try {
                    await fetch(`${API_BASE_URL}/api/v1/auth/signout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    console.log('✅ Backend logout successful');
                } catch (error) {
                    console.error('Signout API error:', error);
                    // Continue with local logout even if API call fails
                }
            }
            
            // Clear local session
            await chrome.storage.local.remove('quest_user_session');
            currentUser = null;
            // Hide user avatar
            document.getElementById('userAvatar').style.display = 'none';
            showLoginInterface();
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Logout failed', true);
        }
    }
    
    // Handle Google OAuth authentication
    async function handleGoogleAuth() {
        console.log('🔐 Starting Google OAuth flow...');
        try {
            // Use Chrome extension's redirect URL
            const redirectUri = chrome.identity.getRedirectURL();
            console.log('🔄 Extension redirect URL:', redirectUri);
            
            // Generate state parameter for security
            const state = Math.random().toString(36).substring(7);
            
            // Build OAuth URL
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${GOOGLE_CLIENT_ID}&` +
                `response_type=code&` +
                `scope=${encodeURIComponent(GOOGLE_SCOPES.join(' '))}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `state=${state}&` +
                `access_type=offline&` +
                `prompt=consent`;
            
            console.log('📡 Launching Chrome identity OAuth flow...');
            
            const authResult = await chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            });
            
            console.log('✅ OAuth flow completed, result:', authResult);
            
            if (chrome.runtime.lastError) {
                console.error('❌ OAuth error:', chrome.runtime.lastError);
                showMessage('Google authentication failed: ' + chrome.runtime.lastError.message, true);
                return;
            }
            
            // Check if the result contains an error
            if (authResult.includes('error=')) {
                const errorUrl = new URL(authResult);
                const error = errorUrl.searchParams.get('error');
                const errorDescription = errorUrl.searchParams.get('error_description');
                console.error('❌ OAuth error in response:', error, errorDescription);
                showMessage(`OAuth error: ${error} - ${errorDescription}`, true);
                return;
            }
            
            // Extract authorization code from URL
            const url = new URL(authResult);
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');
            
            console.log('🔍 Extracted from OAuth response:');
            console.log('  - Authorization Code:', code ? 'Present' : 'Missing');
            console.log('  - State:', returnedState);
            console.log('  - Expected State:', state);
            
            // Verify state parameter
            if (returnedState !== state) {
                console.error('❌ State mismatch - possible CSRF attack');
                showMessage('Security error: State mismatch', true);
                return;
            }
            
            if (!code) {
                console.error('❌ No authorization code found in response');
                showMessage('No authorization code received from Google', true);
                return;
            }
            
            console.log('✅ Authorization code received successfully');
            
            // Exchange authorization code for user info using backend
            await exchangeCodeForUserInfo(code);
            
        } catch (error) {
            console.error('❌ Google auth error:', error);
            showMessage('Google authentication failed: ' + error.message, true);
        }
    }
    
    // Exchange authorization code for user info using backend API
    async function exchangeCodeForUserInfo(code) {
        console.log('🔄 Exchanging authorization code for user info...');
        try {
            // Call backend API to exchange code for user info
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    redirect_uri: chrome.identity.getRedirectURL()
                })
            });
            
            console.log('📥 Google auth response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Google authentication failed';
                showMessage(errorMessage, true);
                return;
            }
            
            const result = await response.json();
            console.log('✅ Google auth response:', result);
            
            if (result.success && result.data.access_token) {
                currentUser = {
                    id: result.data.user_id,
                    email: result.data.email,
                    nickname: result.data.nickname || result.data.email.split('@')[0],
                    picture: result.data.picture || null, // Google profile picture
                    access_token: result.data.access_token,
                    provider: 'google'
                };
                
                console.log('👤 Google user set:', currentUser);
                
                // Save session with token
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                        access_token: result.data.access_token,
                        timestamp: Date.now(),
                        provider: 'google'
                    }
                });
                
                console.log('✅ Google session saved successfully');
                showUserInterface();
                showMessage('Successfully logged in with Google!');
            } else {
                showMessage('Google authentication failed: No access token received', true);
            }
            
        } catch (error) {
            console.error('❌ Code exchange error:', error);
            showMessage('Google authentication failed: ' + error.message, true);
        }
    }
    
    // Selected tags array
    let selectedTags = [];
    
    // Update selected tags display
    function updateSelectedTagsDisplay() {
        // Remove all selected states
        document.querySelectorAll('.tag-option').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Add selected state for selected tags
        selectedTags.forEach(tag => {
            const tagElement = document.querySelector(`[data-tag="${tag}"]`);
            if (tagElement) {
                tagElement.classList.add('selected');
            }
        });
    }
    
    // Add tag
    function addTag(tag) {
        tag = tag.trim().toLowerCase();
        if (tag && !selectedTags.includes(tag)) {
            selectedTags.push(tag);
            updateSelectedTagsDisplay();
        }
    }
    
    // Remove tag
    function removeTag(tag) {
        selectedTags = selectedTags.filter(t => t !== tag);
        updateSelectedTagsDisplay();
    }
    
    // Global function for HTML to call
    window.removeTag = removeTag;
    
    // Handle save insight
    async function handleSaveInsight(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showMessage('Please login first', true);
            return;
        }
        
        const url = document.getElementById('insightUrl').value;
        const title = document.getElementById('insightTitle').value;
        const thought = document.getElementById('insightComment').value;
        
        if (!url) {
            showMessage('Please enter page URL', true);
            return;
        }

        try {
            // Get access token from storage
            const session = await chrome.storage.local.get('quest_user_session');
            const accessToken = session.quest_user_session?.access_token;
            
            if (!accessToken) {
                showMessage('Session expired, please login again', true);
                return;
            }

            // Use new API endpoint for creating insight
            const response = await fetch(`${API_BASE_URL}/api/v1/insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    url: url,
                    thought: thought || '',
                    tag_ids: selectedTags // This will be updated to use actual tag IDs
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Server validation failed:', errorData);
                const errorMessage = errorData.detail || 'Save failed';
                showMessage(errorMessage, true);
                return;
            }

            const result = await response.json();
            console.log('Save insight result:', result);
            
            showMessage('Saved to collection!');
            document.getElementById('insightUrl').value = '';
            document.getElementById('insightTitle').value = '';
            document.getElementById('insightComment').value = '';
            // Clear selected tags
            selectedTags = [];
            updateSelectedTagsDisplay();
            
            // Show "Visit My Space" button after successful save
            const visitMySpaceBtn = document.getElementById('visitMySpaceBtn');
            visitMySpaceBtn.style.display = 'block';
            
        } catch (error) {
            console.error('Save insight error:', error);
            showMessage('Save failed, please try again', true);
        }
    }
    
    // Handle "Visit My Space" button click
    function handleVisitMySpace() {
        if (currentUser && currentUser.id) {
            const encodedUserId = encodeURIComponent(currentUser.id);
            const mySpaceUrl = `${API_BASE_URL}/my-space?user_id=${encodedUserId}`;
            chrome.tabs.create({ url: mySpaceUrl });
        }
    }
    

    
    // Voice recording state
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    // Check microphone permission status
    async function checkMicrophonePermission() {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            console.log('Current microphone permission state:', result.state);
            return result.state;
        } catch (error) {
            console.log('Permission API not supported, will request on demand');
            return 'unknown';
        }
    }



    // Handle voice input
    async function handleVoiceInput() {
        const voiceInputArea = document.getElementById('voiceInputArea');
        const recordingIndicator = document.getElementById('recordingIndicator');
        const commentTextarea = document.getElementById('insightComment');

        // Check if elements exist
        if (!voiceInputArea) {
            console.error('❌ voiceInputArea element not found');
            showMessage('Voice input element not found', true);
            return;
        }
        
        if (!recordingIndicator) {
            console.error('❌ recordingIndicator element not found');
            showMessage('Recording indicator element not found', true);
            return;
        }
        
        if (!commentTextarea) {
            console.error('❌ insightComment element not found');
            showMessage('Comment textarea not found', true);
            return;
        }

        if (!isRecording) {
            // Check permission status first
            const permissionState = await checkMicrophonePermission();
            console.log('Current permission state:', permissionState);
            
            if (permissionState === 'denied') {
                showMessage('Microphone access is blocked. Please enable it in chrome://settings/content/microphone', true);
                return;
            }
            
            // Start recording - request permission through content script
            try {
                console.log('🎤 Requesting microphone permission through content script...');
                
                // Try to get permission through content script first
                const permissionResult = await new Promise((resolve, reject) => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'requestMicrophonePermission' }, (response) => {
                                if (chrome.runtime.lastError) {
                                    console.log('Content script not available, trying direct request');
                                    resolve({ success: true }); // Fallback to direct request
                                } else {
                                    resolve(response);
                                }
                            });
                        } else {
                            console.log('No suitable tab found, trying direct request');
                            resolve({ success: true }); // Fallback to direct request
                        }
                    });
                });
                
                console.log('Permission result:', permissionResult);
                
                if (!permissionResult.success) {
                    throw new Error(permissionResult.error || 'Permission denied');
                }
                
                // Now try to get the stream in popup
                console.log('Testing microphone permission in popup...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true
                });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    console.log('🎤 Recording stopped, audio blob created:', audioBlob);
                    
                    // TODO: Send audioBlob to Whisper API for transcription
                    // For now, we'll simulate transcription
                    simulateTranscription(audioBlob);
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                
                // Update UI
                voiceInputArea.classList.add('recording');
                voiceInputArea.title = 'Click to Stop Recording';
                recordingIndicator.style.display = 'flex';
                commentTextarea.placeholder = 'Click to Stop Transcribing\nAny thoughts?';
                
                console.log('🎤 Recording started');
                showMessage('Recording started...', false);
                
            } catch (error) {
                console.error('❌ Error accessing microphone:', error);
                
                // Safely log error details
                try {
                    console.log('🔍 Error details:', {
                        name: error?.name || 'Unknown',
                        message: error?.message || 'Unknown error',
                        stack: error?.stack || 'No stack trace'
                    });
                    
                    // Log more detailed error information
                    if (error instanceof DOMException) {
                        console.log('DOMException details:', {
                            name: error.name,
                            message: error.message,
                            code: error.code
                        });
                    }
                    
                    // Log the full error object
                    console.log('Full error object:', error);
                    console.log('Error type:', typeof error);
                    console.log('Error constructor:', error?.constructor?.name || 'Unknown');
                    console.log('Error toString():', error?.toString() || 'Cannot convert to string');
                } catch (logError) {
                    console.error('Error logging error details:', logError);
                }
                
                // Handle different types of permission errors
                const errorName = error?.name || 'Unknown';
                const errorMessage = error?.message || '';
                
                if (errorName === 'NotAllowedError') {
                    if (errorMessage.includes('Permission dismissed')) {
                        showMessage('Microphone permission was denied. Click the microphone icon again to retry.', true);
                    } else {
                        showMessage('Microphone access denied. Please allow microphone access in your browser settings.', true);
                    }
                } else if (errorName === 'NotFoundError') {
                    showMessage('No microphone found. Please connect a microphone and try again.', true);
                } else if (errorName === 'NotSupportedError') {
                    showMessage('Microphone not supported in this browser. Please use a modern browser.', true);
                } else {
                    showMessage('Unable to access microphone. Please check permissions and try again.', true);
                }
                
                // Show helpful instructions for permission issues
                if (errorName === 'NotAllowedError') {
                    console.log('💡 To enable microphone access:');
                    console.log('1. Click the microphone icon in the address bar');
                    console.log('2. Select "Allow" for microphone access');
                    console.log('3. Or go to chrome://settings/content/microphone');
                    console.log('4. Try clicking the microphone icon in the main browser window');
                    console.log('5. If still not working, try restarting Chrome browser');
                    
                    // Show user-friendly message
                    showMessage('麦克风权限被拒绝。请尝试以下步骤：1) 点击地址栏右侧的麦克风图标并选择"允许" 2) 或重启浏览器后重试', true);
                }
                
                // Reset UI state
                isRecording = false;
                voiceInputArea.classList.remove('recording');
                voiceInputArea.title = 'Click to Start Recording';
                recordingIndicator.style.display = 'none';
                commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
            }
        } else {
            // Stop recording
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            isRecording = false;
            
            // Update UI
            voiceInputArea.classList.remove('recording');
            voiceInputArea.title = 'Click to Start Recording';
            recordingIndicator.style.display = 'none';
            commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
            
            console.log('🛑 Recording stopped');
            showMessage('Recording stopped, processing...', false);
        }
    }

    // Simulate transcription (replace with actual Whisper API call)
    async function simulateTranscription(audioBlob) {
        const commentTextarea = document.getElementById('insightComment');
        
        // Show processing state
        commentTextarea.placeholder = 'Processing transcription...\nAny thoughts?';
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes, add some sample transcribed text
        const sampleText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        
        // Append to existing text or replace if empty
        const currentText = commentTextarea.value;
        if (currentText.trim()) {
            commentTextarea.value = currentText + '\n\n' + sampleText;
        } else {
            commentTextarea.value = sampleText;
        }
        
        commentTextarea.placeholder = 'Click to Input Voice Transcription\nAny thoughts?';
        
        console.log('📝 Transcription completed (simulated)');
        showMessage('Transcription completed!', false);
    }
    
    // Show AI preview modal
    function showAIPreview(processedText, originalText) {
        const modal = document.getElementById('aiPreviewModal');
        const previewText = document.getElementById('aiPreviewText');
        
        // Show original vs processed text
        previewText.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>Original:</strong><br>
                <span style="color: #666; font-style: italic;">${originalText}</span>
            </div>
            <div>
                <strong>AI Processed:</strong><br>
                <span style="color: #65558F;">${processedText}</span>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Store processed text for later use
        modal.dataset.processedText = processedText;
    }
    
    // Apply AI processed text
    function applyAIText() {
        const modal = document.getElementById('aiPreviewModal');
        const processedText = modal.dataset.processedText;
        
        if (processedText) {
            document.getElementById('insightComment').value = processedText;
            showMessage('AI processing applied!');
        }
        
        hideAIPreview();
    }
    
    // Hide AI preview modal
    function hideAIPreview() {
        const modal = document.getElementById('aiPreviewModal');
        modal.style.display = 'none';
        delete modal.dataset.processedText;
    }
    
    // Bind event listeners
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    insightsForm.addEventListener('submit', handleSaveInsight);
    
    // Google OAuth button event listeners
    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleAuth);
    document.getElementById('googleSignupBtn').addEventListener('click', handleGoogleAuth);
    
    // Visit My Space button event listener
    document.getElementById('visitMySpaceBtn').addEventListener('click', handleVisitMySpace);
    

    
    // Voice input area event listener
    const voiceInputElement = document.getElementById('voiceInputArea');
    if (voiceInputElement) {
        voiceInputElement.addEventListener('click', handleVoiceInput);
        console.log('✅ Voice input event listener added');
    } else {
        console.error('❌ Voice input element not found for event listener');
    }
    
    // AI Preview modal event listeners
    document.getElementById('aiPreviewApply').addEventListener('click', applyAIText);
    document.getElementById('aiPreviewCancel').addEventListener('click', hideAIPreview);
    
    // Close modal when clicking outside
    document.getElementById('aiPreviewModal').addEventListener('click', function(event) {
        if (event.target === this) {
            hideAIPreview();
        }
    });
    
    // Tag selection events
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('tag-option')) {
            const tagElement = event.target;
            const tag = tagElement.dataset.tag;
            
            tagElement.classList.toggle('selected');
            if (tagElement.classList.contains('selected')) {
                addTag(tag);
            } else {
                removeTag(tag);
            }
        }
    });
    
    // Toggle form display
    document.getElementById('showSignup').addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
    
    document.getElementById('showLogin').addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    // Initialize
    checkUserSession();
    
    // Listen for login status changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.quest_user_session) {
            const newValue = changes.quest_user_session.newValue;
            if (newValue && newValue.user) {
                console.log('检测到登录状态变化:', newValue.user);
                currentUser = newValue.user;
                showUserInterface();
                loadUserTags();
            } else {
                console.log('检测到登出状态变化');
                currentUser = null;
                showLoginInterface();
            }
        }
    });
    
    // Load user tags
    async function loadUserTags() {
        try {
            const session = await chrome.storage.local.get('quest_user_session');
            const accessToken = session.quest_user_session?.access_token;
            
            if (!accessToken) {
                console.log('No access token found, skipping user tags load');
                return;
            }
            
            console.log('🔄 Loading user tags...');
            
            // Use new API endpoint
            const response = await fetch(`${API_BASE_URL}/api/v1/user-tags`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                console.error('Failed to load user tags:', response.status);
                return;
            }
            
            const result = await response.json();
            console.log('✅ User tags loaded:', result);
            
            if (result.success && result.data) {
                // Update the tags display
                updateTagsDisplay(result.data.map(tag => tag.name));
            }
            
        } catch (error) {
            console.error('Error loading user tags:', error);
        }
    }
    
    // Update tags display
    function updateTagsDisplay(tagNames) {
        // Clear existing tag selector
        const tagSelector = document.getElementById('tagSelector');
        
        // Remove all existing tag options
        const existingTags = tagSelector.querySelectorAll('.tag-option');
        existingTags.forEach(tag => tag.remove());
        
        // Add all user tags
        tagNames.forEach(tagName => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-option';
            tagElement.setAttribute('data-tag', tagName);
            tagElement.style.borderColor = '#007bff'; // Default color
            tagElement.style.color = '#007bff';
            tagElement.textContent = tagName.charAt(0).toUpperCase() + tagName.slice(1);
            tagSelector.appendChild(tagElement);
        });
    }
    
    // Load user tags after login
    const originalShowUserInterface = showUserInterface;
    showUserInterface = function() {
        originalShowUserInterface();
        loadUserTags();
    };
}); 