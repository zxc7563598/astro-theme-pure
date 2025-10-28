---
title: 收藏版：Phinx 数据库迁移完全指南
publishDate: 2025-10-28 10:30:12
description: '一篇能直接上手的 Phinx 数据库迁移完整指南，涵盖表结构创建、字段类型、参数说明与实用技巧。不用翻文档，照着写就能跑'
tags:
  - PHP
  - MySQL
language: '中文'
heroImage: { src: './cover/mysql.png', color: '#01618d' }
draft: false
slug: 'd92j5hsf'
---

最近在维护老项目时，又一次用到了 **Phinx**。
这个工具我已经用了很多年，几乎每个项目都会用上它。它属于那种**平时不常用，但每个项目都离不开** 的工具。

问题在于，它用得不频繁，每次写迁移脚本时总会忘记某个参数怎么写、某个字段该用什么类型。
这些当然可以去查官方文档，但 Phinx 的文档虽然内容齐全，却总让我觉得**信息分散、查起来不够顺手**。

于是，我干脆花点时间，把自己常用的命令、配置方式、字段类型和参数说明都系统地整理了一遍。
一方面方便自己查阅，另一方面也希望能帮到同样在项目中使用 Phinx 的开发者。

如果你也在 PHP 项目里用 Phinx 管理数据库迁移，这篇文章或许能成为你的「快捷参考手册」。

---

## 前期配置

### 安装 Phinx

```bash
composer require robmorgan/phinx
```

### 初始化配置

执行初始化命令：

```shell
vendor/bin/phinx init
```

该命令会在项目根目录下生成一个 `phinx.php` 配置文件。  
配置文件中：

- ​`paths` 用于指定迁移脚本与填充脚本的路径；
- ​`environments` 用于定义不同环境（例如开发、测试、生产）的数据库配置；
- 若执行迁移命令时不指定环境，则默认使用 `default_environment` 指定的环境。

---

### 环境配置与 .env 支持

为了统一管理数据库配置，我习惯用 `.env` 文件来维护连接信息。  
但由于 `phinx` 脚本并不运行在 PHP 框架生命周期内，常见的 `.env` 加载方式（如 Laravel 的）无法直接使用，因此我通常会额外安装 `vlucas/phpdotenv`：

```bash
composer require vlucas/phpdotenv
```

然后在 `phinx.php` 中添加如下配置：

```php
<?php
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();
return [
    "paths" => [
        "migrations" => "database/migrations",
        "seeds" => "database/seeds"
    ],
    "environments" => [
        "default_migration_table" => "phinxlog",
        "default_environment" => "production",
        "production" => [
            "adapter" => "mysql",
            "host" => $_SERVER['DB_HOST'],
            "name" => $_SERVER['DB_NAME'],
            "user" => $_SERVER['DB_USER'],
            "pass" => $_SERVER['DB_PASS'],
            "port" => $_SERVER['DB_PORT'],
            "charset" => $_SERVER['DB_CHARSET']
        ]
    ]
];
```

---

## 常用命令

### 创建迁移文件

```shell
vendor/bin/phinx create 迁移名称
```

Phinx 会自动根据时间戳与名称生成迁移文件。  
命名建议保持统一规范：

- **创建表**：`Create + 表名` → 例如 `CreateUsersTable`​
- **修改表**：`Modify + 表名 + 操作` → 例如 `ModifyUsersAddStatus`​
- **删除表**：`Delete + 表名` → 例如 `DeleteOldLogsTable`​

> Phinx 会自动将大驼峰命名转为蛇形文件名，例如 `CreateUsersTable` → `20251028123045_create_users_table.php`​

---

### 执行迁移

没什么好说的，执行这个命令即可执行迁移

```shell
vendor/bin/phinx migrate
```

参数说明：

- ​`-e`：指定环境（默认 `production`）
- ​`-t`：指定执行到的版本号（不传则执行到最新）
- ​`--dry-run`：仅打印 SQL 而不实际执行

> 注意：`-t` 不是只执行单个版本，而是顺序执行直到目标版本号为止。

---

### 设置断点（Breakpoint）

生产环境中执行迁移后，建议立刻设置断点。  
断点能防止误操作导致大规模回滚。

```bash
vendor/bin/phinx breakpoint
```

参数：

- ​`-e` 环境名
- ​`-t` 版本号
- ​`-r` 删除断点

---

### 回滚迁移

**慎用！**  
迁移的回滚会撤销数据库结构更改，例如删除表或字段，表中数据会全部丢失。  
**生产环境不建议直接回滚**，而是通过新的迁移来完成结构恢复。

```bash
vendor/bin/phinx rollback
```

参数说明：

- ​`-e` 环境名
- ​`-t` 指定版本号（或 `0` 回滚全部）
- ​`-d` 按日期回滚（`YYYYmmddHHiiss`）
- ​`-f` 强制回滚（忽略断点）
- ​`--dry-run` 仅打印 SQL 不执行

---

### 查看状态

用于查看迁移执行状态，确认哪些迁移尚未执行。

```shell
vendor/bin/phinx status
```

参数说明：

- `-e`：环境名

### 创建填充（Seeder）

```bash
vendor/bin/phinx seed:create 填充名称
```

命名建议使用表名 + 填充描述，例如：

```
UsersAddDemoDataSeeder
```

执行填充：

```bash
vendor/bin/phinx seed:run
```

参数：

- ​`-e` 指定环境
- ​`-s` 指定执行的 Seeder，可多次传入

---

## 迁移脚本详解

### 支持的字段类型

Phinx 在 MySQL 下支持的字段类型如下：

| 类型             | MySQL 类型   | 必需参数              | 说明               |
| ---------------- | ------------ | --------------------- | ------------------ |
| ​`smallinteger`​ | SMALLINT     | —                     | 小整数             |
| ​`integer`​      | INT          | —                     | 常规整数           |
| ​`biginteger`​   | BIGINT       | —                     | 大整数             |
| ​`float`​        | FLOAT        | —                     | 单精度浮点数       |
| ​`double`​       | DOUBLE       | —                     | 双精度浮点数       |
| ​`decimal`​      | DECIMAL(M,D) | ​`precision`,`scale`​ | 定点小数（金额等） |
| ​`bit`​          | BIT          | —                     | 位字段             |
| ​`boolean`​      | TINYINT(1)   | —                     | 布尔值（0/1）      |
| ​`char`​         | CHAR(n)      | ​`limit`​             | 定长字符串         |
| ​`string`​       | VARCHAR(n)   | ​`limit`​             | 可变长度字符串     |
| ​`text`​         | TEXT         | —                     | 文本               |
| ​`enum`​         | ENUM(...)    | ​`values`​            | 枚举类型           |
| ​`set`​          | SET(...)     | ​`values`​            | 集合类型           |
| ​`uuid`​         | CHAR(36)     | —                     | UUID字符串         |
| ​`date`​         | DATE         | —                     | 日期               |
| ​`time`​         | TIME         | —                     | 时间               |
| ​`datetime`​     | DATETIME     | —                     | 日期与时间         |
| ​`timestamp`​    | TIMESTAMP    | —                     | 时间戳             |
| ​`binary`​       | BINARY(n)    | ​`limit`​             | 定长二进制数据     |
| ​`blob`​         | BLOB         | —                     | 二进制大对象       |
| ​`tinyblob`​     | TINYBLOB     | —                     | 小型二进制         |
| ​`mediumblob`​   | MEDIUMBLOB   | —                     | 中型二进制         |
| ​`longblob`​     | LONGBLOB     | —                     | 超大二进制         |
| ​`json`​         | JSON         | —                     | JSON 数据类型      |

---

### 常用字段参数

| 参数名             | 类型         | 说明                                                            |
| ------------------ | ------------ | --------------------------------------------------------------- |
| ​`limit / length`​ | int          | 长度或字节限制                                                  |
| ​`default`​        | mixed        | 默认值                                                          |
| ​`null`​           | bool         | 是否允许为 NULL                                                 |
| ​`after`​          | string       | 放置在某个字段之后（或 \Phinx\Db\Adapter\MysqlAdapter::FIRST ） |
| ​`comment`​        | string       | 字段注释                                                        |
| ​`precision`​      | int          | 小数总位数                                                      |
| ​`scale`​          | int          | 小数位数                                                        |
| ​`signed`​         | bool         | 是否允许负数                                                    |
| ​`values`​         | array/string | 枚举或集合可选值，英文逗号隔开的字符串或数组                    |
| ​`identity`​       | bool         | 是否自增（需搭配 null:false）                                   |

### 各种操作调用代码

> 如果对表格形式不感兴趣，可以直接通过以下完整迁移脚本理解字段定义方式。

```php
<?php

declare(strict_types=1);

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

final class CreateTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        // 前置说明：
        // create() 操作: 表不存在的情况下，创建表，并保存字段操作
        // update() 操作: 表存在的情况下，变更表，并保存字段操作
        // 所有的操作记得到最后一定需要对构建的表对象执行保存操作，否则不会执行

        // 判断表是否存在: $this->hasTable('table_name');

        // 删除表: $this->table('table_name')->drop()->save();

        // 构建表
        $table = $this->table('table_name', ['id' => 'table_id', 'comment' => '这是 table 表']);
        // 第二个参数字段，可不传，主要用于在 create() 时构建表级的基本信息
        // 支持的参数：
        // id:            主键 ID 列，传入字符串或者布尔类型
        //                    如果是字符串：按照字符串内容创建自增主键
        //                    如果是false：不自动创建主建
        //                    如果不传：自动创建名称为 id 的自增主键
        // comment:       设置表的注释
        // row_format:    设置表的行格式（MySQL 特有，例如 DYNAMIC, COMPACT, REDUNDANT, COMPRESSED）
        // engine:        设置表的存储引擎（MySQL 特有，例如 InnoDB, MyISAM, MEMORY）
        // collation:     设置字符集的排序规则，默认 utf8mb4_unicode_ci
        // signed:        整数类型是否允许负数，默认 false
        // limit:         设置主键最大长度

        // 变更表注释
        $table->changeComment('这是 table 表新的注释');
        // 更改主键，可以设置多个列组联合主键
        $table->changePrimaryKey(['new_id']);
        // 重命名表
        $table->rename('new_table_name');

        // 检查字段是否存在：$table->hasColumn('username');

        // 重命名字段
        $table->renameColumn('老字段名', '新字段名');

        // 删除字段
        $table->removeColumn('字段名');

        // 添加字段
        $table->addColumn('字段名', '类型', ['参数'])
              ->addColumn('avatar', 'string', ['comment' => '头像', 'null' => true, 'after' => 'name'])
              ->addColumn('created_at', 'integer', ['comment' => '创建时间', 'null' => false, 'limit' => MysqlAdapter::INT_BIG]);
        // 类型：
        // 很多不必要或可以简化定义的类型，例如数字方面，可以全部都设置为 `integer` 通过 `limit` 参数设置长度即可自动创建对应类型
        // 以下是支持的类型：
        // smallinteger(SMALLINT):  小整数
        // integer(INT):            常规整数
        // biginteger(BIGINT):      大整数
        // float(FLOAT):            单精度浮点数
        // double(DOUBLE):          双精度浮点数
        // decimal(DECIMAL(M,D)):   定点小数，必须携带 `precision` 与 `scale` 参数
        // bit(BIT):                位字段
        // boolean(TINYINT(1)):     布尔值（0/1）

        // char(CHAR(n)):           定长字符串，必须携带 `limit` 参数
        // string(VARCHAR(n)):      可变长度字符串，必须携带 `limit` 参数
        // text(TEXT):              文本
        // enum(ENUM(...)):         枚举类型，必须携带 `values` 参数
        // set(SET(...)):           集合类型，必须携带 `values` 参数
        // uuid(CHAR(36)):          UUID字符串

        // date(DATE):              日期（YYYY-MM-DD）
        // time(TIME):              时间（HH:MM:SS）
        // datetime(DATETIME):      日期与时间
        // timestamp(TIMESTAMP):    时间戳

        // binary(BINARY(n)):       定长二进制数据，必须携带 `limit` 参数
        // blob(BLOB):              二进制大对象
        // tinyblob(TINYBLOB):      小型二进制
        // mediumblob(MEDIUMBLOB):  中型二进制
        // longblob(LONGBLOB):      超大二进制
        // json(JSON):JSON          数据类型

        // 参数：
        // 以下是支持的参数：
        // limit / length:          长度，int 类型，内容跟随字段类型变化
        // default:                 默认值，类型根据字段类型变化
        // null:                    是否允许为 null，bool 类型，true 或者 false
        // after:                   指定字段应该放在哪个列之后，string 类型传递列名，或者 \Phinx\Db\Adapter\MysqlAdapter::FIRST
        // comment:                 字段注释，string 类型
        // precision:               结合 scale 设置小数精度，int 类型
        // scale:                   结合 precision 设置小数精度，int 类型
        // signed:                  是否允许负数，bool 类型
        // values:                  枚举类型，可以是英文逗号分隔的string，或array
        // identity:                数字类型自增长，bool类型，需要设置 null:false

        // 修改字段
        $table->changeColumn('字段名', '类型', ['参数']);

        // 设置索引
        $table->addIndex(['字段名']);

        // 删除索引
        $table->removeIndex(['字段名']);
        // 或者
        $table->removeIndexByName('索引名');
    }
}
```

## 填充脚本（Seeder）示例

```php
<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

class TableAddDemoDataSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * https://book.cakephp.org/phinx/0/en/seeding.html
     */
    public function run(): void
    {
        // 构建数据
        $data = [
            [
                'body'    => 'foo',
                'created' => date('Y-m-d H:i:s'),
            ],
            [
                'body'    => 'bar',
                'created' => date('Y-m-d H:i:s'),
            ]
        ];
        // 构建表
        $table = $this->table('table_name');

        // 添加数据，并保存
        $table->insert($data)
              ->saveData();

        // 清空表中的所有数据
        $table->truncate();
    }
}
```

## 老项目迁移接入

如果你是从已有数据库切换到 Phinx，可使用 [`phinx-migrations-generator`](https://github.com/odan/phinx-migrations-generator) 自动生成迁移文件。

```bash
composer require odan/phinx-migrations-generator --dev
```

它会直接读取现有的 `phinx.php` 配置，无需额外设置。  
执行以下命令即可生成当前数据库结构的迁移文件：

```bash
vendor/bin/phinx-migrations generate
```

---

## 最后

Phinx 是一个非常轻量却强大的迁移工具，适用于几乎所有独立 PHP 项目。  
写这篇笔记的初衷很简单——自己每次都要重新翻文档太麻烦了，不如干脆整理一份系统化的版本。  
如果你也有相同的困扰，希望这篇文章能让你变得方便一些
觉得有用的话，别忘了收藏这篇文章～
更多内容可以在我的网站 [https://hejunjie.life](https://hejunjie.life) 查看