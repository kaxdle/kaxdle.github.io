import { Application } from 'pixi.js'
import { Config, Live2DSprite, LogLevel, Priority } from 'easy-live2d'
import { MicLipSync } from './mic-lipsync'

// Các ID tham số chuẩn của Live2D, dùng khi model không có file DisplayInfo (cdi3.json).
const STANDARD_PARAMS = [
  'ParamAngleX', 'ParamAngleY', 'ParamAngleZ',
  'ParamEyeLOpen', 'ParamEyeLSmile', 'ParamEyeROpen', 'ParamEyeRSmile',
  'ParamEyeBallX', 'ParamEyeBallY',
  'ParamBrowLY', 'ParamBrowRY',
  'ParamMouthForm', 'ParamMouthOpenY', 'ParamCheek',
  'ParamBodyAngleX', 'ParamBodyAngleY', 'ParamBodyAngleZ', 'ParamBreath',
]

const $ = id => document.getElementById(id)
const els = {
  stage: $('l2d-stage'),
  canvas: $('l2d-canvas'),
  status: $('l2d-status'),
  model: $('l2d-model'),
  follow: $('l2d-follow'),
  draggable: $('l2d-draggable'),
  motions: $('l2d-motions'),
  expressions: $('l2d-expressions'),
  voice: $('l2d-voice'),
  voiceStop: $('l2d-voice-stop'),
  mic: $('l2d-mic'),
  lipsyncNote: $('l2d-lipsync-note'),
  paramFilter: $('l2d-param-filter'),
  paramRelease: $('l2d-param-release'),
  params: $('l2d-params'),
  info: $('l2d-info'),
}
const pageConfig = JSON.parse($('l2d-config').textContent)

const state = {
  app: null,
  sprite: null,
  settings: null,
  lipSyncIds: [],
  loadToken: 0,
  voiceUrl: null,
  mic: new MicLipSync(),
}

// Cho Playwright/console kiểm tra trạng thái trang.
window.__live2d = state

function setStatus(text, kind = 'info') {
  els.status.textContent = text
  els.status.dataset.kind = kind
  els.status.hidden = kind === 'ok'
}

function showError(error) {
  console.error(error)
  setStatus(`Lỗi: ${error?.message ?? error}`, 'error')
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children)
  return node
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${url}`)
  return res.json()
}

function coreVersion() {
  const core = window.Live2DCubismCore
  if (!core)
    return null
  const fmt = v => `${(v >>> 24) & 0xFF}.${(v >>> 16) & 0xFF}.${v & 0xFFFF}`
  return {
    core: fmt(core.Version.csmGetVersion()),
    latestMoc: core.Version.csmGetLatestMocVersion(),
  }
}

function fitSprite() {
  if (!state.sprite)
    return
  state.sprite.width = els.stage.clientWidth
  state.sprite.height = els.stage.clientHeight
}

function disposeModel() {
  state.mic.stop()
  updateMicButton()
  if (state.sprite) {
    state.sprite.stopVoice()
    state.app.stage.removeChild(state.sprite)
    state.sprite.destroy()
    state.sprite = null
  }
  if (state.voiceUrl) {
    URL.revokeObjectURL(state.voiceUrl)
    state.voiceUrl = null
  }
  els.motions.replaceChildren(el('span', { className: 'l2d-muted', textContent: '—' }))
  els.expressions.replaceChildren(el('span', { className: 'l2d-muted', textContent: '—' }))
  els.params.replaceChildren()
  els.info.replaceChildren()
}

// easy-live2d 1.0.0 truyền cờ `_lipsync` của CubismUserModel vào vòng cập nhật,
// nhưng Cubism Framework 5-r.5 đã bỏ trường này nên cờ luôn là undefined và
// playVoice() phát tiếng mà miệng không cử động. Bật lại cờ khi nó chưa được định nghĩa;
// bản easy-live2d nào tự gán cờ thì dòng này không làm gì.
function enableVoiceLipSync(sprite) {
  const model = sprite._model
  if (model && model._lipsync === undefined)
    model._lipsync = true
}

// easy-live2d chỉ cho model nhìn theo khi đang giữ chuột, và khi bật kéo model thì
// việc kéo lại đặt hướng nhìn về 0. Trang tự cập nhật hướng nhìn theo vị trí con trỏ
// trên vùng sân khấu, qua cùng cơ chế "dragging" mà thư viện dùng (cộng thêm vào
// ParamAngleX/Y/Z, ParamBodyAngleX, ParamEyeBallX/Y sau motion).
function setGaze(x, y) {
  state.sprite?._model?.setDragging?.(x, y)
}

function followPointer(event) {
  if (!els.follow.checked || !state.sprite)
    return
  const rect = els.stage.getBoundingClientRect()
  const clamp = v => Math.max(-1, Math.min(1, v))
  setGaze(
    clamp(((event.clientX - rect.left) / rect.width) * 2 - 1),
    clamp(1 - ((event.clientY - rect.top) / rect.height) * 2),
  )
}

async function loadModel(url) {
  const token = ++state.loadToken
  disposeModel()
  setStatus(`Đang tải ${decodeURIComponent(url.split('/').pop())}…`)

  const sprite = new Live2DSprite({ modelPath: url, draggable: els.draggable.checked })
  state.sprite = sprite
  fitSprite()
  state.app.stage.addChild(sprite)
  sprite.onLive2D('hit', ({ hitAreaName }) => {
    const motions = sprite.getMotions()
    const tap = motions.filter(m => /tap/i.test(m.group))
    const pick = (tap.length ? tap : motions)[Math.floor(Math.random() * (tap.length || motions.length))]
    console.info(`[live2d] hit: ${hitAreaName}`)
    if (pick)
      sprite.startMotion({ group: pick.group, no: pick.no, priority: Priority.Normal }).catch(showError)
  })

  try {
    const [settings] = await Promise.all([fetchJson(url), sprite.ready])
    if (token !== state.loadToken)
      return
    enableVoiceLipSync(sprite)
    state.settings = settings
    state.lipSyncIds = (settings.Groups ?? []).find(g => g.Name === 'LipSync')?.Ids ?? []
    renderMotions(sprite)
    renderExpressions(sprite)
    await renderParams(sprite, url, settings)
    if (token !== state.loadToken)
      return
    renderInfo(sprite, settings)
    setStatus('Sẵn sàng', 'ok')
    const name = decodeURIComponent(url.split('/').slice(-2)[0])
    history.replaceState(null, '', `?model=${encodeURIComponent(name)}`)
  }
  catch (error) {
    if (token === state.loadToken)
      showError(error)
  }
}

function renderMotions(sprite) {
  const motions = sprite.getMotions()
  if (!motions.length)
    return
  const groups = new Map()
  for (const m of motions)
    groups.set(m.group, [...(groups.get(m.group) ?? []), m])
  els.motions.replaceChildren(...[...groups].map(([group, items]) => el('div', { className: 'l2d-group' }, [
    el('span', { className: 'l2d-group-name', textContent: group }),
    ...items.map(m => el('button', {
      type: 'button',
      textContent: `#${m.no}`,
      title: m.name,
      onclick: () => sprite.startMotion({ group: m.group, no: m.no, priority: Priority.Force }).catch(showError),
    })),
  ])))
}

function renderExpressions(sprite) {
  const expressions = sprite.getExpressions()
  if (!expressions.length) {
    els.expressions.replaceChildren(el('span', { className: 'l2d-muted', textContent: 'Model không có expression.' }))
    return
  }
  els.expressions.replaceChildren(
    ...expressions.map(e => el('button', {
      type: 'button',
      textContent: e.name,
      onclick: () => sprite.setExpression({ expressionId: e.name }),
    })),
    el('button', { type: 'button', textContent: 'Ngẫu nhiên', onclick: () => sprite.setRandomExpression() }),
  )
}

async function parameterList(sprite, url, settings) {
  let list = []
  const displayInfo = settings.FileReferences?.DisplayInfo
  if (displayInfo) {
    try {
      const cdi = await fetchJson(new URL(displayInfo, new URL(url, location.href)).href)
      list = (cdi.Parameters ?? []).map(p => ({ id: p.Id, name: p.Name || p.Id }))
    }
    catch (error) {
      console.warn('[live2d] Không đọc được DisplayInfo, dùng danh sách tham số chuẩn.', error)
    }
  }
  if (!list.length)
    list = STANDARD_PARAMS.map(id => ({ id, name: id }))
  return list
    .map(p => ({ ...p, range: sprite.getParameterValueRangeById(p.id) }))
    .filter(p => p.range)
}

async function renderParams(sprite, url, settings) {
  const params = await parameterList(sprite, url, settings)
  const rows = params.map(({ id, name, range }) => {
    const initial = Math.min(range.max, Math.max(range.min, 0))
    const slider = el('input', { type: 'range', min: range.min, max: range.max, step: (range.max - range.min) / 200, value: initial })
    const hold = el('input', { type: 'checkbox', title: 'Ghi đè mỗi frame' })
    const value = el('output', { textContent: initial.toFixed(2) })
    slider.addEventListener('input', () => {
      const v = Number(slider.value)
      value.textContent = v.toFixed(2)
      hold.checked = true
      sprite.setParameterValueById(id, v, 1)
    })
    hold.addEventListener('change', () => {
      // weight 0 = không ghi đè nữa: giá trị do motion/physics tính được giữ nguyên.
      sprite.setParameterValueById(id, Number(slider.value), hold.checked ? 1 : 0)
    })
    const row = el('div', { className: 'l2d-param', title: id }, [
      el('label', {}, [hold, el('span', { textContent: name === id ? id : `${name} · ${id}` })]),
      slider,
      value,
    ])
    row.dataset.search = `${id} ${name}`.toLowerCase()
    row.release = () => {
      if (hold.checked) {
        hold.checked = false
        sprite.setParameterValueById(id, Number(slider.value), 0)
      }
    }
    return row
  })
  els.params.replaceChildren(...rows)
  applyParamFilter()
  return params
}

function applyParamFilter() {
  const q = els.paramFilter.value.trim().toLowerCase()
  for (const row of els.params.children)
    row.hidden = q !== '' && !row.dataset.search.includes(q)
}

function renderInfo(sprite, settings) {
  const v = coreVersion()
  const canvas = sprite.getModelCanvasSize()
  const entries = [
    ['Cubism Core', v ? `${v.core} (moc tối đa v${v.latestMoc})` : 'không tải được'],
    ['Moc', settings.FileReferences?.Moc ?? '—'],
    ['Texture', String(settings.FileReferences?.Textures?.length ?? 0)],
    ['Canvas model', canvas ? `${canvas.width.toFixed(2)} × ${canvas.height.toFixed(2)} (ppu ${canvas.pixelsPerUnit})` : '—'],
    ['Motion', String(sprite.getMotions().length)],
    ['Expression', String(sprite.getExpressions().length)],
    ['Tham số điều khiển', String(els.params.children.length)],
    ['LipSync IDs', state.lipSyncIds.join(', ') || 'không có (playVoice sẽ không cử động miệng)'],
    ['Physics', settings.FileReferences?.Physics ? 'có' : 'không'],
  ]
  els.info.replaceChildren(...entries.flatMap(([k, val]) => [el('dt', { textContent: k }), el('dd', { textContent: val })]))
  els.lipsyncNote.textContent = state.lipSyncIds.length
    ? `Miệng: ${state.lipSyncIds.join(', ')}`
    : 'Model không khai báo nhóm LipSync; micro sẽ dùng ParamMouthOpenY.'
}

function updateMicButton() {
  els.mic.textContent = state.mic.active ? 'Tắt micro' : 'Bật micro'
}

function bindControls() {
  els.model?.addEventListener('change', () => loadModel(els.model.value))
  els.follow.addEventListener('change', () => {
    Config.MouseFollow = els.follow.checked
    if (!els.follow.checked)
      setGaze(0, 0)
  })
  els.draggable.addEventListener('change', () => {
    if (state.sprite)
      state.sprite.draggable = els.draggable.checked
  })
  window.addEventListener('pointermove', followPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => setGaze(0, 0))
  els.paramFilter.addEventListener('input', applyParamFilter)
  els.paramRelease.addEventListener('click', () => {
    for (const row of els.params.children)
      row.release?.()
  })
  els.voice.addEventListener('change', async () => {
    const file = els.voice.files?.[0]
    if (!file || !state.sprite)
      return
    if (state.voiceUrl)
      URL.revokeObjectURL(state.voiceUrl)
    state.voiceUrl = URL.createObjectURL(file)
    try {
      await state.sprite.playVoice({ voicePath: state.voiceUrl, immediate: true })
    }
    catch (error) {
      showError(error)
    }
  })
  els.voiceStop.addEventListener('click', () => state.sprite?.stopVoice())
  els.mic.addEventListener('click', async () => {
    if (state.mic.active) {
      state.mic.stop()
    }
    else if (state.sprite) {
      try {
        await state.mic.start(state.sprite, state.lipSyncIds.length ? state.lipSyncIds : ['ParamMouthOpenY'])
      }
      catch (error) {
        showError(error)
      }
    }
    updateMicButton()
  })
  new ResizeObserver(fitSprite).observe(els.stage)
}

async function main() {
  if (!window.Live2DCubismCore) {
    setStatus(`Không tải được Cubism Core từ ${pageConfig.coreUrl}. Chạy "npm run live2d:core -- --accept-license" hoặc kiểm tra LIVE2D_CORE_URL trong .env.`, 'error')
    return
  }
  if (window.Live2DCubismCore.MocVersion_53 === undefined) {
    setStatus(`Cubism Core tại ${pageConfig.coreUrl} quá cũ: easy-live2d cần Core của Cubism 5 SDK for Web R5. Chạy "npm run live2d:core -- --accept-license".`, 'error')
    return
  }
  Config.MotionGroupIdle = 'Idle'
  Config.MOCConsistencyValidationEnable = true
  Config.CubismLoggingLevel = LogLevel.LogLevel_Warning
  Config.MouseFollow = els.follow.checked

  state.app = new Application()
  await state.app.init({
    canvas: els.canvas,
    preference: 'webgl',
    backgroundAlpha: 0,
    resizeTo: els.stage,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  })
  bindControls()

  if (!pageConfig.selectedUrl) {
    setStatus('Chưa có model. Xem hướng dẫn ở cột bên phải.', 'error')
    return
  }
  await loadModel(pageConfig.selectedUrl)
}

main().catch(showError)
