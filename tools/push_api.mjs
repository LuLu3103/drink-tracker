import fs from 'node:fs'
import path from 'node:path'

const token = process.env.GH_TOKEN
const OWNER = 'LuLu3103'
const REPO = 'drink-tracker'
const BRANCH = 'main'
const ROOT = process.cwd()

const H = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'dsh-agent',
  'Content-Type': 'application/json',
}

async function api(method, p, body) {
  const res = await fetch('https://api.github.com' + p, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = { raw: text } }
  if (!res.ok) throw new Error(method + ' ' + p + ' -> ' + res.status + ' ' + text.slice(0, 300))
  return json
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.tmp'])
const SKIP_FILES = new Set(['tools/smoke.mjs', 'drink-tracker-site.zip'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.relative(ROOT, full).split(path.sep).join('/')
    const st = fs.statSync(full)
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue
      walk(full, out)
    } else {
      if (SKIP_FILES.has(rel)) continue
      if (rel.endsWith('.zip')) continue
      out.push(rel)
    }
  }
  return out
}

const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.css', '.html', '.md', '.yml', '.yaml', '.svg', '.txt', ''])
const BIN_EXT = new Set(['.png', '.ico', '.jpg', '.woff2'])

async function main() {
  const localFiles = walk(ROOT).sort()
  console.log('local files:', localFiles.length)

  const ref = await api('GET', '/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH)
  const headSha = ref.object.sha
  const headCommit = await api('GET', '/repos/' + OWNER + '/' + REPO + '/git/commits/' + headSha)
  const baseTreeSha = headCommit.tree.sha
  console.log('head:', headSha.slice(0, 7))

  const remoteTree = await api('GET', '/repos/' + OWNER + '/' + REPO + '/git/trees/' + baseTreeSha + '?recursive=1')
  const remoteBlobs = (remoteTree.tree || []).filter(n => n.type === 'blob').map(n => n.path)
  console.log('remote blobs:', remoteBlobs.length)

  // create blobs
  const entries = []
  let done = 0
  for (const rel of localFiles) {
    const buf = fs.readFileSync(path.join(ROOT, rel))
    const ext = path.extname(rel).toLowerCase()
    let body
    if (BIN_EXT.has(ext)) {
      body = { content: buf.toString('base64'), encoding: 'base64' }
    } else {
      body = { content: buf.toString('utf8'), encoding: 'utf-8' }
    }
    const blob = await api('POST', '/repos/' + OWNER + '/' + REPO + '/git/blobs', body)
    entries.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha })
    done++
    if (done % 10 === 0) console.log('  blobs:', done + '/' + localFiles.length)
  }

  // deletions
  const localSet = new Set(localFiles)
  const deletions = remoteBlobs.filter(p => !localSet.has(p))
  for (const p of deletions) {
    entries.push({ path: p, mode: '100644', type: 'blob', sha: null })
  }
  console.log('deletions:', deletions.length, deletions.slice(0, 8))

  const tree = await api('POST', '/repos/' + OWNER + '/' + REPO + '/git/trees', {
    base_tree: baseTreeSha,
    tree: entries,
  })
  console.log('new tree:', tree.sha.slice(0, 7))

  const commit = await api('POST', '/repos/' + OWNER + '/' + REPO + '/git/commits', {
    message: 'feat: 同步已验证版本（修复记录状态同步、UUID 兜底、PWA 配置、部署工作流）\n\n- 修复 addLog/updateLog/deleteLog/updateSettings 未同步内存状态\n- 修复日期按 UTC 归属导致跨日偏差\n- 新增 newId() 兼容非 HTTPS 环境\n- Service Worker 仅在安全上下文注册\n- ECharts 按需引入 + vendor 分包\n- 修正 GitHub Actions 工作流（去除不存在的 npm 缓存依赖）',
    tree: tree.sha,
    parents: [headSha],
  })
  console.log('commit:', commit.sha.slice(0, 7))

  await api('PATCH', '/repos/' + OWNER + '/' + REPO + '/git/refs/heads/' + BRANCH, {
    sha: commit.sha,
    force: false,
  })
  console.log('PUSHED', commit.sha)
}

main().catch(e => {
  console.error('FAILED:', e.message)
  process.exitCode = 1
})
