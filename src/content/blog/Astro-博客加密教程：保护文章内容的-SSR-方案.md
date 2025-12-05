---

title: Astro 博客加密教程：保护文章内容的 SSR 方案
publishDate: 2025-11-09 16:31:02
description: '静态博客的文章加密其实并不简单。本文分享我在 Astro 博客中实现文章加密的完整思路，从静态输出改为 SSR，通过接口验证实现安全、灵活的内容访问控制。'
tags:
  - Web
language: '中文'
heroImage: { src: './cover/web.jpg', color: '#3594ec' }
draft: false
slug: 'idR42daq'
password: 
  - { question: '访问密码是什么（123456）', answer: '123456' }
  - { question: '可以设置多个问题吗（可以）', answer: '可以' }
---

## 为什么想要加密文章

有时候我们希望自己的博客文章不是所有人都能直接看到，最好能设置一个问题验证——只有答对的人才能解锁内容。  
听起来简单，但对于**纯静态博客**来说，这其实挺麻烦的。

## 静态博客的“加密”假象

静态博客的所有内容，在构建时就已经写进了 HTML 里。  
即使你用 CSS 或 JavaScript 把文字“藏”起来，用户打开浏览器开发者工具就能轻松看到原文。

有人会选择在前端加密文章内容，然后在浏览器里解密再显示。  
这个办法能提高一点门槛，但问题是——**加密密钥也在前端**，意味着别人仍有办法找到它。

真正安全的做法，不是去“隐藏内容”，而是**让验证和解密都发生在服务器上**，浏览器只负责展示。

## SSR：给静态博客加上“动态大脑”

当博客切换到服务端渲染（SSR）后，文章内容就不会提前打包到前端，而是在请求时由服务器生成。

这样做的好处显而易见：

- 内容不再暴露在 HTML 里
- 可以在服务端验证访问条件
- 访问控制逻辑更清晰、可扩展

所以我的思路是：用 **SSR + 接口验证** 的方式，实现文章加密。

## 实现思路概览

我把整个流程拆成了几个部分来实现，使用的主题为：**astro-theme-pure**

其余的主题依然可以用本文思路实现

### 1. 从静态输出改为 SSR

将 `astro.config.ts` 里的 `output: 'static'` 改为 `output: 'server'`。

在我使用的 astro-theme-pure 主题的配置文件中已经预设了对应的配置，其余 `astro` 的配置大抵相同

```ts
export default defineConfig({
  // Adapter
  // https://docs.astro.build/en/guides/deploy/
  // 1. Vercel (serverless)
  // adapter: vercel(),
  // output: 'server',
  // 2. Vercel (static)
  // adapter: vercel(),
  // output: 'static',
  // 3. Local (standalone)
  adapter: node({ mode: 'standalone' }),
  output: 'server',
})
```

他们代表了博客的3种部署方式

- **Vercel (serverless)**   
  SSR（服务端渲染）模式。  
  每次访问时才执行渲染，不访问就不占资源。适合部署在托管平台上。
- **Vercel (static)**   
  SSG（静态渲染）模式。  
  所有页面在构建阶段生成，访问速度快但无法动态控制内容。
- **Local (standalone)**   
  SSR（服务端渲染）模式。  
  会生成一个可直接运行的 Node 服务，适合自己托管。  
  不过是长驻进程，不像 serverless 那样按需启动。

两种 SSR 模式的主要区别在于是否支持长时间运行的任务（大多数 serverless 函数会有 10 秒左右的超时限制）。  
对于文章加密这类轻量功能，两种都完全够用。

> 如果 standalone 模式报缺少 `node` 模块，安装 `@astrojs/node` 即可。

### 2. Frontmatter 增加加密字段

在每篇文章的 frontmatter 中增加 `password` 字段，用来存储文章的“问题与答案”：

```ts
---
title: "加密文章示例"
publishDate: "2025-11-09"
password: 
  - { question: '访问密码是什么（123456）', answer: '123456' }
  - { question: '可以设置多个问题吗（可以）', answer: '可以' }
---
```

在我使用的 astro-theme-pure 主题预设了博客文章的 frontmatter 字段，在 `src/content.config.ts` 中，其余 `astro` 主题大抵相同，需要自行处理

```ts
// Define blog collection
const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Required
  schema: ({ image }) =>
    z.object({
      // Required
      title: z.string().max(60),
      description: z.string().max(160),
      publishDate: z.coerce.date(),
      // Optional
      updatedDate: z.coerce.date().optional(),
      heroImage: z
        .object({
          src: image(),
          alt: z.string().optional(),
          inferSize: z.boolean().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          color: z.string().optional()
        })
        .optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      language: z.string().optional(),
      draft: z.boolean().default(false),
      // Special fields
      comment: z.boolean().default(true),
      // 增加 password
      password: z.array(
          z.object({
            question: z.string().min(1, '问题不能为空'),
            answer: z.string().min(1, '答案不能为空')
          })
        ).default([])
    })
})
```

### 3. 调整文章渲染方式

在原先的 Astro 博客中，文章页面是在 `src/pages/blog/[...id].astro` 这样渲染的：

```ts
import { render, type CollectionEntry } from 'astro:content'

import { getBlogCollection, sortMDByDate } from 'astro-pure/server'
import PostLayout from '@/layouts/BlogPost.astro'

export const prerender = true

export async function getStaticPaths() {
  const posts = sortMDByDate(await getBlogCollection())
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post, posts }
  }))
}

type Props = {
  post: CollectionEntry<'blog'>
  posts: CollectionEntry<'blog'>[]
}

const { post, posts } = Astro.props
const { Content, headings, remarkPluginFrontmatter } = await render(post)
```

这种方式属于**静态生成（SSG）** ：

在构建阶段（`astro build`），Astro 会：

1. 执行 `getStaticPaths()`。
2. 拿到所有文章（posts）并生成一个“路径列表”。
3. 对列表中的每个路径都提前生成一个 HTML 文件（比如 `/blog/xxx/index.html`）。
4. 把 `post` 数据写进这个静态文件里。

而我们并不想让文章内容被写入到 `html` 中，而是动态渲染文章内容，我们就是为此才切换到 SSR 模式，在 SSR 模式下：

- 你不能再用 `getStaticPaths` 去“预生成”页面。
- ​`Astro.props` 也不会有 `post`、`posts` 这种预注入的数据（因为 SSR 时没有提前构建这些 props）。

所以我们需要调整 `src/pages/blog/[...id].astro` 为：

```ts
import { render, type CollectionEntry } from 'astro:content'

import { getBlogCollection, sortMDByDate } from 'astro-pure/server'
import PostLayout from '@/layouts/BlogPost.astro'

export const prerender = false

type Props = {
  post: CollectionEntry<'blog'>
  posts: CollectionEntry<'blog'>[]
}

const { id } = Astro.params
const allPosts = await getBlogCollection()
const posts = sortMDByDate(
  allPosts.filter((p) => p.collection === 'blog')
) as CollectionEntry<'blog'>[]
const post = posts.find((p) => p.id === id)
if (!post) {
  throw new Error(`Blog post not found: ${id}`)
}

const { Content, headings, remarkPluginFrontmatter } = await render(post)
```

### 4. 前端交互：Vue 组件

创建一个 Vue 小组件：

- 只显示问题，不知道答案
- 用户输入答案后提交给接口
- 根据接口响应刷新页面或者提示错误

这个组件可以在任何页面使用，因此不做过多描述，在你的项目中任意目录创建一个 `vue` 文件，之后在需要使用的 `.astro` 文件中通过 `import` 引用即可

```vue
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
```

### 5. 后端接口：验证问题答案

用一个 TypeScript 文件实现验证接口：

- 通过 `astro:content` 获取文章 frontmatter。
- 对比用户提交的答案和正确答案。
- 如果验证成功，设置加密 cookie，并刷新页面显示文章内容。

```ts
import crypto from 'crypto'
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const SECRET =
  process.env.COOKIE_SECRET || 'q1W2e3R4t5Y6u7I8o9P0aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789-_'

// 用 HMAC 签名
function sign(value: string) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

// 生成签名 cookie 值
function makeSignedCookieValue(slug: string, maxAgeSec = 86400) {
  const expires = Math.floor(Date.now() / 1000) + maxAgeSec
  const payload = `${slug}:${expires}`
  const sig = sign(payload)
  return `${payload}:${sig}`
}

// 验证签名 cookie 值
export function verifySignedCookieValue(cookieValue: string | null | undefined) {
  if (!cookieValue) return false
  const parts = cookieValue.split(':')
  if (parts.length !== 3) return false
  const [slug, expiresStr, sig] = parts
  const payload = `${slug}:${expiresStr}`
  const expectedSig = sign(payload)
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false
  if (parseInt(expiresStr, 10) < Math.floor(Date.now() / 1000)) return false
  return slug
}

export const POST: APIRoute = async ({ request, url }) => {
  const slug = new URL(url).searchParams.get('slug')
  if (!slug)
    return new Response(JSON.stringify({ error: '非法请求' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  const posts = await getCollection<'blog'>('blog')
  const post = posts.find((p) => p.id === slug)
  if (!post)
    return new Response(JSON.stringify({ error: '文章不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  const formData = await request.formData()
  const password = post.data.password || []
  const correct = password.every((p, i) => {
    const answer = formData.get(`answer_${i}`)?.toString().trim().toLowerCase()
    return answer === p.answer.trim().toLowerCase()
  })
  if (!correct) {
    return new Response(JSON.stringify({ error: '答案错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const path = formData.get(`path`)?.toString().trim()
  const cookieVal = makeSignedCookieValue(slug, 24 * 3600)
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    `verified-${slug}=${cookieVal}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  )
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `verified-${slug}=${cookieVal}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    }
  })
}
```

### 6. 改造文章模板

在文章模板中增加逻辑：

- 检查文章是否加密。
- 检查 cookie 是否存在且有效。
- 如果未验证，显示 Vue 加密组件。
- 验证通过，显示文章内容。

在 `src/layouts/BlogPost.astro` 中进行调整：

```astro
---
import type { MarkdownHeading } from 'astro'
import type { CollectionEntry } from 'astro:content'

// Plugin styles
import 'katex/dist/katex.min.css'

import { MediumZoom } from 'astro-pure/advanced'
import { ArticleBottom, Hero } from 'astro-pure/components/pages'
import PageLayout from '@/layouts/ContentLayout.astro'
import { verifySignedCookieValue } from '@/pages/api/verify'
import Copyright from '@/components/custom/Copyright.astro'
import TOC from '@/components/custom/TOC.astro'
import PasswordForm from '@/components/vue/PasswordForm.vue'
import { Comment, PageInfo } from '@/components/waline'
import { integ } from '@/site-config'

interface Props {
  post: CollectionEntry<'blog'>
  posts: CollectionEntry<'blog'>[]
  headings: MarkdownHeading[]
  remarkPluginFrontmatter: Record<string, unknown>
}

const {
  post: { id, data },
  posts,
  headings,
  remarkPluginFrontmatter
} = Astro.props

const {
  description,
  heroImage,
  publishDate,
  title,
  updatedDate,
  draft: isDraft,
  comment: enableComment
} = data

const socialImage = heroImage
  ? typeof heroImage.src === 'string'
    ? heroImage.src
    : heroImage.src.src
  : '/images/social-card.png'
const articleDate = updatedDate?.toISOString() ?? publishDate.toISOString()
const primaryColor = data.heroImage?.color ?? 'hsl(var(--primary) / var(--un-text-opacity))'

// 读取 cookie 并验证
const cookieHeader = Astro.request.headers.get('cookie')
let verified = false
if (cookieHeader) {
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((s) => {
      const [k, v] = s.trim().split('=')
      return [k, v]
    })
  )
  const result = verifySignedCookieValue(cookies[`verified-${id}`])
  if (result && result === id) verified = true
}

const password = data.password || []
const questions = password.map((p) => p.question)
if (questions.length == 0) {
  verified = true
}
---

<PageLayout
  meta={{ articleDate, description, ogImage: socialImage, title }}
  highlightColor={primaryColor}
  back='/blog'
>
  {verified && !!headings.length && <TOC {headings} slot='sidebar' />}

  <Hero {data} {remarkPluginFrontmatter} slot='header'>
    <Fragment slot='description'>
      {!isDraft && enableComment && <PageInfo comment class='mt-1' />}
    </Fragment>
  </Hero>

  {verified ? <slot /> : <PasswordForm slug={id} questions={questions} client:load />}

  <Fragment slot='bottom'>
    {/* Copyright */}
    <Copyright {data} />
    {/* Article recommend */}
    <ArticleBottom collections={posts} {id} class='mt-3 sm:mt-6' />
    {/* Comment */}
    {!isDraft && enableComment && <Comment class='mt-3 sm:mt-6' />}
  </Fragment>

  <slot name='bottom-sidebar' slot='bottom-sidebar' />
</PageLayout>

{integ.mediumZoom.enable && <MediumZoom />}
```

## 总结

通过 SSR + 接口验证的方式，我们可以在 Astro 博客中实现比较安全的文章加密：

- 静态博客加密的核心问题在于**内容已经暴露**。
- SSR 可以让文章内容只存在于服务端，前端无法直接获取。
- 前端只负责用户交互，验证逻辑和内容展示都交由服务端处理。

对于需要文章加密的博客来说，这种方式在安全性和实现复杂度之间，算是一个比较理想的平衡点。  
如果你也想在自己的博客里尝试类似的加密机制，可以参考本文的思路进行改造。

如果对于文章中提到的改动仍有疑问，可以前往 GitHub 查看本次改造的提交：[点我查看](https://github.com/zxc7563598/astro-theme-pures/pull/1)
