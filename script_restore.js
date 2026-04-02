const fs = require('fs');

const origPath = 'restore_zones.js';
const fullPath = 'packages/shared/src/anatomy/zones.ts';

let origContent = fs.readFileSync(origPath, 'utf8');
let fullContent = fs.readFileSync(fullPath, 'utf8');

// Match everything from 'const FRONT_ZONES: MuscleZone\\[\\] = \\[' up to '];\\n' in orig
let matchOrig = origContent.match(/export const FRONT_ZONES[\s\S]+?\];/);
let newArr = matchOrig[0].replace('export ', ''); // remove export

let matchFull = fullContent.match(/const FRONT_ZONES: MuscleZone\[\] = \[[\s\S]+?\];/);
if (matchFull) {
  fullContent = fullContent.replace(matchFull[0], newArr);
  fs.writeFileSync(fullPath, fullContent, 'utf8');
  console.log('Restored correctly.');
} else {
  console.log('Failed to restore.');
}
