const fs = require('fs');
const path = require('path');
const exifParser = require('exif-parser');

function renameWithRegex(files, options) {
  const { pattern, replace, verbose } = options;
  
  if (!pattern || !replace) {
    console.error('错误: 必须提供 --pattern 和 --replace 选项');
    process.exit(1);
  }
  
  const regex = new RegExp(pattern);
  
  files.forEach((filePath) => {
    const fullPath = path.resolve(filePath);
    const dirName = path.dirname(fullPath);
    const baseName = path.basename(fullPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`警告: 文件不存在: ${filePath}`);
      return;
    }
    
    const newBaseName = baseName.replace(regex, replace);
    
    if (newBaseName === baseName) {
      if (verbose) {
        console.log(`跳过: ${baseName} (无需修改)`);
      }
      return;
    }
    
    const newPath = path.join(dirName, newBaseName);
    
    if (fs.existsSync(newPath)) {
      console.error(`警告: 目标文件已存在: ${newPath}`);
      return;
    }
    
    fs.renameSync(fullPath, newPath);
    
    if (verbose) {
      console.log(`重命名: ${baseName} -> ${newBaseName}`);
    }
  });
}

function renameWithSequence(files, options) {
  const { format, start, width, verbose } = options;
  
  if (!format) {
    console.error('错误: 必须提供 --format 选项');
    process.exit(1);
  }
  
  const startNum = parseInt(start, 10);
  const widthNum = parseInt(width, 10);
  
  if (isNaN(startNum) || startNum < 0) {
    console.error('错误: --start 必须是非负整数');
    process.exit(1);
  }
  
  if (isNaN(widthNum) || widthNum < 1) {
    console.error('错误: --width 必须是正整数');
    process.exit(1);
  }
  
  files.forEach((filePath, index) => {
    const fullPath = path.resolve(filePath);
    const dirName = path.dirname(fullPath);
    const extName = path.extname(fullPath);
    const baseName = path.basename(fullPath, extName);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`警告: 文件不存在: ${filePath}`);
      return;
    }
    
    const seqNum = startNum + index;
    const paddedNum = seqNum.toString().padStart(widthNum, '0');
    const newBaseName = format.replace(/\d+/, paddedNum);
    const newPath = path.join(dirName, newBaseName + extName);
    
    if (fs.existsSync(newPath)) {
      console.error(`警告: 目标文件已存在: ${newPath}`);
      return;
    }
    
    fs.renameSync(fullPath, newPath);
    
    if (verbose) {
      console.log(`重命名: ${baseName}${extName} -> ${newBaseName}${extName}`);
    }
  });
}

function renameWithExif(files, options) {
  const { format, verbose } = options;
  
  if (!format) {
    console.error('错误: 必须提供 --format 选项');
    process.exit(1);
  }
  
  files.forEach((filePath) => {
    const fullPath = path.resolve(filePath);
    const dirName = path.dirname(fullPath);
    const extName = path.extname(fullPath);
    const baseName = path.basename(fullPath, extName);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`警告: 文件不存在: ${filePath}`);
      return;
    }
    
    try {
      const buffer = fs.readFileSync(fullPath);
      const parser = exifParser.create(buffer);
      const exifData = parser.parse();
      
      if (!exifData.tags || !exifData.tags.DateTimeOriginal) {
        console.error(`警告: 文件缺少 DateTimeOriginal EXIF 数据: ${filePath}`);
        return;
      }
      
      const dateTime = new Date(exifData.tags.DateTimeOriginal * 1000);
      
      const formattedDate = format
        .replace('YYYY', dateTime.getFullYear().toString())
        .replace('MM', (dateTime.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', dateTime.getDate().toString().padStart(2, '0'))
        .replace('HH', dateTime.getHours().toString().padStart(2, '0'))
        .replace('mm', dateTime.getMinutes().toString().padStart(2, '0'))
        .replace('ss', dateTime.getSeconds().toString().padStart(2, '0'));
      
      const newPath = path.join(dirName, formattedDate + extName);
      
      if (fs.existsSync(newPath)) {
        console.error(`警告: 目标文件已存在: ${newPath}`);
        return;
      }
      
      fs.renameSync(fullPath, newPath);
      
      if (verbose) {
        console.log(`重命名: ${baseName}${extName} -> ${formattedDate}${extName}`);
      }
    } catch (error) {
      console.error(`警告: 无法读取 EXIF 数据: ${filePath}`);
      if (verbose) {
        console.error(error.message);
      }
    }
  });
}

function generateRegexPreview(files, options) {
  const { pattern, replace } = options;
  const regex = new RegExp(pattern);
  const previews = [];
  
  files.forEach((filePath) => {
    const fullPath = path.resolve(filePath);
    const baseName = path.basename(fullPath);
    
    if (!fs.existsSync(fullPath)) {
      previews.push({
        original: baseName,
        newName: null,
        status: 'not_exist'
      });
      return;
    }
    
    const newBaseName = baseName.replace(regex, replace);
    
    if (newBaseName === baseName) {
      previews.push({
        original: baseName,
        newName: baseName,
        status: 'unchanged'
      });
    } else {
      previews.push({
        original: baseName,
        newName: newBaseName,
        status: 'changed'
      });
    }
  });
  
  return previews;
}

function generateSequencePreview(files, options) {
  const { format, start, width } = options;
  const startNum = parseInt(start, 10);
  const widthNum = parseInt(width, 10);
  const previews = [];
  
  files.forEach((filePath, index) => {
    const fullPath = path.resolve(filePath);
    const extName = path.extname(fullPath);
    const baseName = path.basename(fullPath, extName);
    
    if (!fs.existsSync(fullPath)) {
      previews.push({
        original: baseName + extName,
        newName: null,
        status: 'not_exist'
      });
      return;
    }
    
    const seqNum = startNum + index;
    const paddedNum = seqNum.toString().padStart(widthNum, '0');
    const newBaseName = format.replace(/\d+/, paddedNum);
    
    previews.push({
      original: baseName + extName,
      newName: newBaseName + extName,
      status: 'changed'
    });
  });
  
  return previews;
}

function generateExifPreview(files, options) {
  const { format } = options;
  const previews = [];
  
  files.forEach((filePath) => {
    const fullPath = path.resolve(filePath);
    const extName = path.extname(fullPath);
    const baseName = path.basename(fullPath, extName);
    
    if (!fs.existsSync(fullPath)) {
      previews.push({
        original: baseName + extName,
        newName: null,
        status: 'not_exist'
      });
      return;
    }
    
    try {
      const buffer = fs.readFileSync(fullPath);
      const parser = exifParser.create(buffer);
      const exifData = parser.parse();
      
      if (!exifData.tags || !exifData.tags.DateTimeOriginal) {
        previews.push({
          original: baseName + extName,
          newName: null,
          status: 'no_exif'
        });
        return;
      }
      
      const dateTime = new Date(exifData.tags.DateTimeOriginal * 1000);
      
      const formattedDate = format
        .replace('YYYY', dateTime.getFullYear().toString())
        .replace('MM', (dateTime.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', dateTime.getDate().toString().padStart(2, '0'))
        .replace('HH', dateTime.getHours().toString().padStart(2, '0'))
        .replace('mm', dateTime.getMinutes().toString().padStart(2, '0'))
        .replace('ss', dateTime.getSeconds().toString().padStart(2, '0'));
      
      previews.push({
        original: baseName + extName,
        newName: formattedDate + extName,
        status: 'changed'
      });
    } catch (error) {
      previews.push({
        original: baseName + extName,
        newName: null,
        status: 'error'
      });
    }
  });
  
  return previews;
}

module.exports = {
  renameWithRegex,
  renameWithSequence,
  renameWithExif,
  generateRegexPreview,
  generateSequencePreview,
  generateExifPreview
};
