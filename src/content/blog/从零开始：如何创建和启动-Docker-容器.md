---
title: '从零开始：如何创建和启动 Docker 容器'
publishDate: '2024-12-01 18:10:57'
description: '本文将带你一步步从零开始创建 Docker 配置文件，讲解如何编写 Dockerfile 和 docker-compose.yml，以及如何使用 Docker 启动和运行容器。无论你是 Docker 新手还是开发者，本教程都将帮助你快速掌握 Docker 的基础知识，并成功运行你的应用'
tags:
  - PHP
  - Docker
language: '中文'
heroImage: { src: './cover/docker.png', color: '#51a4cb' }
draft: false
slug: '26ee1ee8'
---

最近我做了一个 [哔哩哔哩直播弹幕姬](https://github.com/zxc7563598/php-bilibili-danmu) 项目，为了让大家能更方便地使用，我决定将这个项目容器化，直接用 Docker 一键启动。这样，别人就不用担心配置环境了，直接运行就好。

如果你对 Docker 还不太熟悉，它其实就是一个让你把应用和所有的依赖打包在一起的工具，确保在任何机器上都能以相同的方式运行。通过 Docker，我能把项目打包成容器，避免了不同环境配置不一致的问题。

接下来，我会一步步带你走过：

1. 如何写 Dockerfile 来创建镜像；
2. 用 docker-compose.yml 来管理多个容器；
3. 怎么构建并启动 Docker 容器；
4. 容器里的应用怎么配置和运行；
5. 如果需要扩展容器环境，应该怎么做。

不管你是刚接触 Docker 还是已经有点经验，相信这篇教程能帮你更好地理解 Docker，并能把自己的项目轻松容器化。

## 创建 Dockerfile

Dockerfile 是一个文本文件，包含了一系列的指令，Docker 使用这些指令来构建镜像。你可以通过它指定操作系统、安装依赖、复制文件、设置环境变量等。

**示例 Dockerfile**

```dockerfile
FROM php:8.2-cli-alpine

# 安装 Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# 设置环境变量
ENV TZ=Asia/Shanghai

# 更新软件包列表并安装系统依赖
RUN apk update && apk add --no-cache \
    bash \
    git \
    curl \
    brotli \
    build-base \
    autoconf \
    libtool \
    make \
    linux-headers \
    pcre-dev \
    libevent \
    libevent-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    $PHPIZE_DEPS \
    redis \
    busybox-suid  # 添加 cron 支持

# 安装 PHP 扩展
RUN docker-php-ext-install pdo_mysql pcntl

# 安装 PHP GD 扩展
RUN docker-php-ext-configure gd \
    --with-jpeg \
    --with-webp \
    --with-freetype \
    && docker-php-ext-install gd

# 安装 PHP Redis 扩展
RUN pecl install redis \
    && docker-php-ext-enable redis

# 安装 PHP Brotli 扩展
RUN pecl install brotli \
    && docker-php-ext-enable brotli

# 设置工作目录
WORKDIR /var/www/bilibili_danmu

# 复制项目文件到容器中
RUN git clone https://github.com/zxc7563598/php-bilibili-danmu.git /var/www/bilibili_danmu

# 安装 PHP 依赖（生产环境中使用 --no-dev）
RUN composer install

# 设置目录权限
RUN chmod +x /var/www/bilibili_danmu

# 添加 cron 任务
RUN echo "0 * * * * /var/www/bilibili_danmu/check_and_update.sh" > /etc/crontabs/root

```

> 说明：
> **FROM**：指定基础镜像。
> **RUN**：安装依赖和 PHP 扩展。
> **COPY**：将本地文件复制到容器中。
> **WORKDIR**：设置工作目录。
> **CMD**：容器启动时执行的命令。

## 创建 Docker Compose 文件

docker-compose.yml 文件定义了多个容器的服务、网络和卷。它让我们可以一键启动多个容器，而不需要手动启动每个容器。

**示例 docker-compose.yml**

```yml
services:
  php:
    build: .
    container_name: php
    command: sh -c "sh setup.sh && php start.php start -d && crond && tail -f /dev/null"
    volumes:
      - /var/www/bilibili_danmu
    networks:
      - webnet
    expose:
      - '7776'

  nginx:
    image: nginx:latest
    container_name: nginx
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - .:/var/www/bilibili_danmu
    ports:
      - '7777:80'
    networks:
      - webnet
    depends_on:
      - php

  redis:
    image: redis:latest
    container_name: redis
    ports:
      - '6379'
    networks:
      - webnet

networks:
  webnet:
    driver: bridge
```

在上述文件中，定义了三个服务：php、nginx 和 redis，并配置了它们如何协同工作：

<b>PHP 服务</b>：运行应用代码并启动 PHP 和 cron 服务。

<b>Nginx 服务</b>：提供 Web 访问，使用自定义配置文件。

<b>Redis 服务</b>：提供缓存支持。

所有这些服务都连接到同一个自定义网络 webnet，确保它们能够顺畅地通信。

可以通过运行 docker-compose up -d 来启动这些服务，并在浏览器中访问 Nginx 提供的 Web 服务。

### PHP 服务

```yml
php:
  build: .
  container_name: php
  command: sh -c "sh setup.sh && php start.php start -d && crond && tail -f /dev/null"
  volumes:
    - /var/www/bilibili_danmu
  networks:
    - webnet
  expose:
    - '7776'
```

- <b>build: .</b>：这行代码表示 Docker 会在当前目录下查找 **Dockerfile** 并基于它构建 PHP 镜像。这个镜像包含了运行 PHP 应用所需的所有依赖和配置。
- <b>container_name: php</b>：为这个容器指定一个名字，便于我们在 Docker 中识别和管理。
- <b>command: sh -c "sh setup.sh && php start.php start -d && crond && tail -f /dev/null"</b>：这行命令会在容器启动时执行。首先，它会运行 <b>setup.sh</b> 脚本，接着启动 PHP 应用（<b>start.php start -d</b>），然后启动 <b>cron</b> 服务（<b>crond</b>），最后使用 <b>tail -f /dev/null</b> 保持容器处于运行状态，防止容器因任务执行完毕而停止。
- <b>volumes</b>：

```yml
volumes:
  - /var/www/bilibili_danmu
```

这行代码将宿主机的 <b>/var/www/bilibili_danmu</b> 目录挂载到容器内部的 <b>/var/www/bilibili_danmu</b> 目录。这确保了 PHP 容器能够访问和处理项目代码。

- <b>networks</b>：

```yml
networks:
  - webnet
```

容器会连接到一个名为 **webnet** 的网络，这个网络在文件底部定义。

- <b>expose</b>：

```yml
expose:
  - '7776'
```

**expose** 命令暴露容器的 7776 端口，供其他容器（如 Nginx）访问。需要注意的是，expose 并不会将端口映射到宿主机，只是让其他容器可以通过这个端口访问。

### Nginx 服务

```yml
nginx:
  image: nginx:latest
  container_name: nginx
  volumes:
    - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    - .:/var/www/bilibili_danmu
  ports:
    - '7777:80'
  networks:
    - webnet
  depends_on:
    - php
```

- <b>image: nginx:latest</b>：
  使用官方的 Nginx 镜像，并始终拉取最新版本。

- <b>container_name: nginx</b>：

为 Nginx 容器指定一个名字，便于识别。

- <b>volumes</b>：

```yml
volumes:
  - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
  - .:/var/www/bilibili_danmu
```

这两个挂载使得宿主机的 **./nginx/default.conf** 配置文件和整个项目目录能够映射到容器内。这样，Nginx 容器就能使用项目的代码和自定义的配置文件。

- <b>ports</b>：

```yml
ports:
  - '7777:80'
```

这行代码将容器的 80 端口映射到宿主机的 7777 端口，允许外部访问 Nginx 服务。

- <b>networks</b>：

```yml
networks:
  - webnet
```

Nginx 服务也连接到 **webnet** 网络，以便和其他容器通信。

- <b>depends_on</b>：

```yml
depends_on:
  - php
```

这表示 Nginx 容器在启动时依赖于 **php** 容器。**depends_on** 确保 PHP 容器先启动，以便 Nginx 容器能够访问它。

### Redis 服务

```yml
redis:
  image: redis:latest
  container_name: redis
  ports:
    - '6379'
  networks:
    - webnet
```

<b>image: redis:latest</b>：
使用官方 Redis 镜像，拉取最新版本。

<b>container_name: redis</b>：
为 Redis 容器指定一个名字，便于管理和识别。

<b>ports</b>：

```yml
ports:
  - '6379'
```

将 Redis 的默认端口 6379 暴露到宿主机上，允许外部程序与 Redis 通信。

<b>networks</b>：

```yml
networks:
  - webnet
```

Redis 容器连接到 **webnet** 网络，确保它与 PHP 和 Nginx 容器能够通信。

### 自定义网络定义

```yml
networks:
  webnet:
    driver: bridge
```

networks 定义了一个名为 **webnet** 的网络，所有容器都将连接到这个网络。通过这种方式，容器间可以互相通信，并且不会暴露给外部世界，除非明确映射端口。这里使用了 bridge 网络驱动，这是 Docker 默认的网络类型，适合容器之间的通信。

## 构建和启动容器

- <b>构建 Docker 镜像</b>： 在包含 <b>Dockerfile</b> 与 <b>docker-compose.yml</b> 的目录下运行以下命令构建镜像：

```shell
docker-compose build
```

- <b>启动 Docker Compose 服务</b>： 在包含 <b>Dockerfile</b> 与 <b>docker-compose.yml</b> 的目录下运行：

```shell
docker-compose up -d
```

这条命令会构建和启动所有定义的服务。-d 参数表示在后台运行。

- <b>查看容器状态</b>： 使用以下命令查看运行中的容器：

```shell
docker ps
```

- <b>停止容器</b>： 要停止容器，运行以下命令：

```shell
docker-compose down
```

## 其他常用命令

- <b>查看容器日志</b>：

```bash
docker logs <container_name_or_id>
```

- <b>进入容器的终端</b>：

```bash
docker exec -it <container_name_or_id> sh
```

- <b>删除容器和镜像</b>：
  停止并删除所有容器和镜像：

```bash
docker-compose down --rmi all
```

- <b>删除不再使用的资源</b>

以下内容均会被删除：

1. 所有未被任何容器使用的镜像（dangling images）
2. 所有停止的容器（stopped containers）
3. 所有未被使用的网络（unused networks）
4. 所有未被使用的卷（未使用的匿名卷，需加 --volumes 才会删除）
5. 所有未使用的构建缓存

```bash
docker system prune
```
