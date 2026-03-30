# 服务启动与运维操作

## 环境信息

| 项目 | 值 |
|------|-----|
| 服务器 | 阿里云 ECS，IP `47.102.216.195` |
| 操作系统 | Ubuntu 24 (非容器，物理 ECS) |
| Python 环境 | Miniconda3，conda 环境名 `newsapp` |
| Node.js | 已安装，支持 npm |
| Nginx | `/usr/sbin/aa_nginx`（定制版二进制，**非标准 nginx**） |
| 后端服务管理 | systemd (`newsapp.service`) |
| 后端主要依赖 | fastapi, uvicorn, openai, python-docx, pypdf, pypinyin, PyJWT, aiohttp, beautifulsoup4 |

## 一、启动后端

后端通过 `newsapp.service` (systemd) 管理，已设置开机自启和崩溃自动重启。

```bash
systemctl start newsapp.service     # 启动
systemctl stop newsapp.service      # 停止
systemctl restart newsapp.service   # 重启
systemctl status newsapp.service    # 查看状态
journalctl -u newsapp.service -f    # 实时查看日志
```

> ⚠️ **不要使用 `nohup python main.py &` 手动启动后端**，会与 systemd 服务冲突导臯端口占用。统一使用 `systemctl` 管理。

验证：
```bash
curl -s http://127.0.0.1:8002/api/settings | head -c 100
# 应返回 JSON 格式的设置信息
```

## 二、启动 Nginx

⚠️ **必须先执行目录权限设置**（见 PITFALLS.md）

```bash
# 1. 确保临时目录权限正确
mkdir -p /var/lib/aa_nginx/tmp/{client_body,proxy,fastcgi,scgi,uwsgi}
chown -R nginx:nginx /var/lib/aa_nginx/tmp/
chmod -R 700 /var/lib/aa_nginx/tmp/

# 2. 启动
/usr/sbin/aa_nginx -c /etc/aa_nginx/aa_nginx.conf
```

验证：
```bash
curl -I http://127.0.0.1/
# 应返回 HTTP/1.1 200 OK
```

## 三、重启服务

### 重启后端

```bash
systemctl restart newsapp.service
systemctl status newsapp.service
```

### 重启 Nginx

```bash
# 1. 彻底杀掉所有 nginx 进程
fuser -k 80/tcp 2>/dev/null
sleep 2

# 2. 确认端口已释放
ss -tlnp | grep :80
# 应无输出

# 3. 设置目录权限并启动
mkdir -p /var/lib/aa_nginx/tmp/{client_body,proxy,fastcgi,scgi,uwsgi}
chown -R nginx:nginx /var/lib/aa_nginx/tmp/
chmod -R 700 /var/lib/aa_nginx/tmp/
/usr/sbin/aa_nginx -c /etc/aa_nginx/aa_nginx.conf
```

## 四、前端构建与部署

```bash
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue

# 构建
npm run build

# 验证构建产物已更新
ls -la dist/
# 确认 index.html 和 assets/ 的时间戳是最新的

# Nginx 会自动提供 dist/ 目录的文件，无需重启 Nginx
# 但如果浏览器有缓存，可能需要 Ctrl+F5 强制刷新
```

## 五、前端开发模式（本地调试用）

```bash
cd /www/wwwroot/ShangjiaoGaojin/frontend-vue
npm run dev
# 访问 http://localhost:5174/
# Vite 已配置 /api 代理到 http://127.0.0.1:8002
```

## 六、认证信息

当前用户数据库（硬编码在 `main.py` 中）：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin` | 管理员（可访问系统设置、删除类型/模板） |
| `user` | `user` | 普通用户 |

JWT Token 有效期 24 小时。

## 七、常用诊断命令

```bash
# 检查后端是否在运行
netstat -tlnp | grep :8002

# 检查 Nginx 是否在运行
ss -tlnp | grep :80

# 查看后端日志（最后 50 行）
tail -50 /var/log/newsapp.log

# 测试后端 API
curl -s http://127.0.0.1:8002/api/types | python3 -m json.tool

# 测试 Nginx 代理
curl -s http://47.102.216.195/api/settings | head -c 200

# 查看 Nginx 配置
cat /etc/aa_nginx/aa_nginx.conf

# 检查磁盘空间
df -h /

# 检查数据目录大小
du -sh /www/wwwroot/ShangjiaoGaojin/backend/data/*
```

## 八、Nginx 配置要点

```nginx
user root;  # 原本是 nginx，因 chown 兼容性问题改为 root

server {
    listen 80;
    server_name _;

    location / {
        root /www/wwwroot/ShangjiaoGaojin/frontend-vue/dist;
        # Vue SPA 需要 try_files 支持前端路由
    }

    location /api {
        proxy_pass http://127.0.0.1:8002;
        # 反向代理到 FastAPI 后端
    }
}
```

## 九、环境变量（backend/.env）

```env
OPENAI_API_KEY=sk-xxx          # OpenAI 兼容的 API Key
OPENAI_BASE_URL=https://xxx    # 可选，自定义 API 端点
OPENAI_MODEL=gpt-4o-mini       # 使用的模型
SERVER_HOST=0.0.0.0            # 后端监听地址
SERVER_PORT=8002               # 后端监听端口
```

也可以在前端「系统设置」页面修改这些值（存储在 `backend/data/settings.json`）。仅管理员可修改。