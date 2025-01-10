const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

async function build() {
    // Create public directory
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
                .replace('{{title}}', attributes.title)
                .replace('{{content}}', html);
            
            // Write output file
            const outputPath = path.join(
                'public',
                file.replace('.md', '.html')
            );
            await fs.outputFile(outputPath, finalHtml);
        }
    }
}

build().catch(console.error); 