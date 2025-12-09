<template>
    <section class="w-full mt-10 px-4">
        <div class="mt-10 space-y-6" id="question-list" v-if="lockEnabled">
            <div class="border border-border rounded-2xl p-6 shadow-sm mt-4">
                <div class="locked-question">
                    <p class="text-gray-500">此页面已锁定，需要密码查看。</p>
                    <input type="password" v-model="password" placeholder="输入密码"
                        class="mt-3 p-2 rounded-xl border border-border w-full" />
                    <button class="mt-3 py-2 w-full rounded-xl bg-input text-muted-foreground hover:opacity-80"
                        @click="handleGetList()">解锁</button>
                </div>
            </div>
        </div>
        <div class="mt-10 space-y-6" id="question-list" v-else>
            <div class="border border-border rounded-2xl p-6 shadow-sm mt-4" v-for="item in list">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <span class="text-sm text-gray-500">{{ item.create_time }}</span>
                </div>
                <div class="question">
                    <div class="whitespace-pre-wrap">{{ item.question }}</div>
                    <textarea name="question" placeholder="你的回答..." v-model="item.answer"
                        class="w-full h-32 p-3 rounded-xl border border-border focus:outline-none text-sm mt-4"></textarea>
                    <button type="button" @click="handleAnswer(item.id)"
                        class="w-full py-3 rounded-xl font-semibold bg-input text-muted-foreground hover:opacity-80 transition">
                        回答问题
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { showToast } from '@/components/custom/utils'
import { request } from '@/components/custom/plugins/api'

const loading = ref(false);
const lockEnabled = ref(true);
const password = ref('');

interface ApiResponse {
    code: number
    message: string
    data?: any
}

interface List {
    id: number
    name?: string
    question?: string
    answer?: string
    create_time?: string
}

const list = ref<List[]>([]);

async function handleGetList() {
    if (loading.value) {
        showToast({ message: '有些太快了' })
        return
    }
    loading.value = true
    request<ApiResponse>('/problem/unanswered', {
        password: password.value,
    }).then((data) => {
        if (data.code == 0) {
            lockEnabled.value = false
            list.value = data.data?.list.map((item: any) => ({
                id: item.id,
                name: item.name,
                question: item.question,
                create_time: item.create_time,
            }))
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}

async function refresh() {
    handleGetList()
}

async function handleAnswer(id: number) {
    if (loading.value) {
        showToast({ message: '有些太快了' })
        return
    }
    const item = list.value.find(item => item.id === id)
    if (item) {
        loading.value = true
        request<ApiResponse>('/problem/answer', {
            id: item.id,
            answer: item.answer,
        }).then((data) => {
            if (data.code != 0) {
                showToast({ message: data.message })
            }
        }).finally(() => {
            loading.value = false
            refresh()
        })
    } else {
        showToast({ message: '认真的吗？我没找到数据' })
    }
}

</script>
