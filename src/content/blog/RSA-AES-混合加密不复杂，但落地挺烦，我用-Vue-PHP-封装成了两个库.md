---
title: 'RSA+AES 混合加密不复杂，但落地挺烦，我用 Vue+PHP 封装成了两个库'
publishDate: '2025-08-28 19:23:39'
description: 'RSA+AES 混合加密大家都懂，真正用在项目里却有点繁琐。于是我写了 Vue 前端 npm 包和 PHP 后端库，帮忙处理加解密、签名、时间戳校验，开箱即用'
tags:
  - PHP
  - NodeJs
  - Composer
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '9634b05b'
---

在项目里写接口的时候，我有时候会希望**再多一层保护**。  
虽然 HTTPS 已经能保证传输安全，但它解决的更多是「传输过程中不被窃听/篡改」的问题。  
而我还想顺带做到几点：

- 防止接口被随便模拟调用
- 就算数据包被截获，也看不懂内容
- 就算有人拿着同一份请求去重放，服务端也能拒绝

这些需求其实挺常见的，但并不复杂，说白了就是一套 **RSA+AES 混合加密**。

---

## 经典的思路

原理本身没什么新鲜的：

- 每次请求生成一个随机 AES Key
- 用 AES 加密数据
- 再用 RSA 公钥把 AES Key 加密后传给后端
- 后端用 RSA 私钥解密出 AES Key，再还原请求体

这是标准做法，网上能搜到很多讲解。

---

## 真正麻烦的地方

难点其实不在原理，而是在项目里真正用的时候。

比如要自己实现，就得写：

- 每次生成随机 AES Key
- RSA 公钥加密 AES Key
- AES 加密/解密请求体
- 签名计算、时间戳校验，避免重放
- 各种异常处理（签名错、时间戳过期、解密失败）

单看每一块都不复杂，但组合在一起就有点烦。  
而且这些逻辑和业务关系不大，却不得不散落在代码里。

---

## 我做的小工具

为了省事，我干脆把它们封装成了前后端两个库：

- 前端是一个 npm 包
- 后端是一个 PHP 的 Composer 库

目标就是：**用起来跟普通请求没什么两样，但底层自动帮你做了加解密和校验**。

---

## 用法示例

前端：

```bash
npm install hejunjie-encrypted-request
```

```ts
import { encryptRequest } from "hejunjie-encrypted-request";

# 不建议在代码里写死公钥，建议通过读取文件来获取公钥字符串
const encrypted = encryptRequest({ name: "张三" }, {
  publicKey: "-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----",
});

request.post("/api/user/info", encrypted)
  .then(res => console.log(res));
```

后端：

```bash
composer require hejunjie/encrypted-request
```

```php
use Hejunjie\EncryptedRequest\EncryptedRequestHandler;

// 自行在中间件或方法前完成请求参数的获取
$param = $_POST;

// 同样不建议代码里写死私钥
// 要么私钥作为 RSA_PRIVATE_KEY 放在.env里（此方法就无需再传递$config）
// 要么直接读取文件作为配置传递
$config = [
    'RSA_PRIVATE_KEY' => file_get_contents(private_key.pem)
];
$handler = new EncryptedRequestHandler($config);
$data = $encrypted->handle($param['en_data'] ?? '', $param['enc_payload'] ?? '', $param['timestamp'] ?? '', $param['sign'] ?? '');

print_r($data); // ['name' => '张三']
```

开发者只需要像平时一样写请求，库会自动处理 AES/RSA 加解密、签名、时间戳校验、异常。

---

## 适合的场景

这个方案当然不是替代 HTTPS，而是作为**额外的一层保护**：

- 内部系统，不希望接口被随便重放/模拟
- 中小项目，对安全有点额外要求，但不想上很重的安全框架
- 想快速把 RSA+AES 混合加密落地，而不用自己重复造轮子

---

## 仓库地址

- 前端仓库：[npm-encrypted-request](https://github.com/zxc7563598/npm-encrypted-request)
- 后端仓库：[php-encrypted-request](https://github.com/zxc7563598/php-encrypted-request)

希望能帮到和我一样遇到类似需求的人。
