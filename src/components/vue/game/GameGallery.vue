<template>
    <div>
        <section :class="grid">
            <article class='flex flex-col group rounded-xl border border-neutral-200/70 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md' v-for="(item, index) in list" :key="index">
                <div class='relative aspect-1 rounded-t-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800'>
                    <a :href=item.link target='_blank' class="no-underline">
                        <img :src="baseurl + item.poster_path + '?x-oss-process=image/resize,w_400'" :alt=item.name loading='lazy' decoding='async' class='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105' />
                    </a>
                </div>
                <div class="relative px-3 pt-2 pb-3 space-y-1.5 rounded-b-xl overflow-hidden flex-1" :class="item.platinum ? 'bg-white/70 dark:bg-neutral-900/70' : 'bg-white/60 dark:bg-neutral-900/60'">
                    <div class='absolute inset-0 pointer-events-none' v-if="item.platinum">
                        <div class='absolute inset-0 bg-[linear-gradient(135deg,rgba(255,215,0,0.08)_0%,rgba(255,200,0,0.04)_40%,transparent_70%)]'></div>
                        <div class='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,0.15),transparent_60%)]'></div>
                    </div>
                    <a :href=item.link target='_blank' class="no-underline">
                        <div class='relative text-xs text-neutral-500 dark:text-neutral-400'>{{ item.date }}</div>
                        <h3 class='relative text-sm font-medium leading-snug mt-1 mb-0'>{{ item.name }}</h3>
                        <div class='relative text-[11px] text-amber-500 dark:text-amber-400 tracking-wide' v-if="item.platinum">
                            🏆 {{ item.platinum_date }}
                        </div>
                    </a>
                </div>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
interface Item {
    name: string
    poster_path: string
    date: string
    platinum: boolean
    platinum_date: string
    link: string
}

const props = defineProps<{
    list: Item[]
    baseurl: string
    grid?: string
}>()

</script>