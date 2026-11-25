import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve('.tmp/v20')
const PORT = 9395
fs.mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let chrome
const wd = setTimeout(() => { try { if (chrome) chrome.kill() } catch {} process.exit(1) }, 110000)
chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.resolve('.tmp/chrome-v20'), '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) { await sleep(250); try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl } catch {} }
if (!wsUrl) { console.log('NO_CHROME'); process.exit(1) }
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) } }
const raw = (method, params = {}, sid) => new Promise((res, rej) => { const i = id++; const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout ' + method)) }, 20000); pending.set(i, { res: v => { clearTimeout(t); res(v) }, rej: e => { clearTimeout(t); rej(e) } }); ws.send(JSON.stringify({ id: i, method, params, sessionId: sid })) })
const t = await raw('Target.createTarget', { url: 'about:blank' })
const a = await raw('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = a.sessionId
await raw('Page.enable', {}, sid)
await raw('Runtime.enable', {}, sid)
await raw('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sid)
const ev = async e => { try { const r = await raw('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid); if (r.exceptionDetails) return 'EXC:' + r.exceptionDetails.text; return r.result && r.result.value } catch (err) { return 'ERR' } }
const shot = async n => { const r = await raw('Page.captureScreenshot', { format: 'png' }, sid); fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.data, 'base64')); console.log('shot', n) }
const clickAny = t2 => ev('(()=>{const el=[...document.querySelectorAll("button,[role=button]")].find(x=>x.textContent.includes(' + JSON.stringify(t2) + '));if(!el)return "NF";el.click();return "OK"})()')
const setInput = (sel, v) => ev('(()=>{const el=document.querySelector(' + JSON.stringify(sel) + ');if(!el)return "NF";const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");d.set.call(el,' + JSON.stringify(v) + ');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return "OK"})()')
const dumpSettings = () => ev('new Promise(res=>{const r=indexedDB.open("DrinkTrackerDB");r.onsuccess=()=>{const db=r.result;const tx=db.transaction("settings","readonly");const g=tx.objectStore("settings").getAll();g.onsuccess=()=>res(JSON.stringify(g.result))};r.onerror=()=>res("OPEN_ERR")})')

async function load() {
  await raw('Page.navigate', { url: 'http://127.0.0.1:4173/' }, sid)
  for (let i = 0; i < 30; i++) { await sleep(250); if (await ev("!!(document.querySelector('#root')&&document.querySelector('#root').children.length)")) break }
  await sleep(1300)
}

await load()
console.log('db before:', await dumpSettings())

console.log('settings tab:', await clickAny('设置'))
await sleep(700)
console.log('open modal:', await clickAny('就寝时间'))
await sleep(700)
console.log('set time:', await setInput('input[type=time]', '22:00'))
await sleep(300)
console.log('save:', await clickAny('保存设置'))
await sleep(900)
console.log('db after save:', await dumpSettings())
await shot('01-settings')

// 打开自动备份开关
console.log('toggle backup:', await ev('(()=>{const s=document.querySelector("[role=switch]");if(!s)return "NF";s.click();return "OK"})()'))
await sleep(700)
console.log('switch checked before reload:', await ev('document.querySelector("[role=switch]")?.getAttribute("aria-checked")'))

await load()
console.log('after reload bedtime shown:', await ev('(()=>{const m=document.body.innerText.match(/就寝\s*(\d{2}:\d{2})/);return m?m[1]:"?"})()'))
console.log('after reload toggle:', await ev('(()=>{const s=document.querySelector("[role=switch]");return s?s.getAttribute("aria-checked"):"?"})()'))
console.log('db after reload:', await dumpSettings())

console.log('timeline tab:', await clickAny('时间线'))
await sleep(700)
await shot('02-timeline')
console.log('timeline tabs:', await ev('[...document.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(t=>["48 小时","一周内","全部"].includes(t)).join(",")'))

await clickAny('记录')
await sleep(600)
await shot('03-home-calendar')

clearTimeout(wd); ws.close(); chrome.kill()
console.log('DONE')
