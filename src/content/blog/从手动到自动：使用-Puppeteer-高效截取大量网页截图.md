---
title: '从手动到自动：使用 Puppeteer 高效截取大量网页截图'
publishDate: '2024-11-03 10:15:38'
description: '了解如何使用 Puppeteer 实现大量网页截图的自动化，从初步安装到代码实现，帮助你快速应对繁琐的截图任务'
tags:
  - NodeJs
language: '中文'
heroImage: { src: './cover/nodejs.png', color: '#90c53f' }
draft: false
slug: 'e7de3872'
---

最近生活出了那么一点小问题。给老板做了套系统，老板拿着去做小额贷款犯法了。所以我也是被警方控制协助调查，这下真从面向对象变成面向监狱了。不过还好，因为积极配合，问题不大。

但事情远未结束。警方要求我取证，把所有后台页面都截成图。零零散散算下来，大约有 20 万张截图。这要是手动来得干几个月都说不定。于是，我开始寻求能救命的自动化工具，这时，我发现了 Puppeteer。

# 发现 Puppeteer

Puppeteer 是一个由 Google 开发的 Node.js 库，它为控制无头浏览器（如 Chromium）提供了简单的 API。它不仅支持网页截图，还可以执行各种其他任务，比如网页爬虫、自动化表单提交和生成 PDF 等。

# Puppeteer 入门

要开始使用 Puppeteer，只需几个简单的步骤：

## 安装 Puppeteer：

```bash
    npm install puppeteer
```

## 编写基础代码

下面是一个基础的 Puppeteer 脚本，用于打开一个网页并截取截图：

```javascript
const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://example.com')
  await page.screenshot({ path: 'example.png' })
  await browser.close()
})()
```

> 运行这个脚本后，你将在项目目录中看到访问 **https://example.com** 后截取到的截图文件 **example.png**

# 最终实现

- 使用 Puppeteer 启动一个无头浏览器来打开特定 URL，并针对不同的 tag 进行多次抓取，每个抓取过程限速 5 个并行任务
- 为每个 data 项创建一个路径并将截图保存到该路径下。
- 为不同的 tag 设定了不同的加载延迟时间。

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5);
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    // 要抓取的页面参数信息
    const data = [
        { id: 16212, path: "对应文件夹" },
        { id: 16229, path: "对应文件夹" },
        { id: 16591, path: "对应文件夹" }
    ];
    // 要抓取的页面标签
    const tags = [
        'customer',
        'contact',
        'address_book',
        'sms',
        'wind_control',
        'orders'
    ];
    // 网页要设置的cookie
    const cookies = [
        { name: 'token', value: 'xxxxxx', domain: '' },
    ];
    // 每个页面标签延迟抓取的毫秒时间
    const delays = {
        customer: 3000,
        contact: 10000,
        address_book: 3000,
        sms: 5000,
        wind_control: 2000,
        orders: 2000
    };
    // 开始处理
    for (const item of data) {
        const dirPath = path.join(__dirname, '项目名称', item.path);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const screenshotPromises = tags.map(tag =>
            limit(async () => {
                const url = `http://baseurl/${tag}?borrow_id=${item.id}`;
                const page = await browser.newPage();
                try {
                    // 设置截图的分辨率
                    await page.setViewport({ width: 1920, height: 1080 });
                    // 设置cookie
                    await page.setCookie(...cookies);
                    // 设置导航到指定 url 并等待页面加载完成，直到满足特定的网络状态条件
                    // 通常为：至少有 500 毫秒的时间内，网络连接不超过 2 个
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    // 对应标签暂停一段时间，以便网页动画加载完成
                    await page.waitForTimeout(delays[tag]);
                    // 拼接存储路径
                    const screenshotPath = path.join(dirPath, ${tag}.png);
                    // 存储截图
                    await page.screenshot({ path: screenshotPath });
                    console.log(`${screenshotPath}:存储成功`);
                } catch (error) {
                    console.error(`${screenshotPath}:存储失败`, error);
                } finally {
                    // 关闭页面
                    await page.close();
                }
            })
        );

        await Promise.all(screenshotPromises);
    }
    // 关闭浏览器
    await browser.close();
})();
```

# 结论

使用 Puppeteer 后，曾经需要手动完成的长时间截图任务现在只需短短几分钟或几小时就能搞定。如果你也有类似需求，试试 Puppeteer，相信它会成为你高效工作的利器。
