<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="phone-check">
        <div class="col-span-full flex items-center gap-2">
            <input v-model="phone" class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                placeholder="请输入手机号码" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="result" class="col-span-full rounded-lg border p-3 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                <div class="sm:col-span-2"><b>手机号码：</b>{{ result.id }}</div>
                <div><b>省份：</b>{{ result.province }}</div>
                <div><b>城市：</b>{{ result.city }}</div>
                <div><b>运营商：</b>{{ result.isp }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/plugins/api'
import { showToast } from '@/plugins/toast'

const phone = ref('')
const loading = ref(false)
const result = ref<any>(null)

interface ApiResponse {
    code: number
    message: string
    data?: any
}

async function handleQuery() {
    if (!phone.value.trim()) {
        showToast({ message: '请输入手机号码' })
        return
    }
    loading.value = true
    request<ApiResponse>('/mobile-locator/send', {
        phone: phone.value
    }).then((data) => {
        if (data.code == 0) {
            result.value = {
                id: phone.value,
                province: data.data.province,
                city: data.data.city,
                isp: data.data.isp,
            }
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}
</script>
