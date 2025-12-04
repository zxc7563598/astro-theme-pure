<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <input v-model="idNumber" class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                placeholder="请输入身份证号码" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="result" class="col-span-full rounded-lg border p-3 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                <div><b>身份证号码：</b>{{ result.id }}</div>
                <div><b>是否有效：</b>{{ result.valid ? '是' : '否' }}</div>
                <div><b>性别：</b>{{ result.gender }}</div>
                <div><b>省份：</b>{{ result.province }}</div>
                <div><b>城市：</b>{{ result.city }}</div>
                <div><b>区县：</b>{{ result.district }}</div>
                <div class="sm:col-span-2"><b>出生日期：</b>{{ result.birthday }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/components/custom/plugins/api'
import { showToast } from '@/components/custom/utils'

const idNumber = ref('')
const loading = ref(false)
const result = ref<any>(null)

interface ApiResponse {
    code: number
    message: string
    data?: any
}

async function handleQuery() {
    if (!idNumber.value.trim()) {
        showToast({ message: '请输入身份证号码' })
        return
    }
    loading.value = true
    request<ApiResponse>('/china-division/send', {
        id_card: idNumber.value
    }).then((data) => {
        if (data.code == 0) {
            result.value = {
                id: idNumber.value,
                valid: data.data.is_valid,
                gender: data.data.sex,
                province: data.data.province,
                city: data.data.city,
                district: data.data.area,
                birthday: `${data.data.birthday.year}-${data.data.birthday.month}-${data.data.birthday.day}`,
            }
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}
</script>
