import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config.js'
import { getCallableErrorMessage } from './callableErrors.js'
import { normalizeOcrResponse } from './responseValidation.js'

const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_UPLOAD_BYTES = 7 * 1024 * 1024
const MAX_IMAGE_SIDE = 2600

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const imageUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('사진을 열지 못했어요.'))
    }
    image.src = imageUrl
  })
}

function createUploadCanvas(image) {
  const scale = Math.min(
    1,
    MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
  )
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('이 브라우저에서는 사진을 처리할 수 없어요. 다른 브라우저를 사용해 주세요.')
  }

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('사진을 변환하지 못했어요.'))
      },
      'image/jpeg',
      quality,
    )
  })
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('사진을 읽지 못했어요.'))
    reader.readAsDataURL(blob)
  })
}

async function extractDocumentText(file, onProgress = () => {}) {
  if (!functions) {
    throw new Error('Firebase 연결 정보를 확인해 주세요.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('사진 파일을 선택해 주세요.')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('사진이 너무 커요. 10MB보다 작은 사진을 선택해 주세요.')
  }

  onProgress({ percent: 10, label: '사진 크기를 맞추고 있어요' })
  const image = await loadImage(file)
  const canvas = createUploadCanvas(image)
  let jpeg = await canvasToJpeg(canvas, 0.9)

  if (jpeg.size > MAX_UPLOAD_BYTES) {
    jpeg = await canvasToJpeg(canvas, 0.72)
  }

  if (jpeg.size > MAX_UPLOAD_BYTES) {
    throw new Error('사진 용량을 줄이지 못했어요. 더 작은 사진을 선택해 주세요.')
  }

  onProgress({ percent: 35, label: '사진을 안전하게 보내고 있어요' })
  const imageBase64 = await blobToBase64(jpeg)
  const callVisionOcr = httpsCallable(functions, 'extractDocumentText')

  onProgress({ percent: 60, label: '사진에서 한글을 찾고 있어요' })

  try {
    const result = await callVisionOcr({
      imageBase64,
      mimeType: 'image/jpeg',
    })

    onProgress({ percent: 100, label: '글자를 다 읽었어요' })
    return normalizeOcrResponse(result.data)
  } catch (error) {
    if (!error.code && error.message) throw error

    throw new Error(getCallableErrorMessage(error, {
      messages: {
        'resource-exhausted': '이번 달 무료 OCR 사용량을 모두 사용했어요.',
        'failed-precondition': 'OCR 설정을 확인해 주세요.',
      },
      fallback: '사진을 읽는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    }))
  }
}

export { extractDocumentText }
