const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix shadow #000 -> shadow var
            if (content.includes('#000]')) {
                content = content.replace(/#000\]/g, 'var(--brand-dark)]');
                modified = true;
            }
            
            // Fix shadow #ff3300 -> shadow var
            if (content.includes('#ff3300]')) {
                content = content.replace(/#ff3300\]/g, 'var(--brand-accent)]');
                modified = true;
            }

            // Fix hardcoded whites to brand-light
            if (content.includes('text-[#fff]')) {
                content = content.replace(/text-\[#fff\]/g, 'text-brand-light');
                modified = true;
            }
            if (content.includes('bg-[#fff]')) {
                content = content.replace(/bg-\[#fff\]/g, 'bg-brand-light');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Fixed dark mode colors!');
