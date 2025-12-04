<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <select v-model="type"
                class="rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 flex-shrink-0">
                <option value="solar-to-lunar">阳历转农历</option>
                <option value="lunar-to-solar">农历转阳历</option>
            </select>
            <input v-model="date" type="date"
                class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" placeholder="请输入身份证号码" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="convert_date" class="col-span-full flex items-center gap-2">
            <span>转换结果：</span>
            <input v-model="convert_date" type="date"
                class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 cursor-pointer" disabled />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                @click="copyItem">
                复制
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/components/custom/plugins/api'
import { showToast } from '@/components/custom/utils'

const date = ref('')
const type = ref('solar-to-lunar')
const loading = ref(false)
const convert_date = ref('')

interface ApiResponse {
    code: number
    message: string
    data?: any
}

async function handleQuery() {
    if (!date.value.trim()) {
        showToast({ message: '请输入日期' })
        return
    }
    loading.value = true
    request<ApiResponse>('/fortune-analyzer/date-conversion', {
        date: date.value,
        type: type.value
    }).then((data) => {
        if (data.code == 0) {
            convert_date.value = data.data.convert_date
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}

function copyItem() {
    if (!convert_date.value.trim()) return
    navigator.clipboard.writeText(convert_date.value)
        .then(() => {
            showToast({ message: '内容已复制到剪贴板' })
        })
        .catch(() => {
            showToast({ message: '复制失败，请手动复制' })
        })
}
</script>
