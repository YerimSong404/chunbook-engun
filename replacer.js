const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace borderRadius values to be less round
    content = content.replace(/borderRadius: 100\b/g, 'borderRadius: 8');
    content = content.replace(/borderRadius: 20\b/g, 'borderRadius: 8');
    content = content.replace(/borderRadius: 12\b/g, 'borderRadius: 8');
    content = content.replace(/borderRadius: '16px'/g, "borderRadius: 12");
    content = content.replace(/borderRadius: '50%'/g, "borderRadius: 8");
    
    // Re-do css inside style blocks if missed (already handled globals.css)
    fs.writeFileSync(file, content);
});
console.log('Radius replaced successfully in src/');
