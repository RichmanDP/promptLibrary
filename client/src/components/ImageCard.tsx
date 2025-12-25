import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageType } from '../store/galleryStore'
import { getThumbnailUrl, truncateText, formatDate } from '../utils/helpers'
import { Tag, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCardProps {
  image: ImageType
  viewMode: 'grid' | 'list'
  onClick: () => void
}

const ImageCard = ({ image, viewMode, onClick }: ImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // 获取图片列表（优先使用 images 数组，否则使用主图）
  const imageList = image.images && image.images.length > 0 ? image.images : [{ path: image.path, filename: image.filename, originalName: image.originalName }]
  const hasMultipleImages = imageList.length > 1
  const currentImage = imageList[currentImageIndex]

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))
    setIsLoaded(false)
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))
    setIsLoaded(false)
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="glass glass-hover rounded-xl p-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
            {!isLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={getThumbnailUrl(currentImage.path)}
              alt={currentImage.originalName}
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* 多图指示器和切换按钮 */}
            {hasMultipleImages && (
              <>
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1}/{imageList.length}
                </div>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-1 rounded transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-1 rounded transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2 truncate">
              {image.originalName}
            </h3>
            {image.prompt && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {truncateText(image.prompt, 150)}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                <Tag size={12} />
                {image.category}
              </span>
              {image.model && (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                  <Sparkles size={12} />
                  {image.model}
                </span>
              )}
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-400 rounded">
                <Calendar size={12} />
                {formatDate(image.uploadDate)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass glass-hover rounded-xl overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden">
        {!isLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={getThumbnailUrl(currentImage.path)}
          alt={currentImage.originalName}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-110`}
        />
        
        {/* 多图切换按钮 */}
        {hasMultipleImages && (
          <>
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs z-10">
              {currentImageIndex + 1}/{imageList.length}
            </div>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-sm text-white line-clamp-3">
              {image.prompt || '暂无提示词'}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
            {image.category}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(image.uploadDate)}
          </span>
        </div>
        {image.model && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Sparkles size={12} />
            <span className="truncate">{image.model}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ImageCard
