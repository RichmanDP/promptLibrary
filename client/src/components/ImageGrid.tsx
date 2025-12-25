import { motion } from 'framer-motion'
import { Image } from '../store/galleryStore'
import ImageCard from './ImageCard'

interface ImageGridProps {
  images: Image[]
  viewMode: 'grid' | 'list'
  onImageClick: (image: Image) => void
}

const ImageGrid = ({ images, viewMode, onImageClick }: ImageGridProps) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ImageCard image={image} viewMode="list" onClick={() => onImageClick(image)} />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <ImageCard image={image} viewMode="grid" onClick={() => onImageClick(image)} />
        </motion.div>
      ))}
    </div>
  )
}

export default ImageGrid
