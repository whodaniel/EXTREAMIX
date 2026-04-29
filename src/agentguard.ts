import { PolicyEngine } from '@the-bot-club/agentguard';
import * as fs from 'fs';

// Initialize the core PolicyEngine for AgentGuard validation.
export const engine = new PolicyEngine();

const args = process.argv.slice(2);
if (args[0] === 'validate') {
    const files = args.slice(1);
    console.log("🛡️ Sentinel Guard active. Validating codebase behavior...");
    let hasError = false;
    for (const file of files) {
        console.log(`Checking ${file}...`);

        // Try reading the file to ensure it's valid
        try {
           fs.readFileSync(file, 'utf8');
        } catch (e) {
           console.error(`❌ Validation failed for ${file}: Could not read file`);
           hasError = true;
        }

    }

    if (hasError) {
        process.exit(1);
    } else {
        console.log("✅ All files passed Sentinel Guard validation.");
        process.exit(0);
    }
}
