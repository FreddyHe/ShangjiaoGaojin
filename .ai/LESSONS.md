# 已解决问题归档

> 格式：日期 | 问题 | 根因 | 方案 | 影响文件

---

## L-001 | GeneratePage 页面卡死
- **日期**：2026-03
- **问题**：点击侧边栏进入"稿件生成"页面后，整个页面被阻塞，无法切换到其他页面。
- **根因**：`watch` 监听了 `[step, materials, allPeople]` 三个变量。`onMounted` 加载 `allPeople` 时触发 watch → 调用 `matchPeople` → 没有防重复机制 → 连锁阻塞主线程。
- **方案**：watch 只监听 `step`；`matchPeople` 开头添加 `if (checkingConflicts.value) return` 防重复。
- **影响文件**：`frontend-vue/src/pages/GeneratePage.vue`

---

## L-002 | SectionEditor 无法编辑
- **日期**：2026-03
- **问题**：TemplatesPage 中点击"添加一级标题"后，新添加的 section 无法编辑标题、要点、子标题。
- **根因**：SectionEditor 组件在第二个 `<script>` 块中定义，使用了 `OutlineSection` 类型但未导入，导致类型系统异常。
- **方案**：在第二个 script 块中添加 `import type { OutlineSection } from '@/types'`。
- **影响文件**：`frontend-vue/src/pages/TemplatesPage.vue`

---

## L-003 | SectionEditor 运行时编译错误
- **日期**：2026-03
- **问题**：SectionEditor 使用字符串模板，Vite 默认的 Vue 构建版本不支持运行时模板编译。
- **根因**：Vite 默认使用 `vue/dist/vue.runtime.esm-bundler.js`，不含编译器。
- **方案**：`vite.config.ts` 添加别名 `'vue': 'vue/dist/vue.esm-bundler.js'`。
- **影响文件**：`frontend-vue/vite.config.ts`

---

## L-004 | SectionEditor 中 TypeScript 语法报错
- **日期**：2026-03
- **问题**：SectionEditor 的 template 字符串中 `($event.target as HTMLInputElement).value` 运行时报错。
- **根因**：运行时模板编译器不处理 TypeScript 语法。
- **方案**：移除所有 `as HTMLInputElement` 类型断言，改为 `$event.target.value`。
- **影响文件**：`frontend-vue/src/pages/TemplatesPage.vue`

---

## L-005 | TemplatesPage 右侧编辑器不显示大纲
- **日期**：2026-03
- **问题**：点击中间栏模板后，右侧编辑器不加载大纲内容。
- **根因**：`watch` 直接监听了 ref 对象而非 getter 函数，Vue 3 中可能不正确触发。
- **方案**：改为 `watch([() => selectedTypeId.value, () => selectedTemplateId.value], ...)`。
- **影响文件**：`frontend-vue/src/pages/TemplatesPage.vue`

---

## L-006 | HistoryPage 内容无法滚动
- **日期**：2026-03
- **问题**：右侧详情面板内容超长时无法滚动。
- **根因**：外层容器没有固定高度，flex 布局中子元素没有 `min-h-0` 导致无法收缩。
- **方案**：外层 `h-[calc(100vh-8rem)]` + 内容区 `flex-1 overflow-y-auto min-h-0`。
- **影响文件**：`frontend-vue/src/pages/HistoryPage.vue`

---

## L-007 | 页面状态丢失
- **日期**：2026-03
- **问题**：从 GeneratePage 切换到其他页面再回来，所有步骤和数据丢失。
- **根因**：Vue Router 默认销毁离开的组件。
- **方案**：App.vue 中用 `<keep-alive>` 包裹 `<router-view>`。
- **影响文件**：`frontend-vue/src/App.vue`

---

## L-008 | Word 导出中文乱码
- **日期**：2026-03
- **问题**：导出的 Word 文档中文字体不正确。
- **根因**：python-docx 默认不设置中文字体。
- **方案**：设置默认字体宋体 12pt，使用 `qn('w:eastAsia')` 设置中文字体，标题用黑体。
- **影响文件**：`backend/main.py`（`download_docx` 函数）

---

## L-009 | GeneratePage 第二步"使用此模板生成"按钮看不到
- **日期**：2026-03
- **问题**：右侧预览区域不能滚动，底部按钮被挤出视口。
- **根因**：大纲内容区域缺少 `min-h-0`，flex 子元素无法收缩。
- **方案**：外层 `overflow-hidden flex flex-col`，内容区 `flex-1 overflow-y-auto min-h-0`，按钮区 `flex-shrink-0`。
- **影响文件**：`frontend-vue/src/pages/GeneratePage.vue`

---

## L-010 | Nginx chown 失败无法启动
- **日期**：2026-03-18
- **问题**：`/usr/sbin/aa_nginx` 启动时报 `chown("/var/lib/aa_nginx/tmp/client_body", 995) failed (22: Invalid argument)`。
- **根因**：`aa_nginx` 定制版二进制内部的 chown 调用在当前环境下失败。用户 nginx(UID 995) 存在、目录权限正常、文件系统正常、SELinux 已禁用——问题出在二进制本身。
- **方案**：启动前手动 `mkdir + chown + chmod` 设好目录权限，绕过 Nginx 内部的 chown。同时将配置中 `user nginx;` 改为 `user root;`。
- **影响文件**：`/etc/aa_nginx/aa_nginx.conf`

---

## L-011 | 类型管理“新增类型”点击无反应
- **日期**：2026-03-18
- **问题**：TemplatesPage 中点击“新增类型”按钮无任何提示或变化。
- **根因**：前端未对空输入与接口错误进行显式提示；按钮无禁用态，导致误操作。
- **方案**：按钮根据输入禁用；addType 中增加校验与 try/catch，展示明确错误信息。
- **影响文件**：`frontend-vue/src/pages/TemplatesPage.vue`

---

## 归档规则

- 每条记录控制在 5 行以内
- 只记录有参考价值的问题（重复出现的、根因不明显的、花了较长时间排查的）
- 如果某个问题演变成了通用规则，应同时更新到 `PITFALLS.md`
- 过于简单的问题（如拼写错误、缺少 import）不需要归档
