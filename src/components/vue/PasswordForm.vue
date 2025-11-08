<template>

    <div
        class="relative mb-8 pl-4 border-l-2 border-foreground/10 text-left text-sm sm:text-base text-muted-foreground leading-relaxed">
        当前文章为加密文章<br />
        请回答问题以获取查看文章的权限
    </div>

    <div class="grid gap-3.5 sm:grid-cols-1 sm:gap-4 lg:grid-cols-2 [&>*:only-child]:lg:col-span-2">
        <div class="not-prose block relative rounded-2xl border px-5 py-3 transition-all hover:border-foreground/25 hover:shadow-sm cursor-pointer"
            v-for="(item, index) in questions" :key="index">
            <div class="flex flex-col gap-y-1.5">
                <div class="flex flex-col gap-y-0.5">
                    <h2 class="text-lg font-medium">问题{{ index + 1 }}</h2>
                    <p class="text-muted-foreground">{{ item }}</p>
                </div>
                <div>
                    <input v-model="answers[index]" type="text"
                        class="flex-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" />
                </div>
            </div>
        </div>
    </div>

    <div class="relative w-full text-end mt-3.5">
        <button
            class="rounded-lg bg-muted px-8 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
            :disabled="loading" @click="verifyAnswer">
            {{ loading ? '验证中...' : '验证' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { showToast } from '@/plugins/toast'

const loading = ref(false);

const props = defineProps<{
    slug: string;
    questions: string[];
}>();

const answers = reactive<string[]>(Array(props.questions.length).fill(''));

async function verifyAnswer() {
    loading.value = true
    const path = window.location.pathname
    const formData = new FormData()
    answers.forEach((a, i) => formData.append(`answer_${i}`, a))
    formData.append(`path`, path)
    const res = await fetch(`/api/verify?slug=${props.slug}`, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
    });
    const data = await res.json()
    if (res.ok && data.success) {
        window.location.reload()
    } else {
        showToast({ message: data.error || '验证失败' })
    }
    loading.value = false
}
</script>
