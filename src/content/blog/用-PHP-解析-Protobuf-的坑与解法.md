---
title: '用 PHP 解析 Protobuf 的坑与解法'
publishDate: '2025-12-12 14:59:01'
description: '分享 PHP 解析 Protobuf 的实战经验，涵盖从安装运行时库、生成 PHP 类到序列化/反序列化的完整流程，附示例代码，帮助开发者少踩坑'
tags:
  - PHP
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: 'j4ufbb59'
---

前阵子做的一个直播弹幕的机器人，其中有一部分上游数据是通过 Protobuf 返回的。几个朋友问我怎么处理，但我发现大家对「PHP 解析 Protobuf」这件事多少有点迷糊。确实，PHP 处理 Protobuf 的资料不多，而且踩坑成本不算低。

这篇文章不打算科普什么，也没有推荐任何技术栈的意思，就是把我自己摸索的过程整理出来，给遇到类似问题的人一个参考。

---

## Protobuf 是什么

很多人第一次接触它时，会把它和 JSON、XML 放在一起理解，但 Protobuf 并不是“另一个 JSON”。它是一种 ​**基于 Schema 的二进制数据格式**，本质上由两个部分组成：

- ​`.proto`：数据结构的描述文件（类似字典）
- 二进制格式：根据 `.proto` 规则编码出来的数据

Google 发明它的原因大致是：

- JSON 太大、太慢
- 在高性能、跨语言通信场景里不够理想
- 服务端内部大量 RPC 调用时，序列化效率太重要了

于是有了 Protobuf：数据格式紧凑、序列化速度快、跨语言支持也强。

它不是为了可读性，而是为了性能。

---

## PHP 解析 Protobuf 为什么麻烦

PHP 能解析 Protobuf，但体验不如其他语言。原因有几个，简单列一下：

### PHP 无法动态解析 Schema

像 Go、Python、Java 这类语言可以依靠 descriptor 动态解析 Protobuf 数据结构，甚至可以在运行期处理未知结构。 

PHP 目前做不到，没有暴露那一套 API。

所以 PHP ​**必须依赖 .proto 文件**，并且必须提前用 protoc 生成对应的 PHP 类。

### PHP 的 Protobuf 扩展是“最小实现”

google/protobuf 的 PHP 扩展只提供：

- 序列化：serialize
- 反序列化：mergeFrom
- 基本的 getter/setter 机制

其他高级能力基本没有。

### PHP 的生态也不会把“解析二进制协议”当作主要用途

PHP 的常见使用场景偏 Web，因此处理二进制协议并不是重点。

### 并不是我们主动选择 Protobuf

在一些服务里，上游服务已经定死使用 Protobuf；或者 PHP 服务只是边缘网关，需要解析一次再转发。  

在这种情况下，只有硬着头皮支持。

如果是自己的项目，并没有强约束，其实 JSON 足够了。

---

## PHP 如何使用 Protobuf

我自己在服务器上没有安装 Protobuf 扩展，而是采用更常见的一种方式：

- 本地安装 `protoc`
- 用 `.proto` 文件生成 PHP 类
- 服务器端只需要安装 `google/protobuf` 包即可完成解析

### 第一步：安装运行时库

```bash
composer require google/protobuf
```

这是 PHP 解析 Protobuf 所需的唯一运行时依赖。

### 第二步：安装 protoc（在本地）

protoc 是官方编译器，用于把 `.proto` 文件生成各种语言的类（包括 PHP）。  

下载地址：

[https://github.com/protocolbuffers/protobuf/releases](https://github.com/protocolbuffers/protobuf/releases)

选择对应平台的压缩包，解压后把 `protoc` 放到 PATH 中即可。

验证是否安装成功：

```bash
protoc --version
```

---

## .proto 文件是什么

​`.proto` 文件可以简单理解为“数据结构的一份字典”。

因为 Protobuf 的二进制格式里没有字段名，只有字段编号（tag）。 

例如：

```text
field #1:  123
field #2: "Alice"
```

你不知道 #1 是 `id`​ 还是 `age`​，也不知道 #2 是 `name` 还是别的东西。

所以必须依靠 `.proto` 文件才能解码。

---

## 使用 protoc 生成 PHP 类

我本地的命令大致如下：

```bash
protoc --php_out=./protobuf \
       --proto_path=./protobuf \
       xxx.proto
```

含义如下：

- ​`--php_out`：生成的 PHP 文件存放位置
- ​`--proto_path`​：寻找 `.proto` 的目录
- 多个 .proto 可以一起编译

protoc 会根据 `.proto`​ 内容生成一堆 PHP 类，每个 `message` 对应一个 PHP 类，最终这些类会继承：

```text
Google\Protobuf\Internal\Message
```

序列化、反序列化功能都来自这个基类。

---

## 配置 Composer autoload

如果你希望通过命名空间加载生成的类，可以在 `composer.json` 中加一条：

```json
"autoload": {
    "psr-4": {
        "Proto\\": "protobuf/"
    }
}
```

然后执行：

```bash
composer dumpautoload
```

---

## 在 PHP 中解析 Protobuf

解析的核心方法是：

```php
$msg->mergeFromString($binary)
```

读完后，数据结构会自动填充在 message 对象里。

---

## 在 PHP 中生成 Protobuf 数据

序列化对应的方法是：

```php
$binary = $msg->serializeToString();
```

得到的就是一段 protobuf 二进制字符串，可以直接发送到网络或写入文件。

---

## 快速测试

创建一个项目，目录结构如下：

```bash
.
├── protobuf
│   └── TEST_USER_INFO.proto
└── test.php
```

### TEST\_USER\_INFO.proto

```proto
syntax = "proto3";

option php_namespace = "TestUserInfo";

message User {
  int32 id = 1;
  string name = 2;
}
```

### test.php

```php
<?php

require __DIR__ . '/vendor/autoload.php';

use TestUserInfo\User;

$u1 = new User();
$u1->setId(7);
$u1->setName("PHP Encode Test");

$bin = $u1->serializeToString();

$u2 = new User();
$u2->mergeFromString($bin);

var_dump([
    '原始数据' => bin2hex($bin),
    'id' => $u2->getId(),
    'name' => $u2->getName(),
]);
```

---

### 安装运行时库

```bash
composer require google/protobuf
```

---

### 编译 `.proto` 文件

```bash
protoc --php_out=./protobuf --proto_path=./protobuf TEST_USER_INFO.proto
```

这会在 `protobuf/` 目录下生成 PHP 类文件，供 PHP 使用。

---

### 配置 Composer autoload

在 `composer.json` 中增加命名空间映射，例如：

```json
{
  "require": {
    "google/protobuf": "^4.33"
  },
  "autoload": {
    "psr-4": {
      "GPBMetadata\\": "protobuf/GPBMetadata",
      "TestUserInfo\\": "protobuf/TestUserInfo"
    }
  }
}
```

然后重新加载 Composer 自动加载：

```bash
composer clear-cache && composer dump-autoload -o
```

### 运行测试

```bash
php test.php
```

运行后，你会看到序列化再反序列化的数据被正确输出，证明 PHP 成功处理了 Protobuf 数据。

## 写在最后

PHP 解析 Protobuf 的体验确实不算好，但能用，并且在某些需要兼容上游服务的场景里还是必须用。  
如果你也正在处理类似的数据，希望这篇文章能帮你少踩点坑。

如果感觉文章里哪部分还没说清楚，欢迎继续交流。
