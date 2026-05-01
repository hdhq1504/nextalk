import { useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageLightboxProps {
  src: string
  onClose: () => void
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'>
      <div className='absolute inset-0' onClick={onClose} />

      <div className='relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col items-end gap-2'>
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            size='icon'
            onClick={handleDownload}
            className='rounded-full'
          >
            <Download className='h-5 w-5' />
          </Button>
          <Button
            variant='secondary'
            size='icon'
            onClick={onClose}
            className='rounded-full'
          >
            <X className='h-5 w-5' />
          </Button>
        </div>

        <img
          src={src}
          alt='Full size'
          className='max-h-[85vh] max-w-full rounded-lg object-contain'
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
