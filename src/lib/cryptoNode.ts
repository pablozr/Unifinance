import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY não definida no ambiente')

const generateIV = () => randomBytes(16)

export const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex')
}

export const encrypt = (data: string): { encryptedData: string; iv: string } => {
  const iv = generateIV()
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  let encryptedData = cipher.update(data, 'utf8', 'hex')
  encryptedData += cipher.final('hex')
  return {
    encryptedData,
    iv: iv.toString('hex')
  }
}

export const decrypt = (encryptedData: string, iv: string): string => {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  )
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8')
  decryptedData += decipher.final('utf8')
  return decryptedData
}

export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex')
}

export const validateSensitiveData = (data: any): boolean => {
  if (!data) return false
  const maliciousPatterns = [
    /<script>/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ]
  if (typeof data === 'string') {
    return !maliciousPatterns.some(pattern => pattern.test(data))
  }
  return true
} 