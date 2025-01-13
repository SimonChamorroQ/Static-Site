const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Clean up URL and handle root path
    let filePath = req.url;
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Map URL to file in public directory
    filePath = path.join(__dirname, '../public', filePath);
    
    // Add index.html for directory paths
    if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
    }

    console.log('Request URL:', req.url);
    console.log('Looking for file:', filePath);
    
    // Determine content type
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.log('Error reading file:', err.code);
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Server Error');
            }
        } else {
            console.log('Successfully serving:', req.url);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
}); 