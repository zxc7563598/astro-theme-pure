<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="batch-id-check">
        <!-- 顶部按钮：下载示例 -->
        <div class="col-span-full flex justify-between items-center">
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition w-full"
                @click="downloadTemplate">
                下载 CSV 示例
            </button>
        </div>

        <!-- 上传区域 -->
        <div class="col-span-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition hover:border-primary hover:bg-muted"
            @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileSelect">
            <input type="file" ref="fileInput" accept=".csv" class="hidden" @change="handleFileChange" />
            <div v-if="!fileName">
                <p class="text-sm text-muted-foreground">拖拽 CSV 文件到此处，或点击上传</p>
            </div>
            <div v-else>
                <p class="text-sm">已选择文件：<b>{{ fileName }}</b></p>
            </div>
        </div>

        <!-- 状态展示 -->
        <div v-if="loading" class="col-span-full text-center text-sm text-muted-foreground">
            正在处理，请稍候...
        </div>

        <div v-if="processed" class="col-span-full text-center">
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foregroun text-sm hover:bg-primary-foreground transition w-full"
                @click="downloadResult">
                下载处理结果
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile } from '@/components/custom/plugins/api'
import { showToast } from '@/components/custom/utils'

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const loading = ref(false)
const processed = ref(false)
let fileURL: string | null = null

interface ApiResponse {
    code: number
    message: string
    data?: any
}

// 下载示例 CSV
function downloadTemplate() {
    const csv = '地址信息，不考虑第一行\n"北京市东城区宵云路36号国航大厦一层,陈洪强,15231161245,370982198919496879"\n"甘肃省东乡族自治县布楞沟村1号,耿婷婷,15105249211,321322198922385425"\n"成都市双流区宵云路36号国航大厦一层,王科威,18219787273,412701199502314011"\n"内蒙古自治区乌兰察布市公安局交警支队车管所,吴峰,15023855477,511202197912129112"\n"长春市朝阳区宵云路36号国航大厦一层,白腾林,18191161244,610523329601180716"\n"成都市高新区天府软件园B区科技大楼,张明星,15054725276,370883199113253914"\n"双流区郑通路社保局区52050号,张琳,13964332983,370303195561072140"\n"岳市岳阳楼区南湖求索路碧灏花园A座1101,那志国,18535467529,142401832707230932"\n"四川省南充市阆中市公园路25号,赵江林,18282783359,513701392603196312"'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '上传示例.csv'
    a.click()
    URL.revokeObjectURL(url)
}

// 点击上传
function triggerFileSelect() {
    fileInput.value?.click()
}

// 拖拽上传
function handleDrop(event: DragEvent) {
    const file = event.dataTransfer?.files?.[0]
    if (file) processFile(file)
}

// 点击选择文件上传
function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) processFile(file)
}

// 处理 CSV 文件
async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
        alert('请上传 CSV 文件')
        return
    }
    fileName.value = file.name
    loading.value = true
    processed.value = false
    uploadFile<ApiResponse>('/address-parser/upload', {
        user: 1
    }, 'file', file).then((data) => {
        if (data.code == 0) {
            fileURL = data.data.url
            processed.value = true
        } else {
            showToast({ message: data.message })
            fileURL = null
            processed.value = false
            fileName.value = ''
            fileInput.value = null
        }
    }).finally(() => {
        loading.value = false
    })
}

// 下载结果
function downloadResult() {
    if (!fileURL) return
    const a = document.createElement('a')
    a.href = fileURL
    a.download = '处理结果.csv'
    a.click()
    fileURL = null
    processed.value = false
    fileName.value = ''
    fileInput.value = null
}
</script>
