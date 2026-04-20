import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('const vals = Array.from(e.target.selectedOptions).map(option => option.value);', 'const vals = Array.from(e.target.selectedOptions).map((option: any) => option.value);');

// The original PulseTrack only had notes, let's fix that
// src/services/audioEngine.ts:
let audioContent = fs.readFileSync('src/services/audioEngine.ts', 'utf8');
audioContent = audioContent.replace(/notes\[i\]/g, 'steps[i]');
audioContent = audioContent.replace(/track\.notes/g, 'track.steps');
fs.writeFileSync('src/services/audioEngine.ts', audioContent);

content = content.replace(/track\.notes/g, 'track.steps');
content = content.replace(/notes: /g, 'steps: ');

fs.writeFileSync('src/App.tsx', content);

console.log('Fixed');
