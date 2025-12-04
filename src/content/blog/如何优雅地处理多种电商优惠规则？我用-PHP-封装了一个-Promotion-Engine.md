---
title: '如何优雅地处理多种电商优惠规则？我用 PHP 封装了一个 Promotion Engine'
publishDate: '2025-08-01 13:49:04'
description: '一个用 PHP 编写的电商优惠计算库，支持满减、打折、VIP 优惠等多种规则，并提供独立、折上折、锁定三种计算模式，让促销逻辑更清晰可控'
tags:
  - PHP
  - Composer
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: 'bfc6fc'
---

做电商项目时，经常要处理各种各样的优惠活动：满减、打折、VIP 专属优惠、第二件特价、阶梯优惠……  
这些单独实现起来都不复杂，但当你把它们放在一起，就变得混乱起来了。

我自己在工作里写过不少类似的逻辑，每次做法差不多：`if/else`、`switch`、各种判断混在一起，过几个月回头看代码，根本不想维护。  
于是我干脆写了一个小库，封装了常见的优惠计算逻辑，让这件事更清晰，也能随时在别的项目里用——**[php-promotion-engine](https://github.com/zxc7563598/php-promotion-engine)** 就是这样来的。

---

## 为什么要做这个东西？

一个简单的例子：

> - 购物车里有满 200 减 50 的活动
> - VIP 用户可以再打 9 折
> - 某些商品买三件还能再减 20

这三个优惠叠在一起，怎么算？

- 是每条规则单独算优惠，最后加在一起？
- 还是「满减后再打折」的折上折？
- 或者一件商品只能享受其中一种优惠？

业务里经常会遇到这些问题，而我不想再每个项目都重新造轮子，所以就抽了一个核心逻辑出来，做成 Composer 包。

---

## 我把优惠计算分成了三种模式

**1. 独立模式（independent）**

每条优惠规则都**基于商品原价**独立计算优惠金额，最后把这些金额加起来。

**特点：**

- 所有优惠平行计算，彼此之间没有影响
- 优惠金额往往会比较大（因为每条规则都按原价算）
- 运营活动彼此独立时，通常用这种模式

**例子**：

- 购物车 300 元，满 200 减 50，VIP 9 折
- 「满减」算 50 元优惠
- 「VIP」算 30 元优惠（300元 - 300 元 × 0.9）
- 最后优惠金额是 80 元，结果是 **220 元**

---

**2. 折上折模式（sequential）**

这里的优惠是「顺序计算」的，每条规则会根据**上一条规则之后的价格**来继续打折或满减。

很多电商活动是顺序叠加的，比如「满减后再打折」，这就是折上折模式的用武之地。

**特点：**

- **优惠金额会按比例分摊给参与优惠的商品，并实时更新商品价格**
- 下一条规则拿到的是**更新后的价格**，真正意义上的“折上折”
- 可能出现这样一种情况：
  - 原价满足满减 → 满减后价格降低 → 后面的优惠金额也变少

- 也可能出现：
  - 某个商品满减后价格降低，**下一条满减规则再也不满足条件**

**例子**：

- 购物车 300 元，满 200 减 50，VIP 9 折
- 「满减」算 50 元优惠
- 「VIP」算 25 元优惠（250 元 - 250 元 × 0.9）
- 最终优惠金额是 **75 元**（比独立模式的 80 元少）

---

**3. 锁定模式（lock）**

这个模式更“严格”——**每件商品最多只能享受一条优惠规则**。  
一旦被某个优惠“锁定”，这件商品就不再参与其他规则的计算。

**特点：**

- 适用于「只能享受一次优惠」的场景（比如秒杀、专属券）
- 优惠不会叠加，运营逻辑更容易控制

**例子**：

- A 商品被秒杀价锁定，B 商品参与满减
- 即使后面有 VIP 折扣，A 商品也不会再打折

---

这样拆分之后，**电商里的几乎所有优惠场景都能归到这三类模式之一**，只需要在引擎里 `setMode()` 一下，就能决定计算方式。

---

## 怎么用？

安装方式很简单：

```bash
composer require hejunjie/promotion-engine
```

然后可以直接写：

```php
use Hejunjie\PromotionEngine\PromotionEngine;
use Hejunjie\PromotionEngine\Rules\FullReductionRule;
use Hejunjie\PromotionEngine\Rules\VipDiscountRule;
use Hejunjie\PromotionEngine\Models\Cart;
use Hejunjie\PromotionEngine\Models\User;

// 创建一个购物车模型，实际场景中使用需要计算商品的名称/价格/购买数量执行即可
// 可以通过第四个参数来设置标签，执行规则时可以设置需要执行的标签，标签支持设置多个
$cart = new Cart();
$cart->addItem('T恤', 120, 1, ['tag']);
$cart->addItem('牛仔裤', 150, 1, ['tag','promo']);

// 创建一个用户模型，实际场景中仅是用来区分用户是否可以享受关于VIP折扣方面的规则
// 如果没有设置VIP折扣方面的规则，则不会影响任何数据
$user = new User(vip: true);

$engine = new PromotionEngine();
$engine->setMode('sequential'); // 选择折上折模式
$engine->addRule(new Rules\FullReductionRule(100, 30, ['promo'], 1)); // 满 200 减 50, 仅适用于有 promo 标签的商品, 执行顺序 1（数字越小越先执行）
$engine->addRule(new Rules\VipDiscountRule(0.9, ['tag'], 2));      // VIP 9 折, 仅适用于有 tag 标签的商品, 执行顺序 2（数字越小越先执行）

$result = $engine->calculate($cart, $user);

print_r(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
```

你会得到类似这样的结果：

```
{
    "original": 270,
    "discount": 54,
    "final": 216,
    "details": [
        "指定商品满100减30 (-¥30)",
        "VIP 0.9 折 (-¥24)"
    ],
    "items": [
        {
            "name": "T恤",
            "price": 108,
            "qty": 1,
            "tags": [
                "tag"
            ],
            "original_price": 120,
            "locked": false
        },
        {
            "name": "牛仔裤",
            "price": 108,
            "qty": 1,
            "tags": [
                "tag",
                "promo"
            ],
            "original_price": 150,
            "locked": false
        }
    ]
}
```

---

## 这个库能带来什么？

- **代码更干净**：不用每次都写一堆 `if/else`，逻辑集中在「规则类」里。
- **模式可切换**：想独立算就 `independent`，想折上折就 `sequential`，换个模式就行。
- **扩展方便**：有新活动？直接加个规则类，比如「第 N 件打折」「阶梯满减」，不用动核心逻辑。

---

## 最后

这个库不是大而全的框架，就是一个**我在工作中常用到的小工具**，我把它整理出来放到 GitHub 上，希望以后别的项目也能用得上，也欢迎你们试试看。

GitHub 地址在这里：[https://github.com/zxc7563598/php-promotion-engine](https://github.com/zxc7563598/php-promotion-engine)

如果你有建议、发现了 bug，或者有好玩的规则想加进来，欢迎 PR。
