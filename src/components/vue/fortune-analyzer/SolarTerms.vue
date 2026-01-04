<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <input v-model="year" type="number" min="1901" max="2100"
                class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
                placeholder="输入1900-2100之间的年份" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-card transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="solarTermsList.length > 0" class="col-span-full rounded-lg border p-3 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                <ul class='ps-0 sm:ps-2'>
                    <li class='group relative flex list-none gap-x-3 rounded-full ps-0 sm:gap-x-2'
                        v-for="(item, index) in solarTermsList">
                        <span
                            class='z-10 my-2 ms-2 h-3 w-3 min-w-3 rounded-full border-2 border-muted-foreground transition-transform group-hover:scale-125' />
                        <span v-if="index != solarTermsList.length - 1"
                            class='absolute start-[12px] top-[20px] w-1 bg-border' style="height:calc(100% - 4px)" />
                        <div class='flex gap-2 max-sm:flex-col cursor-pointer' @click="copyItem(index)">
                            <samp
                                class='w-fit grow-0 rounded-md py-1 text-sm max-sm:bg-primary-foreground max-sm:px-2 sm:min-w-[82px] sm:text-right'>
                                {{ item.date }}
                            </samp>
                            <div>
                                {{ item.name }}
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/components/custom/plugins/api'
import { showToast } from '@/components/custom/utils'

interface ApiResponse {
    code: number
    message: string
    data?: any
}

interface SolarTermItem {
    date: string
    name: string
}

const year = ref()
const loading = ref(false)
const solarTermsList = ref<SolarTermItem[]>([])

async function handleQuery() {
    if (!year.value) {
        showToast({ message: '输入1900-2100之间的年份' })
        return
    }
    if (year.value < 1901) {
        showToast({ message: '输入1900-2100之间的年份' })
        return
    }
    if (year.value > 2100) {
        showToast({ message: '输入1900-2100之间的年份' })
        return
    }
    loading.value = true
    request<ApiResponse>('/fortune-analyzer/solar-terms', {
        year: year.value
    }).then((data) => {
        solarTermsList.value = [];
        if (data.code == 0) {
            solarTermsList.value = data.data.solar_terms
        } else {
            showToast({ message: data.message })
        }
        console.log(solarTermsList.value)
    }).finally(() => {
        loading.value = false
    })
}

function copyItem(index: number) {
    if (!solarTermsList.value[index]) return
    navigator.clipboard.writeText(solarTermsList.value[index].name + ' ' + solarTermsList.value[index].date)
        .then(() => {
            showToast({ message: '内容已复制到剪贴板' })
        })
        .catch(() => {
            showToast({ message: '复制失败，请手动复制' })
        })
}
</script>
