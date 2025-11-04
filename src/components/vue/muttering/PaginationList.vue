<template>
    <section id="content" class="animate" aria-label="文章列表">
        <div class="relative mt-10" v-if="unlockCode">
            <ul ref="listRef" class="relative flex flex-col gap-y-1.5 sm:gap-y-2 pl-6">
                <div class="absolute left-2 top-0 bottom-0 w-px bg-border"></div>
                <li v-for="(item, index) in pageData" :key="index"
                    class="relative flex flex-col gap-x-2 sm:flex-row cursor-pointer">
                    <div class="absolute left-0 top-6 w-2 h-2 rounded-full bg-primary shadow-sm"></div>
                    <div class="group relative w-full mb-2">
                        <div
                            class="absolute inset-0 rounded-2xl border border-dashed border-border transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:translate-y-1">
                        </div>
                        <div
                            class="relative flex flex-col rounded-2xl px-5 py-3 bg-background w-full border border-dashed border-border transition-all duration-300 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1">
                            <div class="group/link w-full flex flex-col transition-all hover:text-primary sm:flex-row">
                                <div class="flex items-center gap-2 py-1 text-xs">
                                    <span class="inline-flex items-center gap-1 text-muted-foreground">
                                        <span class="text-muted-foreground text-xs min-w-[150px] font-mono mr-2">
                                            <time :datetime="item.date">{{ item.date }}</time>
                                        </span>
                                    </span>
                                </div>
                                <div class="z-10 flex-grow">
                                    <div class="flex justify-between">
                                        <div>{{ item.beautify }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
                <div ref="bottomRef" class="h-10"></div>
            </ul>
            <div class="py-3 text-center text-sm text-muted-foreground">
                <span v-if="isLoadingMore">加载中...</span>
                <span v-else-if="!hasMore && pageData.length">没有更多啦～</span>
            </div>
        </div>
        <div class="relative mt-10" v-else>
            <div
                class="relative mb-8 pl-4 border-l-2 border-foreground/10 text-left text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>小小的门槛，只为了确认你真的认识我</p>
                <p>里面是些碎碎念、日常、没什么大事</p>
                <p>如果你能答上下面的小问题，那我们大概算熟</p>
            </div>

            <div class="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <div
                    class="not-prose block relative rounded-2xl border px-5 py-3 transition-all hover:border-foreground/25 hover:shadow-sm cursor-pointer">
                    <div class="flex flex-col gap-y-1.5">
                        <div class="flex flex-col gap-y-0.5">
                            <h2 class="text-lg font-medium">问题1</h2>
                            <p class="text-muted-foreground">我的生日是什么时候？</p>
                        </div>
                        <div>
                            <input v-model="answer[0]" type="date"
                                class="flex-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" />
                        </div>
                    </div>
                </div>
                <div
                    class="not-prose block relative rounded-2xl border px-5 py-3 transition-all hover:border-foreground/25 hover:shadow-sm cursor-pointer">
                    <div class="flex flex-col gap-y-1.5">
                        <div class="flex flex-col gap-y-0.5">
                            <h2 class="text-lg font-medium">问题2</h2>
                            <p class="text-muted-foreground">我养的猫叫什么名字？</p>
                        </div>
                        <div>
                            <input v-model="answer[1]"
                                class="flex-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" />
                        </div>
                    </div>
                </div>
                <div
                    class="not-prose block relative rounded-2xl border px-5 py-3 transition-all hover:border-foreground/25 hover:shadow-sm cursor-pointer">
                    <div class="flex flex-col gap-y-1.5">
                        <div class="flex flex-col gap-y-0.5">
                            <h2 class="text-lg font-medium">问题3</h2>
                            <p class="text-muted-foreground">我的女朋友叫什么名字？</p>
                        </div>
                        <div>
                            <input v-model="answer[2]"
                                class="flex-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative w-full text-end mt-3.5">
                <button
                    class="rounded-lg bg-muted px-8 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                    :disabled="loading" @click="handleUnlock">
                    {{ loading ? '验证中...' : '验证' }}
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { request } from '@/plugins/api'
import { showToast } from '@/plugins/toast'

const loading = ref(false)
const answer = ref(['', '', ''])
const page = ref(1)
const pageSize = ref(100)
const unlockCode = ref<string | null>(null)
const listRef = ref<HTMLElement | null>(null)
const bottomRef = ref<HTMLElement | null>(null)

interface ApiResponse {
    code: number
    message: string
    data?: any
}
interface listItem {
    beautify: string
    date: string
}

const pageData = ref<listItem[]>([])
const isLoadingMore = ref(false)
const hasMore = ref(true)

function handleUnlock() {
    loading.value = true
    request<ApiResponse>('/daily-murmurs/unlock', {
        answer: answer.value.join(' & '),
    })
        .then((data) => {
            if (data.code === 0) {
                localStorage.setItem('unlock-code', data.data.code)
                unlockCode.value = data.data.code
                page.value = 1
                pageData.value = []
                handleData()
            } else {
                showToast({ message: data.message })
            }
        })
        .finally(() => {
            loading.value = false
        })
}

async function handleData(isLoadMore = false) {
    if (isLoadMore && !hasMore.value) return
    if (isLoadMore) isLoadingMore.value = true
    else loading.value = true

    try {
        const data = await request<ApiResponse>('/daily-murmurs/list', {
            page: page.value,
            page_size: pageSize.value,
            code: unlockCode.value,
        })

        if (data.code === 0) {
            const newItems = data.data.pageData || []
            if (isLoadMore) pageData.value.push(...newItems)
            else pageData.value = newItems

            hasMore.value = newItems.length >= pageSize.value
            if (hasMore.value) page.value++
        } else {
            unlockCode.value = null
            localStorage.removeItem('unlock-code')
            showToast({ message: data.message })
        }
    } finally {
        loading.value = false
        isLoadingMore.value = false
    }
    checkBottomImmediately()
}

function checkBottomImmediately() {
    if (!bottomRef.value) return
    const rect = bottomRef.value.getBoundingClientRect()
    if (rect.top <= window.innerHeight) {
        handleData(true)
    }
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
    unlockCode.value = localStorage.getItem('unlock-code')
    if (unlockCode.value) {
        await handleData()
    }
    await nextTick()
    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]
            if (entry.isIntersecting && unlockCode.value && !isLoadingMore.value) {
                handleData(true)
            }
        },
        {
            root: null,
            threshold: 0.1,
        }
    )
    if (bottomRef.value) observer.observe(bottomRef.value)
})

onBeforeUnmount(() => {
    if (observer && bottomRef.value) observer.unobserve(bottomRef.value)
    observer = null
})
</script>
