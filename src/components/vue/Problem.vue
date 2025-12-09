<template>
    <section class="w-full mt-10 px-4">
        <form class="space-y-4">
            <input name="name" type="text" placeholder="如何称呼（可选）" v-model="name"
                class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm" />
            <textarea name="question" placeholder="你的问题..." v-model="question"
                class="w-full h-32 p-3 rounded-xl border border-border focus:outline-none text-sm mt-4"></textarea>
            <input name="email" type="email" placeholder="邮箱（建议填写，以便接收邮件通知）" v-model="email"
                class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm mt-4" />
            <Collapse title='锁定问题' v-model="lockEnabled">
                <div class="mt-1 space-y-4">
                    <input v-model="password" type="password" placeholder="设置锁定密码，提交后通过锁定密码才能查看问题"
                        class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm" />
                </div>
            </Collapse>
            <button type="button" @click="handleAddProblems"
                class="w-full py-3 rounded-xl font-semibold bg-input text-muted-foreground hover:opacity-80 transition">
                提交问题
            </button>
        </form>
        <div class="mt-10 space-y-6" id="question-list">
            <div class="border border-border rounded-2xl p-6 shadow-sm mt-4" v-for="item in list">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <span class="text-sm text-gray-500">{{ item.create_time }}</span>
                </div>
                <div class="locked-question" v-if="item.lock">
                    <p class="text-gray-500">此问题已锁定，需要密码查看。</p>
                    <input type="password" v-model="item.lockPassword" placeholder="输入密码"
                        class="mt-3 p-2 rounded-xl border border-border w-full" />
                    <button class="mt-3 py-2 w-full rounded-xl bg-input text-muted-foreground hover:opacity-80"
                        @click="handleUnlock(item.id)">解锁</button>
                </div>
                <div class="question" v-else>
                    <div class="whitespace-pre-wrap">{{ item.question }}</div>
                    <div class="mt-3 text-sm text-gray-500 whitespace-pre-wrap" v-if="item.answer">回答：{{ item.answer }}
                    </div>
                </div>
            </div>
            <div class="flex justify-center items-center gap-4 pt-4 pb-10" v-if="Math.ceil(total / pageSize) > 1">
                <button class="px-4 py-2 rounded-xl border border-border disabled:opacity-30 hover:opacity-80"
                    :disabled="pageNo == 1" @click="pageTurning(pageNo - 1)">上一页</button>
                <span class="text-gray-500">第 {{ pageNo }} / {{ Math.ceil(total / pageSize) }} 页</span>
                <button class="px-4 py-2 rounded-xl border border-border disabled:opacity-30 hover:opacity-80"
                    :disabled="pageNo == Math.ceil(total / pageSize)" @click="pageTurning(pageNo + 1)">下一页</button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { showToast } from '@/components/custom/utils'
import { request } from '@/components/custom/plugins/api'
import Collapse from './Collapse.vue';

const loading = ref(false);
const lockEnabled = ref(false);

interface ApiResponse {
    code: number
    message: string
    data?: any
}

interface List {
    answer?: string
    create_time?: string
    id: number
    lock: boolean
    name?: string
    question?: string
    lockPassword?: string
}

const name = ref('')
const question = ref('')
const email = ref('')
const password = ref('')

const list = ref<List[]>([]);

async function handleAddProblems() {
    if (!question.value.trim()) {
        showToast({ message: '至少问题还是需要输入的' })
        return
    }
    if (loading.value) {
        showToast({ message: '有些太快了' })
        return
    }
    loading.value = true
    request<ApiResponse>('/problem/add', {
        name: name.value.trim(),
        question: question.value.trim(),
        email: email.value.trim(),
        lock: password.value.trim()
    }).then((data) => {
        if (data.code == 0) {
            name.value = '';
            question.value = '';
            email.value = '';
            password.value = '';
            showToast({ message: '提交成功！' })
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
        refresh()
    })
}

const pageNo = ref(1)
const pageSize = ref(20)
const total = ref(1)
async function handleGetList() {
    if (loading.value) {
        showToast({ message: '有些太快了' })
        return
    }
    loading.value = true
    request<ApiResponse>('/problem/get', {
        pageNo: pageNo.value,
        pageSize: pageSize.value,
    }).then((data) => {
        if (data.code == 0) {
            total.value = data.data?.total ?? 1
            list.value = data.data?.pageData.map((item: any) => ({
                id: item.id,
                lock: item.lock,
                name: item.name,
                answer: item.answer,
                create_time: item.create_time,
                question: item.question,
                lockPassword: null,
            }))
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}

async function refresh() {
    pageNo.value = 1
    handleGetList()
}

async function pageTurning(page: number) {
    if (page <= 1) {
        page = 1;
    }
    if (page >= Math.ceil(total.value / pageSize.value)) {
        page = Math.ceil(total.value / pageSize.value)
    }
    pageNo.value = page
    handleGetList()
}

async function handleUnlock(id: number) {
    if (loading.value) {
        showToast({ message: '有些太快了' })
        return
    }
    const item = list.value.find(item => item.id === id)
    const newItem = item;
    if (newItem) {
        loading.value = true
        request<ApiResponse>('/problem/unlock', {
            id: item.id,
            lock: item.lockPassword,
        }).then((data) => {
            if (data.code == 0) {
                newItem.question = data.data?.question
                newItem.answer = data.data?.answer
                newItem.lock = false
                Object.assign(item, newItem)
            } else {
                showToast({ message: data.message })
            }
        }).finally(() => {
            loading.value = false
        })
    } else {
        showToast({ message: '认真的吗？我没找到数据' })
    }
}

onMounted(async () => {
    refresh()
})

</script>
