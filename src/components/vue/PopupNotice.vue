<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="visible" class="popup-card">
        <div class="popup-header">
          <h2 class="popup-title">{{ title }}</h2>
          <button class="popup-close" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="popup-body">
          <!-- 内容通过默认插槽传入，未传时显示以下占位内容 -->
          <slot>
            <p>
              不想要购买服务器，或者不需要积分商城，只需要机器人原本功能的朋友们可以前往这个项目：
              <a href="https://github.com/zxc7563598/bilibili-live-assistant" target="_blank" rel="noopener">bilibili-live-assistant</a>
            </p>
            <p>该项目支持完全本地化运行，下载对应系统版本，双击运行即可使用。</p>
            <p>如果好用，辛苦点一下项目右上角的 star，新项目十分需要</p>
            <!-- <hr />
            <p>
              <strong>额外：</strong>关于这个 bilibili-live-assistant 我还需要找一位<strong>愿意长期直播、愿意帮忙测试的主播朋友</strong>，让我可以在真实直播环境里持续发现问题、测试功能。
            </p>
            <h2>我可以提供什么？</h2>
            <ul>
              <li>
                <strong>一台 24 小时运行的服务器</strong>
                <ul>
                  <li>我来负责部署和维护</li>
                  <li>全程监听你的直播间，我不会进行干涉</li>
                  <li>不需要你自己折腾服务器和部署环境</li>
                </ul>
              </li>
              <li>
                <strong>最新的未发布版本</strong>
                <ul>
                  <li>新功能会优先给你体验</li>
                  <li>遇到问题可以第一时间修复</li>
                </ul>
              </li>
              <li>
                <strong>功能需求优先沟通</strong>
                <ul>
                  <li>如果你有一些比较有建设性的功能想法，可以优先考虑实现</li>
                  <li>毕竟这个机器人本身也是根据实际使用场景不断完善的</li>
                </ul>
              </li>
            </ul>
            <h2>希望你能做到什么？</h2>
            <p>其实要求也不复杂，主要是希望能有一个<strong>真实、持续的使用场景</strong>。</p>
            <h3>1. 准备一个单独的机器人账号</h3>
            <p>最好可以单独注册一个 B 站账号，用这个账号专门登录机器人。</p>
            <p>因为机器人需要长期保持登录状态，而同一个账号如果在不同地点频繁登录，比较容易出现登录失效等情况。</p>
            <p>所以如果愿意单独准备一个测试账号，会是最理想的情况。</p>
            <h3>2. 尽可能多地使用机器人功能</h3>
            <p>不需要你为了测试去刻意折腾，但如果你本身对机器人的功能有需求，那就更好了。</p>
            <p><strong>功能用得越多，我越容易发现真实使用中的问题。</strong></p>
            <h3>3. 你最好是主播且自用</h3>
            <p>也不是说你作为观众想要给自己的主播整这么一个就不可以。</p>
            <p>主要是万一哪天你不粉了，或者是主播的直播情况你也保证不了人家万一不想用了一类的事情处理起来会很麻烦。</p>
            <p>作为粉丝你完全可以下载正式版本自己用而不是放到我这里</p>
            <h3>4. 希望有长期直播的计划</h3>
            <p>这个比较重要。</p>
            <p>不是要求你每天直播 8 小时，更不是来“坐班”的。</p>
            <p>只是希望你有比较稳定的直播计划，<strong>至少一周能播 3 次左右</strong>，这样我才能持续获得真实的运行数据。</p>
            <p>如果长期不直播，那这个测试其实也很难进行，我可能还得重新找下一位测试主播。</p>
            <h2>目前已有关于未来的计划</h2>
            <ul>
              <li>
                <strong>完善机器人相关</strong>
                <ul>
                  <li>优化项目细节</li>
                  <li>添加有用且必要的占位变量</li>
                  <li>完善用户星光/积分增加机制</li>
                  <li>例如完善自动回复关键词匹配规则(全部关键词命中/任意关键词命中)</li>
                </ul>
              </li>
              <li>
                <strong>完善信息展示</strong>
                <ul>
                  <li>弹幕信息展示/汇总</li>
                  <li>礼物信息展示/汇总</li>
                  <li>分析类相关报表(用户分析/收益分析/盲盒分析等)</li>
                </ul>
              </li>
              <li>
                <strong>积分商城落地</strong>
                <ul>
                  <li>增加积分商城，为用户提供消费星光/积分的渠道</li>
                  <li>....</li>
                  <li>....</li>
                </ul>
              </li>
              <li>
                <strong>以及未来更多...</strong>
                <ul>
                  <li>....</li>
                  <li>....</li>
                  <li>....</li>
                </ul>
              </li>
            </ul>
            <h2>最后</h2>
            <p>这不是一份工作，也没有什么复杂的考核。</p>
            <p>我只是想找一位<strong>愿意长期使用这个机器人的主播</strong>，我负责服务器、部署和后续维护，你正常直播、正常使用，遇到问题告诉我就行（甚至大部分问题不用反馈，我自己会找到，我忽略掉的反馈给我就行）</p>
            <p>如果你觉得这个事情挺有意思，也愿意一起把这个机器人慢慢做得更好，<a href="/projects#direct-contact" target="_blank" rel="noopener">欢迎通过微信与我联系</a>。</p>
            <p>另外：我只需要一位这样的朋友，找到合适的朋友之后，这条招募信息就会撤掉。</p>
            <p>如果你刚好看到这里，并且觉得自己比较合适，欢迎来找我。</p> -->
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  cookieKey?: string
  duration?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  cookieKey: 'danmusuite-popup-dismissed',
  duration: 20,
  title: '关于本项目'
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const visible = ref(false)

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/`
}

function close() {
  // 记录 cookie，max-age 到期后浏览器自动删除，下一次访问才会再次弹出
  setCookie(props.cookieKey, String(Date.now()), props.duration)
  visible.value = false
  emit('close')
}

onMounted(() => {
  // 没有 cookie 时才展示，避免关闭后刷新又立刻弹出
  if (!getCookie(props.cookieKey)) {
    visible.value = true
  }
})
</script>

<style scoped>
/*
 * 非阻断式浮动卡片：只占右下角一块，不盖住、不锁定页面其余内容。
 * 位置 / 尺寸 / 配色都可自行改。
 * 主题的 CSS 变量是 HSL 三元组（如 --foreground: 150 10% 15%），需用 hsl(var(--x)) 包裹。
 */
.popup-card {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: min(32rem, calc(100vw - 2rem));
  max-height: min(80vh, 40rem);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.popup-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid hsl(var(--border));
}

.popup-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.popup-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  transition: background-color 0.15s ease, color 0.15s ease;
}
.popup-close:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.popup-body {
  min-height: 0;
  padding: 1rem 1.25rem 1.25rem;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.75;
  color: hsl(var(--muted-foreground));
}

.popup-body p {
  margin: 0 0 0.75rem;
}
.popup-body p:last-child {
  margin-bottom: 0;
}

.popup-body h2 {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}
.popup-body h2:first-child {
  margin-top: 0;
}

.popup-body h3 {
  margin: 1.25rem 0 0.375rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.popup-body a {
  color: hsl(var(--primary));
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: hsl(var(--primary) / 0.4);
}
.popup-body a:hover {
  text-decoration-color: hsl(var(--primary));
}

.popup-body ul {
  margin: 0.25rem 0 0.875rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.popup-body ul ul {
  margin-top: 0.375rem;
  list-style: circle;
}
.popup-body li {
  margin: 0.25rem 0;
}
.popup-body li > ul {
  margin-bottom: 0;
}
/* 列表项的粗体标签（如「一台 24 小时运行的服务器」）独占一行 */
.popup-body li > strong {
  display: block;
  margin-bottom: 0.25rem;
  color: hsl(var(--foreground));
  font-weight: 600;
}

.popup-body strong {
  color: hsl(var(--foreground));
  font-weight: 600;
}

.popup-body hr {
  border: none;
  border-top: 1px dashed hsl(var(--border));
  margin: 1rem 0;
}

/* 过渡动画 */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
