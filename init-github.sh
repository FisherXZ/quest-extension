#!/bin/bash

# Quest Extension GitHub仓库初始化脚本

echo "🚀 初始化Quest Extension GitHub仓库..."

# 初始化Git仓库
git init

# 添加所有文件
echo "📁 添加项目文件..."
git add .

# 初始提交
echo "💾 创建初始提交..."
git commit -m "🎉 Initial commit: Quest Extension v1.5.0

✨ Features:
- Chrome extension with Manifest V3
- Google OAuth 2.0 login support
- Email/password authentication
- Smart tag management system
- Auto metadata extraction
- AI text processing
- Responsive UI design

🔧 Technical:
- Vanilla JavaScript (no dependencies)
- REST API integration
- JWT authentication
- Chrome APIs (identity, storage, tabs)

📚 Documentation:
- Complete setup guides
- API migration documentation
- Google OAuth configuration
- Deployment instructions"

# 设置主分支
git branch -M main

echo "✅ Git仓库初始化完成！"
echo ""
echo "🔗 下一步：连接到GitHub远程仓库"
echo "1. 在GitHub上创建新仓库 'quest-extension'"
echo "2. 运行以下命令连接远程仓库："
echo "   git remote add origin https://github.com/your-username/quest-extension.git"
echo "   git push -u origin main"
echo ""
echo "🏷️ 创建第一个发布标签："
echo "   git tag v1.5.0"
echo "   git push origin v1.5.0"
echo ""
echo "📋 项目已准备好上传到GitHub！"
