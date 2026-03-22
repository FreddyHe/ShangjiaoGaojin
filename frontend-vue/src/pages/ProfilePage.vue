<template>
  <div class="grid gap-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between gap-4 pb-6 border-b border-background-200">
      <div>
        <div class="text-3xl font-bold text-text-primary tracking-tight">个人中心</div>
        <div class="text-sm text-text-muted mt-2">管理你的账号信息、头像、安全设置与使用偏好</div>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn bg-white hover:bg-background-50 px-6 py-2.5" @click="reset">重置修改</button>
        <button class="btn btn-primary px-8 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 shadow-sm hover:shadow-glow" @click="saveProfile">保存资料</button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8">
      <div class="grid gap-8 content-start">
        <div class="card p-8 border border-background-200 shadow-sm">
          <div class="flex items-center gap-6">
            <div class="h-24 w-24 rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-background-200">
              <img v-if="draft.avatarDataUrl" :src="draft.avatarDataUrl" alt="Avatar" class="h-full w-full object-cover" />
              <span v-else class="text-brand-700 font-bold text-3xl">{{ initials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <div class="font-bold text-xl text-text-primary truncate tracking-tight">{{ draft.nickname || draft.name || '未设置昵称' }}</div>
                <span class="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium border border-brand-200">{{ roleLabel }}</span>
              </div>
              <div class="text-sm text-text-secondary mt-2 flex items-center gap-2"><span class="text-text-tertiary">ID:</span> {{ draft.userId }}</div>
              <div class="text-xs text-text-muted mt-1">注册于 {{ formatTime(draft.registeredAt) }}</div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-background-200 grid gap-4">
            <div class="text-sm font-semibold text-text-primary">头像设置</div>
            <div class="grid gap-3">
              <div class="text-xs text-text-muted leading-relaxed">支持 PNG / JPG / WebP 格式，最大 2MB<br>保存后将自动同步到系统各处头像。</div>
              <div class="flex items-center gap-3 mt-1">
                <button class="btn text-sm py-2 px-4 bg-white border-background-200 hover:border-brand-300 hover:text-brand-600" @click="triggerAvatarInput">上传新头像</button>
                <button class="btn text-sm py-2 px-4 bg-white border-background-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50" @click="removeAvatar" :disabled="!draft.avatarDataUrl">移除头像</button>
              </div>
              <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarFileChange" />
            </div>
          </div>
        </div>

        <div class="card p-8 border border-background-200 shadow-sm">
          <div class="font-bold text-lg text-text-primary mb-5 tracking-tight">使用统计 (占位)</div>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-5 rounded-2xl bg-gradient-to-br from-background-50 to-white border border-background-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div class="absolute -right-4 -top-4 w-16 h-16 bg-brand-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div class="text-xs font-medium text-text-secondary relative z-10">最近生成</div>
              <div class="mt-2 text-3xl font-bold text-text-primary relative z-10 flex items-baseline gap-1">{{ stats.recentGenerated }}<span class="text-sm font-normal text-text-tertiary">篇</span></div>
            </div>
            <div class="p-5 rounded-2xl bg-gradient-to-br from-background-50 to-white border border-background-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div class="absolute -right-4 -top-4 w-16 h-16 bg-brand-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div class="text-xs font-medium text-text-secondary relative z-10">本周生成</div>
              <div class="mt-2 text-3xl font-bold text-text-primary relative z-10 flex items-baseline gap-1">{{ stats.weekGenerated }}<span class="text-sm font-normal text-text-tertiary">篇</span></div>
            </div>
          </div>
          <div class="mt-4 grid gap-4">
            <div class="p-5 rounded-2xl bg-gradient-to-br from-background-50 to-white border border-background-200 shadow-sm flex justify-between items-center hover:border-brand-300 transition-colors">
              <div class="text-sm font-medium text-text-secondary">模板使用次数</div>
              <div class="text-2xl font-bold text-brand-600">{{ stats.templateUsed }}</div>
            </div>

            <div class="p-5 rounded-2xl bg-gradient-to-br from-background-50 to-white border border-background-200 shadow-sm">
              <div class="flex items-center justify-between mb-5">
                <div class="text-sm font-medium text-text-secondary">类型分布</div>
                <div class="text-xs font-medium text-text-muted bg-background-100 px-2 py-1 rounded-md">总计 {{ totalDistribution }}</div>
              </div>
              <div class="flex items-center gap-6">
                <svg viewBox="0 0 120 120" class="h-28 w-28 drop-shadow-sm">
                  <g transform="translate(60,60)">
                    <path
                      v-for="seg in pieSegments"
                      :key="seg.label"
                      :d="seg.d"
                      fill="currentColor"
                      :class="seg.colorClass"
                      class="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </g>
                </svg>
                <div class="flex-1 min-w-0 grid gap-3">
                  <div v-for="seg in pieSegments" :key="seg.label" class="flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="h-3 w-3 rounded-full shadow-sm" :class="seg.dotClass"></span>
                      <span class="text-sm text-text-secondary truncate group-hover:text-text-primary transition-colors">{{ seg.label }}</span>
                    </div>
                    <span class="text-sm font-medium text-text-primary">{{ seg.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-8 content-start">
        <div class="card p-8 border border-background-200 shadow-sm">
          <div class="font-bold text-xl text-text-primary mb-6 tracking-tight">账户资料</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">真实姓名</label>
              <input class="input bg-white" v-model="draft.name" placeholder="请输入姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">展示昵称</label>
              <input class="input bg-white" v-model="draft.nickname" placeholder="请输入昵称" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">联系邮箱</label>
              <input class="input bg-white" v-model="draft.email" placeholder="name@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">手机号码 (可选)</label>
              <input class="input bg-white" v-model="draft.phone" placeholder="13800000000" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">用户ID (只读)</label>
              <input class="input bg-background-50 text-text-muted border-transparent" :value="draft.userId" disabled />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">系统角色 (只读)</label>
              <select class="input bg-background-50 text-text-muted border-transparent" v-model="draft.role" disabled>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="mt-6 p-5 rounded-2xl bg-brand-50/50 border border-brand-100 flex gap-4">
            <div class="text-2xl mt-0.5">💡</div>
            <div>
              <div class="text-sm font-bold text-brand-800 mb-1">当前角色能力说明</div>
              <div class="text-sm text-brand-700/80 leading-relaxed">
                普通用户可使用模板管理、大纲提取、稿件生成与历史记录等核心功能；管理员可额外进入系统设置，管理全局类型、模板预设与知识库内容。
              </div>
            </div>
          </div>
        </div>

        <div class="card p-8 border border-background-200 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="font-bold text-xl text-text-primary tracking-tight">修改密码 (占位)</div>
            <span class="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-md border border-brand-200">仅前端演示</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">当前密码</label>
              <input class="input bg-white" v-model="pwd.old" type="password" placeholder="请输入当前密码" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">新密码</label>
              <input class="input bg-white" v-model="pwd.next" type="password" placeholder="至少 8 位，包含字母数字" />
              <div class="mt-3 px-1">
                <div class="grid grid-cols-5 gap-1.5">
                  <div v-for="i in 5" :key="i" class="h-1.5 rounded-full transition-colors duration-300" :class="strengthCellClass(i)"></div>
                </div>
                <div class="text-xs mt-2 font-medium" :class="strengthTextClass">强度: {{ strengthLabel }}</div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2 pl-1">确认新密码</label>
              <input class="input bg-white" v-model="pwd.confirm" type="password" placeholder="再次输入新密码" />
              <div v-if="pwd.confirm && pwd.confirm !== pwd.next" class="text-xs text-red-500 mt-2 px-1 font-medium">⚠️ 两次输入密码不一致</div>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button class="btn btn-primary px-8 py-2.5 shadow-sm" @click="submitPassword" :disabled="!canSubmitPassword">提交修改</button>
          </div>
        </div>

        <div class="card p-8 border border-background-200 shadow-sm">
          <div class="font-bold text-xl text-text-primary mb-6 tracking-tight">第三方账号绑定 (占位)</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="p in providers" :key="p.key" class="flex items-center justify-between p-4 rounded-2xl bg-surface-50 border border-background-200 hover:border-brand-300 transition-colors group">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-[1rem] bg-white border border-background-200 flex items-center justify-center text-text-tertiary shadow-sm group-hover:text-brand-500 transition-colors">
                  <component :is="p.icon" :size="22" />
                </div>
                <div>
                  <div class="font-bold text-text-primary">{{ p.label }}</div>
                  <div class="text-xs mt-0.5 font-medium" :class="bindings[p.key] ? 'text-emerald-600' : 'text-text-muted'">{{ bindings[p.key] ? '已绑定' : '未绑定' }}</div>
                </div>
              </div>
              <button class="btn text-sm py-2 px-4" :class="bindings[p.key] ? 'bg-background-50 border-background-200 text-text-secondary hover:text-red-600 hover:border-red-200' : 'bg-white border-brand-200 text-brand-600 hover:bg-brand-50'" @click="toggleBinding(p.key)">{{ bindings[p.key] ? '解绑' : '绑定' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AvatarCropModal
      v-if="crop.open && crop.imageUrl"
      :image-url="crop.imageUrl"
      @close="closeCrop"
      @save="applyCroppedAvatar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserProfile } from '@/types'
import { setStoredProfile, getStoredProfile } from '@/lib/profile'
import AvatarCropModal from '@/components/AvatarCropModal.vue'
import { Building2, Github, MessageSquare, Smartphone } from 'lucide-vue-next'

const avatarInput = ref<HTMLInputElement | null>(null)

const source = getStoredProfile()
const draft = ref<UserProfile>({ ...source })

const stats = ref({
  recentGenerated: 8,
  weekGenerated: 21,
  templateUsed: 56,
  typeDistribution: [
    { label: '活动稿', value: 12, colorClass: 'text-orange-500', dotClass: 'bg-orange-500' },
    { label: '观点稿', value: 5, colorClass: 'text-orange-400', dotClass: 'bg-orange-400' },
    { label: '简讯', value: 3, colorClass: 'text-orange-300', dotClass: 'bg-orange-300' },
    { label: '其他', value: 1, colorClass: 'text-slate-300', dotClass: 'bg-slate-300' }
  ]
})

const providers = [
  { key: 'wechat', label: '企业微信', icon: MessageSquare },
  { key: 'dingtalk', label: '钉钉', icon: Smartphone },
  { key: 'github', label: 'GitHub', icon: Github },
  { key: 'google', label: 'Google', icon: Building2 }
] as const

type ProviderKey = typeof providers[number]['key']

const bindings = ref<Record<ProviderKey, boolean>>({
  wechat: false,
  dingtalk: false,
  github: false,
  google: false
})

const crop = ref<{ open: boolean; imageUrl: string; objectUrl: string }>({ open: false, imageUrl: '', objectUrl: '' })

const roleLabel = computed(() => (draft.value.role === 'admin' ? '管理员' : '普通用户'))

const initials = computed(() => {
  const s = (draft.value.nickname || draft.value.name || 'U').trim()
  return s.slice(0, 1).toUpperCase()
})

const totalDistribution = computed(() => stats.value.typeDistribution.reduce((sum, x) => sum + x.value, 0))

const polar = (angle: number, radius: number) => {
  const a = (angle - 90) * (Math.PI / 180)
  return { x: radius * Math.cos(a), y: radius * Math.sin(a) }
}

const arcPath = (startAngle: number, endAngle: number, radius: number) => {
  const start = polar(endAngle, radius)
  const end = polar(startAngle, radius)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

const pieSegments = computed(() => {
  const total = totalDistribution.value || 1
  const radius = 52
  let start = 0
  return stats.value.typeDistribution.map(item => {
    const sweep = (item.value / total) * 360
    const end = start + sweep
    const d = arcPath(start, end, radius)
    const seg = { ...item, d }
    start = end
    return seg
  })
})

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const triggerAvatarInput = () => {
  avatarInput.value?.click()
}

const removeAvatar = () => {
  draft.value = { ...draft.value, avatarDataUrl: '' }
}

const onAvatarFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) {
    alert('仅支持 PNG/JPG/WebP 格式')
    return
  }
  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    alert('图片超过 2MB 限制')
    return
  }

  const objectUrl = URL.createObjectURL(file)
  crop.value = { open: true, imageUrl: objectUrl, objectUrl }
}

const closeCrop = () => {
  if (crop.value.objectUrl) URL.revokeObjectURL(crop.value.objectUrl)
  crop.value = { open: false, imageUrl: '', objectUrl: '' }
}

const applyCroppedAvatar = (avatarDataUrl: string) => {
  draft.value = { ...draft.value, avatarDataUrl }
  closeCrop()
}

const saveProfile = () => {
  setStoredProfile(draft.value)
  alert('保存成功')
}

const reset = () => {
  const p = getStoredProfile()
  draft.value = { ...p }
  alert('已重置为已保存的资料')
}

const toggleBinding = (key: ProviderKey) => {
  bindings.value = { ...bindings.value, [key]: !bindings.value[key] }
}

const pwd = ref({ old: '', next: '', confirm: '' })

const passwordStrength = computed(() => {
  const s = pwd.value.next || ''
  let score = 0
  if (s.length >= 8) score += 1
  if (s.length >= 12) score += 1
  if (/[A-Z]/.test(s)) score += 1
  if (/[a-z]/.test(s)) score += 1
  if (/\d/.test(s)) score += 1
  if (/[^A-Za-z0-9]/.test(s)) score += 1
  return Math.min(score, 5)
})

const strengthLabel = computed(() => {
  const score = passwordStrength.value
  if (!pwd.value.next) return '未输入'
  if (score <= 2) return '弱'
  if (score <= 4) return '中'
  return '强'
})

const strengthTextClass = computed(() => {
  const score = passwordStrength.value
  if (!pwd.value.next) return 'text-text-muted'
  if (score <= 2) return 'text-red-600'
  if (score <= 4) return 'text-orange-600'
  return 'text-green-600'
})

const strengthCellClass = (index: number) => {
  if (!pwd.value.next) return 'bg-gray-100'
  const score = passwordStrength.value
  const active = index <= score
  if (!active) return 'bg-gray-100'
  if (score <= 2) return 'bg-red-500'
  if (score <= 4) return 'bg-orange-500'
  return 'bg-green-500'
}

const canSubmitPassword = computed(() => {
  if (!pwd.value.old || !pwd.value.next || !pwd.value.confirm) return false
  if (pwd.value.next !== pwd.value.confirm) return false
  if (passwordStrength.value < 2) return false
  return true
})

const submitPassword = () => {
  alert('已提交修改（占位，未接后端）')
  pwd.value = { old: '', next: '', confirm: '' }
}
</script>
