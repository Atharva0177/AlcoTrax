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
  content = content.replace(/rgba\(212,255,89,/g, 'rgba(87,241,219,'); // Mindful Teal RGB: 87, 241, 219
  content = content.replace(/text-black/g, 'text-brand-on-primary');
  content = content.replace(/bg-black/g, 'bg-surface-dim'); // or whatever replaces it... let's replace back to bg-surface-lowest since pure black is usually avoiding in navy themes
  content = content.replace(/bg-surface-dim\/10/g, 'bg-brand-on-primary/10');
  content = content.replace(/bg-surface-dim\/20/g, 'bg-brand-on-primary/20');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed text colors', file);
  }
});
console.log('Finished Colors 3');
