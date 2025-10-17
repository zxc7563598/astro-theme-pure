---
title: '订单号老是撞车？我写了个通用 PHP ID 生成器'
publishDate: '2025-08-23 09:02:10'
description: '写项目时总要生成各种 ID：订单号、日志标识、用户编号……为了解决这些小烦恼，我做了一个 PHP ID 生成器，支持雪花算法、时间戳、UUID 等多种方式，还能自定义扩展，用起来简单，也方便以后维护'
tags:
  - PHP
  - Composer
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '697aafe5'
---

在日常开发里，我们经常会遇到这种情况：

- 需要给**订单**生成唯一编号；
- 想给**日志**或者**资源**加个标识；
- 或者需要一个**不会重复的 ID**，用作数据库主键。

一开始，我也用过 `time()` 拼接随机数、或者 `uniqid()`。  
这些方案在小项目里够用，但一旦放到并发稍微高点的业务里，就会出现各种问题：

- ​`time()` 很容易撞车（同一毫秒可能生成多个）；
- ​`uniqid()` 看上去独特，其实也可能重复，而且格式不太好看；
- 有些场景希望 ID **可读**，比如订单号，最好一眼能分辨。

久而久之，我在不同项目里反复造轮子，干脆就写了一个通用的小工具，把常见的 ID 生成方式都封装起来了。

---

## 这个工具能做什么？

它支持几种常见的生成策略：

### 1. Snowflake（雪花算法）

- 经典的分布式 ID 算法；
- 生成的 ID 在高并发下也能保持唯一。

```php
use Hejunjie\IdGenerator\IdGenerator;

$generator = new IdGenerator::make('snowflake')
$id = $generator->generate();

echo $id; // 233953299479035905
```

还能解析出来生成时间、机器 ID 等信息，排查问题时很方便。

---

### 2. Timestamp（时间戳 ID）

- 由时间戳+序列号构成；
- 可以加前缀，比如生成订单号：

```php
use Hejunjie\IdGenerator\IdGenerator;

$generator = new IdGenerator::make('timestamp', ['prefix' => 'ORD']);
$id = $generator->generate();

echo $id; // ORD1755778813238294503
```

---

### 3. Readable（可读 ID）

- 格式类似：`ORD-20250822-abcdef12`；
- 适合展示给用户，更容易记忆。

```php
use Hejunjie\IdGenerator\IdGenerator;

$generator = new IdGenerator::make('readable', ['prefix' => 'ORD', 'randomLength' => 6]);
$id = $generator->generate();

echo $id; // ORD-2025-08-21-7ABP01
```

---

### 4. UUID

- 熟悉的 UUID v1/v4；
- 通用，跨系统时尤其常见。

```php
use Hejunjie\IdGenerator\IdGenerator;

$generator = new IdGenerator::make('uuid', ['version' => 'v4']);
$id = $generator->generate();

echo $id; // ad0f5dfc-4a3d-4c2a-853b-aa3a3d9062aa
```

---

### 5. 自定义策略

如果你想要特别的格式，比如 `USER-随机数`，也能自己实现。

```php
use Hejunjie\IdGenerator\Contracts\Generator;
use Hejunjie\IdGenerator\IdGenerator;

class MyCustomGenerator implements Generator
{
    public function __construct(private string $prefix = 'MY') {}

    public function generate(): string
    {
        return $this->prefix . '-' . random_int(1000, 9999);
    }
    public function parse(string $id): array
    {
        return ['id' => $id];
    }
}

IdGenerator::registerStrategy('custom', function (array $config) {
    return new MyCustomGenerator($config['prefix'] ?? 'MY');
});

$generator = new IdGenerator::make('custom', ['prefix' => 'ORD']);
$id = $generator->generate();

echo $id; // ORD-4128
```

---

## 为什么要做这个库？

没有什么“高大上”的理由，就是因为自己项目里老是遇到这种需求：

- 想要一个**统一**的生成方式，避免东拼西凑；
- 想要**可扩展**，方便以后加新的策略；
- 想要**轻量**，直接安装就能用，不依赖庞大的框架。

于是就写了这么个东西，后来觉得或许对别人也有用，就开源了。

---

## 安装方式

```bash
composer require hejunjie/id-generator
```

---

## 最后

这个小工具库目前还是 v1.0.0，功能比较基础。  
如果你在项目里也有类似需求，可以拿来试试看。  
要是你有更好的想法（比如加 ULID、新的生成算法等），非常欢迎提 PR 或者 Issue，一起完善。

项目地址 👉 [zxc7563598/php-id-generator](https://github.com/zxc7563598/php-id-generator)
