# Google OAuth 配置指南

## 概述

Quest Extension 现在支持Google OAuth登录，用户可以使用Google账户快速登录，无需创建新账户。

## 🔧 配置步骤

### 1. Google Cloud Console 配置

#### 1.1 创建项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 和 Google OAuth2 API

#### 1.2 配置OAuth同意屏幕
1. 在左侧菜单中选择 "API和服务" > "OAuth同意屏幕"
2. 选择用户类型（外部或内部）
3. 填写应用信息：
   - 应用名称：Quest Extension
   - 用户支持电子邮件
   - 开发者联系信息

#### 1.3 创建OAuth 2.0客户端ID
1. 在左侧菜单中选择 "API和服务" > "凭据"
2. 点击 "创建凭据" > "OAuth 2.0客户端ID"
3. 选择应用类型：**Chrome扩展**
4. 填写信息：
   - 名称：Quest Extension
   - 扩展ID：获取你的Chrome扩展ID

### 2. 获取Chrome扩展ID

#### 方法1：从Chrome扩展管理页面
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 找到 "Quest Insight Collector" 扩展
4. 复制扩展ID（类似：`abcdefghijklmnopqrstuvwxyz123456`）

#### 方法2：从manifest.json
```json
{
  "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
}
```

### 3. 配置重定向URI

在Google Cloud Console中，为你的OAuth客户端配置重定向URI：

```
https://<extension-id>.chromiumapp.org/
```

例如：
```
https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/
```

### 4. 更新扩展配置

#### 4.1 更新manifest.json
确保manifest.json包含正确的OAuth配置：

```json
{
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

#### 4.2 更新popup.js
确保popup.js中的Google Client ID正确：

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

## 🔐 后端API要求

### Google OAuth端点

后端需要实现以下API端点：

```
POST /api/v1/auth/google
```

**请求格式：**
```json
{
  "code": "authorization_code_from_google",
  "redirect_uri": "https://extension-id.chromiumapp.org/"
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "access_token": "jwt_token_here",
    "token_type": "bearer",
    "user_id": "user_uuid",
    "email": "user@gmail.com",
    "nickname": "User Name",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

## 🧪 测试

### 1. 使用测试页面
打开 `test-google-oauth.html` 进行测试：

```bash
# 在浏览器中打开
open test-google-oauth.html
```

### 2. 测试步骤
1. 点击 "测试 Google OAuth" 按钮
2. 验证OAuth URL生成正确
3. 测试授权码交换API
4. 检查后端状态

### 3. 在扩展中测试
1. 重新加载扩展
2. 点击Google登录按钮
3. 完成Google OAuth流程
4. 验证登录成功

## 🚨 常见问题

### 1. "redirect_uri_mismatch" 错误
**原因：** 重定向URI配置不正确
**解决：** 确保Google Cloud Console中的重定向URI与扩展ID匹配

### 2. "invalid_client" 错误
**原因：** Client ID不正确
**解决：** 检查manifest.json和popup.js中的Client ID

### 3. "access_denied" 错误
**原因：** 用户取消了授权
**解决：** 这是正常行为，用户可以选择不授权

### 4. 扩展无法打开Google登录页面
**原因：** 权限配置问题
**解决：** 确保manifest.json包含正确的权限

## 📋 安全检查清单

- [ ] OAuth同意屏幕配置正确
- [ ] 重定向URI匹配扩展ID
- [ ] Client ID在所有文件中一致
- [ ] 后端API端点实现
- [ ] 错误处理完善
- [ ] 用户数据安全存储

## 🔄 部署流程

### 1. 开发环境
1. 使用测试Client ID
2. 在本地测试OAuth流程
3. 验证所有功能正常

### 2. 生产环境
1. 创建生产Client ID
2. 更新所有配置文件
3. 重新打包扩展
4. 发布到Chrome Web Store

## 📞 支持

如果遇到问题：

1. 检查Google Cloud Console配置
2. 验证扩展ID和重定向URI
3. 查看Chrome开发者工具错误
4. 使用测试页面验证API
5. 联系开发团队获取支持

---

**配置完成后，用户就可以使用Google账户快速登录Quest Extension了！** 🎉
