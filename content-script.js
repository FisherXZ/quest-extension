// Quest Extension Content Script
console.log('🎯 Quest Extension Content Script loaded');

// 监听网站登录状态变化
function observeLoginStatus() {
    // 监听localStorage变化
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        
        // 检测Quest相关的登录状态
        if (key === 'quest_user_session' || key.includes('quest') || key.includes('auth')) {
            try {
                const userData = JSON.parse(value);
                if (userData && userData.user) {
                    console.log('检测到网站登录:', userData.user);
                    // 同步到extension
                    chrome.runtime.sendMessage({
                        action: 'syncLogin',
                        user: userData.user
                    });
                }
            } catch (e) {
                console.log('解析用户数据失败:', e);
            }
        }
    };
    
    localStorage.removeItem = function(key) {
        originalRemoveItem.apply(this, arguments);
        
        // 检测Quest相关的登出状态
        if (key === 'quest_user_session' || key.includes('quest') || key.includes('auth')) {
            console.log('检测到网站登出');
            // 同步到extension
            chrome.runtime.sendMessage({
                action: 'syncLogout'
            });
        }
    };
    
    // 检查当前是否已登录
    checkCurrentLoginStatus();
}

// 检查当前登录状态
function checkCurrentLoginStatus() {
    try {
        // 检查localStorage中的登录状态
        const questSession = localStorage.getItem('quest_user_session');
        if (questSession) {
            const userData = JSON.parse(questSession);
            if (userData && userData.user) {
                console.log('检测到当前已登录:', userData.user);
                chrome.runtime.sendMessage({
                    action: 'syncLogin',
                    user: userData.user
                });
            }
        }
        
        // 检查其他可能的登录状态
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.includes('quest') || key.includes('auth') || key.includes('user')) {
                try {
                    const value = localStorage.getItem(key);
                    const data = JSON.parse(value);
                    if (data && data.user && data.user.email) {
                        console.log('检测到其他登录状态:', data.user);
                        chrome.runtime.sendMessage({
                            action: 'syncLogin',
                            user: data.user
                        });
                        break;
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
    } catch (e) {
        console.log('检查登录状态失败:', e);
    }
}

// 监听DOM变化，检测登录/登出按钮
function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检测登录成功后的用户信息显示
                        const userElements = node.querySelectorAll('[id*="user"], [class*="user"], [id*="profile"], [class*="profile"]');
                        userElements.forEach(element => {
                            if (element.textContent && element.textContent.includes('@')) {
                                // 可能是用户邮箱显示
                                console.log('检测到用户信息显示:', element.textContent);
                                // 尝试从页面获取用户信息
                                extractUserInfoFromPage();
                            }
                        });
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 从页面提取用户信息
function extractUserInfoFromPage() {
    try {
        // 查找可能的用户信息元素
        const userElements = document.querySelectorAll('[id*="email"], [class*="email"], [id*="user"], [class*="user"]');
        for (const element of userElements) {
            const text = element.textContent || element.value;
            if (text && text.includes('@') && text.includes('.')) {
                // 可能是邮箱地址
                const email = text.trim();
                console.log('从页面提取到邮箱:', email);
                
                // 尝试获取昵称
                const nicknameElements = document.querySelectorAll('[id*="nickname"], [class*="nickname"], [id*="name"], [class*="name"]');
                let nickname = email.split('@')[0];
                
                for (const nameElement of nicknameElements) {
                    const nameText = nameElement.textContent || nameElement.value;
                    if (nameText && !nameText.includes('@') && nameText.length > 0) {
                        nickname = nameText.trim();
                        break;
                    }
                }
                
                // 创建用户对象
                const user = {
                    email: email,
                    nickname: nickname
                };
                
                console.log('创建用户对象:', user);
                chrome.runtime.sendMessage({
                    action: 'syncLogin',
                    user: user
                });
                
                break;
            }
        }
    } catch (e) {
        console.log('提取用户信息失败:', e);
    }
}

// 监听网络请求，检测登录API调用
function observeNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        // 检测登录API调用
        if (typeof url === 'string' && url.includes('/api/v1/auth/login')) {
            console.log('检测到登录API调用:', url);
            
            // 监听响应
            return originalFetch.apply(this, args).then(response => {
                if (response.ok) {
                    response.clone().json().then(data => {
                        if (data && data.success && data.data) {
                            console.log('登录API返回用户信息:', data.data);
                            chrome.runtime.sendMessage({
                                action: 'syncLogin',
                                user: {
                                    id: data.data.user_id,
                                    email: data.data.email,
                                    access_token: data.data.access_token
                                }
                            });
                        }
                    }).catch(e => console.log('解析登录响应失败:', e));
                }
                return response;
            });
        }
        
        // 检测注册API调用
        if (typeof url === 'string' && url.includes('/api/v1/auth/register')) {
            console.log('检测到注册API调用:', url);
            
            return originalFetch.apply(this, args).then(response => {
                if (response.ok) {
                    response.clone().json().then(data => {
                        if (data && data.success && data.data && data.data.user) {
                            console.log('注册API返回用户信息:', data.data.user);
                            chrome.runtime.sendMessage({
                                action: 'syncLogin',
                                user: {
                                    id: data.data.user.id,
                                    email: data.data.user.email,
                                    nickname: data.data.user.nickname,
                                    access_token: data.data.access_token
                                }
                            });
                        }
                    }).catch(e => console.log('解析注册响应失败:', e));
                }
                return response;
            });
        }
        
        return originalFetch.apply(this, args);
    };
}

// 初始化
function init() {
    console.log('初始化Quest Extension Content Script');
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observeLoginStatus();
            observeDOMChanges();
            observeNetworkRequests();
        });
    } else {
        observeLoginStatus();
        observeDOMChanges();
        observeNetworkRequests();
    }
}

// 启动监听
init();

// 监听来自popup的麦克风权限请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'requestMicrophonePermission') {
        console.log('Content script: Requesting microphone permission');
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Content script: Microphone permission granted');
                stream.getTracks().forEach(track => track.stop());
                sendResponse({ success: true, permission: 'granted' });
            })
            .catch(error => {
                console.error('Content script: Microphone permission denied:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // Keep message channel open
    }
}); 