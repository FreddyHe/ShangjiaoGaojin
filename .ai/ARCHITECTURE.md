# 项目架构

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vue 3 + Vite + TypeScript + Tailwind CSS | SPA，Composition API + `<script setup>` |
| 后端 | FastAPI (Python) | RESTful API，流式响应，JWT 认证 |
| AI | OpenAI Compatible API | 通过 `openai` Python SDK 调用，支持自定义 base_url |
| 数据存储 | JSON 文件 | 无数据库，所有数据以 JSON 文件存储在 `backend/data/` |
| 认证 | JWT (PyJWT) | 基于 Token 的认证，支持 admin/user 角色 |
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

# 安装依赖
pip install -r requirements.txt

# 启动后端（通过 systemd 服务）
systemctl start newsapp.service

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

### Git Pull 后更新服务（日常最常用）

```bash
# ========== 1. 拉取最新代码 ==========
cd /www/wwwroot/ShangjiaoGaojin
git pull origin main

# ========== 2. 更新后端 ==========
# 激活 conda 环境（如果当前 shell 未激活）
source /opt/miniconda3/etc/profile.d/conda.sh
conda activate newsapp

# 安装/更新依赖（requirements.txt 可能有变动）
cd /www/wwwroot/ShangjiaoGaojin/backend
pip install -r requirements.txt

# 重启后端服务
systemctl restart newsapp.service

# 验证后端正常运行
systemctl status newsapp.service
curl -s http://127.0.0.1:8002/api/types | head -c 80

# ========== 3. 重新构建前端 ==========
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue
npm install      # package.json 可能有新依赖
npm run build    # 重新构建到 dist/

# ========== 4. 完成 ==========
# Nginx 无需重启，它直接指向 dist/ 目录
# 浏览器 Ctrl+F5 强制刷新即可看到新版本
```

### 日常重启（不涉及代码更新）

```bash
# ---------- 重启后端 ----------
systemctl restart newsapp.service
systemctl status newsapp.service

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
echo "===== 后端服务 =====" && systemctl status newsapp.service --no-pager | head -5
echo "===== 后端端口 =====" && netstat -tlnp 2>/dev/null | grep :8002
echo "===== Nginx =====" && ss -tlnp | grep :80
echo "===== 后端API =====" && curl -s http://127.0.0.1:8002/api/types | head -c 80
echo "===== 外网 =====" && curl -sI http://47.102.216.195/ | head -3
echo "===== 磁盘 =====" && df -h / | tail -1
echo "===== 数据量 =====" && ls /www/wwwroot/ShangjiaoGaojin/backend/data/articles/ 2>/dev/null | wc -l && echo "篇文章"
```

### 后端服务管理（systemd）

后端通过 `newsapp.service` 管理，已设置开机自启和自动重启。

```bash
systemctl start newsapp.service     # 启动
systemctl stop newsapp.service      # 停止
systemctl restart newsapp.service   # 重启
systemctl status newsapp.service    # 查看状态
journalctl -u newsapp.service -f    # 实时查看日志
```

> **注意：** 不要使用 `nohup python main.py &` 手动启动后端，会与 systemd 服务冲突导致端口占用。统一使用 `systemctl` 管理。

## 目录结构

```
ShangjiaoGaojin/
├── frontend-vue/                  # 前端项目（当前使用）
│   ├── src/
│   │   ├── components/            # 通用组件
│   │   │   ├── Layout.vue         # 全局布局（侧边栏导航 + 顶栏 + 内容区）
│   │   │   ├── UserMenu.vue       # 顶部头像菜单（个人中心 / 退出登录）
│   │   │   ├── AvatarCropModal.vue# 头像裁剪弹窗（上传后裁剪、预览、保存）
│   │   │   ├── FileUpload.vue     # 通用文件上传组件
│   │   │   ├── Badge.vue          # 标签徽章组件
│   │   │   ├── Toast.vue          # 全局提示消息
│   │   │   ├── EmptyState.vue     # 空状态占位组件
│   │   │   └── LoadingSpinner.vue # 加载中旋转动画组件
│   │   ├── pages/                 # 页面组件
│   │   │   ├── GeneratePage.vue   # 核心：三步式稿件生成（上传→选模板→生成）
│   │   │   ├── TemplatesPage.vue  # 模板管理（三栏布局：类型→模板列表→编辑器）
│   │   │   ├── ExtractPage.vue    # 大纲提取（上传稿件/URL→AI提取→编辑→保存）
│   │   │   ├── KnowledgePage.vue  # 信息库管理（多分类知识库 CRUD + 历史回退 + 官网同步）
│   │   │   ├── HistoryPage.vue    # 历史记录（列表+详情，支持编辑和导出）
│   │   │   ├── SettingsPage.vue   # 系统设置（API Key、模型、基础信息，仅管理员）
│   │   │   ├── UploadPage.vue     # 文件上传解析
│   │   │   ├── LoginPage.vue      # 登录页面（JWT 认证）
│   │   │   └── ProfilePage.vue    # 个人中心（资料、安全、统计、绑定，占位）
│   │   ├── composables/
│   │   │   └── useAuth.ts         # 认证组合式函数（token/username/role 管理）
│   │   ├── types/index.ts         # 所有 TypeScript 类型定义
│   │   ├── types/markdown-it.d.ts # markdown-it 类型声明占位（避免 vue-tsc 报错）
│   │   ├── lib/profile.ts         # 本地用户资料存储工具（localStorage）
│   │   ├── App.vue                # 根组件（登录页无 Layout，其他页面用 keep-alive）
│   │   ├── main.ts                # 入口 + 路由配置 + 全局 fetch 拦截（自动带 Token）
│   │   ├── vite-env.d.ts          # Vite 环境类型声明
│   │   └── index.css              # Tailwind + 自定义组件样式
│   ├── public/                    # 静态资源
│   │   ├── logo.png               # 系统 Logo
│   │   ├── background.png         # 背景图
│   │   ├── SAIF_LOGO_White_W_500.png
│   │   └── template.html          # 导出模板
│   ├── dist/                      # 构建输出（Nginx 直接提供此目录）
│   ├── vite.config.ts             # Vite 配置（含 API 代理和 Vue 运行时编译器别名）
│   ├── tailwind.config.js         # Tailwind 配置（自定义 brand 色系）
│   └── package.json               # 依赖：vue, vue-router, lucide-vue-next, markdown-it, clsx, tailwind-merge
│
├── backend/                       # 后端项目
│   ├── main.py                    # 全部后端逻辑（单文件，约 2000 行）
│   ├── requirements.txt           # Python 依赖
│   ├── data/
│   │   ├── types_registry.json    # 新闻稿类型注册表
│   │   ├── settings.json          # 系统设置（API Key、模型、基础信息）
│   │   ├── people.json            # 人物知识库（核心）
│   │   ├── people_meta.json       # 人物元数据（头像 URL、个人主页链接）
│   │   ├── people_scraped.json    # 官网爬取的原始教授数据
│   │   ├── outlines/              # 大纲模板文件 ({type_id}.json 或 {type_id}__{template_id}.json)
│   │   ├── articles/              # 生成的文章 ({article_id}.json)
│   │   └── history/               # 知识库历史版本（按分类存放，用于回退）
│   ├── docs/                      # 测试用文档（各类新闻稿样本）
│   ├── test/                      # 测试文件
│   │   ├── test_extract_outline.py
│   │   ├── test_faculty.html
│   │   ├── test_scraper.py
│   │   └── test_single.py
│   ├── .env                       # 环境变量
│   └── .env.example               # 环境变量模板
│
├── frontend/                      # 旧前端项目（已弃用，保留但不使用）
│
└── .ai/                           # AI Agent 工作区（本目录）
```

## 认证系统

### 架构

- **后端**：JWT Token 认证，`PyJWT` 库签发/验证
- **前端**：`useAuth` 组合式函数管理 token/username/role，存储在 `localStorage`
- **全局拦截**：`main.ts` 中重写 `window.fetch`，对所有 `/api` 请求自动附加 `Authorization: Bearer <token>` 头
- **401 处理**：全局 fetch 拦截到 401 响应时自动调用 `logout()` 跳转登录页

### 用户角色

| 角色 | 权限 |
|------|------|
| `admin` | 全部功能，包括系统设置、删除类型、删除模板 |
| `user` | 除系统设置外的所有功能 |

### 当前用户数据库（硬编码）

```python
USERS_DB = {
    "admin": ("admin", "admin"),
    "user": ("user", "user")
}
```

### 路由守卫

- 未登录用户只能访问 `/login`，其他路由自动跳转登录页
- `meta.requiresAdmin` 路由（如 `/settings`）仅管理员可访问
- 已登录用户访问 `/login` 自动跳转首页

### 前端导航栏

| 路径 | 标签 | 图标 | 权限 |
|------|------|------|------|
| `/templates` | 模板管理 | LayoutDashboard | 所有用户 |
| `/extract` | 大纲提取 | FileText | 所有用户 |
| `/generate` | 稿件生成 | PenTool | 所有用户 |
| `/knowledge` | 信息库 | Database | 所有用户 |
| `/history` | 历史记录 | History | 所有用户 |
| `/settings` | 系统设置 | Settings | 仅管理员 |

## 知识库系统

### 多分类架构

后端支持多个知识库分类，通过 `KNOWLEDGE_FILES` 字典映射：

```python
KNOWLEDGE_FILES = {
    "people": DATA_DIR / "people.json",     # 人物知识库（已使用）
    "brands": DATA_DIR / "brands.json",     # 品牌库（预留）
    "courses": DATA_DIR / "courses.json",   # 课程库（预留）
    "research": DATA_DIR / "research.json", # 研究库（预留）
    "alumni": DATA_DIR / "alumni.json",     # 校友库（预留）
}
```

### 历史版本与回退

- 每次更新知识库时，自动在 `data/history/{category}/` 创建备份
- 支持通过 API 回退到任意历史版本
- 回退前会再次备份当前版本（标记 `_pre_rollback`）

### 官网教授同步

- `POST /api/knowledge/sync/faculty` 从 SAIF 官网爬取教授数据
- 支持全职教授、访问教授、兼职教授、兼聘教授四个分类
- 并发抓取（aiohttp，限制 10 并发），流式返回进度
- 爬取内容包括：姓名、职称、个人简介、头像 URL、个人主页链接

## 核心数据流

### 稿件生成流程

```
用户上传素材文件 (.txt/.docx/.pdf) 或提供 URL
  │
  ├─→ POST /api/extract           → 流式：解析文件/抓取URL + AI 智能分类（合并为一步）
  ├─→ GET  /api/outlines/{type}   → 加载该类型的所有模板
  │
  ├─→ 用户选择模板 + 确认素材
  │
  ├─→ POST /api/match-people      → 模糊匹配人物知识库（百家姓+拼音+编辑距离）
  ├─→ POST /api/check-conflict    → AI 检测素材与知识库的信息冲突
  │
  └─→ POST /api/generate          → 流式生成新闻稿（text/plain）
        │
        └─→ POST /api/modify-article → 基于历史链的迭代修改（多轮对话上下文）
```

### 大纲提取流程

```
用户上传稿件文件 (.txt/.docx/.pdf) 或提供 URL
  │
  ├─→ POST /api/extract           → 流式：解析 + AI 分类（返回 texts + type）
  ├─→ POST /api/extract/outline   → 流式：AI 提取大纲结构（支持多篇合并）
  │
  └─→ 用户编辑大纲 → PUT /api/outline/{type_id}/{template_id} 保存
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
  ├─→ extract_candidates()      → 基于百家姓提取 2-3 字候选人名 + 正则提取英文名
  ├─→ 按姓氏首字符建立倒排索引    → 缩小比对范围（英文名遍历全库）
  ├─→ calculate_mixed_similarity() → (拼音相似度 + 字形相似度) / 2
  │     ├─ 拼音：pypinyin 转拼音 → 拼接为字符串 → 字符级 Levenshtein
  │     └─ 字形：字符级 Levenshtein
  └─→ 阈值判定：≥0.99 精确匹配，≥0.65 模糊匹配，≥0.55 低置信度候选
      └─→ 每个匹配结果附带最多 5 个相似名字候选（≥0.5）
```

## 关键路径速查

| 内容 | 路径 |
|------|------|
| 前端源码 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/src/` |
| 前端构建产物 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/dist/` |
| 后端主程序 | `/www/wwwroot/ShangjiaoGaojin/backend/main.py` |
| 后端依赖 | `/www/wwwroot/ShangjiaoGaojin/backend/requirements.txt` |
| 后端数据目录 | `/www/wwwroot/ShangjiaoGaojin/backend/data/` |
| 知识库历史 | `/www/wwwroot/ShangjiaoGaojin/backend/data/history/` |
| 测试文档 | `/www/wwwroot/ShangjiaoGaojin/backend/docs/` |
| 后端环境变量 | `/www/wwwroot/ShangjiaoGaojin/backend/.env` |
| 后端 systemd 服务 | `/etc/systemd/system/newsapp.service` |
| Nginx 配置 | `/etc/aa_nginx/aa_nginx.conf` |
| Nginx 二进制 | `/usr/sbin/aa_nginx` |
| Nginx 静态文件根目录 | `/www/wwwroot/ShangjiaoGaojin/frontend-vue/dist` |
| 后端日志 | `/var/log/newsapp.log` |
| Conda 环境 | `newsapp`（通过 miniconda3 管理） |

## API 接口清单

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录获取 JWT Token | 公开 |
| GET | `/api/auth/sso/login` | SSO 登录占位接口 | 公开 |

### 核心业务接口

| 方法 | 路径 | 说明 | 响应类型 |
|------|------|------|----------|
| POST | `/api/files/parse` | 解析上传文件为文本 | JSON |
| POST | `/api/classify` | AI 分类文本类型 | JSON |
| POST | `/api/extract` | 上传文件/URL → 解析 + AI 分类（合并流式） | **流式 NDJSON** |
| POST | `/api/extract/outline` | 基于分类结果提取大纲 | **流式 NDJSON** |
| POST | `/api/generate` | 生成新闻稿 | **流式 text/plain** |
| POST | `/api/modify-article` | 修改已有文章 | **流式 text/plain** |
| POST | `/api/match-people` | 人名模糊匹配 | JSON |
| POST | `/api/check-conflict` | 信息冲突检测 | JSON |

### 类型与模板 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/types` | 类型列表（含模板计数） | 登录 |
| POST | `/api/types` | 新增类型 | 登录 |
| PUT | `/api/types/{type_id}` | 更新类型名称 | 登录 |
| DELETE | `/api/types/{type_id}` | 删除类型及其所有模板 | **仅管理员** |
| GET | `/api/outline/{type_id}` | 获取默认大纲 | 登录 |
| PUT | `/api/outline/{type_id}` | 保存默认大纲 | 登录 |
| GET | `/api/outline/{type_id}/{template_id}` | 获取指定模板大纲 | 登录 |
| PUT | `/api/outline/{type_id}/{template_id}` | 保存指定模板大纲 | 登录 |
| POST | `/api/outline/{type_id}/{template_id}/favorite` | 切换模板收藏 | 登录 |
| DELETE | `/api/outline/{type_id}/{template_id}` | 删除模板 | **仅管理员** |
| GET | `/api/outlines/{type_id}` | 列出某类型所有模板 | 登录 |

### 文章 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles` | 列出所有文章（按时间倒序） |
| GET | `/api/articles/{article_id}` | 获取单篇文章 |
| PUT | `/api/articles/{article_id}` | 更新文章内容 |
| DELETE | `/api/articles/{article_id}` | 删除文章 |
| GET | `/api/articles/{article_id}/history` | 文章修改历史链 |
| GET | `/api/articles/{article_id}/download/docx` | 导出 Word 文档 |

### 知识库接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/knowledge/{category}` | 获取某分类知识库全部数据 |
| POST | `/api/knowledge/{category}` | 更新某分类知识库全部数据 |
| GET | `/api/knowledge/{category}/history` | 获取某分类的历史版本列表 |
| POST | `/api/knowledge/{category}/rollback/{timestamp}` | 回退到指定历史版本 |
| GET | `/api/people` | 人物知识库（向后兼容旧接口） |
| GET | `/api/people/meta` | 人物元数据（头像、主页链接） |
| POST | `/api/knowledge/sync/faculty` | 从 SAIF 官网同步教授数据（流式进度） |

### 系统设置

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/settings` | 获取系统设置 | 登录 |
| POST | `/api/settings` | 更新系统设置 | **仅管理员** |

## 流式响应协议

### 文章生成/修改（text/plain）

`/api/generate` 和 `/api/modify-article` 的响应格式：

```
ID:{article_uuid}\n       ← 第一行，新文章的 UUID
正文内容逐字流式输出...     ← 后续所有内容为新闻稿正文
```

前端通过 `ReadableStream` API 读取，首次 chunk 中提取 `ID:` 前缀获取文章 ID。

### 流式进度（NDJSON）

`/api/extract`、`/api/extract/outline`、`/api/knowledge/sync/faculty` 使用 NDJSON 格式：

```json
{"status": "progress", "message": "正在解析文件内容..."}
{"status": "progress", "message": "正在进行内容类型智能分类...", "progress": 50}
{"status": "success", "message": "完成", "data": {...}}
{"status": "error", "message": "错误描述"}
```

前端逐行解析 JSON，根据 `status` 字段更新 UI 状态。