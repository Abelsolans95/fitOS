const fs = require('fs');

const pathStr = 'packages/shared/src/anatomy/zones.ts';
let content = fs.readFileSync(pathStr, 'utf8');

function scalePath(path, cx, scaleX, scaleY = 1) {
  let segments = path.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!segments) return path;

  return segments.map(seg => {
    let cmd = seg.trim().charAt(0);
    let coordsStr = seg.trim().substring(1).trim();
    if (!coordsStr) return cmd; 

    let coords = coordsStr.split(/[,\\s]+/).filter(Boolean).map(Number);
    let newCoords = [];
    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
         let x = coords[i];
         let y = coords[i+1];
         let nx = cx + (x - cx) * scaleX;
         let ny = y * scaleY;
         newCoords.push(Math.round(nx) + ',' + Math.round(ny));
      } else {
         newCoords.push(coords[i]);
      }
    }
    return cmd + newCoords.join(' ');
  }).join(' ');
}

let parts = content.split('// ── BACK ZONES');
if (parts.length === 2) {
  let frontPart = parts[0];
  let backPart = parts[1];
  
  // FIXED REGEX:
  frontPart = frontPart.replace(/path:\\s*"([^"]+)"/g, (m, p1) => {
     let scaled = scalePath(p1, 200, 1.75);
     console.log('Old:', p1);
     console.log('New:', scaled);
     return 'path: "' + scaled + '"';
  });
  
  fs.writeFileSync(pathStr, frontPart + '// ── BACK ZONES' + backPart, 'utf8');
  console.log('Scaling done successfully.');
} else {
  console.log('Failed to Split.');
}
