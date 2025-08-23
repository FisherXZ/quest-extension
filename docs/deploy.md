# Quest Extension 部署指南

## 🚀 快速部署

### 1. 更新扩展文件

确保以下文件已更新为最新版本：

- ✅ `popup.js` - 主要功能逻辑
- ✅ `popup.html` - 用户界面
- ✅ `manifest.json` - 扩展配置
- ✅ `background.js` - 后台服务
- ✅ `content-script.js` - 内容脚本

### 2. 在Chrome中重新加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 找到 "Quest Insight Collector" 扩展
4. 点击 "重新加载" 按钮 (🔄)
5. 确认扩展已更新

### 3. 测试功能

1. **测试登录功能**
   - 点击扩展图标
   - 尝试注册新账户
   - 尝试登录现有账户

2. **测试见解保存**
   - 访问任意网页
   - 点击扩展图标
   - 填写见解信息并保存

3. **测试标签功能**
   - 创建新标签
   - 为见解添加标签
   - 查看标签列表

## 🔧 开发环境设置

### 1. 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd quest-extension-release

# 安装依赖（如果需要）
npm install

# 启动本地服务器（用于测试）
python -m http.server 8000
```

### 2. 测试API连接

使用提供的测试页面：

```bash
# 在浏览器中打开
open test-api.html
```

或者直接访问：
```
file:///path/to/quest-extension-release/test-api.html
```

## 📦 打包发布

### 1. 创建发布包

```bash
# 创建发布目录
mkdir quest-extension-v1.5
cp -r *.js *.html *.json icons/ quest-extension-v1.5/
cp README.md API_MIGRATION.md quest-extension-v1.5/

# 创建ZIP文件
zip -r quest-extension-v1.5.zip quest-extension-v1.5/
```

### 2. 文件清单

确保以下文件包含在发布包中：

```
quest-extension-v1.5/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content-script.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── QUEST.png
├── README.md
├── API_MIGRATION.md
└── test-api.html
```

## 🧪 测试清单

### 功能测试

- [ ] 扩展图标显示正常
- [ ] 弹出窗口正常打开
- [ ] 登录表单正常工作
- [ ] 注册表单正常工作
- [ ] 见解保存功能正常
- [ ] 标签管理功能正常
- [ ] 用户头像显示正常
- [ ] 登出功能正常

### API测试

- [ ] 健康检查API响应正常
- [ ] 用户注册API工作正常
- [ ] 用户登录API工作正常
- [ ] 创建见解API工作正常
- [ ] 获取见解API工作正常
- [ ] 用户登出API工作正常

### 错误处理测试

- [ ] 网络错误处理
- [ ] 无效凭据处理
- [ ] 会话过期处理
- [ ] API错误响应处理

## 🔍 调试指南

### 1. 查看控制台日志

1. 右键点击扩展图标
2. 选择 "检查弹出内容"
3. 查看Console标签页的日志

### 2. 网络请求调试

1. 打开Chrome开发者工具
2. 切换到Network标签页
3. 执行操作并查看API请求

### 3. 常见问题解决

**问题**: 扩展无法加载
**解决**: 检查manifest.json语法是否正确

**问题**: API请求失败
**解决**: 确认网络连接和API端点可访问

**问题**: 登录后界面不更新
**解决**: 检查Chrome存储权限和会话管理

## 📋 版本历史

### v1.5 (当前版本)
- ✅ 迁移到新API后端
- ✅ 移除Google OAuth
- ✅ 更新认证系统
- ✅ 改进错误处理
- ✅ 添加API测试页面

### v1.4 (之前版本)
- Google OAuth集成
- Supabase后端
- 基础见解功能

## 🚨 重要提醒

1. **数据备份**: 在更新前备份用户数据
2. **用户通知**: 通知用户需要重新登录
3. **回滚计划**: 准备回滚到旧版本的方案
4. **监控**: 部署后监控API调用和错误率

## 📞 支持

如果遇到问题，请：

1. 查看 `API_MIGRATION.md` 文档
2. 使用 `test-api.html` 测试API连接
3. 检查Chrome开发者工具的错误信息
4. 联系开发团队获取支持

---

**部署完成！** 🎉

扩展现在使用新的API后端，提供更好的性能和安全性。
