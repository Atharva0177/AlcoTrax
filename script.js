const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = getFiles('src/pages').concat(getFiles('src/components'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/\[#D4FF59\]/g, 'brand-primary');
  content = content.replace(/\[#121212\]/g, 'surface-container');
  content = content.replace(/rounded-\[32px\]/g, 'rounded-lg');
  content = content.replace(/rounded-\[24px\]/g, 'rounded-md');
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
console.log('Finished');
