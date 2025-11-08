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
  console.log('slug', slug)
  console.log('cookieVal', cookieVal)
  console.log('path', path)
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `verified-${slug}=${cookieVal}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    }
  })
}
