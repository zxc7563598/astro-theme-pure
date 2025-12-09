<template>
    <section class="w-full">
        <form class="space-y-4">
            <input name="name" type="text" placeholder="如何称呼（可选）" v-model="name"
                class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm bg-transparent" />
            <textarea name="question" placeholder="你的问题..." v-model="question"
                class="w-full h-30 p-3 rounded-xl border border-border focus:outline-none text-sm mt-4 bg-transparent"></textarea>
            <input name="email" type="email" placeholder="邮箱（建议填写，以便接收邮件通知）" v-model="email"
                class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm mt-4 bg-transparent" />
            <Collapse title='锁定问题' v-model="lockEnabled">
                <div class="mt-1 space-y-4">
                    <input v-model="password" type="password" placeholder="设置锁定密码，提交后通过锁定密码才能查看问题"
                        class="w-full p-3 rounded-xl border border-border focus:outline-none text-sm bg-transparent" />
                </div>
            </Collapse>
            <button type="button" @click="handleAddProblems"
                class="w-full py-3 rounded-xl font-semibold bg-input text-muted-foreground hover:opacity-80 transition">
                提交问题
            </button>
        </form>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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

const name = ref('')
const question = ref('')
const email = ref('')
const password = ref('')

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
    })
}
</script>
