---
title: '一次受限环境下的 MySQL 数据导出与“可交付化”实践'
publishDate: '2025-12-26 16:39:17'
description: '记录一次在受限条件下整理 MySQL 数据的过程：面对陌生数据库和时间限制，如何先保证数据完整，再把数据整理成非技术人员也能直接使用的形式。'
tags:
  - PHP
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: 'ka8dy46f'
---

平时其实很少会专门写数据库导出的事情。  

这种活本身并不复杂，零零散散也做过很多次，大多数时候也不会留下什么记录。

这一次之所以单独记下来，主要还是因为当时遇到了一些​**比较具体、也比较现实的限制条件**：  

我需要在比较短的时间里接手一个并不熟悉的 MySQL 实例，把里面的数据整理出来，而且这些数据最终并不是只给工程师看。

---

## 从一开始就意识到的一个问题

在动手之前，其实有一件事情我是比较明确的：

> ​ **​`.sql`​**​ **文件对工程师很友好，但对非技术人员几乎没有可用性。**

对工程师来说：

- ​`.sql` 是最可靠的备份形式
- 可以恢复、可以校验、可以长期保存

但换一个视角：

- 很多人甚至不知道怎么打开 `.sql`
- 就算打开了，也很难直接理解表结构
- 想筛选、查某一条记录，几乎是不可能的

也就是说，​**单纯把数据库备份下来，并不等于问题已经解决了**。  

后面迟早还是要把数据整理成一种“能被直接使用”的形式。

所以我当时心里其实是把这件事拆成了两步：

1. 先保证数据完整地留下来
2. 再考虑怎么把数据变成别人也能看懂的样子

---

## 先做一份完整的数据库备份

基于这个判断，我做的第一件事，还是先把整个 MySQL 实例完整备份下来。

这一步本身并不复杂，也谈不上什么技巧，只是对我来说，​**先有一份全量、可恢复的备份，会比较安心**。后面无论怎么处理数据，至少不会有“回不去”的问题。

为了省事，我写了一个简单的 shell 脚本，用来：

- 自动获取所有业务数据库
- 排除系统库
- 逐个数据库执行 `mysqldump`
- 直接流式压缩成 `.sql.gz`

脚本本身也只是把平时常用的命令整理了一下：

```bash
#!/usr/bin/env bash

## gunzip < app.sql.gz | mysql -u root -p
## nohup ./dump_all_dbs.sh host port root 'password' > 备份日志.log 2>&1 &

set -e

HOST="$1"
PORT="$2"
USER="$3"
PASS="$4"

if [ $# -ne 4 ]; then
  echo "Usage: $0 <host> <port> <user> <password>"
  exit 1
fi

OUT_DIR="Mysql备份_$(date +%F_%H%M%S)"
mkdir -p "$OUT_DIR"

MYSQL="mysql -h${HOST} -P${PORT} -u${USER} -p${PASS} --batch --skip-column-names"
DUMP_BASE_OPTS="
  --single-transaction
  --routines
  --events
  --triggers
  --hex-blob
  --set-gtid-purged=OFF
  --default-character-set=utf8mb4
"

echo "==> 正在从获取数据库列表 ${HOST}:${PORT}"

DATABASES=$($MYSQL -e "
  SELECT schema_name
  FROM information_schema.schemata
  WHERE schema_name NOT IN
    ('mysql','information_schema','performance_schema','sys');
")

if [ -z "$DATABASES" ]; then
  echo "未找到数据库!"
  exit 0
fi

echo "==> 要转储的数据库:"
echo "$DATABASES"
echo

for DB in $DATABASES; do
  FILE="${OUT_DIR}/${DB}.sql.gz"
  echo "==> 转储数据库: ${DB}"

  mysqldump \
    -h${HOST} -P${PORT} -u${USER} -p${PASS} \
    $DUMP_BASE_OPTS \
    --databases "$DB" \
    | gzip > "$FILE"

  echo "    -> 完成: $FILE"
done

echo
echo "所有数据库均已成功转储."
echo "输出目录: ${OUT_DIR}"
```

做到这里，其实“数据有没有丢”这个问题就已经基本不用担心了。

---

## 按需导出某一部分数据

接下来遇到的，是更偏实际使用层面的问题。

在整理数据的过程中，经常会有一些很具体的需求，比如：

- 只需要看某一张表
- 或者想先筛选一部分数据出来看看

这时候，如果只剩下一堆 `.sql` 文件，其实并不太好用。

所以我写了一个很简单的 PHP CLI 脚本，用来把一条 SQL 查询的结果直接导出成 CSV。

这个脚本的目标也很单纯：

- 能处理数据量比较大的表
- 不一次性把数据全部读进内存
- 导出的文件可以直接用 Excel 打开

```php
<?php

// 单文件 CLI：MySQL 导出 CSV

if ($argc < 2) {
    echo <<<HELP
Usage:
  php export.php <output_csv_path>

Example:
  php export.php /data/output/users.csv

HELP;
    exit(1);
}

$outputCsv = $argv[1];

// MySQL 配置
$dbConfig = [
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'dbname'   => 'dbname',
    'username' => 'root',
    'password' => 'password',
    'charset'  => 'utf8mb4',
];

// SQL
$sql = <<<SQL
select * from bl_danmu_logs
SQL;


$dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    $dbConfig['host'],
    $dbConfig['port'],
    $dbConfig['dbname'],
    $dbConfig['charset']
);
try {
    $pdo = new PDO(
        $dsn,
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
        ]
    );
} catch (PDOException $e) {
    fwrite(STDERR, "数据库连接失败: {$e->getMessage()}\n");
    exit(1);
}
$dir = dirname($outputCsv);
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}
$fp = fopen($outputCsv, 'w');
if ($fp === false) {
    fwrite(STDERR, "无法写入 CSV 文件\n");
    exit(1);
}
fwrite($fp, "\xEF\xBB\xBF");
$stmt = $pdo->prepare($sql);
$stmt->execute();
$rowCount = 0;
$headerWritten = false;
while ($row = $stmt->fetch()) {
    if (!$headerWritten) {
        fputcsv($fp, array_keys($row));
        $headerWritten = true;
    }
    fputcsv($fp, array_values($row));
    $rowCount++;
    if ($rowCount % 100000 === 0) {
        echo "已导出 {$rowCount} 行\n";
    }
}
fclose($fp);
echo "导出完成，共 {$rowCount} 行\n";
```

这个脚本更多是用来应对一些临时、零散的导出需求，本身也不复杂。

---

## 真正的难点在“交付”这一步

真正让我花时间的，其实是后面这一部分。

如果只是从工程角度看，`.sql`​ 已经足够完整；  

但从使用角度看，这些数据仍然**很难被直接消费**。

问题包括：

- 表很多，一个一个手工导出不现实
- Excel 有行数限制，大表没法一次性打开
- 字段名是英文或缩写，不看表结构根本不知道是什么意思

所以后来我又写了一个脚本，用来把整个数据库的数据，整理成一组 CSV 文件。

这个脚本做的事情也很朴素：

- 遍历数据库中的所有表
- 读取字段注释，作为 CSV 的表头
- 数据量大的表按行数自动拆分文件
- 所有文件都可以直接用 Excel 打开

这些逻辑都不复杂，只是把原本需要重复做的事情集中到了一起。

```php
<?php

// 单文件 CLI：导出数据库指定表中所有的数据

const MAX_ROWS_PER_FILE = 1000000; // 每个CSV文件最大行数（包含表头）

if ($argc < 3) {
    echo <<<HELP
Usage:
  php export.php <output_folder_path> <database_name>

Example:
  php export.php /data/output/ dabatase_name

注意：每个CSV文件最多包含100万行数据，超过会拆分成多个文件

HELP;
    exit(1);
}

$outputFolder = rtrim($argv[1], '/') . '/';
$dbname = $argv[2];

// MySQL 配置
$dbConfig = [
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'dbname'   => $dbname,
    'username' => 'root',
    'password' => 'zxc7563598',
    'charset'  => 'utf8mb4',
];

$dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    $dbConfig['host'],
    $dbConfig['port'],
    $dbConfig['dbname'],
    $dbConfig['charset']
);

try {
    $pdo = new PDO(
        $dsn,
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false,
        ]
    );
} catch (PDOException $e) {
    fwrite(STDERR, "数据库连接失败: {$e->getMessage()}\n");
    exit(1);
}

// 确保输出文件夹存在
if (!is_dir($outputFolder)) {
    mkdir($outputFolder, 0777, true);
}

// 获取所有表名
try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "数据库中没有表\n";
        exit(0);
    }
    echo "找到 " . count($tables) . " 个表\n";
    echo "每个文件最多包含 " . number_format(MAX_ROWS_PER_FILE) . " 行数据\n\n";
    $totalRows = 0;
    $exportedTables = 0;
    $totalFiles = 0;
    foreach ($tables as $table) {
        echo "正在处理表: {$table}...\n";
        // 获取表的字段信息（字段名和注释）
        $commentStmt = $pdo->prepare("
            SELECT 
                COLUMN_NAME, 
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = :database 
            AND TABLE_NAME = :table 
            ORDER BY ORDINAL_POSITION
        ");
        $commentStmt->execute([
            ':database' => $dbConfig['dbname'],
            ':table' => $table
        ]);
        $columns = $commentStmt->fetchAll();
        $headers = [];
        // 准备CSV表头：优先使用注释，没有注释则使用字段名
        foreach ($columns as $column) {
            $columnName = $column['COLUMN_NAME'];
            $columnComment = trim($column['COLUMN_COMMENT']);
            // 如果注释不为空，使用注释；否则使用字段名
            $headers[$columnName] = !empty($columnComment) ? $columnComment : $columnName;
        }
        // 获取字段名数组，用于按顺序读取数据
        $columnNames = array_keys($headers);
        $headerRow = array_values($headers);
        // 查询表数据
        try {
            $sql = "SELECT * FROM `" . str_replace('`', '``', $table) . "`";
            $dataStmt = $pdo->prepare($sql);
            $dataStmt->execute();
            $rowCount = 0;
            $fileIndex = 0;
            $currentFileRows = 0;
            $fp = null;
            while ($row = $dataStmt->fetch()) {
                // 如果是新文件或文件未打开，创建新文件
                if ($fp === null || $currentFileRows >= MAX_ROWS_PER_FILE) {
                    // 关闭之前的文件
                    if ($fp !== null) {
                        fclose($fp);
                        echo "  -> 文件 {$table}-{$fileIndex}.csv 完成 ({$currentFileRows} 行)\n";
                    }
                    // 创建新文件
                    $fileIndex++;
                    $currentFileRows = 0;
                    $outputCsv = $outputFolder . $table . '-' . $fileIndex . '.csv';
                    $fp = fopen($outputCsv, 'w');
                    if ($fp === false) {
                        echo "失败 (无法创建文件: {$outputCsv})\n";
                        break;
                    }
                    // 添加BOM头，确保Excel正确识别UTF-8
                    fwrite($fp, "\xEF\xBB\xBF");
                    // 写入表头
                    fputcsv($fp, $headerRow);
                    $totalFiles++;
                }
                // 按照表头顺序组织数据
                $rowData = [];
                foreach ($columnNames as $columnName) {
                    $rowData[] = $row[$columnName] ?? '';
                }
                fputcsv($fp, $rowData);
                $rowCount++;
                $currentFileRows++;
                // 每 10 万行打一次日志
                if ($rowCount % 100000 === 0) {
                    echo "  -> 已导出 " . number_format($rowCount) . " 行，当前文件: {$table}-{$fileIndex}.csv\n";
                }
            }
            // 关闭最后一个文件
            if ($fp !== null) {
                fclose($fp);
                if ($currentFileRows > 0) {
                    echo "  -> 文件 {$table}-{$fileIndex}.csv 完成 ({$currentFileRows} 行)\n";
                }
            }
            $totalRows += $rowCount;
            $exportedTables++;
            // 确定实际创建的文件数量
            $actualFiles = $fileIndex; // fileIndex从1开始，所以最后的值就是文件数量
            if ($actualFiles > 1) {
                echo "表 {$table} 导出完成: " . number_format($rowCount) . " 行，拆分成 {$actualFiles} 个文件\n";
            } else {
                echo "表 {$table} 导出完成: " . number_format($rowCount) . " 行\n";
            }
            // 重命名单文件情况下的文件名（去掉-1后缀）
            if ($actualFiles === 1) {
                $oldFile = $outputFolder . $table . '-1.csv';
                $newFile = $outputFolder . $table . '.csv';
                if (file_exists($oldFile) && rename($oldFile, $newFile)) {
                    echo "  -> 重命名为: {$table}.csv\n";
                }
            }
            echo "\n";
        } catch (Exception $e) {
            // 关闭可能打开的文件
            if ($fp !== null) {
                fclose($fp);
            }
            echo "失败: " . $e->getMessage() . "\n";
            continue;
        }
    }
    echo "========== 导出完成！ ==========\n";
    echo "成功导出的表: {$exportedTables}/" . count($tables) . "\n";
    echo "总数据行数: " . number_format($totalRows) . "\n";
    echo "生成的CSV文件总数: {$totalFiles}\n";
    // 如果有的表导出失败，列出它们
    if ($exportedTables < count($tables)) {
        $failedTables = array_diff($tables, array_map(function ($csv) use ($outputFolder) {
            return preg_replace('/-\d+\.csv$/', '.csv', basename($csv));
        }, glob($outputFolder . '*.csv')));
        if (!empty($failedTables)) {
            echo "导出失败的表:\n";
            foreach ($failedTables as $table) {
                echo "  - {$table}\n";
            }
        }
    }
    echo "\n文件命名规则:\n";
    echo "- 数据量 ≤ " . number_format(MAX_ROWS_PER_FILE) . " 行: 表名.csv\n";
    echo "- 数据量 > " . number_format(MAX_ROWS_PER_FILE) . " 行: 表名-1.csv, 表名-2.csv, ...\n";
} catch (Exception $e) {
    fwrite(STDERR, "获取表列表失败: {$e->getMessage()}\n");
    exit(1);
}
```

---

## 一点事后的感受

这次整理下来，我的感受其实挺明确的：

- 技术本身并不复杂
- 真正需要花心思的，是**站在使用者的角度去看数据**

对工程师来说，数据库和 SQL 已经很直观了；

但对不直接使用数据库的人来说，​**Excel 才是他们真正熟悉的工具**。

这套脚本对我而言，并不是什么通用方案，只是当时在那个条件下，一种比较顺手、也能把事情做完的办法。

记录下来，也只是给自己以后再遇到类似情况时，留一个参考。
