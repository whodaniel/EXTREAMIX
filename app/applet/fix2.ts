import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const vals = Array.from(e.target.selectedOptions')) {
     lines[i] = lines[i].replace('const vals = Array.from(e.target.selectedOptions, option => option.value);', 'const vals = Array.from(e.target.selectedOptions).map(option => option.value);');
  }
}

content = lines.join('\n');

// Also fix standard TS missing 'PulseTrack' issue
content = `interface PulseTrack {
  id: string;
  name: string;
  active: boolean;
  notes: boolean[]; // 16 step sequencer
}\n` + content;

fs.writeFileSync('src/App.tsx', content);

let audioContent = fs.readFileSync('src/services/audioEngine.ts', 'utf8');
audioContent = `interface PulseTrack {
  id: string;
  name: string;
  active: boolean;
  notes: boolean[];
}\n` + audioContent;

fs.writeFileSync('src/services/audioEngine.ts', audioContent);
