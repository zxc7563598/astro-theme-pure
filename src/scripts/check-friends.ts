import { exec as execCb } from 'child_process'
import fs from 'fs/promises'
import { promisify } from 'util'
import fetch from 'node-fetch'
import pLimit from 'p-limit'
import links from 'public/links.json'

const exec = promisify(execCb)
const { friends } = links

const MY_SITE = 'https://hejunjie.life'
const CONCURRENCY = 50

interface FriendItem {
  name: string
  intro: string
  link: string
  avatar: string
  avatar_cache: string
  friend_link: string
  check: boolean
}

const allFriends: FriendItem[] = []
friends.forEach((group) => {
  group.link_list.forEach((item) => allFriends.push(item))
})

async function checkFriendPage(friend: FriendItem): Promise<{
  friend: FriendItem
  status: 'ok' | 'missing' | 'error' | 'not_check'
  statusCode: number
  statusText: string
}> {
  try {
    const res = await fetch(friend.friend_link, {
      timeout: 10000,
      headers: { 'User-Agent': 'FriendLinkChecker/1.0 (+https://hejunjie.life)' }
    })
    if (!res.ok)
      return { friend, status: 'error', statusCode: res.status, statusText: res.statusText }
    const html = await res.text()
    if (friend.check) {
      return html.includes(MY_SITE)
        ? { friend, status: 'ok', statusCode: res.status, statusText: res.statusText }
        : { friend, status: 'missing', statusCode: res.status, statusText: res.statusText }
    } else {
      return { friend, status: 'not_check', statusCode: res.status, statusText: res.statusText }
    }
  } catch (err) {
    return {
      friend,
      status: 'error',
      statusCode: 500,
      statusText: err instanceof Error ? err.message : String(err)
    }
  }
}

async function main() {
  console.log('🔍 开始检测友链页面...\n')
  const friendsToCheck: FriendItem[] = []
  friends[0].link_list.forEach((f) => friendsToCheck.push(f))
  friends[1].link_list.forEach((f) => friendsToCheck.push(f))
  const limit = pLimit(CONCURRENCY)
  const results = await Promise.all(
    friendsToCheck.map((friend) => limit(() => checkFriendPage(friend)))
  )
  // 先清空原来的 link_list
  friends[0].link_list = []
  friends[1].link_list = []
  // 根据检测结果重新分配
  results.forEach((r) => {
    if (r.status === 'ok' || r.status === 'not_check') {
      friends[0].link_list.push(r.friend)
    } else {
      friends[1].link_list.push(r.friend)
    }
  })
  console.log('\n📋 检测结果:')
  results.forEach((r) => {
    console.log(`${r.friend.link.padEnd(40)} => ${r.statusCode}${r.status}:${r.statusText}`)
  })

  await fs.writeFile('public/links.json', JSON.stringify({ friends }, null, 2), 'utf-8')
  await fs.writeFile('dist/client/links.json', JSON.stringify({ friends }, null, 2), 'utf-8')
  console.log('\n✅ 已更新 links.json')

  // ---- 这里开始执行 git 提交和 push ----
  try {
    const { stdout } = await exec('git status --porcelain', { env: process.env })
    if (stdout.trim().length === 0) {
      console.log('📭 没有文件变动，无需提交')
    } else {
      // 使用本地配置而不是全局配置
      await exec('git config user.name "zxc7563598"', { env: process.env })
      await exec('git config user.email "junjie.he.925@gmail.com"', { env: process.env })
      await exec('git add public/links.json', { env: process.env })
      await exec('git commit -am "chore(links): 自动检测链接活跃情况并进行分类"', {
        env: process.env
      })
      await exec('git push', { env: process.env })
      console.log('🚀 已成功推送到远程仓库')
    }
  } catch (err) {
    console.error('❌ Git 操作失败:', err)
  }
}

main()
