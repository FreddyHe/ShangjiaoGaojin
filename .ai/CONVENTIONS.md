# 代码规范与提交约定

## Git 提交规范

采用 Conventional Commits 格式：

```
<type>(<scope>): <简要描述>

[可选正文：详细说明改了什么、为什么改]
```

### Type 枚举

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(generate): 添加知识库人名匹配功能` |
| `fix` | Bug 修复 | `fix(template): 修复 SectionEditor 无法编辑的问题` |
| `refactor` | 重构（不改变功能） | `refactor(backend): 抽取 build_master_system_prompt 函数` |
| `style` | 样式/格式调整 | `style(history): 修复右侧面板无法滚动` |
| `docs` | 文档更新 | `docs: 更新 debug.md 添加问题 #12 记录` |
| `chore` | 构建/工具/配置 | `chore: 添加 .ai 工作区目录` |
| `perf` | 性能优化 | `perf(match): 添加姓氏倒排索引减少比对次数` |

### Scope 枚举

| Scope | 对应模块 |
|-------|---------|
| `generate` | GeneratePage.vue + 生成相关后端接口 |
| `template` | TemplatesPage.vue + 大纲相关后端接口 |
| `extract` | ExtractPage.vue + 提取相关后端接口 |
| `history` | HistoryPage.vue + 文章 CRUD 接口 |
| `settings` | SettingsPage.vue + 设置接口 |
| `knowledge` | KnowledgePage.vue + 知识库相关后端接口 |
| `match` | 人名匹配 + 冲突检测 |
| `auth` | 认证系统（登录、JWT、角色权限） |
| `backend` | 后端通用修改 |
| `frontend` | 前端通用修改 |
| `deploy` | 部署/Nginx/服务器相关 |

## 前端代码风格

### Vue 组件规范

- 使用 `<script setup lang="ts">` + Composition API
- 类型定义统一放在 `src/types/index.ts`，通过 `import type { Xxx } from '@/types'` 引入
- 组件内的响应式变量使用 `ref()`，复杂对象用 `ref()` 而非 `reactive()`
- 事件命名使用 kebab-case：`@update-title`，`@add-bullet`
- Props 使用 `defineProps<{ ... }>()`，Emits 使用 `defineEmits<{ ... }>()`

### CSS/Tailwind 规范

- 优先使用 `tailwind.config.js` 中定义的自定义颜色（`brand-*`, `text-*`, `surface-*`, `background-*`）
- 复用样式定义在 `src/index.css` 的 `@layer components` 中（如 `.btn`, `.card`, `.input`）
- 不要使用内联 `style`，全部用 Tailwind class
- 主题色系：橙色（brand），灰色（neutral），不要引入蓝色/绿色作为主色

### 特殊注意

- **Vite 配置了 Vue 运行时编译器别名**：`'vue': 'vue/dist/vue.esm-bundler.js'`，因为 TemplatesPage 的 SectionEditor 使用了字符串模板
- **SectionEditor 组件中不能使用 TypeScript 语法**（如 `as HTMLInputElement`），因为运行时模板编译器不支持
- **App.vue 使用了 `<keep-alive>`**：页面组件切换时不会销毁，状态会保持

## 后端代码风格

### Python 规范

- 单文件结构（`main.py`，约 2000 行），函数按功能分区，用注释分隔
- Pydantic Model 用于请求/响应的类型定义
- JSON 文件操作统一使用 `ensure_ascii=False, indent=2` 保证中文可读
- 流式响应使用 `StreamingResponse(generator(), media_type="text/plain")`
- 错误处理：业务错误用 `HTTPException`，意外错误用 `try/except` + `print`
- 认证：部分接口使用 `Depends(require_admin)` 限制管理员权限
- 流式进度：使用 NDJSON 格式 `{"status": "progress"|"success"|"error", "message": ...}`

### 数据存储规范

- 类型注册表：`data/types_registry.json`，格式 `{"types": [{"id": "xxx", "name": "xxx"}]}`
- 大纲文件命名：`{type_id}.json`（default）或 `{type_id}__{template_id}.json`
- 文章文件命名：`{uuid}.json`
- 所有 JSON 文件使用 UTF-8 编码

## 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 页面组件 | PascalCase + Page 后缀 | `GeneratePage.vue` |
| Vue 通用组件 | PascalCase | `FileUpload.vue` |
| TypeScript 类型文件 | camelCase | `types/index.ts` |
| CSS 文件 | kebab-case | `index.css` |
| Python 文件 | snake_case | `main.py` |
| 配置文件 | 保持工具默认 | `vite.config.ts`, `tailwind.config.js` |