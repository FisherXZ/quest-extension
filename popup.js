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
    
    // Google OAuth configuration is now handled by backend
    // Client ID, scopes, and other parameters are fetched from /api/v1/auth/google/login
    
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
            
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
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
            
            // Handle nested data structure from backend
            const userData = result.data?.data || result.data;
            console.log('🔍 Extracted user data:', userData);
            
            if (result.success && userData && userData.access_token) {
                currentUser = {
                    id: userData.user_id || userData.user?.id,
                    email: userData.email || userData.user?.email,
                    access_token: userData.access_token
                };
                
                console.log('👤 Current user set:', currentUser);
                
                // Save session with token
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                        access_token: userData.access_token,
                        timestamp: Date.now()
                    }
                });
                
                console.log('✅ Session saved successfully');
                showUserInterface();
                showMessage('Login successful!');
            } else {
                console.error('❌ Login failed - Missing data:', {
                    success: result.success,
                    userData: userData,
                    hasAccessToken: userData?.access_token ? 'Yes' : 'No',
                    hasUserId: userData?.user_id || userData?.user?.id ? 'Yes' : 'No'
                });
                
                if (!result.success) {
                    showMessage('Login failed: ' + (result.message || 'Unknown error'), true);
                } else if (!userData) {
                    showMessage('Login failed: No user data received from server', true);
                } else if (!userData.access_token) {
                    showMessage('Login failed: Missing access token', true);
                } else {
                    showMessage('Login failed: Unknown error occurred', true);
                }
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
            
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/`, {
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
                console.error('❌ Signup failed - Status:', response.status, 'Error data:', errorData);
                const errorMessage = errorData.detail || errorData.message || 'Registration failed';
                showMessage(errorMessage, true);
                return;
            }

            const result = await response.json();
                console.log('✅ Parsed signup response:', result);
            
            // Handle nested data structure from backend
            const userData = result.data?.data || result.data;
            console.log('🔍 Extracted user data:', userData);
            
            // Additional debugging for token location
            console.log('🔍 Detailed token analysis:', {
                'result.data?.access_token': result.data?.access_token,
                'result.data?.data?.access_token': result.data?.data?.access_token,
                'userData?.access_token': userData?.access_token,
                'result.access_token': result.access_token,
                'Full result structure': result
            });
            
            // Try to get access token from multiple possible locations
            const accessToken = userData?.access_token || 
                               result.data?.access_token || 
                               result.access_token;
            
            console.log('🔍 Final access token:', accessToken);
            
            if (result.success && userData && userData.user) {
                // Registration successful, but backend doesn't return access_token
                // Need to auto-login to get the token
                if (!accessToken) {
                    console.log('🔄 Registration successful, but no token returned. Auto-logging in...');
                    showMessage('Registration successful! Logging you in...');
                    
                    // Auto-login to get access token
                    try {
                        const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: userData.user.email,
                                password: password // Use the password from signup
                            })
                        });
                        
                        if (loginResponse.ok) {
                            const loginResult = await loginResponse.json();
                            console.log('🔄 Auto-login response:', loginResult);
                            
                            if (loginResult.success && loginResult.data?.access_token) {
                                currentUser = {
                                    id: loginResult.data.user_id || userData.user.id,
                                    email: loginResult.data.email || userData.user.email,
                                    nickname: userData.user.nickname,
                                    access_token: loginResult.data.access_token
                                };
                                
                                // Save session with token
                                await chrome.storage.local.set({
                                    quest_user_session: {
                                        user: currentUser,
                                        access_token: loginResult.data.access_token,
                                        timestamp: Date.now()
                                    }
                                });
                                
                                console.log('✅ Auto-login successful, session saved');
                                showUserInterface();
                                showMessage('Registration and login successful!');
                return;
                            }
                        }
                    } catch (loginError) {
                        console.error('❌ Auto-login failed:', loginError);
                    }
            }
            
                // If we have access token from registration (unlikely based on API test)
                if (accessToken) {
                currentUser = {
                        id: userData.user.id,
                        email: userData.user.email,
                        nickname: userData.user.nickname,
                        access_token: accessToken
                };
                
                console.log('👤 Current user set:', currentUser);
                
                // Save session with token
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                            access_token: accessToken,
                        timestamp: Date.now()
                    }
                });
                
                console.log('✅ Session saved successfully');
                showUserInterface();
                showMessage('Registration successful!');
                    return;
                }
                
                // If auto-login failed, show success but require manual login
                showMessage('Registration successful! Please login to continue.', false);
            } else {
                console.error('❌ Registration failed - Missing data:', {
                    success: result.success,
                    userData: userData,
                    hasAccessToken: accessToken ? 'Yes' : 'No',
                    hasUser: userData?.user ? 'Yes' : 'No',
                    accessTokenValue: accessToken
                });
                
                if (!result.success) {
                    showMessage('Registration failed: ' + (result.message || 'Unknown error'), true);
                } else if (!userData) {
                    showMessage('Registration failed: No user data received from server', true);
                } else if (!accessToken) {
                    showMessage('Registration failed: Missing access token', true);
                } else if (!userData.user) {
                    showMessage('Registration failed: Missing user information', true);
                } else {
                    showMessage('Registration failed: Unknown error occurred', true);
                }
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
                    await fetch(`${API_BASE_URL}/api/v1/auth/signout/`, {
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
    
    // Handle Google OAuth authentication using ID Token approach
    async function handleGoogleAuth() {
        console.log('🔐 Starting Google OAuth flow with ID Token...');
        try {
            // Step 1: Get OAuth configuration from backend to get client_id
            console.log('📡 Fetching OAuth configuration from backend...');
            const configResponse = await fetch(`${API_BASE_URL}/api/v1/auth/google/login`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!configResponse.ok) {
                const errorData = await configResponse.json();
                throw new Error(errorData.detail || 'Failed to get OAuth configuration');
            }
            
            const configResult = await configResponse.json();
            console.log('✅ Backend OAuth config:', configResult);
            
            if (!configResult.success || !configResult.data) {
                throw new Error('Invalid OAuth configuration response from backend');
            }
            
            // Step 2: Use backend's OAuth URL but modify for Chrome extension
            const backendOAuthUrl = configResult.data.oauth_url;
            const { client_id, scope } = configResult.data;
            const redirectUri = chrome.identity.getRedirectURL();
            console.log('🔄 Extension redirect URL:', redirectUri);
            console.log('🔄 Backend OAuth URL:', backendOAuthUrl);
            
            // Parse the backend URL and modify for Chrome extension
            const oauthUrl = new URL(backendOAuthUrl);
            
            // Update parameters for Chrome extension
            oauthUrl.searchParams.set('response_type', 'id_token');  // Request ID token directly
            oauthUrl.searchParams.set('redirect_uri', redirectUri);  // Use extension redirect URI
            oauthUrl.searchParams.set('nonce', Math.random().toString(36).substring(7));  // Required for ID toke
            
            // Ensure proper scopes for ID token
            const requiredScopes = 'openid email profile';
            oauthUrl.searchParams.set('scope', requiredScopes);
            
            // Remove parameters that are not compatible with id_token flow
            oauthUrl.searchParams.delete('include_granted_scopes');  // Not allowed with id_token
            oauthUrl.searchParams.delete('access_type');  // Not needed for id_token
            oauthUrl.searchParams.delete('state');  // We'll use nonce instead
            
            const authUrl = oauthUrl.toString();
            
            console.log('📡 Launching Chrome identity OAuth flow for ID token...');
            console.log('🔍 Final OAuth URL:', authUrl);
            console.log('🔍 URL components:', {
                client_id: oauthUrl.searchParams.get('client_id'),
                response_type: oauthUrl.searchParams.get('response_type'),
                redirect_uri: oauthUrl.searchParams.get('redirect_uri'),
                scope: oauthUrl.searchParams.get('scope'),
                nonce: oauthUrl.searchParams.get('nonce')
            });
            
            const authResult = await chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: true
            });
            
            console.log('✅ OAuth flow completed, result:', authResult);
            
            if (chrome.runtime.lastError) {
                console.error('❌ OAuth error:', chrome.runtime.lastError);
                console.error('🔍 Error details:', {
                    message: chrome.runtime.lastError.message,
                    authUrl: authUrl,
                    redirectUri: redirectUri
                });
                
                // Provide specific guidance based on error
                if (chrome.runtime.lastError.message.includes('Authorization page could not be loaded')) {
                    showMessage('OAuth configuration error. Please check Google Cloud Console settings for the Chrome extension OAuth client.', true);
                } else {
                    showMessage('Google authentication failed: ' + chrome.runtime.lastError.message, true);
                }
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
            
            // Extract ID token from URL fragment (not query params)
            const url = new URL(authResult);
            const fragment = url.hash.substring(1); // Remove # 
            const params = new URLSearchParams(fragment);
            const idToken = params.get('id_token');
            
            console.log('🔍 Extracted from OAuth response:');
            console.log('  - Full URL:', authResult);
            console.log('  - Fragment:', fragment);
            console.log('  - ID Token:', idToken ? 'Present' : 'Missing');
            console.log('  - All fragment params:', Array.from(params.entries()));
            
            if (!idToken) {
                console.error('❌ No ID token found in response');
                showMessage('No ID token received from Google', true);
                return;
            }
            
            console.log('✅ ID token received successfully');
            
            // Note: No state verification needed since we removed state parameter
            // and are using nonce for security (nonce is verified by Google)
            
            // Send ID token to backend for authentication
            await authenticateWithIdToken(idToken);
            
        } catch (error) {
            console.error('❌ Google auth error:', error);
            showMessage('Google authentication failed: ' + error.message, true);
        }
    }
    
    // Extract email from Google ID Token
    function extractEmailFromIdToken(idToken) {
        try {
            // ID Token format: header.payload.signature
            const parts = idToken.split('.');
            if (parts.length !== 3) {
                return null;
            }
            
            // Decode the payload (base64url)
            const payload = parts[1];
            // Add padding if needed
            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
            const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
            const userInfo = JSON.parse(decodedPayload);
            
            return userInfo.email || null;
        } catch (error) {
            console.error('❌ Failed to extract email from ID token:', error);
            return null;
        }
    }

    // Authenticate using Google ID Token with backend API
    async function authenticateWithIdToken(idToken) {
                    console.log('🔄 Authenticating with Google ID Token...');
            try {
                // Prepare form data for ID token authentication
                const formData = new URLSearchParams();
                formData.append('id_token', idToken);
                
                console.log('🔍 ID Token details:');
                console.log('  - First 50 chars:', idToken.substring(0, 50) + '...');
                console.log('  - Last 50 chars:', '...' + idToken.substring(idToken.length - 50));
                console.log('  - Total length:', idToken.length);
                console.log('  - Contains dots:', idToken.split('.').length, 'segments');
                
                // Call backend API to authenticate with ID token
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/google/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });
            
            console.log('📥 Google ID token response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || errorData.message || 'Google authentication failed';
                console.error('❌ Google ID token error:', errorData);
                console.error('🔍 Request details:');
                console.error('  - ID Token length:', idToken.length);
                console.error('  - Form data:', Array.from(formData.entries()));
                console.error('  - Response status:', response.status);
                console.error('  - Error data:', errorData);
                console.error('🔍 Full error message:', errorMessage);
                
                // Check for specific error types
                if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
                    showMessage('Backend database configuration issue. Please contact support.', true);
                    console.error('🚨 Database schema error detected - backend needs database migration');
                } else if (errorMessage.includes('profiles.email')) {
                    showMessage('Backend database schema issue with profiles table. Please contact support.', true);
                    console.error('🚨 Profiles.email column error - backend still referencing profiles table');
                } else if (errorMessage.includes("'provider' column of 'profiles'")) {
                    showMessage('Backend database issue: profiles.provider column missing. Backend needs to be updated.', true);
                    console.error('🚨 PGRST204: Backend code still references profiles.provider column which was removed');
                    console.error('💡 Solution: Remove all references to profiles.provider in backend Google OAuth code');
                } else if (errorMessage.includes('A user with this email address has already been registered')) {
                    // Extract email from ID token for better UX
                    const extractedEmail = extractEmailFromIdToken(idToken);
                    showMessage(`This Google account (${extractedEmail}) is already registered. Please use regular login with your password, or try password reset.`, true);
                    console.error('🔍 User account conflict - Google email already exists in system');
                    
                    // Auto-fill login form with Google email
                    const emailInput = document.getElementById('loginEmail');
                    if (emailInput && extractedEmail) {
                        emailInput.value = extractedEmail;
                        emailInput.focus();
                        
                        // Focus on password field
                        setTimeout(() => {
                            const passwordInput = document.getElementById('loginPassword');
                            if (passwordInput) {
                                passwordInput.focus();
                                passwordInput.placeholder = 'Enter your existing password';
                            }
                        }, 100);
                    }
                } else {
                    // Show the actual backend error message to user
                    showMessage(`Google authentication failed: ${errorMessage}`, true);
                }
                return;
            }
            
            const result = await response.json();
            console.log('✅ Google ID token response:', result);
            
            if (result.success && result.data.access_token) {
                // Extract user data from Supabase native response format
                const userData = result.data.user;
                const sessionData = result.data.session || result.data;
                
                currentUser = {
                    id: userData.id,
                    email: userData.email,
                    username: userData.username || userData.email.split('@')[0],
                    nickname: userData.nickname || userData.user_metadata?.name || userData.email.split('@')[0],
                    picture: userData.picture || userData.user_metadata?.picture || null,
                    access_token: sessionData.access_token,
                    provider: 'google'
                };
                
                console.log('👤 Google user set:', currentUser);
                console.log('📝 Response message:', result.message);
                
                // Save session with token (Supabase format)
                await chrome.storage.local.set({
                    quest_user_session: {
                        user: currentUser,
                        access_token: sessionData.access_token,
                        refresh_token: sessionData.refresh_token,
                        timestamp: Date.now(),
                        provider: 'google',
                        supabase_session: sessionData
                    }
                });
                
                console.log('✅ Google session saved successfully');
                showUserInterface();
                showMessage('Successfully logged in with Google!');
            } else {
                showMessage('Google authentication failed: No access token received', true);
            }
            
        } catch (error) {
            console.error('❌ ID token authentication error:', error);
            showMessage('Google authentication failed: ' + error.message, true);
        }
    }
    
    // Selected tags array - stores tag objects with id and name
    let selectedTags = [];
    // Available tags array - stores all user tags with full data
    let availableTags = [];
    
    // Update selected tags display
    function updateSelectedTagsDisplay() {
        // Remove all selected states
        document.querySelectorAll('.tag-option').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Add selected state for selected tags
        selectedTags.forEach(tag => {
            const tagElement = document.querySelector(`[data-tag-id="${tag.id}"]`);
            if (tagElement) {
                tagElement.classList.add('selected');
            }
        });
    }
    
    // Add tag by ID
    function addTag(tagId) {
        const tagObj = availableTags.find(t => t.id === tagId);
        if (tagObj && !selectedTags.find(t => t.id === tagId)) {
            selectedTags.push(tagObj);
            updateSelectedTagsDisplay();
        }
    }
    
    // Remove tag by ID
    function removeTag(tagId) {
        selectedTags = selectedTags.filter(t => t.id !== tagId);
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

            console.log('🔍 Insights API token info:', {
                length: accessToken.length,
                prefix: accessToken.substring(0, 20) + '...',
                provider: session.quest_user_session?.provider,
                user_id: session.quest_user_session?.user?.id
            });

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
                    tag_ids: selectedTags.map(tag => tag.id) // Extract tag IDs
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Server error:', response.status, errorData);
                console.error('🔍 Request body was:', {
                    url: url,
                    thought: thought || '',
                    tag_ids: selectedTags.map(tag => tag.id)
                });
                console.error('🔍 Selected tags:', selectedTags);
                console.error('🔍 Selected tag IDs:', selectedTags.map(tag => tag.id));
                console.error('🔍 Available tags:', availableTags);
                console.error('🔍 URL:', url);
                console.error('🔍 Thought:', thought);
                
                // Show detailed error message
                let errorMessage = 'Save failed';
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => err.msg || err.message || err).join(', ');
                    } else {
                        errorMessage = errorData.detail;
                    }
                }
                showMessage(errorMessage, true);
                return;
            }

            const result = await response.json();
            console.log('✅ Insight saved:', result);
            
            // Check if the response contains the insight data
            if (result.success && result.data) {
                console.log('📝 Created insight:', {
                    id: result.data.id,
                    title: result.data.title,
                    description: result.data.description,
                    url: result.data.url,
                    image_url: result.data.image_url,
                    thought: result.data.thought,
                    tags: result.data.tags
                });
            showMessage('Saved to collection!');
            } else {
                console.log('⚠️ Unexpected response format:', result);
                showMessage('Saved successfully!');
            }
            
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
                showMessage('Microphone access is blocked. Opening extension settings...', true);
                
                // Open extension specific settings page
                setTimeout(() => {
                    chrome.tabs.create({ 
                        url: 'chrome://settings/content/siteDetails?site=chrome-extension://jcjpicpelibofggpbbmajafjipppnojo' 
                    });
                }, 1000);
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
                    
                    // Show user-friendly message and open settings
                    showMessage('麦克风权限被拒绝。正在打开权限设置页面...', true);
                    
                    // Open Chrome settings page for microphone permissions
                    setTimeout(() => {
                        // Open specific extension permission settings page
                        chrome.tabs.create({ 
                            url: 'chrome://settings/content/siteDetails?site=chrome-extension://jcjpicpelibofggpbbmajafjipppnojo' 
                        });
                        
                        // Show instructions
                        setTimeout(() => {
                            showMessage('请在权限设置页面中将麦克风权限设置为"允许"', false);
                        }, 2000);
                    }, 1000);
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
            const tagId = tagElement.dataset.tagId;
            
            tagElement.classList.toggle('selected');
            if (tagElement.classList.contains('selected')) {
                addTag(tagId);
            } else {
                removeTag(tagId);
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
            console.log('🔍 Access token info:', {
                length: accessToken.length,
                prefix: accessToken.substring(0, 20) + '...',
                provider: session.quest_user_session?.provider,
                user_id: session.quest_user_session?.user?.id
            });
            
            // Use new API endpoint
            const response = await fetch(`${API_BASE_URL}/api/v1/user-tags/`, {
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
                // Store all available tags with full data
                availableTags = result.data;
            // Update the tags display
                updateTagsDisplay(result.data);
            }
            
        } catch (error) {
            console.error('Error loading user tags:', error);
        }
    }
    
    // Update tags display
    function updateTagsDisplay(tags) {
        // Clear existing tag selector
        const tagSelector = document.getElementById('tagSelector');
        
        // Remove all existing tag options
        const existingTags = tagSelector.querySelectorAll('.tag-option');
        existingTags.forEach(tag => tag.remove());
        
        // Add all user tags
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-option';
            tagElement.setAttribute('data-tag-id', tag.id);
            tagElement.setAttribute('data-tag-name', tag.name);
            tagElement.style.borderColor = '#007bff'; // Default color
            tagElement.style.color = '#007bff';
            tagElement.textContent = tag.name.charAt(0).toUpperCase() + tag.name.slice(1);
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