<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
</p>

<h1 align="center">📰 新闻稿智能体</h1>

<p align="center">
  <strong>AI-Powered Press Release Generator</strong><br/>
  基于大语言模型的新闻稿自动生成系统，支持模板管理、智能分类、人名匹配、流式生成与多版本迭代修改。
</p>

<p align="center">
  <a href="#-快速开始">快速开始</a> •
  <a href="#-功能特性">功能特性</a> •
  <a href="#-项目架构">项目架构</a> •
  <a href="#-api-文档">API 文档</a> •
  <a href="#-部署指南">部署指南</a> •
  <a href="#-贡献指南">贡献指南</a>
</p>

---

## ✨ 功能特性

### 🎯 核心流程

**三步式稿件生成**：上传素材 → 选择模板 → AI 生成新闻稿

- **智能分类**：上传素材后自动识别新闻稿类型（会议纪要、活动报道、学术论坛等）
- **流式生成**：实时逐字输出生成内容，无需等待完整响应
- **多版本迭代**：支持基于完整对话历史链的多轮修改，AI 能理解所有上下文

### 📋 模板管理

- 多层级大纲结构（支持无限嵌套子章节）
- 每个章节含写作指引（description）、字数范围（word_count）、颗粒度（granularity）
- 模板收藏、重命名、另存为、删除
- 从已有稿件自动提取通用大纲模板

### 👤 人物知识库

- 人名模糊匹配：基于 **百家姓过滤 + 拼音相似度 + 字形相似度** 的混合评分算法
- 姓氏倒排索引优化，大幅减少无效比对
- AI 自动检测素材与知识库的信息冲突
- 生成时自动融入人物头衔、职位等背景信息

### 📤 导出与历史

- 导出为 Word 文档（支持中文字体、标题层级）
- 完整的生成历史记录
- 在线编辑已生成的文章

## 📸 界面预览

<!-- 如有截图可在此处添加 -->
<!-- ![稿件生成](docs/screenshots/generate.png) -->
<!-- ![模板管理](docs/screenshots/templates.png) -->

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18.0 |
| Python | >= 3.10 |
| npm | >= 8.0 |

### 1. 克隆项目

```bash
git clone https://github.com/your-username/press-release-agent.git
cd press-release-agent
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 安装依赖
pip install fastapi uvicorn openai python-docx pypdf python-dotenv pypinyin markdown

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 OpenAI API Key

# 启动
python main.py
```

后端将在 `http://127.0.0.1:8002` 启动。

### 3. 启动前端

```bash
cd frontend-vue

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

前端将在 `http://localhost:5174` 启动，API 请求自动代理到后端。

### 4. 配置 AI 模型

打开浏览器访问 `http://localhost:5174/settings`，配置：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| API Key | OpenAI 兼容的 API Key | `sk-xxx` |
| Base URL | 自定义 API 端点（可选） | `https://api.openai.com/v1` |
| 模型名称 | 使用的模型 | `gpt-4o-mini` |

> 💡 支持所有 OpenAI 兼容的 API 提供商（如 DeepSeek、通义千问、Moonshot 等），只需修改 Base URL 和模型名称。

## 🏗 项目架构

```
press-release-agent/
├── frontend-vue/                # 前端 (Vue 3 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── GeneratePage.vue # 稿件生成（核心页面）
│   │   │   ├── TemplatesPage.vue# 模板管理
│   │   │   ├── ExtractPage.vue  # 大纲提取
│   │   │   ├── HistoryPage.vue  # 历史记录
│   │   │   └── SettingsPage.vue # 系统设置
│   │   └── types/index.ts       # TypeScript 类型定义
│   └── dist/                    # 构建输出
│
├── backend/                     # 后端 (FastAPI)
│   ├── main.py                  # 全部后端逻辑
│   └── data/                    # JSON 文件数据存储
│       ├── types_registry.json  # 类型注册表
│       ├── people.json          # 人物知识库
│       ├── outlines/            # 大纲模板
│       └── articles/            # 生成的文章
│
└── .ai/                         # AI Agent 工作区（开发辅助）
```

### 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Vue 3 Composition API | 响应式数据流清晰，`<script setup>` 语法简洁 |
| 构建工具 | Vite | 开发热更新快，内置 API 代理 |
| 样式方案 | Tailwind CSS | 原子化 CSS，自定义主题色系方便 |
| 后端框架 | FastAPI | 原生异步、自动文档、流式响应支持好 |
| AI 集成 | OpenAI SDK | 兼容性广，支持自定义 base_url |
| 数据存储 | JSON 文件 | 轻量部署，无需数据库，适合中小规模使用 |

### 核心数据流

```
上传素材 → 文件解析 → AI 智能分类
                          ↓
                    加载对应模板
                          ↓
              人名模糊匹配 + 冲突检测
                          ↓
              构建 Prompt（大纲+素材+知识库）
                          ↓
                    流式生成新闻稿
                          ↓
              保存文章 → 支持多轮修改
```

## 📖 API 文档

启动后端后，访问 `http://127.0.0.1:8002/docs` 查看自动生成的 Swagger 文档。

### 核心接口

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| `POST` | `/api/files/parse` | 解析上传的文件为文本 | JSON |
| `POST` | `/api/classify` | AI 智能分类 | JSON |
| `POST` | `/api/generate` | 生成新闻稿 | 流式 text/plain |
| `POST` | `/api/modify-article` | 修改已有文章 | 流式 text/plain |
| `POST` | `/api/match-people` | 人名模糊匹配 | JSON |
| `POST` | `/api/check-conflict` | 信息冲突检测 | JSON |

### 流式响应协议

`/api/generate` 和 `/api/modify-article` 返回流式纯文本：

```
ID:550e8400-e29b-41d4-a716-446655440000\n    ← 第一行：文章 UUID
正文内容逐字流式输出...                        ← 后续：新闻稿正文
```

## 🚢 部署指南

### 使用 Nginx 部署

#### 1. 构建前端

```bash
cd frontend-vue
npm run build
```

#### 2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend-vue/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;           # 流式响应必须关闭缓冲
        proxy_cache off;
    }
}
```

> ⚠️ `proxy_buffering off` 对流式生成至关重要，否则内容会等到全部生成完才一次性返回。

#### 3. 启动后端服务

```bash
cd backend
nohup python main.py > /var/log/newsapp.log 2>&1 &
```

建议使用 `systemd` 或 `supervisor` 管理后端进程，确保崩溃后自动重启。

### 使用 Docker 部署（可选）

```dockerfile
# Dockerfile 示例（需根据实际情况调整）
FROM python:3.11-slim

WORKDIR /app
COPY backend/ .
RUN pip install --no-cache-dir fastapi uvicorn openai python-docx pypdf python-dotenv pypinyin markdown

EXPOSE 8002
CMD ["python", "main.py"]
```

## ⚙️ 配置说明

### 环境变量（backend/.env）

```env
OPENAI_API_KEY=sk-xxx             # 必填：API Key
OPENAI_BASE_URL=https://xxx       # 可选：自定义 API 端点
OPENAI_MODEL=gpt-4o-mini          # 可选：模型名称，默认 gpt-4o-mini
SERVER_HOST=0.0.0.0               # 可选：监听地址，默认 127.0.0.1
SERVER_PORT=8002                  # 可选：监听端口，默认 8002
```

### 人物知识库（backend/data/people.json）

```json
{
  "people": {
    "张三": "清华大学计算机科学与技术系教授，博士生导师，研究方向为自然语言处理。",
    "李四": "某某集团董事长，高级经济师，曾任某省工商联副主席。"
  }
}
```

知识库中的人物在生成时会被自动匹配，并在首次提及时融入背景信息。

### Vite 配置注意事项

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      // ⚠️ 必须保留：SectionEditor 使用运行时模板编译
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true
      }
    }
  }
})
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <描述>

feat(generate): 添加知识库人名匹配功能
fix(template): 修复 SectionEditor 无法编辑的问题
docs: 更新 README 部署指南
```

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `style` | 样式调整 |
| `docs` | 文档更新 |
| `chore` | 构建/工具 |
| `perf` | 性能优化 |

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交改动：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 提交 Pull Request

### 本地开发

```bash
# 前端开发（热更新）
cd frontend-vue && npm run dev

# 后端开发（手动重启）
cd backend && python main.py

# 前端类型检查
cd frontend-vue && npx vue-tsc --noEmit
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) — 渐进式 JavaScript 框架
- [FastAPI](https://fastapi.tiangolo.com/) — 现代 Python Web 框架
- [Tailwind CSS](https://tailwindcss.com/) — 实用优先的 CSS 框架
- [Lucide Icons](https://lucide.dev/) — 精美的开源图标库
- [OpenAI](https://openai.com/) — 大语言模型 API

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！
</p>