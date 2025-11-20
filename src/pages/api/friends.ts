import { exec as execCb } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import type { APIRoute } from 'astro'
import fetch from 'node-fetch'

const exec = promisify(execCb)
const MY_SITE = 'https://hejunjie.life'
const LINK_JSON_PATH = path.resolve('public/links.json')
const LINK_DIST_PATH = path.resolve('dist/client/links.json')
const OSS_BUCKET_PATH = 'oss://hejunjie-blog/avatars/'
const OSS_CDN_PREFIX = 'https://cdn.hejunjie.life/avatars/'

interface FriendItem {
  name: string
  intro: string
  link: string
  avatar: string
  avatar_cache: string
  friend_link: string
  check: boolean
}

// 检测友链页面中是否包含本站链接
async function checkFriendPage(friend: FriendItem): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(friend.friend_link, {
      timeout: 10000,
      headers: { 'User-Agent': `FriendLinkChecker/1.0 (+${MY_SITE})` }
    })
    if (!res.ok) {
      return { success: false, message: `网站访问失败: ${res.status} ${res.statusText}` }
    }
    const html = await res.text()
    if (html.includes(MY_SITE)) {
      return { success: true, message: '检测通过' }
    } else {
      return { success: false, message: '未检测到本站链接，请确认已添加，或在下方评论留言' }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, message: message }
  }
}

// 从网络图片下载并上传到 OSS，然后删除本地文件
async function uploadImageFromUrl(imageUrl: string, fileName: string): Promise<string> {
  // 取出后缀，例如 .png / .jpg / .webp
  const ext = path.extname(imageUrl).split('?')[0] || '.jpg'
  const localPath = `./temp_${fileName}${ext}`
  const ossPath = `${OSS_BUCKET_PATH}${fileName}${ext}`
  const ossPublicUrl = `${OSS_CDN_PREFIX}${fileName}${ext}`
  try {
    // 下载图片
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': `AvatarFetcher/1.0 (+${MY_SITE})` }
    })
    if (!res.ok) throw new Error(`下载失败: ${res.status} ${res.statusText}`)
    const buffer = await res.arrayBuffer()
    await fs.writeFile(localPath, Buffer.from(buffer))
    // 上传到 OSS
    const { stdout, stderr } = await exec(`ossutil cp ${localPath} ${ossPath}`)
    if (stderr || /Error/i.test(stdout)) {
      throw new Error(`ossutil 错误: ${stderr || stdout}`)
    }
    // 删除本地文件
    await fs.unlink(localPath).catch(() => {})
    // 返回 OSS 公网 URL
    return ossPublicUrl
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`上传失败: ${message}`)
  }
}

// 检查头像有效性
async function validateImageUrl(url: string): Promise<void> {
  if (!url) throw new Error('头像地址不能为空')
  const imageExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.bmp',
    '.ico',
    '.svg',
    '.avif',
    '.tiff'
  ]
  const urlLower = url.trim().toLowerCase()
  const hasValidExt = imageExtensions.some((ext) => urlLower.endsWith(ext))
  if (hasValidExt) {
    // URL 后缀命中，直接认为是图片
    return
  }
  // URL 后缀不命中，则检查 Content-Type
  try {
    const res = await fetch(url.trim(), { method: 'GET' })
    if (!res.ok) {
      throw new Error(`无法访问头像链接: ${res.status} ${res.statusText}`)
    }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('image')) {
      throw new Error('头像链接不是图片类型')
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`头像链接无法访问或请求出错: ${message}`)
  }
}

// 检查域名
function isSameDomain(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1)
    const u2 = new URL(url2)
    return u1.hostname === u2.hostname
  } catch {
    return false // URL 解析失败视为不同域名
  }
}

let writeQueue: Promise<unknown> = Promise.resolve()
async function queueWrite<T>(task: () => Promise<T>): Promise<T> {
  writeQueue = writeQueue.then(() => task())
  return writeQueue as Promise<T>
}

// 处理 POST 请求
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  try {
    const name = formData.get('name')
    if (!name) {
      return new Response(JSON.stringify({ success: false, message: `网站名称不能为空` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const intro = formData.get('intro')
    if (!intro) {
      return new Response(JSON.stringify({ success: false, message: `网站描述不能为空` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const link = formData.get('link')
    if (!link) {
      return new Response(JSON.stringify({ success: false, message: `网站地址不能为空` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const avatar = formData.get('avatar')
    if (!avatar) {
      return new Response(JSON.stringify({ success: false, message: `头像地址不能为空` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    try {
      await validateImageUrl(avatar.toString().trim())
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          message: err instanceof Error ? err.message : String(err)
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    const friend_link = formData.get('friend_link')
    if (!friend_link) {
      return new Response(JSON.stringify({ success: false, message: `友情链接页面地址不能为空` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const friend: FriendItem = {
      name: name.toString().trim(),
      intro: intro.toString().trim(),
      link: link.toString().trim(),
      avatar: avatar.toString().trim(),
      friend_link: friend_link.toString().trim(),
      avatar_cache: '',
      check: true
    }
    if (!isSameDomain(friend.link, friend.friend_link)) {
      return new Response(
        JSON.stringify({ success: false, message: `友情链接页面与主站并非同一域名` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    // 读取 links.json 并检查重复网站
    const content = await fs.readFile(LINK_JSON_PATH, 'utf-8')
    const data = JSON.parse(content)
    let allFriends: FriendItem[] = []
    try {
      const groups = [data.friends?.[0], data.friends?.[1], data.friends?.[2]].filter(Boolean)
      allFriends = groups.flatMap((group: { link_list?: FriendItem[] }) => group.link_list ?? [])
    } catch {
      return new Response(JSON.stringify({ success: false, message: '服务器读取友链数据失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    // 检查 link 是否重复（忽略大小写和尾部斜杠）
    const submittedLink = (formData.get('link') || '')
      .toString()
      .trim()
      .replace(/\/+$/, '')
      .toLowerCase()
    const exists = allFriends.some(
      (f) => f.link.replace(/\/+$/, '').toLowerCase() === submittedLink
    )
    if (exists) {
      return new Response(
        JSON.stringify({ success: false, message: '该网站已在友链中，无需重复提交' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    // 网站未添加，检测链接
    const result = await checkFriendPage(friend)
    if (result.success) {
      // 检测到链接，上传头像
      try {
        const safeName = friend.name
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50)
        const uniqueName = `${safeName}-${Date.now()}`
        const url = await uploadImageFromUrl(friend.avatar, uniqueName)
        friend.avatar_cache = url
      } catch {
        friend.avatar_cache = ''
      }
      // 追加到 friends[0].link_list
      if (
        Array.isArray(data.friends) &&
        data.friends[0] &&
        Array.isArray(data.friends[0].link_list)
      ) {
        data.friends[0].link_list.push(friend)
        await queueWrite(async () => {
          await fs.writeFile(LINK_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8')
          // 如果你在构建产物中也有一份（比如 dist/client）
          await fs.writeFile(LINK_DIST_PATH, JSON.stringify(data, null, 2), 'utf-8')
        })
        // 同步到 Git
        try {
          const { stdout } = await exec('git status --porcelain', { env: process.env })
          if (stdout.trim().length !== 0) {
            await exec('git config user.name "zxc7563598"', { env: process.env })
            await exec('git config user.email "junjie.he.925@gmail.com"', { env: process.env })
            await exec('git add public/links.json', { env: process.env })
            await exec('git commit -m "chore(links): 自动添加新的友链"', { env: process.env })
            await exec('git push', { env: process.env })
          }
        } catch (err) {
          console.error('Git 操作失败:', err)
        }
      }
      return new Response(JSON.stringify({ success: true, message: '检测通过，网站已添加' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ success: false, message: result.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ success: false, message: `解析请求失败: ${message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
