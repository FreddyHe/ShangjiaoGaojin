<template>
  <div class="grid gap-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-2xl font-bold text-text-primary">个人中心</div>
        <div class="text-sm text-text-muted mt-1">管理你的账号信息、头像、安全设置与使用偏好</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn" @click="reset">重置</button>
        <button class="btn btn-primary" @click="saveProfile">保存资料</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <div class="grid gap-6">
        <div class="card p-6">
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 rounded-3xl overflow-hidden bg-orange-100 border border-orange-200 flex items-center justify-center">
              <img v-if="draft.avatarDataUrl" :src="draft.avatarDataUrl" alt="Avatar" class="h-full w-full object-cover" />
              <span v-else class="text-orange-700 font-bold text-2xl">{{ initials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <div class="font-bold text-lg text-text-primary truncate">{{ draft.nickname || draft.name || '未设置昵称' }}</div>
                <span class="badge badge-custom">{{ roleLabel }}</span>
              </div>
              <div class="text-xs text-text-muted mt-1">用户ID：{{ draft.userId }}</div>
              <div class="text-xs text-text-muted mt-1">注册时间：{{ formatTime(draft.registeredAt) }}</div>
              <div class="text-xs text-text-muted mt-1">最近登录：{{ formatTime(draft.lastLoginAt) }}（{{ draft.lastLoginLocation }}）</div>
            </div>
          </div>

          <div class="mt-5 grid gap-3">
            <div class="text-sm font-medium text-text-secondary">头像</div>
            <div class="grid gap-2">
              <div class="text-xs text-text-muted">支持 PNG/JPG/WebP，最大 2MB。保存后会同步到右上角头像。</div>
              <div class="flex items-center gap-3">
                <button class="btn" @click="triggerAvatarInput">上传/更换</button>
                <button class="btn" @click="removeAvatar" :disabled="!draft.avatarDataUrl">移除</button>
              </div>
              <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarFileChange" />
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="font-bold text-lg text-text-primary mb-4">使用统计（占位）</div>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-background-50 border border-gray-200">
              <div class="text-xs text-text-muted">最近生成</div>
              <div class="mt-1 text-2xl font-bold text-text-primary">{{ stats.recentGenerated }}</div>
              <div class="text-xs text-text-muted mt-1">篇</div>
            </div>
            <div class="p-4 rounded-2xl bg-background-50 border border-gray-200">
              <div class="text-xs text-text-muted">本周生成</div>
              <div class="mt-1 text-2xl font-bold text-text-primary">{{ stats.weekGenerated }}</div>
              <div class="text-xs text-text-muted mt-1">篇</div>
            </div>
          </div>
          <div class="mt-5 grid gap-4">
            <div class="p-4 rounded-2xl bg-background-50 border border-gray-200">
              <div class="text-xs text-text-muted">模板使用次数</div>
              <div class="mt-1 text-xl font-bold text-text-primary">{{ stats.templateUsed }}</div>
            </div>

            <div class="p-4 rounded-2xl bg-background-50 border border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs text-text-muted">类型分布（占位）</div>
                <div class="text-xs text-text-muted">总计 {{ totalDistribution }}</div>
              </div>
              <div class="flex items-center gap-4">
                <svg viewBox="0 0 120 120" class="h-24 w-24">
                  <g transform="translate(60,60)">
                    <path
                      v-for="seg in pieSegments"
                      :key="seg.label"
                      :d="seg.d"
                      fill="currentColor"
                      :class="seg.colorClass"
                    />
                  </g>
                </svg>
                <div class="flex-1 min-w-0 grid gap-2">
                  <div v-for="seg in pieSegments" :key="seg.label" class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="h-2.5 w-2.5 rounded-full" :class="seg.dotClass"></span>
                      <span class="text-xs text-text-secondary truncate">{{ seg.label }}</span>
                    </div>
                    <span class="text-xs text-text-muted">{{ seg.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6">
        <div class="card p-6">
          <div class="font-bold text-lg text-text-primary mb-4">账户身份</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">姓名</label>
              <input class="input" v-model="draft.name" placeholder="请输入姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">昵称</label>
              <input class="input" v-model="draft.nickname" placeholder="请输入昵称" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">邮箱</label>
              <input class="input" v-model="draft.email" placeholder="name@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">手机号（可选）</label>
              <input class="input" v-model="draft.phone" placeholder="13800000000" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">用户ID（只读）</label>
              <input class="input bg-gray-50" :value="draft.userId" disabled />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">角色（只读）</label>
              <select class="input" v-model="draft.role" disabled>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="mt-4 p-4 rounded-2xl bg-amber-50/40 border border-amber-100 text-sm text-text-secondary leading-relaxed">
            当前角色可用能力说明（占位）：普通用户可使用模板管理、大纲提取、稿件生成与历史记录；管理员可额外管理系统设置、全局类型/模板与知识库。
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="font-bold text-lg text-text-primary">修改密码（占位）</div>
            <span class="text-xs text-text-muted">暂不接后端，仅做表单与校验</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">旧密码</label>
              <input class="input" v-model="pwd.old" type="password" placeholder="请输入旧密码" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">新密码</label>
              <input class="input" v-model="pwd.next" type="password" placeholder="至少 8 位" />
              <div class="mt-2">
                <div class="grid grid-cols-5 gap-1">
                  <div v-for="i in 5" :key="i" class="h-2 rounded-full" :class="strengthCellClass(i)"></div>
                </div>
                <div class="text-xs mt-1" :class="strengthTextClass">{{ strengthLabel }}</div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">确认新密码</label>
              <input class="input" v-model="pwd.confirm" type="password" placeholder="再次输入新密码" />
              <div v-if="pwd.confirm && pwd.confirm !== pwd.next" class="text-xs text-red-600 mt-1">两次输入不一致</div>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button class="btn btn-primary" @click="submitPassword" :disabled="!canSubmitPassword">提交修改</button>
          </div>
        </div>

        <div class="card p-6">
          <div class="font-bold text-lg text-text-primary mb-4">第三方账号绑定（占位）</div>
          <div class="grid gap-3">
            <div v-for="p in providers" :key="p.key" class="flex items-center justify-between p-4 rounded-2xl bg-background-50 border border-gray-200">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-text-tertiary">
                  <component :is="p.icon" :size="18" />
                </div>
                <div>
                  <div class="font-medium text-text-primary">{{ p.label }}</div>
                  <div class="text-xs text-text-muted">{{ bindings[p.key] ? '已绑定（占位）' : '未绑定（占位）' }}</div>
                </div>
              </div>
              <button class="btn" @click="toggleBinding(p.key)">{{ bindings[p.key] ? '解绑' : '绑定' }}</button>
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
