#!/usr/bin/env node

const { program } = require('commander');
const { renameWithRegex, renameWithSequence, renameWithExif } = require('./rename');
const { previewRename } = require('./preview');
const { version } = require('../package.json');

program
  .name('smart-rename')
  .description('一个强大的文件批量重命名 CLI 工具')
  .version(version);

program
  .command('regex')
  .description('使用正则表达式模式重命名文件')
  .option('-p, --pattern <pattern>', '匹配模式（正则表达式）')
  .option('-r, --replace <replace>', '替换文本（支持分组引用如 $1）')
  .option('-d, --dry-run', '预览重命名结果，不实际执行')
  .option('-v, --verbose', '显示详细信息')
  .argument('<files...>', '要重命名的文件')
  .action((files, options) => {
    if (options.dryRun) {
      previewRename(files, options, 'regex');
    } else {
      renameWithRegex(files, options);
    }
  });

program
  .command('sequence')
  .description('使用序号自增模式重命名文件')
  .option('-f, --format <format>', '命名格式，例如 "photo_001"')
  .option('-s, --start <number>', '起始序号', '1')
  .option('-w, --width <number>', '序号补零宽度', '3')
  .option('-d, --dry-run', '预览重命名结果，不实际执行')
  .option('-v, --verbose', '显示详细信息')
  .argument('<files...>', '要重命名的文件')
  .action((files, options) => {
    if (options.dryRun) {
      previewRename(files, options, 'sequence');
    } else {
      renameWithSequence(files, options);
    }
  });

program
  .command('exif')
  .description('基于 EXIF 元数据重命名图片文件')
  .option('-f, --format <format>', 'EXIF 日期格式，例如 "YYYYMMDD_HHmmss"')
  .option('-d, --dry-run', '预览重命名结果，不实际执行')
  .option('-v, --verbose', '显示详细信息')
  .argument('<files...>', '要重命名的文件')
  .action((files, options) => {
    if (options.dryRun) {
      previewRename(files, options, 'exif');
    } else {
      renameWithExif(files, options);
    }
  });

program.parse(process.argv);
