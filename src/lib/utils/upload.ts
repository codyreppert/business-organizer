/**
 * Shared upload security utilities.
 * Validates file size, extension, and MIME type before writing to disk.
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED: Record<string, string[]> = {
  'image/jpeg':    ['jpg', 'jpeg'],
  'image/png':     ['png'],
  'image/gif':     ['gif'],
  'image/webp':    ['webp'],
  'image/heic':    ['heic'],
  'image/heif':    ['heif'],
  'application/pdf': ['pdf'],
}

export function validateUpload(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`
  }

  const clientMime = file.type.toLowerCase()
  const allowedExts = ALLOWED[clientMime]
  if (!allowedExts) {
    return `File type "${clientMime}" is not allowed`
  }

  const originalName = file.name ?? ''
  const ext = originalName.split('.').pop()?.toLowerCase() ?? ''
  if (!allowedExts.includes(ext)) {
    return `File extension ".${ext}" does not match declared type "${clientMime}"`
  }

  return null // valid
}

/**
 * Returns a safe filename: only the basename, alphanumeric + dot/dash/underscore.
 * Prepends a timestamp to avoid collisions.
 */
export function sanitizeFilename(originalName: string): string {
  const base = originalName.split(/[\\/]/).pop() ?? 'upload'
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_')
  return `${Date.now()}-${safe}`
}
