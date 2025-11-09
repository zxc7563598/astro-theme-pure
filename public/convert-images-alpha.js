// convert-images-alpha.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = './';
const outputDir = '../cover_clean';

// 创建输出目录
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 过滤出 PNG/JPEG 文件
const files = fs.readdirSync(inputDir).filter(f => /\.(png|jpe?g)$/i.test(f));

for (const file of files) {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file);

  const ext = path.extname(file).toLowerCase();

  // 初始化 Sharp
  let pipeline = sharp(inputPath)
    .withMetadata({ density: 72 }); // 保留 DPI，去掉 ICC profile

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ progressive: false }); // 普通 JPEG
  } else if (ext === '.png') {
    pipeline = pipeline.png({ progressive: false }); // 普通 PNG，保留 alpha
  }

  pipeline
    .toFile(outputPath)
}