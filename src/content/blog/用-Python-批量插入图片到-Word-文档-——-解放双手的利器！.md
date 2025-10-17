---
title: '用 Python 批量插入图片到 Word 文档 —— 解放双手的利器'
publishDate: '2024-12-10 15:24:45'
description: '使用 Python 脚本批量将图片插入 Word 文档，解决手动排版的烦恼。脚本实现每行 3 张图片，自动分页，适合整理大批量截图、报告生成等需求。代码简单实用，高效提升工作效率'
tags:
  - Python
language: '中文'
heroImage: { src: './cover/python.png', color: '#ffd543' }
draft: false
slug: 'cb4edc93'
---

最近在整理一堆截图资料，需要把几万张截图整理到 Word 文档中打印，实在是让人头大。

这些截图每行放 3 张，每页 6 张，这要是创建表格然后一张一张往里面放的话大概弄到猴年马月都搞不完。

于是决定写个小脚本来自动化处理这件事，以便节省时间摸鱼。

于是就有了这个小脚本，简单易懂，关键是能用！废话不多说，直接上代码，接着再讲讲实现逻辑。

```python
from docx import Document
from docx.shared import Inches
import os

# 图片文件夹路径
img_folder = "/user/path"  # 换成你存图片的路径
img_files = sorted([f for f in os.listdir(img_folder) if f.endswith(('.jpg', '.png'))])

# 创建 Word 文档
doc = Document()

# 设置图片宽度（单位是英寸）
image_width = 4.7 / 2.54  # 把 4.7 厘米转换成英寸，Word里是用英寸单位的

# 每行插入 3 张图片
images_per_row = 3

# 当前插入图片的计数器
count = 0

# 循环插入图片
for i, img in enumerate(img_files):
    # 如果是新的一行，就创建一行表格
    if count % images_per_row == 0:
        row = doc.add_table(rows=1, cols=images_per_row).rows[0]

    # 插入图片到当前表格单元格
    cell = row.cells[count % images_per_row]
    run = cell.paragraphs[0].add_run()
    run.add_picture(os.path.join(img_folder, img), width=Inches(image_width))

    # 图片计数器加 1
    count += 1

    # 每插入 6 张图片，就分页
    if (i + 1) % 6 == 0:
        doc.add_page_break()

# 保存文档
output_path = "/user/path/name.docx"  # 换成你的保存路径
doc.save(output_path)

print(f"文档已生成：{output_path}")

```

## 脚本逻辑

整个脚本可以简单分成几个步骤：

### 准备好图片

先把需要处理的图片放到一个文件夹里，比如 /user/path。脚本会扫描这个文件夹，只找扩展名是 .jpg 或 .png 的图片，还会自动按文件名排序，方便后续插入时保持顺序。

### 创建 Word 文档

我们用 **python-docx** 库来处理 Word 文档，开始时是空白的，后续所有内容都是动态插入的。

> 通过 `pip install python-docx` 安装库

### 循环插入图片

- **表格布局**：每行 3 张图片，用表格实现排版，每张图片放在一个表格单元格里。
- **图片宽度**：为保持美观，设置每张图片的宽度为 4.7 厘米（脚本里转成了英寸）。
- **分页**：每插入 6 张图片，自动插入一个分页符，让文档看起来更加规整。

### 保存文档

生成的 Word 文件会保存到指定路径，直接打开就能看到排版整齐的图片文档啦！

## 效果展示

完成后的文档每行有 3 张图片，整齐美观。6 张图片一页，自动分页，特别适合整理大批量截图。以下是文档排版的示意：

```markdown
---

## | 图 1 | 图 2 | 图 3 |

## | 图 4 | 图 5 | 图 6 |

## （分页）

## | 图 7 | 图 8 | 图 9 |
```

## 为什么要用这个脚本？

我之前也尝试过手动插入，但拖来拖去太费劲，还经常对不齐。有了这个脚本，直接运行一下，几万张图片轻松搞定。更重要的是，万一后续需求变了，比如每行插 4 张、分页规则不同，只需要稍微改动代码就行，效率提升不是一点点！
