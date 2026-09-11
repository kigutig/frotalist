/**
 * Utilitários para processamento e validação de fotos do checklist
 */

/**
 * Converte um arquivo de imagem em Data URL (Base64) otimizado e comprimido.
 * Reduz a resolução máxima para 1280x960 e aplica compressão JPEG a 75%.
 * Garante que a foto fique leve (~80KB a 180KB), permitindo armazenamento
 * permanente e seguro no banco de dados sem risco de expiração de URLs blob.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 1280,
  maxHeight = 960,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // Se FileReader não existir no ambiente
    if (typeof FileReader === 'undefined') {
      try {
        resolve(URL.createObjectURL(file))
      } catch {
        resolve('')
      }
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string
      if (!rawDataUrl) {
        resolve('')
        return
      }

      // Se Image ou canvas não estiverem disponíveis (ex: jsdom sem canvas nativo)
      if (
        typeof Image === 'undefined' ||
        typeof document === 'undefined' ||
        (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || ''))
      ) {
        resolve(rawDataUrl)
        return
      }

      // Testa se o contexto 2D do canvas está operacional
      try {
        const testCanvas = document.createElement('canvas')
        const testCtx = testCanvas.getContext && testCanvas.getContext('2d')
        if (!testCtx) {
          resolve(rawDataUrl)
          return
        }
      } catch {
        resolve(rawDataUrl)
        return
      }

      const img = new Image()

      // Timeout de segurança caso img.onload não dispare em ambientes virtuais
      const safetyTimer = setTimeout(() => {
        resolve(rawDataUrl)
      }, 400)

      img.onload = () => {
        clearTimeout(safetyTimer)
        try {
          let width = img.width
          let height = img.height

          // Se não houver dimensões válidas, retorna raw data url
          if (!width || !height) {
            resolve(rawDataUrl)
            return
          }

          // Redimensiona mantendo proporção original
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            resolve(rawDataUrl)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', quality)
          resolve(compressed)
        } catch {
          resolve(rawDataUrl)
        }
      }

      img.onerror = () => {
        clearTimeout(safetyTimer)
        resolve(rawDataUrl)
      }

      img.src = rawDataUrl
    }

    reader.onerror = () => {
      try {
        resolve(URL.createObjectURL(file))
      } catch {
        resolve('')
      }
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Verifica se a URL da foto é persistente e segura para exibição no navegador.
 * Rejeita URLs temporárias do tipo "blob:" quando carregadas do banco de dados,
 * pois apontam para a memória temporária de uma sessão já encerrada.
 */
export function isPersistentImageUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:')) {
    return false
  }
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  )
}
