# ⚠️ 易踩坑规则（每次操作前必读）

> 这些是从实际踩坑中提炼的**主动防御规则**。执行操作前先过一遍，可以避免重复犯错。

---

## 🔴 Nginx 相关

### P-001: aa_nginx 启动前必须手动设置目录权限
**原因**：`aa_nginx` 二进制在启动时会尝试 `chown` 临时目录到 UID 995，但这个操作在当前环境中会失败（`Invalid argument`），即使 UID 995 的 nginx 用户确实存在。
**规则**：每次启动 Nginx 前，必须先执行：
```bash
mkdir -p /var/lib/aa_nginx/tmp/{client_body,proxy,fastcgi,scgi,uwsgi}
chown -R nginx:nginx /var/lib/aa_nginx/tmp/
chmod -R 700 /var/lib/aa_nginx/tmp/
```

### P-002: aa_nginx -s reload 不可用
**原因**：`aa_nginx -s reload` 会报 `kill(pid, 1) failed (3: No such process)`，即使进程确实存在。这是 `aa_nginx` 定制版的已知问题。
**规则**：需要重启 Nginx 时，必须先 `fuser -k 80/tcp`（或 `killall -9 aa_nginx`），等端口释放后再重新启动。不要用 `-s reload`。

### P-003: 端口 80 被占用时要彻底清理
**原因**：只杀 worker 进程不够，master 进程还在。用 `kill` 杀一个 PID 后端口可能仍被占用。
**规则**：用 `fuser -k 80/tcp` 一次性杀掉所有占用 80 端口的进程，然后 `sleep 2` 再启动。

### P-004: Nginx 配置中 user 已改为 root
**原因**：原始配置 `user nginx;` 导致启动时 chown 失败。已改为 `user root;` 绕过。
**规则**：不要把 `user` 改回 `nginx`，除非已确认 chown 问题已解决。

---

## 🟡 前端相关

### P-005: 修改前端代码后必须 npm run build
**原因**：Nginx 提供的是 `dist/` 目录的静态文件，不是源码。修改源码不会自动生效。
**规则**：任何前端代码修改后，必须执行：
```bash
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue && npm run build
```
然后确认 `dist/` 中文件的时间戳已更新。**不需要重启 Nginx**。

### P-006: SectionEditor 组件中禁用 TypeScript 语法
**原因**：TemplatesPage.vue 中的 SectionEditor 使用字符串 `template`，通过 Vue 运行时编译器编译。运行时编译器不支持 TypeScript 语法。
**规则**：在 SectionEditor 的 template 字符串中，不要写 `as HTMLInputElement` 等类型断言。用 `$event.target.value` 替代 `($event.target as HTMLInputElement).value`。

### P-007: Vite 必须配置 Vue 运行时编译器别名
**原因**：SectionEditor 使用字符串模板，需要运行时编译器。
**规则**：`vite.config.ts` 中必须保留 `'vue': 'vue/dist/vue.esm-bundler.js'` 别名。删除会导致 SectionEditor 无法渲染。

### P-008: App.vue 必须保留 keep-alive
**原因**：没有 `<keep-alive>` 时，从 GeneratePage 切换到其他页面再回来，所有步骤进度和数据会丢失。
**规则**：不要删除 App.vue 中的 `<keep-alive>` 包裹。

### P-014: markdown-it 在 TS 下缺少类型声明
**原因**：项目未安装 `@types/markdown-it`。
**规则**：添加 `src/types/markdown-it.d.ts` 声明占位，避免 vue-tsc 报错。

### P-015: 避免在模板中直接用 `$refs.fileInput?.click()`
**原因**：`$refs` 在模板推断为 `{}`，`click` 不存在导致 TS 报错。
**规则**：用 `const fileInput = ref<HTMLInputElement|null>(null)` 并在模板中 `@click="fileInput?.click()"`。
---

## 🟢 后端相关

### P-009: pip install 必须加 --break-system-packages
**原因**：系统 Python 环境有保护，不加这个 flag 会报错。
**规则**：在系统环境安装 Python 包时：`pip install xxx --break-system-packages`。如果在 conda 环境中则不需要。

### P-010: 后端数据文件不要手动删除
**原因**：`backend/data/` 下的 JSON 文件是唯一的数据存储。没有数据库，没有备份。
**规则**：删除任何 `data/` 下的文件前，先确认并备份。特别是 `types_registry.json` 和 `people.json`。

### P-011: 流式响应第一行是 ID
**原因**：`/api/generate` 和 `/api/modify-article` 的流式响应第一行格式为 `ID:{uuid}\n`，后续才是正文。
**规则**：前端解析流式响应时，必须处理首行 ID 提取逻辑。修改这两个接口时不要破坏这个协议。

---

## 🔵 调试相关

### P-012: GeneratePage 的 watch 不能监听 allPeople
**原因**：onMounted 加载 allPeople 时会触发 watch，导致 matchPeople 被重复调用，阻塞主线程，页面卡死。
**规则**：watch 只监听 `step` 变化。matchPeople 函数内部要有防重复检查（`if (checkingConflicts.value) return`）。

### P-013: 检查端口占用要用正确的命令
**原因**：不同的命令在不同环境下表现不同。
**规则**：优先使用 `ss -tlnp | grep :PORT`，其次 `netstat -tlnp | grep :PORT`。杀进程用 `fuser -k PORT/tcp`。

---

## 🟣 认证与权限相关

### P-016: 修改需要管理员权限的接口时注意 Depends(require_admin)
**原因**：`DELETE /api/types/{type_id}`、`DELETE /api/outline/{type_id}/{template_id}`、`POST /api/settings` 都需要管理员权限。普通用户调用会返回 403。
**规则**：新增破坏性接口（删除、系统配置）时，务必添加 `dependencies=[Depends(require_admin)]`。

### P-017: 前端全局 fetch 拦截器会自动带 Token
**原因**：`main.ts` 中重写了 `window.fetch`，所有 `/api` 请求自动附加 `Authorization` 头。401 响应会触发自动登出。
**规则**：不要在单个组件中重复添加 Token 头。如果新增非 `/api` 前缀的后端路由，Token 不会自动带上。

### P-018: 用户数据库目前是硬编码的
**原因**：`USERS_DB` 直接写在 `main.py` 中，`SECRET_KEY` 也是硬编码。
**规则**：生产环境部署前应将用户数据迁移到外部存储，`SECRET_KEY` 应通过环境变量配置。

### P-019: 知识库更新会自动创建历史备份
**原因**：每次调用 `POST /api/knowledge/{category}` 都会在 `data/history/{category}/` 创建当前版本的备份。
**规则**：不要手动删除 `data/history/` 目录。如果磁盘空间不足，可以清理较旧的历史版本文件。
