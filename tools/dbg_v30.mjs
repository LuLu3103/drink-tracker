import { spawn } from 'node:child_process'
import path from 'node:path'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9403
const sleep = ms => new Promise(r => setTimeout(r, ms))
let chrome
const wd = setTimeout(() => { try { if (chrome) chrome.kill() } catch {} process.exit(1) }, 80000)
chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + path.resolve('.tmp/chrome-dbg'), '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) { await sleep(250); try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl } catch {} }
if (!wsUrl) { console.log('NO_CHROME'); process.exit(1) }
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 1
const pending = new Map()
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.consoleAPICalled') {
    const txt = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ')
    if (txt.includes('INITDB_DEBUG')) console.log('LOG>', txt)
  }
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error('x')) : p.res(m.result) }
}
const raw = (method, params = {}, sid) => new Promise((res, rej) => { const i = id++; const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout')) }, 20000); pending.set(i, { res: v => { clearTimeout(t); res(v) }, rej: e => { clearTimeout(t); rej(e) } }); ws.send(JSON.stringify({ id: i, method, params, sessionId: sid })) })
const t = await raw('Target.createTarget', { url: 'about:blank' })
const a = await raw('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = a.sessionId
await raw('Page.enable', {}, sid)
await raw('Runtime.enable', {}, sid)
const ev = async e => { try { const r = await raw('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid); return r.result && r.result.value } catch { return 'ERR' } }

async function load() {
  await raw('Page.navigate', { url: 'http://127.0.0.1:4173/' }, sid)
  for (let i = 0; i < 30; i++) { await sleep(250); if (await ev("!!(document.querySelector('#root')&&document.querySelector('#root').children.length)")) break }
  await sleep(1000)
}

await load()
console.log('inject:', await ev(`new Promise(res=>{const r=indexedDB.open('DrinkTrackerDB');r.onsuccess=()=>{const db=r.result;const tx=db.transaction('settings','readwrite');const st=tx.objectStore('settings');const g=st.get(1);g.onsuccess=()=>{const row=g.result;delete row.calorieMigrated;row.dailyCalorieTargetKcal=2000;st.put(row).onsuccess=()=>res('OK')}}}).then(()=>new Promise(r=>setTimeout(r,300)))`))
await load()
console.log('final:', await ev('new Promise(res=>{const r=indexedDB.open("DrinkTrackerDB");r.onsuccess=()=>{const g=r.result.transaction("settings").objectStore("settings").get(1);g.onsuccess=()=>res(JSON.stringify(g.result))}})'))
clearTimeout(wd); ws.close(); chrome.kill()
console.log('DONE')
