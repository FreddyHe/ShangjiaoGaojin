# 新闻稿智能体 - Vue 3 版本

这是新闻稿智能体系统的 Vue 3 重构版本，完全兼容原有的 FastAPI 后端接口。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite
- **语言**: TypeScript
- **路由**: Vue Router 4
- **样式**: Tailwind CSS
- **图标**: lucide-vue-next
- **Markdown 渲染**: markdown-it

## 项目结构

```
frontend-vue/
├── src/
│   ├── components/
│   │   └── Layout.vue          # 主布局组件
│   ├── pages/
│   │   ├── TemplatesPage.vue    # 模板管理页面
│   │   ├── ExtractPage.vue      # 大纲提取页面
│   │   ├── GeneratePage.vue     # 稿件生成页面（含流式响应处理）
│   │   ├── HistoryPage.vue      # 历史记录页面
│   │   ├── SettingsPage.vue     # 系统设置页面
│   │   └── UploadPage.vue      # 文件上传页面
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 应用入口
│   └── index.css              # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:5174` 启动。

## 构建生产版本

```bash
npm run build
```

## 预览生产构建

```bash
npm run preview
```

## API 接口

所有 API 请求通过 Vite 代理转发到后端服务器（默认 `http://localhost:8002`）。

### 主要接口

- `GET /api/settings` - 获取系统设置
- `POST /api/settings` - 更新系统设置
- `GET /api/types` - 获取新闻稿类型列表
- `GET /api/outlines/:typeId` - 获取指定类型的模板列表
- `GET /api/outline/:typeId/:templateId` - 获取大纲详情
- `PUT /api/outline/:typeId/:templateId` - 保存大纲
- `DELETE /api/outline/:typeId/:templateId` - 删除模板
- `POST /api/outline/:typeId/:templateId/favorite` - 切换收藏状态
- `POST /api/upload` - 上传文件
- `POST /api/files/parse` - 解析文件
- `POST /api/classify` - 分类文本
- `POST /api/extract` - 提取大纲
- `POST /api/generate` - 生成新闻稿（流式响应）
- `POST /api/modify-article` - 修改文章（流式响应）
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:articleId/history` - 获取文章历史
- `PUT /api/articles/:articleId` - 更新文章
- `DELETE /api/articles/:articleId` - 删除文章
- `GET /api/articles/:articleId/download/docx` - 下载 Word 文档
- `GET /api/articles/:articleId/download/pdf` - 下载 PDF 文档
- `GET /api/people` - 获取人物知识库
- `POST /api/match-people` - 人名匹配
- `POST /api/check-conflict` - 冲突检测

## 功能特性

### 1. 模板管理
- 创建、编辑、删除新闻稿类型
- 管理多个模板（系统默认模板 + 自定义模板）
- 支持多层级大纲结构
- 模板收藏功能

### 2. 大纲提取
- 上传多篇新闻稿文件（支持 TXT、DOCX、PDF）
- AI 自动提取通用大纲结构
- 支持自定义模板 ID

### 3. 稿件生成
- 三步式生成流程：上传素材 → 选择模板 → 确认生成
- AI 智能分类新闻稿类型
- 支持人物知识库自动匹配
- 冲突检测和相似名字提示
- 流式响应实时显示生成内容
- 支持多版本修改和对比

### 4. 历史记录
- 查看所有生成的新闻稿
- 支持在线编辑内容
- 导出为 Word 和 PDF 格式
- 删除历史记录

### 5. 系统设置
- 自定义系统名称和 Logo
- 配置 OpenAI 兼容的 API
- 支持 Base URL 自定义

## 从 React 迁移到 Vue 3 的主要变化

### 1. 组件语法
- React: `function Component() { return <div /> }`
- Vue 3: `<script setup lang="ts">` + `<template>`

### 2. 状态管理
- React: `useState`, `useEffect`
- Vue 3: `ref`, `reactive`, `watch`, `onMounted`

### 3. 事件处理
- React: `onChange={e => setValue(e.target.value)}`
- Vue 3: `@change="e => setValue((e.target as HTMLInputElement).value)"` 或 `v-model="value"`

### 4. 条件渲染
- React: `{condition && <div />}`
- Vue 3: `<div v-if="condition" />`

### 5. 列表渲染
- React: `{items.map(item => <div key={item.id}>{item.name}</div>)}`
- Vue 3: `<div v-for="item in items" :key="item.id">{{ item.name }}</div>`

### 6. 图标库
- React: `import { Icon } from 'lucide-react'`
- Vue 3: `import { Icon } from 'lucide-vue-next'`

### 7. 路由
- React: `react-router-dom` 的 `useRouter`, `useRoute`
- Vue 3: `vue-router` 的 `useRouter`, `useRoute`

### 8. Markdown 渲染
- React: `react-markdown` 组件
- Vue 3: `markdown-it` 库 + `v-html` 指令

## 注意事项

1. **流式响应处理**: `/api/generate` 和 `/api/modify-article` 接口返回流式响应，使用 `ReadableStream` API 处理。

2. **类型安全**: 所有组件都使用 TypeScript 严格类型检查，类型定义在 `src/types/index.ts` 中。

3. **样式一致性**: 完全保持原有的 Tailwind CSS 类名，确保 UI 样式一致。

4. **API 兼容性**: 所有 API 请求的路径、方法、请求头、Payload 结构和响应格式与原 React 版本完全一致。

## 开发建议

1. 使用 VS Code 配合 Volar 插件获得最佳开发体验。
2. 启用 TypeScript 严格模式以获得更好的类型检查。
3. 使用 Vue DevTools 进行组件调试。
4. 遵循 Vue 3 Composition API 最佳实践。

## 许可证

© 2024 Press Release Assistant
