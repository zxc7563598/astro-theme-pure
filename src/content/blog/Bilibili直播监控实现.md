---
title: 'Bilibili直播监控实现'
publishDate: '2023-10-15 09:18:51'
description: '本文讲述了如何从服务器端的方向，实现对哔哩哔哩直播间的弹幕监控，进房提醒，礼物自动答谢等功能的实现，以及自动录播并分段上传'
tags:
  - PHP
  - Bilibili
language: '中文'
heroImage: { src: './cover/bilibili.jpg', color: '#8cbde5' }
draft: false
slug: '3bb1f08f'
---

# 哔哩哔哩直播监控实现

本文讲述了如何从服务器端的方向，实现对哔哩哔哩直播间的弹幕监控，进房提醒，礼物自动答谢等功能的实现，以及自动录播并分段上传

> 直播弹幕监控，自动欢迎进房，自动答谢礼物等功能来自 GitHub 中公开的项目：弹幕姬 [点击进入 GitHub](https://github.com/BanqiJane/Bilibili_Danmuji)

> 自动录播，视频分段来自 GitHub 中公开的项目：录播姬 [点击进入 GitHub](https://github.com/BililiveRecorder/BililiveRecorder)

> 自动投稿来自于 GitHub 中公开的项目：biliup-rs [点击进入 GitHub](https://github.com/biliup/biliup-rs)

本文主要在于记录这些项目部署的全过程，以及一些额外小功能的实现原理

---

## 录播姬

### 下载

可以通过 [GitHub Release](https://github.com/BililiveRecorder/BililiveRecorder/releases) 页面中获取自己需要的版本进行下载

> 无特殊情况下，使用 BililiveRecorder-CLI-linux-x64 版本即可

| 操作系统 | 架构  | 下载链接                             |
| :------- | :---- | :----------------------------------- |
| Linux    | x64   | BililiveRecorder-CLI-linux-x64.zip   |
| Linux    | arm32 | BililiveRecorder-CLI-linux-arm.zip   |
| Linux    | arm64 | BililiveRecorder-CLI-linux-arm64.zip |
| Windows  | x64   | BililiveRecorder-CLI-win-x64.zip     |
| macOS    | x64   | BililiveRecorder-CLI-osx-x64.zip     |
| macOS    | arm64 | BililiveRecorder-CLI-osx-arm64.zip   |

### 安装

下载并解压压缩包，以 Linux x64 为例：

```
mkdir <录播姬目录>
cd <录播姬目录>
# wget https://下载链接
unzip <下载到的 zip 压缩包>
```

> 解压完成后，记得检查确认文件夹中的 BililiveRecorder.Cli 是否带有可执行权限，如果没有的话使用以下命令添加可执行权限：`chmod +x BililiveRecorder.Cli`

确认录播姬可以运行、并检查版本号

```
./BililiveRecorder.Cli --version
```

> 后续录播姬的控制均由 BililiveRecorder.Cli 来处理，为了方便命令行的使用，可以将该文件缩写为其他名称，例如：brec ，方法如下：`mv BililiveRecorder.Cli brec`

> 录播姬所有命令都可以加上 --help 查看帮助

### 运行

> ./brec run "工作目录"

```
# 侦听本机地址，只有本地可以访问
./brec run --bind "http://localhost:2356" "工作目录"

# 或者所有设备都可访问
./brec run --bind "http://*:2356" "工作目录"

# HTTP Basic 登陆
./brec run --bind "http://*:2356" --http-basic-user "用户名" --http-basic-pass "密码" "工作目录"

# 使用录播姬自己生成的自签名证书
./brec run --bind "https://*:2356" "工作目录"

# 使用 pem 格式的证书，和 Nginx Caddy 等软件的证书格式一致
./brec run --bind "https://*:2356" --cert-pem-path "证书文件路径" --cert-key-path "私钥文件路径" "工作目录"

# 使用带密码的私钥
./brec run --bind "https://*:2356" --cert-pem-path "证书文件路径" --cert-key-path "私钥文件路径" --cert-password "私钥密码" "工作目录"

# 使用 pfx 格式的证书
./brec run --bind "https://*:2356" --cert-pfx-path "证书文件路径" "工作目录"

# 使用带密码的证书
./brec run --bind "https://*:2356" --cert-pfx-path "证书文件路径" --cert-password "私钥密码" "工作目录"
```

### 后续

录播姬需要保持后台持续运行，建议增加至 systemd 中并设置开机自动启动

#### 创建服务

新建一个文件 /etc/systemd/system/brec.service

```
[Unit]
Description=BililiveRecorder
After=network.target

[Service]
ExecStart=录播姬运行命令，注意使用根路径

[Install]
WantedBy=multi-user.target
```

#### 重载服务

```
systemctl daemon-reload
```

#### 设置开机自动启动

```
systemctl enable brec
```

#### 禁止开机自动启动

```
systemctl disable brec
```

#### 常用指令

```
# 查看运行状态
sudo systemctl status brec

# 启动
sudo systemctl start brec

# 停止
sudo systemctl stop brec

# 重启
sudo systemctl restart brec
```

### 其他

录播姬支持 webhook，部署成功后可以进行对应的设置
可以在直播开始/结束，文件录制开始/结束等节点对配置地址进行通知
[点击查看相关文档](https://rec.danmuji.org/user/webhook)

---

## 弹幕姬

该项目基于 Java 环境运行，安装前请先检查服务器是否安装 Java 以及检查 Java 的版本

> 建议 Java 版本 >= 1.8

Java 的安装方式网上有很多教程，本文不再中间描述，以 Centos 为例，官网下载对应的包

在 /etc/profile 中增加对应的环境变量即可

```
export JAVA_HOME=java目录
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JRE_HOME=$JAVA_HOME/jre
```

> 记得通过 `source /etc/profile` 来使环境变量生效

### 下载

可以通过 [GitHub Release](https://github.com/BanqiJane/Bilibili_Danmuji/releases) 页面中获取自己需要的版本进行下载

| 版本           | 说明                                   |
| :------------- | :------------------------------------- |
| danmuji        | 常规版本                               |
| danmuji-green  | windows 版本，无需 Java 环境，开包即用 |
| danmuji-docker | 全框架 docker 镜像构建版本             |

### 安装 & 运行

该项目无需安装，直接运行 .jar 包即可，例如：`java -jar BilibiliDanmu.jar`

需要关闭时，可以通过 `fuser -k -n tcp 对应端口` 来进行关闭

---

## Biliup-rs

biliup-rs 是用 Rust 编写的，所以需要 [安装 Rust](https://www.rust-lang.org) 才能编译它

```
## 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

## 更新 Rust
rustup update
```

### 安装

`cargo install biliup`

### 使用

可以通过执行命令：`biliup -h` 来查看可以进行的操作

```
USAGE:
    biliup [OPTIONS] <SUBCOMMAND>

OPTIONS:
    -h, --help                         Print help information
    -u, --user-cookie <USER_COOKIE>    登录信息文件 [default: cookies.json]
    -V, --version                      Print version information

SUBCOMMANDS:
    append    是否要对某稿件追加视频
    help      Print this message or the help of the given subcommand(s)
    login     登录B站并保存登录信息
    renew     手动验证并刷新登录信息
    show      打印视频详情
    upload    上传视频
```

### 其他

**因为录播姬支持 webhook，当文件录制完成时可以触发回调**

**所以建议在本地做一个小脚本，当收到文件录制完成的通知时调用 biliup 上传录制完成的文件，实现自动上传**

[B 站投稿线路分析](https://biliup.github.io/upload-systems-analysis.html)

[B 站 tid 分区表](https://biliup.github.io/tid-ref.html)

```
{
    "cmd":"POPULARITY_RED_POCKET_WINNER_LIST",
    "data":{
        "awards":{ ## 奖品数组
            "31212":{
                "award_big_pic":"https://i0.hdslb.com/bfs/live/9e6521c57f24c7149c054d265818d4b82059f2ef.png", ## 奖品图片
                "award_name":"打call", ## 奖品名称
                "award_pic":"https://s1.hdslb.com/bfs/live/461be640f60788c1d159ec8d6c5d5cf1ef3d1830.png", ## 奖品图片
                "award_price":500, ## 奖品价值，单位电池*100
                "award_type":1 ## 待观察
            },
            "31214":{
                "award_big_pic":"https://i0.hdslb.com/bfs/live/3b74c117b4f265edcea261bc5608a58d3a7c300a.png",
                "award_name":"牛哇",
                "award_pic":"https://s1.hdslb.com/bfs/live/91ac8e35dd93a7196325f1e2052356e71d135afb.png",
                "award_price":100,
                "award_type":1
            },
            "31216":{
                "award_big_pic":"https://i0.hdslb.com/bfs/live/cf90eac49ac0df5c26312f457e92edfff266f3f1.png",
                "award_name":"小花花",
                "award_pic":"https://s1.hdslb.com/bfs/live/5126973892625f3a43a8290be6b625b5e54261a5.png",
                "award_price":100,
                "award_type":1
            }
        },
        "lot_id":12803470, ## 红包id
        "total_num":8, ## 待观察，应该是奖品数量
        "version":1,
        "winner_info":[
            [
                100422246, ## 用户uid
                "呆呆是豆腐的好爸爸捏", ## 用户名称
                6549542, ## 待观察
                31212 ## 中奖礼物信息，对应礼物数组
            ],
            [
                244187937,
                "一哭二闹三上佑娅",
                6450325,
                31212
            ],
            [
                33452712,
                "纯爱猫猫丶",
                6537056,
                31214
            ],
            [
                258093224,
                "凌小辰是小雏楠",
                6464920,
                31214
            ],
            [
                512011712,
                "东哥不爱喝",
                6537057,
                31214
            ],
            [
                3494364166752651,
                "鹤九-z",
                6458205,
                31216
            ]
        ]
    },
    "is_report":false, ## 待观察
    "msg_id":"146118578543104", ## 待观察
    "send_time":1688832579071 ## 推送时间
}
```
