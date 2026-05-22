const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes('bg-white')) {
                content = content.replace(/bg-white/g, 'bg-brand-light');
                modified = true;
            }
            if (content.includes('text-white')) {
                content = content.replace(/text-white/g, 'text-brand-light');
                modified = true;
            }
            if (fullPath.includes('Home.tsx') && content.includes('text-[#fff]')) {
                // In Home, some things are on bg-brand-accent, let's just make sure everything is consistent
                // or just leave text-[#fff] alone since it's only in home and I fixed home earlier.
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified', fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src'));
