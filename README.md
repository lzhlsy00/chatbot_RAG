# AI Chatbot with Coze API

基于 Next.js 和 Coze API 构建的智能聊天机器人界面。

## 功能特性

- 🤖 集成 Coze API 实现智能对话
- 💬 类似 ChatGPT 的聊天界面
- 📱 响应式设计，支持移动端
- ⚡ 基于 Next.js 13+ App Router
- 🎨 使用 Tailwind CSS 样式

## 技术栈

- **框架**: Next.js 15
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **API**: Coze API

## 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd chatbot-rag
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 文件，填入你的 Coze API 配置：
   ```
   COZE_API_TOKEN=your_coze_api_token_here
   COZE_BOT_ID=your_bot_id_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 获取 Coze API 密钥

1. 访问 [Coze 官网](https://www.coze.com/)
2. 注册并登录账户
3. 创建一个机器人应用
4. 获取 API Token 和 Bot ID
5. 将这些信息填入 `.env.local` 文件

## 项目结构

```
src/
├── app/
│   ├── api/chat/          # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页
├── components/
│   ├── ChatContainer.tsx  # 主聊天容器
│   ├── ChatInput.tsx     # 消息输入组件
│   └── ChatMessage.tsx   # 消息显示组件
├── lib/
│   └── coze.ts           # Coze API 集成
└── types/
    └── chat.ts           # 类型定义
```

## 部署

### Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

确保在部署平台中正确配置环境变量：
- `COZE_API_TOKEN`
- `COZE_BOT_ID`

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```