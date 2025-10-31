<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <select v-model="gender"
                class="rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 flex-shrink-0">
                <option value=0>女</option>
                <option value=1>男</option>
            </select>
            <input v-model="birthday_time" type="datetime-local" step="1"
                class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" placeholder="出生时间，精确到分钟" />
            <button
                class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-primary-foreground transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="show" class="col-span-full">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div v-for="(label, index) in pillars" :key="index"
                    class="rounded-xl border p-4 flex flex-col gap-3 transition duration-150 hover:shadow-sm bg-card">
                    <div class="text-sm font-medium opacity-90">{{ label }}</div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-1">天干</div>
                        <div class="flex items-center gap-2">
                            <span class="text-lg font-semibold">
                                {{ Object.keys(wu_xing_breakdown.tiangan[index])[0] }}
                            </span>
                            <span class="text-xs rounded px-2 py-0.5"
                                :class="getWuXingClass(Object.values(wu_xing_breakdown.tiangan[index])[0])">
                                {{ Object.values(wu_xing_breakdown.tiangan[index])[0] }}
                            </span>
                            <span class="text-xs rounded px-2 py-0.5 bg-muted">
                                {{ shi_shen_distribution[index].tiangan }}
                            </span>
                        </div>
                    </div>
                    <div class="border-t opacity-10"></div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-1">地支</div>
                        <div class="flex items-center gap-2">
                            <span class="text-lg font-semibold">
                                {{ Object.keys(wu_xing_breakdown.dizhi[index])[0] }}
                            </span>
                            <span class="text-xs rounded px-2 py-0.5"
                                :class="getWuXingClass(Object.values(wu_xing_breakdown.dizhi[index])[0])">
                                {{ Object.values(wu_xing_breakdown.dizhi[index])[0] }}
                            </span>
                            <span class="text-xs rounded px-2 py-0.5 bg-muted">
                                {{ shi_shen_distribution[index].dizhi }}
                            </span>
                        </div>
                    </div>
                    <div class="border-t opacity-10"></div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-1">藏干</div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(xing, gan) in wu_xing_breakdown.canggan[index]" :key="gan"
                                class="flex items-center gap-1 text-sm">
                                <span class="font-medium">{{ gan }}</span>
                                <span class="text-xs rounded px-1.5 py-0.5" :class="getWuXingClass(xing)">
                                    {{ xing }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm bg-card">
                    <div class="text-sm font-medium opacity-90">五行统计（不含藏干）</div>
                    <div class="flex flex-wrap gap-3">
                        <div v-for="(count, xing) in wu_xing_simple" :key="xing" class="flex items-center gap-2">
                            <span class="text-lg font-semibold">{{ xing }}</span>
                            <span class="text-xs rounded px-2 py-0.5" :class="getWuXingClass(xing)">
                                {{ count }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm bg-card">
                    <div class="text-sm font-medium opacity-90">五行统计（包含藏干）</div>
                    <div class="flex flex-wrap gap-3">
                        <div v-for="(count, xing) in wu_xing_full" :key="xing" class="flex items-center gap-2">
                            <span class="text-lg font-semibold">{{ xing }}</span>
                            <span class="text-xs rounded px-2 py-0.5" :class="getWuXingClass(xing)">
                                {{ count }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 gap-3">
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm bg-card">
                    <div class="text-sm font-medium opacity-90">十神分析</div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-2">十神频率</div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(count, name) in interpret_shi_shen.frequency" :key="name"
                                class="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/10 text-sm">
                                <span class="font-medium">{{ name }}</span>
                                <span class="text-xs rounded px-1.5 py-0.5 bg-muted/20">{{ count }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="border-t opacity-10"></div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-2">大类统计</div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(count, name) in interpret_shi_shen.statistics" :key="name"
                                class="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/10 text-sm">
                                <span class="font-medium">{{ name }}</span>
                                <span class="text-xs rounded px-1.5 py-0.5 bg-muted/20">{{ count }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="border-t opacity-10"></div>
                    <div>
                        <div class="text-xs text-muted-foreground mb-2">分析</div>
                        <ul class="list-disc list-inside space-y-1 text-sm">
                            <li v-for="(item, idx) in interpret_shi_shen.analysis" :key="idx">
                                {{ item }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 gap-3">
                <div class="rounded-xl border p-4 flex flex-col gap-2 transition duration-150 hover:shadow-sm bg-card">
                    <div class="text-sm font-medium opacity-90">大运排盘</div>
                    <div>此人会在 <b>{{calculate_start_age.date}}</b> 迎来第一次大运，此时的年龄为 <b>{{calculate_start_age.age}}</b></div>
                    <ul class="ps-0 mt-0 sm:ps-2">
                        <li v-for="(item, index) in luck_cycles" :key="item.step"
                            class="group relative flex list-none gap-x-3 rounded-full ps-0 sm:gap-x-2">
                            <span class="z-10 my-2 ms-2 h-3 w-3 min-w-3 rounded-full border-2 border-muted-foreground transition-transform group-hover:scale-125" />
                            <span class="absolute start-[12px] top-[20px] w-1 bg-border"
                                :style="{ height: 'calc(100% - 4px)' }" />
                            <div class="flex flex-col gap-2 max-sm:flex-col cursor-pointer">
                                <samp
                                    class="w-fit grow-0 rounded-md py-2 text-sm max-sm:bg-primary-foreground max-sm:px-2 sm:min-w-[82px] sm:text-right">
                                    {{ item.startDate }}
                                </samp>
                                <div class="flex flex-col gap-2">
                                    <table class="w-full border-none text-sm my-0">
                                        <tbody>
                                            <tr class="hover:bg-secondary transition border-none">
                                                <td class="px-3 py-2 font-medium">大运柱</td>
                                                <td class="px-3 py-2">{{ item.luckPillar }}</td>
                                            </tr>
                                            <tr class="hover:bg-secondary transition border-none">
                                                <td class="px-3 py-2 font-medium">藏干</td>
                                                <td class="px-3 py-2">{{ item.cangGan }}</td>
                                            </tr>
                                            <tr class="hover:bg-secondary transition border-none">
                                                <td class="px-3 py-2 font-medium">五行</td>
                                                <td class="px-3 py-2">
                                                    <span class="text-xs rounded px-2 py-0.5 mr-1"
                                                        :class="getWuXingClass(item.wuXing.tiangan)">
                                                        {{ item.wuXing.tiangan }}
                                                    </span>
                                                    <span class="text-xs rounded px-2 py-0.5 mr-1"
                                                        :class="getWuXingClass(item.wuXing.dizhi)">
                                                        {{ item.wuXing.dizhi }}
                                                    </span>
                                                    <span v-for="x in item.wuXing.canggan.split(',')" :key="x"
                                                        class="text-xs rounded px-2 py-0.5 mr-1"
                                                        :class="getWuXingClass(x)">
                                                        {{ x }}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr class="hover:bg-secondary transition border-none">
                                                <td class="px-3 py-2 font-medium">十神</td>
                                                <td class="px-3 py-2">
                                                    <span
                                                        class="text-xs rounded px-2 py-0.5 text-destructive bg-primary-foreground">
                                                        {{ item.shiShen.tiangan }}
                                                    </span>
                                                    <span v-for="x in item.shiShen.dizhi.split(',')" :key="x"
                                                        class="text-xs rounded px-2 py-0.5 bg-muted ml-1">{{ x }}</span>
                                                </td>
                                            </tr>
                                            <tr class="hover:bg-secondary transition border-none">
                                                <td class="px-3 py-2 font-medium align-top">解读方向</td>
                                                <td class="px-3 py-2">
                                                    <div class="text-primary">{{ item.shiShen.tiangan }}:
                                                        {{ getInterpretationDirection(item.shiShen.tiangan) }}</div>
                                                    <div v-for="x in item.shiShen.dizhi.split(',')" :key="x"
                                                        class="mt-1">
                                                        {{ x }}: {{ getInterpretationDirection(x) }}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { request } from '@/plugins/api'
import { showToast } from '@/plugins/toast'

interface ApiResponse {
    code: number
    message: string
    data?: any
}

interface WuXing {
    金: number
    木: number
    水: number
    火: number
    土: number
}

interface ShiShenItem {
    tiangan: string
    dizhi: string
}

type ShiShenDistribution = ShiShenItem[]

interface WuXingBreakdown {
    tiangan: Record<string, string>[]
    dizhi: Record<string, string>[]
    canggan: Record<string, string>[]
}

interface InterpretShiShen {
    frequency: Record<string, number>
    statistics: Record<string, number>
    analysis: string[]
}

interface WuXingItem {
    tiangan: string
    dizhi: string
    canggan: string
}

interface LuckCycleItem {
    step: number
    luckPillar: string
    startAge: number
    startDate: string
    cangGan: string
    wuXing: WuXingItem
    shiShen: ShiShenItem
}

type LuckCycles = LuckCycleItem[]

interface CalculateStartAge {
    age:number
    date:string
}

const birthday_time = ref('')
const gender = ref(0)
const loading = ref(false)
const show = ref(false)

const pillars = ['年柱', '月柱', '日柱', '时柱']
const wu_xing_breakdown = reactive<WuXingBreakdown>({} as WuXingBreakdown)
const wu_xing_simple = reactive<WuXing>({
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0
})
const wu_xing_full = reactive<WuXing>({
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0
})
const shi_shen_distribution = reactive<ShiShenDistribution>([])
const interpret_shi_shen = reactive<InterpretShiShen>({
    frequency: {},
    statistics: {},
    analysis: []
})
const calculate_start_age = reactive<CalculateStartAge>({
    age:0,
    date:''
})
const luck_cycles = reactive<LuckCycles>([])

async function handleQuery() {
    if (!birthday_time.value.trim()) {
        showToast({ message: '请输入日期' })
        return
    }
    loading.value = true
    request<ApiResponse>('/fortune-analyzer/send', {
        birthday_time: birthday_time.value,
        gender: gender.value
    }).then((data) => {
        if (data.code == 0) {
            show.value = true
            console.log(data.data)
            Object.assign(wu_xing_breakdown, data.data.wu_xing_breakdown)
            Object.assign(wu_xing_simple, data.data.wu_xing_simple)
            Object.assign(wu_xing_full, data.data.wu_xing_full)
            Object.assign(shi_shen_distribution, data.data.shi_shen_distribution)
            Object.assign(interpret_shi_shen, data.data.interpret_shi_shen)
            Object.assign(calculate_start_age, data.data.calculate_start_age)
            Object.assign(luck_cycles, data.data.luck_cycles)
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}

const getWuXingClass = (xing: string) => {
    switch (xing) {
        case '金':
            return 'bg-[hsl(45,30%,90%)] text-[hsl(45,50%,40%)] dark:bg-[hsl(45,20%,15%)] dark:text-[hsl(45,50%,70%)]'
        case '木':
            return 'bg-[hsl(120,30%,90%)] text-[hsl(120,50%,40%)] dark:bg-[hsl(120,20%,15%)] dark:text-[hsl(120,50%,70%)]'
        case '水':
            return 'bg-[hsl(200,30%,90%)] text-[hsl(200,50%,40%)] dark:bg-[hsl(200,20%,15%)] dark:text-[hsl(200,50%,70%)]'
        case '火':
            return 'bg-[hsl(0,30%,90%)] text-[hsl(0,50%,40%)] dark:bg-[hsl(0,20%,15%)] dark:text-[hsl(0,50%,70%)]'
        case '土':
            return 'bg-[hsl(30,30%,90%)] text-[hsl(30,50%,40%)] dark:bg-[hsl(30,20%,15%)] dark:text-[hsl(30,50%,70%)]'
        default:
            return 'bg-[hsl(0,0%,90%)] text-[hsl(0,0%,40%)] dark:bg-[hsl(0,0%,15%)] dark:text-[hsl(0,0%,70%)]'
    }
}

const getInterpretationDirection = (shishen: string) => {
    switch (shishen) {
        case '正官':
            return '规矩、责任、约束、社会地位';
            break;
        case '七杀':
            return '权力、挑战、压力、决断力';
            break;
        case '正印':
            return '学识、贵人、帮助、保护';
            break;
        case '偏印':
            return '灵活、变化、机缘、依赖';
            break;
        case '比肩':
            return '竞争、独立、兄弟姐妹、固执';
            break;
        case '劫财':
            return '竞争、独立、争夺';
            break;
        case '正财':
            return '财富、收入、理财能力';
            break;
        case '偏财':
            return '偶然财、投资、偏门收入';
            break;
        case '食神':
            return '才华、创造力、表达能力';
            break;
        case '伤官':
            return '才华张扬、突破、叛逆';
            break;
    }
}
</script>
