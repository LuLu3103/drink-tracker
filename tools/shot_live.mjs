import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve('.tmp/live')
const PORT = 9337
const URL_ = 'https://lulu3103.github.io/drink-tracker/'
fs.mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let chrome

const wd = setTimeout(() => { try { if (chrome) chrome.kill() } catch {} process.exit(1) }, 100000)
chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + path.resolve('.tmp/chrome-live'),
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })

let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250)
  try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl } catch {}
}
if (!wsUrl) { console.log('NO_CHROME'); process.exit(1) }

const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) }
}
const raw = (method, params = {}, sid) => new Promise((res, rej) => {
  const i = id++
  const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout ' + method)) }, 15000)
  pending.set(i, { res: v => { clearTimeout(t); res(v) }, rej: e => { clearTimeout(t); rej(e) } })
  ws.send(JSON.stringify({ id: i, method, params, sessionId: sid }))
})

const t = await raw('Target.createTarget', { url: 'about:blank' })
const a = await raw('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = a.sessionId
await raw('Page.enable', {}, sid)
await raw('Runtime.enable', {}, sid)
await raw('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sid)

const ev = async expr => { try { const r = await raw('Runtime.evaluate', { expression: expr, returnByValue: true }, sid); return r.result && r.result.value } catch (e) { return 'ERR' } }
const shot = async name => { const r = await raw('Page.captureScreenshot', { format: 'png' }, sid); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')); console.log('shot', name) }

await raw('Page.navigate', { url: URL_ }, sid)
for (let i = 0; i < 40; i++) { await sleep(300); if (await ev("!!(document.querySelector('#root')&&document.querySelector('#root').children.length)")) break }
await sleep(1500)
await shot('live-01-home')

console.log('sw controlled:', await ev('!!navigator.serviceWorker && !!navigator.serviceWorker.controller'))
console.log('settings tab:', await ev('(()=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes("设置"));if(!b)return "NF";b.click();return "OK"})()'))
await sleep(900)
console.log('open modal:', await ev('(()=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes("就寝时间"));if(!b)return "NF";b.click();return "OK"})()'))
await sleep(900)
await shot('live-02-settings-modal')
console.log('hit-test:', await ev('(()=>{const s=[...document.querySelectorAll("div")].find(d=>String(d.className).includes("relative z-10")&&String(d.className).includes("rounded-t-3xl"));if(!s)return "NO_SHEET";const r=s.getBoundingClientRect();const el=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+60));return JSON.stringify({onTop:!!(el&&(s===el||s.contains(el))),z:getComputedStyle(s).zIndex})})()'))

clearTimeout(wd)
ws.close(); chrome.kill()
console.log('DONE')
