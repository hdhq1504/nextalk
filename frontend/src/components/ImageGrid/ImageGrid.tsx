import { cn } from '@/lib/utils'

interface ImageGridProps {
  imageUrls: string[]
  onImageClick?: (imageUrl: string) => void
}

export function ImageGrid({ imageUrls, onImageClick }: ImageGridProps) {
  const totalImages = imageUrls.length
  const visibleImages = imageUrls.slice(0, 5)
  const remainingCount = totalImages - 5

  const getGridClass = () => {
    if (totalImages === 1) return 'grid-cols-1'
    if (totalImages === 2) return 'grid-cols-2'
    if (totalImages === 3) return 'grid-cols-3'
    if (totalImages === 4) return 'grid-cols-4'
    return 'grid-cols-4'
  }

  return (
    <div className={cn('grid gap-0.5', getGridClass())}>
      {visibleImages.map((url, index) => (
        <div
          key={index}
          className={cn(
            'relative cursor-pointer overflow-hidden rounded-xl',
            totalImages === 1 ? 'max-w-[300px]' : 'aspect-square'
          )}
          onClick={() => onImageClick?.(url)}
        >
          <img
            src={url}
            alt={`Image ${index + 1}`}
            className={cn(
              'h-full w-full object-cover',
              totalImages === 1 ? 'max-h-[300px]' : 'h-full w-full'
            )}
          />
          {index === 4 && remainingCount > 0 && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
              <span className='text-2xl font-bold text-white'>
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
