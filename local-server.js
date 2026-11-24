const http = require('http');

const port = 8080;
const host = '127.0.0.1';

const server = http.createServer((req, res) => {
  if (req.url === '/fast') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('fast');
    return;
  }

  if (req.url === '/slow') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('slow');
    }, 100);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(port, host, () => {
  console.log(`Local k6 test server: http://${host}:${port}`);
});
