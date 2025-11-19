---
title: 写博客写代码都适用：推完就自动部署的 GitHub Webhook 工具
publishDate: 2025-11-19 16:57:47
description: '分享我整理的轻量级 GitHub Webhook 工具，实现博客和代码项目的自动部署，只管写代码或写博客，服务器自动拉取、构建和重启，轻松又高效'
tags:
  - GitHub
  - Go
language: '中文'
heroImage: { src: './cover/github.jpg', color: '#000000' }
draft: false
slug: 'a9ee8nt5'
---

前阵子，我看到有人在吐槽自己写博客很麻烦——写麻烦、托管麻烦，推完 GitHub 之后还得去服务器上手动拉代码部署。虽然我以前在做类似的东西，但他这么一提让我想起这件事，我就想着，不如把自己一直随便用的小玩意整理一下，顺便分享给大家。

于是就有了这个小项目：一个轻量级的 GitHub Webhook Listener，用 Go 写的，可以帮你在推送代码后自动触发部署。

---

## 什么是 Webhook

Webhook 本质上就是 GitHub 在某些操作发生时，向你指定的地址发送一个网络通知。最常见的事件包括 **push**、**pull_request**、**release** 等。收到通知之后，你就可以根据事件类型做一些操作，比如自动部署代码、触发测试、更新文档等等。

设置 Webhook 其实也很简单：在 GitHub 仓库里找到 **Settings → Webhooks → Add webhook**，填入你服务器的地址和一个 Secret，选中你想监听的事件，然后 GitHub 就会在这些事件发生时发送 POST 请求到你的服务器。只要你的服务端能接收请求、校验 Secret，再执行对应操作，就完成了。

我以前一直随便把 Webhook 放在某个在跑的服务里处理，所以一直没有好好整理过。Webhook 的核心其实不复杂，它需要的只是一个接口去接收请求，这也是之前一直随手搞的原因。

---

## 为什么选 Go

Go 写这种小工具特别合适：

- 编译后就是一个二进制文件，直接丢到服务器上运行就行，不依赖其他环境。
- 运行开销小，启动快，非常适合长期驻留监听请求。
- 写起来简单，核心逻辑就是解析 HTTP 请求、验证签名、匹配事件和分支，然后执行命令。

所以我就决定用 Go，把这个小工具整理出来。你只需要放一个简单的配置文件，二进制程序就能运行起来。

---

## 配置示例

配置文件大概长这样：

```yaml
repos:
  'zxc7563598/astro-theme-pure': # 仓库名称
    secret: 'xxxxxx' # GitHub Webhook Secret
    rules:
      - event: 'push'
        branches: ['main']
        actions:
          - type: 'shell'
            command: 'sh ./shell/astro-theme-pure.sh'
```

程序启动后会在指定端口监听请求，收到事件就去匹配分支和事件类型，如果匹配，就执行你配置好的 shell 脚本。

就好像上面的配置，当 **zxc7563598/astro-theme-pure** 仓库的 **main** 分支触发了 **push** 时，脚本就会去执行 `sh ./shell/astro-theme-pure.sh`。

这样一来，你只管写代码，部署流程就自动完成了。

---

## 我的部署脚本

我博客的部署脚本大概是这样：

```bash
#!/bin/bash
set -e
PROJECT_DIR="/opt/astro-blog"
GIT="/usr/bin/git"
BUN="/usr/bin/bun"
PM2="/usr/bin/pm2"
export HOME="/root"
export PM2_HOME="/root/.pm2"

log() {
    echo "[deploy] $1"
}
log "========================================"
log "开始部署 Astro Blog"
log "时间: $(date)"
log "========================================"
cd "$PROJECT_DIR" || { log "无法进入项目目录"; exit 1; }
log "拉取最新代码..."
$GIT fetch origin
$GIT reset --hard origin/main
log "安装依赖（Bun）..."
$BUN install
log "构建 Astro 项目..."
$BUN run build
log "重启 PM2 进程..."
$PM2 restart "$PROJECT_DIR/ecosystem.config.cjs"
log "PM2 状态："
$PM2 list || true
log "部署完成"
log "时间: $(date)"
log "========================================"

```

有了这个流程，我写博客只管写代码，编辑器里写完 push，一切自动完成。服务器自己去拉取、构建、重启，我几乎不用管。

---

## 如果你也想试试

这个小项目我整理在 GitHub 上了：[github-webhook-listener](https://github.com/zxc7563598/github-webhook-listener)。它轻量、灵活，上手也很快。如果你也想搞个自动部署，可以直接拿去试试，不用在意具体实现或代码，看看 README，或者直接在 releases 里下载就能用。
