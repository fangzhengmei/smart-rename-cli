const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const { 
  renameWithRegex, 
  renameWithSequence, 
  generateRegexPreview, 
  generateSequencePreview 
} = require('../src/rename');

describe('文件重命名功能测试', () => {
  let tmpDir;
  
  beforeEach(() => {
    tmpDir = tmp.dirSync({ unsafeCleanup: true });
  });
  
  afterEach(() => {
    tmpDir.removeCallback();
  });
  
  describe('正则模式重命名', () => {
    test('应该使用正则表达式正确重命名文件', () => {
      const file1 = path.join(tmpDir.name, 'photo_2024_001.jpg');
      const file2 = path.join(tmpDir.name, 'photo_2024_002.jpg');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      
      renameWithRegex([file1, file2], {
        pattern: 'photo_2024_(\\d+)',
        replace: 'vacation_$1',
        verbose: false
      });
      
      expect(fs.existsSync(path.join(tmpDir.name, 'vacation_001.jpg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir.name, 'vacation_002.jpg'))).toBe(true);
      expect(fs.existsSync(file1)).toBe(false);
      expect(fs.existsSync(file2)).toBe(false);
    });
    
    test('应该保持不匹配正则的文件不变', () => {
      const file1 = path.join(tmpDir.name, 'photo_2024_001.jpg');
      const file2 = path.join(tmpDir.name, 'other_file.txt');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      
      renameWithRegex([file1, file2], {
        pattern: 'photo_2024_(\\d+)',
        replace: 'vacation_$1',
        verbose: false
      });
      
      expect(fs.existsSync(path.join(tmpDir.name, 'vacation_001.jpg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir.name, 'other_file.txt'))).toBe(true);
    });
    
    test('正则预览功能应该显示正确的重命名结果', () => {
      const file1 = path.join(tmpDir.name, 'photo_2024_001.jpg');
      const file2 = path.join(tmpDir.name, 'other_file.txt');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      
      const previews = generateRegexPreview([file1, file2], {
        pattern: 'photo_2024_(\\d+)',
        replace: 'vacation_$1'
      });
      
      expect(previews).toHaveLength(2);
      expect(previews[0].original).toBe('photo_2024_001.jpg');
      expect(previews[0].newName).toBe('vacation_001.jpg');
      expect(previews[0].status).toBe('changed');
      expect(previews[1].original).toBe('other_file.txt');
      expect(previews[1].newName).toBe('other_file.txt');
      expect(previews[1].status).toBe('unchanged');
    });
  });
  
  describe('序号自增重命名', () => {
    test('应该使用序号自增正确重命名文件', () => {
      const file1 = path.join(tmpDir.name, 'a.jpg');
      const file2 = path.join(tmpDir.name, 'b.jpg');
      const file3 = path.join(tmpDir.name, 'c.jpg');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      fs.writeFileSync(file3, 'test content 3');
      
      renameWithSequence([file1, file2, file3], {
        format: 'image_001',
        start: '1',
        width: '3',
        verbose: false
      });
      
      expect(fs.existsSync(path.join(tmpDir.name, 'image_001.jpg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir.name, 'image_002.jpg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir.name, 'image_003.jpg'))).toBe(true);
    });
    
    test('应该支持自定义起始序号', () => {
      const file1 = path.join(tmpDir.name, 'a.jpg');
      const file2 = path.join(tmpDir.name, 'b.jpg');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      
      renameWithSequence([file1, file2], {
        format: 'photo_005',
        start: '5',
        width: '3',
        verbose: false
      });
      
      expect(fs.existsSync(path.join(tmpDir.name, 'photo_005.jpg'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir.name, 'photo_006.jpg'))).toBe(true);
    });
    
    test('序号预览功能应该显示正确的重命名结果', () => {
      const file1 = path.join(tmpDir.name, 'a.jpg');
      const file2 = path.join(tmpDir.name, 'b.txt');
      
      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');
      
      const previews = generateSequencePreview([file1, file2], {
        format: 'doc_001',
        start: '10',
        width: '3'
      });
      
      expect(previews).toHaveLength(2);
      expect(previews[0].original).toBe('a.jpg');
      expect(previews[0].newName).toBe('doc_010.jpg');
      expect(previews[1].original).toBe('b.txt');
      expect(previews[1].newName).toBe('doc_011.txt');
    });
  });
  
  describe('错误处理', () => {
    test('应该正确处理不存在的文件', () => {
      const file1 = path.join(tmpDir.name, 'nonexistent.jpg');
      
      const previews = generateRegexPreview([file1], {
        pattern: 'test',
        replace: 'new'
      });
      
      expect(previews).toHaveLength(1);
      expect(previews[0].status).toBe('not_exist');
    });
    
    test('正则模式应该保持扩展名', () => {
      const file1 = path.join(tmpDir.name, 'image_001.png');
      
      fs.writeFileSync(file1, 'test content');
      
      renameWithRegex([file1], {
        pattern: 'image_(\\d+)',
        replace: 'photo_$1',
        verbose: false
      });
      
      expect(fs.existsSync(path.join(tmpDir.name, 'photo_001.png'))).toBe(true);
    });
  });
});
