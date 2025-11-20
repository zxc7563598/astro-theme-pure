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

const fetchWithBrowserUA = async (url: string, mySite: string) => {
  const browserUA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/141.0.0.0 Safari/537.36'
  const customUA = `${browserUA} FriendLinkChecker/1.0 (+${mySite})`
  return fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': customUA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    signal: AbortSignal.timeout(12_000)
  })
}

async function checkFriendPage(
  friend: FriendItem
): Promise<{ friend: FriendItem; status: 'ok' | 'missing' | 'error' | 'not_check' }> {
  try {
    const res = await fetchWithBrowserUA(friend.friend_link, MY_SITE)
    if (!res.ok) return { friend, status: 'error' }
    const html = await res.text()
    if (friend.check) {
      return html.includes(MY_SITE) ? { friend, status: 'ok' } : { friend, status: 'missing' }
    } else {
      return { friend, status: 'not_check' }
    }
  } catch {
    return { friend, status: 'error' }
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
    console.log(`${r.friend.link.padEnd(40)} => ${r.status}`)
  })

  await fs.writeFile('public/links.json', JSON.stringify({ friends }, null, 2), 'utf-8')
  await fs.writeFile('dist/client/links.json', JSON.stringify({ friends }, null, 2), 'utf-8')
  console.log('\n✅ 已更新 links.json')

  // ---- 这里开始执行 git 提交和 push ----
  try {
    const { stdout } = await exec('git status --porcelain')
    if (stdout.trim().length === 0) {
      console.log('📭 没有文件变动，无需提交')
    } else {
      await exec('git config --global user.name "zxc7563598"')
      await exec('git config --global user.email "junjie.he.925@gmail.com"')
      await exec('git add public/links.json')
      await exec('git commit -am "chore(links): 自动检测链接活跃情况并进行分类"')
      await exec('git push')
      console.log('🚀 已成功推送到远程仓库')
    }
  } catch (err) {
    console.error('❌ Git 操作失败:', err)
  }
}

main()
