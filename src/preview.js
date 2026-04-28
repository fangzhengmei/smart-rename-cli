const { generateRegexPreview, generateSequencePreview, generateExifPreview } = require('./rename');

function previewRename(files, options, mode) {
  let previews;
  
  switch (mode) {
    case 'regex':
      previews = generateRegexPreview(files, options);
      break;
    case 'sequence':
      previews = generateSequencePreview(files, options);
      break;
    case 'exif':
      previews = generateExifPreview(files, options);
      break;
    default:
      console.error('未知的重命名模式');
      process.exit(1);
  }
  
  console.log('\n=== 重命名预览 ===\n');
  
  let changedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;
  
  previews.forEach((preview, index) => {
    const statusIcon = getStatusIcon(preview.status);
    
    switch (preview.status) {
      case 'changed':
        changedCount++;
        console.log(`${statusIcon} [${index + 1}] 重命名:`);
        console.log(`    原文件名: ${preview.original}`);
        console.log(`    新文件名: ${preview.newName}`);
        console.log('');
        break;
      case 'unchanged':
        unchangedCount++;
        console.log(`${statusIcon} [${index + 1}] 跳过（无需修改）:`);
        console.log(`    文件名: ${preview.original}`);
        console.log('');
        break;
      case 'not_exist':
        errorCount++;
        console.log(`${statusIcon} [${index + 1}] 错误（文件不存在）:`);
        console.log(`    文件名: ${preview.original}`);
        console.log('');
        break;
      case 'no_exif':
        errorCount++;
        console.log(`${statusIcon} [${index + 1}] 错误（缺少 EXIF 数据）:`);
        console.log(`    文件名: ${preview.original}`);
        console.log('');
        break;
      case 'error':
        errorCount++;
        console.log(`${statusIcon} [${index + 1}] 错误（无法读取文件）:`);
        console.log(`    文件名: ${preview.original}`);
        console.log('');
        break;
    }
  });
  
  console.log('=== 统计信息 ===');
  console.log(`总文件数: ${previews.length}`);
  console.log(`将被重命名: ${changedCount}`);
  console.log(`无需修改: ${unchangedCount}`);
  console.log(`错误: ${errorCount}`);
  console.log('');
  console.log('提示: 移除 --dry-run 选项以实际执行重命名操作');
}

function getStatusIcon(status) {
  switch (status) {
    case 'changed':
      return '✓';
    case 'unchanged':
      return '•';
    case 'not_exist':
    case 'no_exif':
    case 'error':
      return '✗';
    default:
      return '?';
  }
}

module.exports = {
  previewRename
};
