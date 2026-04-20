import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  // Line 414 is index 413
  if (i === 413) {
    console.log("Line 414 before:", lines[i]);
    if (lines[i].includes('))}')) {
      lines[i] = lines[i].replace('))}', ');\n           })}');
      console.log("Line 414 after:", lines[i]);
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done!');
