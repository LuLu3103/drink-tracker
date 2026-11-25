import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist-offline')
const OUT_DIR = path.resolve(ROOT, '..', '打包')
const OUT_FILE = path.join(OUT_DIR, '饮品记账本.html')

function fail(msg) {
  console.error('BUILD_FAILED: ' + msg)
  process.exit(1)
}

const jsPath = path.join(DIST, 'app.js')
if (!fs.existsSync(jsPath)) fail('dist-offline/app.js 不存在，先运行离线构建')
const js = fs.readFileSync(jsPath, 'utf8')

let css = ''
const cssPath = path.join(DIST, 'app.css')
if (fs.existsSync(cssPath)) css = fs.readFileSync(cssPath, 'utf8')

// 内联到 <script> 里时，避免提前闭合
const safeJs = js.replace(/<\/script/gi, '<\\/script')

const html = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '<meta charset="UTF-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
  '<meta name="theme-color" content="#2563EB" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="饮品日记" />',
  '<title>饮品日记</title>',
  '<style>' + css + '</style>',
  '</head>',
  '<body>',
  '<div id="root"></div>',
  '<script>' + safeJs + '</script>',
  '</body>',
  '</html>',
  '',
].join('\n')

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_FILE, html, 'utf8')

const size = fs.statSync(OUT_FILE).size
console.log('单文件已生成: ' + OUT_FILE)
console.log('体积: ' + (size / 1024 / 1024).toFixed(2) + ' MB')
console.log('JS: ' + (js.length / 1024).toFixed(0) + ' KB, CSS: ' + (css.length / 1024).toFixed(0) + ' KB')
