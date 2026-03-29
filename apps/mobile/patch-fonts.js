const fs = require('fs');
const path = require('path');

const DIR = './src/screens';
const REGEX_FONT_WEIGHT = /fontWeight:\s*["']([1-9]00|bold|normal)["']/g;

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      content = content.replace(REGEX_FONT_WEIGHT, (match, weight) => {
        changed = true;
        if (weight === '900' || weight === '800') return 'fontFamily: fonts.extraBold, letterSpacing: -0.5';
        if (weight === '700' || weight === 'bold') return 'fontFamily: fonts.bold';
        if (weight === '600' || weight === '500') return 'fontFamily: fonts.medium';
        return 'fontFamily: fonts.regular';
      });
      if (changed) {
        // We need to import fonts if 'fonts' is used and missing
        if (!content.includes('fonts.regular') && !content.includes('fonts } from') && !content.includes('fonts,') ) {
          content = content.replace(/import\s+\{([^}]*colors[^}]*)\}\s+from\s+['"].*?theme['"];/, (match, p1) => {
            return match.replace(p1, p1 + ', fonts');
          });
        }
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
processDir(DIR);
