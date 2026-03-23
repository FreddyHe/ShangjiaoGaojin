import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './index.css'

import TemplatesPage from './pages/TemplatesPage.vue'
import ExtractPage from './pages/ExtractPage.vue'
import GeneratePage from './pages/GeneratePage.vue'
import HistoryPage from './pages/HistoryPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import UploadPage from './pages/UploadPage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import KnowledgePage from './pages/KnowledgePage.vue'
import LoginPage from './pages/LoginPage.vue'
import { useAuth } from './composables/useAuth'

// 全局拦截 fetch，添加 Authorization header
const originalFetch = window.fetch
window.fetch = async (...args) => {
  let [resource, config] = args
  
  // 对于相对路径请求（访问后端 API），带上 Token
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    config = config || {}
    const headers = new Headers(config.headers)
    
    const token = localStorage.getItem('token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    
    config.headers = headers
    args[1] = config
  }
  
  const response = await originalFetch(...args)
  
  // 拦截 401，如果是登录接口的 401 就不管，否则跳转到登录页
  if (response.status === 401 && typeof resource === 'string' && !resource.includes('/api/auth/login')) {
    const auth = useAuth()
    auth.logout()
  }
  
  return response
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { public: true } },
    { path: '/', component: TemplatesPage },
    { path: '/upload', component: UploadPage },
    { path: '/templates', component: TemplatesPage },
    { path: '/extract', component: ExtractPage },
    { path: '/generate', component: GeneratePage },
    { path: '/knowledge', component: KnowledgePage },
    { path: '/history', component: HistoryPage },
    { path: '/settings', component: SettingsPage, meta: { requiresAdmin: true } },
    { path: '/profile', component: ProfilePage },
  ]
})

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  
  if (!to.meta.public && !auth.isLoggedIn.value) {
    next('/login')
  } else if (to.meta.requiresAdmin && !auth.isAdmin.value) {
    alert('仅管理员可访问此页面')
    next(from.path || '/')
  } else if (to.path === '/login' && auth.isLoggedIn.value) {
    next('/')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
