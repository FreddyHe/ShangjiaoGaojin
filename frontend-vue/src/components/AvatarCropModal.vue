<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <div class="relative w-full max-w-xl bg-white rounded-3xl shadow-medium border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div class="font-bold text-lg text-text-primary">裁剪头像</div>
          <button class="p-2 rounded-xl hover:bg-gray-100 transition-colors" @click="emit('close')" aria-label="关闭">
            <X :size="18" />
          </button>
        </div>

        <div class="p-6 grid gap-5">
          <div class="flex items-center justify-center">
            <div
              ref="previewEl"
              class="h-60 w-60 rounded-3xl overflow-hidden bg-surface-50 border border-gray-200 relative touch-none"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
              @pointerleave="onPointerUp"
            >
              <div class="absolute inset-0 flex items-center justify-center" v-if="loading">
                <Loader2 :size="20" class="animate-spin text-text-tertiary" />
              </div>
              <div v-if="!loading" class="absolute inset-0 flex items-center justify-center">
                <img
                  :src="imageUrl"
                  alt="avatar"
                  class="select-none pointer-events-none"
                  :style="imgStyle"
                  draggable="false"
                />
              </div>
            </div>
          </div>

          <div class="grid gap-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-text-secondary">缩放</div>
              <div class="text-xs text-text-muted">{{ Math.round(zoom * 100) }}%</div>
            </div>
            <input
              class="w-full accent-orange-600"
              type="range"
              min="1"
              max="3"
              step="0.01"
              v-model.number="zoom"
              @input="clampOffsets"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button class="btn" @click="emit('close')">取消</button>
            <button class="btn btn-primary" @click="save" :disabled="loading">保存头像</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Loader2, X } from 'lucide-vue-next'

const props = defineProps<{
  imageUrl: string
}>()

const emit = defineEmits<{
  close: []
  save: [avatarDataUrl: string]
}>()

const previewEl = ref<HTMLElement | null>(null)
const loading = ref(true)

const imgNatural = ref({ w: 1, h: 1 })
const zoom = ref(1.2)
const offset = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 })

const PREVIEW_SIZE = 240
const OUTPUT_SIZE = 256

const baseScale = computed(() => {
  const w = imgNatural.value.w
  const h = imgNatural.value.h
  return Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h)
})

const scaleFactor = computed(() => {
  return baseScale.value * zoom.value
})

const imgStyle = computed(() => {
  const s = scaleFactor.value
  return {
    transform: `translate(${offset.value.x}px, ${offset.value.y}px) scale(${s})`,
    transformOrigin: 'center',
    willChange: 'transform'
  } as Record<string, string>
})

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const clampOffsets = () => {
  const w = imgNatural.value.w * scaleFactor.value
  const h = imgNatural.value.h * scaleFactor.value
  const maxX = Math.max(0, (w - PREVIEW_SIZE) / 2)
  const maxY = Math.max(0, (h - PREVIEW_SIZE) / 2)
  offset.value = {
    x: clamp(offset.value.x, -maxX, maxX),
    y: clamp(offset.value.y, -maxY, maxY)
  }
}

const onPointerDown = (e: PointerEvent) => {
  if (loading.value) return
  dragging.value = true
  const startX = e.clientX
  const startY = e.clientY
  dragStart.value = { x: startX, y: startY, ox: offset.value.x, oy: offset.value.y }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

const onPointerMove = (e: PointerEvent) => {
  if (!dragging.value || loading.value) return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  offset.value = { x: dragStart.value.ox + dx, y: dragStart.value.oy + dy }
  clampOffsets()
}

const onPointerUp = (e: PointerEvent) => {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
  }
}

const save = async () => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = props.imageUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load image failed'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const ratio = OUTPUT_SIZE / PREVIEW_SIZE
  ctx.translate(OUTPUT_SIZE / 2 + offset.value.x * ratio, OUTPUT_SIZE / 2 + offset.value.y * ratio)
  ctx.scale(scaleFactor.value * ratio, scaleFactor.value * ratio)
  ctx.drawImage(img, -imgNatural.value.w / 2, -imgNatural.value.h / 2, imgNatural.value.w, imgNatural.value.h)

  const dataUrl = canvas.toDataURL('image/png')
  emit('save', dataUrl)
}

const loadImageInfo = async () => {
  loading.value = true
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = props.imageUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load image failed'))
  })
  imgNatural.value = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 }
  offset.value = { x: 0, y: 0 }
  zoom.value = 1.2
  loading.value = false
  clampOffsets()
}

watch(() => props.imageUrl, () => {
  loadImageInfo().catch(() => {
    loading.value = false
  })
}, { immediate: true })

onMounted(() => {
  if (previewEl.value) {
    const rect = previewEl.value.getBoundingClientRect()
    if (rect.width && rect.height) {
      clampOffsets()
    }
  }
})
</script>
