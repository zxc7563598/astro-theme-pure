<template>
  <form @submit.prevent="submitForm" class="space-y-6">
    <div class="mb-4">
      <label class="block text-sm text-gray-700">网站名称</label>
      <input v-model="form.name" type="text" required placeholder="你的站点名称"
        class="w-full border-b border-gray-300 bg-transparent px-2 py-2 focus:outline-none focus:border-[var(--theme)] transition-colors" />
    </div>

    <div class="mb-4">
      <label class="block text-sm text-gray-700">网站描述</label>
      <input v-model="form.intro" type="text" required placeholder="简单介绍一下你的站点"
        class="w-full border-b border-gray-300 bg-transparent px-2 py-2 focus:outline-none focus:border-[var(--theme)] transition-colors" />
    </div>

    <div class="mb-4">
      <label class="block text-sm text-gray-700">网站地址</label>
      <input v-model="form.link" type="url" required placeholder="https://example.com"
        class="w-full border-b border-gray-300 bg-transparent px-2 py-2 focus:outline-none focus:border-[var(--theme)] transition-colors" />
    </div>

    <div class="mb-4">
      <label class="block text-sm text-gray-700">友情链接页面地址</label>
      <input v-model="form.friend_link" type="url" required placeholder="https://example.com/links"
        class="w-full border-b border-gray-300 bg-transparent px-2 py-2 focus:outline-none focus:border-[var(--theme)] transition-colors" />
    </div>

    <div class="mb-4">
      <label class="block text-sm text-gray-700">头像地址</label>
      <input v-model="form.avatar" type="url" required placeholder="https://example.com/avatar.png"
        class="w-full border-b border-gray-300 bg-transparent px-2 py-2 focus:outline-none focus:border-[var(--theme)] transition-colors" />
    </div>

    <div class="pt-2">
      <button type="submit" :disabled="loading"
        class="w-full rounded-lg bg-muted px-8 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition">
        {{ loading ? '提交中...' : '提交申请' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { showToast } from '@/plugins/toast'

const loading = ref(false);

interface FriendForm {
  name: string
  intro: string
  link: string
  avatar: string
  friend_link: string
}

const form = ref<FriendForm>({
  name: '',
  intro: '',
  link: '',
  avatar: '',
  friend_link: ''
})

async function submitForm() {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append(`name`, form.value.name)
    formData.append(`intro`, form.value.intro)
    formData.append(`link`, form.value.link)
    formData.append(`avatar`, form.value.avatar)
    formData.append(`friend_link`, form.value.friend_link)
    const res = await fetch('/api/friends', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    })
    const data = await res.json()
    if (data.success) {
      showToast({ message: '提交成功，站点已加入友链，刷新页面即可查看' })
      form.value = { name: '', intro: '', link: '', avatar: '', friend_link: '' }
    } else {
      showToast({ message: `提交失败：${data.message || '未知错误'}` })
    }
  } catch (err) {
    showToast({ message: `网络错误或服务器无响应` })
  } finally {
    loading.value = false
  }
}
</script>
