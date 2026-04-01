const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    res.writeHead(302, { 'Location': '/src/index.html' });
    res.end();
    return;
  }

  // Si la ruta no tiene extensión, asumir que es un directorio y buscar index.html
  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();

  function serve(fp) {
    const ct = MIME_TYPES[String(path.extname(fp)).toLowerCase()] || 'application/octet-stream';
    fs.readFile(fp, (error, content) => {
      if (error) {
        if (error.code === 'EISDIR') {
          res.writeHead(302, { 'Location': req.url + '/' });
          res.end();
        } else if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('404 Not Found', 'utf-8');
        } else {
          res.writeHead(500);
          res.end('Error: ' + error.code, 'utf-8');
        }
      } else {
        res.writeHead(200, { 'Content-Type': ct });
        res.end(content, 'utf-8');
      }
    });
  }

  // Sin extensión: probar .html primero, luego /index.html
  if (!extname) {
    const htmlPath = filePath + '.html';
    fs.access(htmlPath, fs.constants.F_OK, (err) => {
      serve(err ? filePath + '/index.html' : htmlPath);
    });
    return;
  }

  serve(filePath);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: el puerto ${PORT} ya está en uso.`);
    console.error('Cierra la instancia anterior o usa otro puerto.');
    process.exit(1);
  }
  throw err;
});

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  const { exec } = require('child_process');
  const url = `http://localhost:${PORT}/`;
  const cmd = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
  exec(cmd);
});
