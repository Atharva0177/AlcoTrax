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
  content = content.replace(/className="([^"]*)rounded-full([^"]*)"/g, (match, p1, p2) => {
    // Only replace if it's a "button" or "input" generally. We'll be lazy and do a regex.
    // Actually, rounded-full was used for everything! Let's just blindly replace rounded-full with rounded if it's a pill button.
    // Let's replace `px-[4,6,8] py-[1,2,4]` which denotes buttons.
    if (/px-\d+/.test(p1) || /px-\d+/.test(p2)) {
      return `className="${p1}rounded${p2}"`;
    }
    return match;
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed rounded-full', file);
  }
});
console.log('Finished radii');
