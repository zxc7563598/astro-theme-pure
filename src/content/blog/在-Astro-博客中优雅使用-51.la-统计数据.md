---
title: 在 Astro 博客中优雅使用 51.la 统计数据
publishDate: 2025-10-24 19:44:10
description: '在 Astro 博客中使用 51.la 免费流量统计，通过解析 widget JS 自行渲染访问数据，既保留统计功能，又可自定义展示，让你直观了解博客访客情况'
tags:
  - Web
language: '中文'
heroImage: { src: './cover/web.jpg', color: '#3594ec' }
draft: false
slug: 'do295utb'
---

作为老牌网站流量统计服务商，51.la 提供每月高达 **1000 万次的免费统计额度**，非常适合个人博客或小型网站使用。不过，51.la 默认的统计展示是通过嵌入 JS 文件自动渲染的，这种展示方式对美观性和自定义性有限，对于追求页面整洁或者想要自己设计展示风格的博主来说不太方便。

我之所以想自己处理 51.la 的统计，是因为我希望**更直观地看到有多少人访问我的博客**，了解访客的访问情况，从而改进内容和布局。经过尝试，我找到了一个方法：**解析 51.la 的 widget JS 数据，自行在 Astro 中渲染统计数据**，既保留统计功能，又可以完全控制展示效果。下面分享我的完整经验。

---

## 配置文件管理

在 Astro 中，一般会有一个全局配置文件，用来集中管理各种配置。我们可以把 51.la 的相关信息放在一起，示例：

```typescript
export const metrics: { enable: boolean; sdk: string; id: string; ck: string; widget: string } = {
  // 51.la 统计开关
  enable: true,
  // 统计网站的配置信息，在后台获取
  // See: https://v6.51.la/report/setup/params/statistics
  sdk: 'https://sdk.51.la/js-sdk-pro.min.js',
  id: 'xxxxxxxxxxxxxxxx',
  ck: 'xxxxxxxxxxxxxxxx',
  // 数据挂件 javascript 地址
  // See: https://v6-widget.51.la/v6/xxxxxxxxxxxxxxxx/quote.js
  widget: 'https://v6-widget.51.la/v6/xxxxxxxxxxxxxxxx/quote.js'
}
```

如果你的项目中没有配置文件，可以在 `src` 下创建一个 TS 文件，然后在 `tsconfig.json` 的 `paths` 中添加，例如：

```json
"@/site-config": ["src/site.config.ts"]
```

这样，在 Astro 页面中就可以直接引入：

```astro
---
import { metrics } from '@/site-config'
---
```

> 集中管理配置的好处是，一旦需要修改统计信息，只需改一处即可，方便维护。

---

## 在入口加载统计

为了统计用户访问情况，我们需要在页面入口加载 51.la 的 SDK。不同主题的入口文件可能不同，Astro 默认的入口是 `src/layouts/Layout.astro`。如果不确定，可以从 `pages/index.astro` 开始反推去找包含完整 HTML 结构的布局文件。在布局文件的 `<head>` 中加入：

```astro
{metrics.enable && <script is:inline src={metrics.sdk} />}
<script is:inline type='module' data-astro-rerun define:vars={{ metrics: metrics }}>
  if (metrics.enable) {
    LA.init({ id: metrics.id, ck: metrics.ck })
  }
</script>
```

> 注意：对应的文件顶部需要引入配置：`import { metrics } from '@/site-config'`​

这样，每次用户访问页面时都会触发 51.la 的统计，后台就能记录访客数据。

---

## 创建数据展示组件

为了美观，我们可以自己在 `components` 里创建一个组件（例如 `Metrics.astro`）来展示数据，这样就不依赖 51.la 默认的 JS 渲染。示例：

```astro
---
import { metrics } from '@/site-config'
---

<div id='widget'>
  加载中...
</div>

<script is:inline type='module' data-astro-rerun define:vars={{ metrics: metrics }}>
  if (metrics.enable && metrics.widget) {
    fetch(metrics.widget)
      .then((res) => res.text())
      .then((data) => {
        let num = data.match(/(<\/span><span>).*?(\/span><\/p>)/g)
        if (!num) {
          console.warn('51.la 数据匹配失败')
          return
        }
        num = num.map((el) => el.replace(/(<\/span><span>|<\/span><\/p>)/g, ''))
        const titles = [
          '最近活跃',
          '今日人数',
          '今日访问',
          '昨日人数',
          '昨日访问',
          '本月访问',
          '总访问量'
        ]
        const container = document.getElementById('widget')
        let html = ''
        for (let i = 0; i < num.length; i++) {
          html += `<div>标题：${titles[i]}</div>`
          html += `<div>内容：${num[i]}</div>`
        }
        container.innerHTML = html
      })
      .catch((err) => {
        console.error('51.la 数据获取失败:', err)
        document.getElementById('widget').innerHTML = '加载失败'
      })
  }
</script>
```

> 样式可以根据自己的需求进行美化，例如网格布局、卡片样式等。这里的重点是把数据准确展示出来，让访客统计信息可视化。

之后，将你的组件在你想要展示的页面中尽性应用即可，就像其他的组件一样

---

## 总结

通过这种方式，你可以：

- **保留 51.la 的统计功能**，无需自己搭建后端统计系统。
- **自定义统计数据显示方式**，让数据展示更美观、更符合博客风格。
- **在 Astro 项目中简单集成**，配置和组件化管理清晰。

我之所以选择自己解析 widget 数据，是希望**在博客上直观看到访客情况**，了解每天有多少人访问、哪些内容更受欢迎。这样可以更有针对性地优化博客内容，同时也享受了 51.la 提供的免费统计额度。

> 注意：如果 51.la 的 widget JS 结构有改动，正则匹配可能需要更新。但在目前版本下，这种方法非常稳妥。

---

这样，你就可以既“白嫖” 51.la 免费流量统计，又能自由控制数据展示效果，同时清楚了解自己的博客访问情况。
