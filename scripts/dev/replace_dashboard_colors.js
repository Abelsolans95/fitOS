const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      // Exclude layout.tsx because we already manually styled them
      if (file.endsWith('.tsx') && !file.endsWith('layout.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./apps/web/app/(dashboard)');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace solid dark gray with premium glassmorphism
  content = content.replace(/bg-\[\#12121A\]/g, 'bg-[#0E0E18]/60 backdrop-blur-xl');
  
  // Replace subtle hover backgrounds with a stronger one for better contrast against glass
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-white/[0.04]');
  
  // Replace pitch black containers (usually empty states or inner wrappers) with translucent white tone
  content = content.replace(/bg-\[\#0A0A0F\]/g, 'bg-white/[0.02]');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
    changed++;
  }
});
console.log('Total files changed: ' + changed);
