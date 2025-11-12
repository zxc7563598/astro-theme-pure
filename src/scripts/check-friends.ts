import { exec as execCb } from 'child_process'
import fs from 'fs/promises'
import { promisify } from 'util'
import fetch from 'node-fetch'
import links from 'public/links.json'

const exec = promisify(execCb)
const { friends } = links

const MY_SITE = 'https://hejunjie.life'

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

async function checkFriendPage(
  friend: FriendItem
): Promise<{ friend: FriendItem; status: 'ok' | 'missing' | 'error' }> {
  try {
    const res = await fetch(friend.friend_link, {
      timeout: 10000,
      headers: { 'User-Agent': 'FriendLinkChecker/1.0 (+https://hejunjie.life)' }
    })
    if (!res.ok) return { friend, status: 'error' }
    const html = await res.text()
    return html.includes(MY_SITE) ? { friend, status: 'ok' } : { friend, status: 'missing' }
  } catch {
    return { friend, status: 'error' }
  }
}

async function main() {
  console.log('🔍 开始检测友链页面...\n')

  const friendsToCheck: FriendItem[] = []
  const friendsToKeep0: FriendItem[] = []
  const friendsToKeep1: FriendItem[] = []

  friends[0].link_list.forEach((f) => (f.check ? friendsToCheck.push(f) : friendsToKeep0.push(f)))
  friends[1].link_list.forEach((f) => (f.check ? friendsToCheck.push(f) : friendsToKeep1.push(f)))

  const results = await Promise.all(friendsToCheck.map(checkFriendPage))

  friends[0].link_list = [...friendsToKeep0]
  friends[1].link_list = [...friendsToKeep1]

  results.forEach((r) => {
    const updatedFriend = { ...r.friend, check: r.status === 'ok' }
    if (r.status === 'ok') {
      friends[0].link_list.push(updatedFriend)
    } else {
      friends[1].link_list.push(updatedFriend)
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
    await exec('git add public/links.json')
    await exec('git commit -m "Update friend links after check"')
    await exec('git push')
    console.log('🚀 已成功推送到远程仓库')
  } catch (err) {
    console.error('❌ Git 操作失败:', err)
  }
}

main()
