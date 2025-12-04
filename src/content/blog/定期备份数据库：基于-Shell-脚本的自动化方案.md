---
title: '定期备份数据库：基于 Shell 脚本的自动化方案'
publishDate: '2024-10-20 18:55:46'
description: '本篇文章分享一个简单的 Shell 脚本，用于定期备份 MySQL 数据库，并自动将备份传输到远程服务器，帮助防止数据丢失'
tags:
  - MySQL
  - Shell
language: '中文'
heroImage: { src: './cover/mysql.png', color: '#01618d' }
draft: false
slug: '477811e7'
---

数据库备份这件事，说实话，我一直没怎么上心。平时服务器跑得好好的，谁会想着备份呢？直到某天真出问题了，才意识到自己平时有多“懒”。

我相信很多人跟我一样，觉得这东西看起来麻烦，等到数据库挂了、数据丢失了，才感叹自己怎么就没提前准备好呢？

有一次数据库问题搞得我手忙脚乱，最后还好有个朋友给了我个备份文件，才算是有惊无险。

经历了这次以后，我决定不能再拖了，必须把备份这事儿自动化起来。所以，我写了一个简单的 Shell 脚本，每天自动帮我把数据库备份好，还自动传到远程服务器上，再也不用担心数据丢失了。

今天就把这个脚本分享出来，或许能帮到和我一样平时“佛系”的朋友。脚本简单好用，拿来直接用就行，具体的实现逻辑也不复杂，如果你有其他需求，可以自行优化。

## 备份脚本内容

```bash
#!/bin/bash

# MySQL连接参数（可以使用 ~/.my.cnf 文件代替）
DB_USER="数据库账号"
DB_PASS="数据库密码"

# 备份目录
BACKUP_DIR="/数据库备份目录"

# 日志文件路径
CURRENT_DATE=$(date +'%Y%m%d%H%M%S')
LOG_FILE="/数据库备份日志目录/$CURRENT_DATE.log"

# 目标服务器的 SSH 用户名和 IP 地址，如果不需要同步到其他服务器则不需要填写
# -----------------------------
REMOTE_USER="" # 目标服务器账号
REMOTE_HOST="" #目标服务器IP
REMOTE_DIR="" # 目标服务器存储路径
# -----------------------------

# SSH 连接超时时间（单位：秒）
SSH_CONNECT_TIMEOUT=10

# 创建备份和日志目录（如果不存在）
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 获取所有数据库列表
DATABASES=$(mysql -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema|mysql)")

# 循环备份每个数据库
BACKUP_FILES=()
for DB in $DATABASES; do
    BACKUP_FILE="$BACKUP_DIR/$DB-$CURRENT_DATE.sql.gz"
    echo "$(date +%Y%m%d%H%M%S) 备份数据库 $DB 到文件 $BACKUP_FILE" >> $LOG_FILE
    if ! mysqldump -u $DB_USER -p$DB_PASS --single-transaction --databases $DB | gzip > $BACKUP_FILE; then
        echo "$(date +%Y%m%d%H%M%S) 备份数据库 $DB 失败" >> $LOG_FILE
        continue  # 跳过当前数据库，继续备份其他数据库
    fi
    echo "$(date +%Y%m%d%H%M%S) 备份完成" >> $LOG_FILE
    BACKUP_FILES+=($BACKUP_FILE)
done

# 创建远程备份目录
if [ -n "$REMOTE_USER" ] && [ -n "$REMOTE_HOST" ] && [ -n "$REMOTE_DIR" ]; then
    ssh -o ConnectTimeout=$SSH_CONNECT_TIMEOUT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"

    # 批量传输备份文件
    if [ ${#BACKUP_FILES[@]} -gt 0 ]; then
        echo "$(date +%Y%m%d%H%M%S) 将备份文件发送到远程服务器..." >> $LOG_FILE
        scp -o ConnectTimeout=$SSH_CONNECT_TIMEOUT ${BACKUP_FILES[@]} $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR
        echo "$(date +%Y%m%d%H%M%S) 备份文件发送完成" >> $LOG_FILE
    fi

    # 删除本地备份文件
    echo "删除本地备份文件..." >> $LOG_FILE
    for BACKUP_FILE in "${BACKUP_FILES[@]}"; do
        rm -f $BACKUP_FILE
    done
    echo "本地备份文件删除完成" >> $LOG_FILE
fi

# 完成
echo "------------------------------" >> $LOG_FILE

```

## 关于同步到其他服务器

如果需要同步到远程服务器的话，为了避免每次执行脚本时都手动输入密码，可以使用 **SSH 密钥对**（公钥和私钥）来实现免密登录

具体步骤如下：

### 在数据库所在机器上生成 SSH 密钥对

首先，确保你在数据库机器上没有已有的 SSH 密钥对（如果有，跳过这一步）。在 A 机器上运行以下命令来生成一个新的 SSH 密钥对：

```bash
ssh-keygen -t rsa -b 2048
```

按照提示操作，默认保存路径是 `~/.ssh/id_rsa`​，可以选择直接按 Enter 使用默认路径。生成密钥后，你会得到两个文件：

- **id_rsa**：私钥文件，保存在数据库所在机器上。
- **id_rsa.pub**：公钥文件，用于复制到需要同步的机器。

### 将公钥复制到需要同步的机器

你需要将 `id_rsa.pub`​ 的内容复制到需要同步的机器上，添加到目标用户的 `~/.ssh/authorized_keys`​ 文件中。你可以使用以下命令来实现这一点：

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub 需要同步的机器目标用户@需要同步的机器的IP
```

如果你的目标用户在需要同步的机器上是 `remote_user`​，IP 地址是 `192.168.1.100`​，那么命令会是：

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub remote_user@192.168.1.100
```

执行后，你将被提示输入需要同步的机器的密码，输入一次后，公钥将被自动添加到需要同步的机器上的 `~/.ssh/authorized_keys`​ 文件中。

### 验证免密登录

此时，你应该能够从数据库所在机器免密登录到需要同步的机器，试试这个命令：

```bash
ssh remote_user@192.168.1.100
```

如果成功登录且没有要求输入密码，则说明配置成功。

## 总结

虽然数据库备份在日常中似乎并不重要，但等到真正出问题时，备份的价值就凸显出来了。

有了这个脚本后，我再也不用手动备份数据库，也不怕丢数据了。

希望这份脚本能帮到大家。
