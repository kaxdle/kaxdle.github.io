#!/usr/bin/env node
// Kiểm tra nhanh một model Cubism trước khi mở trên trang /live2d:
// file tham chiếu có đủ không, phiên bản .moc3, kích thước texture, các nhóm
// Idle / LipSync / EyeBlink mà trang dùng tới.
//
//   npm run live2d:check -- public/assets/live2d/models/Dania
//   npm run live2d:check -- path/to/Dania.model3.json

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const MOC_VERSIONS = { 1: '3.0', 2: '3.3', 3: '4.0', 4: '4.2', 5: '5.0', 6: '5.3' }
const LATEST_SUPPORTED = 6 // Core của Cubism 5 SDK for Web R5 đọc tới moc 5.3

const target = process.argv[2]
if (!target) {
  console.error('Cách dùng: npm run live2d:check -- <thư mục model | file .model3.json>')
  process.exit(1)
}

let manifestPath = resolve(target)
if (statSync(manifestPath).isDirectory()) {
  const found = readdirSync(manifestPath).filter(f => f.endsWith('.model3.json'))
  if (found.length !== 1) {
    console.error(`Cần đúng 1 file *.model3.json trong ${manifestPath}, thấy ${found.length}.`)
    process.exit(1)
  }
  manifestPath = join(manifestPath, found[0])
}
const dir = dirname(manifestPath)
const model = JSON.parse(readFileSync(manifestPath, 'utf8'))
const ref = model.FileReferences ?? {}
const errors = []
const warnings = []
const ok = []

const files = [ref.Moc, ...(ref.Textures ?? []), ref.Physics, ref.Pose, ref.UserData, ref.DisplayInfo,
  ...(ref.Expressions ?? []).map(e => e.File),
  ...Object.values(ref.Motions ?? {}).flat().flatMap(m => [m.File, m.Sound])].filter(Boolean)
const missing = files.filter(f => !existsSync(join(dir, f)))
if (missing.length)
  errors.push(`Thiếu ${missing.length} file: ${missing.join(', ')}`)
else
  ok.push(`Đủ ${files.length} file được model3.json tham chiếu`)

if (ref.Moc && existsSync(join(dir, ref.Moc))) {
  const head = readFileSync(join(dir, ref.Moc)).subarray(0, 5)
  if (head.toString('latin1', 0, 4) !== 'MOC3') {
    errors.push(`${ref.Moc} không có header MOC3`)
  }
  else {
    const v = head[4]
    const label = MOC_VERSIONS[v] ?? `không rõ (${v})`
    if (v > LATEST_SUPPORTED)
      errors.push(`.moc3 phiên bản ${label}: Core R5 chỉ đọc tới 5.3. Xuất lại với target ≤ 5.3.`)
    else
      ok.push(`.moc3 phiên bản ${label}`)
  }
}

for (const tex of ref.Textures ?? []) {
  const path = join(dir, tex)
  if (!existsSync(path))
    continue
  const png = readFileSync(path)
  if (png.toString('latin1', 1, 4) !== 'PNG') {
    warnings.push(`${tex} không phải PNG`)
    continue
  }
  const w = png.readUInt32BE(16)
  const h = png.readUInt32BE(20)
  const note = w > 4096 || h > 4096 ? ' (lớn hơn 4096, nhiều máy di động không nạp được)' : ''
  ;(note ? warnings : ok).push(`Texture ${tex}: ${w}×${h}${note}`)
}

const groups = Object.fromEntries((model.Groups ?? []).map(g => [g.Name, g.Ids ?? []]))
const motions = ref.Motions ?? {}
const idleGroup = Object.keys(motions).find(g => /idle/i.test(g))
if (idleGroup && motions[idleGroup].length)
  ok.push(`Nhóm motion idle "${idleGroup}": ${motions[idleGroup].length} motion`)
else
  warnings.push(`Không có nhóm motion nào tên chứa "idle" (có: ${Object.keys(motions).join(', ') || 'không có'}). Model sẽ đứng yên khi rảnh.`)
if (groups.LipSync?.length)
  ok.push(`LipSync: ${groups.LipSync.join(', ')}`)
else
  warnings.push('Không có nhóm LipSync: playVoice() sẽ không cử động miệng.')
if (groups.EyeBlink?.length)
  ok.push(`EyeBlink: ${groups.EyeBlink.join(', ')}`)
else
  warnings.push('Không có nhóm EyeBlink: model sẽ không tự chớp mắt.')
ok.push(`Expression: ${(ref.Expressions ?? []).length}, Physics: ${ref.Physics ? 'có' : 'không'}, DisplayInfo: ${ref.DisplayInfo ? 'có' : 'không'}`)

console.log(`Model: ${basename(manifestPath)}`)
for (const m of ok) console.log(`  ✔ ${m}`)
for (const m of warnings) console.log(`  ⚠ ${m}`)
for (const m of errors) console.log(`  ✖ ${m}`)
process.exit(errors.length ? 1 : 0)
