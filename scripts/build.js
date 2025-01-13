const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');
require('dotenv').config();

// Configure marked to allow HTML
marked.setOptions({
    headerIds: false,
    mangle: false,
    html: true // This allows HTML in markdown
});

// Validate environment variables
const formId = process.env.CONVERTKIT_FORM_ID;
if (!formId) {
    console.error('Error: CONVERTKIT_FORM_ID is not set in .env file');
    process.exit(1);
}

async function build() {
    // Clean public directory first
    await fs.remove('public');
    await fs.ensureDir('public');
    
    // Copy static assets
    await fs.copy('src/styles', 'public/styles');
    await fs.copy('src/scripts', 'public/scripts');
    await fs.copy('src/images', 'public/images');
    
    // Copy custom index.html if it exists
    if (await fs.pathExists('src/index.html')) {
        await fs.copy('src/index.html', 'public/index.html');
    }
    
    // Build pages from markdown
    const contentDir = path.join(__dirname, '../src/content');
    const files = await fs.readdir(contentDir, { withFileTypes: true });
    
    for (const file of files) {
        if (file.isDirectory() && file.name === 'blog') {
            // Handle blog directory
            const blogDir = path.join(contentDir, 'blog');
            const blogFiles = await fs.readdir(blogDir);
            
            // Create blog directory in public
            await fs.ensureDir(path.join('public', 'blog'));
            
            // Process each blog file
            for (const blogFile of blogFiles) {
                if (blogFile.endsWith('.md')) {
                    const content = await fs.readFile(path.join(blogDir, blogFile), 'utf8');
                    const { attributes, body } = frontMatter(content);
                    const html = marked(body);
                    
                    // Get template
                    const template = await fs.readFile(
                        path.join(__dirname, `../src/templates/${attributes.template}.html`),
                        'utf8'
                    );
                    
                    // Get ConvertKit form template if needed
                    let convertKitForm = '';
                    if (attributes.template === 'blog-post') {
                        const formTemplate = await fs.readFile(
                            path.join(__dirname, '../src/templates/convertkit-form.html'),
                            'utf8'
                        );
                        convertKitForm = formTemplate.replace(/{{form_id}}/g, formId);
                    }
                    
                    // Replace template variables
                    const finalHtml = template
                        .replace(/{{title}}/g, attributes.title || 'Blog')
                        .replace(/{{content}}/g, html)
                        .replace(/{{date}}/g, attributes.date || '')
                        .replace(/{{author}}/g, attributes.author || '')
                        .replace(/{{convertkit}}/g, convertKitForm);
                    
                    // Write the file
                    const outputPath = blogFile === 'index.md' 
                        ? path.join('public', 'blog', 'index.html')
                        : path.join('public', 'blog', blogFile.replace('.md', ''), 'index.html');
                    
                    await fs.ensureDir(path.dirname(outputPath));
                    await fs.writeFile(outputPath, finalHtml);
                }
            }
        } else if (file.isFile() && file.name.endsWith('.md')) {
            // Handle regular pages
            const content = await fs.readFile(path.join(contentDir, file.name), 'utf8');
            const { attributes, body } = frontMatter(content);
            const html = marked(body);
            
            // Get template
            const template = await fs.readFile(
                path.join(__dirname, `../src/templates/${attributes.template || 'base'}.html`),
                'utf8'
            );
            
            // Replace template variables
            const finalHtml = template
                .replace(/{{title}}/g, attributes.title || 'My Site')
                .replace(/{{content}}/g, html);
            
            // Write the file
            const pageName = file.name === 'index.md' ? '' : file.name.replace('.md', '');
            const outputPath = path.join('public', pageName, 'index.html');
            await fs.ensureDir(path.dirname(outputPath));
            await fs.writeFile(outputPath, finalHtml);
        }
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
}); 