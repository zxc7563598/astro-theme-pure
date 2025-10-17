<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <input v-model="address" class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                placeholder="请输入地址信息" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '解析中...' : '解析' }}
            </button>
        </div>
        <div v-if="result" class="col-span-full rounded-lg border p-3 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                <div><b>名称：</b>{{ result.name }}</div>
                <div><b>手机号：</b>{{ result.mobile }}</div>
                <div class="sm:col-span-2"><b>身份证：</b>{{ result.idn }}</div>
                <div><b>邮编：</b>{{ result.postcode }}</div>
                <div><b>省份：</b>{{ result.province }}</div>
                <div><b>城市：</b>{{ result.city }}</div>
                <div><b>区县：</b>{{ result.region }}</div>
                <div class="sm:col-span-2"><b>详细地址：</b>{{ result.street }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/plugins/api'
import { showToast } from '@/plugins/toast'

const address = ref('')
const loading = ref(false)
const result = ref<any>(null)

interface ApiResponse {
    code: number
    message: string
    data?: any
}

async function handleQuery() {
    if (!address.value.trim()) {
        showToast({ message: '请输入地址信息' })
        return
    }
    loading.value = true
    request<ApiResponse>('/address-parser/send', {
        address: address.value,
        user: true
    }).then((data) => {
        if (data.code == 0) {
            result.value = {
                name: data.data.name,
                mobile: data.data.mobile,
                idn: data.data.idn,
                postcode: data.data.postcode,
                province: data.data.province,
                city: data.data.city,
                region: data.data.region,
                street: data.data.street
            }
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}
</script>
