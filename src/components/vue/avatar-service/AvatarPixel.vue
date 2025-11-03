<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="avatar-generator">
        <div class="col-span-full flex flex-col sm:flex-row items-center gap-2">
            <input v-model="seed" type="text" placeholder="输入任意字符串生成头像"
                class="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition w-full sm:w-auto"
                @click="generateAvatar">
                生成头像
            </button>
        </div>
        <div v-if="avatarUrl" class="col-span-full flex flex-col items-center gap-2 text-center">
            <img :src="avatarUrl" alt="生成头像" class="w-32 h-32 rounded-xl border cursor-pointer"
                @click="downloadAvatar" />
            <input type="text" :value="avatarUrl" readonly
                class="w-full rounded-lg border px-3 py-2 text-sm text-center cursor-pointer focus:outline-none"
                @click="copyAvatarUrl" />
            <p class="text-xs text-muted-foreground">图片右键即可保存，点击链接立即复制</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/plugins/toast'

const seed = ref('')
const avatarUrl = ref('')

// 生成头像 URL
function generateAvatar() {
    if (!seed.value) {
        showToast({ message: '请输入任意内容后生成' })
        return
    }
    avatarUrl.value = `https://avatar.hejunjie.life/avatar?seed=${encodeURIComponent(seed.value)}&style=pixel`
}

// 点击复制头像链接
function copyAvatarUrl() {
    if (!avatarUrl.value) return
    navigator.clipboard.writeText(avatarUrl.value)
        .then(() => {
            showToast({ message: '链接已复制到剪贴板' })
        })
        .catch(() => {
            showToast({ message: '复制失败，请手动复制' })
        })
}
</script>
