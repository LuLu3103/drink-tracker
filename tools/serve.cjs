const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let filePath = path.join(ROOT, urlPath)

    if (urlPath === '/' || !path.extname(urlPath)) {
      filePath = path.join(ROOT, 'index.html')
    }

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden')
      return
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found')
        return
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': urlPath.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      })
      res.end(data)
    })
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log('preview listening on http://127.0.0.1:' + PORT)
  })
