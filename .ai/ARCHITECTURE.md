# 项目架构

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vue 3 + Vite + TypeScript + Tailwind CSS | SPA，Composition API + `<script setup>` |
| 后端 | FastAPI (Python) | RESTful API，流式响应 |
| AI | OpenAI Compatible API | 通过 `openai` Python SDK 调用，支持自定义 base_url |
| 数据存储 | JSON 文件 | 无数据库，所有数据以 JSON 文件存储在 `backend/data/` |
| 部署 | 阿里云 ECS + Nginx | 静态文件由 Nginx 提供，API 反向代理到后端 |

## 一键启动（完整流程）

### 全新环境首次启动

```bash
# ========== 1. 后端 ==========
cd /www/wwwroot/ShangjiaoGaojin/backend

# 激活 conda 环境
source /opt/miniconda3/etc/profile.d/conda.sh
conda activate newsapp

# 确认环境变量已配置（首次需编辑 .env）
cat .env
# 至少需要 OPENAI_API_KEY=sk-xxx

# 启动后端（后台运行）
nohup python main.py > /var/log/newsapp.log 2>&1 &

# 验证后端
sleep 2 && curl -s http://127.0.0.1:8002/api/settings | head -c 100
# 应返回 JSON

# ========== 2. 前端构建 ==========
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue

npm install    # 首次需要安装依赖
npm run build  # 构建到 dist/

# 验证构建产物
ls -la dist/index.html
# 应显示最新时间戳

# ========== 3. Nginx ==========
# 设置临时目录权限（aa_nginx 的已知问题，必须先执行）
mkdir -p /var/lib/aa_nginx/tmp/{client_body,proxy,fastcgi,scgi,uwsgi}
chown -R nginx:nginx /var/lib/aa_nginx/tmp/
chmod -R 700 /var/lib/aa_nginx/tmp/

# 启动 Nginx
/usr/sbin/aa_nginx -c /etc/aa_nginx/aa_nginx.conf

# 验证外网访问
curl -I http://47.102.216.195/
# 应返回 HTTP/1.1 200 OK
```

### 日常重启（复制粘贴即可）

```bash
# ---------- 重启后端 ----------
kill -9 $(netstat -tlnp 2>/dev/null | grep :8002 | awk '{print $7}' | cut -d/ -f1) 2>/dev/null
sleep 2
cd /www/wwwroot/ShangjiaoGaojin/backend
source /opt/miniconda3/etc/profile.d/conda.sh
conda activate newsapp
nohup python main.py > /var/log/newsapp.log 2>&1 &
sleep 2 && curl -s http://127.0.0.1:8002/api/types | head -c 50

# ---------- 重启 Nginx ----------
fuser -k 80/tcp 2>/dev/null; sleep 2
mkdir -p /var/lib/aa_nginx/tmp/{client_body,proxy,fastcgi,scgi,uwsgi}
chown -R nginx:nginx /var/lib/aa_nginx/tmp/
chmod -R 700 /var/lib/aa_nginx/tmp/
/usr/sbin/aa_nginx -c /etc/aa_nginx/aa_nginx.conf && echo "Nginx 启动成功"
```

### 前端改代码后更新

```bash
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue
npm run build && echo "构建完成，刷新浏览器即可（Ctrl+F5 强制刷新）"
```

### 本地开发模式（前端热更新）

```bash
# 终端 1：后端
cd /www/wwwroot/ShangjiaoGaojin/backend
source /opt/miniconda3/etc/profile.d/conda.sh && conda activate newsapp
python main.py

# 终端 2：前端（Vite 开发服务器，自动代理 /api 到后端）
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue
npm run dev
# 访问 http://localhost:5174/
```

### 状态检查一览

```bash
echo "===== 后端 =====" && netstat -tlnp 2>/dev/null | grep :8002
echo "===== Nginx =====" && ss -tlnp | grep :80
echo "===== 后端API =====" && curl -s http://127.0.0.1:8002/api/types | head -c 80
echo "===== 外网 =====" && curl -sI http://47.102.216.195/ | head -3
echo "===== 磁盘 =====" && df -h / | tail -1
echo "===== 数据量 =====" && ls /www/wwwroot/ShangjiaoGaojin/backend/data/articles/ 2>/dev/null | wc -l && echo "篇文章"
```

## 目录结构

```
ShangjiaoGaojin/
├── frontend-vue/                  # 前端项目
│   ├── src/
│   │   ├── components/            # 通用组件 (Layout, FileUpload, Badge, Toast 等)
│   │   │   ├── UserMenu.vue       # 顶部头像菜单（个人中心 / 退出登录）
│   │   │   ├── AvatarCropModal.vue# 头像裁剪弹窗（上传后裁剪、预览、保存）
│   │   ├── pages/                 # 页面组件
│   │   │   ├── GeneratePage.vue   # 核心：三步式稿件生成（上传→选模板→生成）
│   │   │   ├── TemplatesPage.vue  # 模板管理（三栏布局：类型→模板列表→编辑器）
│   │   │   ├── ExtractPage.vue    # 大纲提取（上传稿件→AI提取→编辑→保存）
│   │   │   ├── HistoryPage.vue    # 历史记录（列表+详情，支持编辑和导出）
│   │   │   ├── SettingsPage.vue   # 系统设置（API Key、模型、基础信息）
│   │   │   ├── UploadPage.vue     # 文件上传解析
│   │   │   └── ProfilePage.vue    # 个人中心（资料、安全、统计、绑定，占位）
│   │   ├── types/index.ts         # 所有 TypeScript 类型定义
│   │   ├── types/markdown-it.d.ts # markdown-it 类型声明占位（避免 vue-tsc 报错）
│   │   ├── lib/profile.ts         # 本地用户资料存储工具（localStorage）
│   │   ├── App.vue                # 根组件（使用 keep-alive 保持页面状态）
│   │   ├── main.ts                # 入口 + 路由配置
│   │   └── index.css              # Tailwind + 自定义组件样式
│   ├── dist/                      # 构建输出（Nginx 直接提供此目录）
│   ├── vite.config.ts             # Vite 配置（含 API 代理和 Vue 别名）
│   └── tailwind.config.js         # Tailwind 配置（自定义 brand 色系）
│
├── backend/                       # 后端项目
│   ├── main.py                    # 全部后端逻辑（单文件，约 800 行）
│   ├── data/
│   │   ├── types_registry.json    # 新闻稿类型注册表
│   │   ├── settings.json          # 系统设置
│   │   ├── people.json            # 人物知识库
│   │   ├── outlines/              # 大纲模板文件 ({type_id}.json 或 {type_id}__{template_id}.json)
│   │   └── articles/              # 生成的文章 ({article_id}.json)
│   └── .env                       # 环境变量
│
└── .ai/                           # AI Agent 工作区（本目录）
```

## 核心数据流

### 稿件生成流程

```
用户上传素材文件 (.txt/.docx/.pdf)
  │
  ├─→ POST /api/files/parse     → 解析为纯文本
  ├─→ POST /api/classify         → AI 智能分类到已有类型
  ├─→ GET  /api/outlines/{type}  → 加载该类型的所有模板
  │
  ├─→ 用户选择模板 + 确认素材
  │
  ├─→ POST /api/match-people     → 模糊匹配人物知识库（百家姓+拼音+编辑距离）
  ├─→ POST /api/check-conflict   → AI 检测素材与知识库的信息冲突
  │
  └─→ POST /api/generate         → 流式生成新闻稿（SSE-like，text/plain）
        │
        └─→ POST /api/modify-article → 基于历史链的迭代修改（多轮对话上下文）
```

### 文章修改链

```
V0 (原始生成)
 └─→ V1 (修改版，parent_id = V0.id，trigger_query = 用户指令)
      └─→ V2 (修改版，parent_id = V1.id，trigger_query = 用户指令)
```

修改时，后端会：
1. 从当前文章向上追溯完整历史链
2. 重新加载对应的大纲模板，构建 system prompt
3. 将历史版本组装为 `assistant/user` 多轮对话
4. 追加当前修改指令，调用大模型生成

### 人名匹配算法

```
素材文本
  │
  ├─→ extract_candidates()      → 基于百家姓提取 2-3 字候选人名
  ├─→ 按姓氏首字符建立倒排索引    → 缩小比对范围
  ├─→ calculate_mixed_similarity() → (拼音相似度 + 字形相似度) / 2
  │     ├─ 拼音：pypinyin 转拼音 → 拼接为字符串 → 字符级 Levenshtein
  │     └─ 字形：字符级 Levenshtein
  └─→ 阈值判定：≥0.99 精确匹配，≥0.65 模糊匹配，≥0.55 低置信度候选
```

## 关键路径速查

| 内容 | 路径 |
|------|------|
| 前端源码 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/src/` |
| 前端构建产物 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/dist/` |
| 后端主程序 | `/www/wwwroot/ShangjiaoGaojin/backend/main.py` |
| 后端数据目录 | `/www/wwwroot/ShangjiaoGaojin/backend/data/` |
| 后端环境变量 | `/www/wwwroot/ShangjiaoGaojin/backend/.env` |
| Nginx 配置 | `/etc/aa_nginx/aa_nginx.conf` |
| Nginx 二进制 | `/usr/sbin/aa_nginx` |
| Nginx 静态文件根目录 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/dist` |
| 后端日志 | `/var/log/newsapp.log` |
| Conda 环境 | `newsapp`（通过 miniconda3 管理） |

## API 接口清单

### 核心接口

| 方法 | 路径 | 说明 | 响应类型 |
|------|------|------|----------|
| POST | `/api/files/parse` | 解析上传文件为文本 | JSON |
| POST | `/api/classify` | AI 分类文本类型 | JSON |
| POST | `/api/extract` | 上传文件并提取大纲 | JSON |
| POST | `/api/generate` | 生成新闻稿 | **流式 text/plain** |
| POST | `/api/modify-article` | 修改已有文章 | **流式 text/plain** |
| POST | `/api/match-people` | 人名模糊匹配 | JSON |
| POST | `/api/check-conflict` | 信息冲突检测 | JSON |

### CRUD 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/types` | 类型列表 / 新增类型 |
| PUT/DELETE | `/api/types/{type_id}` | 更新 / 删除类型 |
| GET/PUT | `/api/outline/{type_id}/{template_id}` | 获取 / 保存大纲 |
| GET | `/api/outlines/{type_id}` | 列出某类型所有模板 |
| GET/PUT/DELETE | `/api/articles/{article_id}` | 文章 CRUD |
| GET | `/api/articles/{article_id}/history` | 文章修改历史链 |
| GET | `/api/articles/{article_id}/download/docx` | 导出 Word |
| GET/POST | `/api/settings` | 系统设置 |
| GET | `/api/people` | 人物知识库 |

## 流式响应协议

`/api/generate` 和 `/api/modify-article` 的响应格式：

```
ID:{article_uuid}\n       ← 第一行，新文章的 UUID
正文内容逐字流式输出...     ← 后续所有内容为新闻稿正文
```

前端通过 `ReadableStream` API 读取，首次 chunk 中提取 `ID:` 前缀获取文章 ID。
