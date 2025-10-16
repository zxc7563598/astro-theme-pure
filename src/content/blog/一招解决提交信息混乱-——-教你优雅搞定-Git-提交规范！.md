---
title: '一招解决提交信息混乱 —— 教你优雅搞定 Git 提交规范！'
publishDate: '2025-06-01 10:39:37'
description: '这篇文章教你如何用 Husky + Commitlint + cz-customizable 快速搭建一套 Git 提交规范系统，强制校验提交格式的同时，还能通过交互式方式生成标准提交说明。适用于前端、后端、团队协作项目，附完整配置文件和使用技巧，轻松提升代码管理质量'
tags:
  - GitHub
language: '中文'
# heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '1cf99112'
---

最近折腾项目的时候，发现一个一直被忽略的小问题——**Git 提交信息太随意了！**

有的写中文、有的全英文，有的直接就：`修改了`​……

每次看 Git log 都跟看天书一样，谁做了啥完全没头绪。而我又不想像个管理员一样天天盯着提醒“你提交信息写规范点行不行 😩”。

于是我找到了一个小而美的方案，能：

✅ 自动检查提交格式，拦截不规范提交  
✅ 提交时弹出提示，**引导式**填写提交说明  
✅ 配置简单，不依赖 Gitlab/Jenkins 之类 CI 系统

很适合像我一样刚开始重视团队协作规范的小伙伴！

---

## 我用了什么方案？

两个关键词：

### Husky

> 帮你拦住那些“不合格”的提交

它会在你执行 `git commit`​ 的时候，自动执行一些脚本，比如：检查你的提交信息是不是符合规范，并且拒绝那些不规范的提交

### cz-customizable

> 提交时弹个窗，你只用选和填

它在提交时弹出一个选择框，比如：

```
请选择你做了啥？
❯ feat: 新功能
  fix: 修复 Bug
  docs: 文档更新
```

然后一步步填完后自动帮你拼出标准格式，比如：

```
feat(core): 新增用户登录功能
```

是不是比自己记格式轻松多了！

---

## 怎么一步步搞定？

下面这些命令和配置都是我自己实践过的，跟着一步步来就行：

### 安装必要依赖

```bash
npm install --save-dev husky cz-customizable commitlint @commitlint/config-conventional
```

### 初始化 Husky

```bash
npx husky install
```

> 该命令会在项目根目录创建 `.husky/`​ 目录

然后执行：

```json
npm pkg set scripts.prepare="husky install"
```

> 这步是为了确保别人 clone 项目后，执行 `npm install`​ 时自动初始化好 Husky。

---

### 添加一个 Git 钩子，用来检查提交格式

```bash
mkdir -p .husky

echo 'npx commitlint --edit "$1"' > .husky/commit-msg

chmod +x .husky/commit-msg
```

---

### 添加配置文件

在项目根目录创建一个文件来设置提交信息校验规则： `commitlint.config.js`​

内容如下：

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "temp",
        "hotfix",
      ],
    ],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "scope-case": [0],
  },
};
```

什么意思？简单翻译一下：

​`extends: ["@commitlint/config-conventional"]`​：表示继承了 `@commitlint/config-conventional`​ 这个预设配置，它本身就定义了一套 [Conventional Commits](https://www.conventionalcommits.org/)（约定式提交）规范，比如 `feat: 添加新功能`​、`fix: 修复 bug`​。

​`'type-enum':[2,'always',[...]]`​：指定允许的提交类型（`[等级, 应用时机, 参数]`​）

- ​`等级`​：0-不启用规则，1-警告(不阻止提交)，2-错误(阻止提交)
- ​`应用时机`​：`always`​(总是应用这个规则)，`never`​(永不应用这个规则)

- ​`参数`​：允许的提交类型列表

​`'subject-empty':[2, 'never']`​：不允许提交信息的描述（subject）为空，比如 `fix:`​ 这种就是不允许的

​`'type-empty': [2, 'never']`​：不允许提交信息的类型（type）为空，比如 `: 修复了问题`​ 这种就是不允许的

​`'scope-case': [0]`​：关闭 `scope`​ 的大小写检查（0 表示关闭该规则），scope 是指像 `fix(api):`​ 中的 `api`​。

此时，整个项目就已经呗配置好了，在这种情况下，被允许提交的格式如下：

```bash
✅ feat(core): 增加权限中间件功能
✅ fix(route): 修复 POST 接口匹配失败
✅ docs: 更新 README 文档
❌ 更新了配置文件（因为没有 type）
❌ build:   （因为没有 subject）
```

---

### 最后一步：配置 `cz-customizable`​ 提示

添加 `.cz-config.js`​，这是我自己用的一份配置，可以自由加减修改：

```js
module.exports = {
  types: [
    { value: "feat", name: "feat: 新功能" },
    { value: "fix", name: "fix: 修复 Bug" },
    { value: "docs", name: "docs: 文档变更" },
    { value: "style", name: "style: 代码格式(不影响功能)" },
    {
      value: "refactor",
      name: "refactor: 重构(既不是新增功能，也不是修复 Bug)",
    },
    { value: "perf", name: "perf: 性能优化" },
    { value: "test", name: "test: 增加测试" },
    { value: "build", name: "build: 构建相关的修改(如配置文件)" },
    { value: "ci", name: "ci: CI 配置修改" },
    { value: "chore", name: "chore: 其他杂项" },
    { value: "revert", name: "revert: 回滚提交" },
    { value: "temp", name: "temp: 临时提交" },
    { value: "hotfix", name: "hotfix: 紧急修复" },
  ],

  scopes: [
    { name: "api" },
    { name: "model" },
    { name: "core" },
    { name: "middleware" },
    { name: "config" },
    { name: "migration" },
    { name: "seeder" },
    { name: "view" },
    { name: "route" },
    { name: "helper" },
    { name: "exception" },
    { name: "lang" },
    { name: "log" },
    { name: "test" },
    { name: "composer" },
    { name: "env" },
    { name: "ci" },
    { name: "docs" },
    { name: "assets" },
    { name: "cron" },
    { name: "queue" },
  ],

  usePreparedCommit: false,
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "TICKET-",
  ticketNumberRegExp: "\\d{1,5}",

  messages: {
    type: "请选择您要提交的更改类型：",
    scope: "\n请标明此次更改的范围（可选）：",
    customScope: "请标明此次更改的范围：",
    subject: "请用简短的祈使句描述此次更改：\n",
    body: "提供更详细的更改描述（可选）。使用“|”换行：\n",
    breaking: "列出任何重大更改（可选）：\n",
    footer: "列出此更改关闭的相关问题（可选），例如：#31，#34：\n",
    confirmCommit: "您确定要执行上述提交吗？",
  },

  allowCustomScopes: true,
  allowBreakingChanges: ["feat", "fix"],

  subjectLimit: 100,
};
```

---

## 使用方式

以后提交就不要用 `git commit`​ 了，直接：

```bash
npx cz
```

接下来按提示一步步选：

✅ 是什么类型？  
✅ 改动了哪一块？  
✅ 简单说说做了啥？

最后它会自动生成类似：

```
fix(api): 修复查询接口参数错误
```

漂亮又标准！

**如果你在使用 ​`Visual Studio Code`，安装`Visual Studio Code Commitizen Support`扩展后还可以直接在源代码管理中直接使用，非常方便 ​**​

---

## 最后的话

我不是专业搞规范的人，也不是在什么大厂搞了十年流程，我只是被提交信息搞得烦了，自己学了一下，觉得这个方案对我很有用，就想分享出来。

你要是也有类似的烦恼，或者团队人不多但也希望能“稍微有点规范”，那就试试这个方案吧～

当然啦，这种方式肯定不是唯一方案，已经很多大团队用得更深更自动化，我这个更像是入门轻量版，但已经能解决很多小烦恼了。

---

🧡 希望对你有帮助
