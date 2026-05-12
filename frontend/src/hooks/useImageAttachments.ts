import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export function useImageAttachments() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImageSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      const validFiles = files.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          return false
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(`${file.name} must be less than 5MB`)
          return false
        }

        return true
      })

      if (validFiles.length === 0) return

      setSelectedImages((prev) => [...prev, ...validFiles])
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          setImagePreviews((prev) => [
            ...prev,
            readerEvent.target?.result as string
          ])
        }
        reader.readAsDataURL(file)
      })

      resetFileInput()
    },
    [resetFileInput]
  )

  const removeImage = useCallback(
    (index: number) => {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index))
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
      resetFileInput()
    },
    [resetFileInput]
  )

  const clearImages = useCallback(() => {
    setSelectedImages([])
    setImagePreviews([])
    resetFileInput()
  }, [resetFileInput])

  return {
    fileInputRef,
    selectedImages,
    imagePreviews,
    handleImageSelect,
    removeImage,
    clearImages
  }
}
