#!/usr/bin/env node
// Tải model mẫu chính thức của Live2D (Hiyori, Haru, ...) từ repo CubismWebSamples
// vào public/assets/live2d/samples/<Tên>/ để test trang /live2d.
//
// Model mẫu thuộc "Live2D Free Material License"; bạn phải đồng ý license này
// trước khi tải, nên script yêu cầu cờ --accept-license.
//   npm run live2d:sample -- --accept-license            (mặc định: Hiyori Haru)
//   npm run live2d:sample -- --accept-license Mao Natori
//
// Thư mục samples/ nằm trong .gitignore: không commit model mẫu vào repo.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LICENSE_URL = 'https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html'
const BASE = 'https://raw.githubusercontent.com/Live2D/CubismWebSamples/develop/Samples/Resources'
const KNOWN = ['Haru', 'Hiyori', 'Mao', 'Mark', 'Natori', 'Rice', 'Ren', 'Wanko']

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const accepted = args.includes('--accept-license')
const names = args.filter(a => !a.startsWith('--'))
const models = names.length ? names : ['Hiyori', 'Haru']

if (!accepted) {
  console.error(`Model mẫu Live2D dùng "Live2D Free Material License":\n  ${LICENSE_URL}\n`
    + 'Đọc license rồi chạy lại với --accept-license, ví dụ:\n'
    + '  npm run live2d:sample -- --accept-license')
  process.exit(1)
}

async function download(url) {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function referencedFiles(model3) {
  const ref = model3.FileReferences ?? {}
  const files = [ref.Moc, ...(ref.Textures ?? []), ref.Physics, ref.Pose, ref.UserData, ref.DisplayInfo]
  for (const exp of ref.Expressions ?? [])
    files.push(exp.File)
  for (const group of Object.values(ref.Motions ?? {})) {
    for (const motion of group)
      files.push(motion.File, motion.Sound)
  }
  return [...new Set(files.filter(Boolean))]
}

for (const name of models) {
  if (!KNOWN.includes(name))
    console.warn(`Cảnh báo: "${name}" không nằm trong danh sách đã biết (${KNOWN.join(', ')}), vẫn thử tải.`)
  const outDir = join(root, 'public', 'assets', 'live2d', 'samples', name)
  const manifestName = `${name}.model3.json`
  const manifestBuf = await download(`${BASE}/${name}/${manifestName}`)
  const files = referencedFiles(JSON.parse(manifestBuf.toString('utf8')))
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, manifestName), manifestBuf)
  for (const rel of files) {
    const target = join(outDir, rel)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, await download(`${BASE}/${name}/${rel.split('/').map(encodeURIComponent).join('/')}`))
  }
  console.log(`✔ ${name}: ${files.length + 1} file -> public/assets/live2d/samples/${name}/`)
}
