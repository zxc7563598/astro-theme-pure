---
title: 从零开始做 Go 项目：我的目录设计分享
publishDate: 2025-12-01 14:44:37
description: '分享的是我个人在做 Go 项目时整理的目录设计和分层思路，仅供参考，并不是什么绝对正确的做法。如果对你有所启发，那就太好了；如果你有不同的方式，也欢迎交流'
tags:
  - Go
language: '中文'
heroImage: { src: './cover/go.jpg', color: '#06aedc' }
draft: false
slug: 'aod5ngj6'
---


## 为什么要先规划目录结构

刚开始写 Go 项目的时候，我对目录结构这件事格外重视。对于刚入门的人来说，开发过程中几乎每件事情都是第一次：

- 全局配置怎么放？
- 数据库连接怎么初始化？
- Model 怎么设计？
- 路由怎么组织？

每一个点都能让人迷茫。

相比之下，像 Java 的 Spring Boot 或 PHP 的 Laravel 都会给你一套“默认结构”，至少能让你知道应该往哪里放东西。

而 Go 更自由，没有强迫你必须怎么做。对老手是好事，对新手却可能会踩坑。

我的经验是：

**合理的目录结构**  **=**  **清晰的思路 + 舒适的开发体验**

规划好结构之后，你可以把问题拆开逐个去实现，而不是一上来就面对一坨混乱的代码。

---

## 我的 Go 项目目录结构（Gin 示例）

下面是我常用的目录结构，适合大多数中小型 Web 项目：

```
.
├── cmd/              # 项目入口目录
│   └── main.go       # 主程序入口
├── internal/         # 私有代码目录
│   ├── dto/          # 结构体定义目录
│   ├── handler/      # HTTP处理器(等同于Controller)
│   ├── model/        # 数据模型
│   ├── repository/   # 数据模型访问层
│   ├── router/       # 路由
│   └── service/      # 业务逻辑层
├── pkg/              # 可被外部引用的包
│   ├── config/       # 配置
│   ├── i18n/         # 国际化
│   ├── jwt/          # jwt
│   ├── middleware/   # 中间件
│   └── utils/        # 工具函数
├── api/              # API文档(Swagger)
│   └── swagger.json
├── scripts/          # 构建、部署脚本目录
├── go.mod
├── LICENSE
├── Makefile          # 自动化脚本说明书
└── README.md
```

---

## cmd/：项目入口

​`cmd` 存放整个项目的入口程序。

通常项目只有一个：

```
cmd/
└── main.go
```

如果未来拆成多个服务（如 API + Worker），结构可以扩展成：

```
cmd/
├── api/
│   └── main.go
├── worker/
│   └── main.go
```

这样多服务更好管理。

---

## internal/：项目私有代码

​`internal`​ 是 Go 官方定义的 ​**私有代码机制**：这里的包只能本项目引用，外部无法导入。

我会把它拆成几个层次，职责分明：

```
internal/
├── dto/          # 请求/响应结构体
├── handler/      # HTTP 层
├── service/      # 业务逻辑层
├── repository/   # 数据访问层
├── model/        # 数据模型
└── router/       # 路由注册
```

调用链是单向的：

**Handler → Service → Repository → Model**

下面简单说一下每层负责什么：

- ​**Handler**：接收/解析请求，参数校验，调用 Service
- ​**Service**：业务逻辑处理
- ​**Repository**：数据库读写（纯 CRUD，不写业务）
- ​**Model**：数据库结构体
- ​**DTO**：请求/响应结构（隔离 Model）
- ​**Router**：注册路由，绑定 Handler

这种分层结构很适合 Go，也比 PHP 那种“一个 controller 干到底”的写法更好维护。

另外，Go 的一个特点是：  

**同一个 package 下多个**  **​.go​**​ **文件对编译器来说等同于同一个文件。**   

所以可以自由地按模块拆成多个 `user.go`​、`order.go`，对程序来说他们直接就是一个文件不会有任何影响，但分开之后代码的可读性会极大的提高。

如果你有其他面向对象语言的经验，Go会带来全新的编程体验。核心的思维转变可归纳为四点：

1. **忘掉"类"**  → 记住"结构体+方法"
2. **忘掉"继承"**  → 使用"组合+接口"
3. **忘掉"设计模式套用"**  → 关注"解决问题"
4. **接受显式错误处理** → 不再有try-catch

---

## pkg/：可复用的公共包

​`pkg` 用来放可被其他项目引用的通用模块，例如：

```
pkg/
├── config/
├── i18n/
├── jwt/
├── middleware/
└── utils/
```

如果只是给当前项目用，不需要放在 `pkg`​，尽量归到 `internal`。

另外也建议不要堆一个“大 utils”，按功能拆分更容易维护。

---

## api/：API 文档

这里一般放 Swagger / OpenAPI 的定义文件（JSON/YAML）。

用这些工具来管理接口文档可以：

- 自动生成文档
- 保持前后端对齐

对于多人协作非常有用。

---

## Makefile：常用命令的“快捷键”

我一般会把常用命令写进 `Makefile`，比如：

```makefile
run:
    go run cmd/main.go

build:
    go build -o bin/app cmd/main.go

test:
    go test ./...
```

Makefile 是个好东西，你可以把各种项目会用到的命令像清单一样列出来。

如果你有心思，甚至可以去做一个 help 命令来告诉其他人都有什么命令

```makefile
help:
	@echo "可用指令："
	@echo "  make deps          # 安装 / 更新 Go 依赖"
	@echo "  make fmt           # 统一格式化后端 Go 代码"
	@echo "  make test          # 执行全部 Go 单元测试"
```

对新同事非常友好，哪怕不了解项目，也可以通过阅读 Makefile 快速上手项目。

---

# 总结

对我来说，一旦目录结构定下来，剩下的基本就像做“填空题”一样：

- 中间件怎么写
- JWT 怎么做
- 数据库要建哪些表
- Handler / Service / Repository 各自实现哪些逻辑

这些都能一块一块稳稳推进。

Go 社区里没有唯一正确的结构，但这套分层思路对新手来说非常友好，也足够应对大部分项目。

如果你正在准备写一个 Go 项目，希望这套结构能帮你少踩一些坑，也让你的项目更容易维护。

