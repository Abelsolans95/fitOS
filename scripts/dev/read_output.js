const fs = require('fs');
const content = fs.readFileSync('output.txt', 'utf16le');
console.log(content);
