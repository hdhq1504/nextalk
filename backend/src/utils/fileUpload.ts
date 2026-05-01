import multer from 'multer'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.memoryStorage()

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
})

export const MAX_IMAGE_SIZE = MAX_FILE_SIZE
export const ALLOWED_IMAGE_TYPES = ALLOWED_MIME_TYPES
