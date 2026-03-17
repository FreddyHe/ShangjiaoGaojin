# 项目调试文档

## 一、项目架构概览

本项目是一个基于 Vue 3 + FastAPI 的新闻稿生成系统，包含前端和后端两个主要部分。

### 前端架构
- **框架**：Vue 3 + Vite + TypeScript
- **UI 库**：Tailwind CSS
- **路由**：Vue Router
- **状态管理**：Vue 3 Composition API (ref, computed, watch)
- **主要页面**：
  - GeneratePage.vue - 稿件生成页面（三步流程）
  - TemplatesPage.vue - 模板管理页面
  - HistoryPage.vue - 历史记录页面

### 后端架构
- **框架**：FastAPI (Python)
- **AI 集成**：OpenAI API
- **文件处理**：python-docx, pypdf, xhtml2pdf
- **数据存储**：JSON 文件存储在 `backend/data/` 目录
- **主要功能**：
  - 文件解析（.txt, .docx, .pdf）
  - 智能分类
  - 人名匹配和冲突检测
  - 新闻稿生成（流式响应）
  - 文章修改（流式响应）
  - Word/PDF 导出

## 二、关键路径和配置

### 前端路径
- **项目根目录**：`/www/wwwroot/ShangjiaoGaojin/frontend-vue`
- **源码目录**：`src/`
- **页面目录**：`src/pages/`
- **组件目录**：`src/components/`
- **类型定义**：`src/types/`
- **配置文件**：`vite.config.ts`
- **构建输出**：`dist/`

### 后端路径
- **项目根目录**：`/www/wwwroot/ShangjiaoGaojin/backend`
- **主程序**：`main.py`
- **数据目录**：`data/`
  - `data/articles/` - 文章存储
  - `data/outlines/` - 大纲存储
  - `data/types/` - 类型存储
  - `data/people/` - 人物知识库

### 配置信息
- **前端开发服务器**：`http://localhost:5174`
- **后端 API 服务器**：`http://127.0.0.1:8002`
- **API 代理**：Vite 配置了 `/api` 代理到后端
- **环境变量文件**：`backend/.env`
  - `OPENAI_API_KEY`：OpenAI API 密钥
  - `OPENAI_BASE_URL`：API 基础 URL（可选）
  - `OPENAI_MODEL`：模型名称，默认 gpt-4o-mini
  - `SERVER_HOST`：服务器监听地址，默认 0.0.0.0
  - `SERVER_PORT`：服务器端口，默认 8002

### Nginx 配置
- **配置文件**：`/etc/aa_nginx/aa_nginx.conf`
- **前端静态文件**：`/www/wwwroot/ShangjiaoGaojin/frontend-vue/dist`
- **监听端口**：80
- **API 代理**：`/api` 代理到 `http://127.0.0.1:8002`

## 三、服务启动方法

### 启动后端服务
```bash
cd /www/wwwroot/ShangjiaoGaojin/backend
source /opt/miniconda3/etc/profile.d/conda.sh
conda activate newsapp
nohup python main.py > /var/log/newsapp.log 2>&1 &
```

后端启动成功后会显示：
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8002 (Press CTRL+C to quit)
```

### 启动 Nginx 服务
```bash
/usr/sbin/aa_nginx -c /etc/aa_nginx/aa_nginx.conf
```

### 前端开发模式（可选）
```bash
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue
npm run dev
```

前端启动成功后会显示：
```
  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

### 重启服务
如果需要重启后端：
1. 查找占用端口的进程：`netstat -tlnp | grep 8002`
2. 杀死进程：`kill -9 <PID>`
3. 重新启动后端服务

如果需要重启 Nginx：
```bash
/usr/sbin/aa_nginx -s reload
```

## 四、已解决的问题记录

### 1. GeneratePage.vue 页面卡死问题
**问题描述**：点击侧边栏进入"稿件生成"页面后，整个页面被阻塞，无法再点击侧边栏切换到其他页面。

**根本原因**：
- watch 监听了 `[step, materials, allPeople]` 三个变量
- onMounted 加载 `allPeople` 时触发 watch
- matchPeople 函数没有防重复机制
- 导致连锁反应阻塞主线程

**解决方案**：
- 修改 watch 只监听 `step` 变化
- 在 matchPeople 函数开头添加防重复检查：`if (checkingConflicts.value) return`
- 修复 onMounted 中的数据加载：直接设置响应式变量而非使用不存在的函数

**修改文件**：`frontend-vue/src/pages/GeneratePage.vue`

### 2. TemplatesPage.vue 模板编辑器无法编辑问题
**问题描述**：点击"添加一级标题"后，新添加的 section 无法编辑标题、无法添加要点、无法添加子标题。

**根本原因**：
- SectionEditor 组件在第二个 `<script lang="ts">` 块中定义
- 使用了 `OutlineSection` 类型但未导入
- 导致类型系统无法正确验证，响应式系统出现问题

**解决方案**：
- 在第二个 script 块中添加类型导入：`import type { OutlineSection } from '@/types'`

**修改文件**：`frontend-vue/src/pages/TemplatesPage.vue`

### 3. TemplatesPage.vue 右侧编辑器不显示大纲内容
**问题描述**：点击中间栏的模板后，右侧编辑器没有加载并显示该模板的大纲内容（sections）。

**根本原因**：
- watch 监听了 ref 对象而非 getter 函数
- Vue 3 中直接监听 ref 对象可能不会正确触发变化

**解决方案**：
- 修改 watch 监听 getter 函数：`watch([() => selectedTypeId.value, () => selectedTemplateId.value], ...)`
- 添加调试日志追踪数据加载

**修改文件**：`frontend-vue/src/pages/TemplatesPage.vue`

### 4. TemplatesPage.vue SectionEditor 组件运行时模板编译错误
**问题描述**：SectionEditor 组件使用了 template 字符串形式的模板，但 Vite 默认的 Vue 构建版本不支持运行时模板编译。

**根本原因**：
- Vite 默认使用不包含运行时编译器的 Vue 版本
- SectionEditor 组件使用字符串模板需要运行时编译器

**解决方案**：
- 在 `vite.config.ts` 中添加 Vue 别名：`'vue': 'vue/dist/vue.esm-bundler.js'`
- 使用包含运行时编译器的 Vue 版本

**修改文件**：`frontend-vue/vite.config.ts`

### 5. TemplatesPage.vue TypeScript 类型断言运行时错误
**问题描述**：SectionEditor 组件的 template 字符串中使用了 TypeScript 的 as 类型断言语法，运行时模板编译器不支持。

**根本原因**：
- 运行时模板编译器不处理 TypeScript 语法
- `($event.target as HTMLInputElement).value` 在运行时无法执行

**解决方案**：
- 移除所有 `as HTMLInputElement` 类型断言
- 改为 `$event.target.value`

**修改文件**：`frontend-vue/src/pages/TemplatesPage.vue`

### 6. HistoryPage.vue 右侧文章内容区域无法滚动
**问题描述**：右侧详情面板的内容区域无法滚动查看全文。

**根本原因**：
- 外层容器没有设置固定高度
- 内容区域没有正确的 flex 布局

**解决方案**：
- 修改最外层容器高度：`h-[calc(100vh-8rem)]`
- 给 selectedArticle 的 div 添加 `flex flex-col h-full`
- 给顶部操作栏添加 `flex-shrink-0`
- 内容区域已有 `flex-1 overflow-y-auto`

**修改文件**：`frontend-vue/src/pages/HistoryPage.vue`

### 7. HistoryPage.vue 编辑模式文本框太小
**问题描述**：点击"修改"后，编辑文本框太小，无法舒适地编辑内容。

**根本原因**：
- textarea 只设置了 `h-full` 但没有最小高度
- 在 flex 布局中可能被压缩

**解决方案**：
- 添加 `min-h-[60vh]` 确保最小高度
- 移除不必要的背景色和字体颜色类
- 修改 focus 颜色为橙色主题

**修改文件**：`frontend-vue/src/pages/HistoryPage.vue`

### 8. backend/main.py Word 导出中文显示问题
**问题描述**：导出的 Word 文档中文字体不正确，中文显示异常。

**根本原因**：
- 没有设置默认字体
- 没有设置中文字体

**解决方案**：
- 设置默认字体为宋体，字号 12pt
- 使用 `docx.oxml.ns.qn` 设置中文字体
- 解析 Markdown 标题并转换为对应的 Word 标题样式
- 设置所有标题（Heading 1-3）的字体为黑体
- 移除 Markdown 加粗标记

**修改文件**：`backend/main.py`

### 9. backend/main.py PDF 导出中文显示为黑色方块
**问题描述**：导出的 PDF 文档中中文显示为黑色方块（tofu blocks）。

**根本原因**：
- xhtml2pdf (pisa) 不能直接使用 CSS 字体名称
- 必须显式注册 TTF 字体文件
- .ttc 格式（TrueType Collection）不被支持

**解决方案**：
- 优先使用 .ttf 格式的字体文件
- 使用 `pdfmetrics.registerFont(TTFont(...))` 显式注册字体
- 在 CSS 中使用注册后的字体名称
- 字体候选列表：simhei.ttf, msyh.ttf, simkai.ttf, simfang.ttf

**修改文件**：`backend/main.py`

### 10. GeneratePage.vue 第二步右侧预览区域无法滚动
**问题描述**：右侧预览区域不能滚动，"使用此模板生成"按钮被挤到视口外面看不到。

**根本原因**：
- 外层容器没有 `overflow-hidden`
- 大纲内容区域没有 `min-h-0`，导致 flex 子元素无法收缩

**解决方案**：
- 外层容器添加 `overflow-hidden` 和 `flex flex-col`
- 标题信息区域添加 `flex-shrink-0`
- 大纲内容区域添加 `flex-1 overflow-y-auto min-h-0`（min-h-0 很重要）
- 按钮区域用 `flex-shrink-0` 包裹

**修改文件**：`frontend-vue/src/pages/GeneratePage.vue`

### 11. 页面状态丢失问题
**问题描述**：用户从"稿件生成"切换到其他页面再回来时，之前的步骤和数据都丢失了。

**根本原因**：
- Vue Router 的默认行为是切换路由时销毁组件
- 回来时重新创建组件，所有状态丢失

**解决方案**：
- 在 App.vue 中使用 `<keep-alive>` 包裹 `<router-view>`
- 保持组件状态，避免重新创建

**修改文件**：`frontend-vue/src/App.vue`

### 12. ExtractPage.vue 大纲提取后无法编辑和保存到模板
**问题描述**：大纲提取页面（ExtractPage.vue）提取完之后只是把结果显示出来，存到了 localStorage，但没有提供编辑和保存到模板的功能。用户无法在提取后修改大纲内容并保存为模板。

**根本原因**：
- ExtractPage.vue 只实现了提取功能，缺少编辑和保存功能
- 没有复用 TemplatesPage.vue 中的 SectionEditor 组件编辑逻辑
- 缺少"保存到模板"按钮和相关 API 调用

**解决方案**：
- 重写 ExtractPage.vue，添加完整的编辑功能
- 复用 TemplatesPage.vue 中的 SectionEditor 组件的编辑逻辑
- 每个 section 的标题、要点、子章节都可以编辑
- 可以添加/删除 section 和 bullets
- 底部添加"保存到模板"按钮，调用 PUT /api/outline/{type_id}/{template_id} 保存大纲
- 保存时使用提取结果中的 type_id 和用户输入的 template_id
- 去掉 localStorage 和不需要的 SectionView 组件

**修改文件**：`frontend-vue/src/pages/ExtractPage.vue`

## 五、当前待解决的问题

目前没有已知的待解决问题。所有主要功能已经正常运行。

## 六、项目技术栈总结

### 前端技术栈
- Vue 3 (Composition API)
- TypeScript
- Vite
- Tailwind CSS
- Vue Router
- Lucide Vue Next (图标库)
- MarkdownIt (Markdown 渲染)

### 后端技术栈
- FastAPI
- Python 3.x
- OpenAI API
- python-docx (Word 文档生成)
- xhtml2pdf (PDF 文档生成)
- pypdf (PDF 文件解析)
- python-dotenv (环境变量管理)
- pypinyin (拼音转换)

### 开发工具
- Node.js (前端开发服务器)
- Python (后端运行时)
- PowerShell (命令行环境)

## 七、重要配置说明

### Vite 配置关键点
- Vue 别名：必须使用 `vue/dist/vue.esm-bundler.js` 以支持运行时模板编译
- API 代理：`/api` 代理到 `http://localhost:8002`
- 端口：5174

### 后端环境变量
- `SERVER_PORT`：后端服务端口，默认 8002
- `OPENAI_API_KEY`：OpenAI API 密钥（从 .env 文件加载）

### Vue Router 配置
- 使用 `<keep-alive>` 保持组件状态
- 避免页面切换时状态丢失

## 八、调试技巧

### 前端调试
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误和警告
3. 使用 Vue DevTools 查看组件状态
4. 查看 Network 标签页的 API 请求

### 后端调试
1. 查看终端输出的日志
2. 使用 `print()` 语句输出调试信息
3. 检查 API 响应状态码
4. 查看数据目录中的 JSON 文件

### 常见问题排查
1. **端口被占用**：使用 `netstat -ano | findstr :8002` 查找进程
2. **API 请求失败**：检查后端是否正常运行
3. **字体显示问题**：检查字体文件路径是否正确
4. **状态丢失**：确认使用了 `<keep-alive>` 包裹组件
