import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve('.tmp/offline')
const PORT = 9391
fs.mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let chrome
const wd = setTimeout(() => { try { if (chrome) chrome.kill() } catch {} process.exit(1) }, 100000)

chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + path.resolve('.tmp/chrome-offline'),
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--window-size=390,844',
  'about:blank'], { stdio: 'ignore' })

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
const logs = []
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.consoleAPICalled') {
    logs.push(m.params.type + ': ' + (m.params.args || []).map(a => a.value || a.description || '').join(' '))
  }
  if (m.method === 'Runtime.exceptionThrown') {
    logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
  }
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) }
}
const raw = (method, params = {}, sid) => new Promise((res, rej) => {
  const i = id++
  const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout ' + method)) }, 20000)
  pending.set(i, { res: v => { clearTimeout(t); res(v) }, rej: e => { clearTimeout(t); rej(e) } })
  ws.send(JSON.stringify({ id: i, method, params, sessionId: sid }))
})

const t = await raw('Target.createTarget', { url: 'about:blank' })
const a = await raw('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = a.sessionId
await raw('Page.enable', {}, sid)
await raw('Runtime.enable', {}, sid)
await raw('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sid)

const ev = async e => { try { const r = await raw('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid); return r.result && r.result.value } catch (err) { return 'ERR' } }
const shot = async n => { const r = await raw('Page.captureScreenshot', { format: 'png' }, sid); fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.data, 'base64')); console.log('shot', n) }
const clickAny = t2 => ev('(()=>{const el=[...document.querySelectorAll("button,[role=button]")].find(x=>x.textContent.includes(' + JSON.stringify(t2) + '));if(!el)return "NF";el.click();return "OK"})()')
const clickSel = s => ev('(()=>{const el=document.querySelector(' + JSON.stringify(s) + ');if(!el)return "NF";el.click();return "OK"})()')

const FILE_URL = 'file:///D:/APP/Deepseek%20Harness/Work%20program/public%20space/%E6%89%93%E5%8C%85/%E9%A5%AE%E5%93%81%E8%AE%B0%E8%B4%A6%E6%9C%AC.html'

async function load() {
  await raw('Page.navigate', { url: FILE_URL }, sid)
  for (let i = 0; i < 30; i++) { await sleep(300); if (await ev("!!(document.querySelector('#root')&&document.querySelector('#root').children.length)")) break }
  await sleep(1200)
}

await load()
console.log('rendered:', await ev("document.querySelector('#root').children.length"))
console.log('protocol:', await ev('location.protocol'))
console.log('secureContext:', await ev('window.isSecureContext'))
console.log('localStorage:', await ev('(()=>{try{localStorage.setItem("t","1");localStorage.removeItem("t");return "ok"}catch(e){return e.name}})()'))
console.log('templates in storage:', await ev('(()=>{try{const s=JSON.parse(localStorage.getItem("drink-tracker-offline-v1")||"{}");return (s.templates||[]).length}catch(e){return "?"}})()'))
await shot('01-home')

console.log('open:', await clickSel('[aria-label="新增记录"]'))
await sleep(800)
console.log('pick:', await clickAny('生椰拿铁'))
await sleep(500)
console.log('record:', await clickAny('记录这杯'))
await sleep(1300)
console.log('today cups:', await ev('(()=>{const m=document.body.innerText.match(/今日\\s*(\\d+)\\s*杯/);return m?m[1]:"?"})()'))
await shot('02-recorded')

// 重启后是否还在
await load()
console.log('after reload cups:', await ev('(()=>{const m=document.body.innerText.match(/今日\\s*(\\d+)\\s*杯/);return m?m[1]:"?"})()'))
console.log('logs in storage:', await ev('(()=>{const s=JSON.parse(localStorage.getItem("drink-tracker-offline-v1")||"{}");return (s.logs||[]).length})()'))
await shot('03-after-reload')

console.log('console issues:', logs.slice(0, 6).join(' | ') || 'none')
clearTimeout(wd); ws.close(); chrome.kill()
console.log('DONE')
