// Generate a printable QR payload (offline-scannable) for a student ID badge.
export function buildQrPayload({ schoolName, classId, className, roll, name, result, gpa }) {
  const parts = [
    'STUDENT',
    `SCH:${schoolName || ''}`,
    `CLASS:${classId}${className ? '(' + className + ')' : ''}`,
    `ROLL:${roll}`,
    `NAME:${name || ''}`,
    `RESULT:${result || ''}`,
    `GPA:${gpa != null ? gpa : ''}`
  ]
  return parts.join('\n')
}

export async function renderQrDataUrl(payload, opts = {}) {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: opts.width || 220,
    color: { dark: '#000000', light: '#ffffff' }
  })
}
