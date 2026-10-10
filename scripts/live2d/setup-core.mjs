#!/usr/bin/env node
// Cài Cubism Core cho trang /live2d: tải gói chính thức "Cubism 5 SDK for Web R5",
// kiểm tra SHA-256 (cùng checksum mà easy-live2d 1.0.0 dùng), rồi chỉ giải nén
// thư mục Core/ vào public/assets/live2d/core/ (đã gitignore, không commit).
//
// Bản Core do Live2D host sẵn (cubism.live2d.com/sdk-web/cubismcore/...) là bản cũ,
// thiếu MocVersion_53, nên easy-live2d 1.x từ chối nạp. Vì vậy cần bước này.
//
//   npm run live2d:core -- --accept-license
//   npm run live2d:core -- --accept-license D:\Downloads\CubismSdkForWeb-5-r.5.zip   (zip tải tay)

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

const NAME = 'CubismSdkForWeb-5-r.5'
const URL_ZIP = `https://cubism.live2d.com/sdk-web/bin/${NAME}.zip`
const SHA256 = '67064a7fb1812cf502f5c4a03bfe12cc638c75a621bb4acf06bb28763df06ba0'
const LICENSES = [
  'Live2D Proprietary Software License (Cubism Core): https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html',
  'Live2D Open Software License (Framework, đi kèm easy-live2d): https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html',
  'Điều khoản SDK / Release License: https://www.live2d.com/en/sdk/license/',
]

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = join(root, 'public', 'assets', 'live2d', 'core')
const args = process.argv.slice(2)
const localZip = args.find(a => !a.startsWith('--'))

if (!args.includes('--accept-license')) {
  console.error(`Cubism Core là phần mềm độc quyền của Live2D. Đọc các điều khoản sau:\n  ${LICENSES.join('\n  ')}\n`
    + 'rồi chạy lại với --accept-license:\n  npm run live2d:core -- --accept-license')
  process.exit(1)
}

// Đọc file zip (đủ cho gói SDK: không mã hoá, không zip64), trả về Map tên -> Buffer cho các entry được lọc.
function extractZip(buf, keep) {
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054B50)
    eocd--
  if (eocd < 0)
    throw new Error('Không phải file zip hợp lệ')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const files = new Map()
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014B50)
      throw new Error('Central directory hỏng')
    const method = buf.readUInt16LE(p + 10)
    const size = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const local = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    p += 46 + nameLen + extraLen + commentLen
    if (name.endsWith('/') || !keep(name))
      continue
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const raw = buf.subarray(dataStart, dataStart + size)
    if (method === 0)
      files.set(name, raw)
    else if (method === 8)
      files.set(name, inflateRawSync(raw))
    else
      throw new Error(`Phương thức nén ${method} chưa hỗ trợ: ${name}`)
  }
  return files
}

let zip
if (localZip) {
  zip = await readFile(resolve(localZip))
}
else {
  console.log(`Đang tải ${URL_ZIP} …`)
  const res = await fetch(URL_ZIP)
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${URL_ZIP}`)
  zip = Buffer.from(await res.arrayBuffer())
}

const actual = createHash('sha256').update(zip).digest('hex')
if (actual !== SHA256)
  throw new Error(`Checksum không khớp (${actual}). Cần đúng gói ${NAME}.zip.`)

const prefix = `${NAME}/Core/`
const files = extractZip(zip, name => name.startsWith(prefix))
if (!files.size)
  throw new Error(`Không thấy ${prefix} trong zip`)
for (const [name, data] of files) {
  const target = join(outDir, name.slice(prefix.length))
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, data)
}
console.log(`✔ Đã cài ${files.size} file Cubism Core (${NAME}) vào public/assets/live2d/core/`)
