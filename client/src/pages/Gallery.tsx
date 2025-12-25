import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Upload, Grid, List, Settings, Image as ImageIcon } from 'lucide-react'
import { useGalleryStore } from '../store/galleryStore'
import { api } from '../utils/api'
import Header from '../components/Header'
import ImageGrid from '../components/ImageGrid'
import ImageDetail from '../components/ImageDetail'
import UploadModal from '../components/UploadModal'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'

const Gallery = () => {
  const {
    images,
    categories,
    selectedCategory,
    searchQuery,
    isAdminMode,
    isPrivateMode,
    loading,
    setImages,
    setCategories,
    setLoading
  } = useGalleryStore()

  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 根据私密模式过滤图片
  const filteredImages = images.filter(img => {
    if (isPrivateMode) {
      // 私密模式下只显示私密图片
      return img.isPrivate === true
    } else {
      // 普通模式下只显示非私密图片
      return img.isPrivate !== true
    }
  })

  // 加载数据
  useEffect(() => {
    loadData()
  }, [selectedCategory, searchQuery])

  // 当页面获得焦点时重新加载分类（从设置页面返回时）
  useEffect(() => {
    const handleFocus = () => {
      api.getCategories().then(res => {
        if (res.success) {
          setCategories(res.categories)
        }
      })
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [setCategories])

  const loadData = async () => {
    setLoading(true)
    try {
      const [imagesRes, categoriesRes] = await Promise.all([
        api.getImages(selectedCategory, searchQuery),
        api.getCategories()
      ])

      if (imagesRes.success) {
        setImages(imagesRes.images)
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 打开上传对话框前刷新分类
  const handleOpenUpload = async () => {
    // 先刷新分类列表
    try {
      console.log('Gallery - 刷新分类列表...')
      const categoriesRes = await api.getCategories()
      console.log('Gallery - 获取到的分类:', categoriesRes)
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories)
        console.log('Gallery - 分类已更新到store')
      }
    } catch (error) {
      console.error('刷新分类失败:', error)
    }
    setShowUploadModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <Header onUploadClick={handleOpenUpload} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <FilterBar />

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between text-sm text-gray-400"
        >
          <div className="flex items-center gap-4">
            <span>共 {filteredImages.length} 张作品</span>
            {isPrivateMode && (
              <span className="text-purple-400 flex items-center gap-1">
                🔒 私密画廊
              </span>
            )}
            {searchQuery && (
              <span className="text-primary-400">
                搜索: "{searchQuery}"
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </motion.div>

        {/* Image Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredImages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-gray-500"
          >
            <ImageIcon size={64} className="mb-4 opacity-20" />
            <p className="text-xl mb-2">
              {isPrivateMode ? '暂无私密作品' : '暂无作品'}
            </p>
            <p className="text-sm">
              {isAdminMode 
                ? (isPrivateMode ? '在上传时勾选私密选项可添加私密作品' : '点击上传按钮添加第一张作品')
                : (isPrivateMode ? '管理员还未上传任何私密作品' : '管理员还未上传任何作品')
              }
            </p>
          </motion.div>
        ) : (
          <ImageGrid
            images={filteredImages}
            viewMode={viewMode}
            onImageClick={setSelectedImage}
          />
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedImage && (
          <ImageDetail
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onUpdate={loadData}
          />
        )}

        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Gallery
