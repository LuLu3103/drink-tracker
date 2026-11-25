import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve('.tmp/v20b')
const PORT = 9397
fs.mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let chrome
const wd = setTimeout(() => { try { if (chrome) chrome.kill() } catch {} process.exit(1) }, 100000)
chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.resolve('.tmp/chrome-v20'), '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) { await sleep(250); try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl } catch {} }
if (!wsUrl) { console.log('NO_CHROME'); process.exit(1) }
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) } }
const raw = (method, params = {}, sid) => new Promise((res, rej) => { const i = id++; const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout')) }, 20000); pending.set(i, { res: v => { clearTimeout(t); res(v) }, rej: e => { clearTimeout(t); rej(e) } }); ws.send(JSON.stringify({ id: i, method, params, sessionId: sid })) })
const t = await raw('Target.createTarget', { url: 'about:blank' })
const a = await raw('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = a.sessionId
await raw('Page.enable', {}, sid)
await raw('Runtime.enable', {}, sid)
await raw('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sid)
const ev = async e => { try { const r = await raw('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid); return r.result && r.result.value } catch { return 'ERR' } }
const shot = async n => { const r = await raw('Page.captureScreenshot', { format: 'png' }, sid); fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.data, 'base64')); console.log('shot', n) }
const clickAny = t2 => ev('(()=>{const el=[...document.querySelectorAll("button,[role=button]")].find(x=>x.textContent.includes(' + JSON.stringify(t2) + '));if(!el)return "NF";el.click();return "OK"})()')
const clickSel = s => ev('(()=>{const el=document.querySelector(' + JSON.stringify(s) + ');if(!el)return "NF";el.click();return "OK"})()')

await raw('Page.navigate', { url: 'http://127.0.0.1:4173/' }, sid)
for (let i = 0; i < 30; i++) { await sleep(250); if (await ev("!!(document.querySelector('#root')&&document.querySelector('#root').children.length)")) break }
await sleep(1400)

console.log('bedtime on home:', await ev('document.body.innerText.includes("22:00")'))

console.log('open:', await clickSel('[aria-label="新增记录"]'))
await sleep(700)
console.log('pick:', await clickAny('生椰拿铁'))
await sleep(500)
console.log('record:', await clickAny('记录这杯'))
await sleep(1300)

await ev('(()=>{const h=[...document.querySelectorAll("p")].find(x=>x.textContent.includes("饮品日历"));if(h)h.scrollIntoView({block:"center"});return "OK"})()')
await sleep(700)
await shot('01-calendar-with-drink')

console.log('today cell has date number:', await ev('(()=>{const cells=[...document.querySelectorAll("section .grid > div")];const withArt=cells.filter(c=>c.querySelector("svg"));if(!withArt.length)return "no art";const c=withArt[0];return "text=" + JSON.stringify(c.innerText.trim()) })()'))

console.log('settings tab:', await clickAny('设置'))
await sleep(700)
console.log('switch after reload:', await ev('document.querySelector("[role=switch]")?.getAttribute("aria-checked")'))
await shot('02-settings-persisted')
clearTimeout(wd); ws.close(); chrome.kill()
console.log('DONE')
