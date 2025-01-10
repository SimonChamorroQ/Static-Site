const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Log incoming requests
    console.log(`Request: ${req.url}`);
    
    let filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
    
    // If the URL ends with a /, append index.html
    if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
    }
    // If no extension, assume it's a directory and add index.html
    else if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
    }

    console.log(`Looking for file: ${filePath}`);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                res.writeHead(500);
                res.end(`500 - Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

function tryPort(port) {
    return new Promise((resolve, reject) => {
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                reject(err);
            }
        });
        
        server.once('listening', () => {
            server.removeAllListeners('error');
            console.log(`Server running at http://localhost:${port}/`);
            resolve(true);
        });
        
        server.listen(port);
    });
}

async function startServer(startPort) {
    let port = startPort;
    while (port < startPort + 10) { // Try up to 10 ports
        try {
            const success = await tryPort(port);
            if (success) return;
            server.close();
        } catch (err) {
            console.error('Error starting server:', err);
            process.exit(1);
        }
        port++;
        console.log(`Port ${port-1} is busy, trying ${port}...`);
    }
    console.error('Could not find an available port');
    process.exit(1);
}

startServer(3000); 