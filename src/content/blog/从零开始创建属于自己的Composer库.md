---
title: '从零开始创建属于自己的 Composer 库'
publishDate: '2024-10-17 20:24:20'
description: '在本文中，我们探讨了如何从零开始创建自己的 Composer 库'
tags:
  - PHP
  - Composer
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '72f5b414'
---

Composer 是 PHP 领域最流行的依赖管理工具，它使得管理项目依赖变得轻松简单。然而，除了使用现有的包，我们也可以创建和发布属于自己的 Composer 包。
在这篇文章中，我将带你一步一步完成从零开始创建并发布一个自己的 Composer 包的流程。

# 创建项目

在你的工作目录下创建一个新的文件夹作为你的包：

```bash
mkdir project
cd project
```

# 初始化 Composer

在项目目录中运行以下命令以生成 composer.json 文件：

```bash
composer init
```

> 确保您已经安装了 Composer，如果尚未安装，可以通过 Composer 的 [官方网站](https://getcomposer.org) 获取详细的安装说明。

> composer init 执行后会需要填写一些内容，皆指帮助您生成 composer.json 文件，所以不需要过于在意，后期也可以直接修改 composer.json 文件，大概内容如下：

| 问题                                                                       | 说明                                                                                | 建议                                                                                                                                              |
| :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package name (vendor/package)                                              | composer 包名                                                                       | 个人&组织名称/包名                                                                                                                                |
| Description                                                                | 对你的包做一个简短的描述                                                            | 控制在一两句话以内                                                                                                                                |
| Author                                                                     | 作者                                                                                | 名称 <邮箱地址>                                                                                                                                   |
| Minimum Stability                                                          | 项目的最小稳定性                                                                    | beta、alpha 或 dev，但大部分项目推荐 stable                                                                                                       |
| License                                                                    | 项目使用什么许可证                                                                  | MIT、GPL 等。如果不确定，可以选择 MIT，因为它简单且宽松                                                                                           |
| Define your dependencies                                                   | 是否希望手动定义项目的依赖项                                                        | 如果你知道自己要安装的依赖库，可以选择 yes，然后输入依赖包的名称和版本号。如果暂时不确定，可以选择 no，之后可以随时通过 composer require 添加依赖 |
| Would you like to define your dev dependencies (require-dev) interactively | 是否希望定义开发依赖                                                                | 仅在开发过程中使用的依赖项，比如测试工具（如 PHPUnit）。如果你需要测试或调试工具，可以在此处添加                                                  |
| Add PSR-4 autoload mapping? Maps namespace to subdirectory                 | 是否希望定义自动加载的 PSR-4 映射                                                   | 你可以设置自己的命名空间和对应的文件夹                                                                                                            |
| Summary of settings                                                        | 会列出你填写的信息摘要供你确认。检查所有信息是否正确，并确认生成 composer.json 文件 | yes                                                                                                                                               |

# 提交到 GitHub 或其他版本控制系统

将你的项目提交到 GitHub 或其他版本控制系统。确保你的 composer.json 文件在根目录下。

> 建议上传到 GitHub 中，关于无法访问的问题详见 [如何实现科学上网](/posts/e8c50aef.html)

# 发布到 Packagist

- 在 [Packagist](https://packagist.org) 上注册一个帐户。

- 登录后，点击右上角的 “Submit” 按钮后提交自己的 Git 链接即可发布

# 后续建议

## 发布版本

### 为什么要在 GitHub 上发布版本？

为了管理每次更新的内容，建议在 GitHub 中发布版本，这样做有以下几种好处

- **可追溯性**：每个版本都可以追踪到特定的提交，方便用户查看变更。
- **文档**：可以为每个版本添加发布说明，告知用户新版本的功能和修复。
- **整合**：与 Composer 的版本管理系统无缝集成，方便用户在 Composer 中安装特定版本。

### 如何在 GitHub 上发布版本？

#### 创建一个标签：

```bash
## 在终端中导航到你的项目目录，并确保在你想要发布的版本上
git checkout main
## 创建一个 Git 标签，命名为你的版本号（例如 v1.0.0）
git tag v1.0.0
## 将标签推送到 GitHub
git push origin v1.0.0
```

#### 在 GitHub 上创建发行版：

- 登录到你的 GitHub 仓库。
- 点击“Releases”选项卡。
- 点击“Draft a new release”按钮。
- 选择刚刚创建的标签（例如 v1.0.0）。
- 填写发行说明，简要描述该版本的新功能、修复或变更。
- 点击“Publish release”按钮。

#### 维护版本

每次更新你的代码并希望发布新版本时，重复以上步骤创建新的标签和发行版。

你可以使用语义版本控制（如 MAJOR.MINOR.PATCH）来管理版本号。
