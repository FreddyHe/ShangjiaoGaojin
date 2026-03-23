<template>
  <div class="relative" ref="rootEl">
    <button
      class="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-background-50 transition-colors border border-transparent hover:border-background-200"
      @click="toggle"
      aria-label="用户菜单"
    >
      <div class="h-9 w-9 rounded-full overflow-hidden bg-brand-50 flex items-center justify-center border border-brand-200 shadow-sm">
        <img v-if="profile.avatarDataUrl" :src="profile.avatarDataUrl" alt="Avatar" class="h-full w-full object-cover" />
        <span v-else class="text-brand-700 font-semibold">{{ initials }}</span>
      </div>
      <div class="hidden sm:flex flex-col items-start leading-tight">
        <div class="text-sm font-semibold text-text-primary max-w-32 truncate">{{ profile.nickname || auth.username || '未登录' }}</div>
        <div class="text-xs text-text-muted">{{ roleLabel }}</div>
      </div>
      <ChevronDown :size="16" class="text-text-tertiary ml-1" />
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-3 w-52 bg-surface-50 rounded-2xl shadow-medium border border-background-200 overflow-hidden z-30"
      >
        <button
          class="w-full px-5 py-3.5 text-left text-sm text-text-primary hover:bg-background-50 transition-colors flex items-center gap-3"
          @click="goProfile"
        >
          <User :size="16" class="text-text-tertiary" />
          个人中心
        </button>
        <div class="h-px bg-background-200 mx-3"></div>
        <button
          class="w-full px-5 py-3.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
          @click="logout"
        >
          <LogOut :size="16" class="text-red-500" />
          退出登录
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, LogOut, User } from 'lucide-vue-next'
import { getStoredProfile } from '@/lib/profile'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const auth = useAuth()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const profile = ref(getStoredProfile())

const reloadProfile = () => {
  profile.value = getStoredProfile()
}

const initials = computed(() => {
  const s = (profile.value.nickname || auth.username.value || profile.value.name || 'U').trim()
  return s.slice(0, 1).toUpperCase()
})

const roleLabel = computed(() => {
  return auth.role.value === 'admin' ? '系统管理员' : '普通用户'
})

const toggle = () => {
  open.value = !open.value
}

const close = () => {
  open.value = false
}

const goProfile = () => {
  close()
  router.push('/profile')
}

const logout = () => {
  close()
  auth.logout()
}

const onClickOutside = (e: MouseEvent) => {
  if (!open.value) return
  const el = rootEl.value
  if (!el) return
  if (e.target instanceof Node && el.contains(e.target)) return
  close()
}

const onStorage = (e: StorageEvent) => {
  if (!e.key) return
  if (e.key === 'pra.userProfile') {
    reloadProfile()
  }
}

const onProfileUpdated = () => {
  reloadProfile()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('storage', onStorage)
  window.addEventListener('pra-profile-updated', onProfileUpdated)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('storage', onStorage)
  window.removeEventListener('pra-profile-updated', onProfileUpdated)
})
</script>
