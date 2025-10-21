import { put } from '@vercel/blob'

export interface BlobUploadResult {
  url: string
  downloadUrl: string
  pathname: string
  contentType: string
  contentDisposition: string
  size: number
}

export interface FileUploadOptions {
  access?: 'public' | 'private'
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
}

/**
 * Upload a single file to Vercel Blob
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  options: FileUploadOptions = {}
): Promise<BlobUploadResult> {
  try {
    const blob = await put(filename, file, {
      access: options.access || 'public',
      addRandomSuffix: options.addRandomSuffix ?? true,
      cacheControlMaxAge: options.cacheControlMaxAge || 31536000, // 1 year
    })

    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      contentDisposition: blob.contentDisposition,
      size: blob.size,
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(`Failed to upload file: ${error}`)
  }
}

/**
 * Upload multiple files to Vercel Blob
 */
export async function uploadMultipleFiles(
  files: File[],
  options: FileUploadOptions = {}
): Promise<BlobUploadResult[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const filename = `${Date.now()}-${index}-${file.name}`
      return uploadFile(file, filename, options)
    })

    return Promise.all(uploadPromises)
  } catch (error) {
    console.error('Multiple files upload error:', error)
    throw new Error(`Failed to upload files: ${error}`)
  }
}

/**
 * Upload image files with validation
 */
export async function uploadImages(
  files: File[],
  options: FileUploadOptions = {}
): Promise<BlobUploadResult[]> {
  // Validate image files
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const invalidFiles = files.filter(file => !validImageTypes.includes(file.type))
  
  if (invalidFiles.length > 0) {
    throw new Error(`Invalid file types: ${invalidFiles.map(f => f.type).join(', ')}`)
  }

  // Check file sizes (max 10MB per image)
  const maxSize = 10 * 1024 * 1024 // 10MB
  const oversizedFiles = files.filter(file => file.size > maxSize)
  
  if (oversizedFiles.length > 0) {
    throw new Error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
  }

  return uploadMultipleFiles(files, options)
}

/**
 * Upload video files with validation
 */
export async function uploadVideos(
  files: File[],
  options: FileUploadOptions = {}
): Promise<BlobUploadResult[]> {
  // Validate video files
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  const invalidFiles = files.filter(file => !validVideoTypes.includes(file.type))
  
  if (invalidFiles.length > 0) {
    throw new Error(`Invalid file types: ${invalidFiles.map(f => f.type).join(', ')}`)
  }

  // Check file sizes (max 100MB per video)
  const maxSize = 100 * 1024 * 1024 // 100MB
  const oversizedFiles = files.filter(file => file.size > maxSize)
  
  if (oversizedFiles.length > 0) {
    throw new Error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
  }

  return uploadMultipleFiles(files, options)
}

/**
 * Upload general files with validation
 */
export async function uploadGeneralFiles(
  files: File[],
  options: FileUploadOptions = {}
): Promise<BlobUploadResult[]> {
  // Check file sizes (max 50MB per file)
  const maxSize = 50 * 1024 * 1024 // 50MB
  const oversizedFiles = files.filter(file => file.size > maxSize)
  
  if (oversizedFiles.length > 0) {
    throw new Error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
  }

  return uploadMultipleFiles(files, options)
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  return `${timestamp}-${randomSuffix}.${extension}`
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * Get file type category
 */
export function getFileCategory(file: File): 'image' | 'video' | 'document' | 'other' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document'
  return 'other'
}
