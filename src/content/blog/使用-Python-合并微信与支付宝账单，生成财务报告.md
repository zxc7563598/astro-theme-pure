---
title: '使用 Python 合并微信与支付宝账单，生成财务报告'
publishDate: '2025-01-21 23:16:04'
description: '这篇博客介绍了如何使用 Python 脚本合并微信与支付宝账单数据，生成自动化财务报告。通过 pandas 库，学习如何清洗、合并和分析账单数据，以及如何生成 Markdown 格式的财务报告。适合对财务自动化和数据处理感兴趣的开发者'
tags:
  - Python
language: '中文'
# heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '234fc7f9'
---

最近用思源笔记记东西上瘾，突然想每个月存一份收支记录进去。但手动整理账单太麻烦了，支付宝导出一份 CSV，微信又导出一份，格式还不一样，每次复制粘贴头都大。

干脆写了个 Python 脚本一键处理，核心就干两件事：

1. 把俩平台的 CSV 账单合并到一起
2. 自动生成带分类表格的 Markdown（直接拖进思源就能渲染）

代码主要折腾了这些：

- 支付宝账单前 24 行都是废话，直接 `skiprows=24` 跳过去，GBK 编码差点让我栽跟头
- 微信账单的列名和支付宝对不上，比如微信叫 **交易单号** ，支付宝叫 **交易订单号** ，通过 `rename` 强行对齐
- 两边金额都有 **¥** 符号和逗号（比如 ¥1,200），用正则 `[¥￥,]` 替换成数字
- 最后合并数据时发现微信少几个字段（比如“对方账号”），直接填个 pd.NA 占位

最爽的是生成 Markdown 的部分，pandas 分组统计消费类型，直接 for 循环拼字符串，出来效果长这样：

![生成样式示例，数据内容随机生成](article/234fc7f9/demo.png#pic_center)

## 使用说明

脚本依赖两个 Python 包：`pandas` 和 `chardet`。安装方法如下：

```bash
pip install pandas chardet
```

**准备账单文件**

1. **支付宝账单**：
   - 打开支付宝 App → 我的 → 账单 → 点击右上角「···」 → 开具交易流水证明 → 用于个人对账

2. **微信账单**：
   - 打开微信 App → 我的 → 服务 → 钱包 → 账单 → 常见问题 → 下载账单 → 用于个人对账

将这两个文件放到脚本所在的文件夹中。

修改代码底部

```python
# 调用函数读取 CSV 文件并生成新的 CSV 文件
read_csv('支付宝账单路径.csv', '微信账单路径.csv', '生成合并账单路径')
# 调用函数生成 Markdown 文件
generate_markdown('生成合并账单路径.csv', '最终账单.md')
```

运行脚本，即可得到 `最终账单.md`

```bash
python analysis.py
```

## 完整代码（或访问 [GitHub 仓库](https://github.com/zxc7563598/alipay-wechat-finance)

```python
import pandas as pd

def read_csv(alipay_path, wechat_path, output_path):
    try:
        # 读取 alipay.csv 文件，跳过前 24 行，从第 25 行开始
        alipay = pd.read_csv(alipay_path, skiprows=24, encoding='GBK')

        # 读取 wechat.csv 文件
        wechat = pd.read_csv(wechat_path, skiprows=16)

        # 必需的列名
        required_columns = ['交易订单号', '交易分类', '交易对方', '对方账号', '商品说明', '收/支', '金额', '收/付款方式', '交易状态', '备注', '交易时间']

        # 确保 alipay 数据包含必要的列
        if all(col in alipay.columns for col in required_columns):
            # 选择 alipay.csv 中需要的列
            alipay_selected = alipay[required_columns]
        else:
            print("alipay.csv 文件缺少必要的列。")
            raise ValueError("alipay.csv 列不完整")

        # 重命名 wechat.csv 中的列以匹配 required_columns
        wechat_columns_map = {
            '交易单号': '交易订单号', '交易类型': '交易分类', '商品': '商品说明', '金额(元)': '金额', '支付方式': '收/付款方式', '当前状态': '交易状态'
        }

        # 重命名 wechat 的列
        wechat.rename(columns=wechat_columns_map, inplace=True)

        # 对 wechat.csv 进行列重命名和缺失列填充
        wechat_selected = pd.DataFrame(columns=required_columns)  # 创建一个空的 DataFrame，列名为 required_columns

        # 复制 wechat.csv 中已有的列
        for col in wechat.columns:
            if col in required_columns:
                wechat_selected[col] = wechat[col]

        # 对于 wechat.csv 中没有的列，填充空值（NaN）
        for col in required_columns:
            if col not in wechat_selected.columns:
                wechat_selected[col] = "/"

        # 去掉 '收/支' 列中值为 '不计收支' 的行
        alipay_selected = alipay_selected[alipay_selected['收/支'] != '不计收支']
        wechat_selected = wechat_selected[wechat_selected['收/支'] != '/']

        # 去掉 '金额' 列中的 '¥' 或 '￥' 符号，以及千位分隔符，并转换为浮点数
        wechat_selected['金额'] = wechat_selected['金额'].str.replace(r'[¥￥,]', '', regex=True).astype(float)

        # 为 alipay_selected 和 wechat_selected 添加「分类」列
        alipay_selected['分类'] = '支付宝'
        wechat_selected['分类'] = '微信'

        # 将 alipay 和 wechat 数据合并
        combined_data = pd.concat([alipay_selected, wechat_selected], ignore_index=True)

        # 将合并后的 DataFrame 保存为新的 CSV 文件
        combined_data.to_csv(output_path, index=False)
        print(f"文件已成功保存为 '{output_path}'")
    except FileNotFoundError:
        print("文件未找到，请检查文件路径。")
    except pd.errors.ParserError:
        print("读取 CSV 文件时出现问题，请检查文件格式或编码。")
    except Exception as e:
        print(f"发生错误：{e}")

def generate_markdown(csv_file, output_file):
    # 自动检测文件编码
    import chardet
    with open(csv_file, 'rb') as f:
        result = chardet.detect(f.read())
        encoding = result['encoding']

    # 读取文件
    data = pd.read_csv(csv_file, encoding=encoding)

    # 去除金额列中的符号和千分位逗号，转换为数值型
    data['金额'] = data['金额'].replace({'¥': '', ',': ''}, regex=True).astype(float)

    # 计算本月消费总额和收入总额
    total_expense = data[data['收/支'] == '支出']['金额'].sum()
    total_income = data[data['收/支'] == '收入']['金额'].sum()

    # 计算每个分类的金额
    expense_by_transaction = data[data['收/支'] == '支出'].groupby('交易分类')['金额'].sum().sort_values(ascending=False)
    income_by_transaction = data[data['收/支'] == '收入'].groupby('交易分类')['金额'].sum().sort_values(ascending=False)

    # 计算本月结余
    total_balance = total_income - total_expense

    # 打印调试信息
    print(f"Total Expense: {total_expense}")
    print(f"Total Income: {total_income}")
    print(f"Total Balance: {total_balance}")

    # 生成 markdown 内容
    markdown_content = f"**本月消费总额**：￥{total_expense:.2f}  |  **本月收入总额**：￥{total_income:.2f}  |  **本月结余**：￥{total_balance:.2f}\n\n"


    # 消费类型分析
    markdown_content += "## 消费类型分析 💸\n\n"
    markdown_content += "以下是各消费交易分类与消费金额：\n\n"
    markdown_content += "| 交易分类   | 消费金额   |\n"
    markdown_content += "| ---------- | ---------- |\n"
    for transaction, amount in expense_by_transaction.items():
        markdown_content += f"| {transaction} | ￥{amount:.2f} |\n"

    markdown_content += "\n### 每个交易分类的详细记录：\n"
    for transaction in expense_by_transaction.index:
        markdown_content += f"\n#### {transaction}消费记录 💳\n"
        transaction_data = data[(data['收/支'] == '支出') & (data['交易分类'] == transaction)]
        markdown_content += "| 交易对方  |  金额  | 分类 | 交易时间 |\n"
        markdown_content += "| -------- | ----- | ------ | -------- |\n"
        for _, row in transaction_data.iterrows():
            markdown_content += f"| {row['交易对方']} | ￥{row['金额']:.2f} | {row['分类']} | {row['交易时间']} |\n"

    # 收入类型分析
    markdown_content += "\n## 收入类型分析 💵\n\n"
    markdown_content += "以下是各收入交易分类与收入金额：\n\n"
    markdown_content += "| 交易分类   | 收入金额   |\n"
    markdown_content += "| ---------- | ---------- |\n"
    for transaction, amount in income_by_transaction.items():
        markdown_content += f"| {transaction} | ￥{amount:.2f} |\n"

    markdown_content += "\n### 每个交易分类的详细记录：\n"
    for transaction in income_by_transaction.index:
        markdown_content += f"\n#### {transaction}收入记录 💼\n"
        transaction_data = data[(data['收/支'] == '收入') & (data['交易分类'] == transaction)]
        markdown_content += "| 交易对方  |  金额  | 分类 | 交易时间 |\n"
        markdown_content += "| -------- | ----- | ------ | -------- |\n"
        for _, row in transaction_data.iterrows():
            markdown_content += f"| {row['交易对方']} | ￥{row['金额']:.2f} | {row['分类']} | {row['交易时间']} |\n"

    # 生成收支明细
    markdown_content += "\n## 收支明细\n"
    data_sorted = data.sort_values(by='交易时间')
    markdown_content += "| 交易分类 | 分类 | 收/支 | 金额 | 交易对方 | 商品说明 | 对方账号 | 收/付款方式 | 交易状态 | 备注 | 交易时间 |\n"
    markdown_content += "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"

    for _, row in data_sorted.iterrows():
        markdown_content += f"| {row['交易分类']} | {row['分类']} | {row['收/支']} | ￥{row['金额']:.2f} | {row['交易对方']} | {row['商品说明']} | {row['对方账号']} | {row['收/付款方式']} | {row['交易状态']} | {row['备注']} | {row['交易时间']} |\n"

    # 保存生成的 markdown 到文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)

    print(f"Markdown 已成功生成并保存为 '{output_file}'")

# 调用示例
# 调用函数读取 CSV 文件并生成新的 CSV 文件
read_csv('./bill/alipay_record_20250201_091025.csv', './bill/微信支付账单(20250101-20250201)——【解压密码可在微信支付公众号查看】.csv', './bill/合并账单.csv')
# 调用函数生成 Markdown 文件
generate_markdown('./bill/合并账单.csv', './bill/账单.md')
```
