// Lip sync từ micro: đo RMS của micro mỗi frame và ghi vào tham số miệng.
// Dùng cùng cơ chế ghi đè của easy-live2d (setParameterValueById weight 1),
// và trả tham số lại cho model (weight 0) khi tắt.

export class MicLipSync {
  constructor({ gain = 6, noiseFloor = 0.01, smoothing = 0.5 } = {}) {
    this.gain = gain
    this.noiseFloor = noiseFloor
    this.smoothing = smoothing
    this._stream = null
    this._ctx = null
    this._raf = 0
    this._value = 0
  }

  get active() {
    return this._stream !== null
  }

  async start(sprite, parameterIds) {
    if (this.active)
      return
    this._stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this._ctx = new AudioContext()
    const analyser = this._ctx.createAnalyser()
    analyser.fftSize = 1024
    this._ctx.createMediaStreamSource(this._stream).connect(analyser)
    const samples = new Float32Array(analyser.fftSize)

    const tick = () => {
      analyser.getFloatTimeDomainData(samples)
      let sum = 0
      for (const s of samples)
        sum += s * s
      const rms = Math.sqrt(sum / samples.length)
      const target = Math.min(1, Math.max(0, (rms - this.noiseFloor) * this.gain))
      this._value = this._value * this.smoothing + target * (1 - this.smoothing)
      for (const id of parameterIds)
        sprite.setParameterValueById(id, this._value, 1)
      this._raf = requestAnimationFrame(tick)
    }
    tick()
    this._release = () => {
      for (const id of parameterIds)
        sprite.setParameterValueById(id, 0, 0)
    }
  }

  stop() {
    cancelAnimationFrame(this._raf)
    this._stream?.getTracks().forEach(t => t.stop())
    this._ctx?.close()
    this._release?.()
    this._stream = null
    this._ctx = null
    this._release = null
    this._value = 0
  }
}
