<template>
  <div class="relative flex flex-col items-center justify-center space-y-3">
    <!-- 点击按钮 -->
    <button
      @click="show = !show"
      class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
    >
      惊喜扫一扫 🎁
    </button>

    <!-- 微信二维码弹出 -->
    <div
      v-if="show"
      class="absolute top-12 flex flex-col items-center p-2 bg-white rounded-lg shadow-lg animate-fade-in"
    >
      <img src="/images/wormhole.png" alt="微信二维码" class="w-36 h-36 object-contain" />
      <p class="text-sm mt-2 text-gray-600">扫码加我微信</p>
      <button
        @click="copyWx"
        class="mt-1 text-xs text-blue-500 hover:underline"
      >
        复制微信号
      </button>
    </div>

    <!-- 提示复制成功 -->
    <p v-if="copied" class="text-xs text-green-500 animate-fade-in">微信号已复制 ✅</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
const copied = ref(false)
const wxId = 'your_wechat_id' // 替换成你的微信号

function copyWx() {
  navigator.clipboard.writeText(wxId).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  })
}
</script>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
