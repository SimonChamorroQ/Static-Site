const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

async function build() {
    // Clean public directory first
    await fs.remove('public');
    await fs.ensureDir('public');
    
    // Copy static assets
    await fs.copy('src/styles', 'public/styles');
    await fs.copy('src/scripts', 'public/scripts');
    
    // Build pages from markdown
    const contentDir = path.join(__dirname, '../src/content');
    const files = await fs.readdir(contentDir);
    
    for (const file of files) {
        if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(contentDir, file), 'utf8');
            const { attributes, body } = frontMatter(content);
            const html = marked(body);
            
            // Get template
            const template = await fs.readFile(
                path.join(__dirname, `../src/templates/${attributes.template}.html`),
                'utf8'
            );
            
            // Replace template variables
            const finalHtml = template
                .replace('{{title}}', attributes.title || 'My Site')
                .replace('{{content}}', html);
            
            // Handle file output
            if (file === 'index.md') {
                // Main index.html goes in root
                await fs.outputFile('public/index.html', finalHtml);
            } else {
                // All other pages go in their own directories
                const pageName = file.replace('.md', '');
                const outputPath = path.join('public', pageName, 'index.html');
                await fs.outputFile(outputPath, finalHtml);
            }
        }
    }
}

build().catch(console.error); 