---
title: '构建一个简洁优雅的 PHP 参数验证器 —— php-schema-validator'
publishDate: '2025-08-07 15:36:11'
description: '一个轻量、可扩展的 PHP 参数验证器，支持规则数组定义和自定义扩展，适用于非框架项目的数据校验场景'
tags:
  - PHP
  - Composer
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: 'a45e4e99'
---

在日常开发中，参数校验是绕不过的一道坎。我们常常需要确保用户传入的数据符合预期格式，比如必填字段、数据类型、最大长度、邮箱格式等等。虽然许多 PHP 框架都内置了验证器，但在开发轻量服务、非框架项目，或需要在业务中后端进行结构化数据校验时，我总觉得现有方案不够灵活、冗余较多。

于是，我动手写了一个开箱即用、易扩展、轻量级的参数验证器：**[php-schema-validator](https://github.com/zxc7563598/php-schema-validator)**

---

## 为什么要造这个轮子？

虽然 PHP 社区有很多验证类库（如 Laravel 的 Validator、Respect\\Validation、Opis JSON Schema 等），但它们往往：

- 要么依赖框架，不方便独立使用；
- 要么语法冗长，无法用简洁的规则表达复杂校验；
- 要么扩展性差，自定义规则成本高。

我想要一个东西，**既能用类似 JSON Schema 的方式表达规则，又能非常容易地扩展，同时尽量保持核心代码简洁明了。**   
于是这个项目诞生了。

---

## 核心设计理念

这个库的核心目标可以总结为三句话：

1. **规则驱动** —— 用数组描述你的字段规则，声明式更直观；
2. **可扩展** —— 每一个验证规则都是独立的类，插件化设计；
3. **无依赖** —— 不依赖框架，适用于任意 PHP 项目。

安装方式很简单：

```bash
composer require hejunjie/schema-validator
```

一个简单示例：

```php
use Hejunjie\SchemaValidator\Validator;
use Hejunjie\SchemaValidator\Exceptions\ValidationException;

$data = [
    'name'   => '张三',
    'age'    => 28,
    'email'  => 'invalid-email',
];

// 自定义扩展，返回 true 则规则通过，否则均视为不通过
Validator::extend('is_zh', function ($field, $value, $params = null) {
    if (preg_match('/^[\x{4e00}-\x{9fa5}]+$/u', $value)) {
        return true;
    }
});

try {
    Validator::validate($data, [
        'name'  => ['is_zh', 'string', 'minLength:2'],
        'age'   => ['integer', 'between:18,60'],
        'email' => ['required', 'email'],
    ]);
    echo "验证通过 ✅";
} catch (ValidationException $e) {
    echo "验证失败 ❌" . PHP_EOL;
    print_r($e->getErrors());  // 友好打印错误信息
}
```

输出类似：

```
验证失败 ❌
Array
(
    [email] => Array
        (
            [0] => email
        )

)
```

---

## 支持的验证规则

目前内置了这些基础规则（并持续扩展中）：

- **类型类**：支持 `string` / `integer` / `boolean` / `array` / `object` / `float` / `numeric`​
- **比较类**：支持 `min` / `max` / `between` / `length` / `min_length` / `max_length` / `gt` / `lt` / `gte` / `lte`​
- **格式类**：支持 `email` / `mobile` / `url` / `ip` / `json` / `alpha` / `alpha_num` / `alpha_dash`​
- **布尔类**：支持 `required` / `accepted` / `declined`​
- **自定义类**：支持 `starts_with` / `ends_with` / `contains`​

---

## 如何扩展一个自定义规则？

比如我想加一个 `is_zh`（只允许输入中文）规则：

```php
use Hejunjie\SchemaValidator\Validator;

// 在调用 Validator::validate 之前
Validator::extend('is_zh', function ($field, $value, $params = null) {
    if (preg_match('/^[\x{4e00}-\x{9fa5}]+$/u', $value)) {
        return true;
    }
});
```

然后就可以直接使用：

```php
use Hejunjie\SchemaValidator\Validator;
use Hejunjie\SchemaValidator\Exceptions\ValidationException;

try {
    Validator::validate($data, [
        'name'  => ['is_zh'],
    ]);
	// 验证成功
} catch (ValidationException $e) {
	// 验证失败
}
```

> 如果有常用自定义规则，建议在代码中封装 `Validator::validate` 方法，在调用 `validate` 之前通过 `extend` 方法注册自定义规则

> 在常驻内存的项目中，建议在项目运行初始化时全局注册，以减小性能开销

---

## 项目地址 & 使用方式

GitHub 仓库地址：  
🔗 [https://github.com/zxc7563598/php-schema-validator](https://github.com/zxc7563598/php-schema-validator)

欢迎 Star、提 Issue、提 PR！

---

## 下一步计划

我还在考虑以下几点：

- 错误信息多语言支持
- Laravel / Webman / Hyperf 插件适配
- 添加更多内置规则（银行卡号、身份证号、UUID 等）
- 将 schema 校验支持 YAML / JSON 文件描述

---

## 最后

这是一个“造轮子”项目，但也是一个“实践设计”的项目。如果你也曾因为参数验证的重复劳动而烦恼，不妨来试试这个轻量、可扩展的验证器。

如果这个库对你有帮助，欢迎 Star、提建议或一起共建 🚀
