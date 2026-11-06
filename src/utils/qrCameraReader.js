/**
 * Lector QR local. Prefiere BarcodeDetector cuando está disponible y utiliza jsQR
 * como alternativa en navegadores que no implementan esa API (p. ej. Chrome en
 * determinadas plataformas). No envía fotogramas ni credenciales a terceros.
 * Requiere `npm install jsqr@1.4.0` en el proyecto frontend completo.
 */
import jsQR from 'jsqr'

export async function createQrCameraReader() {
  if (typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function') {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats?.()
      if (!formats || formats.includes('qr_code')) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        return {
          async detect(video) {
            if (!video || video.readyState < 2) return null
            const values = await detector.detect(video)
            return values.find(item => typeof item.rawValue === 'string' && item.rawValue.length)?.rawValue || null
          },
        }
      }
    } catch {
      // La API puede existir, pero fallar al construirse o no admitir QR.
    }
  }

  if (typeof document === 'undefined') throw new Error('El escáner necesita un navegador con cámara.')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Este navegador no permite leer los fotogramas de la cámara.')
  let lastScanAt = 0
  return {
    async detect(video) {
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null
      // Reducir el tamaño y el número de fotogramas procesados para no saturar la UI.
      const now = performance.now()
      if (now - lastScanAt < 180) return null
      lastScanAt = now
      const scale = Math.min(1, 600 / Math.max(video.videoWidth, video.videoHeight))
      const width = Math.max(1, Math.floor(video.videoWidth * scale))
      const height = Math.max(1, Math.floor(video.videoHeight * scale))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      context.drawImage(video, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height)
      return jsQR(pixels.data, width, height, { inversionAttempts: 'dontInvert' })?.data || null
    },
  }
}
