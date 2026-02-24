<template>
    <div>
        <section :class="grid">
            <article v-for="item in list" :key="item.id" @click="open(item)" class="group rounded-xl
               border border-neutral-200/70
               dark:border-neutral-700
               bg-white/60 dark:bg-neutral-900/60
               backdrop-blur-sm
               transition-all duration-300
               hover:shadow-md
               hover:-translate-y-1
               cursor-pointer">
                <div class="relative aspect-[2/3] rounded-t-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img :src="baseurl + item.poster_path + '?x-oss-process=image/resize,w_400'" :alt="item.title" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>

                <div class="px-3 pt-2 pb-3 space-y-2">
                    <div class="text-xs text-neutral-500 dark:text-neutral-400">
                        {{ item.release_date }}
                    </div>
                    <h3 class="text-sm font-medium leading-snug">
                        {{ item.title }}
                    </h3>
                </div>
            </article>
        </section>

        <Teleport to="body">
            <Transition name="fade">
                <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />
                    <div class="relative z-10 w-[94%] max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
                        <div class="absolute inset-0 bg-cover bg-center scale-105" :style="{backgroundImage: `url(${baseurl + selected.backdrop_path})`}" />
                        <div class="absolute inset-0 bg-black/40" />
                        <div class="relative bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-8 md:p-10 space-y-6">
                            <div class="space-y-1">
                                <h2 class="text-2xl font-semibold">
                                    {{ selected.title }}
                                </h2>
                                <div class="text-sm text-neutral-500 dark:text-neutral-400">
                                    {{ selected.original_title }}
                                </div>
                            </div>
                            <div class="mt-3 mb-3">
                                <div class="flex items-center justify-between text-xs text-neutral-500">
                                    <span>评分</span>
                                    <span class="font-medium text-neutral-700 dark:text-neutral-300">
                                        {{ Math.round(selected.vote_average * 10) }} / 100
                                    </span>
                                </div>
                                <div class="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-1">
                                    <div class="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-500" :style="{ width: (selected.vote_average * 10) + '%' }" />
                                </div>
                            </div>
                            <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                {{ selected.overview }}
                            </p>
                            <button @click="close" class="mt-4 px-4 py-2 rounded-lg text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-80 transition">
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

interface Item {
    id: number // id
    title: string // 标题
    original_title: string // 原标题
    overview: string // 简介
    poster_path: string // 海报路径
    backdrop_path: string // 背景图路径
    release_date: string // 发布日期
    vote_average: number // 评分
}

const props = defineProps<{
    list: Item[]
    baseurl: string
    grid?: string
}>()

const selected = ref<Item | null>(null)

function open(item: Item) {
    selected.value = item
}

function close() {
    selected.value = null
}

watch(selected, (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
})

function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
}

onMounted(() => {
    window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKey)
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
