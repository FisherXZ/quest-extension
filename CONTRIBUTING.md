# 贡献指南

感谢你对Quest Extension项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告Bug
1. 使用GitHub Issues创建新的bug报告
2. 使用清晰、描述性的标题
3. 提供详细的复现步骤
4. 包含Chrome版本、操作系统等环境信息
5. 如果可能，提供截图或视频

### 建议新功能
1. 使用GitHub Issues创建功能请求
2. 清晰描述功能需求和使用场景
3. 解释为什么这个功能对项目有价值
4. 如果可能，提供实现思路

### 提交代码
1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 进行开发和测试
4. 提交更改：`git commit -m 'Add some feature'`
5. 推送分支：`git push origin feature/your-feature-name`
6. 创建Pull Request

## 🔧 开发环境设置

### 前置要求
- Chrome 88+
- Git
- 文本编辑器（推荐VS Code）

### 本地开发
```bash
# 克隆你fork的仓库
git clone https://github.com/your-username/quest-extension.git
cd quest-extension

# 在Chrome中加载扩展
# 1. 打开 chrome://extensions/
# 2. 开启开发者模式
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目文件夹
```

### 测试
1. 在Chrome扩展页面重新加载扩展
2. 测试所有功能：登录、保存洞察、标签管理
3. 检查浏览器控制台是否有错误
4. 测试不同场景和边界情况

## 📝 代码规范

### JavaScript
- 使用ES6+语法
- 使用驼峰命名法
- 添加适当的注释
- 保持函数简洁，单一职责

### HTML/CSS
- 使用语义化HTML标签
- 保持CSS类名清晰易懂
- 响应式设计

### 提交信息
- 使用现在时态：`Add feature` 而不是 `Added feature`
- 首行不超过50个字符
- 如需要，在空行后添加详细描述

例子：
```
Add Google OAuth login support

- Implement OAuth 2.0 flow
- Add Google login button to UI
- Handle user profile information
- Update session management
```

## 🧪 测试指南

### 功能测试
- [ ] 扩展正常加载
- [ ] 登录/注册功能正常
- [ ] Google OAuth登录正常
- [ ] 洞察保存功能正常
- [ ] 标签管理功能正常
- [ ] 用户界面响应正常

### 兼容性测试
- [ ] Chrome最新版本
- [ ] Chrome稳定版本
- [ ] 不同操作系统（Windows, macOS, Linux）

## 📋 Pull Request检查清单

在提交PR之前，请确保：

- [ ] 代码已经过本地测试
- [ ] 所有功能正常工作
- [ ] 没有控制台错误
- [ ] 代码风格符合项目规范
- [ ] 提交信息清晰明确
- [ ] 如果添加新功能，已更新相关文档

## 🏷️ 标签说明

我们使用以下标签来分类issues和PRs：

- `bug` - Bug报告
- `enhancement` - 新功能或改进
- `documentation` - 文档相关
- `good first issue` - 适合新贡献者
- `help wanted` - 需要帮助
- `priority: high` - 高优先级
- `priority: medium` - 中优先级
- `priority: low` - 低优先级

## ❓ 问题求助

如果你在贡献过程中遇到问题：

1. 查看现有的Issues和Discussions
2. 在GitHub Discussions中提问
3. 发送邮件到项目维护者

## 📄 许可证

通过贡献代码，你同意你的贡献将在MIT许可证下授权。

---

再次感谢你的贡献！🎉
