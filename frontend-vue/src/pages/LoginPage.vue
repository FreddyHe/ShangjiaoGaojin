<template>
  <div class="min-h-screen flex items-center justify-center bg-background-50 p-4">
    <div class="max-w-md w-full bg-surface-50 rounded-2xl shadow-xl overflow-hidden border border-background-200">
      <div class="p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-text-primary tracking-tight">系统登录</h2>
          <p class="text-text-secondary mt-2">新闻稿智能体平台</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">用户名</label>
            <input 
              v-model="username" 
              type="text" 
              required
              class="input w-full px-4 py-3 bg-background-50 border-background-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="请输入用户名 (admin / user)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">密码</label>
            <input 
              v-model="password" 
              type="password" 
              required
              class="input w-full px-4 py-3 bg-background-50 border-background-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="请输入密码"
            />
          </div>

          <div v-if="errorMsg" class="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">
            {{ errorMsg }}
          </div>

          <button 
            type="submit" 
            class="btn w-full py-3.5 text-base font-medium bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl hover:shadow-glow transition-all"
            :disabled="loading"
          >
            <span v-if="loading">登录中...</span>
            <span v-else>登录</span>
          </button>
        </form>

        <div class="mt-8 text-center text-sm text-text-muted border-t border-background-200 pt-6">
          <!-- 预留的 SSO 登录入口 -->
          <button @click="handleSSO" class="text-brand-600 hover:text-brand-700 hover:underline transition-colors flex items-center justify-center gap-2 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            使用 SSO 单点登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || '登录失败，请检查用户名和密码')
    }
    
    const data = await res.json()
    auth.login(data.access_token, data.username, data.role)
    
    // 登录成功后跳转到首页
    router.push('/')
  } catch (err) {
    errorMsg.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

const handleSSO = async () => {
  try {
    // 预留的 SSO 登录接口调用
    const res = await fetch('/api/auth/sso/login')
    const data = await res.json()
    alert('SSO 登录预留接口：' + data.message)
  } catch (err) {
    console.error(err)
  }
}
</script>
