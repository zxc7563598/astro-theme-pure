<template>
    <div class="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4" id="id-check">
        <div class="col-span-full flex items-center gap-2">
            <select v-model="gender"
                class="rounded-lg border px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 flex-shrink-0">
                <option value=0>女</option>
                <option value=1>男</option>
            </select>
            <input v-model="birthday_time" type="datetime-local" step="1"
                class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1" placeholder="出生时间，精确到分钟" />
            <button class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-card transition"
                :disabled="loading" @click="handleQuery">
                {{ loading ? '查询中...' : '查询' }}
            </button>
        </div>
        <div v-if="editShow" class="col-span-full">
            <div class="grid grid-cols-1 gap-3 relative">
                <div>请完整复制下方提示词，发送给任意 AI 聊天工具（如 DeepSeek、豆包、腾讯元宝、ChatGPT）</div>
                <div>等待 AI 生成完整的 JSON 数据</div>
                <textarea name="prompt" placeholder="提示词" v-model="prompt"
                    class="w-full h-52 p-3 rounded-xl border border-border focus:outline-none text-sm bg-transparent"
                    autocomplete="prompt"></textarea>
                <button
                    class="rounded-lg bg-muted px-4 py-2 text-primary text-sm hover:bg-card transition w-96% absolute bottom-3 left-2%"
                    :disabled="loading" @click="copyPrompt">
                    完整复制提示词
                </button>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 gap-3 relative">
                <div>AI 回答完毕后，完整复制AI回答的内容，粘贴到下方</div>
                <textarea name="jsonData" :placeholder="jsonDataPlaceholder" v-model="jsonData"
                    class="w-full h-52 p-3 rounded-xl border border-border focus:outline-none text-sm bg-transparent"
                    autocomplete="jsonData"></textarea>
                <button class="rounded-lg bg-muted px-4 py-2 text-primary text-sm hover:bg-card transition w-full"
                    :disabled="loading" @click="handleDraw">
                    生成人生K线图
                </button>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
        </div>
        <div v-if="resultShow" class="col-span-full">
            <div class="grid grid-cols-3 gap-3 mb-2">
                <button class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-card transition"
                    :disabled="loading" @click="cleanLocalStorage">
                    清空数据
                </button>
                <button class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-card transition"
                    :disabled="loading" @click="showToast({ message: '功能暂未实现，因为着急打游戏去了，这两天就好了' })">
                    导出数据
                </button>
                <button class="rounded-lg bg-muted px-4 py-2 text-muted-foreground text-sm hover:bg-card transition"
                    :disabled="loading" @click="showToast({ message: '功能暂未实现，因为着急打游戏去了，这两天就好了' })">
                    分享截图
                </button>
            </div>

            <div class="w-full">
                <div id="candlestick-chart" class="h-128"></div>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 gap-3">
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">命理总评</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.summary }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.summaryScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.summaryScore }} / 10</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="border-t opacity-10 mt-2 mb-2"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">交易运势</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.crypto }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.cryptoScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.cryptoScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">性格分析</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.personality }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.personalityScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.personalityScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">事业行业</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.industry }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.industryScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.industryScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">发展风水</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.fengShui }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.fengShuiScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.fengShuiScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">财富层级</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.wealth }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.wealthScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.wealthScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">婚姻情感</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.marriage }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.marriageScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.marriageScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">身体健康</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.health }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.healthScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.healthScore }} / 10</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border p-4 flex flex-col gap-4 transition duration-150 hover:shadow-sm">
                    <div class="text-sm font-medium opacity-90">六亲关系</div>
                    <div class="flex flex-col flex-1 gap-3">
                        <div class="text-xs">
                            {{ data.analysis.family }}
                        </div>
                        <div class="border-t opacity-50 mt-auto mb-1"></div>
                        <div class="flex flex-row">
                            <div class="flex-1 rounded-lg relative bg-card">
                                <div :class="progressGrading(data.analysis.familyScore)"
                                    class="rounded-lg absolute left-0 h-full"></div>
                            </div>
                            <div class="text-xs font-bold ml-3">{{ data.analysis.familyScore }} / 10</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick } from 'vue'
import { request } from '@/components/custom/plugins/api'
import { showToast } from '@/components/custom/utils'
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DataZoomComponent,
    MarkLineComponent,
    MarkPointComponent,
} from 'echarts/components';
import type {
    TitleComponentOption,
    TooltipComponentOption,
    GridComponentOption,
    DataZoomComponentOption,
    MarkLineComponentOption,
    MarkPointComponentOption
} from 'echarts/components';
import { CandlestickChart } from 'echarts/charts';
import type { CandlestickSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

interface ApiResponse {
    code: number
    message: string
    data?: any
}

interface ShiShenItem {
    tiangan: string
    dizhi: string
}

interface WuXingBreakdown {
    tiangan: Record<string, string>[]
    dizhi: Record<string, string>[]
    canggan: Record<string, string>[]
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
    age: number
    date: string
}

interface KLinePoint {
    age: number;
    year: number;
    ganZhi: string;
    daYun?: string;
    open: number;
    close: number;
    high: number;
    low: number;
    score: number;
    reason: string;
}

interface AnalysisData {
    bazi: string[];
    summary: string;
    summaryScore: number;
    personality: string;
    personalityScore: number;
    industry: string;
    industryScore: number;
    fengShui: string;
    fengShuiScore: number;
    wealth: string;
    wealthScore: number;
    marriage: string;
    marriageScore: number;
    health: string;
    healthScore: number;
    family: string;
    familyScore: number;
    crypto: string;
    cryptoScore: number;
    cryptoYear: string;
    cryptoStyle: string;
}

interface LifeDestinyResult {
    chartData: KLinePoint[];
    analysis: AnalysisData;
}

const birthday_time = ref('')
const gender = ref(0)
const loading = ref(false)
const editShow = ref(false)
const resultShow = ref(false)
const prompt = ref('')
const jsonData = ref('')
const jsonDataPlaceholder = ref(`将 AI 返回的 JSON 数据粘贴到这里...\n\n例如:\n{\n\tbazi\t: [\t癸未\t, \t壬戌\t, \t丙子\t, \t庚寅\t],\n\tsummary\t: "......",\n\t......\n}`)

const wu_xing_breakdown = reactive<WuXingBreakdown>({} as WuXingBreakdown)
const calculate_start_age = reactive<CalculateStartAge>({
    age: 0,
    date: ''
})
const luck_cycles = reactive<LuckCycles>([])

async function handleQuery() {
    resultShow.value = false
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
            editShow.value = true
            Object.assign(wu_xing_breakdown, data.data.wu_xing_breakdown)
            Object.assign(calculate_start_age, data.data.calculate_start_age)
            Object.assign(luck_cycles, data.data.luck_cycles)
            let is_forward_luck: boolean = data.data?.is_forward_luck ? true : false;
            let luck_pillar: string[] = [];
            luck_cycles.forEach(item => {
                luck_pillar.push(item.luckPillar);
            })
            prompt.value = getPrompt(wu_xing_breakdown, birthday_time.value, gender.value, Math.ceil(calculate_start_age.age), luck_pillar, is_forward_luck)
        } else {
            showToast({ message: data.message })
        }
    }).finally(() => {
        loading.value = false
    })
}

const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '无效日期';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    // 根据格式字符串替换
    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

const getPrompt = (wu_xing_breakdown: WuXingBreakdown, birthday_time: string, gender: number, start_age: number, luck_pillar: string[], is_forward_luck: boolean) => {
    const yearPillar = Object.keys(wu_xing_breakdown['tiangan'][0])[0] + Object.keys(wu_xing_breakdown['dizhi'][0])[0]
    const monthPillar = Object.keys(wu_xing_breakdown['tiangan'][1])[0] + Object.keys(wu_xing_breakdown['dizhi'][1])[0]
    const dayPillar = Object.keys(wu_xing_breakdown['tiangan'][2])[0] + Object.keys(wu_xing_breakdown['dizhi'][2])[0]
    const hourPillar = Object.keys(wu_xing_breakdown['tiangan'][3])[0] + Object.keys(wu_xing_breakdown['dizhi'][3])[0]
    const birthdayTime = formatDate(birthday_time, 'YYYY')
    const genderDescription = gender == 1 ? '男 (乾造)' : '女 (坤造)'
    const yang = ['甲', '丙', '戊', '庚', '壬']
    const yinYang = yang.includes(Object.keys(wu_xing_breakdown['tiangan'][0])[0]) ? '阳' : '阴';
    const direction = is_forward_luck ? '顺行 (Forward)' : '逆行 (Backward)'
    const directionExample = is_forward_luck ? '第一步是【戊申】，第二步则是【己酉】（顺排）' : '第一步是【戊申】，第二步则是【丁未】（逆排）';
    const startAge = start_age;
    return `=== 系统指令 (System Prompt) ===


你是一位八字命理大师，精通加密货币市场周期。根据用户提供的四柱干支和大运信息，生成"人生K线图"数据和命理报告。

**核心规则:**
1. **年龄计算**: 采用虚岁，从 1 岁开始。
2. **K线详批**: 每年的 \`reason\` 字段必须**控制在20-30字以内**，简洁描述吉凶趋势即可。
3. **评分机制**: 所有维度给出 0-10 分。
4. **数据起伏**: 让评分呈现明显波动，体现"牛市"和"熊市"区别，禁止输出平滑直线。

**大运规则:**
- 顺行: 甲子 -> 乙丑 -> 丙寅...
- 逆行: 甲子 -> 癸亥 -> 壬戌...
- 以用户指定的第一步大运为起点，每步管10年。

**关键字段:**
- \`daYun\`: 大运干支 (10年不变)
- \`ganZhi\`: 流年干支 (每年一变)

**输出JSON结构:**

{
  "bazi": ["年柱", "月柱", "日柱", "时柱"],
  "summary": "命理总评（100字）",
  "summaryScore": 8,
  "personality": "性格分析（80字）",
  "personalityScore": 8,
  "industry": "事业分析（80字）",
  "industryScore": 7,
  "fengShui": "风水建议：方位、地理环境、开运建议（80字）",
  "fengShuiScore": 8,
  "wealth": "财富分析（80字）",
  "wealthScore": 9,
  "marriage": "婚姻分析（80字）",
  "marriageScore": 6,
  "health": "健康分析（60字）",
  "healthScore": 5,
  "family": "六亲分析（60字）",
  "familyScore": 7,
  "crypto": "币圈分析（60字）",
  "cryptoScore": 8,
  "cryptoYear": "暴富流年",
  "cryptoStyle": "链上Alpha/高倍合约/现货定投",
  "chartPoints": [
    {"age":1,"year":1990,"daYun":"童限","ganZhi":"庚午","open":50,"close":55,"high":60,"low":45,"score":55,"reason":"开局平稳，家庭呵护"},
    ... (共100条，reason控制在20-30字)
  ]
}

**币圈分析逻辑:**
- 偏财旺、身强 -> "链上Alpha"
- 七杀旺、胆大 -> "高倍合约"
- 正财旺、稳健 -> "现货定投"


=== 用户提示词 (User Prompt) ===

请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：` + genderDescription + `
姓名：未提供
出生年份：` + birthdayTime + `年 (阳历)

【八字四柱】
年柱：` + yearPillar + ` (天干属性：` + yinYang + `)
月柱：` + monthPillar + `
日柱：` + dayPillar + `
时柱：` + hourPillar + `

【大运核心参数】
1. 起运年龄：` + startAge + ` 岁 (虚岁)。
2. 第一步大运：` + luck_pillar[0] + `。
3. **排序方向**：` + direction + `。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【` + luck_pillar[0] + `】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（` + direction + `），推算出接下来的 9 步大运。
   例如：` + directionExample + `
3. **填充 JSON**：
   - Age 1 到 ` + (startAge) + `: daYun = "童限"
   - Age ` + (startAge + 1) + ` 到 ` + (startAge + 10) + `: daYun = [第1步大运: ` + luck_pillar[0] + `]
   - Age ` + (startAge + 11) + ` 到 ` + (startAge + 20) + `: daYun = [第2步大运: ` + luck_pillar[1] + `]
   - ...以此类推直到 100 岁。

【特别警告】
- **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
- **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。

任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据、不要省略任何内容。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告（包含性格分析、币圈交易分析、发展风水分析）。

【最终约束】
- 本任务必须一次性完整输出 age 1–100 的 JSON
- 不允许任何形式的分段、解释、注释或说明
- 不允许出现 markdown、//、/* */ 或自然语言提示
- 不允许出现“篇幅限制”“后续”“下一条”等任何中断暗示
- 若你判断无法完整输出，请直接返回空字符串
- 输出必须是可直接解析的合法 JSON`
}

const copyPrompt = () => {
    if (!prompt.value) return
    navigator.clipboard.writeText(prompt.value)
        .then(() => {
            showToast({ message: '提示词已复制到剪贴板' })
        })
        .catch(() => {
            showToast({ message: '复制失败，请手动复制' })
        })
}

let isFormatting = false
watch(jsonData, (val) => {
    if (isFormatting) return
    try {
        const parsed = JSON.parse(val)
        isFormatting = true
        jsonData.value = JSON.stringify(parsed, null, 2)
        isFormatting = false
        localStorage.setItem('life-analysis', jsonData.value)
        localStorage.setItem('life-analysis-birthday-time', birthday_time.value)
        localStorage.setItem('life-analysis-gender', String(gender.value))
    } catch { }
})


const data = reactive<LifeDestinyResult>({
    chartData: [],
    analysis: <AnalysisData>{}
})
const handleDraw = async () => {
    try {
        let jsonDecode = JSON.parse(jsonData.value);
        if (!jsonDecode.chartPoints || !Array.isArray(jsonDecode.chartPoints)) {
            showToast({ message: '数据格式不正确：缺少 chartPoints 数组' })
        }
        if (jsonDecode.chartPoints.length < 10) {
            showToast({ message: '数据不完整：chartPoints 数量太少' })
        }
        Object.assign(data, {
            chartData: jsonDecode.chartPoints,
            analysis: {
                bazi: jsonDecode.bazi || [],
                summary: jsonDecode.summary || "无摘要",
                summaryScore: jsonDecode.summaryScore || 5,
                personality: jsonDecode.personality || "无性格分析",
                personalityScore: jsonDecode.personalityScore || 5,
                industry: jsonDecode.industry || "无",
                industryScore: jsonDecode.industryScore || 5,
                fengShui: jsonDecode.fengShui || "建议多亲近自然，保持心境平和。",
                fengShuiScore: jsonDecode.fengShuiScore || 5,
                wealth: jsonDecode.wealth || "无",
                wealthScore: jsonDecode.wealthScore || 5,
                marriage: jsonDecode.marriage || "无",
                marriageScore: jsonDecode.marriageScore || 5,
                health: jsonDecode.health || "无",
                healthScore: jsonDecode.healthScore || 5,
                family: jsonDecode.family || "无",
                familyScore: jsonDecode.familyScore || 5,
                crypto: jsonDecode.crypto || "暂无交易分析",
                cryptoScore: jsonDecode.cryptoScore || 5,
                cryptoYear: jsonDecode.cryptoYear || "待定",
                cryptoStyle: jsonDecode.cryptoStyle || "现货定投",
            },
        })
        editShow.value = false;
        resultShow.value = true;
        await nextTick()
        showCharts()
    } catch {
        showToast({ message: '解析失败：数据格式不正确' })
    }
}

const progressGrading = (score: number) => {
    switch (String(score)) {
        case '1':
            return 'w-10% bg-#db2627'
        case '2':
            return 'w-20% bg-#db2627'
        case '3':
            return 'w-30% bg-#ea570c'
        case '4':
            return 'w-40% bg-#ea570c'
        case '5':
            return 'w-50% bg-#a16108'
        case '6':
            return 'w-60% bg-#a16108'
        case '7':
            return 'w-70% bg-#4f47e6'
        case '8':
            return 'w-80% bg-#4f47e6'
        case '9':
            return 'w-90% bg-#19a249'
        case '10':
            return 'w-100% bg-#19a249'
    }
}

// 表格制作
type EChartsOption = echarts.ComposeOption<
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | DataZoomComponentOption
    | MarkLineComponentOption
    | MarkPointComponentOption
    | CandlestickSeriesOption
>;

// Each item: open，close，lowest，highest
const splitData = (chartData: KLinePoint[]) => {
    const categoryData = [];
    const values = [];
    for (var i = 0; i < chartData.length; i++) {
        categoryData.push(chartData[i].year);
        values.push([chartData[i].open, chartData[i].close, chartData[i].low, chartData[i].high]);
    }
    return {
        categoryData: categoryData,
        values: values
    };
}
const showCharts = () => {
    echarts.use([
        TitleComponent,
        TooltipComponent,
        GridComponent,
        DataZoomComponent,
        MarkLineComponent,
        MarkPointComponent,
        CandlestickChart,
        CanvasRenderer
    ]);
    var chartDom = document.getElementById('candlestick-chart')!;
    var myChart = echarts.init(chartDom);
    var option: EChartsOption;
    const upColor = '#ec0000';
    const upBorderColor = '#8A0000';
    const downColor = '#00da3c';
    const downBorderColor = '#008F28';
    const charts = splitData(data.chartData);
    const startIndex = 0
    const startValue = charts.values[0][1]
    const endIndex = charts.values.length - 1
    const endValue = charts.values[endIndex][1]
    let peakValue = -Infinity
    let peakIndex = 0
    charts.values.forEach((item, index) => {
        if (item[3] > peakValue) {
            peakValue = item[3]
            peakIndex = index
        }
    })
    option = {
        tooltip: {
            confine: true,
            trigger: 'axis',
            renderMode: 'html',
            backgroundColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            extraCssText: 'box-shadow:none;',
            axisPointer: {
                type: 'cross'
            },
            formatter: (params) => {
                if (!Array.isArray(params)) return ''
                const p = params.find(() => true) as {
                    dataIndex: number
                } | undefined
                if (!p) return ''
                const tooltipData = data.chartData[p.dataIndex];
                const luck = tooltipData.open > tooltipData.close ? '凶' : '吉';
                const luckClass = tooltipData.open > tooltipData.close ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
                const score = Math.ceil(tooltipData.score / 10);
                const scoreClass = progressGrading(score)
                return `
                <div class="flex flex-col gap-3 p-3 rounded-lg text-sm shadow-lg min-w-64 bg-white dark:bg-dark-6">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex flex-col">
                        <div class="text-base font-semibold">
                            ${tooltipData.year}${tooltipData.ganZhi}年
                            <span class="ml-1 text-sm">（${tooltipData.age}岁）</span>
                        </div>
                        <div class="mt-0.5 text-xs">
                            大运：${tooltipData.daYun}
                        </div>
                        </div>
                        <div class="x-2 py-0.5 rounded-full text-xs font-medium px-2 ${luckClass}">
                            ${luck}
                        </div>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        <div class="flex flex-col items-center rounded-md px-2 py-1.5">
                        <div class="text-xs">开盘</div>
                            <div class="mt-0.5 font-mono text-sm">
                                ${tooltipData.open}
                            </div>
                        </div>
                        <div class="flex flex-col items-center rounded-md px-2 py-1.5">
                        <div class="text-xs">收盘</div>
                            <div class="mt-0.5 font-mono text-sm">
                                ${tooltipData.close}
                            </div>
                        </div>
                        <div class="flex flex-col items-center rounded-md px-2 py-1.5">
                        <div class="text-xs">最高</div>
                            <div class="mt-0.5 font-mono text-sm text-red-400">
                                ${tooltipData.high}
                            </div>
                        </div>
                        <div class="flex flex-col items-center rounded-md px-2 py-1.5">
                        <div class="text-xs">最低</div>
                            <div class="mt-0.5 font-mono text-sm text-green-400">
                                ${tooltipData.low}
                            </div>
                        </div>
                    </div>
                    <div class="text-xs leading-relaxed">
                        ${tooltipData.reason}
                    </div>
                    <div class="flex flex-row">
                        <div class="flex-1 rounded-lg relative bg-card">
                            <div class="rounded-lg absolute left-0 h-full ${scoreClass}"></div>
                        </div>
                        <div class="text-xs font-bold ml-3">${tooltipData.score} / 100</div>
                    </div>
                </div>
                `
            }
        },
        grid: {
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '17%'
        },
        xAxis: {
            type: 'category',
            data: charts.categoryData,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax'
        },
        yAxis: {
            scale: true,
            splitArea: {
                show: false
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(148,163,184,0.2)'
                }
            }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                top: '90%',
                start: 0,
                end: 100
            }
        ],
        series: [
            {
                name: '年K',
                type: 'candlestick',
                data: charts.values,

                itemStyle: {
                    color: upColor,
                    color0: downColor,
                    borderColor: upBorderColor,
                    borderColor0: downBorderColor
                },
                markPoint: {
                    data: [
                        {
                            name: '最高点',
                            type: 'max',
                            valueDim: 'highest'
                        },
                        {
                            name: '最低点',
                            type: 'min',
                            valueDim: 'lowest'
                        },
                        {
                            name: '收盘平均值',
                            type: 'average',
                            valueDim: 'close'
                        }
                    ]
                },
                markLine: {
                    symbol: ['circle', 'circle'],
                    symbolSize: 10,
                    label: { show: false },
                    emphasis: { label: { show: false } },
                    data: [
                        [
                            {
                                name: '上升期',
                                coord: [startIndex, startValue],
                                lineStyle: {
                                    type: 'solid',
                                    width: 2
                                }
                            },
                            {
                                coord: [peakIndex, peakValue]
                            }
                        ],
                        [
                            {
                                name: '回落期',
                                coord: [peakIndex, peakValue],
                                lineStyle: {
                                    type: 'dashed',
                                    width: 2
                                }
                            },
                            {
                                coord: [endIndex, endValue]
                            }
                        ],
                        {
                            name: '最高点',
                            type: 'max',
                            valueDim: 'close'
                        },
                        {
                            name: '最低点',
                            type: 'min',
                            valueDim: 'close'
                        },
                        {
                            name: '平均线',
                            type: 'average',
                            valueDim: 'close'
                        },
                    ]
                }
            }
        ]
    };
    option && myChart.setOption(option);
}

if (localStorage.getItem('life-analysis')) {
    jsonData.value = localStorage.getItem('life-analysis') ?? ''
    birthday_time.value = localStorage.getItem('life-analysis-birthday-time') ?? ''
    gender.value = Number(localStorage.getItem('life-analysis-birthday-gender')) ?? 0
    handleDraw()
}

const cleanLocalStorage = () => {
    localStorage.removeItem('life-analysis')
    localStorage.removeItem('life-analysis-birthday-time')
    localStorage.removeItem('life-analysis-birthday-gender')
    birthday_time.value = '';
    jsonData.value = '';
    editShow.value = false;
    resultShow.value = false;
}
</script>
