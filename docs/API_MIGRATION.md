# Quest Extension API 迁移文档

## 概述

Quest Extension 已成功迁移到新的后端API系统，使用 `https://quest-api-edz1.onrender.com` 作为主要API端点。

## 主要更改

### 1. API 端点更新

**旧端点:**
- 后端: `https://wlpitstgjomynzfnqkye.supabase.co`
- 认证: Supabase Auth

**新端点:**
- 后端: `https://quest-api-edz1.onrender.com`
- 认证: JWT Bearer Token

### 2. 认证系统

**移除的功能:**
- Google OAuth 集成
- Supabase 直接认证

**新的认证流程:**
- 标准邮箱/密码注册和登录
- JWT Bearer Token 认证
- 24小时会话有效期

### 3. API 接口映射

| 功能 | 旧端点 | 新端点 |
|------|--------|--------|
| 用户注册 | `/signup` | `/api/v1/auth/register` |
| 用户登录 | `/login` | `/api/v1/auth/login` |
| 用户登出 | `/logout` | `/api/v1/auth/signout` |
| 创建见解 | `/insights` | `/api/v1/insights` |
| 获取见解 | `/insights` | `/api/v1/insights` |
| 获取标签 | `/user-tags` | `/api/v1/user-tags` |

### 4. 请求/响应格式

**认证请求格式:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户名"
}
```

**认证响应格式:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "access_token": "jwt_token_here",
    "token_type": "bearer",
    "user_id": "user_uuid",
    "email": "user@example.com"
  }
}
```

**创建见解请求格式:**
```json
{
  "url": "https://example.com",
  "thought": "用户的想法",
  "tag_ids": ["tag_id_1", "tag_id_2"]
}
```

## 文件更新清单

### 1. popup.js
- ✅ 更新API基础URL
- ✅ 移除Google OAuth相关代码
- ✅ 更新认证流程
- ✅ 更新见解保存逻辑
- ✅ 更新标签管理

### 2. popup.html
- ✅ 移除Google登录按钮
- ✅ 简化登录/注册界面

### 3. manifest.json
- ✅ 更新host_permissions
- ✅ 移除oauth2配置

### 4. background.js
- ✅ 更新内容脚本注入规则

### 5. content-script.js
- ✅ 更新API端点监听
- ✅ 更新响应格式处理

## 新功能特性

### 1. 自动元数据提取
创建见解时，后端会自动从URL提取：
- 页面标题
- 页面描述
- 页面图片

### 2. 标签系统
- 支持用户自定义标签
- 标签颜色管理
- 多标签关联

### 3. 分页支持
- 见解列表支持分页
- 可配置每页数量
- 搜索功能

## 测试

使用 `test-api.html` 文件可以测试所有API功能：

1. 健康检查
2. 用户注册
3. 用户登录
4. 创建见解
5. 获取见解列表
6. 用户登出

## 部署说明

1. 更新扩展代码
2. 在Chrome扩展管理页面重新加载扩展
3. 测试登录和见解保存功能
4. 验证标签管理功能

## 注意事项

1. **会话管理**: 用户需要重新登录，旧会话将失效
2. **数据迁移**: 现有数据需要从旧系统迁移到新系统
3. **错误处理**: 新API使用统一的错误响应格式
4. **安全性**: 使用JWT Bearer Token提供更好的安全性

## 故障排除

### 常见问题

1. **登录失败**
   - 检查邮箱和密码是否正确
   - 确认API端点可访问

2. **见解保存失败**
   - 检查网络连接
   - 确认用户已登录
   - 验证URL格式

3. **标签加载失败**
   - 检查用户权限
   - 确认API响应格式

### 调试工具

- 使用Chrome开发者工具查看网络请求
- 检查控制台错误信息
- 使用test-api.html进行API测试

## 未来计划

1. 添加更多AI功能
2. 支持语音输入
3. 增强标签管理
4. 添加数据导出功能
5. 支持多设备同步
